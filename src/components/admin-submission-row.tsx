"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { moderateSubmissionAction } from "@/server/actions/admin";

type ModerationStatus =
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

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

  function act(status: ModerationStatus) {
    startTransition(async () => {
      await moderateSubmissionAction(submission.id, status);
    });
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
          onClick={() => act("CHANGES_REQUESTED")}
        >
          Request changes
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => act("REJECTED")}
        >
          Reject
        </Button>
      </div>
    </li>
  );
}
