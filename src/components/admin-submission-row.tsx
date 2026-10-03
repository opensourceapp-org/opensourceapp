"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { moderateSubmissionAction } from "@/server/actions/admin";
import {
  MODERATOR_FEEDBACK_MAX,
  MODERATOR_FEEDBACK_MIN,
} from "@/lib/validation/moderation";

type ModerationStatus =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

type FeedbackAction = "CHANGES_REQUESTED" | "REJECTED";

type RowProps = {
  submission: {
    id: string;
    name: string;
    status: string;
    repositoryUrl: string;
    user: { email: string; name: string | null };
  };
};

export function AdminSubmissionRow({ submission }: RowProps) {
  const [pending, startTransition] = useTransition();
  const [feedbackAction, setFeedbackAction] = useState<FeedbackAction | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  function act(status: ModerationStatus, notes?: string) {
    setError(null);
    startTransition(async () => {
      const res = await moderateSubmissionAction(
        submission.id,
        status,
        notes,
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      setFeedbackAction(null);
      setFeedback("");
    });
  }

  function submitFeedback() {
    const trimmed = feedback.trim();
    if (trimmed.length < MODERATOR_FEEDBACK_MIN) {
      setError(
        `Enter at least ${MODERATOR_FEEDBACK_MIN} characters of feedback for the submitter.`,
      );
      return;
    }
    if (!feedbackAction) return;
    act(feedbackAction, trimmed);
  }

  const feedbackLabel =
    feedbackAction === "REJECTED"
      ? "Reason for rejection"
      : "Changes requested";

  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{submission.name}</p>
          <p className="text-sm text-muted-foreground">
            {submission.user.name ?? submission.user.email}
          </p>
          <a
            href={submission.repositoryUrl}
            className="text-sm text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Repository
          </a>
        </div>
        <Badge variant="outline">{submission.status}</Badge>
      </div>

      {feedbackAction ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface-muted p-4">
          <div className="space-y-2">
            <Label htmlFor={`feedback-${submission.id}`}>{feedbackLabel}</Label>
            <Textarea
              id={`feedback-${submission.id}`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              maxLength={MODERATOR_FEEDBACK_MAX}
              placeholder="Explain what the submitter should fix or why this was rejected."
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              Required ({MODERATOR_FEEDBACK_MIN}–{MODERATOR_FEEDBACK_MAX}{" "}
              characters). The submitter will see this in their dashboard.
            </p>
          </div>
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
              {feedbackAction === "REJECTED"
                ? "Confirm rejection"
                : "Send change request"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setFeedbackAction(null);
                setFeedback("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => act("UNDER_REVIEW")}
          >
            Start review
          </Button>
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
              setError(null);
              setFeedbackAction("CHANGES_REQUESTED");
            }}
          >
            Request changes
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              setError(null);
              setFeedbackAction("REJECTED");
            }}
          >
            Reject
          </Button>
        </div>
      )}

      {!feedbackAction && error && (
        <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>
      )}
    </li>
  );
}
