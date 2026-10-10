export function parseCommaSeparatedSlugs(raw: unknown): string[] {
  if (raw === undefined || raw === null || raw === "") return [];
  const text = String(raw).trim();
  if (!text) return [];
  return [
    ...new Set(
      text
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

const TRUTHY = new Set(["true", "yes", "y", "1", "publish", "published"]);
const FALSY = new Set(["false", "no", "n", "0", "draft", "unpublished"]);

export function parsePublishFlag(raw: unknown): boolean {
  if (raw === undefined || raw === null || raw === "") return true;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  const normalized = String(raw).trim().toLowerCase();
  if (!normalized) return true;
  if (TRUTHY.has(normalized)) return true;
  if (FALSY.has(normalized)) return false;
  return true;
}

export function parseOptionalInt(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.trunc(raw));
  }
  const n = Number.parseInt(String(raw).trim(), 10);
  if (Number.isNaN(n)) return undefined;
  return Math.max(0, n);
}

export function parseOptionalDate(raw: unknown): Date | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  const parsed = new Date(String(raw).trim());
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function inferRepositoryHost(
  url: string,
  explicit?: string,
): "github" | "gitlab" | "unknown" {
  const fromExplicit = explicit?.trim().toLowerCase();
  if (fromExplicit === "github" || fromExplicit === "gitlab") {
    return fromExplicit;
  }
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "github.com") return "github";
    if (host === "gitlab.com") return "gitlab";
  } catch {
    /* ignore */
  }
  return "unknown";
}

export function normalizeHeader(cell: unknown): string {
  return String(cell ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}
