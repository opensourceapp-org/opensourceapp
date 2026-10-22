"use server";

import { prisma } from "@/lib/db";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";

export type NewsletterSubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

export async function subscribeNewsletterAction(
  input: { email: string; name?: string },
  source = "footer",
): Promise<NewsletterSubscribeResult> {
  const parsed = newsletterSubscribeSchema.safeParse(input);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please check your email and try again.";
    return { ok: false, error: message };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return { ok: true, alreadySubscribed: true };
  }

  await prisma.newsletterSubscriber.create({
    data: {
      email,
      name: parsed.data.name,
      source,
    },
  });

  return { ok: true, alreadySubscribed: false };
}
