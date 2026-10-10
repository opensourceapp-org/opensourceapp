"use client";

import { useState, useTransition } from "react";
import {
  publishApplicationAction,
  unpublishApplicationAction,
} from "@/server/actions/admin-applications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ApplicationPublishButton({
  applicationId,
  applicationName,
  published,
  redirectTo,
  variant = "outline",
  size = "sm",
}: {
  applicationId: string;
  applicationName: string;
  published: boolean;
  redirectTo?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const actionLabel = published ? "Unpublish" : "Publish";
  const title = published ? "Unpublish application?" : "Publish application?";
  const description = published
    ? `"${applicationName}" will be hidden from the public directory, search, and sitemap until published again.`
    : `"${applicationName}" will appear on the public directory, search, and sitemap.`;

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = published
        ? await unpublishApplicationAction(applicationId)
        : await publishApplicationAction(applicationId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          {actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={confirm}>
            {pending ? "Working…" : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
