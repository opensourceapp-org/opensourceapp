import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma";

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

const authMock = vi.fn();
const softDeleteMock = vi.fn();
const bulkDeleteMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/server/applications/admin-applications-service", () => ({
  softDeleteApplicationById: (...args: unknown[]) => softDeleteMock(...args),
  bulkSoftDeleteApplications: (...args: unknown[]) => bulkDeleteMock(...args),
  updateApplicationFromAdminInput: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("admin application actions auth", () => {
  beforeEach(() => {
    authMock.mockReset();
    softDeleteMock.mockReset();
    bulkDeleteMock.mockReset();
  });

  it("rejects delete for non-admin users", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", role: UserRole.MODERATOR },
    });
    const { deleteApplicationAction } = await import("./admin-applications");
    const res = await deleteApplicationAction("app-1");
    expect(res).toEqual({ error: "Admin access required" });
    expect(softDeleteMock).not.toHaveBeenCalled();
  });

  it("rejects bulk delete when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const { bulkDeleteApplicationsAction } = await import(
      "./admin-applications"
    );
    const res = await bulkDeleteApplicationsAction(["a", "b"]);
    expect(res).toEqual({ error: "Admin access required" });
    expect(bulkDeleteMock).not.toHaveBeenCalled();
  });
});
