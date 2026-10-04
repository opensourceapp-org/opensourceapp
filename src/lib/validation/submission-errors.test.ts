import { describe, expect, it } from "vitest";
import { submissionFormSchema } from "./submission";
import {
  isSubmissionFieldErrors,
  submissionErrorStep,
  submissionFieldErrorSummary,
  submissionFieldErrorsFromZod,
} from "./submission-errors";

describe("submission field errors", () => {
  it("maps zod issues to field keys", () => {
    const result = submissionFormSchema.safeParse({
      name: "x",
      description: "short",
      repositoryUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = submissionFieldErrorsFromZod(result.error);
      expect(fieldErrors.name?.[0]).toMatch(/2 characters/);
      expect(fieldErrors.description?.[0]).toMatch(/20 characters/);
      expect(fieldErrors.repositoryUrl?.[0]).toMatch(/valid repository URL/i);
    }
  });

  it("builds a human-readable summary", () => {
    const result = submissionFormSchema.safeParse({
      name: "Valid Name",
      description: "short",
      repositoryUrl: "https://github.com/a/b",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const summary = submissionFieldErrorSummary(
        submissionFieldErrorsFromZod(result.error),
      );
      expect(summary).toEqual([
        "Description: Description must be at least 20 characters",
      ]);
    }
  });

  it("detects field error objects", () => {
    expect(isSubmissionFieldErrors({ name: ["too short"] })).toBe(true);
    expect(isSubmissionFieldErrors("Unauthorized")).toBe(false);
  });

  it("picks wizard step from invalid fields", () => {
    expect(submissionErrorStep({ repositoryUrl: ["bad"] })).toBe(0);
    expect(submissionErrorStep({ description: ["short"] })).toBe(0);
    expect(submissionErrorStep({ categoryIds: ["required"] })).toBe(1);
    expect(submissionErrorStep({ ownershipVerified: ["required"] })).toBe(2);
    expect(submissionErrorStep({})).toBe(3);
  });
});
