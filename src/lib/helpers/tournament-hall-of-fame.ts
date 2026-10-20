import { slugify } from "@/lib/utils";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

const tournamentResultsSelect = {
  id: true,
  name: true,
  urlKey: true,
  startDate: true,
  endDate: true,
  tournamentSeries: {
    select: { name: true },
  },
  brackets: {
    select: {
      id: true,
      name: true,
      bracketType: true,
      bracketSize: true,
      bracketNodes: {
        select: {
          round: true,
          position: true,
          isWinnerBracket: true,
          match: {
            select: {
              status: true,
              TournamentMatchParticipant: {
                select: {
                  isWinner: true,
                  participant: {
                    select: {
                      nickname: true,
                      user: {
                        select: {
                          playerNumber: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  groups: {
    where: { isRotational: false },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      TournamentGroupParticipant: {
        select: {
          displayOrder: true,
          tournamentParticipant: {
            select: {
              id: true,
              nickname: true,
              user: {
                select: {
                  playerNumber: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      matches: {
        where: { status: "ADMIN_APPROVED" },
        select: {
          TournamentMatchParticipant: {
            select: {
              participantId: true,
              wonScore: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.TournamentSelect;

type TournamentResult = Prisma.TournamentGetPayload<{
  select: typeof tournamentResultsSelect;
}>;

type GroupResult = TournamentResult["groups"][number];
type GroupMember = GroupResult["TournamentGroupParticipant"][number];

export interface HallOfFameWinner {
  name: string;
  playerNumber: number | null;
}

export interface HallOfFameGroupResult {
  id: string;
  name: string;
  color: string | null;
  isBracket: boolean;
  winner: HallOfFameWinner;
}

export interface HallOfFameTournament {
  tournamentId: string;
  tournamentName: string;
  seriesName: string;
  href: string;
  date: Date;
  groups: HallOfFameGroupResult[];
}

export interface HallOfFameData {
  tournaments: HallOfFameTournament[];
}

/**
 * Returns every finished tournament with the winner of each of its groups.
 * Rotational groups are derived groupings and are skipped. Groups without
 * approved match results are omitted. Bracket tournaments list their bracket
 * finals instead of groups. Tournaments without any group or bracket results
 * are omitted.
 */
export async function getHallOfFame(): Promise<HallOfFameData> {
  const tournaments = await db.tournament.findMany({
    where: {
      status: "FINISHED",
      isTeamBased: false,
      includeInHallOfFame: true,
    },
    select: tournamentResultsSelect,
  });

  const result: HallOfFameTournament[] = [];

  for (const tournament of tournaments) {
    const groups = tournament.groups.flatMap((group) => {
      const winner = getGroupWinner(group);

      if (!winner) return [];

      return [
        {
          id: group.id,
          name: group.name,
          color: group.color,
          isBracket: false,
          winner,
        },
      ];
    });

    const bracketWinners = getBracketWinners(tournament).map((bracket) => ({
      id: bracket.id,
      name: bracket.name,
      color: null,
      isBracket: true,
      winner: bracket.winner,
    }));

    const entries = [...groups, ...bracketWinners];

    if (entries.length === 0) continue;

    result.push({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      seriesName: tournament.tournamentSeries.name,
      href: `/tournaments/${slugify(tournament.tournamentSeries.name)}/${tournament.urlKey}`,
      date: tournament.endDate ?? tournament.startDate,
      groups: entries,
    });
  }

  return {
    tournaments: result.sort((a, b) => b.date.getTime() - a.date.getTime()),
  };
}

function getGroupWinner(group: GroupResult): HallOfFameWinner | null {
  if (group.matches.length === 0) return null;

  const points = new Map<string, number>();

  for (const match of group.matches) {
    for (const participant of match.TournamentMatchParticipant) {
      if (!participant.participantId) continue;

      points.set(
        participant.participantId,
        (points.get(participant.participantId) ?? 0) + participant.wonScore,
      );
    }
  }

  const standings = group.TournamentGroupParticipant.map((member) => ({
    member,
    displayOrder: member.displayOrder,
    points: points.get(member.tournamentParticipant.id) ?? 0,
  })).sort((a, b) => b.points - a.points || a.displayOrder - b.displayOrder);

  return standings[0] ? toWinner(standings[0].member) : null;
}

function toWinner(member: GroupMember): HallOfFameWinner {
  const participant = member.tournamentParticipant;

  return {
    name: participant.user?.name ?? participant.nickname,
    playerNumber: participant.user?.playerNumber ?? null,
  };
}

function getBracketWinners(tournament: TournamentResult) {
  return tournament.brackets.flatMap((bracket) => {
    const winnerBracketRounds = Math.round(Math.log2(bracket.bracketSize));
    const finalRound =
      bracket.bracketType === "DOUBLE_ELIMINATION"
        ? winnerBracketRounds + 1
        : winnerBracketRounds;

    const finalNode = bracket.bracketNodes.find(
      (node) =>
        node.isWinnerBracket &&
        node.round === finalRound &&
        node.position === 0,
    );

    if (!finalNode?.match || finalNode.match.status !== "ADMIN_APPROVED") {
      return [];
    }

    const winner = finalNode.match.TournamentMatchParticipant.find(
      (participant) => participant.isWinner,
    )?.participant;

    if (!winner) return [];

    return [
      {
        id: bracket.id,
        name: bracket.name,
        winner: {
          name: winner.user?.name ?? winner.nickname,
          playerNumber: winner.user?.playerNumber ?? null,
        },
      },
    ];
  });
}
