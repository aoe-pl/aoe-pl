"use client";

import { Button } from "@/components/ui";
import { buildGroupGrid } from "@/lib/tournaments/group-grid";
import { cn } from "@/lib/utils";
import type { GroupPageData } from "./types/types";

type Props = {
  groupsData: GroupPageData[];
  selectedGroup: string | null;
  onSelectGroup: (group: string) => void;
};

/**
 * Group selector rendered as a grid.
 *
 * Groups that share a base name (e.g. "Red Ants") are stacked into a single
 * column, ordered top-to-bottom by the number in their name. Columns are
 * ordered by `displayOrder` (the order the groups are provided in). Rotation
 * groups (e.g. "Gold Ants 2 🔄 Red Ants 1") belong to the column of the first
 * group and are drawn with a two-color gradient.
 */
export function GroupSelectionView({
  groupsData,
  selectedGroup,
  onSelectGroup,
}: Props) {
  const groupById = new Map(groupsData.map((g) => [g.groupId, g]));
  const grid = buildGroupGrid(
    groupsData.map((g) => ({
      id: g.groupId,
      name: g.groupName,
      color: g.groupColor,
      isRotational: g.isRotational,
    })),
  );

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${grid.columns}, minmax(6rem, 1fr))`,
          gridAutoRows: "minmax(4rem, auto)",
        }}
      >
        {grid.cells.map((cell) => {
          const group = cell.item ? groupById.get(cell.item.id) : undefined;
          const isSelected = !!group && group.groupId === selectedGroup;

          // Rotation tiles blend the colors of the two groups they rotate
          // between (left = first group, right = second group).
          const [rotationLeft, rotationRight] = cell.rotationColors ?? [];
          const rotationBackground =
            rotationLeft && rotationRight
              ? `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.28) 100%), linear-gradient(90deg, ${rotationLeft} 0%, ${rotationRight} 100%)`
              : null;

          return (
            <div
              key={cell.key}
              className={cn(
                "flex min-w-0 p-1.5",
                // Vertical separator between columns.
                cell.columnStart > 1 &&
                  "border-medieval-wood-border/40 border-l",
                // Horizontal separator above the rotation row.
                cell.rotation && "border-medieval-wood-border/40 border-t",
              )}
              style={{
                gridColumn: `${cell.columnStart} / span ${cell.columnSpan}`,
                gridRow: cell.row,
              }}
            >
              {group ? (
                <Button
                  className={cn(
                    "border-medieval-wood-border h-full min-h-12 w-full rounded-lg border-2 px-4 text-center text-xs font-bold tracking-wide whitespace-normal transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] sm:min-h-14",
                    isSelected
                      ? "border-medieval-gold"
                      : "hover:border-medieval-gold/70 opacity-80 hover:-translate-y-0.5 hover:opacity-100",
                  )}
                  style={{
                    background:
                      rotationBackground ??
                      (group.groupColor
                        ? `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.28) 100%), linear-gradient(rgba(70, 48, 33, 0.35), rgba(70, 48, 33, 0.35)), ${group.groupColor}`
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.22)), var(--medieval-wood)"),
                    color: "var(--medieval-parchment-foreground)",
                    boxShadow: isSelected
                      ? "0 0 16px rgba(230, 192, 82, 0.6)"
                      : "0 2px 6px rgba(0, 0, 0, 0.35)",
                  }}
                  onClick={() => onSelectGroup(group.groupId)}
                >
                  {group.groupName}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
