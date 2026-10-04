import { z } from "zod";

export const repositoryUrlSchema = z
  .string()
  .min(1, "Repository URL is required")
  .url("Enter a valid repository URL")
  .refine(
    (url) => {
      try {
        const host = new URL(url).hostname;
        return (
          host === "github.com" ||
          host === "www.github.com" ||
          host === "gitlab.com"
        );
      } catch {
        return false;
      }
    },
    { message: "Repository must be a GitHub or GitLab URL" },
  );

export const submissionFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name must be at most 120 characters"),
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
  primaryLanguage: z
    .string()
    .max(64, "Primary language must be at most 64 characters")
    .optional()
    .or(z.literal("")),
  licenseSlug: z
    .string()
    .max(64, "Select a license from the list")
    .optional()
    .or(z.literal("")),
  submit: z.boolean().optional(),
});

export type SubmissionFormInput = z.infer<typeof submissionFormSchema>;

export const repoMetadataSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  homepageUrl: z.string().url().nullable(),
  defaultBranch: z.string().nullable(),
  stars: z.number().int().nonnegative().nullable(),
  forks: z.number().int().nonnegative().nullable(),
  primaryLanguage: z.string().nullable(),
  lastCommitAt: z.string().nullable(),
  host: z.enum(["github", "gitlab", "unknown"]),
  licenseSpdxId: z.string().nullable().optional(),
  licenseKey: z.string().nullable().optional(),
  licenseName: z.string().nullable().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});
