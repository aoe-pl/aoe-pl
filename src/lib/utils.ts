import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts text into a URL friendly slug by lowercasing, removing accents, and replacing special characters with hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const getIsProductionEnv = () => {
  return process.env.NODE_ENV === "production";
};

/**
 * Determines if a hex color is bright or dark.
 * @param hexColor Hex color string.
 * @returns True if the color is bright, false if dark.
 */
export function isBrightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate perceived brightness (using formula for relative luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 120;
}

/**
 * Extracts the player profile ID from an aoe2companion URL.
 * @param url The aoe2companion URL (e.g., "https://www.aoe2companion.com/players/233750").
 * @returns The player profile ID as a number, or null if the URL is invalid.
 */
export function getPlayerProfileIdFromCompanionUrl(url: string): number | null {
  if (!url) return null;

  const match = /\/players\/(\d+)(?:\/|\?|$)/.exec(url);
  if (!match) return null;

  const profileId = Number(match[1]);
  return Number.isNaN(profileId) ? null : profileId;
}

const aoe2CompanionHostname = "aoe2companion.com";
const aoe2CompanionProfilePath = /^\/players\/(\d{1,10})\/?$/;
const aoe2CompanionProfileMaxDigits = 10;

/**
 * Strictly parses an AoE2Companion profile URL.
 * @returns The numeric profile ID, or null when the URL is not a valid profile URL.
 */
export function parseCompanionProfileUrl(url: string): number | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    try {
      parsed = new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }

  const host = parsed.hostname.replace(/^www\./, "");
  if (host !== aoe2CompanionHostname) return null;

  const match = aoe2CompanionProfilePath.exec(parsed.pathname);
  if (!match) return null;

  const id = match[1]!;
  if (id.length > aoe2CompanionProfileMaxDigits) return null;

  return Number(id);
}
