"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LicenseBadge } from "@/components/badges/license-badge";
import { licenseSlugFromRepoMetadataJson } from "@/lib/applications/repo-metadata";
import { moderateSubmissionAction } from "@/server/actions/admin";
import { cn } from "@/lib/utils";

type ModerationStatus =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

type FeedbackAction = "CHANGES_REQUESTED" | "REJECTED";

type LicenseOption = { slug: string; name: string; spdxId: string | null };

type RowProps = {
  licenses: LicenseOption[];
  submission: {
    id: string;
    name: string;
    tagline: string | null;
    description: string;
    status: string;
    homepageUrl: string | null;
    repositoryUrl: string;
    repositoryHost: string | null;
    stars: number | null;
    forks: number | null;
    primaryLanguage: string | null;
    repoMetadataJson: unknown;
    user: { email: string; name: string | null };
  };
};

function formatHostLabel(host: string | null): string | null {
  if (!host) return null;
  if (host === "github") return "GitHub";
  if (host === "gitlab") return "GitLab";
  return host;
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export function AdminSubmissionRow({ submission, licenses }: RowProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedbackAction, setFeedbackAction] = useState<FeedbackAction | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const status = submission.status;
  const canStartReview = status === "SUBMITTED";
  const canDecide = status === "UNDER_REVIEW";
  const awaitingResubmit = status === "CHANGES_REQUESTED";

  const licenseSlug = licenseSlugFromRepoMetadataJson(
    submission.repoMetadataJson,
  );
  const licenseRecord = licenseSlug
    ? licenses.find((l) => l.slug === licenseSlug)
    : undefined;
  const hostLabel = formatHostLabel(submission.repositoryHost);
  const descriptionLong = submission.description.length > 280;

  function act(status: ModerationStatus, reviewerNotes?: string) {
    setError(null);
    startTransition(async () => {
      const res = await moderateSubmissionAction(
        submission.id,
        status,
        reviewerNotes,
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      setFeedbackAction(null);
      setMessage("");
      router.refresh();
    });
  }

  function submitFeedback() {
    if (!feedbackAction) return;
    act(feedbackAction, message);
  }

  return (
    <li className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{submission.name}</p>
          {submission.tagline ? (
            <p className="text-sm text-muted-foreground">{submission.tagline}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {submission.user.name ? (
              <>
                {submission.user.name}
                <span className="text-muted-foreground/80"> · </span>
              </>
            ) : null}
            <span className="font-mono text-xs">{submission.user.email}</span>
          </p>
        </div>
        <Badge variant="outline">{submission.status}</Badge>
      </div>

      <div className="mt-4 space-y-4 border-t border-border pt-4">
        <DetailField label="Description">
          <p
            className={cn(
              "whitespace-pre-wrap text-muted-foreground",
              !descriptionExpanded && descriptionLong && "line-clamp-4",
            )}
          >
            {submission.description}
          </p>
          {descriptionLong && (
            <button
              type="button"
              className="mt-1 text-xs font-medium text-primary hover:underline"
              onClick={() => setDescriptionExpanded((v) => !v)}
            >
              {descriptionExpanded ? "Show less" : "Show full description"}
            </button>
          )}
        </DetailField>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="License">
            {licenseRecord ? (
              <LicenseBadge
                name={licenseRecord.name}
                spdxId={licenseRecord.spdxId}
              />
            ) : licenseSlug ? (
              <span className="font-mono text-xs text-muted-foreground">
                {licenseSlug}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailField>

          <DetailField label="Primary language">
            {submission.primaryLanguage ? (
              <Badge variant="outline" className="font-normal">
                {submission.primaryLanguage}
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailField>

          <DetailField label="Repository host">
            {hostLabel ? (
              <span>{hostLabel}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailField>

          <DetailField label="Homepage">
            {submission.homepageUrl ? (
              <a
                href={submission.homepageUrl}
                className="break-all text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {submission.homepageUrl}
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailField>

          <DetailField label="Repository">
            <a
              href={submission.repositoryUrl}
              className="break-all text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {submission.repositoryUrl}
            </a>
          </DetailField>

          <DetailField label="Stars / forks">
            {submission.stars != null || submission.forks != null ? (
              <span className="font-mono text-muted-foreground">
                {submission.stars != null
                  ? `★ ${submission.stars.toLocaleString()}`
                  : "★ —"}
                <span className="text-muted-foreground/80"> · </span>
                {submission.forks != null
                  ? `${submission.forks.toLocaleString()} forks`
                  : "— forks"}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </DetailField>
        </div>
      </div>

      {feedbackAction ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface-muted p-4">
          <div>
            <Label htmlFor={`feedback-${submission.id}`}>
              Message to submitter
              {feedbackAction === "CHANGES_REQUESTED"
                ? " (required)"
                : " — rejection reason (required)"}
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              This appears on their dashboard. Be specific about what to change.
            </p>
          </div>
          <Textarea
            id={`feedback-${submission.id}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="e.g. Add an SPDX license identifier, fix the homepage URL, and expand the description to explain what the app does."
            disabled={pending}
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={
                feedbackAction === "REJECTED" ? "destructive" : "default"
              }
              disabled={pending}
              onClick={submitFeedback}
            >
              {feedbackAction === "CHANGES_REQUESTED"
                ? "Send change request"
                : "Confirm rejection"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setFeedbackAction(null);
                setMessage("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {canStartReview && (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => act("UNDER_REVIEW")}
            >
              Start review
            </Button>
          )}
          {canDecide && (
            <>
              <Button
                size="sm"
                disabled={pending}
                onClick={() => act("APPROVED")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setFeedbackAction("CHANGES_REQUESTED");
                  setError(null);
                }}
              >
                Request changes
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => {
                  setFeedbackAction("REJECTED");
                  setError(null);
                }}
              >
                Reject
              </Button>
            </>
          )}
          {awaitingResubmit && (
            <p className="text-sm text-muted-foreground">
              Waiting for the submitter to update and resubmit.
            </p>
          )}
        </div>
      )}
      {!feedbackAction && error && (
        <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>
      )}
    </li>
  );
}
