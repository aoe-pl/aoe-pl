import {
  RegistrationMode,
  TournamentStageType,
  TournamentStatus,
  BracketType,
} from "@prisma/client";

const registrationModesLabels: Record<RegistrationMode, string> = {
  INDIVIDUAL: "Individual",
  TEAM: "Team",
  ADMIN: "Admin Only",
};

const tournamentStatusesLabels: Record<TournamentStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  FINISHED: "Finished",
  CANCELLED: "Cancelled",
};

const stageTypesLabels: Record<TournamentStageType, string> = {
  GROUP: "Group Stage",
  BRACKET: "Bracket",
};

const bracketTypesLabels: Record<BracketType, string> = {
  SINGLE_ELIMINATION: "Single Elimination",
  DOUBLE_ELIMINATION: "Double Elimination",
};

const getStageTypeLabel = (type: TournamentStageType) => {
  return stageTypesLabels[type];
};

const getBracketTypeLabel = (type: BracketType) => {
  return bracketTypesLabels[type];
};

const getTournamentStatusLabel = (status: TournamentStatus) => {
  return tournamentStatusesLabels[status];
};

const getRegistrationModeLabel = (mode: RegistrationMode) => {
  return registrationModesLabels[mode];
};

export {
  registrationModesLabels,
  tournamentStatusesLabels,
  stageTypesLabels,
  bracketTypesLabels,
  TournamentStatus,
  TournamentStageType,
  BracketType,
  RegistrationMode,
  getStageTypeLabel,
  getBracketTypeLabel,
  getTournamentStatusLabel,
  getRegistrationModeLabel,
};
