import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{app.name}</h1>
        {app.tagline && (
          <p className="text-lg text-muted-foreground">{app.tagline}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {app.primaryLanguage && (
            <Badge variant="outline">{app.primaryLanguage}</Badge>
          )}
          {typeof app.stars === "number" && (
            <Badge variant="outline">{app.stars.toLocaleString()} stars</Badge>
          )}
          {app.licenses.map((l) => (
            <Badge key={l.licenseId} variant="secondary">
              {l.license.name}
            </Badge>
          ))}
        </div>
      </header>

      <section className="prose prose-zinc max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap text-base leading-relaxed">
          {app.description}
        </p>
      </section>

      {app.signals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Verification signals</h2>
          <ul className="space-y-2">
            {app.signals.map((signal) => (
              <li
                key={signal.id}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-medium">{signal.type}</span>
                <span className="text-muted-foreground"> — {signal.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-wrap gap-4 text-sm">
        <a
          href={app.repositoryUrl}
          className="font-medium text-primary underline-offset-4 hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          Repository
        </a>
        {app.homepageUrl && (
          <a
            href={app.homepageUrl}
            className="font-medium text-primary underline-offset-4 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Homepage
          </a>
        )}
      </section>
    </article>
  );
}
