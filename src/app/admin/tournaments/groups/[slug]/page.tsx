import { api } from "@/trpc/server";

import { HeaderContainer } from "@/lib/admin-panel/tournaments/groups-detail/header-container";
import { GroupParticipantsTable } from "@/lib/admin-panel/tournaments/groups-detail/group-participants";
import { MatchesContainer } from "@/lib/admin-panel/tournaments/groups-detail/matches";
import { APItoTournamentMatch } from "@/lib/admin-panel/tournaments/groups-detail/match";

export default async function TournamentGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: groupId } = await params;

  const group = await api.tournaments.groups.get({
    id: groupId,
  });

  if (!group) {
    return null;
  }

  const matchMode = group.matchMode ?? group.stage.tournament.matchMode;
  const matches = group.matches.map(APItoTournamentMatch);

  console.log("group.matches", group.matches);

  return (
    <div className="container mx-auto space-y-6 py-6">
      <HeaderContainer
        group={group}
        matchesCount={group.matches.length}
        matchMode={matchMode}
        tournamentId={group.stage.tournamentId}
      />
      <div className="grid gap-6">
        <GroupParticipantsTable
          participants={group.TournamentGroupParticipant}
        />
        <MatchesContainer
          matches={matches}
          groupId={groupId}
          matchMode={matchMode}
        />
      </div>
    </div>
  );
}
