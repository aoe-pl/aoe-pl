"use client";

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

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  const groupMatchData =
    groupMatches.find((m) => m.groupId === selectedGroup) ?? null;

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
