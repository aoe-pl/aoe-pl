"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { Game } from "./match";

interface GameDisplayProps {
  games: Game[];
  showSpoilers?: boolean;
}

export function GameDisplay({ games }: GameDisplayProps) {
  if (games.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">No games recorded yet</div>
    );
  }

  return (
    <div className="space-y-2">
      {games.map((game) => (
        <Card
          key={game.id}
          className="text-sm"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Game {game.map?.name ?? "Unknown Map"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {format(new Date(game.gameDate), "MMM dd, HH:mm")}
                </Badge>
                {game.recUrl && (
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    Recording
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-muted-foreground text-xs">Winner</span>
                <div className="font-medium">
                  {game.winner?.participant?.nickname ??
                    game.winner?.team?.name ??
                    "Unknown"}
                </div>
              </div>
              <div className="text-center">
                <span className="text-muted-foreground text-xs">Loser</span>
                <div className="font-medium">
                  {game.loser?.participant?.nickname ??
                    game.loser?.team?.name ??
                    "Unknown"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
