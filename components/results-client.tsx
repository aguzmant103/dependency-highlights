import { Stepper } from "@/components/stepper"
import { PackageSelectionWrapper } from "@/components/package-selection-wrapper"

interface ResultsClientProps {
  owner: string;
  repo: string;
}

export function ResultsClient({ owner, repo }: ResultsClientProps) {
  return (
    <>
      <Stepper step={1} />
      <div className="mb-4 text-lg font-semibold text-solv-lightPurple">Step 1: Select Packages to Analyze</div>
      <div className="mb-2 text-muted-foreground">Select which packages in this repository you want to analyze for dependents. Only selected packages will be used in the next step.</div>
      <PackageSelectionWrapper owner={owner} repo={repo} />
    </>
  );
} 