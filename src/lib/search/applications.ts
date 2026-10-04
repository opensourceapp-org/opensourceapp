import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";

export type ApplicationSort = "stars" | "name" | "updated" | "new";

export type ApplicationSearchFilters = {
  q?: string;
  categorySlug?: string;
  platformSlug?: string;
  licenseSlug?: string;
  tagSlug?: string;
  sort?: ApplicationSort;
  limit?: number;
  offset?: number;
};

export async function searchPublishedApplications(
  filters: ApplicationSearchFilters,
) {
  const where: Prisma.ApplicationWhereInput = {
    publishedAt: { not: null },
  };

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.categorySlug) {
    where.categories = {
      some: { category: { slug: filters.categorySlug } },
    };
  }
  if (filters.platformSlug) {
    where.platforms = {
      some: { platform: { slug: filters.platformSlug } },
    };
  }
  if (filters.licenseSlug) {
    where.licenses = {
      some: { license: { slug: filters.licenseSlug } },
    };
  }
  if (filters.tagSlug) {
    where.tags = { some: { tag: { slug: filters.tagSlug } } };
  }

  const take = Math.min(filters.limit ?? 24, 100);
  const skip = filters.offset ?? 0;

  const sort = filters.sort ?? "stars";
  const orderBy: Prisma.ApplicationOrderByWithRelationInput[] =
    sort === "name"
      ? [{ name: "asc" }]
      : sort === "updated"
        ? [{ updatedAt: "desc" }, { name: "asc" }]
        : sort === "new"
          ? [{ publishedAt: "desc" }, { name: "asc" }]
          : [{ stars: "desc" }, { name: "asc" }];

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        categories: { include: { category: true } },
        platforms: { include: { platform: true } },
        licenses: { include: { license: true } },
        tags: { include: { tag: true } },
        signals: { where: { status: "ACTIVE" }, take: 5 },
      },
    }),
    prisma.application.count({ where }),
  ]);

  return { items, total };
}
