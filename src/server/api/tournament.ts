import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tournamentRepository } from "@/lib/repositories/tournamentRepository";
import { TournamentStatus, RegistrationMode } from "@prisma/client";
import type {
  Tournament,
  TournamentSeries,
  TournamentParticipant,
} from "@prisma/client";

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
});
