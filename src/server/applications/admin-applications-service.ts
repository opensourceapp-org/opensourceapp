import { prisma } from "@/lib/db";
import { activeApplicationWhere } from "@/lib/applications/visibility";
import { writeAuditLog } from "@/server/audit";
import type { AdminApplicationFormInput } from "@/lib/validation/admin-application";

export type BulkDeleteRowResult = {
  id: string;
  ok: boolean;
  error?: string;
};

export async function softDeleteApplicationById(
  applicationId: string,
  actorId: string,
): Promise<{ ok: true; name: string } | { error: string }> {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, ...activeApplicationWhere() },
    select: { id: true, name: true, slug: true },
  });
  if (!app) {
    return { error: "Not found" };
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      deletedAt: new Date(),
      deletedById: actorId,
    },
  });

  await writeAuditLog({
    actorId,
    action: "application.deleted",
    entityType: "Application",
    entityId: applicationId,
    metadata: { name: app.name, slug: app.slug },
  });

  return { ok: true, name: app.name };
}

export async function bulkSoftDeleteApplications(
  applicationIds: string[],
  actorId: string,
): Promise<BulkDeleteRowResult[]> {
  const results: BulkDeleteRowResult[] = [];
  for (const id of applicationIds) {
    const result = await softDeleteApplicationById(id, actorId);
    if ("error" in result) {
      results.push({ id, ok: false, error: result.error });
    } else {
      results.push({ id, ok: true });
    }
  }
  return results;
}

export async function restoreApplicationById(
  applicationId: string,
  actorId: string,
): Promise<{ ok: true; name: string } | { error: string }> {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, deletedAt: { not: null } },
    select: { id: true, name: true, slug: true },
  });
  if (!app) {
    return { error: "Not found in trash" };
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      deletedAt: null,
      deletedById: null,
    },
  });

  await writeAuditLog({
    actorId,
    action: "application.restored",
    entityType: "Application",
    entityId: applicationId,
    metadata: { name: app.name, slug: app.slug },
  });

  return { ok: true, name: app.name };
}

export async function bulkRestoreApplications(
  applicationIds: string[],
  actorId: string,
): Promise<BulkDeleteRowResult[]> {
  const results: BulkDeleteRowResult[] = [];
  for (const id of applicationIds) {
    const result = await restoreApplicationById(id, actorId);
    if ("error" in result) {
      results.push({ id, ok: false, error: result.error });
    } else {
      results.push({ id, ok: true });
    }
  }
  return results;
}

export async function hardDeleteApplicationById(
  applicationId: string,
  actorId: string,
): Promise<{ ok: true; name: string } | { error: string }> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true, name: true, slug: true },
  });
  if (!app) {
    return { error: "Not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.updateMany({
      where: { applicationId },
      data: { applicationId: null },
    });
    await tx.application.delete({ where: { id: applicationId } });
  });

  await writeAuditLog({
    actorId,
    action: "application.hard_deleted",
    entityType: "Application",
    entityId: applicationId,
    metadata: { name: app.name, slug: app.slug },
  });

  return { ok: true, name: app.name };
}

export async function bulkHardDeleteApplications(
  applicationIds: string[],
  actorId: string,
): Promise<BulkDeleteRowResult[]> {
  const results: BulkDeleteRowResult[] = [];
  for (const id of applicationIds) {
    const result = await hardDeleteApplicationById(id, actorId);
    if ("error" in result) {
      results.push({ id, ok: false, error: result.error });
    } else {
      results.push({ id, ok: true });
    }
  }
  return results;
}

function emptyToNull(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim();
}

export async function updateApplicationFromAdminInput(
  applicationId: string,
  input: AdminApplicationFormInput,
  actorId: string,
): Promise<{ ok: true } | { error: string }> {
  const existing = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      slug: true,
      publishedAt: true,
      name: true,
      deletedAt: true,
    },
  });
  if (!existing) {
    return { error: "Not found" };
  }

  if (input.slug !== existing.slug) {
    const slugTaken = await prisma.application.findFirst({
      where: {
        slug: input.slug,
        id: { not: applicationId },
      },
      select: { id: true },
    });
    if (slugTaken) {
      return { error: "Slug is already in use" };
    }
  }

  const [categories, license, platforms, tags, alternatives] =
    await Promise.all([
      input.categoryIds.length
        ? prisma.category.findMany({
            where: {
              id: { in: input.categoryIds },
              status: "APPROVED",
            },
            select: { id: true },
          })
        : [],
      input.licenseId
        ? prisma.license.findUnique({
            where: { id: input.licenseId },
            select: { id: true },
          })
        : null,
      input.platformIds.length
        ? prisma.platform.findMany({
            where: { id: { in: input.platformIds } },
            select: { id: true },
          })
        : [],
      input.tagIds.length
        ? prisma.tag.findMany({
            where: { id: { in: input.tagIds } },
            select: { id: true },
          })
        : [],
      input.alternativeIds.length
        ? prisma.software.findMany({
            where: {
              id: { in: input.alternativeIds },
              status: "APPROVED",
            },
            select: { id: true },
          })
        : [],
    ]);

  if (categories.length !== input.categoryIds.length) {
    return { error: "One or more categories are invalid" };
  }
  if (input.licenseId && !license) {
    return { error: "License is invalid" };
  }
  if (platforms.length !== input.platformIds.length) {
    return { error: "One or more platforms are invalid" };
  }
  if (tags.length !== input.tagIds.length) {
    return { error: "One or more tags are invalid" };
  }
  if (alternatives.length !== input.alternativeIds.length) {
    return { error: "One or more alternatives are invalid" };
  }

  const repositoryHost =
    input.repositoryHost && input.repositoryHost !== "unknown"
      ? input.repositoryHost
      : null;

  const publishedAt = input.published
    ? (existing.publishedAt ?? new Date())
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: {
        name: input.name,
        slug: input.slug,
        tagline: emptyToNull(input.tagline),
        description: input.description,
        homepageUrl: emptyToNull(input.homepageUrl),
        repositoryUrl: input.repositoryUrl.trim(),
        repositoryHost,
        defaultBranch: emptyToNull(input.defaultBranch),
        primaryLanguage: emptyToNull(input.primaryLanguage),
        stars: input.stars ?? null,
        forks: input.forks ?? null,
        openIssuesCount: input.openIssuesCount ?? null,
        logoUrl: emptyToNull(input.logoUrl),
        latestReleaseTag: emptyToNull(input.latestReleaseTag),
        latestReleaseUrl: emptyToNull(input.latestReleaseUrl),
        publishedAt,
      },
    });

    await tx.applicationCategory.deleteMany({
      where: { applicationId },
    });
    if (categories.length) {
      await tx.applicationCategory.createMany({
        data: categories.map((c) => ({
          applicationId,
          categoryId: c.id,
        })),
      });
    }

    await tx.applicationLicense.deleteMany({ where: { applicationId } });
    if (license) {
      await tx.applicationLicense.create({
        data: { applicationId, licenseId: license.id },
      });
    }

    await tx.applicationPlatform.deleteMany({ where: { applicationId } });
    if (platforms.length) {
      await tx.applicationPlatform.createMany({
        data: platforms.map((p) => ({
          applicationId,
          platformId: p.id,
        })),
      });
    }

    await tx.applicationTag.deleteMany({ where: { applicationId } });
    if (tags.length) {
      await tx.applicationTag.createMany({
        data: tags.map((t) => ({
          applicationId,
          tagId: t.id,
        })),
      });
    }

    await tx.applicationSoftware.deleteMany({ where: { applicationId } });
    if (alternatives.length) {
      await tx.applicationSoftware.createMany({
        data: alternatives.map((s) => ({
          applicationId,
          softwareId: s.id,
        })),
      });
    }
  });

  await writeAuditLog({
    actorId,
    action: "application.updated",
    entityType: "Application",
    entityId: applicationId,
    metadata: {
      name: input.name,
      slug: input.slug,
      published: input.published,
    },
  });

  return { ok: true };
}
