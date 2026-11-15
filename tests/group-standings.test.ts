import { describe, expect, it } from "vitest";
import {
  buildGroupStandings,
  type GroupStandingMatch,
  type GroupStandingPlayer,
} from "../src/lib/tournaments/group-standings";

function player(id: string, playerNumber: number): GroupStandingPlayer {
  return { id, name: id.toUpperCase(), playerNumber };
}

function approvedMatch(
  scores: Record<string, number>,
  winnerId: string,
): GroupStandingMatch {
  return {
    status: "ADMIN_APPROVED",
    TournamentMatchParticipant: Object.entries(scores).map(
      ([participantId, wonScore]) => ({
        participantId,
        wonScore,
        isWinner: participantId === winnerId,
      }),
    ),
  };
}

function standings(
  players: GroupStandingPlayer[],
  matches: GroupStandingMatch[],
) {
  return buildGroupStandings(players, matches).map((standing) => ({
    id: standing.playerId,
    score: standing.totalScore,
    matchesWon: standing.matchesWon,
    headToHeadWins: standing.headToHeadWins,
  }));
}

describe("buildGroupStandings", () => {
  it("ranks players by total score first", () => {
    const players = [player("a", 1), player("b", 2)];

    const result = standings(players, [approvedMatch({ a: 1, b: 2 }, "b")]);

    expect(result.map((standing) => standing.id)).toEqual(["b", "a"]);
  });

  it("ignores matches that are not admin-approved", () => {
    const players = [player("a", 1), player("b", 2)];

    const result = standings(players, [
      {
        status: "SCHEDULED",
        TournamentMatchParticipant: [
          { participantId: "a", wonScore: 0, isWinner: false },
          { participantId: "b", wonScore: 2, isWinner: true },
        ],
      },
    ]);

    expect(result).toEqual([
      { id: "a", score: 0, matchesWon: 0, headToHeadWins: 0 },
      { id: "b", score: 0, matchesWon: 0, headToHeadWins: 0 },
    ]);
  });

  it("ranks the head-to-head winner higher when scores are tied", () => {
    const players = [player("a", 1), player("b", 2), player("c", 3)];

    const result = standings(players, [
      approvedMatch({ a: 2, b: 0 }, "a"),
      approvedMatch({ b: 2, c: 0 }, "b"),
    ]);

    expect(result.slice(0, 2)).toEqual([
      { id: "a", score: 2, matchesWon: 1, headToHeadWins: 1 },
      { id: "b", score: 2, matchesWon: 1, headToHeadWins: 0 },
    ]);
  });

  it("uses head-to-head wins across the whole tied group", () => {
    const players = [
      player("a", 1),
      player("b", 2),
      player("c", 3),
      player("d", 4),
      player("e", 5),
      player("f", 6),
      player("g", 7),
      player("h", 8),
      player("i", 9),
    ];

    const result = standings(players, [
      // a beats b and c, b beats c.
      approvedMatch({ a: 2, b: 0 }, "a"),
      approvedMatch({ a: 2, c: 0 }, "a"),
      approvedMatch({ b: 2, c: 0 }, "b"),
      // Balance the total scores so all three remain tied on 6 points.
      approvedMatch({ a: 2, i: 0 }, "a"),
      approvedMatch({ b: 2, d: 0 }, "b"),
      approvedMatch({ b: 2, e: 0 }, "b"),
      approvedMatch({ c: 2, f: 0 }, "c"),
      approvedMatch({ c: 2, g: 0 }, "c"),
      approvedMatch({ c: 2, h: 0 }, "c"),
    ]);

    expect(result.slice(0, 3)).toEqual([
      { id: "a", score: 6, matchesWon: 3, headToHeadWins: 2 },
      { id: "b", score: 6, matchesWon: 3, headToHeadWins: 1 },
      { id: "c", score: 6, matchesWon: 3, headToHeadWins: 0 },
    ]);
  });

  it("does not count wins over players outside the tied score group", () => {
    const players = [
      player("a", 1),
      player("b", 2),
      player("c", 3),
      player("d", 4),
      player("e", 5),
    ];

    const result = standings(players, [
      approvedMatch({ a: 2, b: 0 }, "a"),
      approvedMatch({ b: 2, c: 0 }, "b"),
      // Keep a and b tied while each also beats an outside player.
      approvedMatch({ a: 1, d: 0 }, "a"),
      approvedMatch({ b: 1, e: 0 }, "b"),
    ]);

    expect(result.find((standing) => standing.id === "a")).toMatchObject({
      score: 3,
      headToHeadWins: 1,
    });
    expect(result.find((standing) => standing.id === "b")).toMatchObject({
      score: 3,
      headToHeadWins: 0,
    });
  });

  it("falls back to matches won when head-to-head is even", () => {
    const players = [
      player("a", 1),
      player("b", 2),
      player("c", 3),
      player("d", 4),
    ];

    const result = standings(players, [
      // a: two 1-0 wins = 2 points.
      approvedMatch({ a: 1, c: 0 }, "a"),
      approvedMatch({ a: 1, d: 0 }, "a"),
      // b: one 2-0 win = 2 points.
      approvedMatch({ b: 2, c: 0 }, "b"),
    ]);

    expect(result.slice(0, 2)).toEqual([
      { id: "a", score: 2, matchesWon: 2, headToHeadWins: 0 },
      { id: "b", score: 2, matchesWon: 1, headToHeadWins: 0 },
    ]);
  });

  it("uses player number as the final deterministic fallback", () => {
    const players = [player("b", 2), player("a", 1)];

    const result = standings(players, []);

    expect(result.map((standing) => standing.id)).toEqual(["a", "b"]);
  });
});
