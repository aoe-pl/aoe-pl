import {
  RegistrationMode,
  TournamentStageType,
  TournamentStatus,
  BracketType,
  TournamentMatchModeType,
  type TournamentStage,
  type Tournament,
  type TournamentParticipant,
  type TournamentGroup,
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

const tournamentStageFormSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(TournamentStageType),
  isActive: z.boolean().optional(),
  bracketType: z.nativeEnum(BracketType).optional(),
  bracketSize: z.number().int().positive().optional(),
  isSeeded: z.boolean().optional(),
});

type TournamentStageFormSchema = z.infer<typeof tournamentStageFormSchema>;

const registrationModes: { value: RegistrationMode; label: string }[] = [
  {
    value: RegistrationMode.INDIVIDUAL,
    label: getRegistrationModeLabel(RegistrationMode.INDIVIDUAL),
  },
  {
    value: RegistrationMode.TEAM,
    label: getRegistrationModeLabel(RegistrationMode.TEAM),
  },
  {
    value: RegistrationMode.ADMIN,
    label: getRegistrationModeLabel(RegistrationMode.ADMIN),
  },
];

const tournamentStatuses: { value: TournamentStatus; label: string }[] = [
  {
    value: TournamentStatus.PENDING,
    label: getTournamentStatusLabel(TournamentStatus.PENDING),
  },
  {
    value: TournamentStatus.ACTIVE,
    label: getTournamentStatusLabel(TournamentStatus.ACTIVE),
  },
  {
    value: TournamentStatus.FINISHED,
    label: getTournamentStatusLabel(TournamentStatus.FINISHED),
  },
  {
    value: TournamentStatus.CANCELLED,
    label: getTournamentStatusLabel(TournamentStatus.CANCELLED),
  },
];

const tournamentGroupFormSchema = z.object({
  stageId: z.string().min(1, "Stage is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  matchModeId: z.string().optional(),
  displayOrder: z.number().int().min(0),
  isTeamBased: z.boolean().optional(),
  participantIds: z.array(z.string()).optional(),
});

type TournamentGroupFormSchema = z.infer<typeof tournamentGroupFormSchema>;

type TournamentGroupWithParticipants = TournamentGroup & {
  TournamentGroupParticipant: {
    tournamentParticipantId: string;
    id: string;
  }[];
};

export {
  tournamentStageFormSchema,
  registrationModesLabels,
  tournamentStatusesLabels,
  stageTypesLabels,
  bracketTypesLabels,
  TournamentMatchModeType,
  TournamentStatus,
  TournamentStageType,
  BracketType,
  RegistrationMode,
  getStageTypeLabel,
  getBracketTypeLabel,
  getTournamentStatusLabel,
  getRegistrationModeLabel,
  tournamentFormSchema,
  registrationModes,
  tournamentStatuses,
  tournamentGroupFormSchema,
  type TournamentGroupFormSchema,
  type TournamentStageFormSchema,
  type Tournament,
  type TournamentStage,
  type TournamentParticipant,
  type TournamentGroup,
  type TournamentGroupWithParticipants,
};
