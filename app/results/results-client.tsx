"use client"

import { useState, useEffect } from "react"
import { ResultsDashboard } from "@/components/results-dashboard"
import { PackageSelection } from "@/components/package-selection"
import { ResultsLoading } from "@/components/results-loading"
import { fetchDependentProjects, BatchProcessingResult } from "@/lib/github"

interface ResultsClientProps {
  owner: string;
  repo: string;
}

export function ResultsClient({ owner, repo }: ResultsClientProps) {
  const [initialData, setInitialData] = useState<BatchProcessingResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  useEffect(() => {
    setInitialData(null); // Reset when owner/repo changes
    setIsAnalyzing(false);
    setSelectedPackages([]);
  }, [owner, repo]);

  const handlePackageSelection = async (packages: string[]) => {
    setSelectedPackages(packages);
    setIsAnalyzing(true);
    
    try {
      console.log("🔍 Starting analysis for packages:", packages);
      const data = await fetchDependentProjects(owner, repo, 1, 100, packages, (progress) => {
        console.log("📊 Progress update:", {
          found: progress.data.length,
          processed: progress.processedPackages,
          total: progress.totalPackages,
          isPartial: progress.isPartialResult
        });
      });
      setInitialData(data);
    } catch (error) {
      console.error("Failed to analyze packages:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return <ResultsLoading />;
  }

  if (!initialData) {
    return (
      <PackageSelection 
        owner={owner} 
        repo={repo} 
        onSelectionComplete={handlePackageSelection} 
      />
    );
  }

  return (
    <ResultsDashboard 
      owner={owner} 
      repo={repo} 
      initialData={initialData} 
      selectedPackages={selectedPackages}
      totalPackages={PackageSelection.length}
    />
  );
} 