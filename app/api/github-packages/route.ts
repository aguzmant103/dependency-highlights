import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryPackages } from '@/lib/github';
import { mockData } from "@/lib/mock-data"

export async function POST(req: NextRequest) {
  try {
    const { owner, repo } = await req.json();
    if (!owner || !repo) {
      return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    const packages = await fetchRepositoryPackages(owner, repo);
    return NextResponse.json({ packages });
  } catch (error) {
    console.error('[/api/github-packages] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get("owner")
  const repo = searchParams.get("repo")

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing required parameters: owner and repo" },
      { status: 400 }
    )
  }

  try {
    // Use mock data for now
    const response = mockData.searchCode(`filename:package.json repo:${owner}/${repo}`)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching GitHub packages:", error)
    return NextResponse.json(
      { error: "Failed to fetch GitHub packages" },
      { status: 500 }
    )
  }
} 