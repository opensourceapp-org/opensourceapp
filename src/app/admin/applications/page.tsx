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
  view?: string;
}>;

function buildListHref(params: {
  q?: string;
  status: string;
  view: "active" | "deleted";
}) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.status !== "all") search.set("status", params.status);
  if (params.view === "deleted") search.set("view", "deleted");
  const qs = search.toString();
  return qs ? `/admin/applications?${qs}` : "/admin/applications";
}

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
  const view = params.view === "deleted" ? "deleted" : "active";

  const rows = await listAdminApplicationsQuery({
    q: params.q,
    status,
    view,
  });

  const activeHref = buildListHref({ q: params.q, status, view: "active" });
  const deletedHref = buildListHref({ q: params.q, status, view: "deleted" });

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
            View, edit, soft-delete, restore, or permanently remove directory
            listings (admin only).
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">Back to moderation</Link>
        </Button>
      </div>

      <div className="flex gap-2 border-b border-border">
        <Link
          href={activeHref}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "active"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Active
        </Link>
        <Link
          href={deletedHref}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
            view === "deleted"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Deleted (trash)
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4"
      >
        {view === "deleted" && (
          <input type="hidden" name="view" value="deleted" />
        )}
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

      <ApplicationsList rows={rows} view={view} />
    </div>
  );
}
