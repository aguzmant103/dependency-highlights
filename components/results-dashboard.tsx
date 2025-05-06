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
}

interface ResultsDashboardProps {
  selectedPackages: string[];
}

export function ResultsDashboard({ selectedPackages }: ResultsDashboardProps): JSX.Element {
  const [projects, setProjects] = useState<DependentRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('\n[ResultsDashboard] 🔍 Starting dependency discovery');
        console.log(`[ResultsDashboard] ├─ Selected packages: ${selectedPackages.join(', ')}`);
        
        // Fetch dependencies for each selected package
        const allDependencies: DependentRepository[] = [];
        const processedRepos = new Set<string>();

        for (const pkg of selectedPackages) {
          console.log(`\n[ResultsDashboard] ├─ Processing package: ${pkg}`);
          
          try {
            const response = await fetch(`/api/github-packages?package=${encodeURIComponent(pkg)}`);
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
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
                  stars: repo.stars || 0
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
  }, [selectedPackages]);

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
