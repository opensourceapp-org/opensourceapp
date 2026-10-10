import { resolvePublishedLogoUrl } from "@/lib/applications/logo-url";
import { licenseSlugFromRepoMetadataJson } from "@/lib/applications/repo-metadata";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { Submission } from "@/generated/prisma";

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = "app";
  let candidate = slug;
  let i = 0;
  while (await prisma.application.findUnique({ where: { slug: candidate } })) {
    i += 1;
    candidate = `${slug}-${i}`;
  }
  return candidate;
}

export async function publishSubmissionAsApplication(submission: Submission) {
  const slug = await uniqueSlug(submission.name);

  const [submissionCategories, submissionAlternatives, verification] =
    await Promise.all([
      prisma.submissionCategory.findMany({
        where: { submissionId: submission.id },
        select: { categoryId: true },
      }),
      prisma.submissionSoftware.findMany({
        where: { submissionId: submission.id },
        select: { softwareId: true },
      }),
      prisma.repositoryVerification.findUnique({
        where: { submissionId: submission.id },
      }),
    ]);

  const publishedLogoUrl = resolvePublishedLogoUrl({
    logoSvgSanitized: verification?.logoSvgSanitized,
    repoMetadataJson: submission.repoMetadataJson,
  });

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.application.upsert({
      where: { slug },
      create: {
        slug,
        name: submission.name,
        tagline: submission.tagline,
        description: submission.description,
        homepageUrl: submission.homepageUrl,
        repositoryUrl: submission.repositoryUrl,
        repositoryHost: submission.repositoryHost,
        defaultBranch: submission.defaultBranch,
        stars: submission.stars,
        forks: submission.forks,
        lastCommitAt: submission.lastCommitAt,
        primaryLanguage: submission.primaryLanguage,
        logoUrl: publishedLogoUrl,
        publishedAt: new Date(),
        submittedById: submission.userId,
      },
      update: {
        name: submission.name,
        tagline: submission.tagline,
        description: submission.description,
        homepageUrl: submission.homepageUrl,
        repositoryUrl: submission.repositoryUrl,
        repositoryHost: submission.repositoryHost,
        defaultBranch: submission.defaultBranch,
        stars: submission.stars,
        forks: submission.forks,
        lastCommitAt: submission.lastCommitAt,
        primaryLanguage: submission.primaryLanguage,
        logoUrl: publishedLogoUrl,
        publishedAt: new Date(),
      },
    });

    const licenseSlug = licenseSlugFromRepoMetadataJson(
      submission.repoMetadataJson,
    );
    if (licenseSlug) {
      const license = await tx.license.findUnique({
        where: { slug: licenseSlug },
      });
      if (license) {
        await tx.applicationLicense.deleteMany({
          where: { applicationId: app.id },
        });
        await tx.applicationLicense.create({
          data: { applicationId: app.id, licenseId: license.id },
        });
      }
    }

    await tx.applicationCategory.deleteMany({
      where: { applicationId: app.id },
    });
    if (submissionCategories.length) {
      await tx.applicationCategory.createMany({
        data: submissionCategories.map((row) => ({
          applicationId: app.id,
          categoryId: row.categoryId,
        })),
        skipDuplicates: true,
      });
    }

    await tx.applicationSoftware.deleteMany({
      where: { applicationId: app.id },
    });
    if (submissionAlternatives.length) {
      await tx.applicationSoftware.createMany({
        data: submissionAlternatives.map((row) => ({
          applicationId: app.id,
          softwareId: row.softwareId,
        })),
        skipDuplicates: true,
      });
    }

    if (verification?.verifiedAt) {
      await tx.verificationSignal.deleteMany({
        where: {
          applicationId: app.id,
          type: "REPOSITORY_OWNERSHIP",
        },
      });
      await tx.verificationSignal.create({
        data: {
          applicationId: app.id,
          type: "REPOSITORY_OWNERSHIP",
          status: "ACTIVE",
          summary: "Repository ownership verified via .opensourceapp/verification",
          recordedById: submission.userId,
        },
      });
    }

    await tx.submission.update({
      where: { id: submission.id },
      data: { applicationId: app.id },
    });

    return app;
  });

  return application;
}
