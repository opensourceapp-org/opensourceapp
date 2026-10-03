import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UserRole, SubmissionStatus } from "@/generated/prisma";
import { AdminSubmissionRow } from "@/components/admin-submission-row";
import { DataTable } from "@/components/admin/data-table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireRole(UserRole.MODERATOR, "/admin");

  const queue = await prisma.submission.findMany({
    where: {
      status: {
        in: [
          SubmissionStatus.SUBMITTED,
          SubmissionStatus.UNDER_REVIEW,
          SubmissionStatus.CHANGES_REQUESTED,
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, name: true } } },
  });

  const recentAudit = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { actor: { select: { email: true } } },
  });

  return (
    <div className="space-y-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Admin" },
        ]}
      />

      <div>
        <h1 className="font-display text-3xl font-normal tracking-tight">
          Moderation
        </h1>
        <p className="text-muted-foreground">
          Review pending submissions and audit recent actions.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Submission queue ({queue.length})</h2>
        {queue.length === 0 ? (
          <p className="text-sm text-muted-foreground">Queue is empty.</p>
        ) : (
          <ul className="space-y-3">
            {queue.map((s) => (
              <AdminSubmissionRow key={s.id} submission={s} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Recent audit log</h2>
        <DataTable
          getRowKey={(row) => row.id}
          rows={recentAudit}
          emptyMessage="No audit entries yet."
          columns={[
            {
              key: "action",
              header: "Action",
              cell: (log) => (
                <span className="font-medium">{log.action}</span>
              ),
            },
            {
              key: "entity",
              header: "Entity",
              cell: (log) => (
                <span className="font-mono text-xs text-muted-foreground">
                  {log.entityType}:{log.entityId}
                </span>
              ),
            },
            {
              key: "actor",
              header: "Actor",
              cell: (log) => log.actor?.email ?? "system",
            },
            {
              key: "when",
              header: "When",
              cell: (log) =>
                log.createdAt.toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                }),
              className: "whitespace-nowrap",
            },
          ]}
        />
      </section>
    </div>
  );
}
