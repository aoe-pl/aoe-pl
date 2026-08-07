import { describe, expect, it } from "vitest";
import {
  generateBracketPlan,
  getLbAdvanceTarget,
  getLoserDropTarget,
  getWbAdvanceTarget,
  isLbFinalRound,
  log2,
  standardSeedOrder,
} from "../src/lib/tournaments/match-generation/bracket-matches";

describe("standardSeedOrder", () => {
  it("computes classic seeding for size 2/4/8/16", () => {
    expect(standardSeedOrder(2)).toEqual([1, 2]);
    expect(standardSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(standardSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    expect(standardSeedOrder(16)).toEqual([
      1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11,
    ]);
  });
});

describe("generateBracketPlan - single elimination", () => {
  it("builds a full 8-entrant WB tree with no byes", () => {
    const entrants = Array.from({ length: 8 }, (_, i) => ({
      participantId: `p${i + 1}`,
    }));

    const plan = generateBracketPlan({
      bracketType: "SINGLE_ELIMINATION",
      bracketSize: 8,
      isSeeded: true,
      entrants,
    });

    expect(plan.wbRounds).toBe(3);
    expect(plan.lbRounds).toBe(0);
    expect(plan.finalRound).toBe(3);
    expect(plan.nodes).toHaveLength(4 + 2 + 1);

    const round1 = plan.nodes.filter((n) => n.round === 1);
    expect(round1).toHaveLength(4);
    round1.forEach((n) => {
      expect(n.isBye).toBe(false);
      expect(n.initialParticipants).toHaveLength(2);
    });

    // seed1(p1) vs seed8(p8) in round1 match position 0
    expect(round1[0]?.initialParticipants?.map((p) => p.participantId)).toEqual(
      ["p1", "p8"],
    );

    const round2 = plan.nodes.filter((n) => n.round === 2);
    expect(round2).toHaveLength(2);
    const final = plan.nodes.filter((n) => n.round === 3);
    expect(final).toHaveLength(1);
  });

  it("awards byes to top seeds when entrants < bracketSize", () => {
    const entrants = Array.from({ length: 5 }, (_, i) => ({
      participantId: `p${i + 1}`,
    }));

    const plan = generateBracketPlan({
      bracketType: "SINGLE_ELIMINATION",
      bracketSize: 8,
      isSeeded: true,
      entrants,
    });

    const round1 = plan.nodes
      .filter((n) => n.round === 1)
      .sort((a, b) => a.position - b.position);

    const byeCount = round1.filter((n) => n.isBye).length;
    expect(byeCount).toBe(3); // 8 - 5 = 3 byes

    // Seed 1 (p1) has a bye (paired with seed 8, absent)
    expect(round1[0]?.isBye).toBe(true);
    expect(round1[0]?.initialParticipants?.[0]?.participantId).toBe("p1");
  });

  it("supports unseeded sequential pairing", () => {
    const entrants = Array.from({ length: 4 }, (_, i) => ({
      participantId: `p${i + 1}`,
    }));

    const plan = generateBracketPlan({
      bracketType: "SINGLE_ELIMINATION",
      bracketSize: 4,
      isSeeded: false,
      entrants,
    });

    const round1 = plan.nodes
      .filter((n) => n.round === 1)
      .sort((a, b) => a.position - b.position);

    expect(round1[0]?.initialParticipants?.map((p) => p.participantId)).toEqual(
      ["p1", "p2"],
    );
    expect(round1[1]?.initialParticipants?.map((p) => p.participantId)).toEqual(
      ["p3", "p4"],
    );
  });
});

describe("generateBracketPlan - double elimination", () => {
  it("builds correct WB/LB/GF node counts for size 8", () => {
    const entrants = Array.from({ length: 8 }, (_, i) => ({
      participantId: `p${i + 1}`,
    }));

    const plan = generateBracketPlan({
      bracketType: "DOUBLE_ELIMINATION",
      bracketSize: 8,
      isSeeded: true,
      entrants,
    });

    expect(plan.wbRounds).toBe(3);
    expect(plan.lbRounds).toBe(4);
    expect(plan.finalRound).toBe(4); // grand final round = wbRounds + 1

    const wbNodes = plan.nodes.filter((n) => n.isWinnerBracket);
    const lbNodes = plan.nodes.filter((n) => !n.isWinnerBracket);

    // WB: rounds 1-3 (4+2+1=7) + grand final (round 4) = 8
    expect(wbNodes).toHaveLength(8);
    // LB: rounds 1-4 -> 2,2,1,1 = 6
    expect(lbNodes).toHaveLength(6);

    const lbCountByRound = (round: number) =>
      lbNodes.filter((n) => n.round === round).length;

    expect(lbCountByRound(1)).toBe(2);
    expect(lbCountByRound(2)).toBe(2);
    expect(lbCountByRound(3)).toBe(1);
    expect(lbCountByRound(4)).toBe(1);
  });

  it("builds correct LB round match counts for size 16", () => {
    const entrants = Array.from({ length: 16 }, (_, i) => ({
      participantId: `p${i + 1}`,
    }));

    const plan = generateBracketPlan({
      bracketType: "DOUBLE_ELIMINATION",
      bracketSize: 16,
      isSeeded: true,
      entrants,
    });

    expect(plan.wbRounds).toBe(4);
    expect(plan.lbRounds).toBe(6);

    const lbNodes = plan.nodes.filter((n) => !n.isWinnerBracket);
    const lbCountByRound = (round: number) =>
      lbNodes.filter((n) => n.round === round).length;

    // Expected: 4,4,2,2,1,1 (total n-2 = 14)
    expect([1, 2, 3, 4, 5, 6].map(lbCountByRound)).toEqual([4, 4, 2, 2, 1, 1]);
    expect(lbNodes).toHaveLength(14);
  });
});

describe("advancement target formulas (size 8, double elimination)", () => {
  const wbRounds = 3;
  const lbRounds = 4;

  it("WB internal advancement merges pairs into next round", () => {
    expect(getWbAdvanceTarget(1, 0, wbRounds, true)).toEqual({
      round: 2,
      position: 0,
      isWinnerBracket: true,
    });
    expect(getWbAdvanceTarget(1, 1, wbRounds, true)).toEqual({
      round: 2,
      position: 0,
      isWinnerBracket: true,
    });
    expect(getWbAdvanceTarget(1, 2, wbRounds, true)).toEqual({
      round: 2,
      position: 1,
      isWinnerBracket: true,
    });
  });

  it("WB final winner advances to grand final (double elim) or null (single elim)", () => {
    expect(getWbAdvanceTarget(3, 0, wbRounds, true)).toEqual({
      round: 4,
      position: 0,
      isWinnerBracket: true,
    });
    expect(getWbAdvanceTarget(3, 0, wbRounds, false)).toBeNull();
  });

  it("WB round1 loser drops into LB round1, paired", () => {
    expect(getLoserDropTarget(1, 0)).toEqual({
      round: 1,
      position: 0,
      isWinnerBracket: false,
    });
    expect(getLoserDropTarget(1, 1)).toEqual({
      round: 1,
      position: 0,
      isWinnerBracket: false,
    });
    expect(getLoserDropTarget(1, 2)).toEqual({
      round: 1,
      position: 1,
      isWinnerBracket: false,
    });
  });

  it("WB round2+ loser drops directly into the matching LB drop-in round", () => {
    expect(getLoserDropTarget(2, 0)).toEqual({
      round: 2,
      position: 0,
      isWinnerBracket: false,
    });
    expect(getLoserDropTarget(2, 1)).toEqual({
      round: 2,
      position: 1,
      isWinnerBracket: false,
    });
    // WB final (round 3) loser drops into LB final (round 4)
    expect(getLoserDropTarget(3, 0)).toEqual({
      round: 4,
      position: 0,
      isWinnerBracket: false,
    });
  });

  it("LB odd round winner advances directly to the next (even) round", () => {
    expect(getLbAdvanceTarget(1, 0, lbRounds)).toEqual({
      round: 2,
      position: 0,
      isWinnerBracket: false,
    });
  });

  it("LB even round (non-final) winner consolidates into next odd round", () => {
    // size 16 has lbRounds=6, round2 -> round3 consolidation
    expect(getLbAdvanceTarget(2, 0, 6)).toEqual({
      round: 3,
      position: 0,
      isWinnerBracket: false,
    });
    expect(getLbAdvanceTarget(2, 1, 6)).toEqual({
      round: 3,
      position: 0,
      isWinnerBracket: false,
    });
    expect(getLbAdvanceTarget(2, 2, 6)).toEqual({
      round: 3,
      position: 1,
      isWinnerBracket: false,
    });
  });

  it("LB final round has no further LB target (goes to grand final)", () => {
    expect(getLbAdvanceTarget(4, 0, 4)).toBeNull();
    expect(isLbFinalRound(4, 4)).toBe(true);
  });
});

describe("log2", () => {
  it("computes exact log base 2 for powers of two", () => {
    expect(log2(1)).toBe(0);
    expect(log2(8)).toBe(3);
    expect(log2(16)).toBe(4);
    expect(log2(32)).toBe(5);
  });
});
