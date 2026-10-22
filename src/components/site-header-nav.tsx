"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { UserAvatar } from "@/components/user-avatar";
import { userDisplayName } from "@/lib/user-display";
import { cn } from "@/lib/utils";

const navLink =
  "inline-flex min-h-10 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const mobileNavLink =
  "flex min-h-11 items-center rounded-md px-3 text-base text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type SiteHeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type SiteHeaderNavProps = {
  showAdmin: boolean;
  user: SiteHeaderUser | null;
  signOutButton: React.ReactNode;
};

export function SiteHeaderNav({
  showAdmin,
  user,
  signOutButton,
}: SiteHeaderNavProps) {
  const displayName = user ? userDisplayName(user) : null;

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {user ? (
        <>
          <Link
            href="/dashboard"
            className={cn(
              navLink,
              "hidden max-w-[11rem] gap-2 text-foreground sm:inline-flex",
            )}
          >
            <UserAvatar
              name={user.name}
              email={user.email}
              image={user.image}
            />
            <span className="truncate">{displayName}</span>
          </Link>
          <div className="hidden sm:block">{signOutButton}</div>
        </>
      ) : (
        <Button asChild size="sm" className="hidden min-h-10 sm:inline-flex">
          <Link href="/login">Sign in</Link>
        </Button>
      )}

      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 sm:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex w-[min(100vw-2rem,20rem)] flex-col"
        >
          <SheetHeader>
            <SheetTitle className="font-display text-left">Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
            <Link href="/apps" className={mobileNavLink}>
              Browse
            </Link>
            <Link href="/submit" className={mobileNavLink}>
              Submit
            </Link>
            {showAdmin && (
              <Link href="/admin" className={mobileNavLink}>
                Admin
              </Link>
            )}
          </nav>
          <div className="mt-6 border-t border-border pt-6">
            {user ? (
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  className="flex min-h-11 items-center gap-3 rounded-md px-3 hover:bg-muted"
                >
                  <UserAvatar
                    name={user.name}
                    email={user.email}
                    image={user.image}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{displayName}</p>
                    {user.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </Link>
                {signOutButton}
              </div>
            ) : (
              <Button asChild className="min-h-11 w-full">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
