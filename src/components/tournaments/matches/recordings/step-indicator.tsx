"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "lucide-react";
import type { GameStep } from "./types";

interface StepIndicatorProps {
  totalGames: number;
  currentStep: number;
  steps: GameStep[];
}

export function StepIndicator({
  totalGames,
  currentStep,
  steps,
}: StepIndicatorProps) {
  const totalSteps = totalGames + 1;

  return (
    <ol className="flex flex-wrap justify-center gap-x-1 gap-y-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        const isConfirm = i === totalGames;
        const isSkipped = !isConfirm && !!steps[i]?.skipped;

        return (
          <li
            key={i}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                isSkipped &&
                  "border-muted-foreground/20 text-muted-foreground/40",
                !isSkipped &&
                  isDone &&
                  "border-primary bg-primary text-primary-foreground",
                !isSkipped &&
                  isActive &&
                  "border-primary bg-background text-primary ring-primary/30 ring-2",
                !isSkipped &&
                  !isDone &&
                  !isActive &&
                  "border-muted-foreground/30 text-muted-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isSkipped ? (
                <MinusIcon className="size-3.5 opacity-40" />
              ) : isDone ? (
                <CheckIcon className="size-3.5" />
              ) : isConfirm ? (
                "✓"
              ) : (
                i + 1
              )}
            </span>
            {isConfirm && (
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
