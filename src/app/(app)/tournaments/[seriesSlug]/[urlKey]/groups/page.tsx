import { GroupsPageContent } from "@/components/tournaments/groups/GroupsPageContent";
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
    includeMatches: true,
    includeParticipants: true,
    includeMatchMode: true,
  });

  return (
    <div className="panel space-y-4">
      <GroupsPageContent groups={groups} />
    </div>
  );
}
