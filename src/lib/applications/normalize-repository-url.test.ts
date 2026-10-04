import { describe, expect, it } from "vitest";
import { normalizeRepositoryUrl } from "./normalize-repository-url";

describe("normalizeRepositoryUrl", () => {
  it("strips www, trailing slash, and .git", () => {
    expect(
      normalizeRepositoryUrl("https://www.github.com/org/repo.git/"),
    ).toBe("https://github.com/org/repo");
  });

  it("lowercases host and path", () => {
    expect(normalizeRepositoryUrl("HTTPS://GitHub.com/Org/Repo")).toBe(
      "https://github.com/org/repo",
    );
  });
});
