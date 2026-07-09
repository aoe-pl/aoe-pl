import { TournamentPlayerList } from "@/components/tournaments/players/tournament-player-list";
import { getTournament } from "@/lib/helpers/tournament-page-data";
import { tournamentParticipantRepository } from "@/lib/repositories/tournamentParticipantRepository";

export default async function TournamentPlayersPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;

  const tournament = await getTournament(seriesSlug, urlKey);

  const tournamentParticipants =
    await tournamentParticipantRepository.getTournamentParticipants(
      tournament.id,
      { includeUser: true },
    );

  return (
    <div className="panel space-y-4">
      <TournamentPlayerList tournamentParticipants={tournamentParticipants} />
    </div>
  );
}
