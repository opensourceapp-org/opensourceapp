import { describe, expect, it } from "vitest";
import {
  assertSubmissionTransition,
  canTransitionSubmission,
} from "./submission-status";

describe("submission status machine", () => {
  it("allows draft to submitted", () => {
    expect(canTransitionSubmission("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("blocks approved to submitted", () => {
    expect(canTransitionSubmission("APPROVED", "SUBMITTED")).toBe(false);
  });

  it("throws on invalid transition", () => {
    expect(() =>
      assertSubmissionTransition("REJECTED", "APPROVED"),
    ).toThrow(/Invalid submission transition/);
  });
});
