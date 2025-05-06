"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Star } from "lucide-react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

interface DependentRepository {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  lastUpdated: string;
  stars: number;
}

interface SortableDependentProjectsProps {
  projects: DependentRepository[];
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
              Stars
              {sortConfig.key === 'stars' && (
                <span className="ml-2">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
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
          {sortedProjects.map((project) => (
            <TableRow key={project.fullName}>
              <TableCell>
                <Link 
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-center hover:text-solv-lightPurple"
                >
                  {project.fullName}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
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
                {new Date(project.lastUpdated).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 