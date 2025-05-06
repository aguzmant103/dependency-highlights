"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Star, GitFork } from "lucide-react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

interface SortableDependentProjectsProps {
  projects: DependentRepository[];
}

function isActiveProject(lastUpdated: string): boolean {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return new Date(lastUpdated) > threeMonthsAgo;
}

function formatLastUpdated(date: string): string {
  const lastUpdatedDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastUpdatedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function SortableDependentProjects({ projects }: SortableDependentProjectsProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DependentRepository;
    direction: 'asc' | 'desc';
  }>({ key: 'stars', direction: 'desc' });

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortConfig.key === 'lastUpdated') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
        : new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
    
    if (sortConfig.key === 'description') {
      const aDesc = a.description || '';
      const bDesc = b.description || '';
      return sortConfig.direction === 'asc'
        ? aDesc.localeCompare(bDesc)
        : bDesc.localeCompare(aDesc);
    }

    if (sortConfig.key === 'stars' || sortConfig.key === 'forks') {
      return sortConfig.direction === 'asc'
        ? (a[sortConfig.key] || 0) - (b[sortConfig.key] || 0)
        : (b[sortConfig.key] || 0) - (a[sortConfig.key] || 0);
    }
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const requestSort = (key: keyof DependentRepository) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <TooltipProvider>
      <div className="rounded-md border border-solv-purple/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:text-solv-lightPurple"
                onClick={() => requestSort('name')}
              >
                Repository
                {sortConfig.key === 'name' && (
                  <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-solv-lightPurple text-right"
                onClick={() => requestSort('stars')}
              >
                <div className="flex items-center justify-end gap-1">
                  <Star className="h-4 w-4" />
                  Stars
                  {sortConfig.key === 'stars' && (
                    <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-solv-lightPurple text-right"
                onClick={() => requestSort('forks')}
              >
                <div className="flex items-center justify-end gap-1">
                  <GitFork className="h-4 w-4" />
                  Forks
                  {sortConfig.key === 'forks' && (
                    <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-solv-lightPurple text-right"
                onClick={() => requestSort('lastUpdated')}
              >
                Last Updated
                {sortConfig.key === 'lastUpdated' && (
                  <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => {
              const isActive = isActiveProject(project.lastUpdated);
              const lastUpdatedFormatted = formatLastUpdated(project.lastUpdated);
              
              return (
                <TableRow key={project.fullName}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className={cn(
                            "px-2 py-0.5 text-xs",
                            isActive 
                              ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 hover:text-green-700" 
                              : "bg-gray-200/50 text-gray-500 border-gray-200 hover:bg-gray-200/75 hover:text-gray-600"
                          )}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Last updated {lastUpdatedFormatted}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Link 
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="flex items-center hover:text-solv-lightPurple"
                      >
                        {project.fullName}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {project.description || 'No description available'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-4 w-4" />
                      {project.stars.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <GitFork className="h-4 w-4" />
                      {project.forks.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(project.lastUpdated).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
} 