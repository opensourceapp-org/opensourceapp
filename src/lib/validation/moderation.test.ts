import { describe, expect, it } from "vitest";
import {
  MODERATOR_FEEDBACK_MIN,
  parseModeratorFeedback,
  requiresModeratorFeedback,
} from "./moderation";

describe("moderation feedback validation", () => {
  it("requires feedback for request changes and reject", () => {
    expect(requiresModeratorFeedback("CHANGES_REQUESTED")).toBe(true);
    expect(requiresModeratorFeedback("REJECTED")).toBe(true);
    expect(requiresModeratorFeedback("APPROVED")).toBe(false);
  });

  it("rejects empty feedback when requesting changes", () => {
    const result = parseModeratorFeedback("CHANGES_REQUESTED", "");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/at least/);
    }
  });

  it("rejects feedback shorter than minimum for reject", () => {
    const result = parseModeratorFeedback("REJECTED", "too short");
    expect(result.ok).toBe(false);
  });

  it("accepts valid feedback for request changes", () => {
    const message = "a".repeat(MODERATOR_FEEDBACK_MIN);
    const result = parseModeratorFeedback("CHANGES_REQUESTED", message);
    expect(result).toEqual({ ok: true, value: message });
  });

  it("allows approve without feedback", () => {
    const result = parseModeratorFeedback("APPROVED", undefined);
    expect(result).toEqual({ ok: true, value: null });
  });
});
