import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { isModerator } from "@/lib/auth/rbac";
import type { UserRole } from "@/generated/prisma";
import { cn } from "@/lib/utils";

const navLink =
  "text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <nav className="flex items-center gap-5" aria-label="Main">
          <Link
            href="/"
            className="font-display text-lg font-medium tracking-tight text-foreground"
          >
            OpenSourceApp
          </Link>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/apps" className={navLink}>
              Browse
            </Link>
            <Link href="/submit" className={navLink}>
              Submit
            </Link>
            {session?.user &&
              isModerator((session.user.role as UserRole) ?? "USER") && (
                <Link href="/admin" className={navLink}>
                  Admin
                </Link>
              )}
          </div>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/dashboard" className={cn(navLink, "hidden sm:inline")}>
                Dashboard
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
