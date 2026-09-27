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

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) return { error: "Not found" };

  try {
    assertSubmissionTransition(
      submission.status as SubmissionStatusType,
      nextStatus as SubmissionStatusType,
    );
  } catch (e) {
    return { error: (e as Error).message };
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: nextStatus,
      reviewerNotes: reviewerNotes ?? submission.reviewerNotes,
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
    metadata: { from: submission.status, to: nextStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/apps");
  return { ok: true };
}
