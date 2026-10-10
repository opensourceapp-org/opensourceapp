const PRODUCTION_SITE_URL = "https://opensourceapp.org";

/** Canonical public site origin for metadata, sitemap, and JSON-LD. */
export function getSiteUrl(): string {
  const fromEnv = process.env.AUTH_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }
  return "http://localhost:3000";
}

export const SITE_NAME = "OpenSourceApp";
export const SITE_NAME_FULL = "OpenSourceApp.org";

export const SITE_DEFAULT_DESCRIPTION =
  "OpenSourceApp is a curated directory for discovering trustworthy open-source applications — with licensing, platforms, and verification signals.";
