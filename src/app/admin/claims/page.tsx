import Link from "next/link";
import { AdminClaimRow } from "@/components/admin-claim-row";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ApplicationClaimStatus, UserRole } from "@/generated/prisma";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  await requireRole(UserRole.MODERATOR, "/admin/claims");

  const queue = await prisma.applicationClaim.findMany({
    where: { status: ApplicationClaimStatus.PENDING },
    orderBy: { createdAt: "asc" },
    include: {
      application: {
        select: { slug: true, name: true, repositoryUrl: true },
      },
      user: { select: { email: true, name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Claims" },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-medium">
          Maintainer claims ({queue.length})
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">Back to moderation</Link>
        </Button>
      </div>
      {queue.length === 0 ? (
        <p className="text-muted-foreground text-sm">No pending claims.</p>
      ) : (
        <ul className="space-y-4">
          {queue.map((claim) => (
            <AdminClaimRow key={claim.id} claim={claim} />
          ))}
        </ul>
      )}
    </div>
  );
}
