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
import {
  ensureClaimVerificationTokenAction,
  getClaimVerificationStateAction,
  regenerateClaimVerificationTokenAction,
  verifyClaimRepositoryOwnershipAction,
} from "@/server/actions/claim-repository-verification";
import { AppIcon } from "@/components/app-icon";
import type { OssCheckLine } from "@/lib/applications/repository-oss-checks";

type Props = {
  submissionId?: string | null;
  claimId?: string | null;
  appName?: string;
  initialVerificationToken?: string | null;
  onVerifiedChange?: (verified: boolean) => void;
  onIconPreviewChange?: (iconUrl: string | null) => void;
  onScreenshotUrlsChange?: (urls: string[]) => void;
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
  submissionId = null,
  claimId = null,
  appName = "App",
  initialVerificationToken = null,
  onVerifiedChange,
  onIconPreviewChange,
  onScreenshotUrlsChange,
}: Props) {
  const [token, setToken] = useState<string | null>(initialVerificationToken);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [ossChecks, setOssChecks] = useState<OssCheckLine[]>([]);
  const [verificationPath, setVerificationPath] = useState(
    ".opensourceapp/verification",
  );
  const [logoPath, setLogoPath] = useState(".opensourceapp/app.svg");
  const [screenshotsPath, setScreenshotsPath] = useState(
    ".opensourceapp/screenshots",
  );
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const ready = Boolean(submissionId || claimId);

  useEffect(() => {
    if (initialVerificationToken) {
      setToken(initialVerificationToken);
    }
  }, [initialVerificationToken]);

  useEffect(() => {
    if (!ready) return;
    startTransition(async () => {
      if (submissionId) {
        const state = await getRepositoryVerificationStateAction(submissionId);
        if (state.data) {
          setOwnershipVerified(state.data.ownershipVerified);
          setOssChecks(state.data.ossChecks);
          setVerificationPath(state.data.verificationPath);
          setLogoPath(state.data.logoPath);
          setScreenshotsPath(state.data.screenshotsPath);
          setIconPreviewUrl(state.data.iconPreviewUrl);
          onScreenshotUrlsChange?.(state.data.screenshotUrls ?? []);
          onIconPreviewChange?.(state.data.iconPreviewUrl);
          onVerifiedChange?.(state.data.ownershipVerified);
        }
        const tokenRes = await ensureVerificationTokenAction(submissionId);
        if (tokenRes.data?.token) {
          setToken(tokenRes.data.token);
        }
        return;
      }

      if (claimId) {
        const state = await getClaimVerificationStateAction(claimId);
        if (state.data) {
          setOwnershipVerified(state.data.ownershipVerified);
          setOssChecks(state.data.ossChecks);
          setVerificationPath(state.data.verificationPath);
          setLogoPath(state.data.logoPath);
          setScreenshotsPath(state.data.screenshotsPath);
          setIconPreviewUrl(state.data.iconPreviewUrl);
          onIconPreviewChange?.(state.data.iconPreviewUrl);
          onVerifiedChange?.(state.data.ownershipVerified);
        }
        if (!initialVerificationToken) {
          const tokenRes = await ensureClaimVerificationTokenAction(claimId);
          if (tokenRes.data?.token) {
            setToken(tokenRes.data.token);
          }
        }
      }
    });
  }, [
    submissionId,
    claimId,
    ready,
    initialVerificationToken,
    onVerifiedChange,
    onIconPreviewChange,
    onScreenshotUrlsChange,
  ]);

  function verify() {
    setError(null);
    startTransition(async () => {
      if (submissionId) {
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
          setIconPreviewUrl(state.data.iconPreviewUrl);
          onIconPreviewChange?.(state.data.iconPreviewUrl);
        }
        if (res.data?.iconPreviewUrl) {
          setIconPreviewUrl(res.data.iconPreviewUrl);
          onIconPreviewChange?.(res.data.iconPreviewUrl);
        }
        if (res.data?.screenshotUrls) {
          onScreenshotUrlsChange?.(res.data.screenshotUrls);
        }
        return;
      }

      if (claimId) {
        const res = await verifyClaimRepositoryOwnershipAction(claimId);
        if (res.error) {
          setError(res.error);
          return;
        }
        setOwnershipVerified(true);
        onVerifiedChange?.(true);
        const state = await getClaimVerificationStateAction(claimId);
        if (state.data?.iconPreviewUrl) {
          setIconPreviewUrl(state.data.iconPreviewUrl);
          onIconPreviewChange?.(state.data.iconPreviewUrl);
        }
        if (res.data?.iconPreviewUrl) {
          setIconPreviewUrl(res.data.iconPreviewUrl);
          onIconPreviewChange?.(res.data.iconPreviewUrl);
        }
      }
    });
  }

  function regenerate() {
    setError(null);
    startTransition(async () => {
      if (submissionId) {
        const res = await regenerateVerificationTokenAction(submissionId);
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.data?.token) setToken(res.data.token);
        return;
      }
      if (claimId) {
        const res = await regenerateClaimVerificationTokenAction(claimId);
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.data?.token) setToken(res.data.token);
      }
    });
  }

  if (!ready) {
    return (
      <p className="text-sm text-muted-foreground">
        Continue from the previous step to save a draft before verifying your
        repository.
      </p>
    );
  }

  const verifiedMessage = claimId
    ? "Ownership verified — your claim will show verification to moderators."
    : "Ownership verified — you can continue to review and submit.";

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
            Create the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              .opensourceapp
            </code>{" "}
            folder in your repository if it does not exist yet.
          </li>
          <li>
            Add a file at{" "}
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
          {!claimId && (
            <li>
              Optional: add screenshots under{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                {screenshotsPath}/
              </code>{" "}
              (PNG, JPEG, or WebP). We import them when you verify.
            </li>
          )}
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
          <div className="space-y-3">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {verifiedMessage}
            </p>
            {iconPreviewUrl ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                <AppIcon name={appName} logoUrl={iconPreviewUrl} size="md" />
                <p className="text-sm text-muted-foreground">
                  App icon loaded from{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                    {logoPath}
                  </code>
                  .
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No repository icon found at{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                  {logoPath}
                </code>
                .
              </p>
            )}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
