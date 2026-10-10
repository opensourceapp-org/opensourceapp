import { describe, expect, it } from "vitest";
import { UserRole } from "@/generated/prisma";
import { canAccessBulkImport } from "./rbac";

describe("bulk import access", () => {
  it("allows admins only", () => {
    expect(canAccessBulkImport(UserRole.ADMIN)).toBe(true);
    expect(canAccessBulkImport(UserRole.MODERATOR)).toBe(false);
    expect(canAccessBulkImport(UserRole.USER)).toBe(false);
  });
});
