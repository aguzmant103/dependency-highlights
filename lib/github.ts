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
  console.log('[fetchRepositoryPackages] Starting fetch for', { owner, repo });
  
  try {
    // First try to get contents of the packages directory
    console.log('[fetchRepositoryPackages] Fetching contents of /packages directory...');
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/packages', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    console.log('[fetchRepositoryPackages] Raw API response:', response.data);

    if (!Array.isArray(response.data)) {
      console.log('[fetchRepositoryPackages] Warning: packages/ is not a directory, response type:', typeof response.data);
      return [];
    }

    // Filter only directories as they represent packages
    const packageDirs = response.data.filter(item => item.type === 'dir');
    console.log('[fetchRepositoryPackages] Found package directories:', packageDirs);

    const packages = packageDirs.map(dir => ({
      name: dir.name,
      type: 'npm', // Assuming npm packages for now
      path: dir.path
    }));

    console.log('[fetchRepositoryPackages] Final formatted packages:', packages);
    return packages;

  } catch (error) {
    console.error('[fetchRepositoryPackages] Error details:', {
      status: (error as RequestError)?.status,
      message: (error as Error)?.message,
      name: (error as Error)?.name,
      stack: (error as Error)?.stack
    });
    
    if (error instanceof RequestError) {
      if (error.status === 404) {
        console.log('[fetchRepositoryPackages] No packages directory found in repository');
        return [];
      }
      // Handle rate limiting
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('[fetchRepositoryPackages] Rate limit exceeded. Headers:', error.response?.headers);
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
    }
    throw new Error('Failed to fetch repository packages');
  }
} 