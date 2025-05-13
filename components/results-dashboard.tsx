"use client"

import { useState, useEffect } from "react"
import { SortableDependentProjects } from "@/components/sortable-dependent-projects"

interface DependentRepository {
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

interface ResultsDashboardProps {
  selectedPackages: string[];
  owner: string;
  repo: string;
}

export function ResultsDashboard({ selectedPackages, owner, repo }: ResultsDashboardProps): JSX.Element {
  const [projects, setProjects] = useState<DependentRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add debug logging for props
  console.log('\n[ResultsDashboard] 🔄 Component rendered with props:', {
    owner,
    repo,
    selectedPackages,
    hasOwner: Boolean(owner),
    hasRepo: Boolean(repo),
    ownerType: typeof owner,
    repoType: typeof repo,
    selectedPackagesType: typeof selectedPackages,
    selectedPackagesLength: selectedPackages?.length,
    selectedPackagesContent: selectedPackages,
    propsValidation: {
      ownerValid: typeof owner === 'string' && owner.length > 0,
      repoValid: typeof repo === 'string' && repo.length > 0,
      packagesValid: Array.isArray(selectedPackages) && selectedPackages.length > 0
    }
  });

  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('\n[ResultsDashboard] 🔍 Starting dependency discovery');
        console.log(`[ResultsDashboard] ├─ Initial props:`, { 
          owner, 
          repo, 
          selectedPackages,
          ownerType: typeof owner,
          repoType: typeof repo,
          packagesType: typeof selectedPackages
        });

        // Validate required props
        if (!owner || !repo) {
          const error = `Missing required props: ${!owner ? 'owner' : ''} ${!repo ? 'repo' : ''}`.trim();
          console.error(`[ResultsDashboard] ❌ ${error}`);
          setError(error);
          setIsLoading(false);
          return;
        }
        
        // Fetch dependencies for each selected package
        const allDependencies: DependentRepository[] = [];
        const processedRepos = new Set<string>();

        for (const pkg of selectedPackages) {
          console.log(`\n[ResultsDashboard] ├─ Processing package: ${pkg}`);
          
          // Construct URL with all required parameters
          const urlParams = new URLSearchParams();
          urlParams.append('owner', owner);
          urlParams.append('repo', repo);
          urlParams.append('package', pkg);
          
          const url = `/api/github-packages?${urlParams.toString()}`;
          
          console.log(`[ResultsDashboard] ├─ Request details:`, {
            owner,
            repo,
            package: pkg,
            url,
            params: Object.fromEntries(urlParams.entries()),
            validation: {
              ownerValid: Boolean(owner),
              repoValid: Boolean(repo),
              packageValid: Boolean(pkg),
              urlValid: url.includes(owner) && url.includes(repo)
            }
          });
          
          // Skip request if required parameters are missing
          if (!owner || !repo) {
            console.error(`[ResultsDashboard] ├─ ❌ Skipping request - missing required parameters:`, {
              hasOwner: Boolean(owner),
              hasRepo: Boolean(repo),
              hasPackage: Boolean(pkg)
            });
            continue;
          }
          
          try {
            const response = await fetch(url);
            console.log(`[ResultsDashboard] ├─ Response status: ${response.status}`);
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
              console.error(`[ResultsDashboard] ├─ Error response:`, errorData);
              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json().catch(() => ({ items: [] }));
            const items = data?.items || [];
            
            console.log(`[ResultsDashboard] ├─ Found ${items.length} dependencies for ${pkg}`);
            
            // Add new dependencies, avoiding duplicates
            for (const repo of items) {
              if (repo && repo.fullName && !processedRepos.has(repo.fullName)) {
                processedRepos.add(repo.fullName);
                allDependencies.push({
                  name: repo.name || '',
                  fullName: repo.fullName,
                  description: repo.description,
                  url: repo.url || '',
                  lastUpdated: repo.lastUpdated || new Date().toISOString(),
                  stars: repo.stars || 0,
                  forks: repo.forks || 0,
                  dependencyType: repo.dependencyType || 'unknown',
                  dependencyVersion: repo.dependencyVersion || 'unknown',
                  isWorkspace: repo.isWorkspace || false,
                  isPrivate: repo.isPrivate || false
                });
              }
            }
          } catch (err) {
            console.error(`[ResultsDashboard] ├─ ❌ Error processing ${pkg}:`, err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dependencies';
            console.log(`[ResultsDashboard] ├─ Error details: ${errorMessage}`);
          }
        }

        console.log(`[ResultsDashboard] └─ ✅ Total unique dependent repositories found: ${allDependencies.length}`);
        setProjects(allDependencies);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dependent projects';
        console.error('[ResultsDashboard] ❌ Error during dependency discovery:', {
          message: errorMessage,
          error: err
        });
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedPackages.length > 0) {
      loadProjects();
    } else {
      setIsLoading(false);
      setProjects([]);
    }
  }, [selectedPackages, owner, repo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solv-purple"></div>
          <div className="text-sm text-muted-foreground">Searching for dependent projects...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
        <h2 className="text-2xl font-bold mb-2">Error loading dependencies</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">No dependent projects found</h2>
        <p className="text-muted-foreground">
          We couldn&apos;t find any projects that depend on the selected packages
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Dependent Projects</h2>
        <p className="text-sm text-muted-foreground">
          Found {projects.length} projects depending on the selected packages
        </p>
      </div>
      <SortableDependentProjects projects={projects} />
    </div>
  );
}
