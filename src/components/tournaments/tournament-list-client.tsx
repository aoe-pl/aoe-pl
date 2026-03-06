"use client";

import type { TournamentWithRelations } from "@/server/api/tournament";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { SeriesSelect } from "./series-select";
import { SeriesSidebar } from "./series-sidebar";
import { TournamentSections } from "./tournament-sections";

interface Series {
  id: string;
  name: string;
}

interface TournamentListClientProps {
  tournaments: TournamentWithRelations[];
  series: Series[];
  labels: {
    seriesLabel: string;
    allSeries: string;
    sectionActive: string;
    sectionUpcoming: string;
    sectionFinished: string;
    noTournaments: string;
  };
}

export function TournamentListClient({
  tournaments,
  series,
  labels,
}: TournamentListClientProps) {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const locale = useLocale();

  const filtered = selectedSeriesId
    ? tournaments.filter((t) => t.tournamentSeriesId === selectedSeriesId)
    : tournaments;

  const navLinks = useMemo(
    () => [
      { id: null, label: labels.allSeries },
      ...series
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, locale))
        .map((s) => ({ id: s.id, label: s.name })),
    ],
    [series, labels.allSeries, locale],
  );

  return (
    <div className="flex gap-8">
      <SeriesSidebar
        navLinks={navLinks}
        selectedSeriesId={selectedSeriesId}
        seriesLabel={labels.seriesLabel}
        onSelect={setSelectedSeriesId}
      />

      <div className="panel min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <SeriesSelect
            navLinks={navLinks}
            selectedSeriesId={selectedSeriesId}
            seriesLabel={labels.seriesLabel}
            onSelect={setSelectedSeriesId}
          />
          <TournamentSections
            tournaments={filtered}
            labels={labels}
          />
        </div>
      </div>
    </div>
  );
}
