"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRepositoryMetadata } from "@/lib/applications/repo-metadata";
import { resolveLicenseSlugFromCatalog } from "@/lib/applications/license-match";
import { rateLimit } from "@/lib/rate-limit";
import { submissionFieldErrorsFromZod } from "@/lib/validation/submission-errors";
import { submissionFormSchema } from "@/lib/validation/submission";
import { Prisma, SubmissionStatus } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

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

  const payload = {
    name: data.name,
    tagline: data.tagline || null,
    description: data.description,
    homepageUrl: data.homepageUrl || null,
    repositoryUrl: data.repositoryUrl,
    primaryLanguage: data.primaryLanguage || null,
    status,
    userId: session.user.id,
  };

  if (submissionId) {
    const existing = await prisma.submission.findFirst({
      where: { id: submissionId, userId: session.user.id },
    });
    if (!existing) return { error: "Not found" };

    const existingMeta: Record<string, unknown> =
      existing.repoMetadataJson &&
      typeof existing.repoMetadataJson === "object" &&
      !Array.isArray(existing.repoMetadataJson)
        ? { ...(existing.repoMetadataJson as Record<string, unknown>) }
        : {};
    if (data.licenseSlug) {
      existingMeta.licenseSlug = data.licenseSlug;
    } else {
      delete existingMeta.licenseSlug;
    }
    if (
      existing.status !== SubmissionStatus.DRAFT &&
      existing.status !== SubmissionStatus.CHANGES_REQUESTED
    ) {
      return { error: "Submission cannot be edited in current status" };
    }
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        ...payload,
        repoMetadataJson: existingMeta as Prisma.InputJsonValue,
      },
    });
    revalidatePath("/dashboard");
    return { id: submissionId, status };
  }

  const created = await prisma.submission.create({ data: payload });
  revalidatePath("/dashboard");
  return { id: created.id, status: created.status };
}

export async function createSubmissionFromRepoAction(
  repositoryUrl: string,
  repoMetadataJson: unknown,
  fields: Record<string, unknown>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const parsed = submissionFormSchema.safeParse({
    ...fields,
    repositoryUrl,
  });
  if (!parsed.success) {
    return { error: submissionFieldErrorsFromZod(parsed.error) };
  }

  const meta = await fetchRepositoryMetadata(repositoryUrl).catch(() => null);

  const baseMeta: Record<string, unknown> =
    repoMetadataJson && typeof repoMetadataJson === "object"
      ? { ...(repoMetadataJson as Record<string, unknown>) }
      : meta
        ? { ...(meta as Record<string, unknown>) }
        : {};
  if (parsed.data.licenseSlug) {
    baseMeta.licenseSlug = parsed.data.licenseSlug;
  }

  const created = await prisma.submission.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      tagline: parsed.data.tagline || null,
      description: parsed.data.description,
      homepageUrl: parsed.data.homepageUrl || meta?.homepageUrl || null,
      repositoryUrl: parsed.data.repositoryUrl,
      repositoryHost: meta?.host ?? "unknown",
      defaultBranch: meta?.defaultBranch ?? null,
      stars: meta?.stars ?? null,
      forks: meta?.forks ?? null,
      lastCommitAt: meta?.lastCommitAt ? new Date(meta.lastCommitAt) : null,
      primaryLanguage:
        parsed.data.primaryLanguage || meta?.primaryLanguage || null,
      repoMetadataJson: baseMeta as Prisma.InputJsonValue,
      status: parsed.data.submit
        ? SubmissionStatus.SUBMITTED
        : SubmissionStatus.DRAFT,
    },
  });

  revalidatePath("/dashboard");
  return { id: created.id };
}
