"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type CalendarMatchStatus,
  type CalendarAdminMarkerFilter,
  type CalendarMatch,
  type CalendarPlayer,
} from "../types";

interface CalendarFiltersResult {
  selectedGroups: Set<string>;
  selectedPlayers: Set<string>;
  selectedStatuses: Set<CalendarMatchStatus>;
  selectedAdminMarkers: Set<CalendarAdminMarkerFilter>;
  filteredMatches: CalendarMatch[];
  eligiblePlayers: CalendarPlayer[];
  isFiltered: boolean;
  toggleGroup: (id: string) => void;
  togglePlayer: (id: string) => void;
  toggleStatus: (status: CalendarMatchStatus) => void;
  toggleAdminMarker: (marker: CalendarAdminMarkerFilter) => void;
  clearFilters: () => void;
}

function toggleInSet<T>(prev: Set<T>, value: T): Set<T> {
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function useCalendarFilters(
  calendarMatches: CalendarMatch[],
  calendarPlayers: CalendarPlayer[],
): CalendarFiltersResult {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set(),
  );
  const [selectedStatuses, setSelectedStatuses] = useState<
    Set<CalendarMatchStatus>
  >(new Set());
  const [selectedAdminMarkers, setSelectedAdminMarkers] = useState<
    Set<CalendarAdminMarkerFilter>
  >(new Set());

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
      if (selectedStatuses.size > 0 && !selectedStatuses.has(m.status))
        return false;
      if (selectedAdminMarkers.size > 0) {
        const marker = m.adminStreamStatus ?? "NONE";
        if (!selectedAdminMarkers.has(marker)) return false;
      }
      return true;
    });
  }, [
    selectedGroups,
    selectedPlayers,
    selectedStatuses,
    selectedAdminMarkers,
    calendarMatches,
  ]);

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
    setSelectedGroups((prev) => toggleInSet(prev, id));
  }

  function togglePlayer(id: string) {
    setSelectedPlayers((prev) => toggleInSet(prev, id));
  }

  function toggleStatus(status: CalendarMatchStatus) {
    setSelectedStatuses((prev) => toggleInSet(prev, status));
  }

  function toggleAdminMarker(marker: CalendarAdminMarkerFilter) {
    setSelectedAdminMarkers((prev) => toggleInSet(prev, marker));
  }

  function clearFilters() {
    setSelectedGroups(new Set());
    setSelectedPlayers(new Set());
    setSelectedStatuses(new Set());
    setSelectedAdminMarkers(new Set());
  }

  return {
    selectedGroups,
    selectedPlayers,
    selectedStatuses,
    selectedAdminMarkers,
    filteredMatches,
    eligiblePlayers,
    isFiltered:
      selectedGroups.size > 0 ||
      selectedPlayers.size > 0 ||
      selectedStatuses.size > 0 ||
      selectedAdminMarkers.size > 0,
    toggleGroup,
    togglePlayer,
    toggleStatus,
    toggleAdminMarker,
    clearFilters,
  };
}
