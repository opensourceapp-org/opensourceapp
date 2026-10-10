"use client";

import { useState, useTransition } from "react";
import {
  deleteApplicationAction,
  type ApplicationDeleteMode,
} from "@/server/actions/admin-applications";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function ApplicationDeleteButton({
  applicationId,
  applicationName,
  redirectTo,
  variant = "destructive",
  size = "sm",
  defaultMode = "soft",
  allowSoftDelete = true,
}: {
  applicationId: string;
  applicationName: string;
  redirectTo?: string;
  variant?: "destructive" | "ghost" | "outline";
  size?: "sm" | "default";
  /** When false (trash detail), only hard delete is offered. */
  defaultMode?: ApplicationDeleteMode;
  allowSoftDelete?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ApplicationDeleteMode>(defaultMode);
  const [permanentConfirmed, setPermanentConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function resetState() {
    setError(null);
    setMode(defaultMode);
    setPermanentConfirmed(false);
  }

  function confirmDelete() {
    setError(null);
    if (mode === "hard" && !permanentConfirmed) {
      setError("Confirm permanent deletion to continue.");
      return;
    }
    startTransition(async () => {
      const res = await deleteApplicationAction(applicationId, { mode });
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      resetState();
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        window.location.reload();
      }
    });
  }

  const hardOnly = !allowSoftDelete;
  const effectiveMode = hardOnly ? "hard" : mode;
  const canSubmit =
    effectiveMode === "soft" || (effectiveMode === "hard" && permanentConfirmed);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant={variant} size={size}>
          {hardOnly ? "Delete permanently" : "Delete"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {hardOnly ? "Permanently delete application?" : "Delete application?"}
          </DialogTitle>
          <DialogDescription>
            {hardOnly
              ? `This removes "${applicationName}" and related data from the database. This cannot be undone.`
              : `Choose how to remove "${applicationName}" from the directory.`}
          </DialogDescription>
        </DialogHeader>

        {!hardOnly && (
          <div className="space-y-3 text-sm">
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
              <input
                type="radio"
                name="delete-mode"
                className="mt-1"
                checked={mode === "soft"}
                onChange={() => {
                  setMode("soft");
                  setPermanentConfirmed(false);
                }}
              />
              <span>
                <span className="font-medium">Soft delete</span>
                <span className="mt-1 block text-muted-foreground">
                  Hide from public browse and search. The record moves to trash
                  for audit and can be restored.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
              <input
                type="radio"
                name="delete-mode"
                className="mt-1"
                checked={mode === "hard"}
                onChange={() => setMode("hard")}
              />
              <span>
                <span className="font-medium">Hard delete</span>
                <span className="mt-1 block text-muted-foreground">
                  Permanently remove the application and its relations from the
                  database.
                </span>
              </span>
            </label>
          </div>
        )}

        {effectiveMode === "hard" && (
          <div className="flex items-start gap-2">
            <Checkbox
              id={`permanent-${applicationId}`}
              checked={permanentConfirmed}
              onCheckedChange={(v) => setPermanentConfirmed(v === true)}
            />
            <Label
              htmlFor={`permanent-${applicationId}`}
              className="text-sm font-normal leading-snug"
            >
              Permanently delete — I understand this cannot be undone
            </Label>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || !canSubmit}
            onClick={confirmDelete}
          >
            {pending
              ? "Deleting…"
              : effectiveMode === "hard"
                ? "Delete permanently"
                : "Soft delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
