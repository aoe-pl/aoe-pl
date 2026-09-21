"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { GroupLeaderboardTable } from "./GroupLeaderboardTable";
import { GroupPlayerMatches } from "./GroupPlayerMatches";
import { GroupProgressPanel } from "./GroupProgressPanel";
import { GroupSelectionView } from "./GroupSelectionView";
import type { GroupPageData } from "./types/types";

export function GroupsPageContent({
  groupsData,
  matchUrlBase,
}: {
  groupsData: GroupPageData[];
  matchUrlBase: string;
}) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const t = useTranslations("tournament.groups");

  const selectedGroupData = groupsData.find((g) => g.groupId === selectedGroup);
  const selectedPlayer = selectedGroupData?.players.find(
    (player) => player.id === selectedPlayerId,
  );

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroup(groupId);
    setSelectedPlayerId(null);
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId((current) => (current === playerId ? null : playerId));
  };

  if (groupsData.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 py-10">
        <h2 className="text-lg font-bold">{t("no_groups")}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GroupSelectionView
        groupsData={groupsData}
        selectedGroup={selectedGroup}
        onSelectGroup={handleSelectGroup}
      />
      {selectedGroupData && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <GroupLeaderboardTable
              groupData={selectedGroupData}
              selectedPlayerId={selectedPlayerId}
              onSelectPlayer={handleSelectPlayer}
            />
            {selectedPlayer && (
              <GroupPlayerMatches
                matches={selectedGroupData.matches}
                playerId={selectedPlayer.id}
                playerName={selectedPlayer.name}
                matchUrlBase={matchUrlBase}
              />
            )}
          </div>

          <aside
            className="h-fit rounded-xl border border-[color:var(--medieval-wood-border)] p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.18)" }}
          >
            <GroupProgressPanel groupData={selectedGroupData} />
          </aside>
        </div>
      )}
    </div>
  );
}
