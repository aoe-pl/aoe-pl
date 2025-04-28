import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sword, Clock } from "lucide-react";

interface Match {
  id: string;
  player1: string;
  player2: string;
  time: string;
  group: {
    name: string;
    color: string;
  };
  isLive?: boolean;
}

interface MatchScheduleProps {
  date: string;
  matches: Match[];
}

export function MatchSchedule({ date, matches }: MatchScheduleProps) {
  const getGroupColor = (color: string) => {
    const colors: Record<string, string> = {
      gold: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
      red: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800",
      green:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
      blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
      purple:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800",
    };

    return (
      colors[color] ??
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    );
  };

  return (
    <Card className="py-0">
      <CardHeader className="bg-amber-50 py-4 dark:bg-amber-950">
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-amber-600" />
          Mecze na {date}
        </CardTitle>
        <CardDescription>Harmonogram rozgrywek</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={getGroupColor(match.group.color)}
                >
                  {match.group.name}
                </Badge>
                {match.isLive && (
                  <Badge variant="destructive" className="animate-pulse">
                    LIVE
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span>{match.player1}</span>
                <Sword className="h-4 w-4 text-amber-600" />
                <span>{match.player2}</span>
              </div>
              <div className="text-muted-foreground text-sm">{match.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
