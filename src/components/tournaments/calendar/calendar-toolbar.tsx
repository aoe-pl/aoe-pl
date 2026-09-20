"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { CalendarView } from "./hooks/use-calendar-nav";

interface CalendarToolbarProps {
  view: CalendarView;
  headerLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSetView: (v: CalendarView) => void;
}

const commonButtonStyle =
  "flex items-center gap-2 px-3 py-2 text-sm font-medium ";

export function CalendarToolbar({
  view,
  headerLabel,
  onPrev,
  onNext,
  onToday,
  onSetView,
}: CalendarToolbarProps) {
  const t = useTranslations("tournament.calendar");

  return (
    <div className="flex flex-wrap items-center justify-between">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="wood"
          size="lg"
          onClick={onPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="wood"
          size="lg"
          onClick={onToday}
        >
          {t("today")}
        </Button>
        <Button
          variant="wood"
          size="lg"
          onClick={onNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-primary ml-2 text-base font-semibold">
          {headerLabel}
        </span>
      </div>

      {/* View toggle. Hidden on mobile since only month view is available there */}
      <div className="hidden items-center sm:flex">
        <div className="flex overflow-hidden rounded-md border border-[color:var(--medieval-wood-border)]">
          <button
            onClick={() => onSetView("month")}
            className={cn(
              commonButtonStyle,
              view === "month"
                ? "bg-[color:var(--medieval-gold)] text-[color:var(--medieval-wood)]"
                : "hover:text-primary text-[color:var(--medieval-gold-muted)] hover:bg-white/5",
            )}
          >
            <Calendar className="h-4 w-4" />
            {t("month")}
          </button>
          <button
            onClick={() => onSetView("week")}
            className={cn(
              commonButtonStyle,
              view === "week"
                ? "bg-[color:var(--medieval-gold)] text-[color:var(--medieval-wood)]"
                : "hover:text-primary text-[color:var(--medieval-gold-muted)] hover:bg-white/5",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            {t("week")}
          </button>
        </div>
      </div>
    </div>
  );
}
