import ExcelJS from "exceljs";
import { BULK_IMPORT_COLUMNS, BULK_IMPORT_HEADER_ROW } from "./columns";

export async function buildBulkImportTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OpenSourceApp.org";
  workbook.created = new Date();

  const apps = workbook.addWorksheet("Applications", {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  apps.addRow(BULK_IMPORT_HEADER_ROW);
  apps.addRow(
    BULK_IMPORT_COLUMNS.map((col) => col.description),
  );

  apps.getRow(1).font = { bold: true };
  apps.getRow(2).font = { italic: true, size: 10 };
  apps.getRow(2).alignment = { wrapText: true };

  BULK_IMPORT_COLUMNS.forEach((col, index) => {
    const column = apps.getColumn(index + 1);
    column.width = Math.min(48, Math.max(14, col.header.length + 4));
  });

  apps.addRow([
    "Example App",
    "",
    "A sample row (delete before import)",
    "This is an example description with enough characters for validation.",
    "https://example.com",
    "https://github.com/org/example",
    "github",
    "main",
    "TypeScript",
    100,
    10,
    2,
    "2025-01-01T00:00:00.000Z",
    "",
    "v1.0.0",
    "2025-01-01T00:00:00.000Z",
    "https://github.com/org/example/releases/tag/v1.0.0",
    "developer-tools",
    "mit",
    "web,linux",
    "self-hosted",
    "",
    "true",
  ]);

  const docs = workbook.addWorksheet("Column reference");
  docs.addRow(["Column", "Required", "Description"]);
  docs.getRow(1).font = { bold: true };
  for (const col of BULK_IMPORT_COLUMNS) {
    docs.addRow([col.header, col.required ? "yes" : "no", col.description]);
  }
  docs.getColumn(1).width = 28;
  docs.getColumn(2).width = 10;
  docs.getColumn(3).width = 72;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
