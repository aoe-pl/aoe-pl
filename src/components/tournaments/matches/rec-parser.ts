/* eslint-disable */

/**
 * This module provides functions to parse .aoe2record files using the mgz Python library running inside Pyodide.
 */

import type { MgzMatch, UploadRecsPayload } from "./rec-types";

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

let _pyodide: PyodideInstance | null = null;

const pythonStringToParse =
  "import json\n" +
  "from mgz.model import parse_match, serialize\n" +
  "with open('/recdata.aoe2record', 'rb') as h:\n" +
  "\tmatch = parse_match(h)\n" +
  "\tmatch.hash = False\n" +
  "\tresult = json.dumps(serialize(match))";

// prettier-ignore
const keysToOmit = new Set([
  "gaia", "file", "actions", "inputs",
  "all_technologies", "allow_specs", "build_version", "cheats",
  "dataset", "dataset_id", "difficulty", "difficulty_id", "diplomacy_type",
  "hash", "lock_speed", "lock_teams", "log_version", "map_reveal",
  "map_reveal_id", "multiqueue", "population", "private", "save_version",
  "spec_delay", "speed", "speed_id", "team_together", "chat"
]);

const playerKeysToOmit = new Set(["objects", "timeseries", "position"]);

/**
 * Loads a script from the given URL and appends it to the document head.
 * @param src The URL of the script to load.
 */
function loadScriptFromSrc(src: string): Promise<void> {
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

/**
 * Loads Pyodide and installs the Python packages required to parse AoE2
 * recordings.
 */
export async function initializePyodide(
  pyodideUrl = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js",
): Promise<void> {
  if (_pyodide) return;

  await loadScriptFromSrc(pyodideUrl);

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

  _pyodide = pyo;
}

/** Returns the initialised Pyodide instance or throws if not yet initialised. */
export function getPyodide(): PyodideInstance {
  if (!_pyodide) {
    throw new Error(
      "Pyodide is not initialised. Call initializePyodide() first.",
    );
  }
  return _pyodide;
}

// ─── File helpers ─────────────────────────────────────────────────────────────

/** Reads a File and returns its raw bytes as a Uint8Array. */
export function readFileAsBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) =>
      resolve(new Uint8Array(e.target!.result as ArrayBuffer));
    reader.onerror = () => reject(new Error("Failed to read file as bytes"));
  });
}

/** Reads a File and returns the raw base64 string (no data-URL prefix). */
// TODO: Consider if this is needed - taken from legacy code, but files can be parsed on client side. Unused for now.
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      resolve(dataUrl.split(",")[1]!);
    };
    reader.onerror = () => reject(new Error("Failed to read file as base64"));
  });
}

/**
 * Parses .aoe2record file using the Python mgz library running inside Pyodide.
 */
export async function parseRecording(file: File): Promise<MgzMatch> {
  const bytes = await readFileAsBytes(file);

  const pyo = getPyodide();
  pyo.FS.writeFile("/recdata.aoe2record", bytes, { encoding: "binary" });

  await pyo.runPythonAsync(pythonStringToParse);

  const raw = JSON.parse(pyo.globals.get("result") as string);

  const parsed = {
    ...Object.fromEntries(
      Object.entries(raw).filter(([k]) => !keysToOmit.has(k)),
    ),
    map: { id: raw.map.id, name: raw.map.name },
    players: raw.players.map((p: any) =>
      Object.fromEntries(
        Object.entries(p).filter(([k]) => !playerKeysToOmit.has(k)),
      ),
    ),
  } as MgzMatch;

  console.log(`[mgz-parser] Parsed "${file.name}":`, parsed);

  return parsed;
}

/**
 * Uploads base64-encoded recording files to the helper backend.
 * @param payload The payload containing the base64-encoded recordings and metadata.
 * @param endpoint The endpoint to which the recordings should be uploaded.
 */
export async function uploadRecordings(
  payload: UploadRecsPayload,
  endpoint = "https://helper.aoe4.pl/recsUpload",
): Promise<void> {
  // TODO: Consider if needed - taken from legacy code, but files can be parsed on client side. Unused for now.
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `Upload failed — ${response.status} ${response.statusText}`,
    );
  }
}
