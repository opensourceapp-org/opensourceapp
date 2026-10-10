import { describe, expect, it } from "vitest";
import { validateBulkImportRows } from "./validate-rows";
import type { BulkImportLookupContext } from "./validate-rows";

const baseContext: BulkImportLookupContext = {
  existingRepositoryUrls: new Set(),
  existingSlugs: new Set(),
  categorySlugs: new Set(["developer-tools"]),
  licenseSlugs: new Set(["mit"]),
  platformSlugs: new Set(["web"]),
  tagSlugs: new Set(["cli"]),
  softwareSlugs: new Set(),
};

const validRow = {
  rowNumber: 2,
  name: "Sample App",
  slug: "",
  tagline: "",
  description: "A long enough description for the bulk import validator.",
  homepageUrl: "",
  repositoryUrl: "https://github.com/org/sample",
  repositoryHost: "github" as const,
  defaultBranch: "",
  primaryLanguage: "",
  categorySlugs: ["developer-tools"],
  licenseSlug: "mit",
  platformSlugs: ["web"],
  tagSlugs: [],
  alternativeSoftwareSlugs: [],
  publish: true,
};

describe("validateBulkImportRows", () => {
  it("accepts a valid row", () => {
    const [result] = validateBulkImportRows([validRow], baseContext);
    expect(result.status).toBe("valid");
    expect(result.errors).toHaveLength(0);
    expect(result.data?.slug).toBe("sample-app");
  });

  it("rejects duplicate repository URLs in the sheet", () => {
    const rows = [
      validRow,
      { ...validRow, rowNumber: 3, name: "Other Name" },
    ];
    const results = validateBulkImportRows(rows, baseContext);
    expect(results[1].status).toBe("error");
    expect(results[1].errors[0]).toMatch(/Duplicate repository URL/);
  });

  it("rejects unknown category slugs", () => {
    const [result] = validateBulkImportRows(
      [{ ...validRow, categorySlugs: ["not-a-category"] }],
      baseContext,
    );
    expect(result.status).toBe("error");
    expect(result.errors[0]).toMatch(/Unknown category slug/);
  });
});
