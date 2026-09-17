import { PublicBracketList } from "@/components/tournaments/bracket/PublicBracketList";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import { api } from "@/trpc/server";

export default async function TournamentBracketPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const { section } = await getTournamentPageData(
    seriesSlug,
    urlKey,
    "bracket",
  );

  const brackets = await api.tournaments.brackets.listByTournament({
    tournamentId: section.tournamentId,
  });

  return (
    <div className="panel space-y-4">
      <PublicBracketList brackets={brackets} />
    </div>
  );
}
