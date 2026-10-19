import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimAppForm } from "@/components/claim-app-form";
import { ClaimRepositoryVerificationPanel } from "@/components/claim-repository-verification-panel";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  canUserSubmitClaim,
  isApplicationClaimable,
} from "@/lib/applications/claim-eligibility";
import { publishedApplicationWhere } from "@/lib/applications/visibility";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ApplicationClaimStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ claim?: string }>;

async function getApplication(slug: string) {
  return prisma.application.findFirst({
    where: { slug, ...publishedApplicationWhere() },
    select: {
      id: true,
      slug: true,
      name: true,
      ownerId: true,
      deletedAt: true,
    },
  });
}

export default async function ClaimAppPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { claim: claimIdParam } = await searchParams;
  const session = await requireAuth(`/apps/${slug}/claim`);
  const app = await getApplication(slug);
  if (!app) notFound();

  if (!isApplicationClaimable(app)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4">
        <Breadcrumbs
          items={[
            { label: "Apps", href: "/apps" },
            { label: app.name, href: `/apps/${slug}` },
            { label: "Claim" },
          ]}
        />
        <h1 className="font-display text-2xl font-medium">Listing claimed</h1>
        <p className="text-muted-foreground">
          This app already has a verified maintainer on file.
        </p>
        <Button asChild variant="outline">
          <Link href={`/apps/${slug}`}>Back to app</Link>
        </Button>
      </div>
    );
  }

  const userClaims = await prisma.applicationClaim.findMany({
    where: { applicationId: app.id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const pendingClaim =
    userClaims.find((c) => c.status === ApplicationClaimStatus.PENDING) ??
    (claimIdParam
      ? userClaims.find((c) => c.id === claimIdParam) ?? null
      : null);

  const canSubmit = canUserSubmitClaim({
    application: app,
    userId: session.user.id,
    userClaims,
  }).ok;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Apps", href: "/apps" },
          { label: app.name, href: `/apps/${slug}` },
          { label: "Claim" },
        ]}
      />
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-medium">Claim {app.name}</h1>
        <p className="text-muted-foreground text-sm">
          Tell us how you maintain this project. We review every claim before
          granting listing access.
        </p>
      </header>

      {pendingClaim ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-4 text-sm">
            <p className="font-medium">Claim status: Pending review</p>
            <p className="mt-1 text-muted-foreground">
              Submitted {pendingClaim.createdAt.toLocaleString()}. You can still
              verify the repository while we review.
            </p>
          </div>
          {pendingClaim.status === ApplicationClaimStatus.PENDING && (
            <ClaimRepositoryVerificationPanel
              claimId={pendingClaim.id}
              appName={app.name}
            />
          )}
          <Button asChild variant="outline">
            <Link href="/dashboard">View on dashboard</Link>
          </Button>
        </div>
      ) : canSubmit ? (
        <ClaimAppForm applicationId={app.id} applicationSlug={app.slug} />
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            You cannot submit a new claim for this listing right now.
          </p>
          <Button asChild variant="outline">
            <Link href={`/apps/${slug}`}>Back to app</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
