import Link from "next/link";
import { Button } from "@/components/ui/button";

type ClaimAppCardProps = {
  appName: string;
};

export function ClaimAppCard({ appName }: ClaimAppCardProps) {
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
        <li>Submit a claim request from your dashboard.</li>
        <li>We verify ownership and enable maintainer tools.</li>
      </ol>
      <Button asChild className="mt-6" variant="outline">
        <Link href="/login">Start claim flow</Link>
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Maintainer claims are reviewed manually during the MVP.
      </p>
    </aside>
  );
}
