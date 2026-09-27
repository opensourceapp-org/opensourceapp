import { AppCard } from "@/components/app-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchPublishedApplications } from "@/lib/search/applications";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  platform?: string;
  license?: string;
  tag?: string;
}>;

export default async function AppsBrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const [result, categories, platforms, licenses] = await Promise.all([
    searchPublishedApplications({
      q: params.q,
      categorySlug: params.category,
      platformSlug: params.platform,
      licenseSlug: params.license,
      tagSlug: params.tag,
      limit: 48,
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.license.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Browse apps</h1>
        <p className="text-muted-foreground">
          Search and filter the public directory.
        </p>
      </div>

      <form className="grid gap-4 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, tagline, description…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={params.category ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <select
            id="platform"
            name="platform"
            defaultValue={params.platform ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="license">License</Label>
          <select
            id="license"
            name="license"
            defaultValue={params.license ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All</option>
            {licenses.map((l) => (
              <option key={l.id} value={l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end md:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Apply filters
          </button>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {result.total} app{result.total === 1 ? "" : "s"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((app) => (
          <AppCard
            key={app.id}
            slug={app.slug}
            name={app.name}
            tagline={app.tagline}
            primaryLanguage={app.primaryLanguage}
            stars={app.stars}
            categories={app.categories}
          />
        ))}
      </div>
    </div>
  );
}
