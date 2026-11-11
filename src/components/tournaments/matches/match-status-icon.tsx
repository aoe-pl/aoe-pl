"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MatchStatus } from "@prisma/client";
import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Statuses that are worth surfacing with an icon. Pending and scheduled
 * matches have no marker.
 */
export const MATCH_STATUS_META: Partial<
  Record<MatchStatus, { labelKey: string; className: string }>
> = {
  COMPLETED: {
    labelKey: "status.completed",
    className: "text-orange-500",
  },
  ADMIN_APPROVED: {
    labelKey: "status.admin_approved",
    className: "text-green-500",
  },
};

/** Icon marker for a match status, with the status name shown on hover. */
export function MatchStatusIcon({ status }: { status: MatchStatus }) {
  const t = useTranslations("tournament.matches");
  const meta = MATCH_STATUS_META[status];
  if (!meta) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex cursor-default items-center">
          <CircleCheck
            className={`size-4 ${meta.className}`}
            aria-hidden
          />
          <span className="sr-only">{t(meta.labelKey)}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t(meta.labelKey)}</TooltipContent>
    </Tooltip>
  );
}
