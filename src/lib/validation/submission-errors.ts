import type { ZodError } from "zod";
import type { SubmissionFormInput } from "./submission";

export type SubmissionFieldErrors = Partial<
  Record<keyof SubmissionFormInput, string[]>
>;

export const SUBMISSION_FIELD_LABELS: Record<keyof SubmissionFormInput, string> =
  {
    name: "Name",
    tagline: "Tagline",
    description: "Description",
    homepageUrl: "Homepage",
    repositoryUrl: "Repository URL",
    primaryLanguage: "Primary language",
    submit: "Submit",
  };

export function submissionFieldErrorsFromZod(
  error: ZodError,
): SubmissionFieldErrors {
  return error.flatten().fieldErrors as SubmissionFieldErrors;
}

/** Human-readable lines for a summary list (field label + first message per field). */
export function submissionFieldErrorSummary(
  fieldErrors: SubmissionFieldErrors,
): string[] {
  const lines: string[] = [];
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const msg = messages?.[0];
    if (!msg) continue;
    const label =
      SUBMISSION_FIELD_LABELS[field as keyof SubmissionFormInput] ?? field;
    lines.push(`${label}: ${msg}`);
  }
  return lines;
}

export function isSubmissionFieldErrors(
  error: unknown,
): error is SubmissionFieldErrors {
  return (
    typeof error === "object" &&
    error !== null &&
    !Array.isArray(error) &&
    !(error instanceof Error)
  );
}

/** Wizard step that should show the first invalid field (0 = repository, 1 = details). */
export function submissionErrorStep(fieldErrors: SubmissionFieldErrors): number {
  if (fieldErrors.repositoryUrl?.length) return 0;
  if (
    fieldErrors.name?.length ||
    fieldErrors.tagline?.length ||
    fieldErrors.description?.length ||
    fieldErrors.homepageUrl?.length ||
    fieldErrors.primaryLanguage?.length
  ) {
    return 1;
  }
  return 2;
}
