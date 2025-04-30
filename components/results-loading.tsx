import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ReloadIcon } from "@radix-ui/react-icons"

export function ResultsLoading() {
  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="bg-solv-card border-solv-purple/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Analyzing Dependencies</div>
              <div className="text-sm text-muted-foreground">
                <ReloadIcon className="h-4 w-4 animate-spin inline-block mr-2" />
                Processing...
              </div>
            </div>
            <div className="h-2 bg-solv-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-solv-purple transition-all duration-500 ease-in-out"
                style={{ 
                  width: '100%',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Searching for dependent projects...</p>
              <p className="mt-1">This may take a few moments depending on the number of packages selected.</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card className="bg-solv-card border-solv-purple/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-solv-purple/20 bg-solv-background/50">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">#</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Project Name</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Package</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Stars</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Forks</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground">Last Commit</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-solv-purple/10">
                  <td className="p-4">
                    <Skeleton className="h-4 w-6 bg-solv-purple/10" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-32 bg-solv-purple/10" />
                    <Skeleton className="h-3 w-48 mt-1 bg-solv-purple/10" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-24 bg-solv-purple/10" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-12 bg-solv-purple/10" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-12 bg-solv-purple/10" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-24 bg-solv-purple/10" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
