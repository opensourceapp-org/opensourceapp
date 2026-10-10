import { normalizeRepositoryUrl } from "@/lib/applications/normalize-repository-url";
import { slugify } from "@/lib/utils";
import {
  bulkImportRowSchema,
  type BulkImportRow,
  type BulkImportRowInput,
} from "./row-schema";

export type BulkImportLookupContext = {
  existingRepositoryUrls: Set<string>;
  existingSlugs: Set<string>;
  categorySlugs: Set<string>;
  licenseSlugs: Set<string>;
  platformSlugs: Set<string>;
  tagSlugs: Set<string>;
  softwareSlugs: Set<string>;
};

export type BulkImportPreviewRow = {
  rowNumber: number;
  status: "valid" | "error";
  errors: string[];
  data?: BulkImportRow;
};

function zodErrorsToMessages(
  issues: { path: PropertyKey[]; message: string }[],
): string[] {
  return issues.map((issue) => {
    const path = issue.path.length
      ? `${issue.path.map(String).join(".")}: `
      : "";
    return `${path}${issue.message}`;
  });
}

export function validateBulkImportRows(
  inputs: BulkImportRowInput[],
  context: BulkImportLookupContext,
): BulkImportPreviewRow[] {
  const seenRepos = new Map<string, number>();
  const seenSlugs = new Map<string, number>();

  return inputs.map((input) => {
    const rowNumber = input.rowNumber ?? 0;
    const parsed = bulkImportRowSchema.safeParse({
      ...input,
      rowNumber: rowNumber > 0 ? rowNumber : 1,
    });

    if (!parsed.success) {
      return {
        rowNumber,
        status: "error",
        errors: zodErrorsToMessages(parsed.error.issues),
      };
    }

    const data = parsed.data;
    const errors: string[] = [];

    const normalizedRepo = normalizeRepositoryUrl(data.repositoryUrl);
    if (context.existingRepositoryUrls.has(normalizedRepo)) {
      errors.push("Repository URL already exists in the directory");
    }
    const priorRepoRow = seenRepos.get(normalizedRepo);
    if (priorRepoRow !== undefined) {
      errors.push(`Duplicate repository URL in spreadsheet (row ${priorRepoRow})`);
    } else {
      seenRepos.set(normalizedRepo, rowNumber);
    }

    const slugBase = data.slug?.trim() || slugify(data.name);
    const slugCandidate = slugBase || "app";
    if (context.existingSlugs.has(slugCandidate)) {
      errors.push(`Slug "${slugCandidate}" is already taken`);
    }
    const priorSlugRow = seenSlugs.get(slugCandidate);
    if (priorSlugRow !== undefined) {
      errors.push(`Duplicate slug in spreadsheet (row ${priorSlugRow})`);
    } else {
      seenSlugs.set(slugCandidate, rowNumber);
    }

    for (const slug of data.categorySlugs) {
      if (!context.categorySlugs.has(slug)) {
        errors.push(`Unknown category slug: ${slug}`);
      }
    }

    if (data.licenseSlug && !context.licenseSlugs.has(data.licenseSlug)) {
      errors.push(`Unknown license slug: ${data.licenseSlug}`);
    }

    for (const slug of data.platformSlugs) {
      if (!context.platformSlugs.has(slug)) {
        errors.push(`Unknown platform slug: ${slug}`);
      }
    }

    for (const slug of data.tagSlugs) {
      if (!context.tagSlugs.has(slug)) {
        errors.push(`Unknown tag slug: ${slug}`);
      }
    }

    for (const slug of data.alternativeSoftwareSlugs) {
      if (!context.softwareSlugs.has(slug)) {
        errors.push(`Unknown alternative software slug: ${slug}`);
      }
    }

    if (errors.length > 0) {
      return { rowNumber, status: "error", errors };
    }

    return {
      rowNumber,
      status: "valid",
      errors: [],
      data: { ...data, slug: slugCandidate },
    };
  });
}
