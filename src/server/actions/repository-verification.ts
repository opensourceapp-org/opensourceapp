"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  generateVerificationTokenPlaintext,
  hashVerificationToken,
  verificationTokenMatches,
} from "@/lib/applications/repository-verification/token";
import {
  APP_SVG_PATH,
  resolveVerificationProvider,
  VERIFICATION_FILE_PATH,
} from "@/lib/applications/repository-verification/providers";
import { sanitizeAppSvg } from "@/lib/applications/repository-verification/svg";
import { logoUrlFromSanitizedSvg } from "@/lib/applications/logo-url";
import { fetchRepositoryMetadata } from "@/lib/applications/repo-metadata";
import { ossChecksFromMetadata } from "@/lib/applications/repository-oss-checks";
import { SubmissionStatus } from "@/generated/prisma";

async function assertOwnedDraft(submissionId: string, userId: string) {
  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      userId,
      status: {
        in: [
          SubmissionStatus.DRAFT,
          SubmissionStatus.CHANGES_REQUESTED,
        ],
      },
    },
    include: { repositoryVerification: true },
  });
  if (!submission) return null;
  return submission;
}

export async function getRepositoryVerificationStateAction(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: session.user.id },
    include: { repositoryVerification: true },
  });
  if (!submission) {
    return { error: "Not found" as const };
  }

  let metadata = null;
  try {
    metadata = await fetchRepositoryMetadata(submission.repositoryUrl);
  } catch {
    metadata = null;
  }

  const ossChecks = ossChecksFromMetadata(
    metadata,
    submission.repoMetadataJson,
  );

  const ownershipVerified = Boolean(
    submission.repositoryVerification?.verifiedAt,
  );

  const iconPreviewUrl = logoUrlFromSanitizedSvg(
    submission.repositoryVerification?.logoSvgSanitized,
  );

  return {
    data: {
      ownershipVerified,
      ossChecks,
      verificationPath: VERIFICATION_FILE_PATH,
      logoPath: APP_SVG_PATH,
      iconPreviewUrl,
      lastCheckedAt: submission.repositoryVerification?.lastCheckedAt ?? null,
    },
  };
}

export async function ensureVerificationTokenAction(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const submission = await assertOwnedDraft(submissionId, session.user.id);
  if (!submission) {
    return { error: "Not found" as const };
  }

  if (submission.repositoryVerification?.verifiedAt) {
    return { data: { alreadyVerified: true as const, token: null } };
  }

  const existing = submission.repositoryVerification;
  if (existing) {
    return {
      data: {
        alreadyVerified: false as const,
        tokenRegenerated: false as const,
        // Token is only shown once at creation — regenerate if missing verified state
        token: null,
        hint: "Use the verification token shown when you first opened this step. Regenerate if needed.",
      },
    };
  }

  const plaintext = generateVerificationTokenPlaintext();
  const tokenHash = hashVerificationToken(plaintext);

  await prisma.repositoryVerification.create({
    data: {
      submissionId,
      userId: session.user.id,
      tokenHash,
    },
  });

  return {
    data: {
      alreadyVerified: false as const,
      tokenRegenerated: false as const,
      token: plaintext,
    },
  };
}

export async function regenerateVerificationTokenAction(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const rl = rateLimit(`verify-regen:${session.user.id}`, 5, 60_000);
  if (!rl.ok) {
    return { error: "Rate limit exceeded. Try again shortly." };
  }

  const submission = await assertOwnedDraft(submissionId, session.user.id);
  if (!submission) {
    return { error: "Not found" as const };
  }

  if (submission.repositoryVerification?.verifiedAt) {
    return { error: "Already verified" };
  }

  const plaintext = generateVerificationTokenPlaintext();
  const tokenHash = hashVerificationToken(plaintext);

  await prisma.repositoryVerification.upsert({
    where: { submissionId },
    create: {
      submissionId,
      userId: session.user.id,
      tokenHash,
    },
    update: {
      tokenHash,
      verifiedAt: null,
      logoSvgSanitized: null,
      lastCheckedAt: null,
    },
  });

  return { data: { token: plaintext } };
}

export async function verifyRepositoryOwnershipAction(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const rl = rateLimit(`verify-check:${session.user.id}`, 10, 60_000);
  if (!rl.ok) {
    return { error: "Rate limit exceeded. Try again shortly." };
  }

  const submission = await assertOwnedDraft(submissionId, session.user.id);
  if (!submission) {
    return { error: "Not found" as const };
  }

  const record = submission.repositoryVerification;
  if (!record) {
    return { error: "Generate a verification token first" };
  }

  const provider = resolveVerificationProvider(submission.repositoryUrl);
  if (!provider) {
    return { error: "Unsupported repository host for verification" };
  }

  const fileResult = await provider.fetchTextFile(
    submission.repositoryUrl,
    VERIFICATION_FILE_PATH,
  );

  const now = new Date();
  if (!fileResult.ok) {
    await prisma.repositoryVerification.update({
      where: { submissionId },
      data: { lastCheckedAt: now },
    });
    return { error: fileResult.reason };
  }

  const fileToken = fileResult.content.trim();
  if (!verificationTokenMatches(fileToken, record.tokenHash)) {
    await prisma.repositoryVerification.update({
      where: { submissionId },
      data: { lastCheckedAt: now },
    });
    return {
      error:
        "Verification file found but token does not match. Ensure the file contains only your token.",
    };
  }

  let logoSvgSanitized: string | null = record.logoSvgSanitized;
  const svgResult = await provider.fetchTextFile(
    submission.repositoryUrl,
    APP_SVG_PATH,
  );
  if (svgResult.ok) {
    logoSvgSanitized = sanitizeAppSvg(svgResult.content);
  }

  await prisma.repositoryVerification.update({
    where: { submissionId },
    data: {
      verifiedAt: now,
      lastCheckedAt: now,
      logoSvgSanitized,
    },
  });

  const iconPreviewUrl = logoUrlFromSanitizedSvg(logoSvgSanitized);

  return {
    data: {
      verified: true as const,
      logoSaved: Boolean(logoSvgSanitized),
      iconPreviewUrl,
    },
  };
}
