import { api } from "@/trpc/server";
import { slugify } from "@/lib/utils";
import { TournamentMatchModeType } from "@/lib/admin-panel/tournaments/tournament";
import { getTranslations } from "next-intl/server";

import { HeaderContainer } from "@/lib/admin-panel/tournaments/groups-detail/header-container";
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
  const t = await getTranslations("admin.sidebar");

  const group = await api.tournaments.groups.get({
    id: groupId,
  });

  if (!group) {
    return null;
  }

  // Rotation groups reference two other groups, so the edit form needs the
  // tournament's full group list to populate the rotation selectors.
  const groups = await api.tournaments.groups.listByTournament({
    tournamentId: group.tournamentId,
  });

  const matchMode = group.matchMode ??
    group.tournament.matchMode ?? {
      id: "",
      mode: TournamentMatchModeType.BEST_OF,
      gameCount: 1,
    };
  const matches = group.matches.map(APItoTournamentMatch);
  const participants = group.TournamentGroupParticipant.map(
    ({ tournamentParticipant }) => ({
      id: tournamentParticipant.id,
      nickname: tournamentParticipant.nickname,
      playerNumber: tournamentParticipant.user?.playerNumber,
    }),
  );
  const matchUrlBase = `/tournaments/${slugify(
    group.tournament.tournamentSeries.name,
  )}/${group.tournament.urlKey}/matches`;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/tournaments">
                {t("tournaments")}
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
        groups={groups}
        participants={participants}
        matchesCount={group.matches.length}
        matchMode={matchMode}
        tournamentId={group.tournamentId}
      />
      <div className="grid gap-6">
        <MatchesContainer
          matches={matches}
          participants={participants}
          groupId={groupId}
          matchUrlBase={matchUrlBase}
          isTeamBased={group.isTeamBased ?? false}
          isMixed={group.isMixed ?? false}
        />
      </div>
    </div>
  );
}
