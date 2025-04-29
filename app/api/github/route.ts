import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

// Initialize Octokit with server-side token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

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

    let data;
    switch (action) {
      case 'packages':
        // Get package.json files
        const packageFiles = await octokit.search.code({
          q: `repo:${owner}/${repo} filename:package.json path:/packages/`,
          per_page: 100,
        });

        // Get contents of each package.json
        const packages = await Promise.all(
          packageFiles.data.items.map(async (file) => {
            const content = await octokit.repos.getContent({
              owner,
              repo,
              path: file.path,
            });

            if ('content' in content.data) {
              const packageJson = JSON.parse(
                Buffer.from(content.data.content, 'base64').toString()
              );
              return {
                name: packageJson.name,
                path: file.path,
                type: 'npm',
              };
            }
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

        const searchResults = await octokit.search.code({
          q: `"${package_name}": filename:package.json`,
          per_page: 100,
        });

        data = searchResults.data;
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
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
} 