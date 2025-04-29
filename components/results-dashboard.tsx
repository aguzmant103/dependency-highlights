import { GitFork, Star, ArrowUpRight, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { fetchDependentProjects } from "@/lib/github"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "@radix-ui/react-icons"

export async function ResultsDashboard({ owner, repo }: { owner: string; repo: string }) {
  // In a real implementation, this would call the GitHub API
  // For this example, we'll use mock data
  const projects = await fetchDependentProjects(owner, repo)

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-2 text-solv-lightPurple">No dependent projects found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find any projects that depend on {owner}/{repo}
        </p>
        <Link href="/">
          <Button className="bg-solv-purple hover:bg-solv-accent">Try Another Repository</Button>
        </Link>
      </div>
    )
  }

  // Calculate total stats
  const totalStars = projects.reduce((sum, project) => sum + project.stars, 0)
  const totalForks = projects.reduce((sum, project) => sum + project.forks, 0)
  const activeProjects = projects.filter((project) => project.isActive).length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Dependent Projects</div>
            <div className="text-3xl font-bold mt-2">{projects.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Active Projects</div>
            <div className="text-3xl font-bold mt-2 text-green-400">{activeProjects}</div>
          </CardContent>
        </Card>
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Stars</div>
            <div className="text-3xl font-bold mt-2 text-yellow-400">{totalStars.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total Forks</div>
            <div className="text-3xl font-bold mt-2 text-solv-lightPurple">{totalForks.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dependent Projects</h2>
        <Button variant="outline" size="sm" className="gap-1.5 border-solv-purple/20 text-muted-foreground">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* Projects Table */}
      <Card className="bg-solv-card border-solv-purple/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-solv-purple/20 bg-solv-background/50">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">#</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Project Name</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Stars</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Forks</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Last Commit</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project.id}
                  className={`border-b border-solv-purple/10 hover:bg-solv-purple/5 ${
                    project.isActive ? "bg-green-500/5" : ""
                  }`}
                >
                  <td className="p-4 text-sm">{index + 1}</td>
                  <td className="p-4">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{project.description}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-yellow-400" />
                      <span>{project.stars.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <GitFork className="h-3.5 w-3.5 text-solv-lightPurple" />
                      <span>{project.forks.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{project.lastCommit}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {project.isActive ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                        Inactive
                      </Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-solv-lightPurple hover:bg-solv-purple/10"
                      >
                        View <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
