import { z } from "zod";
import { githubRateLimiter } from "./github-rate-limit";
import { GitHubSearchResponse, GitHubSearchCodeItem, GitHubContent, GitHubCommit, GitHubRepository, PackageJson } from "./github-types";

// Schema for repository validation
const RepoUrlSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

// Schema for package data
export interface Package {
  name: string;
  path: string;
  type: "npm" | "other";  // Add more types as needed
}

// Schema for dependent project data
export interface DependentProject {
  id: string;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  lastCommit: string;
  isActive: boolean;
  url: string;
  package: string; // Track which package this project depends on
}

// Constants for batch processing
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 2000;

// Utility function for delay between batches
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse GitHub repository URL or owner/repo string
export function parseRepoUrl(url: string) {
  console.log("🔍 Parsing repository URL:", url);
  
  // Handle full GitHub URLs
  if (url.includes("github.com")) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error("Invalid GitHub URL");
    const result = RepoUrlSchema.parse({ owner: match[1], repo: match[2].replace(".git", "") });
    console.log("✅ Parsed GitHub URL:", result);
    return result;
  }

  // Handle owner/repo format
  const [owner, repo] = url.split("/");
  const result = RepoUrlSchema.parse({ owner, repo: repo?.replace(".git", "") });
  console.log("✅ Parsed owner/repo format:", result);
  return result;
}

// Discover packages in a repository
async function discoverPackages(owner: string, repo: string): Promise<Package[]> {
  console.log(`🔍 Discovering packages in ${owner}/${repo}`);
  
  try {
    // First try to get package.json files from the repository
    console.log(`🔎 Searching for package.json files in ${owner}/${repo}`);
    const packageFiles = await githubRateLimiter.request('GET', '/search/code', {
      params: {
        q: `repo:${owner}/${repo} filename:package.json`,
        per_page: 100,
      }
    }) as GitHubSearchResponse<GitHubSearchCodeItem>;

    console.log(`📦 Found ${packageFiles.items.length} potential package.json files:`, 
      packageFiles.items.map((f) => ({ path: f.path, url: f.html_url }))
    );

    const packages: Package[] = [];

    // Process each package.json file
    for (const file of packageFiles.items) {
      try {
        console.log(`📄 Processing package.json at ${file.path}`);
        const content = await githubRateLimiter.request('GET', '/repos/{owner}/{repo}/contents/{path}', {
          params: {
            owner,
            repo,
            path: file.path
          },
          headers: {
            accept: 'application/vnd.github.v3+json'
          }
        }) as GitHubContent;

        if ('content' in content) {
          const packageJson = JSON.parse(Buffer.from(content.content, 'base64').toString()) as PackageJson;
          console.log(`📝 Package.json content for ${file.path}:`, {
            name: packageJson.name,
            dependencies: Object.keys(packageJson.dependencies || {}),
            devDependencies: Object.keys(packageJson.devDependencies || {})
          });
          
          if (packageJson.name) {
            packages.push({
              name: packageJson.name,
              path: file.path,
              type: 'npm'
            });
            console.log(`✅ Found package: ${packageJson.name}`);
          } else {
            console.log(`⚠️ No package name found in ${file.path}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing package.json at ${file.path}:`, error);
      }
    }

    console.log(`📦 Final packages discovered:`, packages);
    return packages;
  } catch (error) {
    console.error("❌ Error discovering packages:", error);
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response
    ) {
      console.error("API Error Details:", error.response.data);
    }
    return [];
  }
}

// Schema for batch processing results
export interface BatchProcessingResult {
  data: DependentProject[];
  hasNextPage: boolean;
  isPartialResult: boolean;
  error?: string;
  processedPackages?: number;
  totalPackages?: number;
}

// Fetch dependent repositories using GitHub API with batch processing
export async function fetchDependentProjects(
  owner: string,
  repo: string,
  page = 1,
  perPage = 30,
  selectedPackages: string[] = [],
  onProgress?: (result: BatchProcessingResult) => void
): Promise<BatchProcessingResult> {
  try {
    console.log(`🔍 Fetching dependencies for ${owner}/${repo} (page ${page})`);
    
    // First, check if the repository exists
    console.log("📡 Checking if repository exists...");
    const repoCheck = await githubRateLimiter.request('GET', '/repos/{owner}/{repo}', {
      params: {
        owner,
        repo
      },
      headers: {
        accept: 'application/vnd.github.v3+json'
      }
    }) as GitHubRepository;
    console.log("✅ Repository found:", repoCheck.full_name);

    // Discover packages in the repository
    const packages = await discoverPackages(owner, repo);
    console.log(`📦 Found ${packages.length} packages in repository:`, packages);

    // Filter packages if specific ones are selected
    const packagesToProcess = selectedPackages.length > 0
      ? packages.filter(pkg => selectedPackages.includes(pkg.name))
      : packages;

    if (packagesToProcess.length === 0) {
      return {
        data: [],
        hasNextPage: false,
        isPartialResult: false,
        error: 'No packages found or selected',
        processedPackages: 0,
        totalPackages: 0
      };
    }

    // Process packages in batches
    const allDependents: DependentProject[] = [];
    let isPartialResult = false;
    let batchError: string | undefined;

    const emitProgress = () => {
      const result: BatchProcessingResult = {
        data: Array.from(new Map(allDependents.map(dep => [dep.id, dep])).values())
          .sort((a, b) => b.stars - a.stars)
          .slice(0, perPage),
        hasNextPage: allDependents.length > perPage,
        isPartialResult,
        error: batchError,
        processedPackages: Math.min(allDependents.length, packagesToProcess.length),
        totalPackages: packagesToProcess.length
      };
      onProgress?.(result);
      return result;
    };

    for (let i = 0; i < packagesToProcess.length; i += BATCH_SIZE) {
      const batch = packagesToProcess.slice(i, i + BATCH_SIZE);
      console.log(`🔄 Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(packagesToProcess.length / BATCH_SIZE)}`);

      // Check rate limit before processing batch
      const canContinue = await githubRateLimiter.hasRemainingRequests();
      if (!canContinue) {
        console.log("⚠️ Rate limit reached, stopping batch processing");
        isPartialResult = true;
        batchError = "Rate limit exceeded. Please try again later.";
        return emitProgress();
      }

      try {
        const batchPromises = batch.map(async (pkg) => {
          console.log(`🔎 Searching for dependents of package: ${pkg.name}`);
          
          const response = await githubRateLimiter.request('GET', '/search/code', {
            params: {
              q: `"${pkg.name}": filename:package.json`,
              per_page: perPage,
              page,
            }
          }) as GitHubSearchResponse<GitHubSearchCodeItem>;

          console.log(`📊 Found ${response.total_count} potential dependents for ${pkg.name}`);

          // Process repositories for this package
          const uniqueRepos = new Map();
          for (const item of response.items) {
            if (item.repository && !uniqueRepos.has(item.repository.node_id)) {
              uniqueRepos.set(item.repository.node_id, item.repository);
            }
          }

          // Process each unique repository
          for (const repo of uniqueRepos.values()) {
            try {
              const commits = await githubRateLimiter.request('GET', '/repos/{owner}/{repo}/commits', {
                params: {
                  owner: repo.owner.login,
                  repo: repo.name,
                  per_page: 1
                },
                headers: {
                  accept: 'application/vnd.github.v3+json'
                }
              }) as GitHubCommit[];

              const lastCommitDate = commits[0]?.commit?.committer?.date;
              const monthsInactive = lastCommitDate
                ? Math.floor((Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
                : 0;

              allDependents.push({
                id: repo.node_id,
                name: repo.name,
                description: repo.description,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                lastCommit: lastCommitDate
                  ? new Date(lastCommitDate).toISOString().split('T')[0].replace(/-/g, '/')
                  : "Unknown",
                isActive: monthsInactive < 6,
                url: repo.html_url,
                package: pkg.name,
              });
              
              // Emit progress after each repository is processed
              emitProgress();
            } catch (error) {
              console.warn(`⚠️ Error processing repository ${repo.full_name}:`, error);
            }
          }
        });

        // Wait for all promises in the batch
        await Promise.all(batchPromises);

        // Add delay between batches if there are more to process
        if (i + BATCH_SIZE < packagesToProcess.length) {
          console.log(`😴 Waiting ${BATCH_DELAY_MS}ms before next batch...`);
          await sleep(BATCH_DELAY_MS);
        }
      } catch (error) {
        console.error(`❌ Error processing batch:`, error);
        isPartialResult = true;
        batchError = error instanceof Error ? error.message : "Unknown batch error";
        return emitProgress();
      }
    }

    return emitProgress();
  } catch (error) {
    console.error("❌ Error fetching dependent projects:", error);
    return {
      data: [],
      hasNextPage: false,
      isPartialResult: true,
      error: error instanceof Error ? error.message : "Failed to fetch dependent projects"
    };
  }
}
