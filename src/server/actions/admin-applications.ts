"use server";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/session";
import { activeApplicationWhere } from "@/lib/applications/visibility";
import { prisma } from "@/lib/db";
import { adminApplicationFormSchema } from "@/lib/validation/admin-application";
import {
  bulkSoftDeleteApplications,
  softDeleteApplicationById,
  updateApplicationFromAdminInput,
} from "@/server/applications/admin-applications-service";
import type { Prisma } from "@/generated/prisma";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

function unauthorized() {
  return { error: "Admin access required" as const };
}

export async function requireAdminApplicationsSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: unauthorized().error, session: null };
  }
  const role = (session.user.role as UserRole) ?? UserRole.USER;
  if (!isAdmin(role)) {
    return { error: unauthorized().error, session: null };
  }
  return { session, error: null };
}

/** For pages that redirect unauthenticated users. */
export async function requireAdminApplicationsPage() {
  const session = await requireRole(UserRole.ADMIN);
  const role = (session.user.role as UserRole) ?? UserRole.USER;
  if (!isAdmin(role)) {
    return null;
  }
  return session;
}

export async function deleteApplicationAction(applicationId: string) {
  const gate = await requireAdminApplicationsSession();
  if (gate.error || !gate.session) return unauthorized();

  const result = await softDeleteApplicationById(
    applicationId,
    gate.session.user.id,
  );
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateAdminApplicationPaths();
  return { ok: true as const };
}

export async function bulkDeleteApplicationsAction(applicationIds: string[]) {
  const gate = await requireAdminApplicationsSession();
  if (gate.error || !gate.session) return unauthorized();

  if (!applicationIds?.length) {
    return { error: "No applications selected" };
  }
  if (applicationIds.length > 200) {
    return { error: "At most 200 applications per batch" };
  }

  const uniqueIds = [...new Set(applicationIds)];
  const results = await bulkSoftDeleteApplications(
    uniqueIds,
    gate.session.user.id,
  );

  revalidateAdminApplicationPaths();

  const failed = results.filter((r) => !r.ok);
  return {
    ok: true as const,
    results,
    deletedCount: results.filter((r) => r.ok).length,
    failedCount: failed.length,
  };
}

export async function updateApplicationAction(
  applicationId: string,
  raw: unknown,
) {
  const gate = await requireAdminApplicationsSession();
  if (gate.error || !gate.session) return unauthorized();

  const parsed = adminApplicationFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const result = await updateApplicationFromAdminInput(
    applicationId,
    parsed.data,
    gate.session.user.id,
  );
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateAdminApplicationPaths();
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath(`/admin/applications/${applicationId}/edit`);
  return { ok: true as const };
}

function revalidateAdminApplicationPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/apps");
}

export async function listAdminApplicationsQuery(params: {
  q?: string;
  status?: "all" | "published" | "draft";
}) {
  const where: Prisma.ApplicationWhereInput = {
    ...activeApplicationWhere(),
  };

  if (params.status === "published") {
    where.publishedAt = { not: null };
  } else if (params.status === "draft") {
    where.publishedAt = null;
  }

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { repositoryUrl: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.application.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      slug: true,
      repositoryUrl: true,
      publishedAt: true,
      stars: true,
      updatedAt: true,
    },
  });
}

export async function getAdminApplicationDetail(applicationId: string) {
  return prisma.application.findFirst({
    where: { id: applicationId, ...activeApplicationWhere() },
    include: {
      submittedBy: { select: { id: true, email: true, name: true } },
      categories: { include: { category: true } },
      platforms: { include: { platform: true } },
      licenses: { include: { license: true } },
      tags: { include: { tag: true } },
      alternatives: { include: { software: true } },
      signals: { orderBy: { recordedAt: "desc" } },
    },
  });
}
