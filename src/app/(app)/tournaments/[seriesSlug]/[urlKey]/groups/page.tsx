import { GroupsPageContent } from "@/components/tournaments/groups/GroupsPageContent";
import type { GroupPageData } from "@/components/tournaments/groups/types/types";
import { getTournamentPageData } from "@/lib/helpers/tournament-page-data";
import { getSession } from "@/lib/session";
import { api } from "@/trpc/server";
import { getLocale } from "next-intl/server";

export default async function TournamentGroupsPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; urlKey: string }>;
}) {
  const { seriesSlug, urlKey } = await params;
  const locale = await getLocale();
  const session = await getSession();
  const userId = session?.user?.id ?? null;
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

  // The group the logged-in user belongs to, used to pre-select it. Rotational
  // groups are derived groupings that mirror the real groups they link, so the
  // (non-rotational) group itself is preferred when the user is in both.
  let ownGroupId: string | null = null;
  let ownRotationGroupId: string | null = null;

  for (const g of groups) {
    const participants = await api.tournaments.groups.getParticipants({
      groupId: g.id,
    });

    if (userId && participants.some((p) => p.userId === userId)) {
      if (g.isRotational) {
        ownRotationGroupId ??= g.id;
      } else {
        ownGroupId ??= g.id;
      }
    }

    const matchesForGroup = await api.tournaments.matches.list({
      groupId: g.id,
    });

    const matchMode = g.matchMode ?? tournament.matchMode ?? null;

    const description =
      g.translations.find((tr) => tr.locale === locale)?.description ?? null;

    groupData.push({
      groupId: g.id,
      groupColor: g.color!,
      groupName: g.name,
      isRotational: g.isRotational,
      description,
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
    <div className="space-y-4">
      <GroupsPageContent
        groupsData={groupData}
        matchUrlBase={matchUrlBase}
        initialGroupId={ownGroupId ?? ownRotationGroupId}
      />
    </div>
  );
}
