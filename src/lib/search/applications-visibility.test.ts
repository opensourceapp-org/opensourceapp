import { describe, expect, it } from "vitest";
import { publishedApplicationWhere } from "@/lib/applications/visibility";

describe("searchPublishedApplications visibility", () => {
  it("requires published and non-deleted applications", () => {
    const where = publishedApplicationWhere();
    expect(where.deletedAt).toBeNull();
    expect(where.publishedAt).toEqual({ not: null });
  });
});
