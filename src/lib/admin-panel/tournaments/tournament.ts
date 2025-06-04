import type {
  RegistrationMode,
  TournamentStageType,
  TournamentStatus,
  BracketType,
} from "@prisma/client";

const registrationModes: Record<RegistrationMode, string> = {
  INDIVIDUAL: "Individual",
  TEAM: "Team",
  ADMIN: "Admin Only",
};

const tournamentStatuses: Record<TournamentStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  FINISHED: "Finished",
  CANCELLED: "Cancelled",
};

const stageTypes: Record<TournamentStageType, string> = {
  GROUP: "Group Stage",
  BRACKET: "Bracket",
};

const bracketTypes: Record<BracketType, string> = {
  SINGLE_ELIMINATION: "Single Elimination",
  DOUBLE_ELIMINATION: "Double Elimination",
};

export {
  registrationModes,
  tournamentStatuses,
  stageTypes,
  bracketTypes,
  type TournamentStatus,
  type TournamentStageType,
  type BracketType,
  type RegistrationMode,
};
