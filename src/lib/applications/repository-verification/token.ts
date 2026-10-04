import { createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "osa_verify_";

export function generateVerificationTokenPlaintext(): string {
  const bytes = randomBytes(24);
  return `${TOKEN_PREFIX}${bytes.toString("base64url")}`;
}

export function hashVerificationToken(plaintext: string): string {
  return createHash("sha256").update(plaintext, "utf8").digest("hex");
}

export function verificationTokenMatches(
  plaintext: string,
  storedHash: string,
): boolean {
  const hash = hashVerificationToken(plaintext.trim());
  return hash === storedHash;
}

export function isVerificationTokenFormat(value: string): boolean {
  return value.startsWith(TOKEN_PREFIX) && value.length > TOKEN_PREFIX.length + 8;
}
