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
  SCREENSHOTS_DIR_PATH,
  VERIFICATION_FILE_PATH,
} from "@/lib/applications/repository-verification/providers";
import { sanitizeAppSvg } from "@/lib/applications/repository-verification/svg";
import { logoUrlFromSanitizedSvg } from "@/lib/applications/logo-url";
import { fetchRepositoryMetadata } from "@/lib/applications/repo-metadata";
import { ossChecksFromMetadata } from "@/lib/applications/repository-oss-checks";
import { ApplicationClaimStatus } from "@/generated/prisma";

async function assertOwnedPendingClaim(claimId: string, userId: string) {
  const claim = await prisma.applicationClaim.findFirst({
    where: {
      id: claimId,
      userId,
      status: ApplicationClaimStatus.PENDING,
    },
    include: {
      application: { select: { repositoryUrl: true } },
    },
  });
  return claim;
}

export async function getClaimVerificationStateAction(claimId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const claim = await prisma.applicationClaim.findFirst({
    where: { id: claimId, userId: session.user.id },
    include: {
      application: { select: { repositoryUrl: true } },
    },
  });
  if (!claim) {
    return { error: "Not found" as const };
  }

  const iconPreviewUrl = logoUrlFromSanitizedSvg(claim.logoSvgSanitized);

  let metadata = null;
  try {
    metadata = await fetchRepositoryMetadata(claim.application.repositoryUrl);
  } catch {
    metadata = null;
  }

  const ossChecks = ossChecksFromMetadata(metadata, null);

  return {
    data: {
      ownershipVerified: Boolean(claim.verifiedAt),
      ossChecks,
      verificationPath: VERIFICATION_FILE_PATH,
      logoPath: APP_SVG_PATH,
      screenshotsPath: SCREENSHOTS_DIR_PATH,
      repositoryUrl: claim.application.repositoryUrl,
      iconPreviewUrl,
      lastCheckedAt: claim.lastCheckedAt,
      status: claim.status,
    },
  };
}

export async function ensureClaimVerificationTokenAction(claimId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const claim = await assertOwnedPendingClaim(claimId, session.user.id);
  if (!claim) {
    return { error: "Not found" as const };
  }

  if (claim.verifiedAt) {
    return { data: { alreadyVerified: true as const, token: null } };
  }

  if (claim.tokenHash) {
    return {
      data: {
        alreadyVerified: false as const,
        token: null,
        hint: "Use the token shown when you started verification, or regenerate.",
      },
    };
  }

  const plaintext = generateVerificationTokenPlaintext();
  const tokenHash = hashVerificationToken(plaintext);

  await prisma.applicationClaim.update({
    where: { id: claimId },
    data: { tokenHash },
  });

  return {
    data: {
      alreadyVerified: false as const,
      token: plaintext,
    },
  };
}

export async function regenerateClaimVerificationTokenAction(claimId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const rl = rateLimit(`claim-verify-regen:${session.user.id}`, 5, 60_000);
  if (!rl.ok) {
    return { error: "Rate limit exceeded. Try again shortly." };
  }

  const claim = await assertOwnedPendingClaim(claimId, session.user.id);
  if (!claim) {
    return { error: "Not found" as const };
  }

  if (claim.verifiedAt) {
    return { error: "Already verified" };
  }

  const plaintext = generateVerificationTokenPlaintext();
  const tokenHash = hashVerificationToken(plaintext);

  await prisma.applicationClaim.update({
    where: { id: claimId },
    data: {
      tokenHash,
      verifiedAt: null,
      logoSvgSanitized: null,
      lastCheckedAt: null,
    },
  });

  return { data: { token: plaintext } };
}

export async function verifyClaimRepositoryOwnershipAction(claimId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const rl = rateLimit(`claim-verify-check:${session.user.id}`, 10, 60_000);
  if (!rl.ok) {
    return { error: "Rate limit exceeded. Try again shortly." };
  }

  const claim = await assertOwnedPendingClaim(claimId, session.user.id);
  if (!claim) {
    return { error: "Not found" as const };
  }

  if (!claim.tokenHash) {
    return { error: "Generate a verification token first" };
  }

  const provider = resolveVerificationProvider(claim.application.repositoryUrl);
  if (!provider) {
    return { error: "Unsupported repository host for verification" };
  }

  const fileResult = await provider.fetchTextFile(
    claim.application.repositoryUrl,
    VERIFICATION_FILE_PATH,
  );

  const now = new Date();
  if (!fileResult.ok) {
    await prisma.applicationClaim.update({
      where: { id: claimId },
      data: { lastCheckedAt: now },
    });
    return { error: fileResult.reason };
  }

  const fileToken = fileResult.content.trim();
  if (!verificationTokenMatches(fileToken, claim.tokenHash)) {
    await prisma.applicationClaim.update({
      where: { id: claimId },
      data: { lastCheckedAt: now },
    });
    return {
      error:
        "Verification file found but token does not match. Ensure the file contains only your token.",
    };
  }

  let logoSvgSanitized: string | null = claim.logoSvgSanitized;
  const svgResult = await provider.fetchTextFile(
    claim.application.repositoryUrl,
    APP_SVG_PATH,
  );
  if (svgResult.ok) {
    logoSvgSanitized = sanitizeAppSvg(svgResult.content);
  }

  await prisma.applicationClaim.update({
    where: { id: claimId },
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
