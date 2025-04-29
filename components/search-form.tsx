"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Github } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parseRepoUrl } from "@/lib/github"
import { toast } from "sonner"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"

export function SearchForm() {
  const [repoUrl, setRepoUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { owner, repo } = parseRepoUrl(repoUrl.trim())
      router.push(`/results?owner=${owner}&repo=${repo}`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid repository format. Please use 'owner/repo' or GitHub URL."
      )
      setIsLoading(false)
    }
  }

  return (
    <section id="search" className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <Card className="mx-auto max-w-2xl bg-solv-card border-solv-purple/20">
          <CardHeader>
            <CardTitle className="text-solv-lightPurple">Search GitHub Dependencies</CardTitle>
            <CardDescription>
              Enter a GitHub repository URL or owner/repo to discover projects that depend on it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="github.com/owner/repo or owner/repo"
                    className="pl-9 bg-solv-background border-solv-purple/20 focus-visible:ring-solv-purple"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="gap-1.5 bg-solv-purple hover:bg-solv-accent">
                  {isLoading ? "Searching..." : "Search"}
                  {!isLoading && <MagnifyingGlassIcon className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-muted-foreground">
            <p>Examples: vercel/next.js, facebook/react</p>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}
