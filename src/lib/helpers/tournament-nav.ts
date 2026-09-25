import { slugify } from "@/lib/utils";
import { api } from "@/trpc/server";

interface TournamentNavItem {
  name: string;
  href: string;
}

export interface TournamentNavGroup {
  seriesName: string;
  tournaments: TournamentNavItem[];
}

/**
 * Builds the tournament menu structure used by the site header.
 * Tournaments are grouped by their series and archived ones are excluded.
 */
export async function getTournamentNavGroups(): Promise<TournamentNavGroup[]> {
  const tournaments = await api.tournaments.list({
    includeTournamentSeries: true,
    archived: false,
  });

  const groups = new Map<
    string,
    {
      seriesName: string;
      displayOrder: number;
      tournaments: TournamentNavItem[];
    }
  >();

  for (const tournament of tournaments) {
    const series = tournament.tournamentSeries;
    if (!series) continue;

    let group = groups.get(series.id);
    if (!group) {
      group = {
        seriesName: series.name,
        displayOrder: series.displayOrder,
        tournaments: [],
      };
      groups.set(series.id, group);
    }

    group.tournaments.push({
      name: tournament.name,
      href: `/tournaments/${slugify(series.name)}/${tournament.urlKey}`,
    });
  }

  return Array.from(groups.values())
    .sort(
      (a, b) =>
        a.displayOrder - b.displayOrder ||
        a.seriesName.localeCompare(b.seriesName),
    )
    .map(({ seriesName, tournaments }) => ({ seriesName, tournaments }));
}
