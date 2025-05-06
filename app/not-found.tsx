import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  )
} 