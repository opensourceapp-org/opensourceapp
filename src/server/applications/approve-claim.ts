import { logoUrlFromSanitizedSvg } from "@/lib/applications/logo-url";
import { prisma } from "@/lib/db";
import type { ApplicationClaim } from "@/generated/prisma";

export async function approveApplicationClaim(
  claim: ApplicationClaim,
  reviewerId: string,
  reviewerNotes?: string | null,
) {
  await prisma.$transaction(async (tx) => {
    const application = await tx.application.findUnique({
      where: { id: claim.applicationId },
    });
    if (!application) {
      throw new Error("Application not found");
    }
    if (application.ownerId) {
      throw new Error("Application already has an owner");
    }

    const publishedLogoUrl = logoUrlFromSanitizedSvg(claim.logoSvgSanitized);

    await tx.application.update({
      where: { id: claim.applicationId },
      data: {
        ownerId: claim.userId,
        ...(publishedLogoUrl && publishedLogoUrl !== application.logoUrl
          ? { logoUrl: publishedLogoUrl }
          : {}),
      },
    });

    if (claim.verifiedAt) {
      await tx.verificationSignal.deleteMany({
        where: {
          applicationId: claim.applicationId,
          type: "REPOSITORY_OWNERSHIP",
        },
      });
      await tx.verificationSignal.create({
        data: {
          applicationId: claim.applicationId,
          type: "REPOSITORY_OWNERSHIP",
          status: "ACTIVE",
          summary:
            "Repository ownership verified via .opensourceapp/verification (claim)",
          recordedById: claim.userId,
        },
      });
    }

    await tx.verificationSignal.deleteMany({
      where: {
        applicationId: claim.applicationId,
        type: { in: ["MAINTAINER", "MAINTAINER_ATTESTED"] },
      },
    });
    await tx.verificationSignal.create({
      data: {
        applicationId: claim.applicationId,
        type: "MAINTAINER",
        status: "ACTIVE",
        summary: "Maintainer claim approved",
        recordedById: reviewerId,
      },
    });

    await tx.applicationClaim.update({
      where: { id: claim.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewerNotes: reviewerNotes ?? null,
      },
    });

    await tx.applicationClaim.updateMany({
      where: {
        applicationId: claim.applicationId,
        status: "PENDING",
        id: { not: claim.id },
      },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
        reviewerNotes:
          "Another maintainer claim was approved for this listing.",
      },
    });
  });
}
