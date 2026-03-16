"use client";

import type { AppRouter } from "@/server/api/root";
import type { inferProcedureOutput } from "@trpc/server";
import { useState } from "react";
import { GroupLeaderboardTable } from "./GroupLeaderboardTable";
import { GroupSelectionView } from "./GroupSelectionView";

type Groups = inferProcedureOutput<
  AppRouter["tournaments"]["groups"]["listByTournament"]
>;

interface GroupMatches {
  groupId: string;
  matches: inferProcedureOutput<AppRouter["tournaments"]["matches"]["list"]>;
}

type Props = {
  groups: Groups;
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
