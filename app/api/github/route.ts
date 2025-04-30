import { NextResponse } from 'next/server';
import { githubRateLimiter } from '@/lib/github-rate-limit';
import { GitHubSearchCodeItem, PackageJson } from '@/lib/github-types';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// Simple in-memory cache (consider using Redis or similar for production)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const action = searchParams.get('action');

    if (!owner || !repo || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `${action}:${owner}/${repo}`;
    const cached = cache.get(cacheKey);

    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Check rate limit before proceeding
    const hasRemaining = await githubRateLimiter.hasRemainingRequests();
    if (!hasRemaining) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    let data;
    switch (action) {
      case 'packages':
        // Get package.json files
        const packageFiles = await githubRateLimiter.request<'GET /search/code'>(
          'GET',
          '/search/code',
          {
            params: {
              q: `repo:${owner}/${repo} filename:package.json path:/packages/`,
              per_page: 100,
            }
          }
        );

        // Get contents of each package.json
        const packages = await Promise.all(
          packageFiles.items.map(async (file: GitHubSearchCodeItem) => {
            const content = await githubRateLimiter.request<'GET /repos/{owner}/{repo}/contents/{path}'>(
              'GET',
              `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(file.path)}` as '/repos/{owner}/{repo}/contents/{path}',
              {}
            );

            if ('content' in content) {
              const packageJson = JSON.parse(
                Buffer.from(content.content, 'base64').toString()
              ) as PackageJson;
              
              return packageJson.name ? {
                name: packageJson.name,
                path: file.path,
                type: 'npm' as const,
              } : null;
            }
            return null;
          })
        );

        data = packages.filter(Boolean);
        break;

      case 'dependents':
        const package_name = searchParams.get('package');
        if (!package_name) {
          return NextResponse.json(
            { error: 'Missing package name' },
            { status: 400 }
          );
        }

        const searchResults = await githubRateLimiter.request<'GET /search/code'>(
          'GET',
          '/search/code',
          {
            params: {
              q: `"${package_name}": filename:package.json`,
              per_page: 100,
            }
          }
        );

        data = searchResults;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Cache the results
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error('GitHub API Error:', error);
    const err = error as { message?: string; status?: number };
    
    // Check if it's a rate limit error
    if (err.status === 403 || err.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
} 