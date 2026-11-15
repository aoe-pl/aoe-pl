export interface GroupStandingPlayer {
  id: string;
  name: string;
  playerNumber: number;
}

export interface GroupStandingMatchParticipant {
  participantId: string | null;
  isWinner: boolean;
  wonScore: number;
}

export interface GroupStandingMatch {
  status: string;
  TournamentMatchParticipant: ReadonlyArray<GroupStandingMatchParticipant>;
}

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  playerNumber: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  totalScore: number;
  headToHeadWins: number;
}

function applyHeadToHeadWins(
  tiedPlayers: PlayerStanding[],
  approvedMatches: ReadonlyArray<GroupStandingMatch>,
) {
  const tiedPlayerIds = new Set(tiedPlayers.map((player) => player.playerId));
  const tiedPlayersById = new Map(
    tiedPlayers.map((player) => [player.playerId, player]),
  );

  for (const match of approvedMatches) {
    const tiedParticipants = match.TournamentMatchParticipant.filter(
      (participant) =>
        participant.participantId !== null &&
        tiedPlayerIds.has(participant.participantId),
    );

    const winners = tiedParticipants.filter(
      (participant) => participant.isWinner,
    );
    const losers = tiedParticipants.filter(
      (participant) => !participant.isWinner,
    );

    // A win only counts for the head-to-head tie-break when both sides of the
    // match are part of the tied score group.
    if (winners.length === 0 || losers.length === 0) continue;

    for (const winner of winners) {
      const standing = tiedPlayersById.get(winner.participantId!);
      if (standing) standing.headToHeadWins++;
    }
  }
}

/**
 * Builds the ordered group standings.
 *
 * Ranking rules, in order:
 * 1. Total score (games won) descending.
 * 2. Head-to-head wins within the tied score group, descending.
 * 3. Matches won descending.
 * 4. Player number ascending (stable fallback for full ties).
 */
export function buildGroupStandings(
  players: ReadonlyArray<GroupStandingPlayer>,
  matches: ReadonlyArray<GroupStandingMatch>,
): PlayerStanding[] {
  const playerMap = new Map<string, PlayerStanding>();

  for (const player of players) {
    playerMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.playerNumber,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      totalScore: 0,
      headToHeadWins: 0,
    });
  }

  const approvedMatches = matches.filter(
    (match) => match.status === "ADMIN_APPROVED",
  );

  for (const match of approvedMatches) {
    for (const participant of match.TournamentMatchParticipant) {
      const player = participant.participantId
        ? playerMap.get(participant.participantId)
        : undefined;

      if (!player) continue;

      player.matchesPlayed++;

      if (participant.isWinner) {
        player.matchesWon++;
      } else {
        player.matchesLost++;
      }
      player.totalScore += participant.wonScore;
    }
  }

  const playersByScore = new Map<number, PlayerStanding[]>();
  for (const player of playerMap.values()) {
    const tiedPlayers = playersByScore.get(player.totalScore);
    if (tiedPlayers) tiedPlayers.push(player);
    else playersByScore.set(player.totalScore, [player]);
  }

  const standings: PlayerStanding[] = [];

  for (const score of [...playersByScore.keys()].sort((a, b) => b - a)) {
    const tiedPlayers = playersByScore.get(score)!;

    if (tiedPlayers.length > 1) {
      applyHeadToHeadWins(tiedPlayers, approvedMatches);
    }

    tiedPlayers.sort(
      (a, b) =>
        b.headToHeadWins - a.headToHeadWins ||
        b.matchesWon - a.matchesWon ||
        a.playerNumber - b.playerNumber,
    );

    standings.push(...tiedPlayers);
  }

  return standings;
}
