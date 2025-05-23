import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { ArrowLeftIcon } from "@radix-ui/react-icons"
import { ResultsClient } from "./results-client"

interface PageProps {
  searchParams: Promise<{
    owner?: string;
    repo?: string;
  }>
}

export default async function ResultsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const owner = resolvedSearchParams.owner || "";
  const repo = resolvedSearchParams.repo || "";

  // Add validation logging
  console.log('\n[ResultsPage] 🔄 Rendering with params:', {
    rawParams: resolvedSearchParams,
    processedParams: { owner, repo },
    validation: {
      hasOwner: Boolean(owner),
      hasRepo: Boolean(repo),
      ownerType: typeof owner,
      repoType: typeof repo
    }
  });

  // Validate required parameters
  if (!owner || !repo) {
    console.error('[ResultsPage] ❌ Missing required parameters:', {
      owner: { value: owner, type: typeof owner },
      repo: { value: repo, type: typeof repo }
    });
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

          <ResultsClient owner={owner} repo={repo} />
        </div>
      </div>
    </div>
  );
}
