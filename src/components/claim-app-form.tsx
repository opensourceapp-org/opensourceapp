"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitApplicationClaimAction } from "@/server/actions/application-claims";

type Props = {
  applicationId: string;
  applicationSlug: string;
};

export function ClaimAppForm({ applicationId, applicationSlug }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitApplicationClaimAction({
        applicationId,
        evidenceMessage: String(form.get("evidenceMessage") ?? ""),
        evidenceUrl: String(form.get("evidenceUrl") ?? ""),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/apps/${applicationSlug}/claim?claim=${res.claimId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="evidenceMessage">How can we confirm you&apos;re a maintainer?</Label>
        <Textarea
          id="evidenceMessage"
          name="evidenceMessage"
          placeholder="e.g. I'm listed as an admin on the GitHub org, or link your profile…"
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="evidenceUrl">Proof link (optional)</Label>
        <Input
          id="evidenceUrl"
          name="evidenceUrl"
          type="url"
          placeholder="https://github.com/org/repo/settings/access"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        Submit claim for review
      </Button>
    </form>
  );
}
