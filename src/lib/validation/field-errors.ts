export type FieldErrorMap = Record<string, string[]>;

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  tagline: "Tagline",
  description: "Description",
  homepageUrl: "Homepage",
  repositoryUrl: "Repository URL",
  primaryLanguage: "Primary language",
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** Normalize server action `error` payloads into messages + per-field lists. */
export function parseActionError(error: unknown): {
  message: string | null;
  fieldErrors: FieldErrorMap;
} {
  if (error == null) {
    return { message: null, fieldErrors: {} };
  }
  if (typeof error === "string") {
    return { message: error, fieldErrors: {} };
  }
  if (typeof error === "object") {
    const fieldErrors: FieldErrorMap = {};
    for (const [key, val] of Object.entries(error)) {
      if (Array.isArray(val)) {
        const msgs = val.filter((m): m is string => typeof m === "string" && m.length > 0);
        if (msgs.length) fieldErrors[key] = msgs;
      } else if (typeof val === "string" && val.length > 0) {
        fieldErrors[key] = [val];
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return {
        message: "Please fix the highlighted fields below.",
        fieldErrors,
      };
    }
  }
  return {
    message: "Something went wrong. Please try again.",
    fieldErrors: {},
  };
}

export function flattenFieldErrors(fieldErrors: FieldErrorMap): string[] {
  return Object.entries(fieldErrors).flatMap(([field, msgs]) =>
    msgs.map((m) => `${fieldLabel(field)}: ${m}`),
  );
}
