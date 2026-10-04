"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRepositoryMetadata } from "@/lib/applications/repo-metadata";
import { resolveLicenseSlugFromCatalog } from "@/lib/applications/license-match";
import { findDuplicateSubmissionByRepo } from "@/lib/applications/duplicate-submission";
import { normalizeRepositoryUrl } from "@/lib/applications/normalize-repository-url";
import { rateLimit } from "@/lib/rate-limit";
import { submissionFieldErrorsFromZod } from "@/lib/validation/submission-errors";
import { submissionFormSchema } from "@/lib/validation/submission";
import { canTransitionSubmission } from "@/lib/applications/submission-status";
import { Prisma, SubmissionStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

async function syncSubmissionCategories(
  submissionId: string,
  categoryIds: string[],
) {
  const unique = [...new Set(categoryIds)];
  const categories = await prisma.category.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  if (categories.length !== unique.length) {
    return { error: "One or more categories are invalid" as const };
  }
  await prisma.$transaction([
    prisma.submissionCategory.deleteMany({ where: { submissionId } }),
    ...(unique.length
      ? [
          prisma.submissionCategory.createMany({
            data: unique.map((categoryId) => ({
              submissionId,
              categoryId,
            })),
          }),
        ]
      : []),
  ]);
  return { ok: true as const };
}

async function syncSubmissionAlternatives(
  submissionId: string,
  alternativeIds: string[],
) {
  const unique = [...new Set(alternativeIds)];
  const software = await prisma.software.findMany({
    where: { id: { in: unique } },
    select: { id: true },
  });
  if (software.length !== unique.length) {
    return { error: "One or more alternatives are invalid" as const };
  }
  await prisma.$transaction([
    prisma.submissionSoftware.deleteMany({ where: { submissionId } }),
    ...(unique.length
      ? [
          prisma.submissionSoftware.createMany({
            data: unique.map((softwareId) => ({
              submissionId,
              softwareId,
            })),
          }),
        ]
      : []),
  ]);
  return { ok: true as const };
}

async function validateSubmitRequirements(
  submissionId: string,
  userId: string,
  categoryIds: string[],
) {
  if (categoryIds.length < 1) {
    return {
      error: {
        categoryIds: ["Select at least one category"],
      },
    };
  }

  const verification = await prisma.repositoryVerification.findUnique({
    where: { submissionId },
  });
  if (!verification?.verifiedAt) {
    return {
      error: {
        ownershipVerified: [
          "Verify repository ownership before submitting for review",
        ],
      },
    };
  }

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId },
  });
  if (!submission) {
    return { error: "Not found" };
  }

  const duplicate = await findDuplicateSubmissionByRepo(
    submission.repositoryUrl,
    submissionId,
  );
  if (duplicate) {
    return {
      error: {
        repositoryUrl: [
          "A submission for this repository already exists. You can claim or update the existing listing.",
        ],
      },
    };
  }

  return { ok: true as const };
}

function buildSubmissionPayload(
  data: ReturnType<typeof submissionFormSchema.parse>,
  userId: string,
  status: SubmissionStatus,
  meta: Awaited<ReturnType<typeof fetchRepositoryMetadata>> | null,
  baseMeta: Record<string, unknown>,
) {
  return {
    name: data.name,
    tagline: data.tagline || null,
    description: data.description,
    homepageUrl: data.homepageUrl || meta?.homepageUrl || null,
    repositoryUrl: data.repositoryUrl,
    normalizedRepositoryUrl: normalizeRepositoryUrl(data.repositoryUrl),
    repositoryHost: meta?.host ?? "unknown",
    defaultBranch: meta?.defaultBranch ?? null,
    stars: meta?.stars ?? null,
    forks: meta?.forks ?? null,
    lastCommitAt: meta?.lastCommitAt ? new Date(meta.lastCommitAt) : null,
    primaryLanguage: data.primaryLanguage || meta?.primaryLanguage || null,
    repoMetadataJson: baseMeta as Prisma.InputJsonValue,
    status,
    userId,
  };
}

export async function fetchRepoMetadataAction(repositoryUrl: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  const rl = rateLimit(`repo-fetch:${session.user.id}`, 10, 60_000);
  if (!rl.ok) {
    return { error: "Rate limit exceeded. Try again shortly." };
  }
  try {
    const [metadata, licenses] = await Promise.all([
      fetchRepositoryMetadata(repositoryUrl),
      prisma.license.findMany({
        orderBy: { name: "asc" },
        select: { slug: true, spdxId: true, name: true },
      }),
    ]);
    const licenseSlug = await resolveLicenseSlugFromCatalog(
      {
        spdxId: metadata.licenseSpdxId ?? null,
        key: metadata.licenseKey ?? null,
        name: metadata.licenseName ?? null,
      },
      licenses,
    );
    return { data: { ...metadata, licenseSlug } };
  } catch {
    return { error: "Could not fetch repository metadata" };
  }
}

export async function ensureSubmissionDraftAction(
  raw: Record<string, unknown>,
  submissionId?: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const parsed = submissionFormSchema.safeParse({ ...raw, submit: false });
  if (!parsed.success) {
    return { error: submissionFieldErrorsFromZod(parsed.error) };
  }

  const data = parsed.data;
  const meta = await fetchRepositoryMetadata(data.repositoryUrl).catch(
    () => null,
  );

  const baseMeta: Record<string, unknown> =
    raw.repoMetadataJson && typeof raw.repoMetadataJson === "object"
      ? { ...(raw.repoMetadataJson as Record<string, unknown>) }
      : meta
        ? { ...(meta as Record<string, unknown>) }
        : {};
  if (data.licenseSlug) {
    baseMeta.licenseSlug = data.licenseSlug;
  }

  const payload = buildSubmissionPayload(
    data,
    session.user.id,
    SubmissionStatus.DRAFT,
    meta,
    baseMeta,
  );

  if (submissionId) {
    const existing = await prisma.submission.findFirst({
      where: { id: submissionId, userId: session.user.id },
    });
    if (!existing) return { error: "Not found" };
    if (
      existing.status !== SubmissionStatus.DRAFT &&
      existing.status !== SubmissionStatus.CHANGES_REQUESTED
    ) {
      return { error: "Submission cannot be edited in current status" };
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: payload,
    });

    const catSync = await syncSubmissionCategories(
      submissionId,
      data.categoryIds ?? [],
    );
    if (catSync.error) return { error: catSync.error };
    const altSync = await syncSubmissionAlternatives(
      submissionId,
      data.alternativeIds ?? [],
    );
    if (altSync.error) return { error: altSync.error };

    revalidatePath("/dashboard");
    return { id: submissionId };
  }

  const created = await prisma.submission.create({ data: payload });
  await syncSubmissionCategories(created.id, data.categoryIds ?? []);
  await syncSubmissionAlternatives(created.id, data.alternativeIds ?? []);
  revalidatePath("/dashboard");
  return { id: created.id };
}

export async function saveSubmissionAction(
  raw: Record<string, unknown>,
  submissionId?: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const parsed = submissionFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: submissionFieldErrorsFromZod(parsed.error) };
  }

  const data = parsed.data;
  const status = data.submit
    ? SubmissionStatus.SUBMITTED
    : SubmissionStatus.DRAFT;

  if (data.submit && submissionId) {
    const submitCheck = await validateSubmitRequirements(
      submissionId,
      session.user.id,
      data.categoryIds ?? [],
    );
    if (submitCheck.error) {
      return { error: submitCheck.error };
    }
  }

  const meta = await fetchRepositoryMetadata(data.repositoryUrl).catch(
    () => null,
  );

  const baseMeta: Record<string, unknown> =
    raw.repoMetadataJson && typeof raw.repoMetadataJson === "object"
      ? { ...(raw.repoMetadataJson as Record<string, unknown>) }
      : meta
        ? { ...(meta as Record<string, unknown>) }
        : {};
  if (data.licenseSlug) {
    baseMeta.licenseSlug = data.licenseSlug;
  }

  const payload = buildSubmissionPayload(
    data,
    session.user.id,
    status,
    meta,
    baseMeta,
  );

  if (submissionId) {
    const existing = await prisma.submission.findFirst({
      where: { id: submissionId, userId: session.user.id },
    });
    if (!existing) return { error: "Not found" };

    if (
      existing.status !== SubmissionStatus.DRAFT &&
      existing.status !== SubmissionStatus.CHANGES_REQUESTED
    ) {
      return { error: "Submission cannot be edited in current status" };
    }

    if (
      data.submit &&
      !canTransitionSubmission(existing.status, SubmissionStatus.SUBMITTED)
    ) {
      return { error: "Invalid status transition" };
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: payload,
    });

    const catSync = await syncSubmissionCategories(
      submissionId,
      data.categoryIds ?? [],
    );
    if (catSync.error) return { error: catSync.error };
    const altSync = await syncSubmissionAlternatives(
      submissionId,
      data.alternativeIds ?? [],
    );
    if (altSync.error) return { error: altSync.error };

    revalidatePath("/dashboard");
    return { id: submissionId, status };
  }

  if (data.submit) {
    const duplicate = await findDuplicateSubmissionByRepo(data.repositoryUrl);
    if (duplicate) {
      return {
        error: {
          repositoryUrl: [
            "A submission for this repository already exists.",
          ],
        },
      };
    }
    return {
      error: {
        ownershipVerified: [
          "Save a draft and complete repository verification before submitting",
        ],
      },
    };
  }

  const created = await prisma.submission.create({ data: payload });
  await syncSubmissionCategories(created.id, data.categoryIds ?? []);
  await syncSubmissionAlternatives(created.id, data.alternativeIds ?? []);
  revalidatePath("/dashboard");
  return { id: created.id, status: created.status };
}

export async function createSubmissionFromRepoAction(
  repositoryUrl: string,
  repoMetadataJson: unknown,
  fields: Record<string, unknown>,
) {
  return saveSubmissionAction(
    {
      ...fields,
      repositoryUrl,
      repoMetadataJson,
    },
    typeof fields.submissionId === "string"
      ? fields.submissionId
      : undefined,
  );
}

export async function deleteSubmissionAction(submissionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: session.user.id },
  });
  if (!submission) {
    return { error: "Not found" };
  }

  if (submission.status === SubmissionStatus.DELETED) {
    return { ok: true };
  }

  if (
    !canTransitionSubmission(submission.status, SubmissionStatus.DELETED)
  ) {
    return { error: "This submission cannot be deleted" };
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.DELETED,
      deletedAt: new Date(),
      deletedById: session.user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/apps");
  return { ok: true };
}
