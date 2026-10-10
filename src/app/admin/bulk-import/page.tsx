import Link from "next/link";
import { UserRole } from "@/generated/prisma";
import { requireRole } from "@/lib/auth/session";
import { BulkImportForm } from "@/components/admin/bulk-import-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminBulkImportPage() {
  await requireRole(UserRole.ADMIN, "/admin/bulk-import");

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Bulk import" },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight">
            Bulk import
          </h1>
          <p className="text-muted-foreground">
            Import published directory listings from an Excel spreadsheet
            (admin only).
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">Back to moderation</Link>
        </Button>
      </div>

      <BulkImportForm />
    </div>
  );
}
