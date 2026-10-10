import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@/generated/prisma";

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

const authMock = vi.fn();
const softDeleteMock = vi.fn();
const bulkDeleteMock = vi.fn();
const hardDeleteMock = vi.fn();
const restoreMock = vi.fn();
const bulkRestoreMock = vi.fn();
const bulkHardDeleteMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/server/applications/admin-applications-service", () => ({
  softDeleteApplicationById: (...args: unknown[]) => softDeleteMock(...args),
  bulkSoftDeleteApplications: (...args: unknown[]) => bulkDeleteMock(...args),
  hardDeleteApplicationById: (...args: unknown[]) => hardDeleteMock(...args),
  bulkHardDeleteApplications: (...args: unknown[]) =>
    bulkHardDeleteMock(...args),
  restoreApplicationById: (...args: unknown[]) => restoreMock(...args),
  bulkRestoreApplications: (...args: unknown[]) => bulkRestoreMock(...args),
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
    hardDeleteMock.mockReset();
    restoreMock.mockReset();
    bulkRestoreMock.mockReset();
    bulkHardDeleteMock.mockReset();
  });

  it("rejects delete for non-admin users", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", role: UserRole.MODERATOR },
    });
    const { deleteApplicationAction } = await import("./admin-applications");
    const res = await deleteApplicationAction("app-1");
    expect(res).toEqual({ error: "Admin access required" });
    expect(softDeleteMock).not.toHaveBeenCalled();
    expect(hardDeleteMock).not.toHaveBeenCalled();
  });

  it("rejects bulk delete when unauthenticated", async () => {
    authMock.mockResolvedValue(null);
    const { bulkDeleteApplicationsAction } = await import(
      "./admin-applications"
    );
    const res = await bulkDeleteApplicationsAction(["a", "b"]);
    expect(res).toEqual({ error: "Admin access required" });
    expect(bulkDeleteMock).not.toHaveBeenCalled();
    expect(bulkHardDeleteMock).not.toHaveBeenCalled();
  });

  it("rejects hard delete for non-admin users", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", role: UserRole.MODERATOR },
    });
    const { deleteApplicationAction } = await import("./admin-applications");
    const res = await deleteApplicationAction("app-1", { mode: "hard" });
    expect(res).toEqual({ error: "Admin access required" });
    expect(hardDeleteMock).not.toHaveBeenCalled();
  });

  it("rejects restore for non-admin users", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", role: UserRole.USER },
    });
    const { restoreApplicationAction } = await import("./admin-applications");
    const res = await restoreApplicationAction("app-1");
    expect(res).toEqual({ error: "Admin access required" });
    expect(restoreMock).not.toHaveBeenCalled();
  });

  it("calls hard delete for admin users", async () => {
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: UserRole.ADMIN },
    });
    hardDeleteMock.mockResolvedValue({ ok: true, name: "X" });
    const { deleteApplicationAction } = await import("./admin-applications");
    const res = await deleteApplicationAction("app-1", { mode: "hard" });
    expect(res).toEqual({ ok: true });
    expect(hardDeleteMock).toHaveBeenCalledWith("app-1", "admin-1");
  });
});
