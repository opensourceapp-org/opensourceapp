import type { Prisma } from "@/generated/prisma";

/** Applications that are not soft-deleted (admin may still list drafts). */
export function activeApplicationWhere(): Prisma.ApplicationWhereInput {
  return { deletedAt: null };
}

/** Soft-deleted applications (admin trash). */
export function deletedApplicationWhere(): Prisma.ApplicationWhereInput {
  return { deletedAt: { not: null } };
}

/** Applications visible on public directory and search. */
export function publishedApplicationWhere(): Prisma.ApplicationWhereInput {
  return {
    publishedAt: { not: null },
    deletedAt: null,
  };
}
