"use server";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  assertSubmissionTransition,
  moderatorTransitions,
  type SubmissionStatus as SubmissionStatusType,
} from "@/lib/applications/submission-status";
import { publishSubmissionAsApplication } from "@/server/applications/publish";
import { writeAuditLog } from "@/server/audit";
import { parseModeratorFeedback } from "@/lib/validation/moderation";
import { SubmissionStatus, UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

export async function moderateSubmissionAction(
  submissionId: string,
  nextStatus: SubmissionStatus,
  reviewerNotes?: string,
) {
  const session = await requireRole(UserRole.MODERATOR);
  if (!moderatorTransitions.includes(nextStatus)) {
    return { error: "Invalid target status" };
  }

  const feedback = parseModeratorFeedback(
    nextStatus as SubmissionStatusType,
    reviewerNotes,
  );
  if (!feedback.ok) {
    return { error: feedback.error };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) return { error: "Not found" };

  if (submission.status === nextStatus) {
    return { ok: true };
  }

  try {
    assertSubmissionTransition(
      submission.status as SubmissionStatusType,
      nextStatus as SubmissionStatusType,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }

  const terminalReview =
    nextStatus === SubmissionStatus.APPROVED ||
    nextStatus === SubmissionStatus.REJECTED ||
    nextStatus === SubmissionStatus.CHANGES_REQUESTED;

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: nextStatus,
      reviewerNotes:
        feedback.value ??
        (terminalReview ? null : submission.reviewerNotes),
      reviewedAt: terminalReview ? new Date() : submission.reviewedAt,
    },
  });

  if (nextStatus === SubmissionStatus.APPROVED) {
    await publishSubmissionAsApplication(submission);
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: `submission.${nextStatus.toLowerCase()}`,
    entityType: "Submission",
    entityId: submissionId,
    metadata: {
      from: submission.status,
      to: nextStatus,
      ...(feedback.value
        ? { messageSnippet: feedback.value.slice(0, 120) }
        : {}),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/apps");
  return { ok: true };
}
