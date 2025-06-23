import type {
  TournamentMatch,
  TournamentMatchParticipant,
  TournamentParticipant,
  Game as PrismaGame,
} from "@prisma/client";

export interface ExtendedTournamentMatchParticipant
  extends TournamentMatchParticipant {
  participant: TournamentParticipant | null;
  team: { id: string; name: string } | null;
  gamesWon: Game[];
  gamesLost: Game[];
}

export interface Game extends PrismaGame {
  map?: {
    id: string;
    name: string;
  } | null;
  winner?: {
    id: string;
    participant?: {
      id: string;
      nickname: string;
    } | null;
    team?: {
      id: string;
      name: string;
    } | null;
  } | null;
  loser?: {
    id: string;
    participant?: {
      id: string;
      nickname: string;
    } | null;
    team?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface ExtendedTournamentMatch extends TournamentMatch {
  TournamentMatchParticipant: ExtendedTournamentMatchParticipant[];
  Game: Game[];
  group: {
    id: string;
    name: string;
    stage: {
      id: string;
      name: string;
      tournament: {
        id: string;
        name: string;
      };
    };
  } | null;
  TournamentMatchMode: {
    id: string;
    mode: string;
    gameCount: number;
  } | null;
}

// Raw database match type that comes from the API
export interface RawTournamentMatch extends TournamentMatch {
  TournamentMatchParticipant: {
    id: string;
    matchId: string;
    participantId: string | null;
    teamId: string | null;
    isWinner: boolean;
    score: number | null;
    participant: TournamentParticipant | null;
    team: { id: string; name: string } | null;
    gamesWon: PrismaGame[];
    gamesLost: PrismaGame[];
  }[];
  Game?: PrismaGame[];
  group?: {
    id: string;
    name: string;
    stage: {
      id: string;
      name: string;
      tournament: {
        id: string;
        name: string;
      };
    };
  } | null;
  TournamentMatchMode?: {
    id: string;
    mode: string;
    gameCount: number;
  } | null;
}

export function APItoTournamentMatch(
  match: RawTournamentMatch,
): ExtendedTournamentMatch {
  return {
    ...match,
    matchDate: match.matchDate ?? null,
    createdAt: match.createdAt,
    TournamentMatchParticipant: match.TournamentMatchParticipant.map(
      (participant) => ({
        ...participant,
        gamesLost: participant.gamesLost.map((game) => ({
          ...game,
        })),
        gamesWon: participant.gamesWon.map((game) => ({
          ...game,
        })),
      }),
    ),
    Game: (match.Game ?? []).map((game) => ({
      ...game,
    })),
    group: match.group ?? null,
    TournamentMatchMode: match.TournamentMatchMode ?? null,
  };
}
