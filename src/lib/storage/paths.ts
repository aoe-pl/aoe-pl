/**
 * Helpers for building and sanitizing bucket object paths.
 *
 * The bucket emulates folders using key prefixes, e.g.
 *   tournaments/<tournamentName>/games/<matchNumber>/Player1_Player2_Map_game_1.aoe2record
 *   tournaments/<tournamentName>/images/logo.png
 */

const SEGMENT_SANITIZE_REGEX = /[^a-zA-Z0-9._-]/g;

/** Sanitize a single path segment (must not contain a slash). */
function sanitizeSegment(segment: string): string {
  return segment.trim().replace(SEGMENT_SANITIZE_REGEX, "_");
}

/**
 * Sanitize a folder prefix.
 */
export function sanitizePathPrefix(prefix: string): string {
  return prefix
    .split("/")
    .map((segment) => segment.trim())
    .filter(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    )
    .map(sanitizeSegment)
    .join("/");
}

/** Sanitize a file name (preserves dots/extensions). */
export function sanitizeFileName(fileName: string): string {
  return sanitizeSegment(fileName);
}

/**
 * Build a sanitized storage path from one or more parts.
 * Empty parts are ignored.
 */
export function buildStoragePath(...parts: (string | undefined)[]): string {
  return sanitizePathPrefix(parts.filter(Boolean).join("/"));
}

/**
 * Build the final object key for a file inside the bucket.
 */
export function buildObjectKey(path: string, fileName: string): string {
  const prefix = sanitizePathPrefix(path);
  const name = sanitizeFileName(fileName);
  return prefix ? `${prefix}/${name}` : name;
}

/**
 * Standard path prefixes used across the project. Prefer these over
 * hand-written strings so the folder structure stays consistent.
 */
export const storagePaths = {
  /** Root for everything tournament related. */
  tournaments: () => "tournaments",

  /** tournaments/<tournamentName> */
  tournament: (tournamentName: string) =>
    buildStoragePath("tournaments", tournamentName),

  /** tournaments/<tournamentName>/images */
  tournamentImages: (tournamentName: string) =>
    buildStoragePath("tournaments", tournamentName, "images"),

  /** tournaments/<tournamentName>/banners */
  tournamentBanners: (tournamentName: string) =>
    buildStoragePath("tournaments", tournamentName, "banners"),

  /** tournaments/<tournamentName>/games/<matchNumber> */
  tournamentMatchGames: (tournamentName: string, matchNumber: string) =>
    buildStoragePath("tournaments", tournamentName, "games", matchNumber),
} as const;
