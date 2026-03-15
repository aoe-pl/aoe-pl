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

  async findByUserAndTournament(userId: string, tournamentId: string) {
    return db.tournamentParticipant.findFirst({
      where: { userId, tournamentId },
    });
  },

  async registerParticipant(
    tournamentId: string,
    userId: string,
    nickname: string,
  ) {
    return db.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
        nickname,
        status: "REGISTERED",
      },
    });
  },

  async deleteByUserAndTournament(userId: string, tournamentId: string) {
    return db.tournamentParticipant.deleteMany({
      where: { userId, tournamentId },
    });
  },

  async deleteById(participantId: string) {
    const matchParticipants = await db.tournamentMatchParticipant.findMany({
      where: { participantId },
      select: { matchId: true },
    });

    const matchIds = matchParticipants.map((mp) => mp.matchId);
    if (matchIds.length > 0) {
      await db.tournamentMatch.deleteMany({ where: { id: { in: matchIds } } });
    }

    return db.tournamentParticipant.delete({ where: { id: participantId } });
  },
};
