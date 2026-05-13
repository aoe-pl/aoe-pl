"use client";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarFilters } from "./calendar-filters";
import { CalendarToolbar } from "./calendar-toolbar";
import type { TournamentMatchRow } from "./hooks/use-calendar-data";
import { useCalendarData } from "./hooks/use-calendar-data";
import { useCalendarFilters } from "./hooks/use-calendar-filters";
import { useCalendarNav } from "./hooks/use-calendar-nav";
import { MonthView } from "./month-view";
import { ScheduleMatchDialog } from "./schedule-match-dialog";
import { SelectedDayPanel } from "./selected-day-panel";
import { WeekView } from "./week-view";

export type { TournamentMatchRow } from "./hooks/use-calendar-data";

interface TournamentCalendarProps {
  matches: TournamentMatchRow[];
  matchUrlBase: string;
  userId: string | null;
  isAdmin: boolean;
}

export function TournamentCalendar({
  matches,
  matchUrlBase,
  userId,
  isAdmin,
}: TournamentCalendarProps) {
  const router = useRouter();
  const { calendarMatches, calendarGroups, calendarPlayers, pendingRows } =
    useCalendarData(matches);

  const {
    selectedGroups,
    selectedPlayers,
    filteredMatches,
    eligiblePlayers,
    isFiltered,
    toggleGroup,
    togglePlayer,
    clearFilters,
  } = useCalendarFilters(calendarMatches, calendarPlayers);

  const {
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
  } = useCalendarNav();

  const [schedulingMatch, setSchedulingMatch] = useState<{
    match: TournamentMatchRow;
    defaultDate: Date;
  } | null>(null);

  const { mutate: unschedule } =
    api.tournaments.matches.unscheduleMatch.useMutation({
      onSuccess: () => router.refresh(),
    });

  function handleScheduleMatch(match: TournamentMatchRow, date: Date) {
    setSchedulingMatch({ match, defaultDate: date });
  }

  function handleRescheduleMatch(match: TournamentMatchRow) {
    setSchedulingMatch({
      match,
      defaultDate: match.matchDate ?? new Date(),
    });
  }

  function handleCancelMatch(match: TournamentMatchRow) {
    unschedule({ id: match.id });
  }

  return (
    <div className="flex flex-col gap-4">
      <CalendarFilters
        groups={calendarGroups}
        players={eligiblePlayers}
        selectedGroups={selectedGroups}
        selectedPlayers={selectedPlayers}
        onGroupToggle={toggleGroup}
        onPlayerToggle={togglePlayer}
        onClearAll={clearFilters}
      />

      <CalendarToolbar
        view={view}
        headerLabel={headerLabel}
        onPrev={navigatePrev}
        onNext={navigateNext}
        onToday={goToToday}
        onSetView={setView}
      />

      {/* On mobile only show month view*/}
      <div className={view === "week" ? "sm:hidden" : ""}>
        <MonthView
          currentMonth={currentMonth}
          matches={filteredMatches}
          groups={calendarGroups}
          players={calendarPlayers}
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
        />
      </div>
      <div className={view === "week" ? "hidden sm:block" : "hidden"}>
        <WeekView
          currentWeekStart={currentWeekStart}
          matches={filteredMatches}
          groups={calendarGroups}
          players={calendarPlayers}
          matchUrlBase={matchUrlBase}
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
        />
      </div>

      {selectedDay && (
        <SelectedDayPanel
          selectedDay={selectedDay}
          matches={filteredMatches}
          groups={calendarGroups}
          players={calendarPlayers}
          isFiltered={isFiltered}
          matchUrlBase={matchUrlBase}
          pendingRows={pendingRows}
          tournamentMatchRows={matches}
          userId={userId}
          isAdmin={isAdmin}
          onScheduleMatch={handleScheduleMatch}
          onRescheduleMatch={handleRescheduleMatch}
          onCancelMatch={handleCancelMatch}
        />
      )}

      {schedulingMatch && (
        <ScheduleMatchDialog
          match={schedulingMatch.match}
          defaultDate={schedulingMatch.defaultDate}
          onClose={() => setSchedulingMatch(null)}
        />
      )}
    </div>
  );
}
