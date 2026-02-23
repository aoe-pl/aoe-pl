"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TournamentWithRelations } from "@/server/api/tournament";
import { TournamentStatus } from "@prisma/client";

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

  const active = filtered.filter((t) => t.status === TournamentStatus.ACTIVE);
  const upcoming = filtered.filter(
    (t) => t.status === TournamentStatus.PENDING,
  );
  const finished = filtered.filter(
    (t) =>
      t.status === TournamentStatus.FINISHED ||
      t.status === TournamentStatus.CANCELLED,
  );

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
      {/* Desktop sidebar */}
      <aside className="hidden w-52 shrink-0 md:block">
        <div className="sticky top-24">
          <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
            {labels.seriesLabel}
          </p>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id ?? "all"}
                onClick={() => setSelectedSeriesId(link.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  selectedSeriesId === link.id
                    ? "bg-primary/10 text-primary border-primary/30 border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {link.id === null && (
                  <LayoutGrid className="h-4 w-4 shrink-0" />
                )}
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile dropdown */}
        <div className="mb-6 md:hidden">
          <p className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
            {labels.seriesLabel}
          </p>
          <Select
            value={selectedSeriesId ?? "all"}
            onValueChange={(v) => setSelectedSeriesId(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {navLinks.map((link) => (
                <SelectItem
                  key={link.id ?? "all"}
                  value={link.id ?? "all"}
                >
                  <span className="flex items-center gap-2">
                    {link.id === null && (
                      <LayoutGrid className="h-4 w-4 shrink-0" />
                    )}
                    {link.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tournament grid */}
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">
            {labels.noTournaments}
          </p>
        ) : (
          <div className="space-y-10">
            {active.length > 0 && (
              <section>
                <h2 className="text-foreground mb-4 text-xl font-bold">
                  {labels.sectionActive}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {active.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                    />
                  ))}
                </div>
              </section>
            )}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-foreground mb-4 text-xl font-bold">
                  {labels.sectionUpcoming}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcoming.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                    />
                  ))}
                </div>
              </section>
            )}
            {finished.length > 0 && (
              <section>
                <h2 className="text-foreground mb-4 text-xl font-bold">
                  {labels.sectionFinished}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {finished.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
