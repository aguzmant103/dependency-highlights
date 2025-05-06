import { NextRequest, NextResponse } from 'next/server';
import { fetchRepositoryPackages } from '@/lib/github';

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