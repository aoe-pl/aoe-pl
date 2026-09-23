import { GroupsPageContent } from "@/components/tournaments/groups/GroupsPageContent";
import type { GroupPageData } from "@/components/tournaments/groups/types/types";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import { api } from "@/trpc/server";

export default async function TournamentGroupsPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const { tournament, section } = await getTournamentPageData(
    seriesSlug,
    urlKey,
    "groups",
    { includeMatchMode: true },
  );

  const groups = await api.tournaments.groups.listByTournament({
    tournamentId: section.tournamentId,
    includeParticipants: true,
    includeMatchMode: true,
  });

  const groupData: GroupPageData[] = [];

  for (const g of groups) {
    const participants = await api.tournaments.groups.getParticipants({
      groupId: g.id,
    });

    const matchesForGroup = await api.tournaments.matches.list({
      groupId: g.id,
    });

    const matchMode = g.matchMode ?? tournament.matchMode ?? null;

    groupData.push({
      groupId: g.id,
      groupColor: g.color!,
      groupName: g.name,
      matchMode: matchMode
        ? { mode: matchMode.mode, gameCount: matchMode.gameCount }
        : null,
      matches: matchesForGroup,
      players: participants.map((p) => ({
        id: p.id,
        name: p.nickname,
        playerNumber: p.user!.playerNumber,
      })),
    });
  }

  const matchUrlBase = `/tournaments/${seriesSlug}/${urlKey}/matches`;

  return (
    <div className="panel space-y-4">
      <GroupsPageContent
        groupsData={groupData}
        matchUrlBase={matchUrlBase}
      />
    </div>
  );
}
