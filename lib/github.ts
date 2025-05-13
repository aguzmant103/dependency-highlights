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

export async function findDependentRepositories(packageName: string): Promise<DependentRepository[]> {
  console.log(`\n🔍 Starting dependency discovery for package: ${packageName}`);
  try {
    // Only search for the exact package name (scoped or unscoped)
    const searchQuery = `"${packageName}" in:file filename:package.json`;
    console.log(`├─ Executing GitHub search query: ${searchQuery}`);
    console.log('├─ Search terms:');
    console.log(`│  ├─ "${packageName}"`);
    console.log(`├─ Note: Searching for exact package references in any package.json file (paginated)`);

    // Pagination loop
    let page = 1;
    const per_page = 100;
    let total_count = 0;
    const dependentRepos: DependentRepository[] = [];
    const processedRepos = new Set<string>();
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
        // Minimal info for now; you can expand this as needed
        dependentRepos.push({
          name: item.repository.name,
          fullName: repoFullName,
          description: typeof item.repository.description === 'string' ? item.repository.description : 'No description available',
          url: item.repository.html_url,
          lastUpdated: item.repository.updated_at ?? new Date().toISOString(),
          stars: item.repository.stargazers_count ?? 0,
          forks: item.repository.forks_count ?? 0,
          dependencyType: 'dependency',
          dependencyVersion: 'unknown',
          isWorkspace: false,
          isPrivate: item.repository.private
        });
      }
      hasMore = response.data.items.length === per_page;
      page++;
    }
    console.log(`└─ ✅ Found ${dependentRepos.length} unique dependent repositories`);
    return dependentRepos;
  } catch (error) {
    console.error('❌ Error during dependency discovery:', error);
    throw new Error('Failed to find dependent repositories');
  }
} 