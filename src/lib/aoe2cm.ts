/**
 * Client for the public aoe2cm.net (AoE2 Captains Mode) API.
 *
 * Drafts are created from a preset
 * Tthe preset is fetched, then posted to the "new draft" endpoint which returns a fresh draft
 * id that is viewable at https://aoe2cm.net/draft/{draftId}.
 */

const aoe2cmApi = "https://aoe2cm.net/api";
const aoe2cmBaseUrl = "https://aoe2cm.net";

/** Which kind of draft a preset/match draft represents. */
export type DraftType = "civ" | "map";

/** A single turn (ban/pick/snipe step) in an aoe2cm preset. */
interface Aoe2cmPresetTurn {
  id: string;
  player: string;
  action: string;
  exclusivity: string;
  hidden: boolean;
  executingPlayer: string;
  parallel: boolean;
}

/**
 * A preset as returned by the aoe2cm preset API.
 */
interface Aoe2cmPreset {
  name: string;
  presetId: string;
  encodedCivilisations: string;
  turns: Aoe2cmPresetTurn[];
}

/**
 * Extracts the preset key from an aoe2cm preset URL (or a bare key).
 * @param value A preset URL like "https://aoe2cm.net/preset/cOKpq" or the key "cOKpq".
 * @returns The preset key (or null)
 */
export function parsePresetKey(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const match = /\/preset\/([A-Za-z0-9_-]+)/.exec(trimmed);
  if (match?.[1]) return match[1];

  // Allow a bare preset key as a convenience.
  if (/^[A-Za-z0-9_-]+$/.test(trimmed)) return trimmed;

  return null;
}

/** Builds the public aoe2cm draft page URL for a draft key. */
export function getDraftUrl(draftKey: string): string {
  return `${aoe2cmBaseUrl}/draft/${draftKey}`;
}

/**
 * Fetches a preset object from the aoe2cm API.
 * @returns The preset, or null when it could not be fetched.
 */
export async function fetchAoe2cmPreset(
  presetKey: string,
): Promise<Aoe2cmPreset | null> {
  try {
    const response = await fetch(`${aoe2cmApi}/preset/${presetKey}`, {
      headers: { "User-Agent": "AoE2PL/1.0" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch aoe2cm preset ${presetKey}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as Aoe2cmPreset;
  } catch (error) {
    console.error(`Error fetching aoe2cm preset ${presetKey}:`, error);
    return null;
  }
}

/**
 * Creates a new public draft from a preset.
 * @returns The new draft key, or null when it could not be created.
 */
export async function createAoe2cmDraft(
  preset: Aoe2cmPreset,
): Promise<string | null> {
  try {
    const response = await fetch(`${aoe2cmApi}/draft/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AoE2PL/1.0",
      },
      body: JSON.stringify({ preset, private: false }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to create aoe2cm draft: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as { draftId?: string };
    return data.draftId ?? null;
  } catch (error) {
    console.error("Error creating aoe2cm draft:", error);
    return null;
  }
}
