"use client";

import { Button } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { isBrightColor } from "@/lib/utils";
import type { AppRouter } from "@/server/api/root";
import type { inferProcedureOutput } from "@trpc/server";

type ListByTournamentOutput = inferProcedureOutput<
  AppRouter["tournaments"]["groups"]["listByTournament"]
>;

type Props = {
  groups: ListByTournamentOutput;
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
            } hover:ring-2 hover:ring-stone-300 focus:ring-3`}
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
