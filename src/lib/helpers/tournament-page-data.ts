import { notFound } from "next/navigation";
import { tournamentRepository } from "@/lib/repositories/tournamentRepository";
import { tournamentSeriesRepository } from "@/lib/repositories/tournamentSeriesRepository";
import { tournamentSectionRepository } from "@/lib/repositories/tournamentSectionRepository";
import { slugify } from "@/lib/utils";
import type { TournamentQueryOptions } from "@/lib/repositories/tournamentRepository";

export async function getTournamentOrNotFound(
  seriesSlug: string,
  urlKey: string,
  options?: TournamentQueryOptions,
) {
  const allSeries = await tournamentSeriesRepository.getTournamentSeries();
  const series = allSeries.find((s) => slugify(s.name) === seriesSlug);

  if (!series) notFound();

  const tournament = await tournamentRepository.getTournamentBySeriesAndUrlKey(
    series.id,
    urlKey,
    options,
  );

  if (!tournament) notFound();

  return tournament;
}

export async function getTournamentPageData(
  seriesSlug: string,
  urlKey: string,
  sectionSlug: string,
) {
  const tournament = await getTournamentOrNotFound(seriesSlug, urlKey);

  const section = await tournamentSectionRepository.getSectionBySlug(
    tournament.id,
    sectionSlug,
  );

  if (!section) notFound();

  if (section && !section.isVisible) notFound();

  return { tournament, section };
}
