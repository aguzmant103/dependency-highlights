import { Octokit } from "@octokit/rest";
import PQueue from "p-queue";
import { LRUCache } from "lru-cache";
import { GitHubSearchResponse, GitHubSearchCodeItem, GitHubContent, GitHubCommit, GitHubRepository } from "./github-types";

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // Primary rate limits
  MAX_REQUESTS_PER_HOUR: process.env.GITHUB_TOKEN ? 5000 : 60,
  MAX_SEARCH_REQUESTS_PER_MINUTE: 30,
  
  // Secondary rate limits
  MAX_CONCURRENT_REQUESTS: 100,
  POINTS_PER_MINUTE: 900,
  
  // Queue configuration
  QUEUE_INTERVAL: 1000, // 1 second
  QUEUE_MAX_RETRIES: 3,
  
  // Cache configuration
  CACHE_MAX_SIZE: 1000,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  ETAG_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
};

// Types for rate limit tracking
interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

interface RateLimits {
  core: RateLimitInfo;
  search: RateLimitInfo;
  graphql?: RateLimitInfo;
}

interface RequestOptions {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  priority?: number;
}

interface RequestFunction {
  (options: RequestOptions): Promise<Response>;
}

interface GitHubError extends Error {
  status?: number;
  response?: {
    headers?: {
      'x-ratelimit-reset'?: string;
    };
  };
}

// Cache configurations
const responseCache = new LRUCache<string, object>({
  max: RATE_LIMIT_CONFIG.CACHE_MAX_SIZE,
  ttl: RATE_LIMIT_CONFIG.CACHE_TTL,
});

const etagCache = new LRUCache<string, { etag: string; data: unknown }>({
  max: RATE_LIMIT_CONFIG.CACHE_MAX_SIZE,
  ttl: RATE_LIMIT_CONFIG.ETAG_CACHE_TTL,
});

// Queue for rate limiting
const queue = new PQueue({
  interval: RATE_LIMIT_CONFIG.QUEUE_INTERVAL,
  intervalCap: 1, // Process one request per interval
  concurrency: RATE_LIMIT_CONFIG.MAX_CONCURRENT_REQUESTS,
});

// Point system for secondary rate limits
const POINT_VALUES = {
  GET: 1,
  HEAD: 1,
  OPTIONS: 1,
  POST: 5,
  PATCH: 5,
  PUT: 5,
  DELETE: 5,
} as const;

type GitHubEndpoints = {
  'GET /search/code': GitHubSearchResponse<GitHubSearchCodeItem>;
  'GET /repos/{owner}/{repo}': GitHubRepository;
  'GET /repos/{owner}/{repo}/contents/{path}': GitHubContent;
  'GET /repos/{owner}/{repo}/commits': GitHubCommit[];
};

class GitHubRateLimiter {
  private octokit: Octokit;
  private pointsUsed: number = 0;
  private pointsResetTime: number = Date.now() + 60000;
  private currentRateLimits: RateLimits | null = null;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token,
      request: {
        hook: this.rateLimitHook.bind(this),
      },
    });
  }

  private async rateLimitHook(request: RequestFunction, options: RequestOptions) {
    // Check and update points
    await this.updatePointsUsed(options.method);
    
    // Check if we have cached ETag
    const cacheKey = this.getCacheKey(options);
    const cachedResponse = etagCache.get(cacheKey);
    
    if (cachedResponse) {
      options.headers = {
        ...options.headers,
        'If-None-Match': cachedResponse.etag,
      };
    }
    
    return request(options);
  }

  private async updatePointsUsed(method: string) {
    const now = Date.now();
    
    // Reset points if minute has passed
    if (now > this.pointsResetTime) {
      this.pointsUsed = 0;
      this.pointsResetTime = now + 60000;
    }
    
    // Add points for this request
    const points = POINT_VALUES[method as keyof typeof POINT_VALUES] || 1;
    this.pointsUsed += points;
    
    // Check if we're over the limit
    if (this.pointsUsed >= RATE_LIMIT_CONFIG.POINTS_PER_MINUTE) {
      const waitTime = this.pointsResetTime - now;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.pointsUsed = points;
      this.pointsResetTime = Date.now() + 60000;
    }
  }

  private getCacheKey(options: RequestOptions): string {
    return `${options.method}:${options.url}:${JSON.stringify(options.params)}`;
  }

  private async handleRateLimitError(error: GitHubError, retryCount: number): Promise<boolean> {
    if (error.status === 403 || error.status === 429) {
      const resetTime = error.response?.headers?.['x-ratelimit-reset'];
      if (resetTime) {
        const waitTime = (Number(resetTime) * 1000) - Date.now();
        if (waitTime > 0 && retryCount < RATE_LIMIT_CONFIG.QUEUE_MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return true;
        }
      }
    }
    return false;
  }

  public async request<T extends keyof GitHubEndpoints>(
    method: T extends `${infer M} ${string}` ? M : never,
    url: T extends `${string} ${infer U}` ? U : never,
    options: Omit<RequestOptions, 'method' | 'url'> = {}
  ): Promise<GitHubEndpoints[T]> {
    const cacheKey = this.getCacheKey({ method, url, ...options });
    
    // Check response cache first
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse as GitHubEndpoints[T];
    }

    // Queue the request
    return queue.add(
      async (): Promise<GitHubEndpoints[T]> => {
        let retryCount = 0;
        while (retryCount < RATE_LIMIT_CONFIG.QUEUE_MAX_RETRIES) {
          try {
            // Handle search endpoint specially
            if (url === '/search/code') {
              if (!options.params?.q) {
                throw new Error('Search endpoint requires a query parameter (q)');
              }
              // For search, spread the params directly into the request
              const response = await this.octokit.request({
                method,
                url,
                ...options.params,
              });
              return response.data as GitHubEndpoints[T];
            }

            // For non-search endpoints, format URL parameters
            const formattedUrl = url.replace(/\{([^}]+)\}/g, (_, key) => {
              const value = options.params?.[key];
              if (value === undefined) {
                throw new Error(`Missing required parameter: ${key}`);
              }
              return encodeURIComponent(String(value));
            });

            const response = await this.octokit.request({
              method,
              url: formattedUrl,
              ...options,
              params: undefined, // Remove params as they're now in the URL
            });

            // Cache the response and ETag
            const etag = response.headers?.etag;
            if (etag) {
              etagCache.set(cacheKey, { etag, data: response.data });
            }
            responseCache.set(cacheKey, response.data);

            return response.data as GitHubEndpoints[T];
          } catch (error) {
            const shouldRetry = await this.handleRateLimitError(error as GitHubError, retryCount);
            if (!shouldRetry) {
              throw error;
            }
            retryCount++;
          }
        }
        throw new Error('Max retries exceeded');
      },
      { priority: options.priority || 0 }
    ) as Promise<GitHubEndpoints[T]>;
  }

  public async getRateLimits(): Promise<RateLimits> {
    try {
      const response = await this.octokit.rateLimit.get();
      this.currentRateLimits = response.data.resources;
      return this.currentRateLimits;
    } catch (error) {
      console.error('Failed to fetch rate limits:', error);
      throw error;
    }
  }

  public async hasRemainingRequests(): Promise<boolean> {
    const limits = await this.getRateLimits();
    return (
      limits.core.remaining > 0 &&
      limits.search.remaining > 0
    );
  }

  public getRequestQueue(): PQueue {
    return queue;
  }
}

// Create and export a singleton instance
export const githubRateLimiter = new GitHubRateLimiter(
  process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN
);

// Export types and constants
export type { RateLimitInfo, RateLimits };
export { RATE_LIMIT_CONFIG, POINT_VALUES }; 