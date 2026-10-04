"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { pendingSoftwareSchema } from "@/lib/validation/submission";
import { SoftwareStatus } from "@/generated/prisma";

export async function searchSoftwareAction(query: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const q = query.trim();
  const items = await prisma.software.findMany({
    where: {
      status: { in: [SoftwareStatus.APPROVED, SoftwareStatus.PENDING] },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: 20,
    select: {
      id: true,
      name: true,
      slug: true,
      websiteUrl: true,
      status: true,
    },
  });

  return { data: items };
}

export async function createPendingSoftwareAction(
  name: string,
  websiteUrl?: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const };
  }

  const parsed = pendingSoftwareSchema.safeParse({ name, websiteUrl });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      error:
        flat.name?.[0] ?? flat.websiteUrl?.[0] ?? "Invalid alternative",
    };
  }

  const baseSlug = slugify(parsed.data.name);
  if (!baseSlug) {
    return { error: "Invalid name" };
  }

  const existing = await prisma.software.findFirst({
    where: {
      OR: [
        { slug: baseSlug },
        { name: { equals: parsed.data.name, mode: "insensitive" } },
      ],
    },
  });
  if (existing) {
    return {
      data: {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        websiteUrl: existing.websiteUrl,
        status: existing.status,
      },
    };
  }

  let slug = baseSlug;
  let i = 0;
  while (await prisma.software.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${baseSlug}-${i}`;
  }

  const created = await prisma.software.create({
    data: {
      name: parsed.data.name.trim(),
      slug,
      websiteUrl: parsed.data.websiteUrl || null,
      status: SoftwareStatus.PENDING,
      createdById: session.user.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      websiteUrl: true,
      status: true,
    },
  });

  return { data: created };
}
