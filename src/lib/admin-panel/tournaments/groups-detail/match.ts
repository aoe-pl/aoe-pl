import type {
  TournamentMatch,
  TournamentMatchParticipant,
  TournamentParticipant,
  Game as PrismaGame,
  GameParticipant,
  User,
  Civ,
  TournamentTeam,
} from "@prisma/client";

export interface ExtendedTournamentMatchParticipant
  extends TournamentMatchParticipant {
  participant:
    | (TournamentParticipant & {
        user: User | null;
        team: TournamentTeam | null;
      })
    | null;
  team:
    | (TournamentTeam & {
        TournamentParticipant: (TournamentParticipant & {
          user: User | null;
        })[];
      })
    | null;
}

export interface ExtendedGameParticipant extends GameParticipant {
  user: User;
  civ: Civ | null;
  matchParticipant: TournamentMatchParticipant | null;
}

export interface MatchParticipantWithUser extends TournamentMatchParticipant {
  participant:
    | (TournamentParticipant & {
        user: User | null;
        team: TournamentTeam | null;
      })
    | null;
  team:
    | (TournamentTeam & {
        TournamentParticipant: (TournamentParticipant & {
          user: User | null;
        })[];
      })
    | null;
}

export interface ExtendedTournamentMatch extends TournamentMatch {
  TournamentMatchParticipant: ExtendedTournamentMatchParticipant[];
  GameCount: number;
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
    participant:
      | (TournamentParticipant & {
          user: User | null;
          team: TournamentTeam | null;
        })
      | null;
    team:
      | (TournamentTeam & {
          TournamentParticipant: (TournamentParticipant & {
            user: User | null;
          })[];
        })
      | null;
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
    TournamentMatchParticipant: match.TournamentMatchParticipant,
    GameCount: (match.Game ?? []).length,
    group: match.group ?? null,
    TournamentMatchMode: match.TournamentMatchMode ?? null,
  };
}
