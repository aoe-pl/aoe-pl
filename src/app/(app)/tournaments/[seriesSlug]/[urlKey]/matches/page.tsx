import {
  MatchList,
  type MatchListRow,
} from "@/components/tournaments/matches/match-list";
import { TournamentSectionContent } from "@/components/tournaments/tournament-section-content";
import {
  getTournamentOrNotFound,
  getTournamentPageData,
} from "@/lib/helpers/tournament-page-data";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { getLocale } from "next-intl/server";

export default async function TournamentMatchesPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const locale = await getLocale();

  const [tournament, { section }] = await Promise.all([
    getTournamentOrNotFound(seriesSlug, urlKey),
    getTournamentPageData(seriesSlug, urlKey, "matches"),
  ]);

  const content =
    section?.translations.find((tr) => tr.locale === locale)?.content ?? "";

  const matches = (await tournamentMatchRepository.getMatchesByTournamentId(
    tournament.id,
  )) satisfies MatchListRow[];

  const matchUrlBase = `/tournaments/${seriesSlug}/${urlKey}/matches`;

  return (
    <div className="space-y-4">
      {content && <TournamentSectionContent content={content} />}
      <div className="panel">
        <MatchList
          matches={matches}
          matchUrlBase={matchUrlBase}
        />
      </div>
    </div>
  );
}
