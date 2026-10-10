import { z } from "zod";
import { repositoryUrlSchema } from "@/lib/validation/submission";

const optionalUrl = z
  .string()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal(""));

const optionalInt = z.number().int().nonnegative().optional();

const optionalDate = z
  .union([z.date(), z.undefined()])
  .optional();

export const bulkImportRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters"),
  slug: z
    .string()
    .max(80, "Slug must be at most 80 characters")
    .optional()
    .or(z.literal("")),
  tagline: z
    .string()
    .max(200, "Tagline must be at most 200 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(10_000, "Description must be at most 10,000 characters"),
  homepageUrl: optionalUrl,
  repositoryUrl: repositoryUrlSchema,
  repositoryHost: z
    .enum(["github", "gitlab", "unknown"])
    .optional()
    .or(z.literal("")),
  defaultBranch: z.string().max(120).optional().or(z.literal("")),
  primaryLanguage: z.string().max(64).optional().or(z.literal("")),
  stars: optionalInt,
  forks: optionalInt,
  openIssuesCount: optionalInt,
  lastCommitAt: optionalDate,
  logoUrl: optionalUrl,
  latestReleaseTag: z.string().max(120).optional().or(z.literal("")),
  latestReleaseAt: optionalDate,
  latestReleaseUrl: optionalUrl,
  categorySlugs: z
    .array(z.string().min(1))
    .max(3, "At most 3 category slugs"),
  licenseSlug: z.string().max(64).optional().or(z.literal("")),
  platformSlugs: z.array(z.string().min(1)),
  tagSlugs: z.array(z.string().min(1)),
  alternativeSoftwareSlugs: z.array(z.string().min(1)).max(10),
  publish: z.boolean().default(true),
});

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

export type BulkImportRowInput = Omit<BulkImportRow, "rowNumber"> & {
  rowNumber?: number;
};
