"use client";

import { Button } from "@/components/ui/button";
import { TournamentBracketGraph } from "@/lib/admin-panel/tournaments/tournament-bracket-graph";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/react";
import { useState } from "react";

type PublicBracketListProps = {
  brackets: RouterOutputs["tournaments"]["brackets"]["listByTournament"];
};

export function PublicBracketList({ brackets }: PublicBracketListProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    brackets[0]?.id,
  );

  if (brackets.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No brackets have been published yet.
      </p>
    );
  }

  const selected = brackets.find((b) => b.id === selectedId) ?? brackets[0]!;

  return (
    <div className="space-y-4">
      {brackets.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {brackets.map((bracket) => (
            <Button
              key={bracket.id}
              size="sm"
              variant={bracket.id === selected.id ? "default" : "outline"}
              onClick={() => setSelectedId(bracket.id)}
              className={cn(bracket.id === selected.id && "font-semibold")}
            >
              {bracket.name}
            </Button>
          ))}
        </div>
      )}

      <TournamentBracketGraph
        bracketId={selected.id}
        readOnly
      />
    </div>
  );
}
