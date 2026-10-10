import ExcelJS from "exceljs";
import { BULK_IMPORT_HEADER_ROW } from "./columns";
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

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && value !== null && "text" in value) {
    return (value as { text: string }).text;
  }
  if (typeof value === "object" && value !== null && "result" in value) {
    return (value as { result: unknown }).result;
  }
  return value;
}

export async function parseBulkImportSpreadsheet(
  buffer: Buffer,
): Promise<BulkImportRowInput[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("Spreadsheet has no worksheets");
  }

  const headerRow = sheet.getRow(1);
  const headerCells = headerRow.values as ExcelJS.CellValue[];
  const headers: string[] = [];
  for (let col = 1; col < headerCells.length; col++) {
    const normalized = normalizeHeader(headerCells[col]);
    headers[col] = normalized || `__col_${col}`;
  }

  const expectedHeaders: string[] = [...BULK_IMPORT_HEADER_ROW];
  const hasKnownHeader = headers.some((h) => expectedHeaders.includes(h));
  if (!hasKnownHeader) {
    throw new Error(
      `Missing expected header row. First row should include: ${BULK_IMPORT_HEADER_ROW.slice(0, 5).join(", ")}, …`,
    );
  }

  const rows: BulkImportRowInput[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const raw: RawSheetRow = {};
    let hasContent = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headers[colNumber];
      if (!key || key.startsWith("__col_")) return;
      const val = cellValue(cell.value);
      if (val !== "" && val !== null && val !== undefined) {
        hasContent = true;
      }
      raw[key] = val;
    });

    if (!hasContent) return;

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
  });

  return rows;
}
