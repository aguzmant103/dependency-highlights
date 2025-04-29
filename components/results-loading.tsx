import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ReloadIcon } from "@radix-ui/react-icons"

export function ResultsLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-solv-card border-solv-purple/20">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 bg-solv-purple/10" />
              <Skeleton className="h-8 w-16 mt-2 bg-solv-purple/10" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Loading */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-40 bg-solv-purple/10" />
        <Skeleton className="h-8 w-20 bg-solv-purple/10" />
      </div>

      <Card className="bg-solv-card border-solv-purple/20 p-6">
        <div className="flex items-center justify-center py-12">
          <ReloadIcon className="h-8 w-8 animate-spin text-solv-purple" />
          <span className="ml-2 text-xl text-solv-lightPurple">Scanning GitHub for dependent projects...</span>
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-4 border-b border-solv-purple/10">
            <Skeleton className="h-5 w-full mb-2 bg-solv-purple/10" />
            <Skeleton className="h-4 w-2/3 bg-solv-purple/10" />
          </div>
        ))}
      </Card>
    </div>
  )
}
