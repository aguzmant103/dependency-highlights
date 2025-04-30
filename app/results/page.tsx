import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ResultsDashboard } from "@/components/results-dashboard"
import { CLILoading } from "@/components/cli-loading"
import { Sidebar } from "@/components/sidebar"
import { ArrowLeftIcon } from "@radix-ui/react-icons"
import { fetchDependentProjects } from "@/lib/github"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "UseTrace",
  description: "View projects that depend on a specific repository",
}

interface PageProps {
  searchParams: Promise<{
    owner?: string;
    repo?: string;
  }>;
}

export default async function ResultsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const owner = typeof resolvedSearchParams.owner === "string" ? resolvedSearchParams.owner : "";
  const repo = typeof resolvedSearchParams.repo === "string" ? resolvedSearchParams.repo : "";

  // Fetch initial data
  let initialData;
  try {
    // Start fetching data with progress updates
    initialData = await fetchDependentProjects(owner, repo, 1, 100, (progress) => {
      console.log("📊 Progress update:", {
        found: progress.data.length,
        processed: progress.processedPackages,
        total: progress.totalPackages,
        isPartial: progress.isPartialResult
      });
    });
  } catch (error) {
    console.error("Failed to fetch initial data:", error);
    // We'll let the component handle the error state
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link href="/">
                <Button variant="ghost" className="gap-1.5 text-solv-lightPurple hover:bg-solv-purple/10">
                  <ArrowLeftIcon className="h-4 w-4" /> Back to Search
                </Button>
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tighter mb-2 text-solv-lightPurple">
              Projects Depending on{" "}
              <span className="inline-block bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white shadow-md animate-fade-in">
                {owner}/{repo}
              </span>
            </h1>
            <p className="text-muted-foreground">
              Showing projects that depend on this repository, with recently active ones highlighted
            </p>
          </div>

          <Suspense fallback={<CLILoading owner={owner} repo={repo} />}>
            <ResultsDashboard owner={owner} repo={repo} initialData={initialData} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
