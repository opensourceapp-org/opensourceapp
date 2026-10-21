import {
  MAX_SCREENSHOTS,
  mergeScreenshotUrls,
  normalizeScreenshotUrlList,
  screenshotUrlSchema,
} from "@/lib/validation/screenshot-urls";
import { resolveVerificationProvider, SCREENSHOTS_DIR_PATH } from "./providers";

export {
  MAX_SCREENSHOTS,
  mergeScreenshotUrls,
  normalizeScreenshotUrlList,
  SCREENSHOTS_DIR_PATH,
};

export async function discoverRepoScreenshotUrls(
  repositoryUrl: string,
): Promise<string[]> {
  const provider = resolveVerificationProvider(repositoryUrl);
  if (!provider) return [];
  const fromDir = await provider.listScreenshotFiles(repositoryUrl);
  const validated = fromDir
    .map((url) => screenshotUrlSchema.safeParse(url))
    .filter((r) => r.success)
    .map((r) => r.data);
  return normalizeScreenshotUrlList(validated);
}

export const REPO_SCREENSHOT_ROOT = ".opensourceapp";
