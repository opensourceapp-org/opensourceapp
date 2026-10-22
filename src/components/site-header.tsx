import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { isModerator } from "@/lib/auth/rbac";
import type { UserRole } from "@/generated/prisma";
import { SiteHeaderNav } from "@/components/site-header-nav";

const navLink =
  "inline-flex min-h-10 items-center rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export async function SiteHeader() {
  const session = await auth();
  const showAdmin =
    Boolean(session?.user) &&
    isModerator((session!.user!.role as UserRole) ?? "USER");

  const signOutButton = (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
      className="w-full sm:w-auto"
    >
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="min-h-10 w-full sm:w-auto"
      >
        Sign out
      </Button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 min-h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <Link
            href="/"
            className="shrink-0 font-display text-lg font-medium tracking-tight text-foreground"
          >
            OpenSourceApp
          </Link>
          <nav
            className="hidden items-center gap-4 sm:flex"
            aria-label="Main"
          >
            <Link href="/apps" className={navLink}>
              Browse
            </Link>
            <Link href="/submit" className={navLink}>
              Submit
            </Link>
            {showAdmin && (
              <Link href="/admin" className={navLink}>
                Admin
              </Link>
            )}
          </nav>
        </div>
        <SiteHeaderNav
          showAdmin={showAdmin}
          user={
            session?.user
              ? {
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image,
                }
              : null
          }
          signOutButton={signOutButton}
        />
      </div>
    </header>
  );
}
