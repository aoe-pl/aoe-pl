import { GroupsPageContent } from "@/components/tournaments/groups/GroupsPageContent";
import type { TournamentMatchData } from "@/components/tournaments/groups/types/types";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import { api } from "@/trpc/server";

interface GroupMatches {
  groupId: string;
  matches: TournamentMatchData;
}

export default async function TournamentGroupsPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const { section } = await getTournamentPageData(seriesSlug, urlKey, "groups");

  const groups = await api.tournaments.groups.listByTournament({
    tournamentId: section.tournamentId,
    includeMatches: true,
    includeParticipants: true,
    includeMatchMode: true,
  });

  const matches: GroupMatches[] = [];

  for (const g of groups) {
    const matchesForGroup = await api.tournaments.matches.list({
      groupId: g.id,
    });
    matches.push({ groupId: g.id, matches: matchesForGroup });
  }

  return (
    <div className="panel space-y-4">
      <GroupsPageContent
        groups={groups}
        groupMatches={matches}
      />
    </div>
  );
}
