import { mockDependentProjects, DependentProject } from './mock-data';

interface DependentProjectsResponse {
  data: DependentProject[];
}

export async function fetchDependentProjects(owner: string, repo: string): Promise<DependentProjectsResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filter mock data based on owner/repo and active status
  const activeProjects = mockDependentProjects.filter((project: DependentProject) => 
    project.isActive && project.owner === owner && project.package === repo
  );

  return {
    data: activeProjects
  };
} 