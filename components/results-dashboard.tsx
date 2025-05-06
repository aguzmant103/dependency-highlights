"use client"

import { useState, useEffect } from "react"
import { fetchDependentProjects } from "@/lib/github"
import { SortableDependentProjects } from "@/components/sortable-dependent-projects"
import type { DependentProject } from "@/lib/mock-data"

interface ResultsDashboardProps {
  owner: string;
  repo: string;
}

export function ResultsDashboard({ owner, repo }: ResultsDashboardProps): JSX.Element {
  const [projects, setProjects] = useState<DependentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetchDependentProjects(owner, repo);
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [owner, repo]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading dependent projects...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">No dependent projects found</h2>
        <p className="text-muted-foreground">
          We couldn&apos;t find any projects that depend on {owner}/{repo}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Dependent Projects</h2>
        <p className="text-sm text-muted-foreground">
          Found {projects.length} projects depending on this repository
        </p>
      </div>
      <SortableDependentProjects projects={projects} />
    </div>
  );
}
