"use client";

import { Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { isBrightColor } from "@/lib/utils";
import type { GroupPageData } from "./types/types";

type Props = {
  groupsData: GroupPageData[];
  selectedGroup: string | null;
  onSelectGroup: (group: string) => void;
};

export function GroupSelectionView({
  groupsData,
  selectedGroup,
  onSelectGroup,
}: Props) {
  return (
    <Card className="flex w-full flex-row flex-wrap items-center justify-center gap-2">
      {groupsData.map((g) => {
        const color = g.groupColor;
        const labelColor = isBrightColor(color) ? "#000" : "#fff";

        return (
          <Button
            key={g.groupId}
            className={`text-md p-5 font-bold ${
              g.groupId === selectedGroup ? "ring-2 ring-stone-300" : ""
            } hover:ring-2 hover:ring-stone-300`}
            style={
              color ? { backgroundColor: color, color: labelColor } : undefined
            }
            onClick={() => onSelectGroup(g.groupId)}
          >
            {g.groupName}
          </Button>
        );
      })}
    </Card>
  );
}
