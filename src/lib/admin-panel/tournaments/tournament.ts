import { parsePresetKey } from "@/lib/aoe2cm";
import {
  BracketType,
  MatchStatus,
  RegistrationMode,
  TournamentFormat,
  TournamentMatchModeType,
  TournamentStatus,
  type Game,
  type Tournament,
  type TournamentBracket,
  type TournamentGroup,
  type TournamentGroupParticipant,
  type TournamentGroupTranslation,
  type TournamentMatch,
  type TournamentMatchMode,
  type TournamentMatchParticipant,
  type TournamentParticipant,
  type TournamentSection,
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

const formatLabels: Record<TournamentFormat, string> = {
  GROUP: "Group (league)",
  BRACKET: "Bracket",
};

const bracketTypesLabels: Record<BracketType, string> = {
  SINGLE_ELIMINATION: "Single Elimination",
  DOUBLE_ELIMINATION: "Double Elimination",
};

const getFormatLabel = (format: TournamentFormat) => {
  return formatLabels[format];
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
    registrationMode: z.nativeEnum(RegistrationMode),
    format: z.nativeEnum(TournamentFormat),
    description: z.string().optional(),
    imageKey: z.string().nullish(),
    isTeamBased: z.boolean(),
    startDate: z.date({
      required_error: "admin.tournaments.form.validation.start_date_required",
    }),
    endDate: z.date().optional(),
    participantsLimit: z.number().int().positive().optional(),
    registrationStartDate: z.date().optional(),
    registrationEndDate: z.date().optional(),
    registrationClosed: z.boolean(),
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

const tournamentGroupTranslationSchema = z.object({
  description: z.string().optional(),
});

const tournamentGroupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  translations: z.record(z.string(), tournamentGroupTranslationSchema),
  matchModeId: z.string().min(1, "Match mode is required"),
  displayOrder: z.number().int().min(0),
  isTeamBased: z.boolean().optional(),
  isMixed: z.boolean().optional(),
  color: z.string().optional(),
  civDraftPresetUrl: z
    .string()
    .optional()
    .refine((value) => !value || parsePresetKey(value) !== null, {
      message:
        "Enter a valid aoe2cm preset URL (e.g. https://aoe2cm.net/preset/xxxxx)",
    }),
  mapDraftPresetUrl: z
    .string()
    .optional()
    .refine((value) => !value || parsePresetKey(value) !== null, {
      message:
        "Enter a valid aoe2cm preset URL (e.g. https://aoe2cm.net/preset/xxxxx)",
    }),
  participantIds: z.array(z.string()).optional(),
});

const tournamentBracketFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  bracketType: z.nativeEnum(BracketType),
  bracketSize: z.number().int().positive(),
  isManualSeeding: z.boolean().optional(),
  roundBestOfs: z
    .object({
      standard: z.string().optional(),
      semifinal: z.string().optional(),
      final: z.string().optional(),
    })
    .optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  entrantIds: z.array(z.string()).optional(),
});

type TournamentBracketFormSchema = z.infer<typeof tournamentBracketFormSchema>;

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

type TournamentGroupFormSchema = z.infer<typeof tournamentGroupFormSchema>;
type TournamentMatchFormSchema = z.infer<typeof tournamentMatchFormSchema>;

/** Payload emitted by the group form, with translations normalised to a list. */
type TournamentGroupSubmitData = Omit<
  TournamentGroupFormSchema,
  "translations"
> & {
  translations: { locale: string; description?: string }[];
};

type TournamentGroupWithParticipants = TournamentGroup & {
  translations: TournamentGroupTranslation[];
  TournamentGroupParticipant: {
    tournamentParticipantId: string;
    id: string;
  }[];
};

export {
  BracketType,
  bracketTypesLabels,
  formatLabels,
  getBracketTypeLabel,
  getFormatLabel,
  getMatchStatusLabel,
  getRegistrationModeLabel,
  getTournamentStatusLabel,
  MatchStatus,
  matchStatuses,
  matchStatusesLabels,
  RegistrationMode,
  registrationModes,
  registrationModesLabels,
  tournamentBracketFormSchema,
  TournamentFormat,
  tournamentFormSchema,
  tournamentGroupFormSchema,
  tournamentMatchFormSchema,
  TournamentMatchModeType,
  TournamentStatus,
  tournamentStatuses,
  tournamentStatusesLabels,
  type Game,
  type Tournament,
  type TournamentBracket,
  type TournamentBracketFormSchema,
  type TournamentGroup,
  type TournamentGroupFormSchema,
  type TournamentGroupParticipant,
  type TournamentGroupSubmitData,
  type TournamentGroupTranslation,
  type TournamentGroupWithParticipants,
  type TournamentMatch,
  type TournamentMatchFormSchema,
  type TournamentMatchMode,
  type TournamentMatchParticipant,
  type TournamentParticipant,
  type TournamentSection,
};
