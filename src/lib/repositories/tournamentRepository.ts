import { db } from "@/server/db";

import { TournamentStatus, type RegistrationMode } from "@prisma/client";

const statusOrder = {
  [TournamentStatus.ACTIVE]: 0,
  [TournamentStatus.PENDING]: 1,
  [TournamentStatus.FINISHED]: 2,
  [TournamentStatus.CANCELLED]: 3,
};

export const tournamentRepository = {
  async getTournaments({ sortByStatus }: { sortByStatus?: boolean }) {
    const tournaments = await db.tournament.findMany({
      include: {
        tournamentSeries: true,
        matchMode: true,
        stages: true,
        TournamentParticipant: true,
      },
      orderBy: { startDate: "desc" },
    });

    if (sortByStatus) {
      return tournaments.sort((a, b) => {
        return statusOrder[a.status] - statusOrder[b.status];
      });
    }

    return tournaments;
  },
  async getTournamentById(id: string) {
    return db.tournament.findUnique({
      where: { id },
      include: {
        tournamentSeries: true,
        matchMode: true,
        stages: {
          include: {
            groups: true,
            brackets: true,
          },
        },
        TournamentParticipant: true,
      },
    });
  },
  async createTournament(data: {
    name: string;
    urlKey: string;
    registrationMode: RegistrationMode;
    tournamentSeriesId: string;
    matchModeId: string;
    description: string;
    isTeamBased: boolean;
    startDate: Date;
    endDate?: Date;
    participantsLimit?: number;
    registrationStartDate?: Date;
    registrationEndDate?: Date;
    status: TournamentStatus;
    isVisible: boolean;
  }) {
    return db.tournament.create({
      data: {
        name: data.name,
        urlKey: data.urlKey,
        registrationMode: data.registrationMode,
        description: data.description,
        isTeamBased: data.isTeamBased,
        startDate: data.startDate,
        endDate: data.endDate,
        participantsLimit: data.participantsLimit,
        registrationStartDate: data.registrationStartDate,
        registrationEndDate: data.registrationEndDate,
        status: data.status,
        isVisible: data.isVisible,
        matchMode: {
          connect: {
            id: data.matchModeId,
          },
        },
        tournamentSeries: {
          connect: {
            id: data.tournamentSeriesId,
          },
        },
      },
    });
  },
  async updateTournament(
    id: string,
    data: Partial<{
      name: string;
      urlKey: string;
      registrationMode: RegistrationMode;
      tournamentSeriesId: string;
      matchModeId: string;
      description: string;
      isTeamBased: boolean;
      startDate: Date;
      endDate?: Date;
      participantsLimit?: number;
      registrationStartDate?: Date;
      registrationEndDate?: Date;
      status: TournamentStatus;
      isVisible: boolean;
    }>,
  ) {
    return db.tournament.update({
      where: { id },
      data: {
        name: data.name,
        urlKey: data.urlKey,
        registrationMode: data.registrationMode,
        description: data.description,
        isTeamBased: data.isTeamBased,
        startDate: data.startDate,
        endDate: data.endDate,
        participantsLimit: data.participantsLimit,
        registrationStartDate: data.registrationStartDate,
        registrationEndDate: data.registrationEndDate,
        status: data.status,
        isVisible: data.isVisible,
        matchMode: {
          connect: {
            id: data.matchModeId,
          },
        },
        tournamentSeries: {
          connect: {
            id: data.tournamentSeriesId,
          },
        },
      },
    });
  },
  async deleteTournament(id: string) {
    return db.tournament.delete({ where: { id } });
  },
};
