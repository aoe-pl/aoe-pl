"use client";

import type { AppRouter } from "@/server/api/root";
import type { inferProcedureOutput } from "@trpc/server";
import { useState } from "react";
import { GroupLeaderboardTable } from "./GroupLeaderboardTable";
import { GroupSelectionView } from "./GroupSelectionView";

type Groups = inferProcedureOutput<
  AppRouter["tournaments"]["groups"]["listByTournament"]
>;

type Props = {
  groups: Groups;
};

export function GroupsPageContent({ groups }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  return (
    <>
      <GroupSelectionView
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />
      {selectedGroupData && <GroupLeaderboardTable data={selectedGroupData} />}
    </>
  );
}
