"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RepositoryVerificationPanel } from "@/components/repository-verification-panel";
import {
  ensureApplicationClaimAction,
  updateApplicationClaimEvidenceAction,
} from "@/server/actions/application-claims";

type Props = {
  applicationId: string;
  applicationSlug: string;
  appName: string;
  initialClaimId?: string | null;
};

export function ClaimVerificationFlow({
  applicationId,
  applicationSlug,
  appName,
  initialClaimId,
}: Props) {
  const [claimId, setClaimId] = useState<string | null>(initialClaimId ?? null);
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null,
  );
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [evidenceSaved, setEvidenceSaved] = useState(false);

  useEffect(() => {
    if (claimId) return;
    startTransition(async () => {
      const res = await ensureApplicationClaimAction(applicationId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.claimId) setClaimId(res.claimId);
      if (res.token) setVerificationToken(res.token);
    });
  }, [applicationId, claimId]);

  function saveEvidence(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!claimId) return;
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateApplicationClaimEvidenceAction({
        claimId,
        evidenceMessage: String(form.get("evidenceMessage") ?? ""),
        evidenceUrl: String(form.get("evidenceUrl") ?? ""),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      setEvidenceSaved(true);
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-medium">
          Step 1 — Verify the repository
        </h2>
        <p className="text-sm text-muted-foreground">
          Use the same{" "}
          <code className="rounded bg-muted px-1 py-0.5">.opensourceapp/</code>{" "}
          verification flow as submitting a new app: create the folder, add the
          verification file with your one-time token, then verify.
        </p>
        {error && !claimId && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}
        {claimId ? (
          <RepositoryVerificationPanel
            claimId={claimId}
            appName={appName}
            initialVerificationToken={verificationToken}
            onVerifiedChange={setOwnershipVerified}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {pending ? "Preparing your claim…" : "Loading…"}
          </p>
        )}
      </section>

      {claimId && (
        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-medium">
            Step 2 — Optional context for moderators
          </h2>
          <p className="text-sm text-muted-foreground">
            Repository verification is the main proof. Add a short note only if
            it helps reviewers (org role, rename history, etc.).
          </p>
          <form onSubmit={saveEvidence} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evidenceMessage">
                Note{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="evidenceMessage"
                name="evidenceMessage"
                rows={3}
                placeholder="Anything else we should know…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidenceUrl">
                Link{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="evidenceUrl"
                name="evidenceUrl"
                type="url"
                placeholder="https://…"
              />
            </div>
            {error && claimId && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            )}
            {evidenceSaved && (
              <p className="text-sm text-primary">Saved.</p>
            )}
            <Button type="submit" variant="outline" disabled={pending}>
              Save note
            </Button>
          </form>
        </section>
      )}

      {claimId && (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">View on dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/apps/${applicationSlug}`}>Back to listing</Link>
          </Button>
        </div>
      )}

      {ownershipVerified && (
        <p className="text-sm text-muted-foreground">
          Your claim stays <strong>pending</strong> until a moderator approves
          it. Verification is stored on the claim record for admin review.
        </p>
      )}
    </div>
  );
}
