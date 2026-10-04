import { describe, expect, it } from "vitest";
import { ossChecksFromMetadata } from "./repository-oss-checks";
import type { RepoMetadata } from "./repo-metadata";

const baseMeta: RepoMetadata = {
  name: "x",
  description: null,
  homepageUrl: null,
  defaultBranch: "main",
  stars: 1,
  forks: 0,
  primaryLanguage: "TS",
  lastCommitAt: null,
  host: "github",
  licenseSpdxId: "MIT",
  licenseKey: "mit",
  licenseName: "MIT",
  raw: { private: false, archived: false },
};

describe("ossChecksFromMetadata", () => {
  it("flags private repos", () => {
    const lines = ossChecksFromMetadata(
      { ...baseMeta, raw: { private: true, archived: false } },
      null,
    );
    expect(lines.find((l) => l.id === "public")?.status).toBe("fail");
  });

  it("warns on archived repos", () => {
    const lines = ossChecksFromMetadata(
      { ...baseMeta, raw: { private: false, archived: true } },
      null,
    );
    expect(lines.find((l) => l.id === "archived")?.status).toBe("warn");
  });
});
