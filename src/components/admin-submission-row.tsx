"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { moderateSubmissionAction } from "@/server/actions/admin";

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
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    });
  }

  function submitFeedback() {
    if (!feedbackAction) return;
    act(feedbackAction, message);
  }

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
        </div>
      )}
      {!feedbackAction && error && (
        <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>
      )}
    </li>
  );
}
