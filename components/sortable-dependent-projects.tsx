"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { DependentProject } from "@/lib/mock-data"
import { DependentProjectsTable } from "./dependent-projects-table"

interface SortableDependentProjectsProps {
  projects: DependentProject[]
}

type SortKey = 'name' | 'stars' | 'forks' | 'lastUpdated'

export function SortableDependentProjects({ projects: initialProjects }: SortableDependentProjectsProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null
    direction: 'asc' | 'desc' | null
  }>({
    key: null,
    direction: null,
  })

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })

    const sortedProjects = [...projects].sort((a, b) => {
      if (key === 'lastUpdated') {
        const dateA = new Date(a[key])
        const dateB = new Date(b[key])
        return direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }
      
      const aValue = a[key]
      const bValue = b[key]
      
      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1
      }
      return aValue < bValue ? 1 : -1
    })
    setProjects(sortedProjects)
  }

  const getSortIndicator = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    }
    return (
      <ArrowUpDown
        className={`h-4 w-4 ${
          sortConfig.direction === 'desc' ? 'text-primary' : 'text-primary rotate-180'
        }`}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleSort('name')}>
          Sort by Name {getSortIndicator('name')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleSort('stars')}>
          Sort by Stars {getSortIndicator('stars')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleSort('forks')}>
          Sort by Forks {getSortIndicator('forks')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleSort('lastUpdated')}>
          Sort by Last Updated {getSortIndicator('lastUpdated')}
        </Button>
      </div>
      <DependentProjectsTable projects={projects} />
    </div>
  )
} 