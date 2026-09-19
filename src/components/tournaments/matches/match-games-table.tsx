import { Crown } from "lucide-react";

export interface MatchGameRow {
  player1Civ: string | null;
  player2Civ: string | null;
  map: string | null;
  player1Won: boolean;
  player2Won: boolean;
}

interface MatchGamesTableProps {
  rows: MatchGameRow[];
}

/**
 * Per-game breakdown (civ / map / civ) with a crown marking each game's
 * winner. Rows without data render a "-" placeholder.
 */
export function MatchGamesTable({ rows }: MatchGamesTableProps) {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[color:var(--medieval-wood-border)]">
      {rows.map((row, index) => (
        <div
          key={index}
          className={`grid grid-cols-[2rem_minmax(0,1fr)_1rem_minmax(0,1fr)_1rem_minmax(0,1fr)_2rem] items-center gap-1 px-3 py-3 text-sm ${
            index === 0
              ? ""
              : "border-t border-[color:var(--medieval-wood-border)]"
          } ${index % 2 === 1 ? "bg-black/10" : ""}`}
        >
          <span className="flex justify-center">
            {row.player1Won && (
              <Crown className="h-4 w-4 text-[color:var(--medieval-gold)]" />
            )}
          </span>
          <span className="truncate text-right text-[color:var(--medieval-parchment-foreground)]">
            {row.player1Civ ?? "-"}
          </span>
          <span className="text-center text-[color:var(--medieval-gold-muted)]"></span>
          <span className="truncate text-center font-medium text-[color:var(--medieval-gold)]">
            {row.map ?? "-"}
          </span>
          <span className="text-center text-[color:var(--medieval-gold-muted)]"></span>
          <span className="truncate text-left text-[color:var(--medieval-parchment-foreground)]">
            {row.player2Civ ?? "-"}
          </span>
          <span className="flex justify-center">
            {row.player2Won && (
              <Crown className="h-4 w-4 text-[color:var(--medieval-gold)]" />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
