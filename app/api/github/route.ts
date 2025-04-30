import { NextResponse } from 'next/server';
import { githubRateLimiter } from '@/lib/github-rate-limit';
import { GitHubSearchCodeItem, PackageJson } from '@/lib/github-types';
import { mockData } from '@/lib/mock-data';

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE; 

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

// Simple in-memory cache (consider using Redis or similar for production)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    console.log('[API] /api/github called:', request.url);
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

    // Check rate limit before proceeding (skip in mock mode)
    if (!USE_MOCK) {
      const hasRemaining = await githubRateLimiter.hasRemainingRequests();
      if (!hasRemaining) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    let data;

    switch (action) {
      case 'packages':
        if (USE_MOCK) {
          const result = mockData.searchCode(`repo:${owner}/${repo} filename:package.json`);
          data = result.items.map((item) => ({
            name: item.repository.name,
            path: item.path,
            type: 'npm',
          }));
          break;
        }
        // Get package.json files
        const packageFiles = await githubRateLimiter.request<'GET /search/code'>(
          'GET',
          '/search/code',
          {
            params: {
              q: `repo:${owner}/${repo} filename:package.json`,
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
        console.log(`[API] Discovered ${data.length} packages for ${owner}/${repo}`);
        break;

      case 'dependents':
        const selectedPackages = searchParams.get('packages')?.split(',') || [];
        if (selectedPackages.length === 0) {
          return NextResponse.json(
            { error: 'No packages selected' },
            { status: 400 }
          );
        }
        if (USE_MOCK) {
          data = await Promise.all(
            selectedPackages.map((packageName) => {
              const result = mockData.searchCode(`"${packageName}": filename:package.json`);
              return {
                package: packageName,
                results: result.items,
              };
            })
          );
          break;
        }
        // Search for dependents of each selected package
        const searchResults = await Promise.all(
          selectedPackages.map(async (packageName) => {
            const response = await githubRateLimiter.request<'GET /search/code'>(
              'GET',
              '/search/code',
              {
                params: {
                  q: `"${packageName}": filename:package.json`,
                  per_page: 100,
                }
              }
            );
            return {
              package: packageName,
              results: response.items
            };
          })
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
    console.error('GitHub API error:', error);
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