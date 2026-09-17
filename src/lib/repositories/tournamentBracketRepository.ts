import {
  generateBracketPlan,
  getLbAdvanceTarget,
  getLoserDropTarget,
  getWbAdvanceTarget,
  isLbFinalRound,
  log2,
  standardSeedOrder,
  type AdvanceTarget,
} from "@/lib/tournaments/match-generation/bracket-matches";
import { db } from "@/server/db";
import type { BracketType, Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export type RoundBestOfs = {
  standard?: string;
  semifinal?: string;
  final?: string;
};

/**
 * Maps a bracket node to its BestOf tier. The final is the champion match
 * (grand final node in double elim). Semifinals are the rounds feeding it:
 * the WB final + LB final in double elim, the second-to-last WB round in
 * single elim. Everything else uses the "standard" tier.
 */
function roundTierFor(
  isWinnerBracket: boolean,
  round: number,
  wbRounds: number,
  lbRounds: number,
): "standard" | "semifinal" | "final" {
  if (isWinnerBracket) {
    if (lbRounds > 0) {
      if (round === wbRounds + 1) return "final"; // grand final
      if (round === wbRounds) return "semifinal"; // WB final
    } else {
      if (round === wbRounds) return "final";
      if (round === wbRounds - 1 && wbRounds >= 3) return "semifinal";
    }
  } else if (round === lbRounds) {
    return "semifinal"; // LB final
  }

  return "standard";
}

/**
 * Resolves a round's match mode from the tier config and applies it to a
 * match: tournamentMatchModeId is always set; bestOf mirrors the game count
 * for BEST_OF modes (null for PLAY_ALL).
 */
async function applyRoundMode(
  tx: TxClient,
  matchId: string,
  roundBestOfs: RoundBestOfs | undefined,
  tier: "standard" | "semifinal" | "final",
  modeById: Map<string, { id: string; mode: string; gameCount: number }>,
) {
  const modeId = roundBestOfs?.[tier];
  const mode = modeId ? modeById.get(modeId) : undefined;

  await tx.tournamentMatch.update({
    where: { id: matchId },
    data: {
      tournamentMatchModeId: mode?.id ?? null,
      bestOf: mode?.mode === "BEST_OF" ? mode.gameCount : null,
    },
  });
}

export type TournamentBracketCreateData = {
  name: string;
  description?: string;
  displayOrder?: number;
  bracketType: BracketType;
  bracketSize: number;
  isSeeded?: boolean;
  isManualSeeding?: boolean;
  /** BestOf tiers: standard rounds, semifinal, final. */
  roundBestOfs?: RoundBestOfs;
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
  tournament: true,
  participants: {
    include: {
      participant: { include: { user: true, team: true } },
      team: true,
    },
    orderBy: { seedNumber: "asc" },
  },
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
  async getBracketsByTournamentId(tournamentId: string) {
    return db.tournamentBracket.findMany({
      where: { tournamentId },
      include: { tournament: true },
      orderBy: { displayOrder: "asc" },
    });
  },

  async getBracketById(id: string) {
    return db.tournamentBracket.findUnique({
      where: { id },
      include: bracketDetailInclude,
    });
  },

  async createBracket(tournamentId: string, data: TournamentBracketCreateData) {
    return db.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUniqueOrThrow({
        where: { id: tournamentId },
      });

      const isTeamBased = tournament.isTeamBased;

      // Bracket type is chosen per bracket (no stages anymore).
      const bracketType = data.bracketType;

      // Entrants are stored as a bracket roster (participants pool), NOT
      // placed into round-1 matches - the admin assigns them to matches in
      // the bracket view.
      const plan = generateBracketPlan({
        bracketType,
        bracketSize: data.bracketSize,
        isSeeded: data.isSeeded ?? true,
        entrants: [],
      });

      const bracket = await tx.tournamentBracket.create({
        data: {
          name: data.name,
          description: data.description,
          displayOrder: data.displayOrder ?? 0,
          bracketType,
          bracketSize: data.bracketSize,
          isSeeded: data.isSeeded ?? true,
          isManualSeeding: data.isManualSeeding ?? false,
          roundBestOfs: data.roundBestOfs,
          startDate: data.startDate,
          endDate: data.endDate,
          tournament: { connect: { id: tournamentId } },
        },
      });

      if (data.entrantIds && data.entrantIds.length > 0) {
        await createRoster(tx, bracket.id, data.entrantIds, isTeamBased);
      }

      await materializeBracketPlan(tx, bracket.id, plan, data.roundBestOfs);

      return bracket;
    });
  },

  async updateBracket(id: string, data: TournamentBracketUpdateData) {
    return db.$transaction(async (tx) => {
      const current = await tx.tournamentBracket.findUniqueOrThrow({
        where: { id },
        include: {
          tournament: true,
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

      const bracketType = data.bracketType ?? current.bracketType;
      const bracketSize = data.bracketSize ?? current.bracketSize;
      const isSeeded = data.isSeeded ?? current.isSeeded;

      // Entrants no longer drive structure: they only sync the roster pool
      // (add-only), so they're decoupled from the wipe/regenerate path and
      // are safe even after matches have results.
      const structureChanged =
        bracketType !== current.bracketType ||
        bracketSize !== current.bracketSize ||
        isSeeded !== current.isSeeded;

      if (structureChanged && hasAnyResult) {
        throw new Error(
          "Cannot change bracket structure after matches have results. Delete and recreate the bracket instead.",
        );
      }

      const isTeamBased = current.tournament.isTeamBased;

      if (entrantsProvided) {
        const allocatedIds = new Set(
          current.bracketNodes.flatMap(
            (n) =>
              n.match?.TournamentMatchParticipant.flatMap((p) =>
                p.participantId
                  ? [p.participantId]
                  : p.teamId
                    ? [p.teamId]
                    : [],
              ) ?? [],
          ),
        );
        await syncRoster(tx, id, data.entrantIds ?? [], isTeamBased, {
          allocatedIds,
        });
      }

      if (structureChanged) {
        // Wipe and regenerate. Deleting the bracket's matches cascades to
        // bracket nodes (matchId onDelete not cascade on node -> delete
        // nodes explicitly first). The roster is left untouched.
        const matchIds = current.bracketNodes
          .map((n) => n.matchId)
          .filter((mid): mid is string => !!mid);

        await tx.tournamentBracketNode.deleteMany({ where: { bracketId: id } });
        if (matchIds.length > 0) {
          await tx.tournamentMatch.deleteMany({
            where: { id: { in: matchIds } },
          });
        }

        // Same as create: entrants live in the roster, round-1 matches stay
        // empty until the admin assigns them in the bracket view.
        const plan = generateBracketPlan({
          bracketType,
          bracketSize,
          isSeeded,
          entrants: [],
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
            roundBestOfs: data.roundBestOfs,
            startDate: data.startDate,
            endDate: data.endDate,
          },
        });

        await materializeBracketPlan(tx, id, plan, data.roundBestOfs);

        return tx.tournamentBracket.findUniqueOrThrow({ where: { id } });
      }

      // Roster/round-config changes without a structural change still apply
      // the match modes to every existing match.
      if (data.roundBestOfs) {
        const wbRounds = log2(current.bracketSize);
        const lbRounds =
          current.bracketType === "DOUBLE_ELIMINATION" ? 2 * (wbRounds - 1) : 0;
        const modes = await tx.tournamentMatchMode.findMany();
        const modeById = new Map(modes.map((m) => [m.id, m]));
        for (const node of current.bracketNodes) {
          if (!node.matchId) continue;
          const tier = roundTierFor(
            node.isWinnerBracket,
            node.round,
            wbRounds,
            lbRounds,
          );
          await applyRoundMode(
            tx,
            node.matchId,
            data.roundBestOfs,
            tier,
            modeById,
          );
        }
      }

      return tx.tournamentBracket.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          displayOrder: data.displayOrder,
          isManualSeeding: data.isManualSeeding,
          roundBestOfs: data.roundBestOfs,
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

  /**
   * Assigns the bracket roster to round-1 matches, resetting the whole
   * bracket first (scores, winners, participants). "RATING" orders the
   * roster by rating (not in the DB yet - all 0, so roster/seeded order is
   * used); "RANDOM" shuffles it. Seeded brackets use the standard seeding
   * order to map seeds to slots.
   */
  async allocateParticipants(id: string, mode: "RATING" | "RANDOM") {
    return db.$transaction(async (tx) => {
      const bracket = await tx.tournamentBracket.findUniqueOrThrow({
        where: { id },
        include: allocateBracketInclude,
      });

      const roster = await ensureRoster(tx, bracket);

      // Allocation starts the bracket fresh: every match back to PENDING,
      // no participants, no scores, no games.
      await resetBracketMatches(tx, id);

      const ordered = mode === "RANDOM" ? shuffleArray(roster) : roster;
      await placeRosterInRound1(tx, bracket, ordered);

      return tx.tournamentBracket.findUniqueOrThrow({ where: { id } });
    });
  },

  /**
   * Resets the bracket to a just-created state (all matches PENDING, no
   * participants, no scores, no games) while keeping the roster intact -
   * the same players stay available for re-allocation.
   */
  async clearBracket(id: string) {
    return db.$transaction(async (tx) => {
      const bracket = await tx.tournamentBracket.findUniqueOrThrow({
        where: { id },
        include: allocateBracketInclude,
      });

      // Legacy brackets may not have a persisted roster - derive it from
      // round-1 before wiping, so "the same players" survive a clear.
      await ensureRoster(tx, bracket);
      await resetBracketMatches(tx, id);

      return tx.tournamentBracket.findUniqueOrThrow({ where: { id } });
    });
  },
};

type RosterEntry = {
  participantId: string | null;
  teamId: string | null;
};

const allocateBracketInclude = {
  bracketNodes: {
    include: { match: { include: { TournamentMatchParticipant: true } } },
  },
  participants: { include: { participant: true, team: true } },
} satisfies Prisma.TournamentBracketInclude;

type AllocatableBracket = Prisma.TournamentBracketGetPayload<{
  include: typeof allocateBracketInclude;
}>;

function createRoster(
  tx: TxClient,
  bracketId: string,
  entrantIds: string[],
  isTeamBased: boolean,
) {
  return tx.tournamentBracketParticipant.createMany({
    data: entrantIds.map((id, i) =>
      isTeamBased
        ? { bracketId, teamId: id, seedNumber: i + 1 }
        : { bracketId, participantId: id, seedNumber: i + 1 },
    ),
  });
}

/**
 * Roster sync: creates missing entrants, renumbers seed order to match the
 * submitted list, and removes roster members that are no longer selected -
 * but only if they are not placed in any bracket match (allocated players
 * are protected).
 */
async function syncRoster(
  tx: TxClient,
  bracketId: string,
  entrantIds: string[],
  isTeamBased: boolean,
  opts: { allocatedIds: Set<string> },
) {
  const existing = await tx.tournamentBracketParticipant.findMany({
    where: { bracketId },
  });
  const existingByKey = new Map(
    existing.map((p) => [(p.participantId ?? p.teamId)!, p]),
  );

  const sent = new Set(entrantIds);

  // Unselected + unallocated roster members can be removed; allocated ones
  // are kept even if unselected.
  for (const row of existing) {
    const key = row.participantId ?? row.teamId;
    if (key && !sent.has(key) && !opts.allocatedIds.has(key)) {
      await tx.tournamentBracketParticipant.delete({ where: { id: row.id } });
    }
  }

  for (let i = 0; i < entrantIds.length; i++) {
    const id = entrantIds[i]!;
    const row = existingByKey.get(id);
    if (row) {
      await tx.tournamentBracketParticipant.update({
        where: { id: row.id },
        data: { seedNumber: i + 1 },
      });
    } else {
      await tx.tournamentBracketParticipant.create({
        data: isTeamBased
          ? { bracketId, teamId: id, seedNumber: i + 1 }
          : { bracketId, participantId: id, seedNumber: i + 1 },
      });
    }
  }
}

/**
 * Returns the persisted roster, or (for legacy brackets created before the
 * roster existed) derives it from round-1 match participants and persists
 * it so it survives future resets.
 */
async function ensureRoster(
  tx: TxClient,
  bracket: AllocatableBracket,
): Promise<RosterEntry[]> {
  if (bracket.participants.length > 0) {
    return bracket.participants
      .sort((a, b) => (a.seedNumber ?? 0) - (b.seedNumber ?? 0))
      .map((p) => ({ participantId: p.participantId, teamId: p.teamId }));
  }

  const round1Nodes = bracket.bracketNodes
    .filter((n) => n.isWinnerBracket && n.round === 1)
    .sort((a, b) => a.position - b.position);

  const entries: RosterEntry[] = [];
  for (const node of round1Nodes) {
    for (const p of node.match?.TournamentMatchParticipant ?? []) {
      entries.push({ participantId: p.participantId, teamId: p.teamId });
    }
  }

  if (entries.length > 0) {
    await tx.tournamentBracketParticipant.createMany({
      data: entries.map((e, i) => ({
        bracketId: bracket.id,
        participantId: e.participantId,
        teamId: e.teamId,
        seedNumber: i + 1,
      })),
    });
  }

  return entries;
}

async function resetBracketMatches(tx: TxClient, bracketId: string) {
  const nodes = await tx.tournamentBracketNode.findMany({
    where: { bracketId },
    select: { matchId: true },
  });
  const matchIds = nodes
    .map((n) => n.matchId)
    .filter((mid): mid is string => !!mid);
  if (matchIds.length === 0) return;

  await tx.game.deleteMany({ where: { matchId: { in: matchIds } } });
  await tx.tournamentMatchParticipant.deleteMany({
    where: { matchId: { in: matchIds } },
  });
  await tx.tournamentMatch.updateMany({
    where: { id: { in: matchIds } },
    data: { status: "PENDING" },
  });
}

async function placeRosterInRound1(
  tx: TxClient,
  bracket: AllocatableBracket,
  roster: RosterEntry[],
) {
  const round1Nodes = bracket.bracketNodes
    .filter((n) => n.isWinnerBracket && n.round === 1)
    .sort((a, b) => a.position - b.position);

  const seedSlots = standardSeedOrder(bracket.bracketSize);
  const slotForSeed = (seed: number) => seedSlots.indexOf(seed);

  for (let i = 0; i < roster.length; i++) {
    const entry = roster[i]!;
    const seedNumber = i + 1;
    const slotIndex = bracket.isSeeded
      ? slotForSeed(seedNumber)
      : seedNumber - 1;
    const matchPosition = Math.floor(slotIndex / 2);
    const node = round1Nodes[matchPosition];
    if (!node?.matchId) continue;
    await upsertMatchParticipant(tx, node.matchId, entry);
  }
}

async function upsertMatchParticipant(
  tx: TxClient,
  matchId: string,
  slot: RosterEntry,
) {
  if (slot.participantId) {
    await tx.tournamentMatchParticipant.upsert({
      where: {
        matchId_participantId: {
          matchId,
          participantId: slot.participantId,
        },
      },
      create: {
        matchId,
        participantId: slot.participantId,
        isWinner: false,
      },
      update: {},
    });
  } else if (slot.teamId) {
    await tx.tournamentMatchParticipant.upsert({
      where: {
        matchId_teamId: { matchId, teamId: slot.teamId },
      },
      create: { matchId, teamId: slot.teamId, isWinner: false },
      update: {},
    });
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i]!;
    result[i] = result[j]!;
    result[j] = tmp;
  }
  return result;
}

async function materializeBracketPlan(
  tx: TxClient,
  bracketId: string,
  plan: ReturnType<typeof generateBracketPlan>,
  roundBestOfs?: RoundBestOfs,
) {
  const nodeIdByKey = new Map<string, string>();

  const key = (round: number, position: number, isWinnerBracket: boolean) =>
    `${isWinnerBracket ? "wb" : "lb"}:${round}:${position}`;

  // Pass 1: create matches + nodes. Bye matches (single entrant) are left
  // PENDING with no winner - the admin resolves them manually, which then
  // advances the entrant like any other match. Not auto-completing them
  // keeps the empty slot fillable and lets the winner be recorded once.
  const modes = await tx.tournamentMatchMode.findMany();
  const modeById = new Map(modes.map((m) => [m.id, m]));

  for (const spec of plan.nodes) {
    const initialParticipants = spec.initialParticipants ?? [];

    const match = await tx.tournamentMatch.create({
      data: {
        status: "PENDING",
        civDraftKey: "",
        mapDraftKey: "",
        TournamentMatchParticipant:
          initialParticipants.length > 0
            ? {
                create: initialParticipants.map((p) => ({
                  participantId: p.participantId ?? undefined,
                  teamId: p.teamId ?? undefined,
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

    // Apply the tier's match mode (tournamentMatchModeId + bestOf mirror).
    const tier = roundTierFor(
      spec.isWinnerBracket,
      spec.round,
      plan.wbRounds,
      plan.lbRounds,
    );
    await applyRoundMode(tx, match.id, roundBestOfs, tier, modeById);
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

    if (nodeId && parentId && nodeId !== parentId) {
      await tx.tournamentBracketNode.update({
        where: { id: nodeId },
        data: { parentNodeId: parentId },
      });
    }
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
