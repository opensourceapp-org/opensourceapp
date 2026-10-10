import { AppCard } from "@/components/app-card";
import { AppsFilters } from "@/components/apps/apps-filters";
import { EmptyState } from "@/components/states/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { searchPublishedApplications } from "@/lib/search/applications";
import type { ApplicationSort } from "@/lib/search/applications";
import { prisma } from "@/lib/db";
import { BrowseHeroSection } from "@/components/visual/browse-hero-section";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type SearchParams = Promise<{
  q?: string;
  category?: string;
  platform?: string;
  license?: string;
  tag?: string;
  sort?: string;
  page?: string;
}>;

function parseSort(value?: string): ApplicationSort {
  if (value === "name" || value === "updated" || value === "new") return value;
  return "stars";
}

export default async function AppsBrowsePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort = parseSort(params.sort);

  const [result, categories, platforms, licenses] = await Promise.all([
    searchPublishedApplications({
      q: params.q,
      categorySlug: params.category,
      platformSlug: params.platform,
      licenseSlug: params.license,
      tagSlug: params.tag,
      sort,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.license.findMany({ orderBy: { name: "asc" } }),
  ]);

  const filterParams = {
    q: params.q,
    category: params.category,
    platform: params.platform,
    license: params.license,
    tag: params.tag,
    sort: params.sort ?? "stars",
  };

  return (
    <div className="space-y-8">
      <div className="-mx-4 -mt-8 md:-mt-10">
        <BrowseHeroSection className="px-4 md:px-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Browse apps" },
            ]}
          />

          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Directory
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight md:text-4xl">
              Browse apps
            </h1>
            <p className="text-muted-foreground">
              Search the public directory by name, category, platform, and
              license.
            </p>
          </div>

          <AppsFilters
            params={filterParams}
            categories={categories}
            platforms={platforms}
            licenses={licenses}
            embedded
          />
        </BrowseHeroSection>
      </div>

      <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-display text-2xl font-normal tabular-nums text-foreground">
            {result.total}
          </span>{" "}
          {result.total === 1 ? "app" : "apps"}
          {params.q ? (
            <>
              {" "}
              matching &ldquo;{params.q}&rdquo;
            </>
          ) : null}
        </p>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          showVisual
          title="No apps match your filters"
          description="Try clearing filters or broadening your search terms."
          action={
            <Button asChild variant="outline">
              <Link href="/apps">Clear filters</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((app) => (
              <AppCard
                key={app.id}
                slug={app.slug}
                name={app.name}
                tagline={app.tagline}
                logoUrl={app.logoUrl}
                primaryLanguage={app.primaryLanguage}
                stars={app.stars}
                updatedAt={app.updatedAt}
                latestReleaseTag={app.latestReleaseTag}
                latestReleaseAt={app.latestReleaseAt}
                lastCommitAt={app.lastCommitAt}
                categories={app.categories}
                platforms={app.platforms}
                licenses={app.licenses}
                signals={app.signals}
              />
            ))}
          </div>
          <Pagination
            basePath="/apps"
            searchParams={filterParams}
            page={page}
            pageSize={PAGE_SIZE}
            total={result.total}
          />
        </>
      )}
    </div>
  );
}
