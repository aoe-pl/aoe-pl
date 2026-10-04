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
        const isSkipped =
          !isConfirm &&
          (!!steps[i]?.skipped ||
            (isDone && (steps[i]?.recordings.length ?? 0) === 0));

        return (
          <li
            key={i}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                isSkipped &&
                  "border-medieval-gold-muted/20 text-medieval-gold-muted/40",
                !isSkipped &&
                  isDone &&
                  "border-medieval-gold bg-medieval-gold text-medieval-wood",
                !isSkipped &&
                  isActive &&
                  "border-medieval-gold bg-medieval-wood text-medieval-gold ring-medieval-gold/30 ring-2",
                !isSkipped &&
                  !isDone &&
                  !isActive &&
                  "border-medieval-gold-muted/40 text-medieval-gold-muted",
              )}
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
          </li>
        );
      })}
    </ol>
  );
}
