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
  description: string | null;
  url: string;
  lastUpdated: string;
  stars: number;
  dependencyType: string;
  dependencyVersion: string;
  isWorkspace: boolean;
  isPrivate: boolean;
}

export async function findDependentRepositories(packageName: string): Promise<DependentRepository[]> {
  console.log(`\n🔍 Starting dependency discovery for package: ${packageName}`);
  
  try {
    // For scoped packages like @zk-kit/lean-imt, we need to search both with and without the scope
    const searchTerms = packageName.startsWith('@') 
      ? [
          packageName.replace('@', '').replace('/', '\\/'), // zk-kit/lean-imt
          packageName.split('/')[1], // lean-imt
        ]
      : [packageName];
    
    const searchQuery = searchTerms
      .map(term => `"${term}"`)
      .join(' OR ') + ' filename:package.json';
    
    console.log(`├─ Executing GitHub search query: ${searchQuery}`);
    console.log(`├─ Note: Searching for package references in package.json files`);
    
    const response = await octokit.search.code({
      q: searchQuery,
      per_page: 100
    });

    console.log(`├─ Found ${response.data.total_count} potential matches`);
    console.log('├─ Analyzing repository details...');

    const dependentRepos: DependentRepository[] = [];
    const processedRepos = new Set<string>();

    for (const item of response.data.items) {
      const repoFullName = item.repository.full_name;
      
      // Skip if we've already processed this repository
      if (processedRepos.has(repoFullName)) continue;
      processedRepos.add(repoFullName);

      console.log(`├─ Processing repository: ${repoFullName}`);
      
      try {
        // Get package.json content to verify dependency
        const contentResponse = await octokit.repos.getContent({
          owner: item.repository.owner.login,
          repo: item.repository.name,
          path: item.path,
        });

        if ('content' in contentResponse.data) {
          const content = Buffer.from(contentResponse.data.content, 'base64').toString();
          const packageJson = JSON.parse(content);
          
          // Helper function to check if package exists in a dependency object
          const isInDependencies = (pkg: string, depsObj: Record<string, string> | undefined) => 
            depsObj && (pkg in depsObj);

          // Helper function to check workspace references
          const isInWorkspaces = (pkg: string, workspaces: string[] | Record<string, string[]> | undefined) => {
            if (!workspaces) return false;
            if (Array.isArray(workspaces)) {
              return workspaces.some(w => w.includes(pkg));
            }
            return Object.values(workspaces).flat().some(w => w.includes(pkg));
          };

          // Get all possible package name variants
          const packageVariants = packageName.startsWith('@') 
            ? [packageName, packageName.split('/')[1]] 
            : [packageName];

          // Check for the package name in various forms
          const hasDependency = [
            // Check in all types of dependencies
            ...packageVariants.flatMap(pkg => [
              isInDependencies(pkg, packageJson.dependencies),
              isInDependencies(pkg, packageJson.devDependencies),
              isInDependencies(pkg, packageJson.peerDependencies),
              isInDependencies(pkg, packageJson.optionalDependencies),
              isInDependencies(pkg, packageJson.bundleDependencies),
              isInDependencies(pkg, packageJson.bundledDependencies)
            ]),
            // Check in workspaces
            isInWorkspaces(packageName, packageJson.workspaces),
            // Check if it's mentioned in the repository field
            typeof packageJson.repository === 'string' && packageVariants.some(pkg => 
              packageJson.repository.includes(pkg)
            ),
            // Check if it's mentioned in the name field
            packageVariants.some(pkg => packageJson.name === pkg),
            // Check if it's a workspace package
            packageJson.name?.startsWith(packageName) && packageJson.name?.includes('workspace')
          ].some(Boolean);

          if (hasDependency) {
            console.log(`├─ ✅ Confirmed dependency in ${repoFullName}`);
            
            // Get the version information from all possible locations
            const versionInfo = packageVariants.map(pkg => ({
              pkg,
              versions: {
                deps: packageJson.dependencies?.[pkg],
                devDeps: packageJson.devDependencies?.[pkg],
                peerDeps: packageJson.peerDependencies?.[pkg],
                optionalDeps: packageJson.optionalDependencies?.[pkg],
                bundleDeps: packageJson.bundleDependencies?.[pkg] || packageJson.bundledDependencies?.[pkg]
              }
            })).find(info => 
              Object.values(info.versions).some(v => v !== undefined)
            );

            const version = versionInfo 
              ? Object.entries(versionInfo.versions)
                  .find(([, v]) => v !== undefined)?.[1] || 'unknown'
              : 'unknown';

            // Log detailed dependency information
            console.log(`├─   Version: ${version}`);
            console.log(`├─   Package Variant: ${versionInfo?.pkg || packageName}`);
            
            // Try to get additional context about the dependency
            const dependencyContext = [
              packageJson.name && `Project: ${packageJson.name}`,
              packageJson.version && `Project Version: ${packageJson.version}`,
              packageJson.private === true && 'Private Package',
              packageJson.workspaces && 'Workspace Project'
            ].filter(Boolean).join(', ');

            if (dependencyContext) {
              console.log(`├─   Context: ${dependencyContext}`);
            }

            // Add to dependent repositories with enhanced information
            dependentRepos.push({
              name: item.repository.name,
              fullName: repoFullName,
              description: item.repository.description || null,
              url: item.repository.html_url,
              lastUpdated: item.repository.updated_at || new Date().toISOString(),
              stars: item.repository.stargazers_count || 0,
              dependencyType: Object.entries(versionInfo?.versions || {})
                .find(([, v]) => v !== undefined)?.[0] || 'unknown',
              dependencyVersion: version,
              isWorkspace: !!packageJson.workspaces,
              isPrivate: !!packageJson.private
            });
          } else {
            console.log(`├─ ⚠️ Package reference found but not confirmed as dependency in ${repoFullName}`);
            // Log what was checked to help with debugging
            console.log(`├─   Checked variants: ${packageVariants.join(', ')}`);
            if (packageJson.workspaces) {
              console.log(`├─   Has workspaces: ${JSON.stringify(packageJson.workspaces)}`);
            }
          }
        }
      } catch (error) {
        console.log(`├─ ⚠️ Could not verify dependency in ${repoFullName}: ${(error as Error).message}`);
      }
    }

    console.log(`└─ ✅ Found ${dependentRepos.length} confirmed dependent repositories`);
    return dependentRepos;

  } catch (error) {
    if (error instanceof RequestError && error.status === 403 && error.message.includes('rate limit')) {
      console.log('└─ ⚠️ GitHub API rate limit exceeded');
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    
    console.error('└─ ❌ Error during dependency discovery:', (error as Error).message);
    throw new Error('Failed to find dependent repositories');
  }
} 