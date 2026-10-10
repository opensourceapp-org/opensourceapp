"use server";

import { canAccessBulkImport } from "@/lib/auth/rbac";
import { requireRole } from "@/lib/auth/session";
import { loadBulkImportLookupContext } from "@/lib/admin/bulk-import/load-context";
import { importBulkRow } from "@/lib/admin/bulk-import/import-row";
import { parseBulkImportSpreadsheet } from "@/lib/admin/bulk-import/parse-spreadsheet";
import { buildBulkImportTemplateBuffer } from "@/lib/admin/bulk-import/template";
import {
  bulkImportRowSchema,
  type BulkImportRow,
} from "@/lib/admin/bulk-import/row-schema";
import {
  validateBulkImportRows,
  type BulkImportPreviewRow,
} from "@/lib/admin/bulk-import/validate-rows";
import { UserRole } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function unauthorized() {
  return { error: "Admin access required" as const };
}

async function requireBulkImportAdmin() {
  const session = await requireRole(UserRole.ADMIN);
  const role = (session.user.role as UserRole) ?? UserRole.USER;
  if (!canAccessBulkImport(role)) {
    return { error: unauthorized().error, session: null };
  }
  return { session, error: null };
}

export async function downloadBulkImportTemplateAction() {
  const gate = await requireBulkImportAdmin();
  if (gate.error || !gate.session) return unauthorized();

  const buffer = await buildBulkImportTemplateBuffer();
  return {
    ok: true as const,
    filename: "opensourceapp-bulk-import-template.xlsx",
    base64: buffer.toString("base64"),
  };
}

export async function previewBulkImportAction(formData: FormData) {
  const gate = await requireBulkImportAdmin();
  if (gate.error || !gate.session) return unauthorized();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Upload a spreadsheet file (.xlsx or .xls)" };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "File is too large (max 5 MB)" };
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return { error: "Only .xlsx and .xls files are supported" };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { error: "Could not read uploaded file" };
  }

  let inputs;
  try {
    inputs = await parseBulkImportSpreadsheet(buffer);
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "Could not parse spreadsheet",
    };
  }

  if (inputs.length === 0) {
    return { error: "No data rows found below the header" };
  }

  if (inputs.length > 500) {
    return { error: "At most 500 rows per import" };
  }

  const context = await loadBulkImportLookupContext();
  const rows: BulkImportPreviewRow[] = validateBulkImportRows(inputs, context);

  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.length - validCount;

  return {
    ok: true as const,
    rows,
    summary: { total: rows.length, validCount, errorCount },
  };
}

export async function confirmBulkImportAction(
  payload: { rows: BulkImportRow[] },
) {
  const gate = await requireBulkImportAdmin();
  if (gate.error || !gate.session) return unauthorized();

  if (!payload?.rows?.length) {
    return { error: "No rows to import" };
  }

  if (payload.rows.length > 500) {
    return { error: "At most 500 rows per import" };
  }

  const parsedRows: BulkImportRow[] = [];
  for (const row of payload.rows) {
    const parsed = bulkImportRowSchema.safeParse(row);
    if (!parsed.success) {
      return { error: "Invalid row payload; preview again and retry" };
    }
    parsedRows.push(parsed.data);
  }

  const context = await loadBulkImportLookupContext();
  const preview = validateBulkImportRows(parsedRows, context);
  const invalid = preview.filter((r) => r.status === "error");
  if (invalid.length > 0) {
    return {
      error: "Some rows failed validation; fix errors and preview again",
      invalidRows: invalid.map((r) => ({
        rowNumber: r.rowNumber,
        errors: r.errors,
      })),
    };
  }

  const slugReserved = new Set(context.existingSlugs);
  const imported: { rowNumber: number; slug: string }[] = [];
  const failures: { rowNumber: number; message: string }[] = [];

  for (const row of parsedRows) {
    try {
      const result = await importBulkRow(
        row,
        gate.session.user.id,
        slugReserved,
      );
      imported.push({ rowNumber: row.rowNumber, slug: result.slug });
      context.existingRepositoryUrls.add(
        row.repositoryUrl.trim().toLowerCase(),
      );
    } catch (e) {
      failures.push({
        rowNumber: row.rowNumber,
        message:
          e instanceof Error ? e.message : "Import failed for this row",
      });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/bulk-import");
  revalidatePath("/apps");

  return {
    ok: true as const,
    imported,
    failures,
  };
}
