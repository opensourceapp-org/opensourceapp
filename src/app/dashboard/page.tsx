import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { ModeratorFeedbackBanner } from "@/components/moderator-feedback-banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SubmissionDeleteButton } from "@/components/submission-delete-button";
import { visibleSubmissionStatuses } from "@/lib/applications/submission-queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth("/dashboard");
  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      status: { in: visibleSubmissionStatuses },
    },
    orderBy: { updatedAt: "desc" },
    include: { application: true },
  });

  const published = submissions.filter((s) => s.status === "APPROVED").length;
  const inReview = submissions.filter((s) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(s.status),
  ).length;
  const needsAction = submissions.filter((s) =>
    ["CHANGES_REQUESTED", "DRAFT"].includes(s.status),
  ).length;

  return (
    <div className="space-y-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Dashboard" },
        ]}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your submissions and listings.
          </p>
        </div>
        <Button asChild>
          <Link href="/submit">New submission</Link>
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="mt-1 text-2xl font-semibold">{published}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">In review</p>
          <p className="mt-1 text-2xl font-semibold">{inReview}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">Needs your action</p>
          <p className="mt-1 text-2xl font-semibold">{needsAction}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">My submissions</h2>
        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Submit an open-source app to add it to the directory."
            action={
              <Button asChild>
                <Link href="/submit">Submit an app</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {submissions.map((s) => {
              const showFeedback =
                s.reviewerNotes &&
                (s.status === "CHANGES_REQUESTED" || s.status === "REJECTED");
              const canEdit =
                s.status === "CHANGES_REQUESTED" || s.status === "DRAFT";

              return (
                <li key={s.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Updated {s.updatedAt.toLocaleDateString()}
                        {s.reviewedAt &&
                          (s.status === "CHANGES_REQUESTED" ||
                            s.status === "REJECTED") &&
                          ` · Reviewed ${s.reviewedAt.toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <SubmissionStatusBadge status={s.status} />
                      {canEdit && (
                        <Link
                          href={`/submit/${s.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {s.status === "CHANGES_REQUESTED"
                            ? "Update & resubmit"
                            : "Continue draft"}
                        </Link>
                      )}
                      {s.application && (
                        <Link
                          href={`/apps/${s.application.slug}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View listing
                        </Link>
                      )}
                      <SubmissionDeleteButton
                        submissionId={s.id}
                        submissionName={s.name}
                      />
                    </div>
                  </div>
                  {showFeedback && (
                    <ModeratorFeedbackBanner
                      className="mt-3"
                      status={s.status}
                      message={s.reviewerNotes!}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
