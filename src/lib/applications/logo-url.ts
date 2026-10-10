export function logoUrlFromSanitizedSvg(
  svg: string | null | undefined,
): string | null {
  if (!svg) return null;
  if (Buffer.byteLength(svg, "utf8") > 32_000) return null;
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

function readMetadataString(
  json: unknown,
  key: "logoUrl" | "suggestedLogoUrl",
): string | null {
  if (!json || typeof json !== "object") return null;
  const value = (json as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function explicitLogoUrlFromRepoMetadata(json: unknown): string | null {
  return readMetadataString(json, "logoUrl");
}

export function suggestedLogoUrlFromRepoMetadata(json: unknown): string | null {
  return readMetadataString(json, "suggestedLogoUrl");
}

/** Logo URL for display on submissions (metadata only; verification SVG passed separately). */
export function submissionDisplayLogoUrl(
  repoMetadataJson: unknown,
  logoSvgSanitized?: string | null,
): string | null {
  return (
    logoUrlFromSanitizedSvg(logoSvgSanitized) ??
    explicitLogoUrlFromRepoMetadata(repoMetadataJson) ??
    suggestedLogoUrlFromRepoMetadata(repoMetadataJson)
  );
}

export function resolvePublishedLogoUrl(params: {
  logoSvgSanitized?: string | null;
  repoMetadataJson: unknown;
}): string | null {
  return submissionDisplayLogoUrl(
    params.repoMetadataJson,
    params.logoSvgSanitized,
  );
}

/** Metadata-only fallback (safe for client components). */
export function logoUrlFromSubmissionMetadata(json: unknown): string | null {
  return (
    explicitLogoUrlFromRepoMetadata(json) ??
    suggestedLogoUrlFromRepoMetadata(json)
  );
}
