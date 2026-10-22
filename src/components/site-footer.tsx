import Link from "next/link";
import { NewsletterSubscribeForm } from "@/components/newsletter-subscribe-form";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-muted/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_minmax(0,20rem)] md:gap-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="font-display text-lg font-medium">OpenSourceApp.org</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              A curated directory for discovering open-source applications with
              clear licensing and verification signals.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-3 text-sm"
            aria-label="Footer"
          >
            <Link
              href="/apps"
              className="inline-flex min-h-10 items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Browse
            </Link>
            <Link
              href="/submit"
              className="inline-flex min-h-10 items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Submit an app
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Sign in
            </Link>
          </nav>
        </div>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">Newsletter</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Occasional updates on new listings and directory news. No spam.
            </p>
          </div>
          <NewsletterSubscribeForm />
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} OpenSourceApp.org
      </div>
    </footer>
  );
}
