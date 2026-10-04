import { describe, expect, it } from "vitest";
import {
  generateVerificationTokenPlaintext,
  hashVerificationToken,
  isVerificationTokenFormat,
  verificationTokenMatches,
} from "./token";

describe("verification token", () => {
  it("generates osa_verify_ prefixed tokens", () => {
    const token = generateVerificationTokenPlaintext();
    expect(isVerificationTokenFormat(token)).toBe(true);
  });

  it("hashes and verifies tokens", () => {
    const token = generateVerificationTokenPlaintext();
    const hash = hashVerificationToken(token);
    expect(verificationTokenMatches(token, hash)).toBe(true);
    expect(verificationTokenMatches(token + "x", hash)).toBe(false);
  });
});
