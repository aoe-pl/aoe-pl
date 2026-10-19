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

  // All groups including their participants in a single query.
  const groups = await api.tournaments.groups.listWithParticipants({
    tournamentId: section.tournamentId,
  });

  const allMatches = await api.tournaments.matches.listByGroupIds({
    groupIds: groups.map((g) => g.id),
  });

  const matchesByGroup = new Map<string, GroupPageData["matches"]>();
  for (const match of allMatches) {
    if (!match.groupId) continue;
    const groupMatches = matchesByGroup.get(match.groupId);
    if (groupMatches) groupMatches.push(match);
    else matchesByGroup.set(match.groupId, [match]);
  }

  // The group the logged-in user belongs to, used to pre-select it. Rotational
  // groups are derived groupings that mirror the real groups they link, so the
  // (non-rotational) group itself is preferred when the user is in both.
  let ownGroupId: string | null = null;
  let ownRotationGroupId: string | null = null;

  const groupData: GroupPageData[] = groups.map((g) => {
    const participants = g.TournamentGroupParticipant.map(
      (gp) => gp.tournamentParticipant,
    );

    if (userId && participants.some((p) => p.userId === userId)) {
      if (g.isRotational) {
        ownRotationGroupId ??= g.id;
      } else {
        ownGroupId ??= g.id;
      }
    }

    const matchMode = g.matchMode ?? tournament.matchMode ?? null;

    const description =
      g.translations.find((tr) => tr.locale === locale)?.description ?? null;

    return {
      groupId: g.id,
      groupColor: g.color!,
      groupName: g.name,
      isRotational: g.isRotational,
      description,
      matchMode: matchMode
        ? { mode: matchMode.mode, gameCount: matchMode.gameCount }
        : null,
      matches: matchesByGroup.get(g.id) ?? [],
      players: participants.map((p) => ({
        id: p.id,
        name: p.nickname,
        playerNumber: p.user!.playerNumber,
      })),
    };
  });

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
