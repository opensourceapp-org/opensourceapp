import { describe, expect, it } from "vitest";
import { moderateSubmissionSchema } from "./moderation";

describe("moderateSubmissionSchema", () => {
  it("requires a message when requesting changes", () => {
    const result = moderateSubmissionSchema.safeParse({
      submissionId: "sub_1",
      nextStatus: "CHANGES_REQUESTED",
    });
    expect(result.success).toBe(false);
  });

  it("accepts approve without a message", () => {
    const result = moderateSubmissionSchema.safeParse({
      submissionId: "sub_1",
      nextStatus: "APPROVED",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a long enough rejection message", () => {
    const result = moderateSubmissionSchema.safeParse({
      submissionId: "sub_1",
      nextStatus: "REJECTED",
      reviewerNotes: "Please add a license file and link your official homepage.",
    });
    expect(result.success).toBe(true);
  });
});
