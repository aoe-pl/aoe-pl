"use client";

import { CalendarFilters } from "./calendar-filters";
import { CalendarToolbar } from "./calendar-toolbar";
import type { TournamentMatchRow } from "./hooks/use-calendar-data";
import { useCalendarData } from "./hooks/use-calendar-data";
import { useCalendarFilters } from "./hooks/use-calendar-filters";
import { useCalendarNav } from "./hooks/use-calendar-nav";
import { MonthView } from "./month-view";
import { SelectedDayPanel } from "./selected-day-panel";
import { WeekView } from "./week-view";

export type { TournamentMatchRow } from "./hooks/use-calendar-data";

interface TournamentCalendarProps {
  matches: TournamentMatchRow[];
  matchUrlBase: string;
}

export function TournamentCalendar({
  matches,
  matchUrlBase,
}: TournamentCalendarProps) {
  const { calendarMatches, calendarGroups, calendarPlayers } =
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
        />
      </div>

      {selectedDay && view === "month" && (
        <SelectedDayPanel
          selectedDay={selectedDay}
          matches={filteredMatches}
          groups={calendarGroups}
          players={calendarPlayers}
          isFiltered={isFiltered}
          matchUrlBase={matchUrlBase}
        />
      )}
    </div>
  );
}
