import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tournamentRepository } from "@/lib/repositories/tournamentRepository";
import { tournamentSeriesRepository } from "@/lib/repositories/tournamentSeriesRepository";
import {
  TournamentStatus,
  RegistrationMode,
  TournamentMatchModeType,
} from "@prisma/client";
import type {
  Tournament,
  TournamentSeries,
  TournamentParticipant,
} from "@prisma/client";
import { tournamentMatchModeRepository } from "@/lib/repositories/tournamentMatchModeRepository";

export type TournamentWithRelations = Tournament & {
  tournamentSeries: TournamentSeries | null;
  matchMode: { id: string; mode: string; gameCount: number };
  TournamentParticipant: TournamentParticipant[];
};

export const tournamentRouter = createTRPCRouter({
  list: publicProcedure.query(async (): Promise<TournamentWithRelations[]> => {
    return tournamentRepository.getTournaments();
  }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return tournamentRepository.getTournamentById(input.id);
    }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        urlKey: z.string(),
        registrationMode: z.nativeEnum(RegistrationMode),
        tournamentSeriesId: z.string(),
        matchModeId: z.string(),
        description: z.string(),
        isTeamBased: z.boolean(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        participantsLimit: z.number().optional(),
        registrationStartDate: z.coerce.date().optional(),
        registrationEndDate: z.coerce.date().optional(),
        status: z.nativeEnum(TournamentStatus),
        isVisible: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      return tournamentRepository.createTournament(input);
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          urlKey: z.string().optional(),
          registrationMode: z.nativeEnum(RegistrationMode).optional(),
          tournamentSeriesId: z.string().optional(),
          matchModeId: z.string().optional(),
          description: z.string().optional(),
          isTeamBased: z.boolean().optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          participantsLimit: z.number().optional(),
          registrationStartDate: z.coerce.date().optional(),
          registrationEndDate: z.coerce.date().optional(),
          status: z.nativeEnum(TournamentStatus).optional(),
          isVisible: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return tournamentRepository.updateTournament(input.id, input.data);
    }),
  delete: publicProcedure
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
    create: publicProcedure
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
    update: publicProcedure
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
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentSeriesRepository.deleteTournamentSeries(input.id);
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
    create: publicProcedure
      .input(
        z.object({
          mode: z.nativeEnum(TournamentMatchModeType),
          gameCount: z.number().int().positive(),
        }),
      )
      .mutation(async ({ input }) => {
        return tournamentMatchModeRepository.createMatchMode(input);
      }),
    update: publicProcedure
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
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return tournamentMatchModeRepository.deleteMatchMode(input.id);
      }),
  }),
});
