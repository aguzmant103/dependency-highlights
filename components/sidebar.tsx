import Link from "next/link"
import { Github, Home, GitFork, Activity, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("w-64 bg-solv-card h-screen p-4 flex flex-col border-r border-solv-purple/20", className)}>
      <div className="flex items-center gap-2 mb-8">
        <Zap className="h-6 w-6 text-solv-purple" />
        <span className="text-xl font-bold text-white">UseTrace</span>
      </div>

      <div className="text-sm uppercase text-muted-foreground mb-4">Main Menu</div>

      <nav className="space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-solv-purple/10 text-muted-foreground hover:text-white"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>

        <Link href="/search" className="flex items-center gap-3 px-3 py-2 rounded-md bg-solv-purple/20 text-white">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>Search</span>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-solv-purple/10 text-muted-foreground hover:text-white"
        >
          <Github className="h-4 w-4" />
          <span>Repositories</span>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-solv-purple/10 text-muted-foreground hover:text-white"
        >
          <GitFork className="h-4 w-4" />
          <span>Dependencies</span>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-solv-purple/10 text-muted-foreground hover:text-white"
        >
          <Activity className="h-4 w-4" />
          <span>Analytics</span>
        </Link>
      </nav>

      <div className="mt-auto pt-4 border-t border-solv-purple/20">
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} UseTrace</div>
      </div>
    </div>
  )
}
