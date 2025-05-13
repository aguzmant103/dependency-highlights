import { mockDependentProjects, DependentProject } from './mock-data';
import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';

interface DependentProjectsResponse {
  data: DependentProject[];
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface GitHubPackage {
  name: string;
  type: string;
  path: string;
}

export async function fetchDependentProjects(owner: string, repo: string): Promise<DependentProjectsResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filter mock data based on owner/repo and active status
  const activeProjects = mockDependentProjects.filter((project: DependentProject) => 
    project.isActive && project.owner === owner && project.package === repo
  );

  return {
    data: activeProjects
  };
}

export async function fetchRepositoryPackages(owner: string, repo: string): Promise<GitHubPackage[]> {
  console.log(`\n📦 Starting package discovery for ${owner}/${repo}`);
  console.log(`├─ Checking packages directory at: github.com/${owner}/${repo}/packages`);
  
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/packages', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!Array.isArray(response.data)) {
      console.log('⚠️ No packages directory found or invalid response format');
      console.log('└─ Returning empty package list');
      return [];
    }

    // Filter only directories as they represent packages
    const packageDirs = response.data.filter(item => item.type === 'dir');
    console.log(`├─ Found ${response.data.length} items in packages directory`);
    console.log(`├─ Filtered ${packageDirs.length} directories that could be packages`);

    const packages = packageDirs.map(dir => {
      console.log(`├─ Processing package: ${dir.name}`);
      return {
        name: dir.name,
        type: 'npm', // Assuming npm packages for now
        path: dir.path
      };
    });

    console.log(`└─ ✅ Successfully discovered ${packages.length} packages`);
    return packages;

  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 404) {
        console.log('⚠️ No packages directory found in repository');
        console.log('└─ This could mean the repository uses a different structure or has no packages');
        return [];
      }
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('⚠️ GitHub API rate limit exceeded');
        console.log('└─ Please try again later or check your API token');
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
    }
    console.error('❌ Error during package discovery:', (error as Error).message);
    throw new Error('Failed to fetch repository packages');
  }
}

export interface DependentRepository {
  name: string;
  fullName: string;
  description: string;
  url: string;
  lastUpdated: string;
  stars: number;
  forks: number;
  dependencyType: string;
  dependencyVersion: string;
  isWorkspace: boolean;
  isPrivate: boolean;
}

// Helper: Throttled batch fetch for repo metadata
async function throttledMap<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function next(): Promise<void> {
    if (i >= items.length) return;
    const idx = i++;
    try {
      results[idx] = await fn(items[idx]);
    } catch {
      results[idx] = undefined as unknown as R;
    }
    await next();
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, next);
  await Promise.all(runners);
  return results;
}

export async function findDependentRepositories(packageName: string): Promise<DependentRepository[]> {
  console.log(`\n🔍 Starting dependency discovery for package: ${packageName}`);
  try {
    const searchQuery = `"${packageName}" in:file filename:package.json`;
    console.log(`├─ Executing GitHub search query: ${searchQuery}`);
    console.log('├─ Search terms:');
    console.log(`│  ├─ "${packageName}"`);
    console.log(`├─ Note: Searching for exact package references in any package.json file (paginated)`);

    let page = 1;
    const per_page = 100;
    let total_count = 0;
    const processedRepos = new Set<string>();
    const repoInfos: { owner: string; repo: string; item: Record<string, unknown> }[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await octokit.search.code({
        q: searchQuery,
        per_page,
        page,
        headers: { accept: 'application/vnd.github.v3+json' }
      });
      if (page === 1) {
        total_count = response.data.total_count;
        console.log(`├─ Found ${total_count} potential matches`);
      }
      if (!response.data.items.length) break;
      for (const item of response.data.items) {
        const repoFullName = item.repository.full_name;
        if (processedRepos.has(repoFullName)) continue;
        processedRepos.add(repoFullName);
        const [owner, repo] = repoFullName.split('/');
        repoInfos.push({ owner, repo, item });
      }
      hasMore = response.data.items.length === per_page;
      page++;
    }

    // Fetch accurate repo metadata with throttling
    const concurrencyLimit = 5;
    const repoMetas = await throttledMap(repoInfos, concurrencyLimit, async ({ owner, repo, item }) => {
      let meta;
      let retry = 0;
      while (retry < 3) {
        try {
          const { data } = await octokit.repos.get({ owner, repo });
          meta = data;
          break;
        } catch (error: unknown) {
          if (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            'message' in error &&
            typeof (error as { message: unknown }).message === 'string' &&
            typeof (error as { status: unknown }).status === 'number' &&
            (error as { status: number }).status === 403 &&
            (error as { message: string }).message.includes('rate limit')
          ) {
            const wait = 1000 * (retry + 1);
            console.warn(`⚠️ Rate limit hit for ${owner}/${repo}, retrying in ${wait}ms...`);
            await new Promise(res => setTimeout(res, wait));
            retry++;
          } else {
            const msg = typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error);
            console.error(`❌ Failed to fetch metadata for ${owner}/${repo}:`, msg);
            break;
          }
        }
      }
      return { item, meta };
    });

    const dependentRepos: DependentRepository[] = repoMetas.map(({ item, meta }) => {
      if (!meta) {
        // Type guard for item.repository
        const repo = typeof item.repository === 'object' && item.repository !== null ? item.repository as Record<string, unknown> : {};
        return {
          name: typeof repo.name === 'string' ? repo.name : 'unknown',
          fullName: typeof repo.full_name === 'string' ? repo.full_name : 'unknown/unknown',
          description: typeof repo.description === 'string' ? repo.description : 'No description available',
          url: typeof repo.html_url === 'string' ? repo.html_url : '',
          lastUpdated: typeof repo.updated_at === 'string' ? repo.updated_at : new Date().toISOString(),
          stars: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0,
          forks: typeof repo.forks_count === 'number' ? repo.forks_count : 0,
          dependencyType: 'dependency',
          dependencyVersion: 'unknown',
          isWorkspace: false,
          isPrivate: typeof repo.private === 'boolean' ? repo.private : false
        };
      }
      return {
        name: meta.name,
        fullName: meta.full_name,
        description: typeof meta.description === 'string' ? meta.description : 'No description available',
        url: meta.html_url,
        lastUpdated: meta.updated_at ?? new Date().toISOString(),
        stars: meta.stargazers_count ?? 0,
        forks: meta.forks_count ?? 0,
        dependencyType: 'dependency',
        dependencyVersion: 'unknown',
        isWorkspace: false,
        isPrivate: meta.private
      };
    });
    console.log(`└─ ✅ Found ${dependentRepos.length} unique dependent repositories with accurate metadata`);
    return dependentRepos;
  } catch (error) {
    console.error('❌ Error during dependency discovery:', error);
    throw new Error('Failed to find dependent repositories');
  }
} 