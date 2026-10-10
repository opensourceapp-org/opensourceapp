"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { bulkDeleteApplicationsAction } from "@/server/actions/admin-applications";
import { ApplicationDeleteButton } from "@/components/admin/application-delete-button";
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

export type AdminApplicationListRow = {
  id: string;
  name: string;
  slug: string;
  repositoryUrl: string;
  publishedAt: Date | string | null;
  stars: number | null;
  updatedAt: Date | string;
};

export function ApplicationsList({ rows }: { rows: AdminApplicationListRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
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

  function runBulkDelete() {
    setBulkError(null);
    setBulkMessage(null);
    const ids = [...selected];
    startTransition(async () => {
      const res = await bulkDeleteApplicationsAction(ids);
      if (res.error) {
        setBulkError(res.error);
        return;
      }
      const failed = res.results?.filter((r) => !r.ok) ?? [];
      if (failed.length > 0) {
        setBulkMessage(
          `Deleted ${res.deletedCount}; ${failed.length} failed (${failed
            .map((f) => f.error)
            .filter(Boolean)
            .join("; ")})`,
        );
      } else {
        setBulkMessage(`Deleted ${res.deletedCount} application(s).`);
      }
      setBulkOpen(false);
      setSelected(new Set());
      window.location.reload();
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No applications match.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={selected.size === 0 || pending}
          onClick={() => setBulkOpen(true)}
        >
          Delete selected ({selected.size})
        </Button>
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
                  {row.publishedAt ? "Published" : "Draft"}
                </td>
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
                    <ApplicationDeleteButton
                      applicationId={row.id}
                      applicationName={row.name}
                      variant="ghost"
                    />
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
            <DialogTitle>Delete {selected.size} application(s)?</DialogTitle>
            <DialogDescription>
              Selected listings will be soft-deleted and hidden from public
              browse and search.
            </DialogDescription>
          </DialogHeader>
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
              variant="destructive"
              disabled={pending}
              onClick={runBulkDelete}
            >
              {pending ? "Deleting…" : "Delete selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
