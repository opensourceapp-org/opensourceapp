"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  bulkDeleteApplicationsAction,
  bulkRestoreApplicationsAction,
  publishApplicationsAction,
  unpublishApplicationsAction,
  type ApplicationDeleteMode,
} from "@/server/actions/admin-applications";
import { ApplicationDeleteButton } from "@/components/admin/application-delete-button";
import { ApplicationPublishButton } from "@/components/admin/application-publish-button";
import { ApplicationRestoreButton } from "@/components/admin/application-restore-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export type AdminApplicationListRow = {
  id: string;
  name: string;
  slug: string;
  repositoryUrl: string;
  publishedAt: Date | string | null;
  stars: number | null;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  deletedBy?: { name: string | null; email: string } | null;
};

function formatDeletedBy(
  deletedBy: AdminApplicationListRow["deletedBy"],
): string {
  if (!deletedBy) return "—";
  const label = deletedBy.name?.trim() || deletedBy.email;
  return deletedBy.name ? `${label} (${deletedBy.email})` : deletedBy.email;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleString();
}

export function ApplicationsList({
  rows,
  view = "active",
}: {
  rows: AdminApplicationListRow[];
  view?: "active" | "deleted";
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "delete" | "restore" | "publish" | "unpublish"
  >("delete");
  const [deleteMode, setDeleteMode] = useState<ApplicationDeleteMode>("soft");
  const [permanentConfirmed, setPermanentConfirmed] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(allIds) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function openBulkDialog(
    action: "delete" | "restore" | "publish" | "unpublish",
  ) {
    setBulkAction(action);
    setDeleteMode(view === "deleted" ? "hard" : "soft");
    setPermanentConfirmed(false);
    setBulkError(null);
    setBulkOpen(true);
  }

  function runBulkAction() {
    setBulkError(null);
    setBulkMessage(null);
    const ids = [...selected];

    if (bulkAction === "delete" && deleteMode === "hard" && !permanentConfirmed) {
      setBulkError("Confirm permanent deletion to continue.");
      return;
    }

    startTransition(async () => {
      if (bulkAction === "restore") {
        const res = await bulkRestoreApplicationsAction(ids);
        if (res.error) {
          setBulkError(res.error);
          return;
        }
        setBulkMessage(`Restored ${res.restoredCount} application(s).`);
      } else if (bulkAction === "publish") {
        const res = await publishApplicationsAction(ids);
        if (res.error) {
          setBulkError(res.error);
          return;
        }
        const failed = res.results?.filter((r) => !r.ok) ?? [];
        if (failed.length > 0) {
          setBulkMessage(
            `Published ${res.publishedCount}; ${failed.length} failed`,
          );
        } else {
          setBulkMessage(`Published ${res.publishedCount} application(s).`);
        }
      } else if (bulkAction === "unpublish") {
        const res = await unpublishApplicationsAction(ids);
        if (res.error) {
          setBulkError(res.error);
          return;
        }
        const failed = res.results?.filter((r) => !r.ok) ?? [];
        if (failed.length > 0) {
          setBulkMessage(
            `Unpublished ${res.unpublishedCount}; ${failed.length} failed`,
          );
        } else {
          setBulkMessage(
            `Unpublished ${res.unpublishedCount} application(s).`,
          );
        }
      } else {
        const res = await bulkDeleteApplicationsAction(ids, {
          mode: deleteMode,
        });
        if (res.error) {
          setBulkError(res.error);
          return;
        }
        const failed = res.results?.filter((r) => !r.ok) ?? [];
        if (failed.length > 0) {
          setBulkMessage(
            `Processed ${res.deletedCount}; ${failed.length} failed`,
          );
        } else {
          setBulkMessage(
            deleteMode === "hard"
              ? `Permanently deleted ${res.deletedCount} application(s).`
              : `Soft-deleted ${res.deletedCount} application(s).`,
          );
        }
      }
      setBulkOpen(false);
      setSelected(new Set());
      window.location.reload();
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {view === "deleted"
          ? "Trash is empty."
          : "No applications match."}
      </p>
    );
  }

  const bulkTitle =
    bulkAction === "restore"
      ? `Restore ${selected.size} application(s)?`
      : bulkAction === "publish"
        ? `Publish ${selected.size} application(s)?`
        : bulkAction === "unpublish"
          ? `Unpublish ${selected.size} application(s)?`
          : `Delete ${selected.size} application(s)?`;

  const bulkDescription =
    bulkAction === "restore"
      ? "Selected listings will return to the active list."
      : bulkAction === "publish"
        ? "Selected listings will appear on the public directory, search, and sitemap."
        : bulkAction === "unpublish"
          ? "Selected listings will be hidden from the public site until published again."
          : "Choose soft delete (trash) or permanent removal for the selected listings.";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {view === "active" ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={selected.size === 0 || pending}
              onClick={() => openBulkDialog("publish")}
            >
              Publish selected ({selected.size})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selected.size === 0 || pending}
              onClick={() => openBulkDialog("unpublish")}
            >
              Unpublish selected ({selected.size})
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selected.size === 0 || pending}
              onClick={() => openBulkDialog("delete")}
            >
              Delete selected ({selected.size})
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              disabled={selected.size === 0 || pending}
              onClick={() => openBulkDialog("restore")}
            >
              Restore selected ({selected.size})
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selected.size === 0 || pending}
              onClick={() => openBulkDialog("delete")}
            >
              Hard delete selected ({selected.size})
            </Button>
          </>
        )}
        {bulkMessage && (
          <p className="text-sm text-muted-foreground">{bulkMessage}</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-surface-muted text-left text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(v === true)}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Status</th>
              {view === "deleted" && (
                <>
                  <th className="px-3 py-2 font-medium">Deleted at</th>
                  <th className="px-3 py-2 font-medium">Deleted by</th>
                </>
              )}
              <th className="px-3 py-2 font-medium">Repository</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/40">
                <td className="px-3 py-2.5 align-top">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={(v) => toggleOne(row.id, v === true)}
                    aria-label={`Select ${row.name}`}
                  />
                </td>
                <td className="px-3 py-2.5 align-top font-medium">{row.name}</td>
                <td className="px-3 py-2.5 align-top font-mono text-xs">
                  {row.slug}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <Badge variant={row.publishedAt ? "default" : "outline"}>
                    {row.publishedAt ? "Published" : "Draft"}
                  </Badge>
                </td>
                {view === "deleted" && (
                  <>
                    <td className="px-3 py-2.5 align-top text-xs">
                      {formatDate(row.deletedAt)}
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2.5 align-top text-xs">
                      {formatDeletedBy(row.deletedBy)}
                    </td>
                  </>
                )}
                <td className="max-w-[14rem] truncate px-3 py-2.5 align-top font-mono text-xs text-muted-foreground">
                  {row.repositoryUrl}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/applications/${row.id}`}>View</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/applications/${row.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    {view === "active" ? (
                      <>
                        <ApplicationPublishButton
                          applicationId={row.id}
                          applicationName={row.name}
                          published={Boolean(row.publishedAt)}
                          variant="outline"
                        />
                        <ApplicationDeleteButton
                          applicationId={row.id}
                          applicationName={row.name}
                          variant="ghost"
                        />
                      </>
                    ) : (
                      <>
                        <ApplicationRestoreButton
                          applicationId={row.id}
                          applicationName={row.name}
                          variant="outline"
                        />
                        <ApplicationDeleteButton
                          applicationId={row.id}
                          applicationName={row.name}
                          variant="ghost"
                          defaultMode="hard"
                          allowSoftDelete={false}
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{bulkTitle}</DialogTitle>
            <DialogDescription>{bulkDescription}</DialogDescription>
          </DialogHeader>
          {bulkAction === "delete" && view === "active" && (
            <div className="space-y-3 text-sm">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                <input
                  type="radio"
                  name="bulk-delete-mode"
                  className="mt-1"
                  checked={deleteMode === "soft"}
                  onChange={() => {
                    setDeleteMode("soft");
                    setPermanentConfirmed(false);
                  }}
                />
                <span>
                  <span className="font-medium">Soft delete</span>
                  <span className="mt-1 block text-muted-foreground">
                    Move to trash; can be restored later.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                <input
                  type="radio"
                  name="bulk-delete-mode"
                  className="mt-1"
                  checked={deleteMode === "hard"}
                  onChange={() => setDeleteMode("hard")}
                />
                <span>
                  <span className="font-medium">Hard delete</span>
                  <span className="mt-1 block text-muted-foreground">
                    Permanently remove from the database.
                  </span>
                </span>
              </label>
            </div>
          )}
          {bulkAction === "delete" &&
            (view === "deleted" || deleteMode === "hard") && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="bulk-permanent"
                checked={permanentConfirmed}
                onCheckedChange={(v) => setPermanentConfirmed(v === true)}
              />
              <Label htmlFor="bulk-permanent" className="text-sm font-normal">
                Permanently delete — I understand this cannot be undone
              </Label>
            </div>
          )}
          {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                bulkAction === "delete"
                  ? "destructive"
                  : bulkAction === "unpublish"
                    ? "outline"
                    : "default"
              }
              disabled={
                pending ||
                (bulkAction === "delete" &&
                  (view === "deleted" || deleteMode === "hard") &&
                  !permanentConfirmed)
              }
              onClick={runBulkAction}
            >
              {pending
                ? "Working…"
                : bulkAction === "restore"
                  ? "Restore selected"
                  : bulkAction === "publish"
                    ? "Publish selected"
                    : bulkAction === "unpublish"
                      ? "Unpublish selected"
                      : view === "deleted" || deleteMode === "hard"
                        ? "Delete permanently"
                        : "Soft delete selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
