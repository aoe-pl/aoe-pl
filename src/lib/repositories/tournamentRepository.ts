import { db } from "@/server/db";

import {
  TournamentStatus,
  type RegistrationMode,
  type TournamentStageType,
  type BracketType,
} from "@prisma/client";

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
    return db.tournament.create({ data });
  },
  async createTournamentWithStages(
    tournamentData: {
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
    },
    stagesData: {
      name: string;
      type: TournamentStageType;
      isActive: boolean;
      description?: string;
      bracketType?: BracketType;
      bracketSize?: number;
      isSeeded: boolean;
    }[],
  ) {
    const { tournamentSeriesId, matchModeId, ...rest } = tournamentData;

    return db.tournament.create({
      data: {
        ...rest,
        tournamentSeries: {
          connect: {
            id: tournamentSeriesId,
          },
        },
        matchMode: {
          connect: {
            id: matchModeId,
          },
        },
        stages: {
          create: stagesData,
        },
      },
    });
  },
  async updateTournament(
    id: string,
    data: Partial<{
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
    return db.tournament.update({ where: { id }, data });
  },
  async deleteTournament(id: string) {
    return db.tournament.delete({ where: { id } });
  },
};
