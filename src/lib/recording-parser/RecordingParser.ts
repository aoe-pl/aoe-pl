/* eslint-disable */

/**
 * RecordingParser parses .aoe2record files into a normalised ParsedRecording.
 *
 * It tries the mgz Python library (via Pyodide) first, which gives the richest
 * data. If mgz fails — most commonly with restored-game files — it falls back
 * to the aoe2rec-js library automatically.
 */

import { parse_rec_summary } from "aoe2rec-js";
import { CIV_NAMES, MAP_NAMES } from "./civ-data";
import type { MgzMatch, ParsedRecording } from "./types";

// ─── Pyodide internals ────────────────────────────────────────────────────────

interface PyodideInstance {
  loadPackage(packages: string | string[]): Promise<void>;
  runPythonAsync(code: string): Promise<unknown>;
  globals: { get(key: string): unknown };
  FS: {
    writeFile(
      path: string,
      data: Uint8Array,
      options?: { encoding?: string },
    ): void;
  };
}

const MGZ_PYTHON =
  "import json\n" +
  "from mgz.model import parse_match, serialize\n" +
  "with open('/recdata.aoe2record', 'rb') as h:\n" +
  "\tmatch = parse_match(h)\n" +
  "\tmatch.hash = False\n" +
  "\tresult = json.dumps(serialize(match))";

// prettier-ignore
const MGZ_KEYS_TO_OMIT = new Set([
  "gaia", "file", "actions", "inputs",
  "all_technologies", "allow_specs", "build_version", "cheats",
  "dataset", "dataset_id", "difficulty", "difficulty_id", "diplomacy_type",
  "hash", "lock_speed", "lock_teams", "log_version", "map_reveal",
  "map_reveal_id", "multiqueue", "population", "private", "save_version",
  "spec_delay", "speed", "speed_id", "team_together", "chat",
]);

const MGZ_PLAYER_KEYS_TO_OMIT = new Set(["objects", "timeseries", "position"]);

// ─── RecordingParser ──────────────────────────────────────────────────────────

export class RecordingParser {
  private static _pyodide: PyodideInstance | null = null;

  get ready(): boolean {
    return RecordingParser._pyodide !== null;
  }

  /**
   * Loads Pyodide and installs the mgz Python packages.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  async initialize(
    pyodideUrl = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js",
  ): Promise<void> {
    if (RecordingParser._pyodide) return;

    await this.loadScript(pyodideUrl);

    const pyo = (await (globalThis as any).loadPyodide()) as PyodideInstance;
    await pyo.loadPackage("micropip");
    await pyo.runPythonAsync(
      [
        "import micropip",
        'await micropip.install("/construct-2.8.16-py2.py3-none-any.whl")',
        'await micropip.install("/aocref-2.0.37-py3-none-any.whl")',
        'await micropip.install("/tabulate-0.9.0-py3-none-any.whl")',
        'await micropip.install("hashlib")',
        'await micropip.install("/mgz-1.8.51-py3-none-any.whl")',
        'await micropip.install("pillow")',
        "import mgz",
      ].join("\n"),
    );

    RecordingParser._pyodide = pyo;
  }

  /**
   * Parses a .aoe2record file.
   * Tries mgz first; falls back to aoe2rec-js if mgz fails.
   */
  async parse(file: File): Promise<ParsedRecording> {
    try {
      return await this.parseWithMgz(file);
    } catch {
      return this.parseWithFallback(file);
    }
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private getPyodide(): PyodideInstance {
    if (!RecordingParser._pyodide) {
      throw new Error(
        "RecordingParser not initialised. Call initialize() first.",
      );
    }
    return RecordingParser._pyodide;
  }

  private async parseWithMgz(file: File): Promise<ParsedRecording> {
    const bytes = await readFileAsBytes(file);
    const pyo = this.getPyodide();

    pyo.FS.writeFile("/recdata.aoe2record", bytes, { encoding: "binary" });
    await pyo.runPythonAsync(MGZ_PYTHON);

    const raw = JSON.parse(pyo.globals.get("result") as string);
    const parsed = {
      ...Object.fromEntries(
        Object.entries(raw).filter(([k]) => !MGZ_KEYS_TO_OMIT.has(k)),
      ),
      map: { id: raw.map.id, name: raw.map.name },
      players: raw.players.map((p: any) =>
        Object.fromEntries(
          Object.entries(p).filter(([k]) => !MGZ_PLAYER_KEYS_TO_OMIT.has(k)),
        ),
      ),
    } as MgzMatch;

    console.log(`[mgz] Parsed "${file.name}":`, parsed);

    const winnerIdx = parsed.players.findIndex((p) => p.winner);
    const winner: 1 | 2 | null =
      winnerIdx === 0 ? 1 : winnerIdx === 1 ? 2 : null;

    return {
      fileName: file.name,
      player1: parsed.players[0]?.name ?? "",
      player2: parsed.players[1]?.name ?? "",
      profileId1: parsed.players[0]?.profile_id ?? 0,
      profileId2: parsed.players[1]?.profile_id ?? 0,
      civ1: parsed.players[0]?.civilization ?? "",
      civ2: parsed.players[1]?.civilization ?? "",
      civId1: parsed.players[0]?.civilization_id ?? 0,
      civId2: parsed.players[1]?.civilization_id ?? 0,
      map: parsed.map.name,
      mapId: parsed.map.id,
      length: trimSubSeconds(parsed.duration),
      date: parsed.timestamp
        ? new Date(parsed.timestamp).toISOString().slice(0, 10)
        : "",
      winner,
      guid: parsed.guid,
      restored: parsed.restored,
    };
  }

  private async parseWithFallback(file: File): Promise<ParsedRecording> {
    const buffer = await file.arrayBuffer();
    const summary = parse_rec_summary(buffer);

    console.log(`[aoe2rec-js] "${file.name}"`, {
      duration_raw: summary.duration,
      world_time: summary.header.replay.world_time,
      old_world_time: summary.header.replay.old_world_time,
      timestamp: summary.header.timestamp,
      map_resolved_id: summary.header.game_settings.resolved_map_id,
      map_selected_id: summary.header.game_settings.selected_map_id,
      rms_strings: summary.header.game_settings.rms_strings,
      replay: {
        game_mode: summary.header.replay.game_mode,
        game_speed: summary.header.replay.game_speed,
        num_players: summary.header.replay.num_players,
        timer: summary.header.replay.timer,
        world_time: summary.header.replay.world_time,
      },
      teams: summary.teams.map((team, i) => ({
        team: i,
        winner: team.winner,
        players: team.players.map((p) => ({
          name: p.name,
          player_number: p.player_number,
          civ_id: p.civ_id,
          profile_id: p.profile_id,
          resigned: p.resigned,
          color_id: p.color_id,
          resolved_team_id: p.resolved_team_id,
          selected_team_id: p.selected_team_id,
        })),
      })),
    });

    const team0 = summary.teams[0];
    const team1 = summary.teams[1];
    const p1 = team0?.players[0];
    const p2 = team1?.players[0];

    const winner: 1 | 2 | null = team0?.winner ? 1 : team1?.winner ? 2 : null;

    const mapId = summary.header.game_settings.resolved_map_id;
    const timestamp = summary.header.timestamp;

    return {
      fileName: file.name,
      player1: p1?.name ?? "",
      player2: p2?.name ?? "",
      profileId1: p1?.profile_id ?? 0,
      profileId2: p2?.profile_id ?? 0,
      civ1: CIV_NAMES[p1?.civ_id ?? -1] ?? `Civ #${p1?.civ_id ?? "?"}`,
      civ2: CIV_NAMES[p2?.civ_id ?? -1] ?? `Civ #${p2?.civ_id ?? "?"}`,
      civId1: p1?.civ_id ?? 0,
      civId2: p2?.civ_id ?? 0,
      map: MAP_NAMES[mapId] ?? `Map #${mapId}`,
      mapId,
      length: formatDurationMs(summary.duration),
      date: timestamp
        ? new Date(timestamp * 1000).toISOString().slice(0, 10)
        : "",
      winner,
      // aoe2rec-js does not expose a game GUID.
      // Empty guid tells validateRestoredGame to skip the guid-match check.
      guid: "",
      restored: true,
    };
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function readFileAsBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) =>
      resolve(new Uint8Array(e.target!.result as ArrayBuffer));
    reader.onerror = () => reject(new Error("Failed to read file as bytes"));
  });
}

function trimSubSeconds(duration: string): string {
  return duration.split(".")[0] ?? duration;
}

function formatDurationMs(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
