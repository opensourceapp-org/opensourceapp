import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth("/dashboard");
  const submissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { application: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Your submissions</p>
        </div>
        <Link
          href="/submit"
          className="text-sm font-medium text-primary hover:underline"
        >
          New submission
        </Link>
      </div>

      {submissions.length === 0 ? (
        <p className="text-muted-foreground">No submissions yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  Updated {s.updatedAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{s.status}</Badge>
                {s.application && (
                  <Link
                    href={`/apps/${s.application.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View listing
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
