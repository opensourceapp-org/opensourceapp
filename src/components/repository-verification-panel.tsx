"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ensureVerificationTokenAction,
  getRepositoryVerificationStateAction,
  regenerateVerificationTokenAction,
  verifyRepositoryOwnershipAction,
} from "@/server/actions/repository-verification";
import type { OssCheckLine } from "@/lib/applications/repository-oss-checks";

type Props = {
  submissionId: string | null;
  onVerifiedChange?: (verified: boolean) => void;
};

function StatusDot({ status }: { status: OssCheckLine["status"] }) {
  const color =
    status === "pass"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : status === "fail"
          ? "bg-destructive"
          : "bg-muted-foreground";
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}

export function RepositoryVerificationPanel({
  submissionId,
  onVerifiedChange,
}: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [ossChecks, setOssChecks] = useState<OssCheckLine[]>([]);
  const [verificationPath, setVerificationPath] = useState(
    ".opensourceapp/verification",
  );
  const [logoPath, setLogoPath] = useState(".opensourceapp/app.svg");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!submissionId) return;
    startTransition(async () => {
      const state = await getRepositoryVerificationStateAction(submissionId);
      if (state.data) {
        setOwnershipVerified(state.data.ownershipVerified);
        setOssChecks(state.data.ossChecks);
        setVerificationPath(state.data.verificationPath);
        setLogoPath(state.data.logoPath);
        onVerifiedChange?.(state.data.ownershipVerified);
      }
      const tokenRes = await ensureVerificationTokenAction(submissionId);
      if (tokenRes.data?.token) {
        setToken(tokenRes.data.token);
      }
    });
  }, [submissionId, onVerifiedChange]);

  function verify() {
    if (!submissionId) return;
    setError(null);
    startTransition(async () => {
      const res = await verifyRepositoryOwnershipAction(submissionId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOwnershipVerified(true);
      onVerifiedChange?.(true);
      const state = await getRepositoryVerificationStateAction(submissionId);
      if (state.data) {
        setOssChecks(state.data.ossChecks);
      }
    });
  }

  function regenerate() {
    if (!submissionId) return;
    setError(null);
    startTransition(async () => {
      const res = await regenerateVerificationTokenAction(submissionId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data?.token) setToken(res.data.token);
    });
  }

  if (!submissionId) {
    return (
      <p className="text-sm text-muted-foreground">
        Continue from the previous step to save a draft before verifying your
        repository.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-border bg-surface-muted p-4 text-sm">
        <p className="font-medium">Repository health (automatic)</p>
        <ul className="space-y-2">
          {ossChecks.map((line) => (
            <li key={line.id} className="flex items-start gap-2">
              <StatusDot status={line.status} />
              <div>
                <p className="font-medium">{line.label}</p>
                <p className="text-muted-foreground">{line.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <p className="font-medium">Prove repository ownership</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Create a file at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              {verificationPath}
            </code>{" "}
            on your default branch containing only your verification token.
          </li>
          <li>
            Optional: add an app icon at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              {logoPath}
            </code>{" "}
            (SVG, max 256KB).
          </li>
          <li>Click Verify below after pushing the file.</li>
        </ol>

        {token ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Your verification token</p>
            <code className="mt-1 block break-all font-mono text-sm">{token}</code>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Token was already generated. Regenerate if you need a new one.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={verify} disabled={pending}>
            {pending ? "Checking…" : "Verify repository"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={regenerate}
            disabled={pending || ownershipVerified}
          >
            Regenerate token
          </Button>
        </div>

        {ownershipVerified && (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Ownership verified — you can continue to review and submit.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
