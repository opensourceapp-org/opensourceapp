import { z } from "zod";

export const submitApplicationClaimSchema = z.object({
  applicationId: z.string().min(1),
  evidenceMessage: z
    .string()
    .max(4000)
    .optional()
    .transform((v) => v?.trim() || undefined),
  evidenceUrl: z
    .string()
    .url("Enter a valid URL")
    .max(2048)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export function parseSubmitApplicationClaim(input: unknown) {
  const parsed = submitApplicationClaimSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: first?.message ?? "Invalid input" };
  }
  return { ok: true as const, value: parsed.data };
}
