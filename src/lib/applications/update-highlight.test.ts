import { describe, expect, it } from "vitest";
import { getUpdateHighlight } from "./update-highlight";

describe("getUpdateHighlight", () => {
  const base = {
    name: "Demo",
    slug: "demo",
    updatedAt: new Date("2026-01-01"),
  };

  it("prefers release over commit activity", () => {
    const h = getUpdateHighlight({
      ...base,
      latestReleaseTag: "v2.0.0",
      latestReleaseAt: new Date("2026-09-28"),
      lastCommitAt: new Date("2026-09-20"),
    });
    expect(h.reason).toContain("v2.0.0");
  });

  it("uses repository activity when no release", () => {
    const h = getUpdateHighlight({
      ...base,
      lastCommitAt: new Date(Date.now() - 3 * 86400000),
    });
    expect(h.reason).toBe("Repository activity detected");
  });
});
