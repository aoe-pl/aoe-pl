import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface Player {
  rank: number;
  nickname: string;
  mmr: number;
  maxMmr: number;
  trend: string;
}

interface PlayerRankingProps {
  players: Player[];
}

export function PlayerRanking({ players }: PlayerRankingProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-amber-50 dark:bg-amber-950">
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Gracz</TableHead>
            <TableHead className="text-right">MMR</TableHead>
            <TableHead className="text-right">Max MMR</TableHead>
            <TableHead className="w-16 text-center">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.nickname}>
              <TableCell className="text-center font-medium">
                {player.rank <= 3 ? (
                  <Badge
                    className={` ${player.rank === 1 ? "bg-amber-500 hover:bg-amber-600" : ""} ${player.rank === 2 ? "bg-gray-400 hover:bg-gray-500" : ""} ${player.rank === 3 ? "bg-amber-700 hover:bg-amber-800" : ""} `}
                  >
                    {player.rank}
                  </Badge>
                ) : (
                  player.rank
                )}
              </TableCell>
              <TableCell className="font-medium">{player.nickname}</TableCell>
              <TableCell className="text-right">{player.mmr}</TableCell>
              <TableCell className="text-right">{player.maxMmr}</TableCell>
              <TableCell className="text-center">
                {getTrendIcon(player.trend)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
