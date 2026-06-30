"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface StepIndicatorProps {
  totalGames: number;
  currentStep: number;
}

export function StepIndicator({ totalGames, currentStep }: StepIndicatorProps) {
  const totalSteps = totalGames + 1;

  return (
    <ol className="flex flex-wrap justify-center gap-x-1 gap-y-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        const isConfirmed = i === totalGames;

        return (
          <li
            key={i}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                isDone && "border-primary bg-primary text-primary-foreground",
                isActive &&
                  "border-primary bg-background text-primary ring-primary/30 ring-2",
                !isDone &&
                  !isActive &&
                  "border-muted-foreground/30 text-muted-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isDone ? (
                <CheckIcon className="size-3.5" />
              ) : isConfirmed ? (
                "✓"
              ) : (
                i + 1
              )}
            </span>
            {isConfirmed && (
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                Confirm
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
