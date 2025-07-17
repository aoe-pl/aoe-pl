import { db } from "@/server/db";

export const tournamentParticipantRepository = {
  async getTournamentParticipants(
    tournamentId: string,
    options: { includeUser: boolean },
  ) {
    return db.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: options.includeUser,
        TournamentGroupParticipant: {
          include: {
            tournamentGroup: {
              include: {
                stage: true,
              },
            },
          },
        },
      },
    });
  },
};
