"use client"

import { useState } from "react"
import { PackageSelection } from "@/components/package-selection"
import { ResultsLoading } from "@/components/results-loading"
import { ResultsDashboard } from "@/components/results-dashboard"
import { Badge } from "@/components/ui/badge"
import { Stepper } from "@/components/stepper"

interface PackageSelectionWrapperProps {
  owner: string;
  repo: string;
}

export function PackageSelectionWrapper({ owner, repo }: PackageSelectionWrapperProps) {
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
      <PackageSelection 
        owner={owner} 
        repo={repo} 
        onSelectionComplete={handlePackageSelection} 
      />
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
      <ResultsDashboard owner={owner} repo={repo} />
    </>
  );
} 