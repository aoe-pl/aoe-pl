/**
 * Normalises a post-authentication redirect target.
 *
 * Only same-origin relative paths are allowed ("/tournaments/foo"), so a
 * crafted `?callbackUrl=https://evil.example` can't turn our sign-in flow into
 * an open redirect. Anything else falls back to the home page.
 */
export function safeRedirectPath(value?: string | null): string {
  if (!value) return "/";

  const isRelativePath =
    value.startsWith("/") &&
    // "//evil.example" and "/\evil.example" are protocol-relative URLs.
    !value.startsWith("//") &&
    !value.startsWith("/\\");

  return isRelativePath ? value : "/";
}
