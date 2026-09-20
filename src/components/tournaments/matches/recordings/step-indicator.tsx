"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, MinusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("tournament.matches.recordings");
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
                  "border-[color:var(--medieval-gold-muted)]/20 text-[color:var(--medieval-gold-muted)]/40",
                !isSkipped &&
                  isDone &&
                  "border-[color:var(--medieval-gold)] bg-[color:var(--medieval-gold)] text-[color:var(--medieval-wood)]",
                !isSkipped &&
                  isActive &&
                  "border-[color:var(--medieval-gold)] bg-[color:var(--medieval-wood)] text-[color:var(--medieval-gold)] ring-2 ring-[color:var(--medieval-gold)]/30",
                !isSkipped &&
                  !isDone &&
                  !isActive &&
                  "border-[color:var(--medieval-gold-muted)]/40 text-[color:var(--medieval-gold-muted)]",
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
            {isConfirm && (
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isActive
                    ? "font-medium text-[color:var(--medieval-gold)]"
                    : "text-[color:var(--medieval-gold-muted)]",
                )}
              >
                {t("step_confirm")}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
