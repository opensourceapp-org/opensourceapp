import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { getUpdateHighlight } from "@/lib/applications/update-highlight";
import type { ApplicationUpdateFields } from "@/lib/applications/update-highlight";

type RowApp = ApplicationUpdateFields & {
  tagline?: string | null;
  logoUrl?: string | null;
};

export function RecentUpdateRow({ app }: { app: RowApp }) {
  const highlight = getUpdateHighlight(app);

  return (
    <Link
      href={`/apps/${app.slug}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <AppIcon name={app.name} logoUrl={app.logoUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{app.name}</p>
        <p className="text-sm text-muted-foreground">
          {highlight.reason}
          <span aria-hidden> · </span>
          <span>{highlight.detail}</span>
        </p>
      </div>
    </Link>
  );
}
