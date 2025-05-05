"use client"

import { GitFork, Star, ArrowUpRight, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "@radix-ui/react-icons"
import { useState } from "react"
import { mockDependentProjects, DependentProject } from "@/lib/mock-data"

interface ResultsDashboardProps {
  owner: string;
  repo: string;
}

export function ResultsDashboard({ owner, repo }: ResultsDashboardProps) {
  console.log("🔄 ResultsDashboard rendered with props:", { owner, repo });

  const [projects, setProjects] = useState<DependentProject[]>(mockDependentProjects);
  const [isLoading] = useState(false);
  const [error] = useState<string | undefined>();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DependentProject | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null
  });

  const handleSort = (key: keyof DependentProject) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedProjects = [...projects].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue === undefined || bValue === undefined) {
        return 0;
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    setProjects(sortedProjects);
  };

  const getSortIndicator = (columnKey: keyof DependentProject) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUpDown className="h-4 w-4 rotate-180" />
    ) : (
      <ArrowUpDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Dependent Projects</h2>
          <p className="text-sm text-muted-foreground">
            Showing {projects.length} projects
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleSort('stars')}>
            <Star className="mr-2 h-4 w-4" />
            Sort by Stars
            {getSortIndicator('stars')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSort('forks')}>
            <GitFork className="mr-2 h-4 w-4" />
            Sort by Forks
            {getSortIndicator('forks')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.url} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.owner}</p>
                  </div>
                  <Link href={project.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-sm">{project.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4" />
                    {project.stars.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <GitFork className="mr-1 h-4 w-4" />
                    {project.forks.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    {project.lastUpdated}
                  </div>
                </div>
                {project.isActive && (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
