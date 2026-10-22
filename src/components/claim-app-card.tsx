import Link from "next/link";
import { Button } from "@/components/ui/button";

type ClaimAppCardProps = {
  appName: string;
  appSlug: string;
  claimable: boolean;
  isSignedIn: boolean;
  hasPendingClaim?: boolean;
};

export function ClaimAppCard({
  appName,
  appSlug,
  claimable,
  isSignedIn,
  hasPendingClaim,
}: ClaimAppCardProps) {
  if (!claimable) {
    return null;
  }

  const href = isSignedIn
    ? `/apps/${appSlug}/claim`
    : `/login?callbackUrl=${encodeURIComponent(`/apps/${appSlug}/claim`)}`;

  return (
    <aside
      className="rounded-xl border border-border bg-surface-muted p-6"
      aria-labelledby="claim-heading"
    >
      <h2 id="claim-heading" className="font-display text-lg font-medium">
        Claim this app
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Are you a maintainer of {appName}? Claiming lets you manage listing
        details and verification signals after we confirm repository access.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Sign in with the account linked to the repository host.</li>
        <li>
          Verify the repo with{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            .opensourceapp/verification
          </code>{" "}
          (same as app submit).
        </li>
        <li>We verify ownership and enable maintainer tools.</li>
      </ol>
      <Button asChild className="mt-6" variant="outline">
        <Link href={href}>
          {hasPendingClaim ? "View your claim" : "Start claim flow"}
        </Link>
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Maintainer claims are reviewed manually during the MVP.
      </p>
    </aside>
  );
}
