"use client";

import { Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { isBrightColor } from "@/lib/utils";
import type { TournamentGroups } from "./types/types";

type Props = {
  groups: TournamentGroups;
  selectedGroup: string | null;
  onSelectGroup: (group: string) => void;
};

export function GroupSelectionView({
  groups,
  selectedGroup,
  onSelectGroup,
}: Props) {
  return (
    <Card className="flex w-full flex-row flex-wrap items-center justify-center gap-2">
      {groups.map((g) => {
        const color = g.color!;
        const labelColor = isBrightColor(color) ? "#000" : "#fff";

        return (
          <Button
            key={g.id}
            className={`text-md p-5 font-bold ${
              g.id === selectedGroup ? "ring-2 ring-stone-300" : ""
            } hover:ring-2 hover:ring-stone-300`}
            style={
              color ? { backgroundColor: color, color: labelColor } : undefined
            }
            onClick={() => onSelectGroup(g.id)}
          >
            {g.name}
          </Button>
        );
      })}
    </Card>
  );
}
