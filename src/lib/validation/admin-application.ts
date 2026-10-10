import { z } from "zod";
import {
  alternativeIdsSchema,
  categoryIdsSchema,
  repositoryUrlSchema,
} from "@/lib/validation/submission";

export const adminApplicationFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120, "Slug must be at most 120 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens",
    ),
  tagline: z
    .string()
    .max(200, "Tagline must be at most 200 characters")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(10_000, "Description must be at most 10,000 characters"),
  homepageUrl: z
    .string()
    .url("Enter a valid homepage URL")
    .optional()
    .or(z.literal("")),
  repositoryUrl: repositoryUrlSchema,
  repositoryHost: z
    .enum(["github", "gitlab", "unknown"])
    .optional()
    .or(z.literal("")),
  defaultBranch: z.string().max(120).optional().or(z.literal("")),
  primaryLanguage: z.string().max(64).optional().or(z.literal("")),
  stars: z.coerce.number().int().nonnegative().nullable().optional(),
  forks: z.coerce.number().int().nonnegative().nullable().optional(),
  openIssuesCount: z.coerce.number().int().nonnegative().nullable().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  latestReleaseTag: z.string().max(200).optional().or(z.literal("")),
  latestReleaseUrl: z.string().url().optional().or(z.literal("")),
  published: z.boolean(),
  categoryIds: categoryIdsSchema,
  licenseId: z.string().min(1).optional().or(z.literal("")),
  platformIds: z.array(z.string().min(1)),
  tagIds: z.array(z.string().min(1)),
  alternativeIds: alternativeIdsSchema,
});

export type AdminApplicationFormInput = z.infer<
  typeof adminApplicationFormSchema
>;
