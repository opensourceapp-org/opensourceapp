"use client";

import { useState, useTransition } from "react";
import { deleteApplicationAction } from "@/server/actions/admin-applications";
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

export function ApplicationDeleteButton({
  applicationId,
  applicationName,
  redirectTo,
  variant = "destructive",
  size = "sm",
}: {
  applicationId: string;
  applicationName: string;
  redirectTo?: string;
  variant?: "destructive" | "ghost" | "outline";
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteApplicationAction(applicationId);
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
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete application?</DialogTitle>
          <DialogDescription>
            This soft-deletes &quot;{applicationName}&quot; from public browse
            and search. The record is kept for audit purposes.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={confirmDelete}
          >
            {pending ? "Deleting…" : "Delete application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
