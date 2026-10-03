import { z } from "zod";
import type { SubmissionStatus } from "@/lib/applications/submission-status";

export const MODERATOR_FEEDBACK_MIN = 10;
export const MODERATOR_FEEDBACK_MAX = 2000;

const statusesRequiringFeedback: SubmissionStatus[] = [
  "CHANGES_REQUESTED",
  "REJECTED",
];

export const moderatorFeedbackSchema = z
  .string()
  .trim()
  .min(
    MODERATOR_FEEDBACK_MIN,
    `Feedback must be at least ${MODERATOR_FEEDBACK_MIN} characters`,
  )
  .max(
    MODERATOR_FEEDBACK_MAX,
    `Feedback must be at most ${MODERATOR_FEEDBACK_MAX} characters`,
  );

export function requiresModeratorFeedback(status: SubmissionStatus): boolean {
  return statusesRequiringFeedback.includes(status);
}

export function parseModeratorFeedback(
  status: SubmissionStatus,
  reviewerNotes: string | undefined,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (!requiresModeratorFeedback(status)) {
    const trimmed = reviewerNotes?.trim();
    return { ok: true, value: trimmed ? trimmed : null };
  }
  const parsed = moderatorFeedbackSchema.safeParse(reviewerNotes ?? "");
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid feedback",
    };
  }
  return { ok: true, value: parsed.data };
}
