import Link from "next/link";
import { AppCard } from "@/components/app-card";
import { HomeHeroSearch } from "@/components/home-hero-search";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { searchPublishedApplications } from "@/lib/search/applications";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: Awaited<
    ReturnType<typeof searchPublishedApplications>
  >["items"] = [];
  let recent: Awaited<
    ReturnType<typeof searchPublishedApplications>
  >["items"] = [];
  let categories: { slug: string; name: string }[] = [];

  try {
    const [featuredResult, recentResult, categoryRows] = await Promise.all([
      searchPublishedApplications({ limit: 6, sort: "stars" }),
      searchPublishedApplications({ limit: 6, sort: "updated" }),
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        take: 8,
        select: { slug: true, name: true },
      }),
    ]);
    featured = featuredResult.items;
    recent = recentResult.items;
    categories = categoryRows;
  } catch {
    featured = [];
    recent = [];
    categories = [];
  }

  return (
    <div className="space-y-16 md:space-y-20">
      <section className="space-y-8 pt-4 md:pt-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Open-source discovery
          </p>
          <h1 className="font-display text-balance text-4xl font-normal tracking-tight md:text-5xl">
            Discover great open-source software
          </h1>
          <p className="text-balance text-lg text-muted-foreground">
            Curated applications with transparent licensing, platform support,
            and verification signals — built for developers who ship.
          </p>
        </div>
        <div className="mx-auto max-w-2xl">
          <HomeHeroSearch />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/apps">Browse all apps</Link>
          </Button>
          <Button asChild>
            <Link href="/submit">Submit an app</Link>
          </Button>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-normal">Explore categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/apps?category=${c.slug}`}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-normal">Popular</h2>
            <Link
              href="/apps?sort=stars"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((app) => (
              <AppCard
                key={app.id}
                slug={app.slug}
                name={app.name}
                tagline={app.tagline}
                logoUrl={app.logoUrl}
                primaryLanguage={app.primaryLanguage}
                stars={app.stars}
                categories={app.categories}
                platforms={app.platforms}
                licenses={app.licenses}
                verified={app.signals.length > 0}
              />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-normal">Recently updated</h2>
            <Link
              href="/apps?sort=updated"
              className="text-sm text-primary hover:underline"
            >
              See more
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((app) => (
              <AppCard
                key={app.id}
                slug={app.slug}
                name={app.name}
                tagline={app.tagline}
                logoUrl={app.logoUrl}
                primaryLanguage={app.primaryLanguage}
                stars={app.stars}
                categories={app.categories}
                platforms={app.platforms}
                licenses={app.licenses}
                verified={app.signals.length > 0}
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface-muted px-6 py-10 text-center md:px-12">
        <h2 className="font-display text-2xl font-normal">
          Know a project we should list?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Submit your repository for review. We fetch metadata from your host
          and publish after moderation.
        </p>
        <Button asChild className="mt-6" size="lg">
          <Link href="/submit">Start submission</Link>
        </Button>
      </section>
    </div>
  );
}
