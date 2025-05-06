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
  const packageName = searchParams.get("package");

  if (!packageName) {
    return NextResponse.json(
      { error: "Missing required parameter: package" },
      { status: 400 }
    );
  }

  try {
    console.log('\n[/api/github-packages] 📥 Received dependency discovery request');
    console.log(`[/api/github-packages] ├─ Package: ${packageName}`);
    
    const dependentRepos = await findDependentRepositories(packageName);
    
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