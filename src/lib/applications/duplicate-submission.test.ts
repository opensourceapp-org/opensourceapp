import { describe, expect, it } from "vitest";
import { normalizeRepositoryUrl } from "./normalize-repository-url";

describe("duplicate submission normalization", () => {
  it("treats equivalent URLs as duplicates", () => {
    const a = normalizeRepositoryUrl("https://github.com/foo/bar");
    const b = normalizeRepositoryUrl("https://www.github.com/foo/bar.git");
    expect(a).toBe(b);
  });
});
