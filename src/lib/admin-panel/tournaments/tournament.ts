import {
  RegistrationMode,
  TournamentStageType,
  TournamentStatus,
  BracketType,
} from "@prisma/client";
import z from "zod";

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

const tournamentFormSchema = z
  .object({
    name: z.string().min(1, "Tournament name is required"),
    urlKey: z
      .string()
      .min(1, "URL key is required")
      .regex(
        /^[a-z0-9-]+$/,
        "URL key can only contain lowercase letters, numbers, and hyphens",
      ),
    tournamentSeriesId: z.string().min(1, "Tournament series is required"),
    matchModeId: z.string().min(1, "Match mode is required"),
    registrationMode: z.nativeEnum(RegistrationMode),
    description: z.string().min(1, "Description is required"),
    isTeamBased: z.boolean(),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date().optional(),
    participantsLimit: z.number().int().positive().optional(),
    registrationStartDate: z.date().optional(),
    registrationEndDate: z.date().optional(),
    status: z.nativeEnum(TournamentStatus),
    isVisible: z.boolean(),
    stages: z
      .array(
        z.object({
          name: z.string().min(1, "Stage name is required"),
          type: z.nativeEnum(TournamentStageType),
          isActive: z.boolean(),
          description: z.string().optional(),
          bracketType: z.nativeEnum(BracketType).optional(),
          bracketSize: z.number().int().positive().optional(),
          isSeeded: z.boolean(),
        }),
      )
      .min(1, "At least one stage is required")
      .refine(
        (stages) => stages.filter((stage) => stage.isActive).length <= 1,
        "Only one stage can be active at a time",
      ),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  )
  .refine(
    (data) => {
      if (data.registrationEndDate && data.registrationStartDate) {
        return data.registrationEndDate > data.registrationStartDate;
      }
      return true;
    },
    {
      message: "Registration end date must be after registration start date",
      path: ["registrationEndDate"],
    },
  );

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
  tournamentFormSchema,
};
