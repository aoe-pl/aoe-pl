"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { GroupLeaderboardTable } from "./GroupLeaderboardTable";
import { GroupSelectionView } from "./GroupSelectionView";
import type { GroupPageData } from "./types/types";

export function GroupsPageContent({
  groupsData,
}: {
  groupsData: GroupPageData[];
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const t = useTranslations("tournament.groups");

  const selectedGroupData = groupsData.find((g) => g.groupId === selectedGroup);

  if (groupsData.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 py-10">
        <h2 className="text-lg font-bold">{t("no_groups")}</h2>
      </div>
    );
  }

  return (
    <>
      <GroupSelectionView
        groupsData={groupsData}
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
      />
      {selectedGroupData && (
        <GroupLeaderboardTable groupData={selectedGroupData} />
      )}
    </>
  );
}
