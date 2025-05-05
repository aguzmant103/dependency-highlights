"use client"

import { useState } from "react"
import { ResultsDashboard } from "@/components/results-dashboard"
import { PackageSelection } from "@/components/package-selection"
import { ResultsLoading } from "@/components/results-loading"
import { Badge } from "@/components/ui/badge"

interface ResultsClientProps {
  owner: string;
  repo: string;
}

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className={`flex items-center gap-2 ${step === 1 ? 'font-bold text-white' : 'text-muted-foreground'}`}> 
        <span className={`rounded-full w-6 h-6 flex items-center justify-center border-2 ${step === 1 ? 'border-solv-purple bg-solv-purple text-white' : 'border-muted-foreground bg-transparent text-muted-foreground'}`}>1</span>
        <span>Packages</span>
      </div>
      <div className="h-0.5 w-8 bg-muted-foreground/30" />
      <div className={`flex items-center gap-2 ${step === 2 ? 'font-bold text-white' : 'text-muted-foreground'}`}> 
        <span className={`rounded-full w-6 h-6 flex items-center justify-center border-2 ${step === 2 ? 'border-solv-purple bg-solv-purple text-white' : 'border-muted-foreground bg-transparent text-muted-foreground'}`}>2</span>
        <span>Dependents</span>
      </div>
    </div>
  )
}

export function ResultsClient({ owner, repo }: ResultsClientProps) {
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
        <PackageSelection onSelectionComplete={handlePackageSelection} />
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
      <ResultsDashboard owner={owner} repo={repo} />
    </>
  );
} 