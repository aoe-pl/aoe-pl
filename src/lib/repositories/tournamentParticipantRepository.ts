import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

/**
 * Thrown when a participant's nickname clashes with another participant of the
 * same tournament (`@@unique([tournamentId, nickname])`). Callers translate it
 * into a friendly, context-specific message (self-registration vs admin add).
 */
export class NicknameTakenError extends Error {
  constructor() {
    super("NicknameTakenError");
    this.name = "NicknameTakenError";
  }
}

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
                tournament: true,
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

  async countByTournament(tournamentId: string) {
    return db.tournamentParticipant.count({ where: { tournamentId } });
  },

  async registerParticipant(
    tournamentId: string,
    userId: string,
    nickname: string,
    registrationData: Record<string, string | number | boolean> = {},
  ) {
    try {
      return await db.tournamentParticipant.create({
        data: {
          tournamentId,
          userId,
          nickname,
          status: "REGISTERED",
          registrationData,
        },
      });
    } catch (error) {
      // The only unique constraint on this model is (tournamentId, nickname),
      // so a P2002 here always means the nickname is already taken in this
      // tournament.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new NicknameTakenError();
      }
      throw error;
    }
  },

  async deleteByUserAndTournament(userId: string, tournamentId: string) {
    return db.tournamentParticipant.deleteMany({
      where: { userId, tournamentId },
    });
  },

  async updateRegistrationData(
    participantId: string,
    registrationData: Record<string, string | number | boolean>,
  ) {
    return db.tournamentParticipant.update({
      where: { id: participantId },
      data: { registrationData },
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
