import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  application: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/server/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe("bulkSoftDeleteApplications", () => {
  beforeEach(() => {
    prismaMock.application.findFirst.mockReset();
    prismaMock.application.update.mockReset();
  });

  it("returns per-row errors for partial failures", async () => {
    prismaMock.application.findFirst
      .mockResolvedValueOnce({ id: "ok", name: "A", slug: "a" })
      .mockResolvedValueOnce(null);
    prismaMock.application.update.mockResolvedValue({});

    const { bulkSoftDeleteApplications } = await import(
      "./admin-applications-service"
    );

    const results = await bulkSoftDeleteApplications(
      ["ok", "missing"],
      "admin",
    );
    expect(results).toEqual([
      { id: "ok", ok: true },
      { id: "missing", ok: false, error: "Not found" },
    ]);
    expect(prismaMock.application.update).toHaveBeenCalledTimes(1);
  });
});
