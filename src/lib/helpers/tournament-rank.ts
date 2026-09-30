import { db } from "@/server/db";

export interface TournamentRankInput {
  participantId: string;
  tournamentId: string;
  tournamentStatus: string;
  tournamentFormat: "GROUP" | "BRACKET";
  teamId: string | null;
  groupIds: string[];
}

/**
 * Computes the rank a player achieved in their finished tournament
 * participations.
 *
 * - GROUP tournaments: the player's position in their group standings.
 * - BRACKET tournaments: only the grand final winner is ranked (1st).
 *
 * Returns a map of participant id -> rank. Participants without a rank are
 * omitted.
 */
export async function getAchievedRanks(
  participations: TournamentRankInput[],
): Promise<Map<string, number>> {
  const ranks = new Map<string, number>();

  const finishedGroup = participations.filter(
    (p) =>
      p.tournamentStatus === "FINISHED" &&
      p.tournamentFormat === "GROUP" &&
      p.groupIds.length > 0,
  );
  const finishedBracket = participations.filter(
    (p) =>
      p.tournamentStatus === "FINISHED" && p.tournamentFormat === "BRACKET",
  );

  if (finishedGroup.length > 0) {
    await computeGroupRanks(finishedGroup, ranks);
  }

  if (finishedBracket.length > 0) {
    await computeBracketRanks(finishedBracket, ranks);
  }

  return ranks;
}

async function computeGroupRanks(
  participations: TournamentRankInput[],
  ranks: Map<string, number>,
) {
  const groupIds = [...new Set(participations.flatMap((p) => p.groupIds))];

  const [members, matches] = await Promise.all([
    db.tournamentGroupParticipant.findMany({
      where: { tournamentGroupId: { in: groupIds } },
      select: {
        tournamentGroupId: true,
        tournamentParticipantId: true,
        displayOrder: true,
      },
    }),
    db.tournamentMatch.findMany({
      where: { groupId: { in: groupIds }, status: "ADMIN_APPROVED" },
      select: {
        groupId: true,
        TournamentMatchParticipant: {
          select: { participantId: true, wonScore: true },
        },
      },
    }),
  ]);

  const points = new Map<string, number>();
  for (const match of matches) {
    if (!match.groupId) continue;

    for (const mp of match.TournamentMatchParticipant) {
      if (!mp.participantId) continue;

      const key = `${match.groupId}:${mp.participantId}`;

      points.set(key, (points.get(key) ?? 0) + mp.wonScore);
    }
  }

  const membersByGroup = new Map<string, typeof members>();
  for (const member of members) {
    const list = membersByGroup.get(member.tournamentGroupId) ?? [];

    list.push(member);
    membersByGroup.set(member.tournamentGroupId, list);
  }

  const rankByGroupParticipant = new Map<string, number>();
  for (const [groupId, groupMembers] of membersByGroup) {
    const sorted = [...groupMembers].sort((a, b) => {
      const aPoints =
        points.get(`${groupId}:${a.tournamentParticipantId}`) ?? 0;

      const bPoints =
        points.get(`${groupId}:${b.tournamentParticipantId}`) ?? 0;

      if (bPoints !== aPoints) return bPoints - aPoints;

      return a.displayOrder - b.displayOrder;
    });

    sorted.forEach((member, index) => {
      rankByGroupParticipant.set(
        `${groupId}:${member.tournamentParticipantId}`,
        index + 1,
      );
    });
  }

  for (const participation of participations) {
    let bestRank: number | null = null;

    for (const groupId of participation.groupIds) {
      const rank = rankByGroupParticipant.get(
        `${groupId}:${participation.participantId}`,
      );

      if (rank != null && (bestRank == null || rank < bestRank)) {
        bestRank = rank;
      }
    }

    if (bestRank != null) {
      ranks.set(participation.participantId, bestRank);
    }
  }
}

async function computeBracketRanks(
  participations: TournamentRankInput[],
  ranks: Map<string, number>,
) {
  const tournamentIds = [...new Set(participations.map((p) => p.tournamentId))];

  const brackets = await db.tournamentBracket.findMany({
    where: { tournamentId: { in: tournamentIds } },
    select: {
      tournamentId: true,
      bracketSize: true,
      bracketType: true,
      bracketNodes: {
        select: {
          round: true,
          position: true,
          isWinnerBracket: true,
          match: {
            select: {
              TournamentMatchParticipant: {
                select: { participantId: true, teamId: true, isWinner: true },
              },
            },
          },
        },
      },
    },
  });

  for (const participation of participations) {
    const won = brackets.some((bracket) => {
      const wbRounds = Math.round(Math.log2(bracket.bracketSize));
      const finalRound =
        bracket.bracketType === "DOUBLE_ELIMINATION" ? wbRounds + 1 : wbRounds;
      const finalNode = bracket.bracketNodes.find(
        (node) =>
          node.isWinnerBracket &&
          node.round === finalRound &&
          node.position === 0,
      );
      const winner = finalNode?.match?.TournamentMatchParticipant.find(
        (mp) => mp.isWinner,
      );

      if (!winner) return false;

      return (
        (winner.participantId != null &&
          winner.participantId === participation.participantId) ||
        (winner.teamId != null &&
          participation.teamId != null &&
          winner.teamId === participation.teamId)
      );
    });

    if (won) {
      ranks.set(participation.participantId, 1);
    }
  }
}
