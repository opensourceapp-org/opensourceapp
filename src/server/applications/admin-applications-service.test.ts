import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  application: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  submission: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/server/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe("admin application delete service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => Promise<void>) => {
      await fn(prismaMock);
    });
  });

  it("returns per-row errors for partial soft-delete failures", async () => {
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

  it("restores a soft-deleted application", async () => {
    prismaMock.application.findFirst.mockResolvedValue({
      id: "app-1",
      name: "App",
      slug: "app",
    });
    prismaMock.application.update.mockResolvedValue({});

    const { restoreApplicationById } = await import(
      "./admin-applications-service"
    );

    const result = await restoreApplicationById("app-1", "admin");
    expect(result).toEqual({ ok: true, name: "App" });
    expect(prismaMock.application.update).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: { deletedAt: null, deletedById: null },
    });
  });

  it("returns per-row errors for partial bulk publish failures", async () => {
    prismaMock.application.findFirst
      .mockResolvedValueOnce({
        id: "ok",
        name: "A",
        slug: "a",
        publishedAt: null,
      })
      .mockResolvedValueOnce(null);
    prismaMock.application.update.mockResolvedValue({});

    const { bulkPublishApplications } = await import(
      "./admin-applications-service"
    );

    const results = await bulkPublishApplications(["ok", "trashed"], "admin");
    expect(results).toEqual([
      { id: "ok", ok: true },
      { id: "trashed", ok: false, error: "Not found" },
    ]);
    expect(prismaMock.application.update).toHaveBeenCalledTimes(1);
  });

  it("unpublish clears publishedAt for active applications", async () => {
    prismaMock.application.findFirst.mockResolvedValue({
      id: "app-1",
      name: "App",
      slug: "app",
    });
    prismaMock.application.update.mockResolvedValue({});

    const { unpublishApplicationById } = await import(
      "./admin-applications-service"
    );

    const result = await unpublishApplicationById("app-1", "admin");
    expect(result).toEqual({ ok: true, name: "App" });
    expect(prismaMock.application.update).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: { publishedAt: null },
    });
  });

  it("publish keeps existing publishedAt when set", async () => {
    const existing = new Date("2024-01-15T12:00:00.000Z");
    prismaMock.application.findFirst.mockResolvedValue({
      id: "app-1",
      name: "App",
      slug: "app",
      publishedAt: existing,
    });
    prismaMock.application.update.mockResolvedValue({});

    const { publishApplicationById } = await import(
      "./admin-applications-service"
    );

    const result = await publishApplicationById("app-1", "admin");
    expect(result).toEqual({ ok: true, name: "App" });
    expect(prismaMock.application.update).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: { publishedAt: existing },
    });
  });

  it("hard-deletes application and unlinks submission", async () => {
    prismaMock.application.findUnique.mockResolvedValue({
      id: "app-1",
      name: "App",
      slug: "app",
    });
    prismaMock.submission.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.application.delete.mockResolvedValue({});

    const { hardDeleteApplicationById } = await import(
      "./admin-applications-service"
    );

    const result = await hardDeleteApplicationById("app-1", "admin");
    expect(result).toEqual({ ok: true, name: "App" });
    expect(prismaMock.submission.updateMany).toHaveBeenCalledWith({
      where: { applicationId: "app-1" },
      data: { applicationId: null },
    });
    expect(prismaMock.application.delete).toHaveBeenCalledWith({
      where: { id: "app-1" },
    });
  });
});
