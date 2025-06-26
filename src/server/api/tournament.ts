import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { tournamentRepository } from "@/lib/repositories/tournamentRepository";
import { tournamentSeriesRepository } from "@/lib/repositories/tournamentSeriesRepository";
import { TournamentMatchModeType, MatchStatus } from "@prisma/client";
import type {
  Tournament,
  TournamentSeries,
  TournamentParticipant,
} from "@prisma/client";
import { tournamentMatchModeRepository } from "@/lib/repositories/tournamentMatchModeRepository";
import {
  tournamentFormSchema,
  tournamentStageFormSchema,
} from "@/lib/admin-panel/tournaments/tournament";
import { tournamentStagesRepository } from "@/lib/repositories/tournamentStagesRepository";
import { tournamentParticipantRepository } from "@/lib/repositories/tournamentParticipantRepository";
import { tournamentGroupRepository } from "@/lib/repositories/tournamentGroupRepository";
import { tournamentMatchRepository } from "@/lib/repositories/tournamentMatchRepository";
import { tournamentGameRepository } from "@/lib/repositories/tournamentGameRepository";

const gameSchema = z.object({
  mapId: z.string(),
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
  matchMode: { id: string; mode: string; gameCount: number };
  TournamentParticipant: TournamentParticipant[];
};

export const tournamentRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          sortByStatus: z.boolean().optional(),
          includeTournamentSeries: z.boolean().optional(),
          includeStages: z.boolean().optional(),
          includeParticipants: z.boolean().optional(),
          includeMatchMode: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }): Promise<TournamentWithRelations[]> => {
      return tournamentRepository.getTournaments({
        sortByStatus: input?.sortByStatus,
        includeTournamentSeries: input?.includeTournamentSeries,
        includeStages: input?.includeStages,
        includeParticipants: input?.includeParticipants,
        includeMatchMode: input?.includeMatchMode,
      });
    }),
  get: publicProcedure
    .input(
      z.object({
        id: z.string(),
        includeTournamentSeries: z.boolean().optional(),
        includeStages: z.boolean().optional(),
        includeParticipants: z.boolean().optional(),
        includeMatchMode: z.boolean().optional(),
        includeBrackets: z.boolean().optional(),
        includeGroups: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      return tournamentRepository.getTournamentById(input.id, {
        includeStages: input.includeStages,
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

  // Tournament Stages routes
  stages: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ tournamentId: z.string() }))
      .query(async ({ input }) => {
        return tournamentStagesRepository.getTournamentStages(
          input.tournamentId,
        );
      }),
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return tournamentStagesRepository.getTournamentStageById(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          tournamentId: z.string(),
          data: tournamentStageFormSchema,
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentStagesRepository.createTournamentStage(
          input.tournamentId,
          input.data,
        );
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          data: tournamentStageFormSchema,
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentStagesRepository.updateTournamentStage(
          input.id,
          input.data,
        );
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentStagesRepository.deleteTournamentStage(input.id);
      }),
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
          name: z.string().min(1, "Name is required"),
          description: z.string(),
          displayOrder: z.number().int().positive(),
          ownerId: z.string().min(1, "Owner is required"),
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
  }),

  groups: createTRPCRouter({
    list: publicProcedure
      .input(
        z.object({
          stageId: z.string(),
          includeMatchMode: z.boolean().optional().default(false),
          includeParticipants: z.boolean().optional().default(false),
          includeMatches: z.boolean().optional().default(false),
        }),
      )
      .query(async ({ input }) => {
        return tournamentGroupRepository.getTournamentGroups(input.stageId, {
          includeMatchMode: input.includeMatchMode,
          includeParticipants: input.includeParticipants,
          includeMatches: input.includeMatches,
        });
      }),
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
          stageId: z.string(),
          data: z.object({
            name: z.string().min(1),
            description: z.string().optional(),
            matchModeId: z.string().optional(),
            displayOrder: z.number().int().min(0).optional(),
            isTeamBased: z.boolean().optional(),
            isMixed: z.boolean().optional(),
            participantIds: z.array(z.string()).optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentGroupRepository.createTournamentGroup(
          input.stageId,
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

  matches: createTRPCRouter({
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
                  score: z.number(),
                  isWinner: z.boolean(),
                }),
              )
              .optional(),
            teamScores: z
              .array(
                z.object({
                  teamId: z.string(),
                  score: z.number(),
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
                  score: z.number(),
                  isWinner: z.boolean(),
                }),
              )
              .optional(),
            teamScores: z
              .array(
                z.object({
                  teamId: z.string(),
                  score: z.number(),
                  isWinner: z.boolean(),
                }),
              )
              .optional(),
          }),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.updateTournamentMatch(
          input.id,
          input.data,
        );
      }),
    manageGames: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          games: z.array(gameSchema),
          applyScore: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchRepository.manageGames(
          input.matchId,
          input.games,
          input.applyScore,
        );
      }),
    updateParticipant: adminProcedure
      .input(
        z.object({
          matchId: z.string(),
          participantId: z.string(),
          data: z.object({
            isWinner: z.boolean().optional(),
            score: z.number().int().min(0).optional(),
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
            score: z.number().int().min(0).optional(),
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
  }),
  games: createTRPCRouter({
    list: publicProcedure
      .input(z.object({ matchId: z.string() }))
      .query(async ({ input }) => {
        return tournamentGameRepository.getGamesByMatchId(input.matchId);
      }),
  }),
});
