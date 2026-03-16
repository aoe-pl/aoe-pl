import { GroupsPageContent } from "@/components/tournaments/groups/GroupsPageContent";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/trpc/server";
import type { inferProcedureOutput } from "node_modules/@trpc/server/dist/unstable-core-do-not-import.d-BxnV2Pug.mjs";

interface GroupMatches {
  groupId: string;
  matches: inferProcedureOutput<AppRouter["tournaments"]["matches"]["list"]>;
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
