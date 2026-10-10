import { describe, expect, it } from "vitest";
import {
  explicitLogoUrlFromRepoMetadata,
  logoUrlFromSanitizedSvg,
  resolvePublishedLogoUrl,
  submissionDisplayLogoUrl,
} from "./logo-url";

describe("logoUrlFromSanitizedSvg", () => {
  it("returns a data URL for small SVG", () => {
    const url = logoUrlFromSanitizedSvg('<svg xmlns="http://www.w3.org/2000/svg"/>');
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("returns null for empty input", () => {
    expect(logoUrlFromSanitizedSvg(null)).toBeNull();
  });
});

describe("resolvePublishedLogoUrl", () => {
  it("prefers verification SVG over metadata URLs", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const url = resolvePublishedLogoUrl({
      logoSvgSanitized: svg,
      repoMetadataJson: {
        logoUrl: "https://example.com/a.png",
        suggestedLogoUrl: "https://example.com/b.png",
      },
    });
    expect(url).toBe(logoUrlFromSanitizedSvg(svg));
  });

  it("uses explicit logoUrl before suggestedLogoUrl", () => {
    const url = resolvePublishedLogoUrl({
      repoMetadataJson: {
        logoUrl: "https://example.com/a.png",
        suggestedLogoUrl: "https://example.com/b.png",
      },
    });
    expect(url).toBe("https://example.com/a.png");
  });

  it("falls back to suggestedLogoUrl", () => {
    const url = submissionDisplayLogoUrl({
      suggestedLogoUrl: "https://example.com/b.png",
    });
    expect(url).toBe("https://example.com/b.png");
  });
});

describe("explicitLogoUrlFromRepoMetadata", () => {
  it("ignores blank strings", () => {
    expect(explicitLogoUrlFromRepoMetadata({ logoUrl: "  " })).toBeNull();
  });
});
