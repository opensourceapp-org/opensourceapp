import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Star } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { ClaimAppCard } from "@/components/claim-app-card";
import { LicenseBadge } from "@/components/badges/license-badge";
import { PlatformBadge } from "@/components/badges/platform-badge";
import { RepositoryBadge } from "@/components/badges/repository-badge";
import { VerificationBadge } from "@/components/badges/verification-badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getApp(slug: string) {
  return prisma.application.findFirst({
    where: { slug, publishedAt: { not: null } },
    include: {
      categories: { include: { category: true } },
      platforms: { include: { platform: true } },
      licenses: { include: { license: true } },
      tags: { include: { tag: true } },
      signals: { where: { status: "ACTIVE" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = await getApp(slug);
  if (!app) return { title: "App not found" };

  const title = app.name;
  const description = app.tagline ?? app.description.slice(0, 160);
  const url = `/apps/${app.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function AppDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const app = await getApp(slug);
  if (!app) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    description: app.tagline ?? app.description,
    applicationCategory: app.categories.map((c) => c.category.name).join(", "),
    operatingSystem: app.platforms.map((p) => p.platform.name).join(", "),
    license: app.licenses.map((l) => l.license.spdxId ?? l.license.name).join(
      ", ",
    ),
    url: app.homepageUrl ?? app.repositoryUrl,
    codeRepository: app.repositoryUrl,
  };

  const hasVerification = app.signals.length > 0;

  return (
    <article className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Browse", href: "/apps" },
          { label: app.name },
        ]}
      />

      <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-5">
          <AppIcon name={app.name} logoUrl={app.logoUrl} size="lg" />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-normal tracking-tight md:text-4xl">
                {app.name}
              </h1>
              <VerificationBadge verified={hasVerification} />
            </div>
            {app.tagline && (
              <p className="max-w-2xl text-lg text-muted-foreground">
                {app.tagline}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {app.primaryLanguage && (
                <Badge variant="outline">{app.primaryLanguage}</Badge>
              )}
              {typeof app.stars === "number" && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4" aria-hidden />
                  {app.stars.toLocaleString()}
                </span>
              )}
              <RepositoryBadge url={app.repositoryUrl} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a
              href={app.repositoryUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              View source
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          {app.homepageUrl && (
            <Button asChild variant="outline">
              <a
                href={app.homepageUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Website
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="license">License</TabsTrigger>
              <TabsTrigger value="releases">Releases</TabsTrigger>
              <TabsTrigger value="maintainers">Maintainers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <section>
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  About
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">
                  {app.description}
                </p>
              </section>
              {app.categories.length > 0 && (
                <section>
                  <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Categories
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {app.categories.map((c) => (
                      <Link
                        key={c.categoryId}
                        href={`/apps?category=${c.category.slug}`}
                      >
                        <Badge variant="secondary">{c.category.name}</Badge>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {hasVerification && (
                <section className="space-y-3">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Verification
                  </h2>
                  <ul className="space-y-2">
                    {app.signals.map((signal) => (
                      <li
                        key={signal.id}
                        className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm"
                      >
                        <span className="font-medium">{signal.type}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {signal.summary}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </TabsContent>

            <TabsContent value="platforms">
              {app.platforms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {app.platforms.map((p) => (
                    <PlatformBadge
                      key={p.platformId}
                      name={p.platform.name}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Platform information has not been added yet.
                </p>
              )}
            </TabsContent>

            <TabsContent value="license">
              {app.licenses.length > 0 ? (
                <ul className="space-y-2">
                  {app.licenses.map((l) => (
                    <li key={l.licenseId}>
                      <LicenseBadge
                        name={l.license.name}
                        spdxId={l.license.spdxId}
                      />
                      <span className="ml-2 text-sm text-muted-foreground">
                        {l.license.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  License details are not listed yet.
                </p>
              )}
            </TabsContent>

            <TabsContent value="releases">
              <p className="text-sm text-muted-foreground">
                Release history will appear here when release metadata is
                connected to the listing.
              </p>
            </TabsContent>

            <TabsContent value="maintainers">
              <p className="text-sm text-muted-foreground">
                Maintainer profiles and attestation details will be shown here
                after claim and verification flows are enabled.
              </p>
            </TabsContent>
          </Tabs>

          <section className="mt-10 space-y-2 border-t border-border pt-8">
            <h2 className="font-display text-lg font-medium">Related apps</h2>
            <p className="text-sm text-muted-foreground">
              Recommendations based on category and tags are coming soon.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <ClaimAppCard appName={app.name} />
          <div className="rounded-xl border border-border p-4 text-sm">
            <h2 className="font-medium">Source</h2>
            <a
              href={app.repositoryUrl}
              className="mt-2 block break-all font-mono text-xs text-primary hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              {app.repositoryUrl}
            </a>
            {app.lastCommitAt && (
              <p className="mt-3 text-muted-foreground">
                Last activity{" "}
                {app.lastCommitAt.toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
