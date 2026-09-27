import { z } from "zod";

export const repositoryUrlSchema = z
  .string()
  .url()
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
  name: z.string().min(2).max(120),
  tagline: z.string().max(200).optional().or(z.literal("")),
  description: z.string().min(20).max(10_000),
  homepageUrl: z.string().url().optional().or(z.literal("")),
  repositoryUrl: repositoryUrlSchema,
  primaryLanguage: z.string().max(64).optional().or(z.literal("")),
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
  raw: z.record(z.string(), z.unknown()).optional(),
});
