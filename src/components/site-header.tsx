import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { isModerator } from "@/lib/auth/rbac";
import type { UserRole } from "@/generated/prisma";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            OpenSourceApp
          </Link>
          <Link href="/apps" className="text-muted-foreground hover:text-foreground">
            Browse
          </Link>
          <Link
            href="/submit"
            className="text-muted-foreground hover:text-foreground"
          >
            Submit
          </Link>
          {session?.user &&
            isModerator((session.user.role as UserRole) ?? "USER") && (
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
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
