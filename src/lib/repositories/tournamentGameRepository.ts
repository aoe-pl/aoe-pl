import { syncBracketAdvancement } from "@/lib/repositories/tournamentBracketRepository";
import { createAoe2RecsService } from "@/lib/storage";
import { sanitizeFileName, storagePaths } from "@/lib/storage/paths";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

/** A single game (and its recordings) as produced by the upload dialog. */
export interface RecordingGameInput {
  gameNumber: number;
  mapName: string;
  /** Storage keys of every recording file belonging to this game. */
  recordingKeys: string[];
  participants: {
    matchParticipantId: string;
    civName?: string;
    isWinner: boolean;
  }[];
}

const FALLBACK_MAP_NAME = "Unknown";

/** Find (case-insensitively) or create a civilization by its display name. */
async function resolveCivId(tx: TxClient, name: string | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const existing = await tx.civ.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing.id;

  const created = await tx.civ.create({ data: { name: trimmed } });
  return created.id;
}

/** Find (case-insensitively) or create a map (and its base map) by name. */
async function resolveMapId(tx: TxClient, name: string) {
  const trimmed = name.trim() || FALLBACK_MAP_NAME;

  const existing = await tx.map.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing.id;

  let baseMap = await tx.baseMap.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  baseMap ??= await tx.baseMap.create({ data: { name: trimmed } });

  const created = await tx.map.create({
    data: { name: trimmed, baseMapId: baseMap.id },
  });
  return created.id;
}

export const tournamentGameRepository = {
  async getGamesByMatchId(matchId: string) {
    return db.game.findMany({
      where: { matchId },
      include: {
        map: true,
        participants: {
          include: {
            matchParticipant: true,
            civ: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
  },

  async getGamesWithReplaysByMatchId(matchId: string) {
    return db.game.findMany({
      where: {
        matchId,
        recUrl: { not: null },
      },
      select: {
        id: true,
        recUrl: true,
        map: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
  },

  /**
   * Persist the games parsed from uploaded recordings for a match.
   *
   * Replaces any previously saved games, resolves map/civ names to their
   * catalogue entries (creating them when unknown), stores the recording file
   * keys, and recomputes each participant's series score/winner.
   */
  async saveMatchRecordings(matchId: string, games: RecordingGameInput[]) {
    return db.$transaction(async (tx) => {
      const matchParticipants = await tx.tournamentMatchParticipant.findMany({
        where: { matchId },
      });
      const participantIds = new Set(matchParticipants.map((p) => p.id));
      const hadWinnerBefore = matchParticipants.some((p) => p.isWinner);

      // Replace any games saved by a previous upload.
      await tx.game.deleteMany({ where: { matchId } });

      for (const game of games) {
        const createdGame = await tx.game.create({
          data: {
            matchId,
            mapId: await resolveMapId(tx, game.mapName),
            gameNumber: game.gameNumber,
            recUrl: game.recordingKeys[0] ?? null,
            recordingKeys: game.recordingKeys,
          },
        });

        for (const participant of game.participants) {
          if (!participantIds.has(participant.matchParticipantId)) continue;

          await tx.gameParticipant.create({
            data: {
              gameId: createdGame.id,
              matchParticipantId: participant.matchParticipantId,
              civId: await resolveCivId(tx, participant.civName),
              isWinner: participant.isWinner,
            },
          });
        }
      }

      // Recompute each participant's series score from the saved games.
      const wins = new Map<string, number>();
      const losses = new Map<string, number>();
      for (const participant of matchParticipants) {
        wins.set(participant.id, 0);
        losses.set(participant.id, 0);
      }

      for (const game of games) {
        for (const participant of game.participants) {
          if (!participantIds.has(participant.matchParticipantId)) continue;

          const counters = participant.isWinner ? wins : losses;
          counters.set(
            participant.matchParticipantId,
            (counters.get(participant.matchParticipantId) ?? 0) + 1,
          );
        }
      }

      const maxWins = Math.max(0, ...wins.values());

      await Promise.all(
        matchParticipants.map((participant) => {
          const wonScore = wins.get(participant.id) ?? 0;

          return tx.tournamentMatchParticipant.update({
            where: { id: participant.id },
            data: {
              wonScore,
              lostScore: losses.get(participant.id) ?? 0,
              isWinner: wonScore === maxWins && maxWins > 0,
            },
          });
        }),
      );

      // Once results are recorded the match counts as played. This also
      // invalidates any previous admin approval, which has to be re-granted.
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: "COMPLETED" },
      });

      await syncBracketAdvancement(tx, matchId, { hadWinnerBefore });

      return { gamesSaved: games.length };
    });
  },

  /**
   * Resolve the storage folder that holds every recording uploaded for a
   * match (`tournaments/<tournament urlKey>/games/<matchNumber>`), together
   * with a human-friendly base name for downloads built from the players/teams
   * involved.
   */
  async getMatchRecordingsInfo(matchId: string) {
    const match = await db.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        matchNumber: true,
        group: {
          select: { tournament: { select: { urlKey: true } } },
        },
        TournamentMatchParticipant: {
          select: {
            participant: {
              select: { nickname: true, user: { select: { name: true } } },
            },
            team: { select: { name: true } },
          },
        },
      },
    });

    const tournament = match?.group?.tournament;
    if (!match || !tournament) return null;

    const slotNames = match.TournamentMatchParticipant.map((slot) => {
      if (slot.participant) {
        return slot.participant.nickname ?? slot.participant.user?.name ?? "";
      }
      if (slot.team) return slot.team.name;
      return "";
    }).filter((name) => name.length > 0);

    const playerBaseName = sanitizeFileName(slotNames.join("_"));

    return {
      prefix: storagePaths.tournamentMatchGames(
        tournament.urlKey,
        String(match.matchNumber),
      ),
      playerBaseName,
    };
  },

  /**
   * Resolve the storage keys of every recording file belonging to a single
   * game. A game recorded across multiple
   * (restored) files returns several keys; a game with no recording returns an
   * empty array.
   */
  async getMatchRecordingKeysByGameNumber(
    matchId: string,
    gameNumber: number,
  ): Promise<string[]> {
    const game = await db.game.findFirst({
      where: { matchId, gameNumber },
      select: { recordingKeys: true, recUrl: true },
    });

    if (!game) return [];

    if (game.recordingKeys.length > 0) return game.recordingKeys;

    return game.recUrl ? [game.recUrl] : [];
  },

  /**
   * Remove every recording saved for a match: the objects in Minio and the
   * corresponding games in the database. Participant series scores are reset
   * and the match status is reverted to its pre-result state. Missing objects
   * are ignored so a partially uploaded match can still be cleared.
   */
  async clearMatchRecordings(matchId: string) {
    const info = await tournamentGameRepository.getMatchRecordingsInfo(matchId);

    if (info) {
      const s3Service = createAoe2RecsService();
      try {
        const { objects } = await s3Service.list({ prefix: info.prefix });

        await Promise.all(
          objects.map((object) =>
            s3Service.delete(object.key).catch((error: unknown) => {
              console.warn("Failed to delete recording:", object.key, error);
            }),
          ),
        );
      } catch (error) {
        console.warn("Failed to list recordings for match:", matchId, error);
      }
    }

    return db.$transaction(async (tx) => {
      const match = await tx.tournamentMatch.findUnique({
        where: { id: matchId },
        select: { matchDate: true },
      });

      const deleted = await tx.game.deleteMany({ where: { matchId } });

      await tx.tournamentMatchParticipant.updateMany({
        where: { matchId },
        data: { wonScore: 0, lostScore: 0, isWinner: false },
      });

      // Revert the match to its pre-result state: scheduled when it still has
      // a date, pending otherwise. Any admin approval is revoked with it.
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: match?.matchDate ? "SCHEDULED" : "PENDING" },
      });

      return { gamesDeleted: deleted.count };
    });
  },
};
