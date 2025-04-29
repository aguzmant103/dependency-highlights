"use client"

import { GitFork, Star, ArrowUpRight, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { fetchDependentProjects } from "@/lib/github"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "@radix-ui/react-icons"
import { useState, useEffect, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import { DependentProject } from "@/lib/github"

interface ResultsDashboardProps {
  owner: string;
  repo: string;
  initialData?: {
    data: DependentProject[];
    hasNextPage: boolean;
    isPartialResult: boolean;
    error?: string;
    processedPackages?: number;
    totalPackages?: number;
  };
}

export function ResultsDashboard({ owner, repo, initialData }: ResultsDashboardProps) {
  console.log("🔄 ResultsDashboard rendered with props:", { owner, repo, initialData });

  const [projects, setProjects] = useState<DependentProject[]>(initialData?.data || []);
  const [hasNextPage, setHasNextPage] = useState(initialData?.hasNextPage || false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isPartialResult, setIsPartialResult] = useState(initialData?.isPartialResult || false);
  const [error, setError] = useState(initialData?.error);
  const [progress, setProgress] = useState({
    processed: initialData?.processedPackages || 0,
    total: initialData?.totalPackages || 0
  });
  const { ref, inView } = useInView();

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setProjects(initialData.data);
      setHasNextPage(initialData.hasNextPage);
      setIsPartialResult(initialData.isPartialResult);
      setError(initialData.error);
      setProgress({
        processed: initialData.processedPackages || 0,
        total: initialData.totalPackages || 0
      });
    }
  }, [initialData]);

  const loadMoreProjects = useCallback(async () => {
    if (isLoading || !hasNextPage || isPartialResult) {
      console.log("⏭️ Skipping load more:", { isLoading, hasNextPage, isPartialResult });
      return;
    }

    try {
      console.log("📥 Loading more projects...", { page: page + 1 });
      setIsLoading(true);
      const nextPage = page + 1;
      const response = await fetchDependentProjects(owner, repo, nextPage);
      
      console.log("✅ Loaded more projects:", {
        newItems: response.data.length,
        hasMore: response.hasNextPage,
        isPartialResult: response.isPartialResult,
        error: response.error,
      });

      setProjects((prev) => [...prev, ...response.data]);
      setHasNextPage(response.hasNextPage);
      setIsPartialResult(response.isPartialResult);
      setError(response.error);
      setPage(nextPage);
    } catch (error) {
      console.error("❌ Failed to load more projects:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setIsPartialResult(true);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasNextPage, isPartialResult, owner, repo, page]);

  // Load more projects when the last item comes into view
  useEffect(() => {
    console.log("👁️ Intersection observer state:", { inView });
    if (inView) {
      loadMoreProjects();
    }
  }, [inView, loadMoreProjects]);

  if (projects.length === 0) {
    console.log("ℹ️ No projects found");
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-2 text-solv-lightPurple">
          {error ? 'Error Loading Dependencies' : 'No dependent projects found'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {error || `We couldn't find any projects that depend on ${owner}/${repo}`}
        </p>
        <Link href="/">
          <Button className="bg-solv-purple hover:bg-solv-accent">Try Another Repository</Button>
        </Link>
      </div>
    );
  }

  // Calculate total stats
  console.log("📊 Calculating stats for", projects.length, "projects");
  const totalStars = projects.reduce((sum, project) => sum + (project.stars || 0), 0);
  const totalForks = projects.reduce((sum, project) => sum + (project.forks || 0), 0);
  const activeProjects = projects.filter((project) => project.isActive).length;

  return (
    <div className="space-y-6">
      {/* Progress Bar - Show only during initial load or when partial */}
      {((progress.processed < progress.total) || isPartialResult) && (
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Scanning Dependencies</div>
                <div className="text-sm text-muted-foreground">
                  {progress.processed} / {progress.total} packages
                </div>
              </div>
              <div className="h-2 bg-solv-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-solv-purple transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${Math.round((progress.processed / progress.total) * 100)}%`
                  }}
                />
              </div>
              {isPartialResult && (
                <p className="text-xs text-yellow-400">
                  Rate limit reached - showing partial results
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Dependent Projects</div>
            <div className="text-3xl font-bold mt-2">
              {projects.length}{isPartialResult && '+'}
            </div>
            {isPartialResult && (
              <div className="text-xs text-muted-foreground mt-1">Partial results</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Active Projects</div>
            <div className="text-3xl font-bold mt-2 text-green-400">{activeProjects}</div>
          </CardContent>
        </Card>
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Stars</div>
            <div className="text-3xl font-bold mt-2 text-yellow-400">{totalStars?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Forks</div>
            <div className="text-3xl font-bold mt-2 text-solv-lightPurple">{totalForks?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        
        {isPartialResult && (
          <Card className="col-span-full bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                    Rate Limit Exceeded
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {error || "Some results may be missing due to GitHub API rate limits."}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Results shown may be incomplete</li>
                    <li>Try again in a few minutes</li>
                    <li>Consider using a GitHub token with higher rate limits</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dependent Projects</h2>
        <Button variant="outline" size="sm" className="gap-1.5 border-solv-purple/20 text-muted-foreground">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* Projects Table */}
      <Card className="bg-solv-card border-solv-purple/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-solv-purple/20 bg-solv-background/50">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">#</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Project Name</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Package</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Stars</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Forks</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Last Commit</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  className={`border-b border-solv-purple/10 hover:bg-solv-purple/5 ${
                    project.isActive ? "bg-green-500/5" : ""
                  }`}
                >
                  <td className="p-4 text-sm">{index + 1}</td>
                  <td className="p-4">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{project.description}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                      {project.package}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <span>{(project.stars || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <GitFork className="h-3.5 w-3.5 text-solv-lightPurple" />
                      <span>{(project.forks || 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{project.lastCommit}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {project.isActive ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        Inactive
                      </Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-solv-lightPurple hover:bg-solv-purple/10"
                      >
                        View <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Infinite Scroll Trigger */}
        {(hasNextPage || isLoading) && !isPartialResult && (
          <div
            ref={ref}
            className="py-4 text-center text-sm text-muted-foreground"
          >
            {isLoading ? "Loading more projects..." : "Scroll to load more"}
          </div>
        )}
      </Card>
    </div>
  );
}
