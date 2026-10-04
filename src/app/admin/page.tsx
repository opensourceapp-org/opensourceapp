import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UserRole, SubmissionStatus } from "@/generated/prisma";
import { AdminSubmissionRow } from "@/components/admin-submission-row";
import { DataTable } from "@/components/admin/data-table";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  auditStatusDetail,
  parseAuditMetadata,
} from "@/lib/admin/audit-display";

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
    take: 25,
    include: { actor: { select: { email: true, name: true } } },
  });

  const submissionIds = recentAudit
    .filter((log) => log.entityType === "Submission")
    .map((log) => log.entityId);

  const submissions =
    submissionIds.length > 0
      ? await prisma.submission.findMany({
          where: { id: { in: submissionIds } },
          select: {
            id: true,
            name: true,
            user: { select: { email: true, name: true } },
          },
        })
      : [];

  const submissionById = new Map(submissions.map((s) => [s.id, s]));

  type AuditRow = (typeof recentAudit)[number] & {
    submissionName: string | null;
    submitterEmail: string | null;
    submitterName: string | null;
  };

  const auditRows: AuditRow[] = recentAudit.map((log) => {
    const meta = parseAuditMetadata(log.metadata);
    const sub =
      log.entityType === "Submission"
        ? submissionById.get(log.entityId)
        : undefined;
    return {
      ...log,
      submissionName: meta.submissionName ?? sub?.name ?? null,
      submitterEmail: meta.submitterEmail ?? sub?.user.email ?? null,
      submitterName: meta.submitterName ?? sub?.user.name ?? null,
    };
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
          rows={auditRows}
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
              key: "submission",
              header: "Submission",
              cell: (log) =>
                log.submissionName ?? (
                  <span className="font-mono text-xs text-muted-foreground">
                    {log.entityType}:{log.entityId.slice(0, 8)}…
                  </span>
                ),
            },
            {
              key: "submitter",
              header: "Requestor",
              cell: (log) => {
                if (!log.submitterEmail) {
                  return <span className="text-muted-foreground">—</span>;
                }
                return (
                  <div className="min-w-[10rem]">
                    {log.submitterName && (
                      <p className="text-sm">{log.submitterName}</p>
                    )}
                    <p className="font-mono text-xs text-muted-foreground">
                      {log.submitterEmail}
                    </p>
                  </div>
                );
              },
            },
            {
              key: "detail",
              header: "Detail",
              cell: (log) => {
                const status = auditStatusDetail(log.metadata);
                const snippet = parseAuditMetadata(log.metadata).messageSnippet;
                return (
                  <div className="max-w-xs text-sm text-muted-foreground">
                    {status && <p>{status}</p>}
                    {snippet && (
                      <p className="mt-1 line-clamp-2 italic">
                        &ldquo;{snippet}&rdquo;
                      </p>
                    )}
                    {!status && !snippet && "—"}
                  </div>
                );
              },
            },
            {
              key: "actor",
              header: "Moderator",
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
