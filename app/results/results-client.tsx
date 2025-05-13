"use client"

import { useState } from "react"
import { ResultsDashboard } from "@/components/results-dashboard"
import { PackageSelection } from "@/components/package-selection"
import { ResultsLoading } from "@/components/results-loading"
import { Badge } from "@/components/ui/badge"
import { Stepper } from "@/components/stepper"

interface ResultsClientProps {
  owner: string;
  repo: string;
}

export function ResultsClient({ owner, repo }: ResultsClientProps) {
  console.log('\n[ResultsClient] 🔄 Rendering');
  console.log('[ResultsClient] ├─ Props:', { 
    owner, 
    repo,
    hasOwner: Boolean(owner),
    hasRepo: Boolean(repo),
    ownerType: typeof owner,
    repoType: typeof repo,
    validation: {
      ownerValid: typeof owner === 'string' && owner.length > 0,
      repoValid: typeof repo === 'string' && repo.length > 0
    }
  });

  // Validate required props
  if (!owner || !repo) {
    console.error('[ResultsClient] ❌ Missing required props:', {
      owner: { value: owner, type: typeof owner },
      repo: { value: repo, type: typeof repo }
    });
  }

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const handlePackageSelection = async (packages: string[]) => {
    setSelectedPackages(packages);
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  if (isAnalyzing) {
    return (
      <>
        <Stepper step={2} />
        <div className="mb-4 text-lg font-semibold text-solv-lightPurple">Step 2: Finding Dependent Projects</div>
        <ResultsLoading />
      </>
    );
  }

  if (selectedPackages.length === 0) {
    return (
      <>
        <Stepper step={1} />
        <div className="mb-4 text-lg font-semibold text-solv-lightPurple">Step 1: Select Packages to Analyze</div>
        <div className="mb-2 text-muted-foreground">Select which packages in this repository you want to analyze for dependents. Only selected packages will be used in the next step.</div>
        <PackageSelection 
          owner={owner} 
          repo={repo} 
          onSelectionComplete={handlePackageSelection} 
        />
      </>
    );
  }

  return (
    <>
      <Stepper step={2} />
      <div className="mb-4 text-lg font-semibold text-solv-lightPurple">Step 2: Dependent Projects</div>
      <div className="mb-2 text-muted-foreground">Analyzing dependent projects for the following packages:</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedPackages.map(pkg => (
          <Badge key={pkg} variant="outline" className="bg-solv-purple/10 text-solv-lightPurple border-solv-purple/20">{pkg}</Badge>
        ))}
      </div>
      <ResultsDashboard selectedPackages={selectedPackages} owner={owner} repo={repo} />
    </>
  );
} 