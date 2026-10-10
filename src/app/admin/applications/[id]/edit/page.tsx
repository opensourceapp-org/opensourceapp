import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminApplicationDetail,
  requireAdminApplicationsPage,
} from "@/server/actions/admin-applications";
import { ApplicationEditForm } from "@/components/admin/application-edit-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminApplicationEditPage({
  params,
}: {
  params: Params;
}) {
  await requireAdminApplicationsPage();
  const { id } = await params;
  const app = await getAdminApplicationDetail(id);
  if (!app) notFound();

  const [categories, licenses, platforms, tags, alternatives] =
    await Promise.all([
      prisma.category.findMany({
        where: { status: "APPROVED" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.license.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.platform.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.tag.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.software.findMany({
        where: { status: "APPROVED" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
    ]);

  const initial = {
    name: app.name,
    slug: app.slug,
    tagline: app.tagline ?? "",
    description: app.description,
    homepageUrl: app.homepageUrl ?? "",
    repositoryUrl: app.repositoryUrl,
    repositoryHost: app.repositoryHost ?? "",
    defaultBranch: app.defaultBranch ?? "",
    primaryLanguage: app.primaryLanguage ?? "",
    stars: app.stars,
    forks: app.forks,
    openIssuesCount: app.openIssuesCount,
    logoUrl: app.logoUrl ?? "",
    latestReleaseTag: app.latestReleaseTag ?? "",
    latestReleaseUrl: app.latestReleaseUrl ?? "",
    published: Boolean(app.publishedAt),
    categoryIds: app.categories.map((c) => c.categoryId),
    licenseId: app.licenses[0]?.licenseId ?? "",
    platformIds: app.platforms.map((p) => p.platformId),
    tagIds: app.tags.map((t) => t.tagId),
    alternativeIds: app.alternatives.map((a) => a.softwareId),
  };

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Applications", href: "/admin/applications" },
          { label: app.name, href: `/admin/applications/${app.id}` },
          { label: "Edit" },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight">
            Edit {app.name}
          </h1>
          <p className="text-muted-foreground">Admin-only listing updates.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/applications/${app.id}`}>Back to detail</Link>
        </Button>
      </div>

      <ApplicationEditForm
        applicationId={app.id}
        initial={initial}
        categories={categories}
        licenses={licenses}
        platforms={platforms}
        tags={tags}
        alternatives={alternatives}
      />
    </div>
  );
}
