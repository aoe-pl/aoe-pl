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
  type TournamentGroupParticipant,
  type TournamentMatch,
  type TournamentMatchParticipant,
  type Game,
  type TournamentMatchMode,
  MatchStatus,
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

const matchStatusesLabels: Record<MatchStatus, string> = {
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  ADMIN_APPROVED: "Admin Approved",
};

const getMatchStatusLabel = (status: MatchStatus) => {
  return matchStatusesLabels[status];
};

const tournamentFormSchema = z
  .object({
    name: z.string().min(1, "admin.tournaments.form.validation.name_required"),
    urlKey: z
      .string()
      .min(1, "admin.tournaments.form.validation.url_key_required")
      .regex(
        /^[a-z0-9-]+$/,
        "admin.tournaments.form.validation.url_key_format",
      ),
    tournamentSeriesId: z
      .string()
      .min(1, "admin.tournaments.form.validation.tournament_series_required"),
    matchModeId: z
      .string()
      .min(1, "admin.tournaments.form.validation.match_mode_required"),
    registrationMode: z.nativeEnum(RegistrationMode),
    description: z.string().optional(),
    isTeamBased: z.boolean(),
    startDate: z.date({
      required_error: "admin.tournaments.form.validation.start_date_required",
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
      message: "admin.tournaments.form.validation.end_date_after_start",
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
      message: "admin.tournaments.form.validation.registration_end_after_start",
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

const matchStatuses: { value: MatchStatus; label: string }[] = [
  {
    value: MatchStatus.SCHEDULED,
    label: getMatchStatusLabel(MatchStatus.SCHEDULED),
  },
  {
    value: MatchStatus.PENDING,
    label: getMatchStatusLabel(MatchStatus.PENDING),
  },
  {
    value: MatchStatus.COMPLETED,
    label: getMatchStatusLabel(MatchStatus.COMPLETED),
  },
  {
    value: MatchStatus.ADMIN_APPROVED,
    label: getMatchStatusLabel(MatchStatus.ADMIN_APPROVED),
  },
];

const tournamentGroupFormSchema = z.object({
  stageId: z.string().min(1, "Stage is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  matchModeId: z.string().optional(),
  displayOrder: z.number().int().min(0),
  isTeamBased: z.boolean().optional(),
  isMixed: z.boolean().optional(),
  color: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
});

const tournamentMatchFormSchema = z.object({
  groupId: z.string().optional(),
  matchDate: z.date().optional(),
  civDraftKey: z.string().optional(),
  mapDraftKey: z.string().optional(),
  status: z.nativeEnum(MatchStatus).optional(),
  comment: z.string().optional(),
  adminComment: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  teamIds: z.array(z.string()).optional(),
  participantScores: z
    .array(
      z.object({
        participantId: z.string(),
        wonScore: z.number().int().min(0),
        lostScore: z.number().int().min(0),
        isWinner: z.boolean(),
      }),
    )
    .optional(),
  teamScores: z
    .array(
      z.object({
        teamId: z.string(),
        wonScore: z.number().int().min(0),
        lostScore: z.number().int().min(0),
        isWinner: z.boolean(),
      }),
    )
    .optional(),
});

type TournamentGroupFormSchema = z.infer<typeof tournamentGroupFormSchema>;
type TournamentMatchFormSchema = z.infer<typeof tournamentMatchFormSchema>;

type TournamentGroupWithParticipants = TournamentGroup & {
  TournamentGroupParticipant: {
    tournamentParticipantId: string;
    id: string;
  }[];
};

export {
  tournamentStageFormSchema,
  tournamentMatchFormSchema,
  registrationModesLabels,
  tournamentStatusesLabels,
  matchStatusesLabels,
  stageTypesLabels,
  bracketTypesLabels,
  TournamentMatchModeType,
  TournamentStatus,
  TournamentStageType,
  BracketType,
  RegistrationMode,
  MatchStatus,
  getStageTypeLabel,
  getBracketTypeLabel,
  getTournamentStatusLabel,
  getMatchStatusLabel,
  getRegistrationModeLabel,
  tournamentFormSchema,
  registrationModes,
  tournamentStatuses,
  matchStatuses,
  tournamentGroupFormSchema,
  type TournamentGroupFormSchema,
  type TournamentMatchFormSchema,
  type TournamentStageFormSchema,
  type Tournament,
  type TournamentStage,
  type TournamentParticipant,
  type TournamentGroup,
  type TournamentGroupWithParticipants,
  type TournamentGroupParticipant,
  type TournamentMatch,
  type TournamentMatchParticipant,
  type Game,
  type TournamentMatchMode,
};
