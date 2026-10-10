import { describe, expect, it } from "vitest";
import {
  activeApplicationWhere,
  deletedApplicationWhere,
  publishedApplicationWhere,
} from "@/lib/applications/visibility";

describe("application visibility filters", () => {
  it("excludes soft-deleted apps from public listings", () => {
    expect(publishedApplicationWhere()).toEqual({
      publishedAt: { not: null },
      deletedAt: null,
    });
  });

  it("excludes soft-deleted apps from admin active set", () => {
    expect(activeApplicationWhere()).toEqual({ deletedAt: null });
  });

  it("lists only soft-deleted apps in admin trash", () => {
    expect(deletedApplicationWhere()).toEqual({
      deletedAt: { not: null },
    });
  });
});
