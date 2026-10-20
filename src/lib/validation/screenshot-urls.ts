import { z } from "zod";

export const MAX_SCREENSHOTS = 10;

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;

export const screenshotUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid image URL")
  .refine(
    (url) => {
      try {
        return new URL(url).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Screenshot URLs must use HTTPS" },
  );

export const screenshotUrlsSchema = z
  .array(screenshotUrlSchema)
  .max(
    MAX_SCREENSHOTS,
    `You can add at most ${MAX_SCREENSHOTS} screenshots`,
  );

export function normalizeScreenshotUrlList(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of urls) {
    const trimmed = raw.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= MAX_SCREENSHOTS) break;
  }
  return result;
}

export function mergeScreenshotUrls(
  primary: string[],
  secondary: string[],
): string[] {
  return normalizeScreenshotUrlList([...primary, ...secondary]);
}

export function isLikelyScreenshotFilename(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith(".")) return false;
  return IMAGE_EXT.test(lower);
}

export function sortScreenshotFilenames(names: string[]): string[] {
  return [...names].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );
}

export function filterScreenshotFilenames(names: string[]): string[] {
  return sortScreenshotFilenames(
    names.filter((name) => isLikelyScreenshotFilename(name)),
  );
}
