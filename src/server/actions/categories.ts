"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { pendingCategorySchema } from "@/lib/validation/submission";
import { CategoryStatus } from "@/generated/prisma";

export async function searchCategoriesAction(query: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const q = query.trim();
  const items = await prisma.category.findMany({
    where: {
      status: { in: [CategoryStatus.APPROVED, CategoryStatus.PENDING] },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    take: 20,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  return { data: items };
}

export async function createPendingCategoryAction(name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const parsed = pendingCategorySchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid name" };
  }

  const baseSlug = slugify(parsed.data.name);
  if (!baseSlug) {
    return { error: "Invalid category name" };
  }

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ slug: baseSlug }, { name: { equals: parsed.data.name, mode: "insensitive" } }],
    },
  });
  if (existing) {
    return {
      data: {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        status: existing.status,
      },
    };
  }

  let slug = baseSlug;
  let i = 0;
  while (await prisma.category.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${baseSlug}-${i}`;
  }

  const created = await prisma.category.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      status: CategoryStatus.PENDING,
      createdById: session.user.id,
    },
    select: { id: true, name: true, slug: true, status: true },
  });

  return { data: created };
}
