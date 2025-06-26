import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchManagement } from "./match-management";
import type { ExtendedTournamentMatch } from "./match";
import type { MatchStatus } from "@prisma/client";

export function MatchesContainer({
  matches,
  groupId,
  matchMode,
  isTeamBased = false,
  isMixed = false,
}: {
  matches: ExtendedTournamentMatch[];
  groupId: string;
  matchMode: { id: string; mode: string; gameCount: number };
  isTeamBased?: boolean;
  isMixed?: boolean;
}) {
  const matchesByStatus = matches.reduce(
    (acc, match) => {
      let arr = acc[match.status];
      if (!arr) {
        arr = [];
        acc[match.status] = arr;
      }
      arr.push(match);
      return acc;
    },
    {} as Record<MatchStatus, ExtendedTournamentMatch[]>,
  );

  const statuses = Object.keys(matchesByStatus) as MatchStatus[];

  if (statuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchManagement
            groupId={groupId}
            matches={[]}
            matchMode={matchMode}
            isTeamBased={isTeamBased}
            isMixed={isMixed}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {statuses.map((status) => (
          <div
            key={status}
            className="mb-6"
          >
            <h3 className="mb-2 text-lg font-semibold">
              {status} ({matchesByStatus[status]?.length ?? 0})
            </h3>
            <MatchManagement
              groupId={groupId}
              matches={matchesByStatus[status] ?? []}
              matchMode={matchMode}
              isTeamBased={isTeamBased}
              isMixed={isMixed}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
