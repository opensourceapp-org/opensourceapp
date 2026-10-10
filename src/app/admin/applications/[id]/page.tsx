import Link from "next/link";
import { notFound } from "next/navigation";
import { VerificationSignalsList } from "@/components/verification-signals-list";
import { ApplicationDeleteButton } from "@/components/admin/application-delete-button";
import {
  getAdminApplicationDetail,
  requireAdminApplicationsPage,
} from "@/server/actions/admin-applications";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Params;
}) {
  await requireAdminApplicationsPage();
  const { id } = await params;
  const app = await getAdminApplicationDetail(id);
  if (!app) notFound();

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Applications", href: "/admin/applications" },
          { label: app.name },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-normal tracking-tight">
            {app.name}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{app.slug}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={app.publishedAt ? "default" : "outline"}>
              {app.publishedAt ? "Published" : "Draft"}
            </Badge>
            {app.primaryLanguage && (
              <Badge variant="outline">{app.primaryLanguage}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/applications/${app.id}/edit`}>Edit</Link>
          </Button>
          {app.publishedAt && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/apps/${app.slug}`} target="_blank">
                Public page
              </Link>
            </Button>
          )}
          <ApplicationDeleteButton
            applicationId={app.id}
            applicationName={app.name}
            redirectTo="/admin/applications"
          />
        </div>
      </div>

      {app.tagline && (
        <p className="text-lg text-muted-foreground">{app.tagline}</p>
      )}

      <section className="space-y-3 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-medium">Description</h2>
        <p className="whitespace-pre-wrap text-sm">{app.description}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium">URLs</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Repository</dt>
              <dd className="break-all font-mono">{app.repositoryUrl}</dd>
            </div>
            {app.homepageUrl && (
              <div>
                <dt className="text-muted-foreground">Homepage</dt>
                <dd className="break-all">{app.homepageUrl}</dd>
              </div>
            )}
            {app.logoUrl && (
              <div>
                <dt className="text-muted-foreground">Logo</dt>
                <dd className="break-all">{app.logoUrl}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium">Repository metadata</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Host</dt>
              <dd>{app.repositoryHost ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Branch</dt>
              <dd>{app.defaultBranch ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stars</dt>
              <dd>{app.stars ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Forks</dt>
              <dd>{app.forks ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Open issues</dt>
              <dd>{app.openIssuesCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last commit</dt>
              <dd>
                {app.lastCommitAt
                  ? app.lastCommitAt.toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium">Taxonomy</h2>
          <ul className="list-inside list-disc text-sm">
            <li>
              Categories:{" "}
              {app.categories.map((c) => c.category.name).join(", ") || "—"}
            </li>
            <li>
              Platforms:{" "}
              {app.platforms.map((p) => p.platform.name).join(", ") || "—"}
            </li>
            <li>
              Licenses:{" "}
              {app.licenses.map((l) => l.license.name).join(", ") || "—"}
            </li>
            <li>
              Tags: {app.tags.map((t) => t.tag.name).join(", ") || "—"}
            </li>
            <li>
              Alternatives:{" "}
              {app.alternatives.map((a) => a.software.name).join(", ") || "—"}
            </li>
          </ul>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium">Provenance</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Submitted by</dt>
              <dd>
                {app.submittedBy
                  ? `${app.submittedBy.name ?? "—"} (${app.submittedBy.email})`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Published at</dt>
              <dd>
                {app.publishedAt
                  ? app.publishedAt.toLocaleString()
                  : "Not published"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created / updated</dt>
              <dd>
                {app.createdAt.toLocaleString()} /{" "}
                {app.updatedAt.toLocaleString()}
              </dd>
            </div>
            {app.latestReleaseTag && (
              <div>
                <dt className="text-muted-foreground">Latest release</dt>
                <dd>
                  {app.latestReleaseTag}
                  {app.latestReleaseAt &&
                    ` (${app.latestReleaseAt.toLocaleDateString()})`}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {app.signals.length > 0 && (
        <section className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium">Verification signals</h2>
          <VerificationSignalsList signals={app.signals} />
        </section>
      )}
    </div>
  );
}
