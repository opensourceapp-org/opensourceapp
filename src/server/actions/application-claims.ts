"use server";

import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth/session";
import { canUserSubmitClaim } from "@/lib/applications/claim-eligibility";
import { publishedApplicationWhere } from "@/lib/applications/visibility";
import { prisma } from "@/lib/db";
import { parseSubmitApplicationClaim } from "@/lib/validation/application-claim";
import { ApplicationClaimStatus, UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/server/audit";
import { approveApplicationClaim } from "@/server/applications/approve-claim";
import {
  generateVerificationTokenPlaintext,
  hashVerificationToken,
} from "@/lib/applications/repository-verification/token";

export async function ensureApplicationClaimAction(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to claim this app." };
  }

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      ...publishedApplicationWhere(),
    },
    select: { id: true, slug: true, ownerId: true, deletedAt: true },
  });
  if (!application) {
    return { error: "Application not found" };
  }

  const userClaims = await prisma.applicationClaim.findMany({
    where: {
      applicationId: application.id,
      userId: session.user.id,
    },
    select: { id: true, status: true },
  });

  const pending = userClaims.find(
    (c) => c.status === ApplicationClaimStatus.PENDING,
  );
  if (pending) {
    return { ok: true as const, claimId: pending.id, token: null };
  }

  const eligibility = canUserSubmitClaim({
    application,
    userId: session.user.id,
    userClaims: userClaims.map((c) => ({ status: c.status })),
  });
  if (!eligibility.ok) {
    return { error: eligibility.reason };
  }

  const plaintext = generateVerificationTokenPlaintext();
  const tokenHash = hashVerificationToken(plaintext);

  const claim = await prisma.applicationClaim.create({
    data: {
      applicationId: application.id,
      userId: session.user.id,
      status: ApplicationClaimStatus.PENDING,
      tokenHash,
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "application_claim.started",
    entityType: "ApplicationClaim",
    entityId: claim.id,
    metadata: {
      applicationId: application.id,
      applicationSlug: application.slug,
    },
  });

  revalidatePath(`/apps/${application.slug}/claim`);
  revalidatePath("/dashboard");

  return {
    ok: true as const,
    claimId: claim.id,
    token: plaintext,
  };
}

export async function updateApplicationClaimEvidenceAction(input: {
  claimId: string;
  evidenceMessage?: string;
  evidenceUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to claim this app." };
  }

  const parsed = parseSubmitApplicationClaim({
    applicationId: "placeholder",
    evidenceMessage: input.evidenceMessage,
    evidenceUrl: input.evidenceUrl,
  });
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const claim = await prisma.applicationClaim.findFirst({
    where: {
      id: input.claimId,
      userId: session.user.id,
      status: ApplicationClaimStatus.PENDING,
    },
  });
  if (!claim) {
    return { error: "Claim not found" };
  }

  await prisma.applicationClaim.update({
    where: { id: claim.id },
    data: {
      evidenceMessage: parsed.value.evidenceMessage,
      evidenceUrl: parsed.value.evidenceUrl,
    },
  });

  return { ok: true as const };
}

/** @deprecated Use ensureApplicationClaimAction + repository verification */
export async function submitApplicationClaimAction(input: {
  applicationId: string;
  evidenceMessage?: string;
  evidenceUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to claim this app." };
  }

  const parsed = parseSubmitApplicationClaim(input);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const application = await prisma.application.findFirst({
    where: {
      id: parsed.value.applicationId,
      ...publishedApplicationWhere(),
    },
    select: { id: true, slug: true, ownerId: true, deletedAt: true },
  });
  if (!application) {
    return { error: "Application not found" };
  }

  const userClaims = await prisma.applicationClaim.findMany({
    where: {
      applicationId: application.id,
      userId: session.user.id,
    },
    select: { status: true },
  });

  const eligibility = canUserSubmitClaim({
    application,
    userId: session.user.id,
    userClaims,
  });
  if (!eligibility.ok) {
    return { error: eligibility.reason };
  }

  const plaintext = generateVerificationTokenPlaintext();
  const tokenHash = hashVerificationToken(plaintext);

  const claim = await prisma.applicationClaim.create({
    data: {
      applicationId: application.id,
      userId: session.user.id,
      status: ApplicationClaimStatus.PENDING,
      evidenceMessage: parsed.value.evidenceMessage,
      evidenceUrl: parsed.value.evidenceUrl,
      tokenHash,
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "application_claim.submitted",
    entityType: "ApplicationClaim",
    entityId: claim.id,
    metadata: {
      applicationId: application.id,
      applicationSlug: application.slug,
    },
  });

  revalidatePath(`/apps/${application.slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/claims");

  return { ok: true as const, claimId: claim.id };
}

export async function moderateApplicationClaimAction(
  claimId: string,
  nextStatus: ApplicationClaimStatus,
  reviewerNotes?: string,
) {
  const session = await requireRole(UserRole.MODERATOR);
  if (
    nextStatus !== ApplicationClaimStatus.APPROVED &&
    nextStatus !== ApplicationClaimStatus.REJECTED
  ) {
    return { error: "Invalid target status" };
  }

  const claim = await prisma.applicationClaim.findUnique({
    where: { id: claimId },
    include: {
      application: { select: { slug: true, name: true, ownerId: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!claim || claim.status !== ApplicationClaimStatus.PENDING) {
    return { error: "Claim not found or already reviewed" };
  }

  if (nextStatus === ApplicationClaimStatus.REJECTED) {
    const notes = reviewerNotes?.trim();
    if (!notes) {
      return { error: "Add a short note when rejecting a claim." };
    }
    await prisma.applicationClaim.update({
      where: { id: claimId },
      data: {
        status: ApplicationClaimStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        reviewerNotes: notes,
      },
    });
  } else {
    try {
      await approveApplicationClaim(claim, session.user.id, reviewerNotes);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: `application_claim.${nextStatus.toLowerCase()}`,
    entityType: "ApplicationClaim",
    entityId: claimId,
    metadata: {
      applicationId: claim.applicationId,
      applicationSlug: claim.application.slug,
      applicationName: claim.application.name,
      claimantEmail: claim.user.email,
      claimantName: claim.user.name,
      ...(reviewerNotes?.trim()
        ? { messageSnippet: reviewerNotes.trim().slice(0, 120) }
        : {}),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/claims");
  revalidatePath("/dashboard");
  revalidatePath(`/apps/${claim.application.slug}`);
  revalidatePath("/apps");

  return { ok: true as const };
}
