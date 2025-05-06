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
  forks: number;
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
          packageName, // @zk-kit/lean-imt
          `"${packageName}"`, // "@zk-kit/lean-imt"
          packageName.replace('@', '').replace('/', '\\/'), // zk-kit/lean-imt
          packageName.split('/')[1], // lean-imt
          `@${packageName.split('/')[0].substring(1)}\\/${packageName.split('/')[1]}` // @zk-kit\/lean-imt
        ]
      : [packageName, `"${packageName}"`];
    
    const searchQuery = searchTerms
      .map(term => term.includes('"') ? term : `"${term}"`)
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
          
          // Check if the package name appears in the raw content (for cases where JSON.parse might miss it)
          const contentIncludesPackage = searchTerms.some(pkg => content.includes(`"${pkg}"`) || content.includes(`'${pkg}'`));

          // Helper function to check if package exists in a dependency object
          const isInDependencies = (pkg: string, depsObj: Record<string, string> | undefined) => {
            if (!depsObj) return false;
            // Check both exact match and as a substring (for workspace dependencies)
            return Object.keys(depsObj).some(dep => 
              dep === pkg || 
              dep.includes(pkg) || 
              (pkg.startsWith('@') && dep.includes(pkg.split('/')[1]))
            );
          };

          // Helper function to check workspace references
          const isInWorkspaces = (pkg: string, workspaces: string[] | Record<string, string[]> | undefined) => {
            if (!workspaces) return false;
            const workspacePatterns = Array.isArray(workspaces) ? workspaces : Object.values(workspaces).flat();
            // Check if any workspace pattern could potentially include our package
            return workspacePatterns.some(pattern => {
              // Convert glob pattern to regex-like check
              const regexPattern = pattern
                .replace(/\*/g, '.*')
                .replace(/\//g, '\\/');
              return new RegExp(regexPattern).test(pkg);
            });
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
            packageJson.name?.startsWith(packageName) && packageJson.name?.includes('workspace'),
            // Check raw content
            contentIncludesPackage
          ].some(Boolean);

          if (hasDependency) {
            // Collect all the ways this package is referenced
            const references = [];
            
            if (packageJson.dependencies && Object.keys(packageJson.dependencies).some(d => packageVariants.includes(d))) {
              references.push('dependencies');
            }
            if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).some(d => packageVariants.includes(d))) {
              references.push('devDependencies');
            }
            if (packageJson.peerDependencies && Object.keys(packageJson.peerDependencies).some(d => packageVariants.includes(d))) {
              references.push('peerDependencies');
            }
            if (packageJson.workspaces) {
              references.push('workspaces');
            }
            if (contentIncludesPackage) {
              references.push('content');
            }

            console.log(`├─ ✅ Found dependency in ${repoFullName} (${references.join(', ')})`);
            
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

            if (version !== 'unknown') {
              console.log(`├─   Version: ${version}`);
            }

            // Add to dependent repositories with enhanced information
            console.log(`├─ Repository details for ${repoFullName}:`, {
              stars: item.repository.stargazers_count,
              forks: item.repository.forks_count,
              description: item.repository.description,
              updated_at: item.repository.updated_at
            });

            dependentRepos.push({
              name: item.repository.name,
              fullName: repoFullName,
              description: item.repository.description || null,
              url: item.repository.html_url,
              lastUpdated: item.repository.updated_at || new Date().toISOString(),
              stars: item.repository.stargazers_count || 0,
              forks: item.repository.forks_count || 0,
              dependencyType: references[0] || 'unknown',
              dependencyVersion: version,
              isWorkspace: !!packageJson.workspaces,
              isPrivate: !!packageJson.private
            });

            // Log repository stats for verification
            console.log(`├─   Stats: ⭐ ${item.repository.stargazers_count} 🍴 ${item.repository.forks_count}`);
          } else {
            console.log(`├─ ⚠️ Reference found but not confirmed in ${repoFullName}`);
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