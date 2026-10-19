"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { moderateApplicationClaimAction } from "@/server/actions/application-claims";
import { ApplicationClaimStatus } from "@/generated/prisma";

export type AdminClaimRowData = {
  id: string;
  createdAt: Date;
  evidenceMessage: string | null;
  evidenceUrl: string | null;
  verifiedAt: Date | null;
  application: {
    slug: string;
    name: string;
    repositoryUrl: string;
  };
  user: {
    email: string;
    name: string | null;
  };
};

export function AdminClaimRow({ claim }: { claim: AdminClaimRowData }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function moderate(next: ApplicationClaimStatus) {
    setError(null);
    startTransition(async () => {
      const res = await moderateApplicationClaimAction(claim.id, next, notes);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNotes("");
      router.refresh();
    });
  }

  return (
    <li className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            <Link
              href={`/apps/${claim.application.slug}`}
              className="hover:underline"
            >
              {claim.application.name}
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Claimant: {claim.user.name ?? claim.user.email} ({claim.user.email})
          </p>
          <p className="text-xs text-muted-foreground">
            Submitted {claim.createdAt.toLocaleString()}
            {claim.verifiedAt ? " · Repository verified" : ""}
          </p>
        </div>
        <a
          href={claim.application.repositoryUrl}
          className="text-xs text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Repository
        </a>
      </div>
      {claim.evidenceMessage && (
        <p className="text-sm whitespace-pre-wrap">{claim.evidenceMessage}</p>
      )}
      {claim.evidenceUrl && (
        <a
          href={claim.evidenceUrl}
          className="text-sm text-primary hover:underline break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          {claim.evidenceUrl}
        </a>
      )}
      <Textarea
        placeholder="Reviewer notes (required to reject)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => moderate(ApplicationClaimStatus.APPROVED)}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => moderate(ApplicationClaimStatus.REJECTED)}
        >
          Reject
        </Button>
      </div>
    </li>
  );
}
