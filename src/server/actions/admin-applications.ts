"use server";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/session";
import {
  activeApplicationWhere,
  deletedApplicationWhere,
} from "@/lib/applications/visibility";
import { prisma } from "@/lib/db";
import { adminApplicationFormSchema } from "@/lib/validation/admin-application";
import {
  bulkHardDeleteApplications,
  bulkRestoreApplications,
  bulkSoftDeleteApplications,
  hardDeleteApplicationById,
  restoreApplicationById,
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

export type ApplicationDeleteMode = "soft" | "hard";

export async function deleteApplicationAction(
  applicationId: string,
  options?: { mode?: ApplicationDeleteMode },
) {
  const gate = await requireAdminApplicationsSession();
  if (gate.error || !gate.session) return unauthorized();

  const mode = options?.mode ?? "soft";
  const result =
    mode === "hard"
      ? await hardDeleteApplicationById(
          applicationId,
          gate.session.user.id,
        )
      : await softDeleteApplicationById(
          applicationId,
          gate.session.user.id,
        );
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateAdminApplicationPaths();
  return { ok: true as const };
}

export async function restoreApplicationAction(applicationId: string) {
  const gate = await requireAdminApplicationsSession();
  if (gate.error || !gate.session) return unauthorized();

  const result = await restoreApplicationById(
    applicationId,
    gate.session.user.id,
  );
  if ("error" in result) {
    return { error: result.error };
  }

  revalidateAdminApplicationPaths();
  return { ok: true as const };
}

function validateBulkIds(applicationIds: string[]) {
  if (!applicationIds?.length) {
    return { error: "No applications selected" as const };
  }
  if (applicationIds.length > 200) {
    return { error: "At most 200 applications per batch" as const };
  }
  return { ids: [...new Set(applicationIds)] as string[] };
}

export async function bulkDeleteApplicationsAction(
  applicationIds: string[],
  options?: { mode?: ApplicationDeleteMode },
) {
  const gate = await requireAdminApplicationsSession();
  if (gate.error || !gate.session) return unauthorized();

  const validated = validateBulkIds(applicationIds);
  if ("error" in validated) return { error: validated.error };

  const mode = options?.mode ?? "soft";
  const results =
    mode === "hard"
      ? await bulkHardDeleteApplications(
          validated.ids,
          gate.session.user.id,
        )
      : await bulkSoftDeleteApplications(
          validated.ids,
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

export async function bulkRestoreApplicationsAction(applicationIds: string[]) {
  const gate = await requireAdminApplicationsSession();
  if (gate.error || !gate.session) return unauthorized();

  const validated = validateBulkIds(applicationIds);
  if ("error" in validated) return { error: validated.error };

  const results = await bulkRestoreApplications(
    validated.ids,
    gate.session.user.id,
  );

  revalidateAdminApplicationPaths();

  const failed = results.filter((r) => !r.ok);
  return {
    ok: true as const,
    results,
    restoredCount: results.filter((r) => r.ok).length,
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
  view?: "active" | "deleted";
}) {
  const view = params.view === "deleted" ? "deleted" : "active";
  const where: Prisma.ApplicationWhereInput =
    view === "deleted"
      ? { ...deletedApplicationWhere() }
      : { ...activeApplicationWhere() };

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
    orderBy:
      view === "deleted"
        ? [{ deletedAt: "desc" }, { name: "asc" }]
        : [{ updatedAt: "desc" }, { name: "asc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      slug: true,
      repositoryUrl: true,
      publishedAt: true,
      stars: true,
      updatedAt: true,
      deletedAt: true,
      deletedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getAdminApplicationDetail(applicationId: string) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      submittedBy: { select: { id: true, email: true, name: true } },
      deletedBy: { select: { id: true, email: true, name: true } },
      categories: { include: { category: true } },
      platforms: { include: { platform: true } },
      licenses: { include: { license: true } },
      tags: { include: { tag: true } },
      alternatives: { include: { software: true } },
      signals: { orderBy: { recordedAt: "desc" } },
    },
  });
}
