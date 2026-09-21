"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { GroupPageData } from "./types/types";

type Props = {
  groupsData: GroupPageData[];
  selectedGroup: string | null;
  onSelectGroup: (group: string) => void;
};

/**
 * Wooden banner holding the group selector buttons.
 */
export function GroupSelectionView({
  groupsData,
  selectedGroup,
  onSelectGroup,
}: Props) {
  return (
    <div
      className="w-full rounded-2xl border-2 border-[color:var(--medieval-wood-border)] px-4 py-4 sm:px-6 sm:py-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.18)), var(--medieval-wood)",
        boxShadow:
          "inset 0 2px 0 rgba(255, 255, 255, 0.05), 0 6px 18px rgba(0, 0, 0, 0.45)",
      }}
    >
      <div className="flex w-full flex-row flex-wrap items-center justify-center gap-3">
        {groupsData.map((g) => {
          const color = g.groupColor;
          const isSelected = g.groupId === selectedGroup;

          return (
            <Button
              key={g.groupId}
              className={cn(
                "h-12 rounded-lg border-2 border-[color:var(--medieval-wood-border)] px-6 text-base font-bold tracking-wide transition-all [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] sm:h-14 sm:px-8",
                isSelected
                  ? "border-[color:var(--medieval-gold)]"
                  : "opacity-80 hover:-translate-y-0.5 hover:border-[color:var(--medieval-gold)]/70 hover:opacity-100",
              )}
              style={{
                background: color
                  ? `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.28) 100%), linear-gradient(rgba(70, 48, 33, 0.35), rgba(70, 48, 33, 0.35)), ${color}`
                  : "linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.22)), var(--medieval-wood)",
                color: "var(--medieval-parchment-foreground)",
                boxShadow: isSelected
                  ? "0 0 16px rgba(230, 192, 82, 0.6)"
                  : "0 2px 6px rgba(0, 0, 0, 0.35)",
              }}
              onClick={() => onSelectGroup(g.groupId)}
            >
              {g.groupName}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
