import { describe, expect, it } from "vitest";
import {
  inferRepositoryHost,
  parseCommaSeparatedSlugs,
  parsePublishFlag,
} from "./parse-helpers";

describe("bulk import parse helpers", () => {
  it("parses comma-separated slugs", () => {
    expect(parseCommaSeparatedSlugs("web, linux,Docker")).toEqual([
      "web",
      "linux",
      "docker",
    ]);
  });

  it("defaults publish to true", () => {
    expect(parsePublishFlag("")).toBe(true);
    expect(parsePublishFlag(undefined)).toBe(true);
    expect(parsePublishFlag("yes")).toBe(true);
    expect(parsePublishFlag("false")).toBe(false);
  });

  it("infers repository host from URL", () => {
    expect(
      inferRepositoryHost("https://github.com/org/repo", ""),
    ).toBe("github");
    expect(
      inferRepositoryHost("https://gitlab.com/org/repo", ""),
    ).toBe("gitlab");
  });
});
