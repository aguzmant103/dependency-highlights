import { SearchForm } from "@/components/search-form"
import { Hero } from "@/components/hero"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Hero />
        <SearchForm />
      </main>
      <footer className="border-t border-solv-purple/20 py-6 md:py-8">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} UseTrace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
