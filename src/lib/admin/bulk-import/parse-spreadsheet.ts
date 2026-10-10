import * as XLSX from "xlsx";
import { BULK_IMPORT_COLUMNS, BULK_IMPORT_HEADER_ROW } from "./columns";
import {
  inferRepositoryHost,
  normalizeHeader,
  parseCommaSeparatedSlugs,
  parseOptionalDate,
  parseOptionalInt,
  parsePublishFlag,
} from "./parse-helpers";
import type { BulkImportRowInput } from "./row-schema";

export type RawSheetRow = Record<string, unknown>;

function normalizeCellValue(value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

function pickApplicationsSheet(workbook: XLSX.WorkBook): string {
  const preferred = workbook.SheetNames.find(
    (n) => n.trim().toLowerCase() === "applications",
  );
  return preferred ?? workbook.SheetNames[0] ?? "";
}

function normalizeHintText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const COLUMN_HINT_TEXTS = new Set(
  BULK_IMPORT_COLUMNS.map((col) => normalizeHintText(col.description)),
);

function looksLikeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Skip template hint row (row 2) when cells match column documentation text. */
function isTemplateDescriptionRow(raw: RawSheetRow): boolean {
  const repo = String(raw.repository_url ?? "").trim();
  if (repo && looksLikeHttpUrl(repo)) return false;

  const filledValues = Object.values(raw)
    .map((v) => normalizeHintText(String(v ?? "")))
    .filter(Boolean);

  if (filledValues.length === 0) return false;

  const hintMatches = filledValues.filter((v) => COLUMN_HINT_TEXTS.has(v));
  if (hintMatches.length >= 3) return true;

  const name = normalizeHintText(String(raw.name ?? ""));
  return name.startsWith("application display name");
}

export async function parseBulkImportSpreadsheet(
  buffer: Buffer,
): Promise<BulkImportRowInput[]> {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      raw: false,
    });
  } catch {
    throw new Error(
      "Could not read spreadsheet. Use .xlsx format (save from Excel or Google Sheets as Microsoft Excel).",
    );
  }

  const sheetName = pickApplicationsSheet(workbook);
  if (!sheetName) {
    throw new Error("Spreadsheet has no worksheets");
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("Spreadsheet has no worksheets");
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date)[]>(
    sheet,
    {
      header: 1,
      defval: "",
      blankrows: false,
    },
  );

  if (matrix.length === 0) {
    throw new Error("Spreadsheet is empty");
  }

  const headerRow = matrix[0] ?? [];
  const headers: string[] = headerRow.map((cell, index) => {
    const normalized = normalizeHeader(String(cell ?? ""));
    return normalized || `__col_${index}`;
  });

  const expectedHeaders: string[] = [...BULK_IMPORT_HEADER_ROW];
  const hasKnownHeader = headers.some((h) => expectedHeaders.includes(h));
  if (!hasKnownHeader) {
    throw new Error(
      `Missing expected header row. First row should include: ${BULK_IMPORT_HEADER_ROW.slice(0, 5).join(", ")}, …`,
    );
  }

  const rows: BulkImportRowInput[] = [];

  for (let rowIndex = 1; rowIndex < matrix.length; rowIndex++) {
    const cells = matrix[rowIndex] ?? [];
    const rowNumber = rowIndex + 1;

    const raw: RawSheetRow = {};
    let hasContent = false;

    for (let col = 0; col < headers.length; col++) {
      const key = headers[col];
      if (!key || key.startsWith("__col_")) continue;
      const val = normalizeCellValue(cells[col]);
      if (val !== "" && val !== null && val !== undefined) {
        hasContent = true;
      }
      raw[key] = val;
    }

    if (!hasContent) continue;
    if (isTemplateDescriptionRow(raw)) continue;

    const repositoryUrl = String(raw.repository_url ?? "").trim();
    const repositoryHost = inferRepositoryHost(
      repositoryUrl,
      raw.repository_host ? String(raw.repository_host) : undefined,
    );

    rows.push({
      rowNumber,
      name: String(raw.name ?? "").trim(),
      slug: String(raw.slug ?? "").trim(),
      tagline: String(raw.tagline ?? "").trim(),
      description: String(raw.description ?? "").trim(),
      homepageUrl: String(raw.homepage_url ?? "").trim(),
      repositoryUrl,
      repositoryHost,
      defaultBranch: String(raw.default_branch ?? "").trim(),
      primaryLanguage: String(raw.primary_language ?? "").trim(),
      stars: parseOptionalInt(raw.stars),
      forks: parseOptionalInt(raw.forks),
      openIssuesCount: parseOptionalInt(raw.open_issues_count),
      lastCommitAt: parseOptionalDate(raw.last_commit_at),
      logoUrl: String(raw.logo_url ?? "").trim(),
      latestReleaseTag: String(raw.latest_release_tag ?? "").trim(),
      latestReleaseAt: parseOptionalDate(raw.latest_release_at),
      latestReleaseUrl: String(raw.latest_release_url ?? "").trim(),
      categorySlugs: parseCommaSeparatedSlugs(raw.category_slugs),
      licenseSlug: String(raw.license_slug ?? "").trim().toLowerCase(),
      platformSlugs: parseCommaSeparatedSlugs(raw.platform_slugs),
      tagSlugs: parseCommaSeparatedSlugs(raw.tag_slugs),
      alternativeSoftwareSlugs: parseCommaSeparatedSlugs(
        raw.alternative_software_slugs,
      ),
      publish: parsePublishFlag(raw.publish),
    });
  }

  return rows;
}
