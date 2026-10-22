import { describe, expect, it } from "vitest";
import { newsletterSubscribeSchema } from "./newsletter";

describe("newsletterSubscribeSchema", () => {
  it("accepts email only", () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: "reader@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
    }
  });

  it("accepts optional name", () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: "reader@example.com",
      name: "Ada",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("treats blank name as undefined", () => {
    const result = newsletterSubscribeSchema.safeParse({
      email: "reader@example.com",
      name: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
    }
  });
});
