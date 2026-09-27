import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UserRole, SubmissionStatus } from "@/generated/prisma";
import { AdminSubmissionRow } from "@/components/admin-submission-row";

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
    take: 10,
    include: { actor: { select: { email: true } } },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Moderation</h1>
        <p className="text-muted-foreground">Review pending submissions.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Queue ({queue.length})</h2>
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

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent audit log</h2>
        <ul className="divide-y rounded-lg border text-sm">
          {recentAudit.map((log) => (
            <li key={log.id} className="px-3 py-2">
              <span className="font-medium">{log.action}</span>
              <span className="text-muted-foreground">
                {" "}
                on {log.entityType}:{log.entityId}
              </span>
              <span className="text-muted-foreground">
                {" "}
                — {log.actor?.email ?? "system"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
