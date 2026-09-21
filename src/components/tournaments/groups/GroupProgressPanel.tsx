"use client";

import { useTranslations } from "next-intl";
import type { GroupPageData } from "./types/types";

const RADIUS = 50;

/**
 * Donut chart showing how many matches in the selected group have been played
 */
export function GroupProgressPanel({
  groupData,
}: {
  groupData: GroupPageData;
}) {
  const t = useTranslations("tournament.groups");

  const total = groupData.matches.length;
  const played = groupData.matches.filter(
    (m) => m.status === "COMPLETED" || m.status === "ADMIN_APPROVED",
  ).length;
  const remaining = total - played;
  const percent = total === 0 ? 0 : Math.round((played / total) * 100);

  const circumference = 2 * Math.PI * RADIUS;
  const dash = (percent / 100) * circumference;
  const accentColor = groupData.groupColor || "var(--medieval-gold)";

  return (
    <div className="space-y-4">
      <h3 className="text-center text-xs font-bold tracking-wide text-[color:var(--medieval-gold-muted)] uppercase">
        {t("progress.title")}
      </h3>

      <div className="relative mx-auto h-36 w-36">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={`${played} ${t("progress.of")} ${total}`}
        >
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="rgba(0, 0, 0, 0.35)"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={accentColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-primary text-3xl font-black tabular-nums">
            {percent}%
          </span>
          <span className="text-xs text-[color:var(--medieval-gold-muted)] tabular-nums">
            {played} {t("progress.of")} {total}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[color:var(--medieval-gold-muted)]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            {t("progress.played")}
          </span>
          <span className="text-primary font-bold tabular-nums">{played}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[color:var(--medieval-gold-muted)]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-black/40" />
            {t("progress.remaining")}
          </span>
          <span className="text-primary font-bold tabular-nums">
            {remaining}
          </span>
        </div>
      </div>
    </div>
  );
}
