import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { tournamentRepository } from "@/lib/repositories/tournamentRepository";
import { tournamentSeriesRepository } from "@/lib/repositories/tournamentSeriesRepository";
import { TournamentMatchModeType } from "@prisma/client";
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
});
