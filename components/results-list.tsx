import { GitFork, Star, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fetchDependentProjects } from "@/lib/github"
import { CalendarIcon } from "@radix-ui/react-icons"

export async function ResultsList({ owner, repo }: { owner: string; repo: string }) {
  // In a real implementation, this would call the GitHub API
  // For this example, we'll use mock data
  const response = await fetchDependentProjects(owner, repo)

  if (response.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-2">No dependent projects found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find any projects that depend on {owner}/{repo}
        </p>
        <Link href="/">
          <Button>Try Another Repository</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {response.data.map((project) => (
        <Card key={project.id} className={project.isActive ? "border-green-500 border-2" : ""}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{project.name}</CardTitle>
              {project.isActive && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">
                  Active
                </Badge>
              )}
            </div>
            <CardDescription>{project.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{project.stars.toLocaleString()} stars</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <GitFork className="h-4 w-4" />
                <span>{project.forks.toLocaleString()} forks</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4" />
                <span>Last commit: {project.lastCommit}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                View on GitHub <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
