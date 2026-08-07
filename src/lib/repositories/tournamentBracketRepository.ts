import {
  generateBracketPlan,
  getLbAdvanceTarget,
  getLoserDropTarget,
  getWbAdvanceTarget,
  isLbFinalRound,
  log2,
  type AdvanceTarget,
  type BracketParticipantSlot,
} from "@/lib/tournaments/match-generation/bracket-matches";
import { db } from "@/server/db";
import type { BracketType, Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export type TournamentBracketCreateData = {
  name: string;
  description?: string;
  displayOrder?: number;
  bracketType: BracketType;
  bracketSize: number;
  isSeeded: boolean;
  isManualSeeding?: boolean;
  startDate?: Date;
  endDate?: Date;
  /** Ordered by seed (index 0 = seed 1). Participant or team ids depending
   * on the tournament's isTeamBased setting. */
  entrantIds?: string[];
};

export type TournamentBracketUpdateData = Partial<
  Omit<TournamentBracketCreateData, "bracketType" | "bracketSize">
> & {
  bracketType?: BracketType;
  bracketSize?: number;
};

const bracketDetailInclude = {
  stage: { include: { tournament: true } },
  bracketNodes: {
    include: {
      match: {
        include: {
          TournamentMatchParticipant: {
            include: {
              participant: { include: { user: true, team: true } },
              team: {
                include: {
                  TournamentParticipant: { include: { user: true } },
                },
              },
            },
          },
          Game: true,
        },
      },
    },
    orderBy: [
      { isWinnerBracket: "desc" },
      { round: "asc" },
      { position: "asc" },
    ],
  },
} satisfies Prisma.TournamentBracketInclude;

export const tournamentBracketRepository = {
  async getBracketsByStageId(stageId: string) {
    return db.tournamentBracket.findMany({
      where: { stageId },
      orderBy: { displayOrder: "asc" },
    });
  },

  async getBracketsByTournamentId(tournamentId: string) {
    return db.tournamentBracket.findMany({
      where: { stage: { tournamentId } },
      include: { stage: true },
      orderBy: [{ stage: { name: "asc" } }, { displayOrder: "asc" }],
    });
  },

  async getBracketById(id: string) {
    return db.tournamentBracket.findUnique({
      where: { id },
      include: bracketDetailInclude,
    });
  },

  async createBracket(stageId: string, data: TournamentBracketCreateData) {
    return db.$transaction(async (tx) => {
      const stage = await tx.tournamentStage.findUniqueOrThrow({
        where: { id: stageId },
        include: { tournament: true },
      });

      const isTeamBased = stage.tournament.isTeamBased;
      const entrants = buildEntrantSlots(data.entrantIds ?? [], isTeamBased);

      const plan = generateBracketPlan({
        bracketType: data.bracketType,
        bracketSize: data.bracketSize,
        isSeeded: data.isSeeded,
        entrants,
      });

      const bracket = await tx.tournamentBracket.create({
        data: {
          name: data.name,
          description: data.description,
          displayOrder: data.displayOrder ?? 0,
          bracketType: data.bracketType,
          bracketSize: data.bracketSize,
          isSeeded: data.isSeeded,
          isManualSeeding: data.isManualSeeding ?? false,
          startDate: data.startDate,
          endDate: data.endDate,
          stage: { connect: { id: stageId } },
        },
      });

      await materializeBracketPlan(tx, bracket.id, plan);

      return bracket;
    });
  },

  async updateBracket(id: string, data: TournamentBracketUpdateData) {
    return db.$transaction(async (tx) => {
      const current = await tx.tournamentBracket.findUniqueOrThrow({
        where: { id },
        include: {
          stage: { include: { tournament: true } },
          bracketNodes: {
            include: {
              match: { include: { TournamentMatchParticipant: true } },
            },
          },
        },
      });

      const hasAnyResult = current.bracketNodes.some((node) =>
        node.match?.TournamentMatchParticipant.some((p) => p.isWinner),
      );

      const entrantsProvided = data.entrantIds !== undefined;

      if (entrantsProvided && hasAnyResult) {
        throw new Error(
          "Cannot change bracket participants after matches have results. Delete and recreate the bracket instead.",
        );
      }

      const bracketType = data.bracketType ?? current.bracketType;
      const bracketSize = data.bracketSize ?? current.bracketSize;
      const isSeeded = data.isSeeded ?? current.isSeeded;

      const structureChanged =
        entrantsProvided ||
        bracketType !== current.bracketType ||
        bracketSize !== current.bracketSize ||
        isSeeded !== current.isSeeded;

      if (structureChanged && hasAnyResult) {
        throw new Error(
          "Cannot change bracket structure after matches have results. Delete and recreate the bracket instead.",
        );
      }

      if (structureChanged) {
        // Wipe and regenerate. Deleting the bracket's matches cascades to
        // bracket nodes (matchId onDelete not cascade on node -> delete
        // nodes explicitly first).
        const matchIds = current.bracketNodes
          .map((n) => n.matchId)
          .filter((mid): mid is string => !!mid);

        await tx.tournamentBracketNode.deleteMany({ where: { bracketId: id } });
        if (matchIds.length > 0) {
          await tx.tournamentMatch.deleteMany({
            where: { id: { in: matchIds } },
          });
        }

        const isTeamBased = current.stage.tournament.isTeamBased;
        const entrants = buildEntrantSlots(
          data.entrantIds ??
            current.bracketNodes
              .filter((n) => n.isWinnerBracket && n.round === 1)
              .flatMap(
                (n) =>
                  n.match?.TournamentMatchParticipant.map(
                    (p) => p.participantId ?? p.teamId ?? "",
                  ) ?? [],
              ),
          isTeamBased,
        );

        const plan = generateBracketPlan({
          bracketType,
          bracketSize,
          isSeeded,
          entrants,
        });

        await tx.tournamentBracket.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            displayOrder: data.displayOrder,
            bracketType,
            bracketSize,
            isSeeded,
            isManualSeeding: data.isManualSeeding,
            startDate: data.startDate,
            endDate: data.endDate,
          },
        });

        await materializeBracketPlan(tx, id, plan);

        return tx.tournamentBracket.findUniqueOrThrow({ where: { id } });
      }

      return tx.tournamentBracket.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          displayOrder: data.displayOrder,
          isManualSeeding: data.isManualSeeding,
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });
    });
  },

  async deleteBracket(id: string) {
    return db.$transaction(async (tx) => {
      const nodes = await tx.tournamentBracketNode.findMany({
        where: { bracketId: id },
      });
      const matchIds = nodes
        .map((n) => n.matchId)
        .filter((mid): mid is string => !!mid);

      await tx.tournamentBracketNode.deleteMany({ where: { bracketId: id } });
      if (matchIds.length > 0) {
        await tx.tournamentMatch.deleteMany({
          where: { id: { in: matchIds } },
        });
      }

      return tx.tournamentBracket.delete({ where: { id } });
    });
  },
};

function buildEntrantSlots(
  entrantIds: string[],
  isTeamBased: boolean,
): BracketParticipantSlot[] {
  return entrantIds.map((id) =>
    isTeamBased ? { teamId: id } : { participantId: id },
  );
}

async function materializeBracketPlan(
  tx: TxClient,
  bracketId: string,
  plan: ReturnType<typeof generateBracketPlan>,
) {
  const nodeIdByKey = new Map<string, string>();
  const byeMatchIds: string[] = [];

  const key = (round: number, position: number, isWinnerBracket: boolean) =>
    `${isWinnerBracket ? "wb" : "lb"}:${round}:${position}`;

  // Pass 1: create matches + nodes.
  for (const spec of plan.nodes) {
    const initialParticipants = spec.initialParticipants ?? [];

    const match = await tx.tournamentMatch.create({
      data: {
        status: spec.isBye ? "COMPLETED" : "PENDING",
        civDraftKey: "",
        mapDraftKey: "",
        TournamentMatchParticipant:
          initialParticipants.length > 0
            ? {
                create: initialParticipants.map((p) => ({
                  participantId: p.participantId ?? undefined,
                  teamId: p.teamId ?? undefined,
                  isWinner: spec.isBye ?? false,
                })),
              }
            : undefined,
      },
    });

    const node = await tx.tournamentBracketNode.create({
      data: {
        bracketId,
        round: spec.round,
        position: spec.position,
        isWinnerBracket: spec.isWinnerBracket,
        matchId: match.id,
      },
    });

    nodeIdByKey.set(
      key(spec.round, spec.position, spec.isWinnerBracket),
      node.id,
    );

    if (spec.isBye) byeMatchIds.push(match.id);
  }

  // Pass 2: link parentNodeId for forward advancement within the same
  // sub-bracket (WB internal, LB internal, and both finals -> grand final).
  for (const spec of plan.nodes) {
    let target: AdvanceTarget | null = null;

    if (spec.isWinnerBracket) {
      target = getWbAdvanceTarget(
        spec.round,
        spec.position,
        plan.wbRounds,
        plan.lbRounds > 0,
      );
    } else {
      target = isLbFinalRound(spec.round, plan.lbRounds)
        ? { round: plan.wbRounds + 1, position: 0, isWinnerBracket: true }
        : getLbAdvanceTarget(spec.round, spec.position, plan.lbRounds);
    }

    if (!target) continue;

    const nodeId = nodeIdByKey.get(
      key(spec.round, spec.position, spec.isWinnerBracket),
    );
    const parentId = nodeIdByKey.get(
      key(target.round, target.position, target.isWinnerBracket),
    );

    if (nodeId && parentId) {
      await tx.tournamentBracketNode.update({
        where: { id: nodeId },
        data: { parentNodeId: parentId },
      });
    }
  }

  // Pass 3: resolve byes, propagating the sole entrant forward.
  for (const matchId of byeMatchIds) {
    await syncBracketAdvancement(tx, matchId, { hadWinnerBefore: false });
  }
}

/**
 * Propagates a match's winner (and, for double elimination, loser) to the
 * next bracket node(s), if this match belongs to a bracket and now has a
 * single determined winner.
 *
 * To keep this safe, advancement only fires on the transition from "no
 * determined winner" to "exactly one determined winner" - pass
 * `hadWinnerBefore: true` if the match already had a winner before this
 * update, and the call becomes a no-op. Editing an already-advanced
 * match's result later will NOT automatically retract/update downstream
 * matches - this is a known limitation; use the bracket admin view to fix
 * downstream matches manually if needed.
 */
export async function syncBracketAdvancement(
  tx: TxClient,
  matchId: string,
  opts: { hadWinnerBefore: boolean },
): Promise<void> {
  if (opts.hadWinnerBefore) return;

  const match = await tx.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      TournamentMatchParticipant: true,
      bracketNodes: { include: { bracket: true } },
    },
  });

  const node = match?.bracketNodes[0];
  if (!match || !node) return;

  const winners = match.TournamentMatchParticipant.filter((p) => p.isWinner);
  if (winners.length !== 1) return;

  const winner = winners[0]!;
  const loser =
    match.TournamentMatchParticipant.length === 2
      ? match.TournamentMatchParticipant.find((p) => p.id !== winner.id)
      : undefined;

  const bracket = node.bracket;
  const wbRounds = log2(bracket.bracketSize);
  const hasLosersBracket = bracket.bracketType === "DOUBLE_ELIMINATION";
  const lbRounds = hasLosersBracket ? 2 * (wbRounds - 1) : 0;

  const placeInTarget = async (
    target: AdvanceTarget,
    slot: { participantId: string | null; teamId: string | null },
  ) => {
    const targetNode = await tx.tournamentBracketNode.findUnique({
      where: {
        bracketId_round_position_isWinnerBracket: {
          bracketId: bracket.id,
          round: target.round,
          position: target.position,
          isWinnerBracket: target.isWinnerBracket,
        },
      },
    });
    if (!targetNode?.matchId) return;

    if (slot.participantId) {
      await tx.tournamentMatchParticipant.upsert({
        where: {
          matchId_participantId: {
            matchId: targetNode.matchId,
            participantId: slot.participantId,
          },
        },
        create: {
          matchId: targetNode.matchId,
          participantId: slot.participantId,
          isWinner: false,
        },
        update: {},
      });
    } else if (slot.teamId) {
      await tx.tournamentMatchParticipant.upsert({
        where: {
          matchId_teamId: { matchId: targetNode.matchId, teamId: slot.teamId },
        },
        create: {
          matchId: targetNode.matchId,
          teamId: slot.teamId,
          isWinner: false,
        },
        update: {},
      });
    }
  };

  if (node.isWinnerBracket) {
    const target = getWbAdvanceTarget(
      node.round,
      node.position,
      wbRounds,
      hasLosersBracket,
    );
    if (target) {
      await placeInTarget(target, {
        participantId: winner.participantId,
        teamId: winner.teamId,
      });
    }

    if (hasLosersBracket && loser) {
      const dropTarget = getLoserDropTarget(node.round, node.position);
      await placeInTarget(dropTarget, {
        participantId: loser.participantId,
        teamId: loser.teamId,
      });
    }
  } else {
    const target = isLbFinalRound(node.round, lbRounds)
      ? { round: wbRounds + 1, position: 0, isWinnerBracket: true }
      : getLbAdvanceTarget(node.round, node.position, lbRounds);

    if (target) {
      await placeInTarget(target, {
        participantId: winner.participantId,
        teamId: winner.teamId,
      });
    }
  }
}
