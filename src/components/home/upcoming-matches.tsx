import { Sword, Clock } from "lucide-react";

const mockUpcomingMatches = [
  {
    id: 1,
    player1: "amon",
    player2: "Shashlyk",
    time: "Dziś o 19:00",
    tournament: "Red Ants 1",
    bestOf: "5",
  },
  {
    id: 2,
    player1: "GwizdeK",
    player2: "aNNekeG",
    time: "Jutro o 18:30",
    tournament: "Purple Ants",
    bestOf: "9",
  },
];

export function UpcomingMatches() {
  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-2">
        <Sword className="h-5 w-5" />
        Nadchodzące Mecze
      </div>

      <div className="space-y-3">
        {mockUpcomingMatches.map((match) => (
          <div
            key={match.id}
            className="bg-background/50 border-border/50 hover:border-accent/50 rounded-lg border p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-foreground text-sm font-semibold">
                    {match.player1}
                  </div>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <div className="text-foreground text-sm font-semibold">
                    {match.player2}
                  </div>
                </div>

                <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{match.time}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/20 text-accent rounded px-2 py-1 text-xs">
                    {match.tournament}
                  </span>
                  <span className="bg-secondary/40 text-foreground/80 rounded px-2 py-1 text-xs">
                    Bo{match.bestOf}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
