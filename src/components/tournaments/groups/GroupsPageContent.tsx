"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { GroupLeaderboardTable } from "./GroupLeaderboardTable";
import { GroupSelectionView } from "./GroupSelectionView";
import type { GroupMatches, TournamentGroups } from "./types/types";

type Props = {
  groups: TournamentGroups;
  groupMatches: GroupMatches[];
};

export function GroupsPageContent({ groups, groupMatches }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const t = useTranslations("tournament.groups");

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  const groupMatchData =
    groupMatches.find((m) => m.groupId === selectedGroup) ?? null;

  if (groups.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 py-10">
        <h2 className="text-lg font-bold">{t("no_groups")}</h2>
      </div>
    );
  }

  return (
    <>
      <GroupSelectionView
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />
      {selectedGroupData && groupMatchData?.matches.length && (
        <GroupLeaderboardTable
          group={selectedGroupData}
          matches={groupMatchData.matches}
        />
      )}
    </>
  );
}
