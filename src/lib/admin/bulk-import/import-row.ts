import { normalizeRepositoryUrl } from "@/lib/applications/normalize-repository-url";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { BulkImportRow } from "./row-schema";

async function uniqueSlug(base: string, reserved: Set<string>): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = "app";
  let candidate = slug;
  let i = 0;
  while (
    reserved.has(candidate) ||
    (await prisma.application.findUnique({ where: { slug: candidate } }))
  ) {
    i += 1;
    candidate = `${slug}-${i}`;
  }
  reserved.add(candidate);
  return candidate;
}

export async function importBulkRow(
  row: BulkImportRow,
  actorId: string,
  slugReserved: Set<string>,
): Promise<{ applicationId: string; slug: string }> {
  const slug = await uniqueSlug(row.slug?.trim() || row.name, slugReserved);

  const [categories, platforms, license, tags, alternatives] =
    await Promise.all([
      row.categorySlugs.length
        ? prisma.category.findMany({
            where: { slug: { in: row.categorySlugs }, status: "APPROVED" },
            select: { id: true },
          })
        : [],
      row.platformSlugs.length
        ? prisma.platform.findMany({
            where: { slug: { in: row.platformSlugs } },
            select: { id: true },
          })
        : [],
      row.licenseSlug
        ? prisma.license.findUnique({
            where: { slug: row.licenseSlug },
            select: { id: true },
          })
        : null,
      row.tagSlugs.length
        ? prisma.tag.findMany({
            where: { slug: { in: row.tagSlugs } },
            select: { id: true },
          })
        : [],
      row.alternativeSoftwareSlugs.length
        ? prisma.software.findMany({
            where: {
              slug: { in: row.alternativeSoftwareSlugs },
              status: "APPROVED",
            },
            select: { id: true },
          })
        : [],
    ]);

  const publishedAt = row.publish ? new Date() : null;
  const repositoryHost =
    row.repositoryHost && row.repositoryHost !== "unknown"
      ? row.repositoryHost
      : null;

  const app = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({
      data: {
        slug,
        name: row.name,
        tagline: row.tagline || null,
        description: row.description,
        homepageUrl: row.homepageUrl || null,
        repositoryUrl: row.repositoryUrl.trim(),
        repositoryHost,
        defaultBranch: row.defaultBranch || null,
        stars: row.stars ?? null,
        forks: row.forks ?? null,
        openIssuesCount: row.openIssuesCount ?? null,
        lastCommitAt: row.lastCommitAt ?? null,
        primaryLanguage: row.primaryLanguage || null,
        logoUrl: row.logoUrl || null,
        latestReleaseTag: row.latestReleaseTag || null,
        latestReleaseAt: row.latestReleaseAt ?? null,
        latestReleaseUrl: row.latestReleaseUrl || null,
        publishedAt,
        submittedById: actorId,
      },
    });

    if (categories.length) {
      await tx.applicationCategory.createMany({
        data: categories.map((c) => ({
          applicationId: created.id,
          categoryId: c.id,
        })),
        skipDuplicates: true,
      });
    }

    if (platforms.length) {
      await tx.applicationPlatform.createMany({
        data: platforms.map((p) => ({
          applicationId: created.id,
          platformId: p.id,
        })),
        skipDuplicates: true,
      });
    }

    if (license) {
      await tx.applicationLicense.create({
        data: { applicationId: created.id, licenseId: license.id },
      });
    }

    if (tags.length) {
      await tx.applicationTag.createMany({
        data: tags.map((t) => ({
          applicationId: created.id,
          tagId: t.id,
        })),
        skipDuplicates: true,
      });
    }

    if (alternatives.length) {
      await tx.applicationSoftware.createMany({
        data: alternatives.map((s) => ({
          applicationId: created.id,
          softwareId: s.id,
        })),
        skipDuplicates: true,
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "application.bulk_import",
        entityType: "Application",
        entityId: created.id,
        metadata: {
          rowNumber: row.rowNumber,
          repositoryUrl: normalizeRepositoryUrl(row.repositoryUrl),
          published: row.publish,
        },
      },
    });

    return created;
  });

  return { applicationId: app.id, slug: app.slug };
}
