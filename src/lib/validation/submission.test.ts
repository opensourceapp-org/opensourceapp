import { describe, expect, it } from "vitest";
import { repositoryUrlSchema, submissionFormSchema } from "./submission";

describe("submission validation", () => {
  it("accepts github urls", () => {
    expect(
      repositoryUrlSchema.safeParse("https://github.com/org/repo").success,
    ).toBe(true);
  });

  it("rejects non-git hosts", () => {
    expect(
      repositoryUrlSchema.safeParse("https://example.com/repo").success,
    ).toBe(false);
  });

  it("requires minimum description length", () => {
    const result = submissionFormSchema.safeParse({
      name: "Test",
      description: "too short",
      repositoryUrl: "https://github.com/a/b",
    });
    expect(result.success).toBe(false);
  });
});
