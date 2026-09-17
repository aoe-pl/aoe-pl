import { api } from "@/trpc/server";
import { TournamentMatchModeType } from "@/lib/admin-panel/tournaments/tournament";

import { HeaderContainer } from "@/lib/admin-panel/tournaments/groups-detail/header-container";
import { GroupParticipantsTable } from "@/lib/admin-panel/tournaments/groups-detail/group-participants";
import { MatchesContainer } from "@/lib/admin-panel/tournaments/groups-detail/matches";
import { APItoTournamentMatch } from "@/lib/admin-panel/tournaments/groups-detail/match";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumbs";

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

  const matchMode = group.matchMode ??
    group.tournament.matchMode ?? {
      id: "",
      mode: TournamentMatchModeType.BEST_OF,
      gameCount: 1,
    };
  const matches = group.matches.map(APItoTournamentMatch);

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/tournaments">
                Tournaments
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/admin/tournaments/view/${group.tournamentId}?tab=groups`}
              >
                {group.tournament.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{group.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <HeaderContainer
        group={group}
        matchesCount={group.matches.length}
        matchMode={matchMode}
        tournamentId={group.tournamentId}
      />
      <div className="grid gap-6">
        <GroupParticipantsTable
          participants={group.TournamentGroupParticipant}
          groupId={groupId}
        />
        <MatchesContainer
          matches={matches}
          groupId={groupId}
          matchMode={matchMode}
          isTeamBased={group.isTeamBased ?? false}
          isMixed={group.isMixed ?? false}
        />
      </div>
    </div>
  );
}
