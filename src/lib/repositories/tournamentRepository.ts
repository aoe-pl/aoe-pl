import { db } from "@/server/db";

import {
  TournamentStatus,
  type RegistrationMode,
  type TournamentFormat,
} from "@prisma/client";

const statusOrder = {
  [TournamentStatus.ACTIVE]: 0,
  [TournamentStatus.PENDING]: 1,
  [TournamentStatus.FINISHED]: 2,
  [TournamentStatus.CANCELLED]: 3,
};

export interface TournamentQueryOptions {
  includeGroups?: boolean;
  includeParticipants?: boolean;
  includeMatchMode?: boolean;
  includeBrackets?: boolean;
}

export const tournamentRepository = {
  async getTournaments({
    sortByStatus,
    includeTournamentSeries = false,
    includeParticipants = false,
    includeMatchMode = false,
    archived = false,
  }: {
    sortByStatus?: boolean;
    includeTournamentSeries?: boolean;
    includeParticipants?: boolean;
    includeMatchMode?: boolean;
    archived?: boolean;
  }) {
    const tournaments = await db.tournament.findMany({
      where: {
        archived: archived,
      },
      include: {
        tournamentSeries: includeTournamentSeries,
        matchMode: includeMatchMode,
        TournamentParticipant: includeParticipants,
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
  async getTournamentById(
    id: string,
    {
      includeGroups = false,
      includeParticipants = false,
      includeMatchMode = false,
      includeBrackets = false,
    }: {
      includeGroups?: boolean;
      includeParticipants?: boolean;
      includeMatchMode?: boolean;
      includeBrackets?: boolean;
    } = {},
  ) {
    return db.tournament.findUnique({
      where: { id },
      include: {
        tournamentSeries: true,
        matchMode: includeMatchMode,
        groups: includeGroups,
        brackets: includeBrackets,
        TournamentParticipant: includeParticipants,
      },
    });
  },
  async getTournamentBySeriesAndUrlKey(
    seriesId: string,
    urlKey: string,
    {
      includeGroups = false,
      includeParticipants = false,
      includeMatchMode = false,
      includeBrackets = false,
    }: TournamentQueryOptions = {},
  ) {
    return db.tournament.findFirst({
      where: { tournamentSeriesId: seriesId, urlKey },
      include: {
        tournamentSeries: true,
        matchMode: includeMatchMode,
        groups: includeGroups,
        brackets: includeBrackets,
        TournamentParticipant: includeParticipants,
      },
    });
  },
  async createTournament(data: {
    name: string;
    urlKey: string;
    registrationMode: RegistrationMode;
    tournamentSeriesId: string;
    format: TournamentFormat;
    description?: string;
    imageKey?: string | null;
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
        format: data.format,
        description: data.description,
        imageKey: data.imageKey,
        isTeamBased: data.isTeamBased,
        startDate: data.startDate,
        endDate: data.endDate,
        participantsLimit: data.participantsLimit,
        registrationStartDate: data.registrationStartDate,
        registrationEndDate: data.registrationEndDate,
        status: data.status,
        isVisible: data.isVisible,
        tournamentSeries: {
          connect: {
            id: data.tournamentSeriesId,
          },
        },
        sections: {
          create: [
            {
              slug: "information",
            },
          ],
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
      format: TournamentFormat;
      description: string;
      imageKey?: string | null;
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
        format: data.format,
        description: data.description,
        imageKey: data.imageKey,
        isTeamBased: data.isTeamBased,
        startDate: data.startDate,
        endDate: data.endDate,
        participantsLimit: data.participantsLimit,
        registrationStartDate: data.registrationStartDate,
        registrationEndDate: data.registrationEndDate,
        status: data.status,
        isVisible: data.isVisible,
        tournamentSeries: {
          connect: {
            id: data.tournamentSeriesId,
          },
        },
      },
    });
  },
  async deleteTournament(id: string) {
    return db.$transaction(async (tx) => {
      // Bracket matches aren't cascade-deleted when their bracket is removed
      // (TournamentBracketNode.matchId has no cascade), so they'd be left
      // orphaned. Detach and delete them explicitly first - this cascades
      // Game/GameParticipant/TournamentMatchParticipant/streams.
      await tx.tournamentBracketNode.updateMany({
        where: { bracket: { tournamentId: id } },
        data: { matchId: null },
      });

      const matches = await tx.tournamentMatch.findMany({
        where: {
          OR: [
            { group: { tournamentId: id } },
            {
              bracketNodes: {
                some: { bracket: { tournamentId: id } },
              },
            },
          ],
        },
        select: { id: true },
      });
      await tx.tournamentMatch.deleteMany({
        where: { id: { in: matches.map((m) => m.id) } },
      });

      // Break the TournamentTeam <-> TournamentParticipant (captain) cycle
      // before deleting participants/teams.
      await tx.tournamentTeam.updateMany({
        where: { tournamentId: id },
        data: { captainId: null },
      });

      await tx.tournamentParticipant.deleteMany({
        where: { tournamentId: id },
      });

      await tx.tournamentTeam.deleteMany({ where: { tournamentId: id } });

      return tx.tournament.delete({ where: { id } });
    });
  },
  async archiveTournament(id: string) {
    return db.tournament.update({
      where: { id },
      data: { archived: true },
    });
  },
  async unarchiveTournament(id: string) {
    return db.tournament.update({
      where: { id },
      data: { archived: false },
    });
  },
};
