import { db } from "@/server/db";
import { type tournamentStageFormSchema } from "../admin-panel/tournaments/tournament";
import type { z } from "zod";

type TournamentStageFormSchema = z.infer<typeof tournamentStageFormSchema>;

export const tournamentStagesRepository = {
  async getTournamentStages(tournamentId: string) {
    return db.tournamentStage.findMany({
      where: { tournamentId },
    });
  },
  async getTournamentStageById(id: string) {
    return db.tournamentStage.findUnique({
      where: { id },
    });
  },
  async createTournamentStage(
    tournamentId: string,
    data: TournamentStageFormSchema,
  ) {
    return db.tournamentStage.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: data.isActive,
        bracketType: data.bracketType,
        bracketSize: data.bracketSize,
        isSeeded: data.isSeeded,
        tournament: {
          connect: {
            id: tournamentId,
          },
        },
      },
    });
  },
  async updateTournamentStage(id: string, data: TournamentStageFormSchema) {
    return db.tournamentStage.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isActive: data.isActive,
        bracketType: data.bracketType,
        bracketSize: data.bracketSize,
        isSeeded: data.isSeeded,
      },
    });
  },
  async deleteTournamentStage(id: string) {
    return db.tournamentStage.delete({ where: { id } });
  },
};
