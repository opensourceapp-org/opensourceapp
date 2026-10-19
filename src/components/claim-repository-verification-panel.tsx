"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  ensureClaimVerificationTokenAction,
  getClaimVerificationStateAction,
  regenerateClaimVerificationTokenAction,
  verifyClaimRepositoryOwnershipAction,
} from "@/server/actions/claim-repository-verification";
import { AppIcon } from "@/components/app-icon";

type Props = {
  claimId: string;
  appName: string;
};

export function ClaimRepositoryVerificationPanel({ claimId, appName }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [verificationPath, setVerificationPath] = useState(
    ".opensourceapp/verification",
  );
  const [logoPath, setLogoPath] = useState(".opensourceapp/app.svg");
  const [repositoryUrl, setRepositoryUrl] = useState<string | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const state = await getClaimVerificationStateAction(claimId);
      if (state.data) {
        setOwnershipVerified(state.data.ownershipVerified);
        setVerificationPath(state.data.verificationPath);
        setLogoPath(state.data.logoPath);
        setRepositoryUrl(state.data.repositoryUrl);
        setIconPreviewUrl(state.data.iconPreviewUrl);
      }
      const tokenRes = await ensureClaimVerificationTokenAction(claimId);
      if (tokenRes.data?.token) {
        setToken(tokenRes.data.token);
      }
    });
  }, [claimId]);

  function verify() {
    setError(null);
    startTransition(async () => {
      const res = await verifyClaimRepositoryOwnershipAction(claimId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOwnershipVerified(true);
      const state = await getClaimVerificationStateAction(claimId);
      if (state.data?.iconPreviewUrl) {
        setIconPreviewUrl(state.data.iconPreviewUrl);
      }
      if (res.data?.iconPreviewUrl) {
        setIconPreviewUrl(res.data.iconPreviewUrl);
      }
    });
  }

  function regenerate() {
    setError(null);
    startTransition(async () => {
      const res = await regenerateClaimVerificationTokenAction(claimId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data?.token) setToken(res.data.token);
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface-muted p-4 text-sm">
      <p className="font-medium">Verify repository ownership (recommended)</p>
      <p className="text-muted-foreground">
        Add a file at{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          {verificationPath}
        </code>{" "}
        in{" "}
        {repositoryUrl ? (
          <a
            href={repositoryUrl}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            the source repository
          </a>
        ) : (
          "the source repository"
        )}{" "}
        containing your one-time token. Optionally add{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{logoPath}</code>{" "}
        for {appName}&apos;s listing icon.
      </p>

      {ownershipVerified ? (
        <p className="font-medium text-primary">✓ Repository ownership verified</p>
      ) : token ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Your verification token</p>
          <code className="block break-all rounded border border-border bg-background p-2 text-xs">
            {token}
          </code>
        </div>
      ) : (
        <p className="text-muted-foreground">
          Generate or regenerate a token to continue verification.
        </p>
      )}

      {iconPreviewUrl && (
        <div className="flex items-center gap-3">
          <AppIcon name={appName} logoUrl={iconPreviewUrl} size="md" />
          <span className="text-muted-foreground">Icon preview from repo</span>
        </div>
      )}

      {error && <p className="text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {!ownershipVerified && (
          <>
            <Button type="button" size="sm" onClick={verify} disabled={pending}>
              Check verification file
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={regenerate}
              disabled={pending}
            >
              Regenerate token
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
