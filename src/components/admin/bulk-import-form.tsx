"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import type { BulkImportRow } from "@/lib/admin/bulk-import/row-schema";
import type { BulkImportPreviewRow } from "@/lib/admin/bulk-import/validate-rows";
import {
  confirmBulkImportAction,
  downloadBulkImportTemplateAction,
  previewBulkImportAction,
} from "@/server/actions/admin-bulk-import";

function downloadBase64File(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkImportForm() {
  const [preview, setPreview] = useState<BulkImportPreviewRow[] | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    validCount: number;
    errorCount: number;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validRows =
    preview?.filter((r) => r.status === "valid" && r.data) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl font-normal">
            Template
          </CardTitle>
          <CardDescription>
            Download the Excel template with column documentation, fill one row
            per application, then upload below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                setMessage(null);
                const result = await downloadBulkImportTemplateAction();
                if ("error" in result) {
                  setMessage(result.error ?? "Could not download template");
                  return;
                }
                downloadBase64File(result.base64, result.filename);
              });
            }}
          >
            Download .xlsx template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl font-normal">
            Upload spreadsheet
          </CardTitle>
          <CardDescription>
            Accepts .xlsx and .xls (max 500 data rows). Rows are validated before
            import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              startTransition(async () => {
                setMessage(null);
                setPreview(null);
                setSummary(null);
                const result = await previewBulkImportAction(formData);
                if ("error" in result) {
                  setMessage(result.error ?? "Preview failed");
                  return;
                }
                setPreview(result.rows);
                setSummary(result.summary);
              });
            }}
          >
            <div className="min-w-[16rem] flex-1">
              <label
                htmlFor="bulk-import-file"
                className="mb-1 block text-sm font-medium"
              >
                Spreadsheet file
              </label>
              <input
                id="bulk-import-file"
                name="file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                required
                className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              Preview import
            </Button>
          </form>
          {message && (
            <p className="text-sm text-destructive" role="alert">{message}</p>
          )}
        </CardContent>
      </Card>

      {summary && preview && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-normal">Preview</h2>
            <Badge variant="secondary">{summary.total} rows</Badge>
            <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
              {summary.validCount} valid
            </Badge>
            {summary.errorCount > 0 && (
              <Badge variant="destructive">{summary.errorCount} errors</Badge>
            )}
          </div>

          <DataTable
            getRowKey={(row) => String(row.rowNumber)}
            rows={preview}
            emptyMessage="No rows"
            columns={[
              {
                key: "row",
                header: "Row",
                cell: (row) => row.rowNumber,
                className: "w-16",
              },
              {
                key: "status",
                header: "Status",
                cell: (row) =>
                  row.status === "valid" ? (
                    <span className="text-primary">Valid</span>
                  ) : (
                    <span className="text-destructive">Error</span>
                  ),
              },
              {
                key: "name",
                header: "Name",
                cell: (row) => row.data?.name ?? "—",
              },
              {
                key: "repository",
                header: "Repository",
                cell: (row) =>
                  row.data?.repositoryUrl ? (
                    <span className="font-mono text-xs">
                      {row.data.repositoryUrl}
                    </span>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "errors",
                header: "Issues",
                cell: (row) =>
                  row.errors.length ? (
                    <ul className="list-disc pl-4 text-sm text-destructive">
                      {row.errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">Ready</span>
                  ),
              },
            ]}
          />

          <Button
            type="button"
            disabled={isPending || validRows.length === 0}
            onClick={() => {
              const rows = validRows.map((r) => r.data as BulkImportRow);
              startTransition(async () => {
                setMessage(null);
                const result = await confirmBulkImportAction({ rows });
                if ("error" in result) {
                  setMessage(result.error ?? "Import failed");
                  return;
                }
                const ok = result.imported.length;
                const fail = result.failures.length;
                setMessage(
                  `Imported ${ok} application${ok === 1 ? "" : "s"}` +
                    (fail ? `; ${fail} failed` : ""),
                );
                setPreview(null);
                setSummary(null);
              });
            }}
          >
            Confirm import ({validRows.length} row
            {validRows.length === 1 ? "" : "s"})
          </Button>
        </section>
      )}
    </div>
  );
}
