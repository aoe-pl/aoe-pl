"use client";

import { PlayerLink } from "@/components/player-link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 10;

interface TopPlayersListProps {
  players: {
    profileId: number;
    name: string;
    rating: number;
    playerNumber: number | null;
  }[];
}

/**
 * Interactive list of top players with client-side pagination.
 * Shows PAGE_SIZE players per page, starting from the highest ranked.
 */
export function TopPlayersList({ players }: TopPlayersListProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(players.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const visiblePlayers = players.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div>
        {visiblePlayers.map((player, index) => {
          const rank = start + index + 1;
          const isLast = index === visiblePlayers.length - 1;

          return (
            <div
              key={player.profileId}
              className={`flex items-center justify-between px-3 py-1 ${
                isLast ? "" : "border-b border-[var(--medieval-parchment)]"
              }`}
            >
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center text-xl font-bold">
                  {rank === 1 ? (
                    "🥇"
                  ) : rank === 2 ? (
                    "🥈"
                  ) : rank === 3 ? (
                    "🥉"
                  ) : (
                    <span className="text-accent text-sm">{rank}</span>
                  )}
                </div>
                <div className="text-foreground flex-1 font-semibold">
                  <PlayerLink
                    playerNumber={player.playerNumber ?? undefined}
                    name={player.name}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-accent font-bold">{player.rating}</div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="wood"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-semibold">
            {page + 1} / {totalPages}
          </span>

          <Button
            variant="wood"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
