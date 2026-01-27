import { Medal, Loader2 } from "lucide-react";
import { getTopPolishPlayers } from "@/lib/helpers/aoe2-api";

export function TopPlayersLoading() {
  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-2">
        <Medal className="h-5 w-5" />
        Top 10 Polskich Graczy
      </div>
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-accent h-8 w-8 animate-spin" />
        <span className="text-muted-foreground ml-3">Ładowanie graczy...</span>
      </div>
    </div>
  );
}

export async function TopPlayers() {
  try {
    const players = await getTopPolishPlayers(10);

    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <Medal className="h-5 w-5 text-white" />
          Top 10 Polskich Graczy
        </div>

        <div className="space-y-3">
          {players.map((player, index) => {
            const rank = index + 1;

            return (
              <div
                key={player.profileId}
                className="bg-background/50 border-border/50 flex items-center justify-between rounded-lg border p-3"
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
                  <div className="flex-1">
                    <div className="text-foreground font-semibold">
                      {player.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {player.wins} zwycięstw
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-accent font-bold">{player.rating}</div>
                  <div className="text-muted-foreground text-xs">MMR</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch top players:", error);
    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Top 10 Polskich Graczy
        </div>
        <div className="text-muted-foreground py-12 text-center">
          Nie udało się załadować graczy
        </div>
      </div>
    );
  }
}
