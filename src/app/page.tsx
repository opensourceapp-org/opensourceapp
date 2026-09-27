import Link from "next/link";
import { AppCard } from "@/components/app-card";
import { Button } from "@/components/ui/button";
import { searchPublishedApplications } from "@/lib/search/applications";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featured: Awaited<
    ReturnType<typeof searchPublishedApplications>
  >["items"] = [];

  try {
    const result = await searchPublishedApplications({ limit: 6 });
    featured = result.items;
  } catch {
    featured = [];
  }

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          Discover open-source software you can trust
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          OpenSourceApp.org is a curated directory of applications with
          transparent verification signals, clear licensing, and repository
          provenance.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/apps">Browse apps</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/submit">Submit an app</Link>
          </Button>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium">Featured</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((app) => (
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
        </section>
      )}
    </div>
  );
}
