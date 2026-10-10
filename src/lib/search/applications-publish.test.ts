import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  application: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

describe("searchPublishedApplications publish visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.application.findMany.mockResolvedValue([]);
    prismaMock.application.count.mockResolvedValue(0);
  });

  it("only queries published, non-deleted applications", async () => {
    const { searchPublishedApplications } = await import("./applications");

    await searchPublishedApplications({ q: "test" });

    expect(prismaMock.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          publishedAt: { not: null },
          deletedAt: null,
        }),
      }),
    );
    expect(prismaMock.application.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        publishedAt: { not: null },
        deletedAt: null,
      }),
    });
  });
});
