import { type TournamentParticipant, type MatchStatus } from "@prisma/client";

type ParticipantPair = {
  participant1Id: string;
  participant2Id: string;
};

type MatchCreateData = {
  participant1Id: string;
  participant2Id: string;
  status: MatchStatus;
  civDraftKey: string;
  mapDraftKey: string;
};

/**
 * Generates all possible unique pairs of participants for a round-robin tournament
 */
function generateAllPossiblePairs(
  participants: TournamentParticipant[],
): ParticipantPair[] {
  const pairs: ParticipantPair[] = [];

  for (let i = 0; i < participants.length; i++) {
    const participant1 = participants[i];
    if (!participant1?.id) continue;

    for (let j = i + 1; j < participants.length; j++) {
      const participant2 = participants[j];
      if (!participant2?.id) continue;

      pairs.push({
        participant1Id: participant1.id,
        participant2Id: participant2.id,
      });
    }
  }

  return pairs;
}

/**
 * Filters out pairs that already exist in the current matches
 */
function filterExistingPairs(
  pairs: ParticipantPair[],
  existingMatches: { participant1Id: string; participant2Id: string }[],
): ParticipantPair[] {
  return pairs.filter(
    (pair) =>
      !existingMatches.some(
        (match) =>
          (match.participant1Id === pair.participant1Id &&
            match.participant2Id === pair.participant2Id) ||
          (match.participant1Id === pair.participant2Id &&
            match.participant2Id === pair.participant1Id),
      ),
  );
}

/**
 * Generates new matches for a group based on current participants and existing matches
 */
export function generateNewMatches(
  currentParticipants: TournamentParticipant[],
  existingMatches: { participant1Id: string; participant2Id: string }[],
): MatchCreateData[] {
  const allPossiblePairs = generateAllPossiblePairs(currentParticipants);
  const newPairs = filterExistingPairs(allPossiblePairs, existingMatches);

  return newPairs.map((pair) => ({
    participant1Id: pair.participant1Id,
    participant2Id: pair.participant2Id,
    status: "PENDING",
    civDraftKey: "",
    mapDraftKey: "",
  }));
}

/**
 * Determines which matches should be deleted when participants are removed
 */
export function getMatchesToDelete(
  currentMatches: {
    id: string;
    participant1Id: string;
    participant2Id: string;
  }[],
  currentParticipantIds: string[],
) {
  return currentMatches.filter(
    (match) =>
      !currentParticipantIds.includes(match.participant1Id) ||
      !currentParticipantIds.includes(match.participant2Id),
  );
}

/**
 * Determines which new matches need to be created when participants are added
 */
export function getMatchesToCreate(
  currentMatches: { participant1Id: string; participant2Id: string }[],
  allParticipants: TournamentParticipant[],
): MatchCreateData[] {
  const allPossiblePairs = generateAllPossiblePairs(allParticipants);
  const newPairs = filterExistingPairs(allPossiblePairs, currentMatches);

  return newPairs.map((pair) => ({
    participant1Id: pair.participant1Id,
    participant2Id: pair.participant2Id,
    status: "PENDING",
    civDraftKey: "",
    mapDraftKey: "",
  }));
}
