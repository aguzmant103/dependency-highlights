interface DependentProject {
  id: string
  name: string
  description: string
  stars: number
  forks: number
  lastCommit: string
  isActive: boolean
  url: string
}

export async function fetchDependentProjects(owner: string, repo: string): Promise<DependentProject[]> {
  // In a real implementation, this would call the GitHub API
  // For this example, we'll return mock data

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Generate some mock data based on the repo
  return [
    {
      id: "1",
      name: "awesome-project",
      description: `A project that uses ${owner}/${repo} for amazing features`,
      stars: 1245,
      forks: 89,
      lastCommit: "2 days ago",
      isActive: true,
      url: `https://github.com/user1/awesome-project`,
    },
    {
      id: "2",
      name: "cool-app",
      description: `Modern application built with ${repo}`,
      stars: 567,
      forks: 32,
      lastCommit: "1 week ago",
      isActive: true,
      url: `https://github.com/user2/cool-app`,
    },
    {
      id: "3",
      name: "starter-template",
      description: `Starter template using ${repo} with best practices`,
      stars: 2890,
      forks: 345,
      lastCommit: "2 weeks ago",
      isActive: true,
      url: `https://github.com/user3/starter-template`,
    },
    {
      id: "4",
      name: "legacy-project",
      description: `Older project that depends on ${repo}`,
      stars: 123,
      forks: 15,
      lastCommit: "5 months ago",
      isActive: false,
      url: `https://github.com/user4/legacy-project`,
    },
    {
      id: "5",
      name: "enterprise-solution",
      description: `Enterprise-grade solution built with ${repo}`,
      stars: 456,
      forks: 67,
      lastCommit: "3 days ago",
      isActive: true,
      url: `https://github.com/user5/enterprise-solution`,
    },
    {
      id: "6",
      name: "archived-demo",
      description: `Archived demo of ${repo} integration`,
      stars: 78,
      forks: 12,
      lastCommit: "1 year ago",
      isActive: false,
      url: `https://github.com/user6/archived-demo`,
    },
  ]
}
