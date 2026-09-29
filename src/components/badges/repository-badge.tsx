import { detectRepoHost, repoHostLabel } from "@/lib/repo-host";
import { cn } from "@/lib/utils";

function HostIcon({ host }: { host: ReturnType<typeof detectRepoHost> }) {
  const common = "h-3.5 w-3.5 shrink-0";
  switch (host) {
    case "github":
      return (
        <svg className={common} viewBox="0 0 16 16" aria-hidden fill="currentColor">
          <path
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
          />
        </svg>
      );
    case "gitlab":
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden fill="currentColor">
          <path
            d="m23.6 9.59-.03-.09L20.34.41a.85.85 0 0 0-.32-.4.85.85 0 0 0-.46-.13H4.44a.85.85 0 0 0-.46.13.85.85 0 0 0-.32.4L.43 9.5l-.03.09a6.07 6.07 0 0 0 2.09 7l.06.05 9.26 6.79.05.04.12.08.12-.08.05-.04 9.26-6.79.06-.05a6.07 6.07 0 0 0 2.09-7Z"
          />
        </svg>
      );
    case "codeberg":
      return (
        <svg className={common} viewBox="0 0 24 24" aria-hidden fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7 4 7h-3v4h-2z" />
        </svg>
      );
    default:
      return null;
  }
}

type RepositoryBadgeProps = {
  url: string;
  className?: string;
  showLabel?: boolean;
};

export function RepositoryBadge({
  url,
  className,
  showLabel = true,
}: RepositoryBadgeProps) {
  const host = detectRepoHost(url);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <HostIcon host={host} />
      {showLabel && <span>{repoHostLabel(host)}</span>}
    </span>
  );
}
