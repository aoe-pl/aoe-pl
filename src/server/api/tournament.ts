import { tournamentFormSchema } from "@/lib/admin-panel/tournaments/tournament";
import {
  createAoe2cmDraft,
  fetchAoe2cmPreset,
  parsePresetKey,
} from "@/lib/aoe2cm";
import { fetchAoe2CompanionProfile } from "@/lib/aoe2companion";
import { notifyMatchScheduled, notifyMatchUnscheduled } from "@/lib/discord";
import { getRegistrationWindowStatus } from "@/lib/helpers/registration-window";
import { isTournamentReadOnly } from "@/lib/helpers/tournament-lock";
import { tournamentBracketRepository } from "@/lib/repositories/tournamentBracketRepository";
import { tournamentGameRepository } from "@/lib/repositories/tournamentGameRepository";
import { tournamentGroupRepository } from "@/lib/repositories/tournamentGroupRepository";
import { tournamentMatchModeRepository } from "@/lib/repositories/tournamentMatchModeRepository";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { tournamentParticipantRepository } from "@/lib/repositories/tournamentParticipantRepository";
import { tournamentRegistrationFieldRepository } from "@/lib/repositories/tournamentRegistrationFieldRepository";
import { tournamentRepository } from "@/lib/repositories/tournamentRepository";
import { tournamentSectionRepository } from "@/lib/repositories/tournamentSectionRepository";
import { tournamentSeriesRepository } from "@/lib/repositories/tournamentSeriesRepository";
import { usersRepository } from "@/lib/repositories/usersRepository";
import {
  aoe2companionRegistrationFieldSlug,
  getRegistrationFieldPreset,
} from "@/lib/tournaments/registration-field-presets";
import { parseCompanionProfileUrl } from "@/lib/utils";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import type {
  Tournament,
  TournamentParticipant,
  TournamentSeries,
} from "@prisma/client";
import {
  BracketType,
  MatchStatus,
  RegistrationFieldType,
  TournamentMatchModeType,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const gameSchema = z.object({
  mapId: z.string(),
  recUrl: z.string().optional(),
  tempFileKey: z.string().optional(), // Temporary file key from upload endpoint
  participants: z.array(
    z.object({
      matchParticipantId: z.string(),
      civId: z.string().optional(),
      isWinner: z.boolean(),
    }),
  ),
});

export type TournamentWithRelations = Tournament & {
  tournamentSeries: TournamentSeries | null;
  matchMode: { id: string; mode: string; gameCount: number } | null;
  TournamentParticipant: TournamentParticipant[];
};

/**
 * Loads a match together with the data needed to authorise management actions
 * (its participants and group), throwing when the current user may not manage
 * the match, i.e. is neither an admin nor a participant in the match.
 */
async function getManageableMatch(userId: string, matchId: string) {
  const match = await db.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      TournamentMatchParticipant: { include: { participant: true } },
      group: true,
    },
  });

  if (!match) throw new TRPCError({ code: "NOT_FOUND" });

  const admin = await usersRepository.isUserAdmin(userId);
  const isParticipant = match.TournamentMatchParticipant.some(
    (p) => p.participant?.userId === userId,
  );

  if (!admin && !isParticipant) throw new TRPCError({ code: "FORBIDDEN" });

  return { match, admin, isParticipant };
}

/**
 * Ensures the current user may manage the given match's recordings, i.e. is an
 * admin or a participant in the match.
 */
async function assertCanManageMatchRecordings(userId: string, matchId: string) {
  await getManageableMatch(userId, matchId);
}

/**
 * Ensures the current user may mark matches as going to be streamed, i.e. is an
 * admin or has the "Streamer" role.
 */
async function assertCanMarkStream(userId: string) {
  const [admin, streamer] = await Promise.all([
    usersRepository.isUserAdmin(userId),
    usersRepository.isUserStreamer(userId),
  ]);

  if (!admin && !streamer) throw new TRPCError({ code: "FORBIDDEN" });
}

/**
 * Throws when the tournament that owns the given match is read-only (finished,
 * cancelled or archived). Used to block edits such as match scheduling,
 * recording uploads and civ/map draft generation on locked tournaments.
 */
async function assertMatchTournamentEditable(matchId: string) {
  const match = await db.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      group: {
        select: {
          tournament: { select: { status: true, archived: true } },
        },
      },
      bracketNodes: {
        select: {
          bracket: {
            select: {
              tournament: { select: { status: true, archived: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!match) throw new TRPCError({ code: "NOT_FOUND" });

  const tournament =
    match.group?.tournament ??
    match.bracketNodes[0]?.bracket.tournament ??
    null;

  if (tournament && isTournamentReadOnly(tournament)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "This tournament is finished, cancelled or archived and can no longer be edited.",
    });
  }
}

export const tournamentRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          sortByStatus: z.boolean().optional(),
          includeTournamentSeries: z.boolean().optional(),
          includeParticipants: z.boolean().optional(),
          includeMatchMode: z.boolean().optional(),
          archived: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }): Promise<TournamentWithRelations[]> => {
      return tournamentRepository.getTournaments({
        sortByStatus: input?.sortByStatus,
        includeTournamentSeries: input?.includeTournamentSeries,
        includeParticipants: input?.includeParticipants,
        includeMatchMode: input?.includeMatchMode,
        archived: input?.archived,
      });
    }),
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
        includeTournamentSeries: z.boolean().optional(),
        includeParticipants: z.boolean().optional(),
        includeMatchMode: z.boolean().optional(),
        includeBrackets: z.boolean().optional(),
        includeGroups: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      return tournamentRepository.getTournamentById(input.id, {
        includeParticipants: input.includeParticipants,
        includeMatchMode: input.includeMatchMode,
        includeBrackets: input.includeBrackets,
        includeGroups: input.includeGroups,
      });
    }),
  create: adminProcedure
    .input(tournamentFormSchema)
    .mutation(async ({ input }) => {
      return tournamentRepository.createTournament(input);
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: tournamentFormSchema,
      }),
    )
    .mutation(async ({ input }) => {
      return tournamentRepository.updateTournament(input.id, input.data);
    }),
  archive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return tournamentRepository.archiveTournament(input.id);
    }),
  unarchive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return tournamentRepository.unarchiveTournament(input.id);
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return tournamentRepository.deleteTournament(input.id);
    }),

  // Tournament Series routes
  series: createTRPCRouter({
    list: publicProcedure.query(async () => {
      return tournamentSeriesRepository.getTournamentSeries();
    }),
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return tournamentSeriesRepository.getTournamentSeriesById(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          name: z
            .string()
            .min(1, "admin.tournaments.form.series.validation.name_required"),
          description: z.string().optional(),
          displayOrder: z.number().int().positive(),
          ownerId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentSeriesRepository.createTournamentSeries(input);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().min(1).optional(),
            description: z.string().optional(),
            displayOrder: z.number().int().positive().optional(),
            ownerId: z.string().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentSeriesRepository.updateTournamentSeries(
          input.id,
          input.data,
        );
      }),
  }),
  matchMode: createTRPCRouter({
    list: publicProcedure.query(async () => {
      return tournamentMatchModeRepository.getMatchModes();
    }),
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return tournamentMatchModeRepository.getMatchModeById(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          mode: z.nativeEnum(TournamentMatchModeType),
          gameCount: z.number().int().positive(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchModeRepository.createMatchMode(input);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            mode: z.nativeEnum(TournamentMatchModeType).optional(),
            gameCount: z.number().int().positive().optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchModeRepository.updateMatchMode(
          input.id,
          input.data,
        );
      }),
  }),

  participants: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          includeUser: z.boolean().optional().default(false),
        }),
      )
      .query(async ({ input }) => {
        return tournamentParticipantRepository.getTournamentParticipants(
          input.tournamentId,
          {
            includeUser: input.includeUser,
          },
        );
      }),

    register: protectedProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          formData: z
            .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
            .optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        const nickname = ctx.session.user.name!;

        const tournament = await tournamentRepository.getTournamentById(
          input.tournamentId,
        );

        if (!tournament) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Never allow registration outside the configured window, even if the
        // client state is stale.
        if (getRegistrationWindowStatus(tournament) !== "OPEN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Registration is closed for this tournament.",
          });
        }

        const existing =
          await tournamentParticipantRepository.findByUserAndTournament(
            userId,
            input.tournamentId,
          );

        if (existing) {
          throw new TRPCError({ code: "CONFLICT" });
        }

        const fields = await tournamentRegistrationFieldRepository.list(
          input.tournamentId,
        );

        const validFieldIds = new Set(fields.map((f) => f.id));

        for (const [key, val] of Object.entries(input.formData ?? {})) {
          if (!validFieldIds.has(key)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Unknown field: ${key}`,
            });
          }

          const field = fields.find((f) => f.id === key)!;

          if (field.type === "NUMBER" && typeof val !== "number") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Field ${key} must be a number`,
            });
          }

          if (field.type === "BOOLEAN" && typeof val !== "boolean") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Field ${key} must be a boolean`,
            });
          }

          if (
            field.type === "STRING" &&
            (typeof val !== "string" || val.length > 60)
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Field ${key} must be a string of at most 60 characters`,
            });
          }

          if (
            field.slug === aoe2companionRegistrationFieldSlug &&
            typeof val === "string" &&
            val.trim().length > 0
          ) {
            const profileId = parseCompanionProfileUrl(val);

            if (profileId === null) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Field ${key} must be a valid AoE2Companion profile URL`,
              });
            }

            const profile = await fetchAoe2CompanionProfile(profileId);

            if (!profile) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `No AoE2Companion account found for ${val.trim()}`,
              });
            }
          }
        }

        const missingRequired = fields
          .filter((f) => f.required)
          .filter((f) => {
            const val = input.formData?.[f.id];
            return val == null || val === "";
          });

        if (missingRequired.length > 0) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: `Missing required fields: ${missingRequired
              .map((f) => f.translations[0]?.label ?? f.slug ?? f.id)
              .join(", ")}`,
          });
        }

        const participant =
          await tournamentParticipantRepository.registerParticipant(
            input.tournamentId,
            userId,
            nickname,
            input.formData ?? {},
          );

        // A predefined AoE2Companion field links the provided URL to the user's
        // profile so their ranking stats become available across the site.
        const companionField = fields.find(
          (f) => f.slug === aoe2companionRegistrationFieldSlug,
        );
        const companionValue = companionField
          ? input.formData?.[companionField.id]
          : undefined;

        if (typeof companionValue === "string" && companionValue.trim()) {
          await usersRepository.updateOwnAoe2CompanionUrl(
            userId,
            companionValue.trim(),
          );
        }

        return participant;
      }),

    remove: adminProcedure
      .input(z.object({ participantId: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentParticipantRepository.deleteById(input.participantId);
      }),

    adminAdd: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          userId: z.string(),
          nickname: z.string().min(1).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const existing =
          await tournamentParticipantRepository.findByUserAndTournament(
            input.userId,
            input.tournamentId,
          );

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This user is already registered for the tournament.",
          });
        }

        const user = await usersRepository.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found.",
          });
        }

        const trimmedNickname = input.nickname?.trim();
        const nickname =
          trimmedNickname && trimmedNickname.length > 0
            ? trimmedNickname
            : (user.name ?? "Player");

        return tournamentParticipantRepository.registerParticipant(
          input.tournamentId,
          input.userId,
          nickname,
        );
      }),

    updateRegistrationData: adminProcedure
      .input(
        z.object({
          participantId: z.string(),
          registrationData: z.record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean()]),
          ),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentParticipantRepository.updateRegistrationData(
          input.participantId,
          input.registrationData,
        );
      }),
  }),

  teams: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ tournamentId: z.string() }))
      .query(async ({ input }) => {
        return db.tournamentTeam.findMany({
          where: { tournamentId: input.tournamentId },
          orderBy: { name: "asc" },
        });
      }),
  }),

  groups: createTRPCRouter({
    get: publicProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ input }) => {
        return tournamentGroupRepository.getTournamentGroupById(input.id);
      }),
    getParticipants: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        return tournamentGroupRepository.getGroupParticipants(input.groupId);
      }),
    getParticipantScores: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        return tournamentGroupRepository.getParticipantScores(input.groupId);
      }),
    listByTournament: publicProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          includeMatchMode: z.boolean().optional().default(false),
          includeParticipants: z.boolean().optional().default(false),
          includeMatches: z.boolean().optional().default(false),
        }),
      )
      .query(async ({ input }) => {
        return tournamentGroupRepository.getGroupsByTournamentId(
          input.tournamentId,
          {
            includeMatchMode: input.includeMatchMode,
            includeParticipants: input.includeParticipants,
            includeMatches: input.includeMatches,
          },
        );
      }),
    create: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          data: z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            matchModeId: z.string().optional(),
            displayOrder: z.number().int().min(0).optional(),
            isTeamBased: z.boolean().optional(),
            isMixed: z.boolean().optional(),
            color: z.string().optional(),
            civDraftPresetUrl: z.string().optional(),
            mapDraftPresetUrl: z.string().optional(),
            participantIds: z.array(z.string()).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentGroupRepository.createTournamentGroup(
          input.tournamentId,
          input.data,
        );
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().min(1).optional(),
            description: z.string().optional(),
            matchModeId: z.string().optional(),
            displayOrder: z.number().int().min(0).optional(),
            isTeamBased: z.boolean().optional(),
            isMixed: z.boolean().optional(),
            color: z.string().optional(),
            civDraftPresetUrl: z.string().optional(),
            mapDraftPresetUrl: z.string().optional(),
            participantIds: z.array(z.string()).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentGroupRepository.updateTournamentGroup(
          input.id,
          input.data,
        );
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentGroupRepository.deleteTournamentGroup(input.id);
      }),
  }),

  brackets: createTRPCRouter({
    listByTournament: publicProcedure
      .input(z.object({ tournamentId: z.string() }))
      .query(async ({ input }) => {
        return tournamentBracketRepository.getBracketsByTournamentId(
          input.tournamentId,
        );
      }),
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return tournamentBracketRepository.getBracketById(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          data: z.object({
            name: z.string().min(1),
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
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentBracketRepository.createBracket(
          input.tournamentId,
          input.data,
        );
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            name: z.string().min(1).optional(),
            description: z.string().optional(),
            displayOrder: z.number().int().min(0).optional(),
            bracketType: z.nativeEnum(BracketType).optional(),
            bracketSize: z.number().int().positive().optional(),
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
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentBracketRepository.updateBracket(input.id, input.data);
      }),
    allocate: adminProcedure
      .input(
        z.object({
          id: z.string(),
          mode: z.enum(["RATING", "RANDOM"]),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentBracketRepository.allocateParticipants(
          input.id,
          input.mode,
        );
      }),
    clear: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentBracketRepository.clearBracket(input.id);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentBracketRepository.deleteBracket(input.id);
      }),
  }),

  matches: createTRPCRouter({
    upcoming: publicProcedure.query(async () => {
      return tournamentMatchRepository.getUpcomingMatches();
    }),
    list: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
        }),
      )
      .query(async ({ input }) => {
        return tournamentMatchRepository.getMatchesByGroupId(input.groupId);
      }),
    get: publicProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ input }) => {
        return tournamentMatchRepository.getTournamentMatchById(input.id);
      }),
    getParticipants: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return tournamentMatchRepository.getMatchParticipants(input.id);
      }),
    getGames: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const match = await tournamentMatchRepository.getTournamentMatchById(
          input.id,
        );
        return match?.Game ?? [];
      }),
    create: adminProcedure
      .input(
        z.object({
          data: z.object({
            groupId: z.string().optional(),
            matchDate: z.date().optional(),
            civDraftKey: z.string().optional(),
            mapDraftKey: z.string().optional(),
            status: z.nativeEnum(MatchStatus).optional(),
            comment: z.string().optional(),
            adminComment: z.string().optional(),
            participantIds: z.array(z.string()).optional(),
            teamIds: z.array(z.string()).optional(),
            isManualMatch: z.boolean().default(false),
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
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.createTournamentMatch(input.data);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          data: z.object({
            matchDate: z.date().optional(),
            civDraftKey: z.string().optional(),
            mapDraftKey: z.string().optional(),
            status: z.nativeEnum(MatchStatus).optional(),
            comment: z.string().optional(),
            adminComment: z.string().optional(),
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
          }),
        }),
      )
      .mutation(async ({ input }) => {
        const before = await db.tournamentMatch.findUnique({
          where: { id: input.id },
          select: { status: true },
        });

        const updated = await tournamentMatchRepository.updateTournamentMatch(
          input.id,
          input.data,
        );

        if (
          input.data.status === MatchStatus.SCHEDULED &&
          before?.status !== MatchStatus.SCHEDULED
        ) {
          await notifyMatchScheduled(input.id);
        }

        return updated;
      }),
    addParticipant: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          participantId: z.string().optional(),
          teamId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.addMatchParticipant(input.matchId, {
          participantId: input.participantId,
          teamId: input.teamId,
        });
      }),
    removeParticipant: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          participantId: z.string().optional(),
          teamId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.removeMatchParticipant(input.matchId, {
          participantId: input.participantId,
          teamId: input.teamId,
        });
      }),
    allocatedParticipants: publicProcedure
      .input(z.object({ tournamentId: z.string() }))
      .query(async ({ input }) => {
        return tournamentMatchRepository.getBracketAllocatedParticipants(
          input.tournamentId,
        );
      }),
    manageGames: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          games: z.array(gameSchema),
          applyScore: z.boolean(),
          filesToRemove: z.array(z.string()).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.manageGames(
          input.matchId,
          input.games,
          input.applyScore,
          input.filesToRemove,
        );
      }),
    saveRecordings: protectedProcedure
      .input(
        z.object({
          matchId: z.string(),
          games: z.array(
            z.object({
              gameNumber: z.number().int().positive(),
              mapName: z.string(),
              recordingKeys: z.array(z.string()),
              participants: z.array(
                z.object({
                  matchParticipantId: z.string(),
                  civName: z.string().optional(),
                  isWinner: z.boolean(),
                }),
              ),
            }),
          ),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (input.games.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No games were provided.",
          });
        }

        await assertCanManageMatchRecordings(
          ctx.session.user.id,
          input.matchId,
        );
        await assertMatchTournamentEditable(input.matchId);

        return tournamentGameRepository.saveMatchRecordings(
          input.matchId,
          input.games,
        );
      }),
    clearRecordings: protectedProcedure
      .input(z.object({ matchId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await assertCanManageMatchRecordings(
          ctx.session.user.id,
          input.matchId,
        );
        await assertMatchTournamentEditable(input.matchId);

        return tournamentGameRepository.clearMatchRecordings(input.matchId);
      }),

    /**
     * Generates a fresh civ or map draft for a match from the preset configured
     * on the match's group, storing the resulting draft key on the match.
     * Restricted to admins and the match's participants.
     */
    generateDraft: protectedProcedure
      .input(
        z.object({
          matchId: z.string(),
          type: z.enum(["civ", "map"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { match } = await getManageableMatch(
          ctx.session.user.id,
          input.matchId,
        );

        await assertMatchTournamentEditable(input.matchId);

        const presetKey = parsePresetKey(
          input.type === "civ"
            ? match.group?.civDraftPresetUrl
            : match.group?.mapDraftPresetUrl,
        );

        if (!presetKey) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No draft preset is configured for this group.",
          });
        }

        const preset = await fetchAoe2cmPreset(presetKey);

        if (!preset) {
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "Could not load the draft preset.",
          });
        }

        const draftKey = await createAoe2cmDraft(preset);

        if (!draftKey) {
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "Could not create the draft.",
          });
        }

        await db.tournamentMatch.update({
          where: { id: input.matchId },
          data:
            input.type === "civ"
              ? { civDraftKey: draftKey }
              : { mapDraftKey: draftKey },
        });

        return { draftKey };
      }),

    /**
     * Clears a generated civ or map draft from a match. Restricted to admins and
     * the match's participants.
     */
    clearDraft: protectedProcedure
      .input(
        z.object({
          matchId: z.string(),
          type: z.enum(["civ", "map"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        await getManageableMatch(ctx.session.user.id, input.matchId);

        await assertMatchTournamentEditable(input.matchId);

        await db.tournamentMatch.update({
          where: { id: input.matchId },
          data:
            input.type === "civ" ? { civDraftKey: "" } : { mapDraftKey: "" },
        });

        return { success: true };
      }),
    updateParticipant: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          participantId: z.string(),
          data: z.object({
            isWinner: z.boolean().optional(),
            wonScore: z.number().int().min(0).optional(),
            lostScore: z.number().int().min(0).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.updateMatchParticipant(
          input.matchId,
          input.participantId,
          input.data,
        );
      }),
    updateParticipantByTeam: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          teamId: z.string(),
          data: z.object({
            isWinner: z.boolean().optional(),
            wonScore: z.number().int().min(0).optional(),
            lostScore: z.number().int().min(0).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.updateMatchParticipantByTeam(
          input.matchId,
          input.teamId,
          input.data,
        );
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.deleteTournamentMatch(input.id);
      }),

    // Admin-only approval of a match result.
    setApproval: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          approved: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        await assertMatchTournamentEditable(input.matchId);

        return tournamentMatchRepository.setMatchApproval(
          input.matchId,
          input.approved,
        );
      }),

    /**
     * Marks a match as going to be streamed by the current user. Available to
     * admins and users with the "Streamer" role. When the user has no stream
     * link stored yet, one can be provided and is saved on their profile.
     */
    markStream: protectedProcedure
      .input(
        z.object({
          matchId: z.string(),
          streamUrl: z.string().url().optional().or(z.literal("")),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        await assertCanMarkStream(userId);
        await assertMatchTournamentEditable(input.matchId);

        const match = await db.tournamentMatch.findUnique({
          where: { id: input.matchId },
          select: { id: true, matchDate: true },
        });

        if (!match) throw new TRPCError({ code: "NOT_FOUND" });

        // Persist a newly provided link on the user's profile.
        const providedUrl = input.streamUrl?.trim();
        if (providedUrl) {
          await usersRepository.updateOwnStreamUrl(userId, providedUrl);
        }

        const streamUrl =
          providedUrl ?? (await usersRepository.getUserStreamUrl(userId));

        if (!streamUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "STREAM_URL_REQUIRED",
          });
        }

        return tournamentMatchRepository.markMatchAsStreamed(
          match.id,
          userId,
          streamUrl,
          match.matchDate,
        );
      }),

    /** Removes the current user's stream entry from a match. */
    unmarkStream: protectedProcedure
      .input(z.object({ matchId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.session.user.id;
        await assertCanMarkStream(userId);
        await assertMatchTournamentEditable(input.matchId);

        return tournamentMatchRepository.unmarkMatchAsStreamed(
          input.matchId,
          userId,
        );
      }),

    // Secure match scheduling for participants. Only admins or participants of the match can schedule or unschedule it.
    scheduleMatch: protectedProcedure
      .input(z.object({ id: z.string(), matchDate: z.date() }))
      .mutation(async ({ input, ctx }) => {
        const match = await db.tournamentMatch.findUnique({
          where: { id: input.id },
          include: {
            TournamentMatchParticipant: { include: { participant: true } },
          },
        });

        if (!match) throw new TRPCError({ code: "NOT_FOUND" });

        const admin = await usersRepository.isUserAdmin(ctx.session.user.id);
        const isParticipant = match.TournamentMatchParticipant.some(
          (p) => p.participant?.userId === ctx.session.user.id,
        );

        if (!admin && !isParticipant)
          throw new TRPCError({ code: "FORBIDDEN" });

        await assertMatchTournamentEditable(input.id);

        const updated = await tournamentMatchRepository.updateTournamentMatch(
          input.id,
          {
            status: MatchStatus.SCHEDULED,
            matchDate: input.matchDate,
          },
        );

        await notifyMatchScheduled(input.id);

        return updated;
      }),

    unscheduleMatch: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const match = await db.tournamentMatch.findUnique({
          where: { id: input.id },
          include: {
            TournamentMatchParticipant: { include: { participant: true } },
          },
        });

        if (!match) throw new TRPCError({ code: "NOT_FOUND" });

        const admin = await usersRepository.isUserAdmin(ctx.session.user.id);
        const isParticipant = match.TournamentMatchParticipant.some(
          (p) => p.participant?.userId === ctx.session.user.id,
        );

        if (!admin && !isParticipant)
          throw new TRPCError({ code: "FORBIDDEN" });

        await assertMatchTournamentEditable(input.id);

        const updated = await db.tournamentMatch.update({
          where: { id: input.id },
          data: { status: MatchStatus.PENDING, matchDate: null },
        });

        await notifyMatchUnscheduled(input.id);

        return updated;
      }),
  }),
  games: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ matchId: z.string() }))
      .query(async ({ input }) => {
        return tournamentGameRepository.getGamesByMatchId(input.matchId);
      }),
  }),

  sections: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ tournamentId: z.string() }))
      .query(async ({ input }) => {
        return tournamentSectionRepository.getSectionsByTournamentId(
          input.tournamentId,
        );
      }),

    create: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          slug: z
            .string()
            .min(1)
            .regex(/^[a-z0-9-]+$/),
          displayOrder: z.number().int().min(0).optional(),
          translations: z.array(
            z.object({
              locale: z.string(),
              title: z.string().min(1),
              content: z.string().optional(),
            }),
          ),
        }),
      )
      .mutation(async ({ input }) => {
        const { tournamentId, ...data } = input;
        return tournamentSectionRepository.createSection({
          tournamentId,
          ...data,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          isVisible: z.boolean().optional(),
          translations: z
            .array(
              z.object({
                locale: z.string(),
                title: z.string().optional(),
                content: z.string().optional(),
              }),
            )
            .optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return tournamentSectionRepository.updateSection(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentSectionRepository.deleteSection(input.id);
      }),

    createPredefined: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentSectionRepository.createPredefinedSections(
          input.tournamentId,
        );
      }),

    reorder: adminProcedure
      .input(
        z.object({
          updates: z.array(
            z.object({
              id: z.string(),
              displayOrder: z.number().int().min(0),
            }),
          ),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentSectionRepository.reorderSections(input.updates);
      }),
  }),

  registrationFields: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ tournamentId: z.string() }))
      .query(async ({ input }) => {
        return tournamentRegistrationFieldRepository.list(input.tournamentId);
      }),

    // Verifies an AoE2Companion profile URL and returns the linked account name.
    companionProfile: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(async ({ input }) => {
        const profileId = parseCompanionProfileUrl(input.url);
        if (profileId === null) return null;

        const profile = await fetchAoe2CompanionProfile(profileId);
        if (!profile) return null;

        return { profileId: profile.profileId, name: profile.name };
      }),

    create: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          slug: z.string().optional(),
          translations: z.array(
            z.object({ locale: z.string(), label: z.string().min(1) }),
          ),
          type: z.nativeEnum(RegistrationFieldType),
          required: z.boolean(),
          displayOrder: z.number().int().min(0).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentRegistrationFieldRepository.create(input);
      }),

    enablePreset: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          slug: z.string(),
          displayOrder: z.number().int().min(0).optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const preset = getRegistrationFieldPreset(input.slug);

        if (!preset) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unknown registration field preset: ${input.slug}`,
          });
        }

        const existing = await tournamentRegistrationFieldRepository.findBySlug(
          input.tournamentId,
          preset.slug,
        );

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This field is already enabled.",
          });
        }

        return tournamentRegistrationFieldRepository.create({
          tournamentId: input.tournamentId,
          slug: preset.slug,
          type: preset.type,
          required: preset.required,
          translations: [],
          displayOrder: input.displayOrder,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          translations: z
            .array(z.object({ locale: z.string(), label: z.string().min(1) }))
            .optional(),
          type: z.nativeEnum(RegistrationFieldType).optional(),
          required: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return tournamentRegistrationFieldRepository.update(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentRegistrationFieldRepository.delete(input.id);
      }),

    reorder: adminProcedure
      .input(
        z.object({
          updates: z.array(
            z.object({
              id: z.string(),
              displayOrder: z.number().int().min(0),
            }),
          ),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentRegistrationFieldRepository.reorder(input.updates);
      }),
  }),
});
