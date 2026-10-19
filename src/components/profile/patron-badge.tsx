"use client";

import { PatronIcon } from "@/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const PATRONITE_URL = "https://patronite.pl/gin";

/**
 * Emblem shown next to the name of players holding the PATRON role. Hovering
 * the emblem reveals a hint, clicking it opens the community patronite page.
 *
 * Inline next to text the emblem is sized in `em` and nudged down so its centre
 * lands on the cap-height centre of the surrounding text (names made of
 * capitals or digits) instead of on the x-height centre, which `align-middle`
 * would use.
 */
export function PatronBadge({ className }: { className?: string }) {
  const t = useTranslations("profile.patron");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={PATRONITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("tooltip")}
          className="inline-flex align-[-0.2em] text-purple-300 transition-opacity hover:opacity-80 focus-visible:opacity-80"
        >
          <PatronIcon className={cn("h-[1.1em] w-[1.1em]", className)} />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t("tooltip")}</TooltipContent>
    </Tooltip>
  );
}
