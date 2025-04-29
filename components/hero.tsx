import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon } from "@radix-ui/react-icons"

export function Hero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-solv-purple to-solv-lightPurple bg-clip-text text-foreground">
              Discover Your Project&apos;s Ecosystem
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Find projects that depend on your GitHub repository and explore real-world usage patterns.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Link href="#search">
              <Button size="lg" className="gap-1.5 bg-solv-purple text-white hover:bg-solv-accent">
                Get Started <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="border-solv-purple/50 text-solv-lightPurple hover:bg-solv-purple/10"
              >
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
