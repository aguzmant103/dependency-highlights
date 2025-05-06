"use client"

import { useState } from "react"
import { PackageSelection } from "@/components/package-selection"
import { ResultsDashboard } from "@/components/results-dashboard"
import { Badge } from "@/components/ui/badge"
import { Stepper } from "@/components/stepper"

interface PackageSelectionWrapperProps {
  owner: string;
  repo: string;
}

export function PackageSelectionWrapper({ owner, repo }: PackageSelectionWrapperProps) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const handlePackageSelection = async (packages: string[]) => {
    setSelectedPackages(packages);
  };

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
      <ResultsDashboard selectedPackages={selectedPackages} />
    </>
  );
} 