import { z } from "zod";

const moderationTargetStatus = z.enum([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);

export const moderationMessageSchema = z
  .string()
  .trim()
  .min(10, "Please enter at least 10 characters so the submitter knows what to fix")
  .max(4000, "Message must be at most 4,000 characters");

export const moderateSubmissionSchema = z
  .object({
    submissionId: z.string().min(1),
    nextStatus: moderationTargetStatus,
    reviewerNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const needsMessage =
      data.nextStatus === "CHANGES_REQUESTED" ||
      data.nextStatus === "REJECTED";
    if (!needsMessage) return;
    const parsed = moderationMessageSchema.safeParse(data.reviewerNotes ?? "");
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: parsed.error.issues[0]?.message ?? "Message is required",
        path: ["reviewerNotes"],
      });
    }
  });
