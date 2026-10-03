import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <p className="font-display text-lg font-medium">OpenSourceApp.org</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            A curated directory for discovering open-source applications with
            clear licensing and verification signals.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <Link
            href="/apps"
            className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Browse
          </Link>
          <Link
            href="/submit"
            className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Submit an app
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} OpenSourceApp.org
      </div>
    </footer>
  );
}
