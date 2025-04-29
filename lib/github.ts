import { Octokit } from "@octokit/rest";
import { z } from "zod";

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

// Initialize Octokit client
const octokit = new Octokit({
  auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN,
});

// Add warning if no token is found
if (!process.env.NEXT_PUBLIC_GITHUB_TOKEN && !process.env.GITHUB_TOKEN) {
  console.warn("⚠️ No GitHub token found. API rate limits will be severely restricted and some features won't work.");
}

// Constants for batch processing
const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Utility function for delay between batches
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility function for exponential backoff
async function exponentialBackoff(retryCount: number) {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  await sleep(delay);
}

// Utility function to check remaining rate limit
async function checkRateLimit(): Promise<boolean> {
  try {
    const { data: rateLimit } = await octokit.rateLimit.get();
    const remaining = rateLimit.resources.search.remaining;
    console.log(`ℹ️ GitHub API rate limit remaining: ${remaining}`);
    return remaining > 0;
  } catch (error) {
    console.warn("⚠️ Failed to check rate limit:", error);
    return true; // Assume we can continue if we can't check
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

// Types for GitHub API errors
interface GitHubErrorResponse {
  status: number;
  message: string;
  documentation_url?: string;
}

interface GitHubError extends Error {
  status?: number;
  response?: {
    data?: GitHubErrorResponse;
  };
}

// Utility function to check if error is a rate limit error
function isRateLimitError(error: unknown): error is GitHubError {
  return (
    error instanceof Error &&
    'status' in error &&
    (error.status === 403 || error.status === 429)
  );
}

// Utility function to format rate limit error message
function formatRateLimitError(error: GitHubError): string {
  const baseMessage = "GitHub API rate limit exceeded.";
  const waitTime = "Please wait a few minutes and try again.";
  const docsLink = "See https://docs.github.com/rest/rate-limit for more information.";
  
  if (error.response?.data?.documentation_url) {
    return `${baseMessage} ${waitTime}\n${docsLink}`;
  }
  
  return `${baseMessage} ${waitTime}`;
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
    const { data: packageFiles } = await octokit.search.code({
      q: `repo:${owner}/${repo} filename:package.json path:/packages/`,
      per_page: 100,
    });

    console.log(`📦 Found ${packageFiles.items.length} potential package.json files`);

    const packages: Package[] = [];

    // Process each package.json file
    for (const file of packageFiles.items) {
      try {
        const { data: content } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        if ('content' in content) {
          const packageJson = JSON.parse(Buffer.from(content.content, 'base64').toString());
          if (packageJson.name) {
            packages.push({
              name: packageJson.name,
              path: file.path,
              type: 'npm'
            });
            console.log(`✅ Found package: ${packageJson.name}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error processing package.json at ${file.path}:`, error);
      }
    }

    return packages;
  } catch (error) {
    console.error("❌ Error discovering packages:", error);
    return [];
  }
}

// Fetch dependent repositories using GitHub API with batch processing
export async function fetchDependentProjects(
  owner: string,
  repo: string,
  page = 1,
  perPage = 30,
  onProgress?: (result: BatchProcessingResult) => void
): Promise<BatchProcessingResult> {
  try {
    console.log(`🔍 Fetching dependencies for ${owner}/${repo} (page ${page})`);
    
    // First, check if the repository exists
    console.log("📡 Checking if repository exists...");
    const repoCheck = await octokit.repos.get({ owner, repo });
    console.log("✅ Repository found:", repoCheck.data.full_name);

    // Discover packages in the repository
    const packages = await discoverPackages(owner, repo);
    console.log(`📦 Found ${packages.length} packages in repository`);

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
        processedPackages: Math.min(allDependents.length, packages.length),
        totalPackages: packages.length
      };
      onProgress?.(result);
      return result;
    };

    for (let i = 0; i < packages.length; i += BATCH_SIZE) {
      const batch = packages.slice(i, i + BATCH_SIZE);
      console.log(`🔄 Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(packages.length / BATCH_SIZE)}`);

      // Check rate limit before processing batch
      const canContinue = await checkRateLimit();
      if (!canContinue) {
        console.log("⚠️ Rate limit reached, stopping batch processing");
        isPartialResult = true;
        batchError = formatRateLimitError({ status: 403 } as GitHubError);
        emitProgress();
        break;
      }

      try {
        const batchPromises = batch.map(async (pkg) => {
          console.log(`🔎 Searching for dependents of package: ${pkg.name}`);
          
          for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
            try {
              const response = await octokit.search.code({
                q: `"${pkg.name}":  filename:package.json`,
                per_page: perPage,
                page,
              });

              console.log(`📊 Found ${response.data.total_count} potential dependents for ${pkg.name}`);

              // Process repositories for this package
              const uniqueRepos = new Map();
              for (const item of response.data.items) {
                if (item.repository && !uniqueRepos.has(item.repository.node_id)) {
                  uniqueRepos.set(item.repository.node_id, item.repository);
                }
              }

              // Process each unique repository
              for (const repo of uniqueRepos.values()) {
                try {
                  const commits = await octokit.repos.listCommits({
                    owner: repo.owner.login,
                    repo: repo.name,
                    per_page: 1,
                  });

                  const lastCommitDate = commits.data[0]?.commit?.committer?.date;
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
              break; // Success, exit retry loop
            } catch (err) {
              const error = err as GitHubError;
              if (isRateLimitError(error)) {
                if (retryCount < MAX_RETRIES - 1) {
                  console.warn(`⚠️ Rate limit hit, attempt ${retryCount + 1}/${MAX_RETRIES}, backing off...`);
                  await exponentialBackoff(retryCount);
                  continue;
                }
                console.warn(`⚠️ Rate limit hit after ${MAX_RETRIES} retries`);
                isPartialResult = true;
                batchError = formatRateLimitError(error);
                emitProgress();
                break;
              }
              throw error;
            }
          }
        });

        // Wait for all promises in the batch, even if some failed
        const results = await Promise.allSettled(batchPromises);
        
        // Log any rejections but continue with the results we have
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`⚠️ Failed to process package ${batch[index].name}:`, result.reason);
          }
        });

        if (isPartialResult) {
          console.log("⚠️ Stopping batch processing due to rate limits");
          break;
        }

        // Add delay between batches if there are more to process
        if (i + BATCH_SIZE < packages.length) {
          console.log(`😴 Waiting ${BATCH_DELAY_MS}ms before next batch...`);
          await sleep(BATCH_DELAY_MS);
        }
      } catch (error) {
        console.error(`❌ Error processing batch:`, error);
        isPartialResult = true;
        batchError = error instanceof Error ? error.message : "Unknown batch error";
        emitProgress();
        break;
      }
    }

    return emitProgress();
  } catch (err) {
    const error = err as GitHubError;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    console.error("❌ Error fetching dependent projects:", {
      error: isRateLimitError(error) ? formatRateLimitError(error) : errorMessage,
      owner,
      repo,
      page,
    });
    
    return {
      data: [],
      hasNextPage: false,
      isPartialResult: true,
      error: isRateLimitError(error) ? formatRateLimitError(error) : "Failed to fetch dependent projects"
    };
  }
}
