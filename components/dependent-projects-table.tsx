import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { GitFork, Star, ExternalLink } from "lucide-react"
import { DependentProject } from "@/lib/mock-data"
import Link from "next/link"

interface DependentProjectsTableProps {
  projects: DependentProject[]
}

function isProjectActive(lastUpdated: string) {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  return new Date(lastUpdated) > threeMonthsAgo
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function DependentProjectsTable({ projects }: DependentProjectsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>
              <div className="flex items-center">
                <Star className="mr-2 h-4 w-4" />
                Stars
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center">
                <GitFork className="mr-2 h-4 w-4" />
                Forks
              </div>
            </TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                {project.name}
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </TableCell>
              <TableCell>{project.stars.toLocaleString()}</TableCell>
              <TableCell>{project.forks.toLocaleString()}</TableCell>
              <TableCell>{formatDate(project.lastUpdated)}</TableCell>
              <TableCell>
                <Badge
                  variant={isProjectActive(project.lastUpdated) ? "default" : "secondary"}
                  className={isProjectActive(project.lastUpdated) ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
                >
                  {isProjectActive(project.lastUpdated) ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 