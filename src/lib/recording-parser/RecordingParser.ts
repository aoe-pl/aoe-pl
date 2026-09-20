import { parse_rec_summary } from "aoe2rec-js";
import { CIV_NAMES, MAP_NAMES } from "./civ-data";
import type { ParsedRecording } from "./types";

/**
 * RecordingParser parses .aoe2record files using the aoe2rec-js library.
 */
export class RecordingParser {
  async parse(file: File): Promise<ParsedRecording> {
    const buffer = await file.arrayBuffer();
    const summary = parse_rec_summary(buffer);

    const team0 = summary.teams[0]!;
    const team1 = summary.teams[1]!;
    const p1 = team0.players[0]!;
    const p2 = team1.players[0]!;

    // Edge case if both teams are marked as winners. This supposedly happens when one player is defeated in a restored game.
    // In this case, we will treat the winner as null.
    let winner: 1 | 2 | null = null;

    const bothMarkedAsWinners = team0?.winner === true && team1.winner === true;

    if (!bothMarkedAsWinners) {
      winner = team0.winner ? 1 : 2;
    }

    const mapId = summary.header.game_settings.resolved_map_id;
    const timestamp = summary.header.timestamp;

    return {
      player1Data: {
        profileId: p1.profile_id,
        name: p1.name,
        civId: p1.civ_id,
        civ: CIV_NAMES[p1.civ_id]!,
      },

      player2Data: {
        profileId: p2.profile_id,
        name: p2.name,
        civId: p2.civ_id,
        civ: CIV_NAMES[p2.civ_id]!,
      },

      fileName: file.name,
      map: MAP_NAMES[mapId]!,
      mapId,
      length: formatDurationMs(summary.duration),
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      winner,
      worldTime: summary.header.replay.world_time ?? 0,
    };
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

// Formats a duration in milliseconds to a string in the format "H:MM:SS".
function formatDurationMs(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
