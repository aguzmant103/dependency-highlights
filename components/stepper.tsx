import { cn } from "@/lib/utils"

interface StepperProps {
  step: number;
  totalSteps?: number;
}

export function Stepper({ step, totalSteps = 2 }: StepperProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step > index + 1
                ? "bg-solv-purple text-white"
                : step === index + 1
                ? "bg-solv-purple text-white ring-4 ring-solv-purple/20"
                : "bg-solv-background border-2 border-solv-purple/20 text-solv-purple/40"
            )}
          >
            {index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={cn(
                "w-24 h-0.5 mx-2",
                step > index + 1 ? "bg-solv-purple" : "bg-solv-purple/20"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
} 