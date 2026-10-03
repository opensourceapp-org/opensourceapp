import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SubmissionStatusBadge } from "@/components/submission-status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth("/dashboard");
  const submissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { application: true },
  });

  const published = submissions.filter((s) => s.status === "APPROVED").length;
  const inReview = submissions.filter((s) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(s.status),
  ).length;
  const needsAction = submissions.filter((s) =>
    ["CHANGES_REQUESTED", "DRAFT", "REJECTED"].includes(s.status),
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
            {submissions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Updated {s.updatedAt.toLocaleDateString()}
                  </p>
                  {s.reviewerNotes &&
                    (s.status === "CHANGES_REQUESTED" ||
                      s.status === "REJECTED") && (
                      <div
                        className="mt-3 rounded-lg border border-border bg-surface-muted p-3 text-sm"
                        role="status"
                      >
                        <p className="font-medium text-foreground">
                          {s.status === "CHANGES_REQUESTED"
                            ? "Moderator feedback"
                            : "Rejection reason"}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          {s.reviewerNotes}
                        </p>
                      </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SubmissionStatusBadge status={s.status} />
                  {s.application && (
                    <Link
                      href={`/apps/${s.application.slug}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View listing
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
