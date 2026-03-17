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
  const { section } = await getTournamentPageData(seriesSlug, urlKey, "groups");

  const groups = await api.tournaments.groups.listByTournament({
    tournamentId: section.tournamentId,
    includeParticipants: true,
  });

  const groupData: GroupPageData[] = [];

  for (const g of groups) {
    const participants = await api.tournaments.groups.getParticipants({
      groupId: g.id,
    });

    const matchesForGroup = await api.tournaments.matches.list({
      groupId: g.id,
    });

    groupData.push({
      groupId: g.id,
      groupColor: g.color!,
      groupName: g.name,
      matches: matchesForGroup,
      players: participants.map((p) => ({
        id: p.id,
        name: p.nickname,
      })),
    });
  }

  return (
    <div className="panel space-y-4">
      <GroupsPageContent groupsData={groupData} />
    </div>
  );
}
