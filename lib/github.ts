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
  console.log(`📦 Fetching packages for ${owner}/${repo}`);
  
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/packages', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!Array.isArray(response.data)) {
      console.log('⚠️ No packages directory found');
      return [];
    }

    // Filter only directories as they represent packages
    const packageDirs = response.data.filter(item => item.type === 'dir');
    const packages = packageDirs.map(dir => ({
      name: dir.name,
      type: 'npm', // Assuming npm packages for now
      path: dir.path
    }));

    console.log(`✅ Found ${packages.length} packages`);
    return packages;

  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 404) {
        console.log('⚠️ No packages directory found');
        return [];
      }
      if (error.status === 403 && error.message.includes('rate limit')) {
        console.log('⚠️ GitHub API rate limit exceeded');
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
    }
    console.error('❌ Error fetching packages:', (error as Error).message);
    throw new Error('Failed to fetch repository packages');
  }
} 