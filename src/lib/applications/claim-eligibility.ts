import type { ApplicationClaimStatus } from "@/generated/prisma";

export function isApplicationClaimable(application: {
  ownerId: string | null;
  deletedAt: Date | null;
}): boolean {
  if (application.deletedAt) return false;
  return application.ownerId === null;
}

export function userHasBlockingClaim(
  claims: { status: ApplicationClaimStatus }[],
): boolean {
  return claims.some((c) => c.status === "PENDING");
}

export function canUserSubmitClaim(params: {
  application: { ownerId: string | null; deletedAt: Date | null };
  userId: string;
  userClaims: { status: ApplicationClaimStatus }[];
}): { ok: true } | { ok: false; reason: string } {
  if (!isApplicationClaimable(params.application)) {
    return { ok: false, reason: "This listing already has a verified maintainer." };
  }
  if (params.application.ownerId === params.userId) {
    return { ok: false, reason: "You already maintain this listing." };
  }
  if (userHasBlockingClaim(params.userClaims)) {
    return {
      ok: false,
      reason: "You already have a pending claim for this app.",
    };
  }
  return { ok: true };
}
