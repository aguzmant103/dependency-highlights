"use client"

import { useState } from "react"
import { ResultsDashboard } from "@/components/results-dashboard"
import { PackageSelection } from "@/components/package-selection"
import { ResultsLoading } from "@/components/results-loading"

interface ResultsClientProps {
  owner: string;
  repo: string;
}

export function ResultsClient({ owner, repo }: ResultsClientProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const handlePackageSelection = async (packages: string[]) => {
    setSelectedPackages(packages);
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  if (isAnalyzing) {
    return <ResultsLoading />;
  }

  if (selectedPackages.length === 0) {
    return (
      <PackageSelection 
        onSelectionComplete={handlePackageSelection} 
      />
    );
  }

  return (
    <ResultsDashboard 
      owner={owner} 
      repo={repo}
    />
  );
} 