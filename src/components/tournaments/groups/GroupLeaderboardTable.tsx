import { PlayerLink } from "@/components/player-link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { GroupPageData } from "./types/types";

interface LeaderboardPlayerStats {
  playerId: string;
  playerName: string;
  playerNumber: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  totalScore: number;
}

export function GroupLeaderboardTable({
  groupData,
  selectedPlayerId,
  onSelectPlayer,
}: {
  groupData: GroupPageData;
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string) => void;
}) {
  const t = useTranslations("tournament.groups");

  const playerMap = new Map<string, LeaderboardPlayerStats>();

  for (const player of groupData.players) {
    playerMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.playerNumber,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      totalScore: 0,
    });
  }

  const approvedMatches = groupData.matches.filter(
    (m) => m.status === "ADMIN_APPROVED",
  );

  for (const match of approvedMatches) {
    for (const participant of match.TournamentMatchParticipant) {
      const player = playerMap.get(participant.participantId!);

      if (!player) continue;

      player.matchesPlayed++;

      if (participant.isWinner) {
        player.matchesWon++;
      } else {
        player.matchesLost++;
      }
      player.totalScore += participant.wonScore;
    }
  }

  const players = Array.from(playerMap.values()).sort(
    (a, b) => b.totalScore - a.totalScore,
  );

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-xl border border-[color:var(--medieval-wood-border)]">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[color:var(--medieval-wood-border)] bg-black/20 hover:bg-black/20">
              <TableHead className="w-12 px-3 text-center text-xs font-bold tracking-wide text-[color:var(--medieval-gold-muted)] uppercase">
                {t("rank")}
              </TableHead>
              <TableHead className="w-full px-3 text-left text-xs font-bold tracking-wide text-[color:var(--medieval-gold-muted)] uppercase">
                {t("player")}
              </TableHead>
              <TableHead className="px-3 text-center text-xs font-bold tracking-wide text-[color:var(--medieval-gold-muted)] uppercase">
                {t("played")}
              </TableHead>
              <TableHead className="px-3 text-center text-xs font-bold tracking-wide text-[color:var(--medieval-gold-muted)] uppercase">
                {t("won")}
              </TableHead>
              <TableHead className="px-3 text-center text-xs font-bold tracking-wide text-[color:var(--medieval-gold-muted)] uppercase">
                {t("lost")}
              </TableHead>
              <TableHead className="px-3 text-center text-xs font-bold tracking-wide text-[color:var(--medieval-gold-muted)] uppercase">
                {t("total_score")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p, index) => (
              <TableRow
                key={p.playerId}
                aria-selected={p.playerId === selectedPlayerId}
                onClick={() => onSelectPlayer(p.playerId)}
                className={cn(
                  "cursor-pointer border-b border-[color:var(--medieval-wood-border)]",
                  p.playerId === selectedPlayerId
                    ? "bg-[color:var(--medieval-gold)]/20 hover:bg-[color:var(--medieval-gold)]/25"
                    : index % 2 === 1
                      ? "bg-black/10 hover:bg-black/15"
                      : "hover:bg-black/5",
                )}
              >
                <TableCell className="px-3 text-center font-bold text-[color:var(--medieval-gold)]">
                  {index + 1}
                </TableCell>
                <TableCell className="text-primary px-3 text-left">
                  <PlayerLink
                    playerNumber={p.playerNumber}
                    name={p.playerName}
                  />
                </TableCell>
                <TableCell className="text-primary px-3 text-center tabular-nums">
                  {p.matchesPlayed}
                </TableCell>
                <TableCell className="text-primary px-3 text-center tabular-nums">
                  {p.matchesWon}
                </TableCell>
                <TableCell className="text-primary px-3 text-center tabular-nums">
                  {p.matchesLost}
                </TableCell>
                <TableCell className="px-3 text-center font-bold text-[color:var(--medieval-gold)] tabular-nums">
                  {p.totalScore}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
