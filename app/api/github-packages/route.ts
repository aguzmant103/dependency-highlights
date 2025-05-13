import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryPackages, findDependentRepositories } from '@/lib/github';

export async function POST(req: NextRequest) {
  console.log('\n[/api/github-packages] 📥 Received package discovery request');
  
  try {
    const { owner, repo } = await req.json();
    console.log(`[/api/github-packages] ├─ Processing request for ${owner}/${repo}`);
    
    if (!owner || !repo) {
      console.log('[/api/github-packages] ├─ ❌ Missing required parameters');
      return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    console.log('[/api/github-packages] ├─ Fetching packages from GitHub API');
    const packages = await fetchRepositoryPackages(owner, repo);
    console.log(`[/api/github-packages] └─ ✅ Successfully retrieved ${packages.length} packages`);
    
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('[/api/github-packages] ❌ Error processing request:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const packageName = searchParams.get("package");

  console.log('\n[/api/github-packages] 📥 Received GET request');
  console.log('[/api/github-packages] ├─ Request details:', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });
  console.log('[/api/github-packages] ├─ Search params:', {
    owner,
    repo,
    package: packageName,
    ownerType: typeof owner,
    repoType: typeof repo,
    packageType: typeof packageName,
    hasOwner: Boolean(owner),
    hasRepo: Boolean(repo),
    hasPackage: Boolean(packageName),
    rawParams: Object.fromEntries(searchParams.entries())
  });

  if (!owner || !repo || !packageName) {
    console.log('[/api/github-packages] ├─ ❌ Missing required parameters');
    console.log('[/api/github-packages] ├─ Parameter validation:', {
      owner: {
        value: owner,
        type: typeof owner,
        valid: Boolean(owner)
      },
      repo: {
        value: repo,
        type: typeof repo,
        valid: Boolean(repo)
      },
      package: {
        value: packageName,
        type: typeof packageName,
        valid: Boolean(packageName)
      }
    });
    return NextResponse.json(
      { error: "Missing required parameters: owner, repo, and package" },
      { status: 400 }
    );
  }

  const fullPackageName = `@${owner}/${packageName}`;

  try {
    console.log('\n[/api/github-packages] 📥 Received dependency discovery request');
    console.log(`[/api/github-packages] ├─ Package: ${fullPackageName}`);
    
    const dependentRepos = await findDependentRepositories(fullPackageName);
    
    console.log(`[/api/github-packages] └─ ✅ Successfully found ${dependentRepos.length} dependent repositories`);
    
    return NextResponse.json({
      total_count: dependentRepos.length,
      items: dependentRepos
    });
  } catch (error) {
    console.error('[/api/github-packages] ❌ Error discovering dependencies:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: "Failed to discover dependent repositories" },
      { status: 500 }
    );
  }
} 