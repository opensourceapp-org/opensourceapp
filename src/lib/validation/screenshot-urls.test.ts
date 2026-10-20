import { describe, expect, it } from "vitest";
import {
  filterScreenshotFilenames,
  mergeScreenshotUrls,
  normalizeScreenshotUrlList,
  screenshotUrlSchema,
} from "./screenshot-urls";

describe("screenshotUrlSchema", () => {
  it("requires https", () => {
    expect(screenshotUrlSchema.safeParse("http://example.com/a.png").success).toBe(
      false,
    );
    expect(
      screenshotUrlSchema.safeParse("https://example.com/a.png").success,
    ).toBe(true);
  });
});

describe("normalizeScreenshotUrlList", () => {
  it("dedupes and caps count", () => {
    const urls = Array.from({ length: 12 }, (_, i) => `https://example.com/${i}.png`);
    urls.push(urls[0]);
    const normalized = normalizeScreenshotUrlList(urls);
    expect(normalized).toHaveLength(10);
    expect(normalized[0]).toBe("https://example.com/0.png");
  });
});

describe("mergeScreenshotUrls", () => {
  it("prefers primary order then appends secondary", () => {
    const merged = mergeScreenshotUrls(
      ["https://a.test/1.png"],
      ["https://b.test/2.png", "https://a.test/1.png"],
    );
    expect(merged).toEqual([
      "https://a.test/1.png",
      "https://b.test/2.png",
    ]);
  });
});

describe("filterScreenshotFilenames", () => {
  it("sorts numeric filenames and skips non-images", () => {
    expect(
      filterScreenshotFilenames(["b.png", "10.jpg", "readme.md", "2.webp"]),
    ).toEqual(["2.webp", "10.jpg", "b.png"]);
  });
});
