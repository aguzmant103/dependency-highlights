"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Package {
  name: string;
  type: string;
  path: string;
}

interface PackageSelectionProps {
  onSelectionComplete: (selectedPackages: string[]) => void;
}

const mockPackages: Package[] = [
  {
    name: "react",
    type: "dependency",
    path: "package.json"
  },
  {
    name: "next",
    type: "dependency",
    path: "package.json"
  },
  {
    name: "typescript",
    type: "devDependency",
    path: "package.json"
  },
  {
    name: "tailwindcss",
    type: "devDependency",
    path: "package.json"
  },
  {
    name: "eslint",
    type: "devDependency",
    path: "package.json"
  },
  {
    name: "prettier",
    type: "devDependency",
    path: "package.json"
  }
];

export function PackageSelection({ onSelectionComplete }: PackageSelectionProps) {
  const [packages] = useState<Package[]>(mockPackages);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const togglePackage = (packageName: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageName)
        ? prev.filter(p => p !== packageName)
        : [...prev, packageName]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-solv-card border-solv-purple/20">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-solv-lightPurple">Loading Packages...</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-solv-purple/20 bg-solv-background animate-pulse">
                    <div className="h-4 bg-solv-purple/10 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-solv-purple/10 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
              Showing packages in this repository. Select which ones you want to find dependent projects.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
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