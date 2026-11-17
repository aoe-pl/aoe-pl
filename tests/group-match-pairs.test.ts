import { describe, expect, it } from "vitest";
import {
  collectExistingPairKeys,
  filterCreatablePairs,
  generateAllPairs,
  matchPairKey,
} from "../src/lib/tournaments/group-match-pairs";

describe("matchPairKey", () => {
  it("is independent of participant order", () => {
    expect(matchPairKey("a", "b")).toBe(matchPairKey("b", "a"));
  });
});

describe("generateAllPairs", () => {
  it("creates every unique pair for a round-robin", () => {
    expect(generateAllPairs(["a", "b", "c"])).toEqual([
      { participant1Id: "a", participant2Id: "b" },
      { participant1Id: "a", participant2Id: "c" },
      { participant1Id: "b", participant2Id: "c" },
    ]);
  });

  it("returns no pairs for fewer than two participants", () => {
    expect(generateAllPairs([])).toEqual([]);
    expect(generateAllPairs(["a"])).toEqual([]);
  });
});

describe("collectExistingPairKeys", () => {
  it("collects pairs from two-participant matches", () => {
    const keys = collectExistingPairKeys([
      { participantIds: ["a", "b"] },
      { participantIds: ["c", "d"] },
    ]);

    expect(keys).toEqual(
      new Set([matchPairKey("a", "b"), matchPairKey("c", "d")]),
    );
  });

  it("ignores matches that do not have exactly two participants", () => {
    const keys = collectExistingPairKeys([
      { participantIds: ["a", null] },
      { participantIds: ["b", "c", "d"] },
    ]);

    expect(keys.size).toBe(0);
  });
});

describe("filterCreatablePairs", () => {
  const members = ["a", "b", "c"];
  const existing = new Set([matchPairKey("a", "b")]);

  it("keeps new pairs between group members", () => {
    expect(
      filterCreatablePairs(
        [
          { participant1Id: "a", participant2Id: "c" },
          { participant1Id: "b", participant2Id: "c" },
        ],
        members,
        existing,
      ),
    ).toEqual([
      { participant1Id: "a", participant2Id: "c" },
      { participant1Id: "b", participant2Id: "c" },
    ]);
  });

  it("drops pairs that already have a match in either order", () => {
    expect(
      filterCreatablePairs(
        [{ participant1Id: "b", participant2Id: "a" }],
        members,
        existing,
      ),
    ).toEqual([]);
  });

  it("drops self-pairs and pairs with non-members", () => {
    expect(
      filterCreatablePairs(
        [
          { participant1Id: "a", participant2Id: "a" },
          { participant1Id: "a", participant2Id: "outsider" },
        ],
        members,
        existing,
      ),
    ).toEqual([]);
  });

  it("deduplicates repeated pairs in one request", () => {
    expect(
      filterCreatablePairs(
        [
          { participant1Id: "a", participant2Id: "c" },
          { participant1Id: "c", participant2Id: "a" },
        ],
        members,
        existing,
      ),
    ).toEqual([{ participant1Id: "a", participant2Id: "c" }]);
  });
});
