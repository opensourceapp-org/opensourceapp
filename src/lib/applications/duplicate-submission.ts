import { prisma } from "@/lib/db";
import { SubmissionStatus } from "@/generated/prisma";
import { normalizeRepositoryUrl } from "./normalize-repository-url";

export async function findDuplicateSubmissionByRepo(
  repositoryUrl: string,
  excludeSubmissionId?: string,
) {
  const normalized = normalizeRepositoryUrl(repositoryUrl);
  return prisma.submission.findFirst({
    where: {
      normalizedRepositoryUrl: normalized,
      status: { not: SubmissionStatus.DELETED },
      ...(excludeSubmissionId ? { id: { not: excludeSubmissionId } } : {}),
    },
    select: { id: true, name: true, status: true, userId: true },
  });
}
