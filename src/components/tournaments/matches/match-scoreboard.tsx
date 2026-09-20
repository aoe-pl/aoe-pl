import { PlayerLink } from "@/components/player-link";

interface MatchScoreboardProps {
  player1Name: string;
  player2Name: string;
  player1Number?: number;
  player2Number?: number;
  player1Score: number;
  player2Score: number;
}

/**
 * Wooden banner showing both players and the current series score.
 */
export function MatchScoreboard({
  player1Name,
  player2Name,
  player1Number,
  player2Number,
  player1Score,
  player2Score,
}: MatchScoreboardProps) {
  const player1Leading = player1Score > player2Score;
  const player2Leading = player2Score > player1Score;

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
      <div className="flex items-center justify-center gap-2 sm:gap-8">
        <span
          className={`flex-1 truncate text-right text-sm font-bold sm:text-2xl ${
            player1Leading
              ? "text-[color:var(--medieval-gold)]"
              : "text-[color:var(--medieval-parchment-foreground)]"
          }`}
        >
          <PlayerLink
            name={player1Name}
            playerNumber={player1Number}
          />
        </span>

        <span className="shrink-0 text-xl font-black tabular-nums sm:text-4xl">
          <span
            className={
              player1Leading
                ? "text-[color:var(--medieval-gold)]"
                : "text-[color:var(--medieval-parchment-foreground)]"
            }
          >
            {player1Score}
          </span>
          <span className="mx-2 text-[color:var(--medieval-gold-muted)]">
            :
          </span>
          <span
            className={
              player2Leading
                ? "text-[color:var(--medieval-gold)]"
                : "text-[color:var(--medieval-parchment-foreground)]"
            }
          >
            {player2Score}
          </span>
        </span>

        <span
          className={`flex-1 truncate text-left text-sm font-bold sm:text-2xl ${
            player2Leading
              ? "text-[color:var(--medieval-gold)]"
              : "text-[color:var(--medieval-parchment-foreground)]"
          }`}
        >
          <PlayerLink
            name={player2Name}
            playerNumber={player2Number}
          />
        </span>
      </div>
    </div>
  );
}
