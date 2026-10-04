/** Map GitHub/GitLab license identifiers to OpenSourceApp `License.slug` values. */
const SPDX_TO_SLUG: Record<string, string> = {
  MIT: "mit",
  "Apache-2.0": "apache-2",
  "GPL-3.0": "gpl-3",
  "GPL-3.0-only": "gpl-3",
  "GPL-3.0-or-later": "gpl-3",
  "BSD-3-Clause": "mit", // fallback until BSD seed exists; prefer DB match
};

const GITHUB_KEY_TO_SLUG: Record<string, string> = {
  mit: "mit",
  "apache-2.0": "apache-2",
  "gpl-3.0": "gpl-3",
};

export type DetectedLicense = {
  spdxId: string | null;
  key: string | null;
  name: string | null;
};

export function guessLicenseSlug(detected: DetectedLicense): string | null {
  if (detected.spdxId) {
    const exact = SPDX_TO_SLUG[detected.spdxId];
    if (exact) return exact;
    const upper = detected.spdxId.toUpperCase();
    if (SPDX_TO_SLUG[upper]) return SPDX_TO_SLUG[upper];
  }
  if (detected.key) {
    const fromKey = GITHUB_KEY_TO_SLUG[detected.key.toLowerCase()];
    if (fromKey) return fromKey;
  }
  if (detected.name?.toLowerCase().includes("mit")) return "mit";
  if (detected.name?.toLowerCase().includes("apache")) return "apache-2";
  if (detected.name?.toLowerCase().includes("gpl")) return "gpl-3";
  return null;
}

export async function resolveLicenseSlugFromCatalog(
  detected: DetectedLicense,
  licenses: { slug: string; spdxId: string | null; name: string }[],
): Promise<string | null> {
  if (detected.spdxId) {
    const bySpdx = licenses.find(
      (l) =>
        l.spdxId?.toLowerCase() === detected.spdxId?.toLowerCase(),
    );
    if (bySpdx) return bySpdx.slug;
  }
  const guessed = guessLicenseSlug(detected);
  if (guessed && licenses.some((l) => l.slug === guessed)) return guessed;
  if (detected.key) {
    const bySlug = licenses.find((l) => l.slug === detected.key?.toLowerCase());
    if (bySlug) return bySlug.slug;
  }
  return null;
}
