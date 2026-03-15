import { TournamentPlayerList } from "@/components/tournaments/players/tournament-player-list";
import { getTournamentOrNotFound } from "@/lib/helpers/tournament-page-data";
import { tournamentParticipantRepository } from "@/lib/repositories/tournamentParticipantRepository";

export default async function TournamentPlayersPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;

  const tournament = await getTournamentOrNotFound(seriesSlug, urlKey);

  const tournamentParticipants =
    await tournamentParticipantRepository.getTournamentParticipants(
      tournament.id,
      { includeUser: false },
    );

  return (
    <div className="panel space-y-4">
      <TournamentPlayerList tournamentParticipants={tournamentParticipants} />
    </div>
  );
}
