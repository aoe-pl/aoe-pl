import type { BracketType } from "@prisma/client";

/**
 * Logic for generating single/double elimination bracket
 * structures and computing winner/loser advancement targets.
 *
 * Terminology:
 * - "WB" = winners bracket, "LB" = losers bracket, "GF" = grand final.
 * - A bracket has `wbRounds` winners-bracket rounds (round 1..wbRounds).
 *   WB round r has `bracketSize / 2^r` matches (position 0-indexed).
 * - Double elimination additionally has `lbRounds = 2 * (wbRounds - 1)`
 *   losers-bracket rounds, plus a single grand final match.
 * - The grand final is modelled as its own winners-bracket node at
 *   round = wbRounds + 1, position 0 (both the WB-final winner and the
 *   LB-final winner feed into it - the schema already supports a node
 *   having two children pointing to the same parentNodeId).
 *
 * Known limitation: a potential "bracket reset" match (played only when
 * the losers-bracket finalist beats the winners-bracket finalist in the
 * grand final) is NOT auto-generated. Admins can create it manually.
 */

export type BracketParticipantSlot = {
  participantId?: string | null;
  teamId?: string | null;
};

export type BracketNodeSpec = {
  round: number;
  position: number;
  isWinnerBracket: boolean;
  /** Only set for WB round 1 nodes: the two initial entrants (if known). */
  initialParticipants?: BracketParticipantSlot[];
  /** True if this WB round 1 node has exactly one entrant (a bye). */
  isBye?: boolean;
};

export type BracketPlan = {
  wbRounds: number;
  lbRounds: number;
  /** Round number of the grand final node (single elim: WB final round). */
  finalRound: number;
  nodes: BracketNodeSpec[];
};

export type AdvanceTarget = {
  round: number;
  position: number;
  isWinnerBracket: boolean;
};

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

export function log2(n: number): number {
  return Math.round(Math.log2(n));
}

/**
 * Standard tournament seeding order: for a bracket of `size` slots, returns
 * the seed number (1-indexed) that should occupy each slot, in bracket
 * (left-to-right) order. Adjacent pairs (0,1), (2,3), ... are round 1
 * matches. This is the classic seeding used by most bracket generators
 * (e.g. size=8 -> [1,8,4,5,2,7,3,6]).
 */
export function standardSeedOrder(size: number): number[] {
  if (!isPowerOfTwo(size)) {
    throw new Error("Bracket size must be a power of two");
  }
  if (size === 1) return [1];

  const prev = standardSeedOrder(size / 2);
  const result: number[] = [];

  for (const seed of prev) {
    result.push(seed);
    result.push(size + 1 - seed);
  }

  return result;
}

/**
 * Computes where the WINNER of a winners-bracket match advances to.
 * Returns null if this is the final WB round in a single-elimination
 * bracket (i.e. the champion match, nothing to advance to).
 */
export function getWbAdvanceTarget(
  round: number,
  position: number,
  wbRounds: number,
  hasLosersBracket: boolean,
): AdvanceTarget | null {
  if (round >= wbRounds) {
    // Only the WB final (round === wbRounds) advances into the grand
    // final. The grand final node itself (round wbRounds + 1) has no
    // further advancement - returning a target here would self-link it
    // (parentNodeId = own id), which breaks the bracket renderer.
    if (!hasLosersBracket || round > wbRounds) return null;
    // WB champion advances to the grand final (slot reserved, doesn't
    // matter which - see module docs).
    return { round: wbRounds + 1, position: 0, isWinnerBracket: true };
  }

  return {
    round: round + 1,
    position: Math.floor(position / 2),
    isWinnerBracket: true,
  };
}

/**
 * Computes where the LOSER of a winners-bracket match drops into the
 * losers bracket. Only meaningful for double elimination.
 */
export function getLoserDropTarget(
  wbRound: number,
  position: number,
): AdvanceTarget {
  if (wbRound === 1) {
    return {
      round: 1,
      position: Math.floor(position / 2),
      isWinnerBracket: false,
    };
  }

  return {
    round: 2 * (wbRound - 1),
    position,
    isWinnerBracket: false,
  };
}

/**
 * Computes where the WINNER of a losers-bracket match advances to.
 * Returns null if `lbRound` is the losers-bracket final (caller should
 * route the winner to the grand final instead).
 */
export function getLbAdvanceTarget(
  lbRound: number,
  position: number,
  lbRounds: number,
): AdvanceTarget | null {
  if (lbRound >= lbRounds) return null;

  const isOddRound = lbRound % 2 === 1;

  if (isOddRound) {
    // Odd round winner advances directly into the next (drop-in) round,
    // at the same position.
    return { round: lbRound + 1, position, isWinnerBracket: false };
  }

  // Even round = consolidation merge, halves the match count.
  return {
    round: lbRound + 1,
    position: Math.floor(position / 2),
    isWinnerBracket: false,
  };
}

export function isLbFinalRound(lbRound: number, lbRounds: number): boolean {
  return lbRound === lbRounds;
}

/**
 * Builds the full node/match plan for a bracket, given an ordered list of
 * entrants (index 0 = seed 1) and a bracket size (must be a power of two,
 * participants.length may be less than bracketSize - remaining slots are
 * byes awarded to the top seeds).
 */
export function generateBracketPlan(params: {
  bracketType: BracketType;
  bracketSize: number;
  isSeeded: boolean;
  entrants: BracketParticipantSlot[];
}): BracketPlan {
  const { bracketType, bracketSize, isSeeded, entrants } = params;

  if (!isPowerOfTwo(bracketSize)) {
    throw new Error("Bracket size must be a power of two");
  }
  if (entrants.length > bracketSize) {
    throw new Error("Too many entrants for bracket size");
  }

  const wbRounds = log2(bracketSize);
  const hasLosersBracket = bracketType === "DOUBLE_ELIMINATION";
  const lbRounds = hasLosersBracket ? 2 * (wbRounds - 1) : 0;
  const finalRound = hasLosersBracket ? wbRounds + 1 : wbRounds;

  // Determine which entrant occupies which slot (0-indexed).
  const slotEntrants: (BracketParticipantSlot | null)[] = Array.from(
    { length: bracketSize },
    () => null,
  );

  if (isSeeded) {
    const seedSlots = standardSeedOrder(bracketSize);
    seedSlots.forEach((seedNumber, slotIndex) => {
      slotEntrants[slotIndex] = entrants[seedNumber - 1] ?? null;
    });
  } else {
    entrants.forEach((entrant, i) => {
      slotEntrants[i] = entrant;
    });
  }

  const nodes: BracketNodeSpec[] = [];

  // WB round 1
  const round1Matches = bracketSize / 2;
  for (let m = 0; m < round1Matches; m++) {
    const a = slotEntrants[2 * m] ?? null;
    const b = slotEntrants[2 * m + 1] ?? null;
    const initialParticipants = [a, b].filter(
      (p): p is BracketParticipantSlot => !!p,
    );

    nodes.push({
      round: 1,
      position: m,
      isWinnerBracket: true,
      initialParticipants,
      isBye: initialParticipants.length === 1,
    });
  }

  // WB rounds 2..wbRounds (empty, TBD matches)
  for (let r = 2; r <= wbRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    for (let p = 0; p < matchCount; p++) {
      nodes.push({ round: r, position: p, isWinnerBracket: true });
    }
  }

  // Grand final (double elimination only) - modelled as WB round wbRounds+1
  if (hasLosersBracket) {
    nodes.push({ round: wbRounds + 1, position: 0, isWinnerBracket: true });
  }

  // Losers bracket
  if (hasLosersBracket) {
    let matchCount = bracketSize / 4;
    for (let l = 1; l <= lbRounds; l++) {
      if (l >= 3 && l % 2 === 1) {
        matchCount = matchCount / 2;
      }
      for (let p = 0; p < matchCount; p++) {
        nodes.push({ round: l, position: p, isWinnerBracket: false });
      }
    }
  }

  return { wbRounds, lbRounds, finalRound, nodes };
}
