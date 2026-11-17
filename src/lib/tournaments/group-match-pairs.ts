export type ParticipantPair = {
  participant1Id: string;
  participant2Id: string;
};

/** Order-independent key for a pair of participants. */
export function matchPairKey(participantAId: string, participantBId: string) {
  return participantAId < participantBId
    ? `${participantAId}:${participantBId}`
    : `${participantBId}:${participantAId}`;
}

/**
 * Generates every unique pair of participants, i.e. the full round-robin
 * schedule for the given roster.
 */
export function generateAllPairs(memberIds: Iterable<string>) {
  const ids = [...memberIds];
  const pairs: ParticipantPair[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const participant1Id = ids[i];
      const participant2Id = ids[j];

      if (!participant1Id || !participant2Id) continue;

      pairs.push({ participant1Id, participant2Id });
    }
  }

  return pairs;
}

/**
 * Returns the set of participant pairs that already have a match.
 * Matches where the participant list is not exactly two entries (e.g. team
 * matches, where participants are stored separately from teams) are ignored.
 */
export function collectExistingPairKeys(
  matches: { participantIds: (string | null)[] }[],
) {
  const keys = new Set<string>();

  for (const match of matches) {
    const participantIds = match.participantIds.filter(
      (id): id is string => !!id,
    );

    if (participantIds.length === 2 && participantIds[0] && participantIds[1]) {
      keys.add(matchPairKey(participantIds[0], participantIds[1]));
    }
  }

  return keys;
}

/**
 * Filters out pairs that cannot become a match: self-pairs, pairs containing
 * someone outside the group roster, pairs that already have a match, and
 * duplicate pairs within the same request.
 */
export function filterCreatablePairs(
  pairs: ParticipantPair[],
  memberIds: Iterable<string>,
  existingPairKeys: Set<string>,
) {
  const memberIdSet = new Set(memberIds);
  const seenPairs = new Set<string>();

  return pairs.filter((pair) => {
    const { participant1Id, participant2Id } = pair;

    if (participant1Id === participant2Id) return false;
    if (!memberIdSet.has(participant1Id) || !memberIdSet.has(participant2Id)) {
      return false;
    }

    const key = matchPairKey(participant1Id, participant2Id);
    if (existingPairKeys.has(key) || seenPairs.has(key)) return false;

    seenPairs.add(key);
    return true;
  });
}
