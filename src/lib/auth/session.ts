import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { hasMinimumRole } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

export async function requireAuth(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    const qs = callbackUrl
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";
    redirect(`/login${qs}`);
  }
  return session;
}

export async function requireRole(required: UserRole, callbackUrl?: string) {
  const session = await requireAuth(callbackUrl);
  const role = (session.user.role as UserRole) ?? UserRole.USER;
  if (!hasMinimumRole(role, required)) {
    redirect("/");
  }
  return session;
}
