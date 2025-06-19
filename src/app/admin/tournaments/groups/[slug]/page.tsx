import { api } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeaderContainer } from "@/lib/admin-panel/tournaments/groups-detail/header-container";
import { GroupParticipantsTable } from "@/lib/admin-panel/tournaments/groups-detail/group-participants";

// TODO: Use the types from the prisma schema?
interface Game {
  id: string;
  matchId: string;
  mapId: string;
  gameDate: string;
  recUrl: string | null;
  winnerId: string;
  loserId: string;
}

interface TournamentParticipant {
  id: string;
  tournamentId: string;
  teamId: string | null;
  userId: string | null;
  status: string;
  seedNumber: number | null;
  registrationDate: string;
  nickname: string;
}

interface TournamentGroupParticipant {
  id: string;
  tournamentGroupId: string;
  tournamentParticipantId: string;
  displayOrder: number;
  comment: string | null;
  seedNumber: number | null;
  tournamentParticipant: TournamentParticipant;
}

interface MatchParticipant {
  id: string;
  matchId: string;
  participantId: string | null;
  teamId: string | null;
  isWinner: boolean;
  score: number | null;
  participant: TournamentParticipant | null;
  match: Match;
  team: { id: string; name: string } | null;
  gamesLost: Game[];
  gamesWon: Game[];
}

interface Match {
  id: string;
  groupId: string;
  matchDate: string | null;
  civDraftKey: string;
  mapDraftKey: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  comment: string | null;
  adminComment: string | null;
  isManualMatch: boolean;
  createdBy: string | null;
  createdAt: string;
  tournamentMatchModeId: string | null;
  TournamentMatchParticipant: MatchParticipant[];
}

interface TournamentGroup {
  id: string;
  stageId: string;
  displayOrder: number;
  name: string;
  description: string;
  matchModeId: string | null;
  isTeamBased: boolean | null;
  matchMode: { id: string; mode: string; gameCount: number };
  TournamentGroupParticipant: TournamentGroupParticipant[];
  matches: Match[];
}

function hasTwoParticipantsWithData(
  arr: MatchParticipant[] | undefined,
): arr is [MatchParticipant, MatchParticipant, ...MatchParticipant[]] {
  return (
    Array.isArray(arr) &&
    arr.length >= 2 &&
    !!arr[0] &&
    !!arr[1] &&
    !!arr[0].participant &&
    !!arr[1].participant
  );
}

function MatchCard({ match }: { match: Match }) {
  if (!hasTwoParticipantsWithData(match.TournamentMatchParticipant)) {
    return null;
  }
  const [participant1, participant2] = match.TournamentMatchParticipant;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Match</CardTitle>
          <Badge
            variant={
              (match.status ?? "SCHEDULED") === "COMPLETED"
                ? "default"
                : (match.status ?? "SCHEDULED") === "IN_PROGRESS"
                  ? "secondary"
                  : (match.status ?? "SCHEDULED") === "SCHEDULED"
                    ? "outline"
                    : "destructive"
            }
          >
            {match.status ?? "SCHEDULED"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium">
              {participant1.participant!.nickname}
            </span>
            {participant1.isWinner && <Badge>Winner</Badge>}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium">
              {participant2.participant!.nickname}
            </span>
            {participant2.isWinner && <Badge>Winner</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchesContainer({ matches }: { matches: Match[] }) {
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
    {} as Record<string, Match[]>,
  );

  const statuses = Object.keys(matchesByStatus);
  if (statuses.length === 0) {
    return null;
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {matchesByStatus[status]?.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function TournamentGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: groupId } = await params;

  const group = await api.tournaments.groups.get({
    id: groupId,
  });

  if (!group) {
    return null;
  }

  const matchMode = group.matchMode ?? group.stage.tournament.matchMode;

  // TODO: Extract this or remove?
  // Convert dates to strings for our interface
  const formattedGroup: TournamentGroup = {
    ...group,
    description: group.description ?? "", // Ensure description is never null
    matchMode,
    TournamentGroupParticipant: group.TournamentGroupParticipant.map((p) => ({
      ...p,
      tournamentParticipant: {
        ...p.tournamentParticipant,
        registrationDate:
          p.tournamentParticipant.registrationDate.toISOString(),
      },
    })),
    matches: group.matches.map((m) => {
      const formattedMatch: Match = {
        ...m,
        matchDate: m.matchDate?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
        groupId: m.groupId ?? group.id, // Ensure groupId is never null
        TournamentMatchParticipant: m.TournamentMatchParticipant.filter(
          (p) => p.participant !== null,
        ).map((p) => {
          const participant = p.participant!;
          return {
            ...p,
            participantId: p.participantId ?? participant.id, // We know participant is not null due to filter
            participant: {
              ...participant,
              registrationDate: participant.registrationDate.toISOString(),
            },
            match: {
              ...m,
              matchDate: m.matchDate?.toISOString() ?? null,
              createdAt: m.createdAt.toISOString(),
              groupId: m.groupId ?? group.id,
              TournamentMatchParticipant: [], // This will be populated in the next iteration
            },
            gamesLost: p.gamesLost.map((g) => ({
              ...g,
              gameDate: g.gameDate.toISOString(),
            })),
            gamesWon: p.gamesWon.map((g) => ({
              ...g,
              gameDate: g.gameDate.toISOString(),
            })),
          };
        }),
      };
      return formattedMatch;
    }),
  };

  // Now that all matches are formatted, we can update the TournamentMatchParticipant references
  formattedGroup.matches = formattedGroup.matches.map((match) => ({
    ...match,
    TournamentMatchParticipant: match.TournamentMatchParticipant.map((p) => ({
      ...p,
      match: {
        ...p.match,
        TournamentMatchParticipant: match.TournamentMatchParticipant,
      },
    })),
  }));

  return (
    <div className="container mx-auto space-y-6 py-6">
      <HeaderContainer
        group={group}
        matchesCount={group.matches.length}
        matchMode={matchMode}
        tournamentId={group.stage.tournamentId}
      />
      <div className="grid gap-6">
        <GroupParticipantsTable
          participants={group.TournamentGroupParticipant}
        />
        <MatchesContainer matches={formattedGroup.matches} />
      </div>
    </div>
  );
}
