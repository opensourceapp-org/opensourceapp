import { describe, expect, it } from "vitest";
import { parseVideoEmbed } from "@/lib/validation/video-url";

describe("parseVideoEmbed", () => {
  it("parses YouTube watch URLs", () => {
    const info = parseVideoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(info?.kind).toBe("youtube");
    if (info?.kind === "youtube") {
      expect(info.embedUrl).toContain("dQw4w9WgXcQ");
    }
  });

  it("parses youtu.be links", () => {
    const info = parseVideoEmbed("https://youtu.be/abc123XYZ");
    expect(info?.kind).toBe("youtube");
  });

  it("parses Vimeo URLs", () => {
    const info = parseVideoEmbed("https://vimeo.com/123456789");
    expect(info?.kind).toBe("vimeo");
    if (info?.kind === "vimeo") {
      expect(info.embedUrl).toContain("123456789");
    }
  });

  it("falls back to external link for other https URLs", () => {
    const info = parseVideoEmbed("https://example.com/demo.mp4");
    expect(info).toEqual({
      kind: "link",
      watchUrl: "https://example.com/demo.mp4",
    });
  });
});
