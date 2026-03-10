"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarMatch, CalendarPlayer } from "../types";

interface CalendarFiltersResult {
  selectedGroups: Set<string>;
  selectedPlayers: Set<string>;
  filteredMatches: CalendarMatch[];
  eligiblePlayers: CalendarPlayer[];
  isFiltered: boolean;
  toggleGroup: (id: string) => void;
  togglePlayer: (id: string) => void;
  clearFilters: () => void;
}

export function useCalendarFilters(
  calendarMatches: CalendarMatch[],
  calendarPlayers: CalendarPlayer[],
): CalendarFiltersResult {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(),
  );

  const filteredMatches = useMemo(() => {
    return calendarMatches.filter((m) => {
      if (selectedGroups.size > 0 && !selectedGroups.has(m.groupId))
        return false;
      if (
        selectedPlayers.size > 0 &&
        !selectedPlayers.has(m.player1Id) &&
        !selectedPlayers.has(m.player2Id)
      )
        return false;
      return true;
    });
  }, [selectedGroups, selectedPlayers, calendarMatches]);

  // Players eligible for the player filter — scoped to the selected groups.
  const eligiblePlayers = useMemo(() => {
    if (selectedGroups.size === 0) return calendarPlayers;
    const ids = new Set<string>();
    calendarMatches.forEach((m) => {
      if (selectedGroups.has(m.groupId)) {
        ids.add(m.player1Id);
        ids.add(m.player2Id);
      }
    });
    return calendarPlayers.filter((p) => ids.has(p.id));
  }, [selectedGroups, calendarMatches, calendarPlayers]);

  // Drop player selections that fall outside the eligible set when groups change.
  useEffect(() => {
    if (selectedGroups.size === 0) return;
    const eligibleIds = new Set(eligiblePlayers.map((p) => p.id));
    setSelectedPlayers((prev) => {
      const next = new Set([...prev].filter((id) => eligibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [eligiblePlayers, selectedGroups.size]);

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setSelectedGroups(new Set());
    setSelectedPlayers(new Set());
  }

  return {
    selectedGroups,
    selectedPlayers,
    filteredMatches,
    eligiblePlayers,
    isFiltered: selectedGroups.size > 0 || selectedPlayers.size > 0,
    toggleGroup,
    togglePlayer,
    clearFilters,
  };
}
