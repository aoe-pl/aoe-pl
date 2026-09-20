"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMatchSpoiler } from "./match-spoiler-context";

interface MatchSpoilerToggleProps {
  /** Only show the toggle when there is a result to hide or reveal. */
  hasResults: boolean;
}

/**
 * Lets the viewer uncover (or re-cover) the match score for the current
 * session. Hidden when there is nothing to reveal yet, or once the match is
 * admin approved (results are then public).
 */
export function MatchSpoilerToggle({ hasResults }: MatchSpoilerToggleProps) {
  const t = useTranslations("tournament.matches.spoiler");
  const { revealed, isApproved, toggle } = useMatchSpoiler();

  if (isApproved || !hasResults) return null;

  return (
    <div className="space-y-2 border-t border-[color:var(--medieval-wood-border)] pt-4 text-sm">
      <Button
        size="lg"
        variant="gold"
        className="w-full"
        onClick={toggle}
      >
        {revealed ? <EyeOff /> : <Eye />}
        {t(revealed ? "hide" : "reveal")}
      </Button>
    </div>
  );
}
