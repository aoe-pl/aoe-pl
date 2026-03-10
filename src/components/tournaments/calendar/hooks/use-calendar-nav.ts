"use client";

import {
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { getDateFnsLocale } from "../locale-utils";

export type CalendarView = "month" | "week";

interface CalendarNavResult {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  currentMonth: Date;
  currentWeekStart: Date;
  selectedDay: Date | null;
  headerLabel: string;
  navigatePrev: () => void;
  navigateNext: () => void;
  goToToday: () => void;
  handleDaySelect: (day: Date) => void;
}

export function useCalendarNav(): CalendarNavResult {
  const today = new Date();
  const locale = getDateFnsLocale(useLocale());

  const [view, setView] = useState<CalendarView>("month");
  const [currentMonth, setCurrentMonth] = useState(today);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(today, { weekStartsOn: 1 }),
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  function navigatePrev() {
    if (view === "month") {
      setCurrentMonth((d) => subMonths(d, 1));
      setSelectedDay(null);
    } else {
      setCurrentWeekStart((d) => subWeeks(d, 1));
    }
  }

  function navigateNext() {
    if (view === "month") {
      setCurrentMonth((d) => addMonths(d, 1));
      setSelectedDay(null);
    } else {
      setCurrentWeekStart((d) => addWeeks(d, 1));
    }
  }

  function goToToday() {
    setCurrentMonth(today);
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedDay(today);
  }

  function handleDaySelect(day: Date) {
    setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));

    // Keep week view in sync when clicking a day in month view.
    if (view === "month") {
      setCurrentWeekStart(startOfWeek(day, { weekStartsOn: 1 }));
    }
  }

  // Keep currentMonth in sync when navigating weeks across a month boundary.
  useEffect(() => {
    if (view === "week" && !isSameMonth(currentWeekStart, currentMonth)) {
      setCurrentMonth(currentWeekStart);
    }
  }, [view, currentWeekStart, currentMonth]);

  const headerLabel =
    view === "month"
      ? format(currentMonth, "LLLL yyyy", { locale })
      : `${format(currentWeekStart, "d LLLL", { locale })} - ${format(
          endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
          "d LLLL yyyy",
          { locale },
        )}`;

  return {
    view,
    setView,
    currentMonth,
    currentWeekStart,
    selectedDay,
    headerLabel,
    navigatePrev,
    navigateNext,
    goToToday,
    handleDaySelect,
  };
}
