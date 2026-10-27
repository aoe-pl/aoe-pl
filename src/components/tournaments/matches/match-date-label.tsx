"use client";

import { getDateFnsLocale } from "@/components/tournaments/calendar/locale-utils";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface MatchDateLabelProps {
  date: Date | null;
}

/**
 * Renders a match date in the viewer's own timezone.
 *
 * The value is an absolute instant, so formatting it during server rendering
 * would use the server's timezone (usually UTC) and show a shifted time to
 * everyone else. Formatting only happens after hydration so the label matches
 * the browser's timezone, like the calendar and group pages already do.
 */
export function MatchDateLabel({ date }: MatchDateLabelProps) {
  const locale = useLocale();
  const t = useTranslations("tournament.matches");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!date) return <>{t("date_tbd")}</>;

  return (
    <time
      dateTime={new Date(date).toISOString()}
      suppressHydrationWarning
    >
      {mounted
        ? format(new Date(date), "PPP p", {
            locale: getDateFnsLocale(locale),
          })
        : null}
    </time>
  );
}
