import { normalizeRepositoryUrl } from "@/lib/applications/normalize-repository-url";
import { prisma } from "@/lib/db";
import { SubmissionStatus } from "@/generated/prisma";
import type { BulkImportLookupContext } from "./validate-rows";

export async function loadBulkImportLookupContext(): Promise<BulkImportLookupContext> {
  const [
    applications,
    submissions,
    categories,
    licenses,
    platforms,
    tags,
    software,
  ] = await Promise.all([
    prisma.application.findMany({
      select: { slug: true, repositoryUrl: true },
    }),
    prisma.submission.findMany({
      where: { status: { not: SubmissionStatus.DELETED } },
      select: { normalizedRepositoryUrl: true, repositoryUrl: true },
    }),
    prisma.category.findMany({
      where: { status: "APPROVED" },
      select: { slug: true },
    }),
    prisma.license.findMany({ select: { slug: true } }),
    prisma.platform.findMany({ select: { slug: true } }),
    prisma.tag.findMany({ select: { slug: true } }),
    prisma.software.findMany({
      where: { status: "APPROVED" },
      select: { slug: true },
    }),
  ]);

  const existingRepositoryUrls = new Set<string>();
  for (const app of applications) {
    existingRepositoryUrls.add(normalizeRepositoryUrl(app.repositoryUrl));
  }
  for (const sub of submissions) {
    const normalized =
      sub.normalizedRepositoryUrl ??
      normalizeRepositoryUrl(sub.repositoryUrl);
    existingRepositoryUrls.add(normalized);
  }

  return {
    existingRepositoryUrls,
    existingSlugs: new Set(applications.map((a) => a.slug)),
    categorySlugs: new Set(categories.map((c) => c.slug)),
    licenseSlugs: new Set(licenses.map((l) => l.slug)),
    platformSlugs: new Set(platforms.map((p) => p.slug)),
    tagSlugs: new Set(tags.map((t) => t.slug)),
    softwareSlugs: new Set(software.map((s) => s.slug)),
  };
}
