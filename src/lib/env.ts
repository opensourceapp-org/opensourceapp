import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  GITHUB_TOKEN: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function getEnv(): ServerEnv {
  return envSchema.parse(process.env);
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return url;
}
