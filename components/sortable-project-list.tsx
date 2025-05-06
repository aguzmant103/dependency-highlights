"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GitFork, Star, ArrowUpDown } from "lucide-react"
import { DependentProject } from "@/lib/mock-data"

interface SortableProjectListProps {
  projects: DependentProject[];
}

export function SortableProjectList({ projects: initialProjects }: SortableProjectListProps) {
  const [projects, setProjects] = useState(initialProjects);
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
  );
} 