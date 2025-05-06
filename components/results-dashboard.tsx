"use client"

import { useState, useEffect } from "react"
import { GitFork, Star, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "@radix-ui/react-icons"
import { fetchDependentProjects } from "@/lib/github"
import { SortableProjectList } from "@/components/sortable-project-list"
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Dependent Projects</h2>
          <p className="text-sm text-muted-foreground">
            Showing {projects.length} projects
          </p>
        </div>
        <SortableProjectList projects={projects} />
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
    </div>
  );
}
