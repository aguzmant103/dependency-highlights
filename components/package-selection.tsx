"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PackageSelectionProps {
  owner: string;
  repo: string;
  onSelectionComplete: (packages: string[]) => void;
}

interface Package {
  name: string;
  type: string;
  path: string;
}

export function PackageSelection({ owner, repo, onSelectionComplete }: PackageSelectionProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPackages() {
      try {
        setIsLoading(true);
        setError(null);
        console.log('\n[PackageSelection] 🔍 Starting package discovery process');
        console.log(`[PackageSelection] ├─ Repository: ${owner}/${repo}`);
        
        const response = await fetch('/api/github-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner, repo }),
        });
        
        console.log(`[PackageSelection] ├─ API Response status: ${response.status}`);
        const data = await response.json();
        
        if (!response.ok) {
          console.log(`[PackageSelection] ├─ ❌ API Error: ${data.error || 'Unknown error'}`);
          throw new Error(data.error || 'Failed to load packages');
        }
        
        console.log(`[PackageSelection] ├─ Received ${data.packages?.length || 0} packages from API`);
        
        const formattedPackages = data.packages.map((pkg: { name: string; type: string; path: string }) => {
          console.log(`[PackageSelection] ├─ Processing package: ${pkg.name} (${pkg.type}) at ${pkg.path}`);
          return {
            name: pkg.name,
            type: pkg.type,
            path: pkg.path
          };
        });
        
        console.log(`[PackageSelection] └─ ✅ Successfully processed ${formattedPackages.length} packages`);
        setPackages(formattedPackages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load packages';
        console.error('[PackageSelection] ❌ Error during package discovery:', {
          message: errorMessage,
          error: err,
          repository: `${owner}/${repo}`
        });
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    loadPackages();
  }, [owner, repo]);

  const togglePackage = (packageName: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageName)
        ? prev.filter(p => p !== packageName)
        : [...prev, packageName]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solv-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="p-4 text-muted-foreground">
        No packages found in this repository. This could mean either:
        <ul className="list-disc list-inside mt-2">
          <li>The repository doesn&apos;t have any packages in the packages/ directory</li>
          <li>The packages are private and require authentication</li>
          <li>The repository uses a different package structure</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-solv-card border-solv-purple/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-solv-lightPurple">Select Packages to Analyze</h2>
              <div className="text-sm text-muted-foreground">
                {selectedPackages.length} of {packages.length} selected
              </div>
            </div>
            <p className="text-muted-foreground mb-2">
              Found {packages.length} package(s) in the packages/ directory. Select which ones you want to analyze.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div
                  key={pkg.path}
                  role="button"
                  tabIndex={0}
                  onClick={() => togglePackage(pkg.name)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') togglePackage(pkg.name) }}
                  aria-pressed={selectedPackages.includes(pkg.name)}
                  className={`p-4 rounded-lg border cursor-pointer select-none transition-all duration-200 outline-none
                    ${selectedPackages.includes(pkg.name)
                      ? 'bg-blue-700/80 border-blue-400 text-white shadow-xl hover:shadow-2xl'
                      : 'bg-solv-background border-solv-purple/20 text-solv-lightPurple hover:bg-solv-purple/20 hover:border-solv-lightPurple'}
                    focus-visible:ring-2 focus-visible:ring-blue-400
                    hover:shadow-lg active:scale-95 active:bg-blue-800/80`
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{pkg.name}</div>
                    <Badge variant="outline" className="bg-solv-purple/10 text-solv-lightPurple border-solv-purple/20">
                      {pkg.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{pkg.path}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                onClick={() => onSelectionComplete(selectedPackages)}
                disabled={selectedPackages.length === 0}
                className={`bg-solv-purple hover:bg-solv-accent border-2 transition-all duration-200
                  ${selectedPackages.length > 0 ? 'border-blue-400' : 'border-solv-purple/30'}`}
              >
                Analyze Selected Packages
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 