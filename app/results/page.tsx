import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ResultsDashboard } from "@/components/results-dashboard"
import { ResultsLoading } from "@/components/results-loading"
import { Sidebar } from "@/components/sidebar"
import { ArrowLeftIcon } from "@radix-ui/react-icons"

export default async function ResultsPage({ searchParams }: { searchParams: Record<string, string> }) {
  // Await searchParams if it's a Promise (per Next.js latest API)
  const params = typeof searchParams.then === "function" ? await searchParams : searchParams
  const owner = params.owner || ""
  const repo = params.repo || ""

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
            <div className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</div>
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

          <Suspense fallback={<ResultsLoading />}>
            <ResultsDashboard owner={owner} repo={repo} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
