"use client";

import { useState, useTransition } from "react";
import { restoreApplicationAction } from "@/server/actions/admin-applications";
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

export function ApplicationRestoreButton({
  applicationId,
  applicationName,
  redirectTo,
  variant = "default",
  size = "sm",
}: {
  applicationId: string;
  applicationName: string;
  redirectTo?: string;
  variant?: "default" | "outline";
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmRestore() {
    setError(null);
    startTransition(async () => {
      const res = await restoreApplicationAction(applicationId);
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
          Restore
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore application?</DialogTitle>
          <DialogDescription>
            &quot;{applicationName}&quot; will return to the active list. If it
            was published before deletion, it will appear on the public site
            again.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={confirmRestore}>
            {pending ? "Restoring…" : "Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
