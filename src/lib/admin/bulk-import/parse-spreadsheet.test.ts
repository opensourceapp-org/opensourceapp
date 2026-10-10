import { describe, expect, it } from "vitest";
import { parseBulkImportSpreadsheet } from "./parse-spreadsheet";
import { buildBulkImportTemplateBuffer } from "./template";

describe("parseBulkImportSpreadsheet", () => {
  it("parses the official template without throwing", async () => {
    const buffer = await buildBulkImportTemplateBuffer();
    const rows = await parseBulkImportSpreadsheet(buffer);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].name).toBe("Example App");
    expect(rows[0].repositoryUrl).toContain("github.com");
  });
});
