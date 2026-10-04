/**
 * Canonical form for duplicate repository detection and claims.
 */
export function normalizeRepositoryUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return url.trim().toLowerCase();
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  let path = parsed.pathname.replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const last = segments[segments.length - 1].replace(/\.git$/i, "");
    path = `/${segments[0]}/${last}`;
  }
  return `${parsed.protocol}//${host}${path}`.toLowerCase();
}
