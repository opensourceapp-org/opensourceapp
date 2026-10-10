import Link from "next/link";
import {
  listAdminApplicationsQuery,
  requireAdminApplicationsPage,
} from "@/server/actions/admin-applications";
import { ApplicationsList } from "@/components/admin/applications-list";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  status?: string;
}>;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminApplicationsPage();
  const params = await searchParams;
  const status =
    params.status === "published" ||
    params.status === "draft" ||
    params.status === "all"
      ? params.status
      : "all";

  const rows = await listAdminApplicationsQuery({
    q: params.q,
    status,
  });

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Applications" },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight">
            Applications
          </h1>
          <p className="text-muted-foreground">
            View, edit, and soft-delete directory listings (admin only).
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">Back to moderation</Link>
        </Button>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4"
      >
        <div className="min-w-[12rem] flex-1 space-y-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            placeholder="Name, slug, or repository URL"
            defaultValue={params.q ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <Button type="submit" size="sm">Filter</Button>
      </form>

      <ApplicationsList rows={rows} />
    </div>
  );
}
