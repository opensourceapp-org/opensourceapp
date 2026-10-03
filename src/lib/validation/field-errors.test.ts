import { describe, expect, it } from "vitest";
import { flattenFieldErrors, parseActionError } from "./field-errors";

describe("parseActionError", () => {
  it("passes through string errors", () => {
    expect(parseActionError("Unauthorized")).toEqual({
      message: "Unauthorized",
      fieldErrors: {},
    });
  });

  it("parses zod flatten fieldErrors", () => {
    const result = parseActionError({
      description: ["Must be at least 20 characters"],
      homepageUrl: ["Must be a valid URL"],
    });
    expect(result.fieldErrors.description).toEqual([
      "Must be at least 20 characters",
    ]);
    expect(result.message).toContain("fix");
  });
});

describe("flattenFieldErrors", () => {
  it("prefixes human labels", () => {
    expect(
      flattenFieldErrors({ name: ["Must be at least 2 characters"] }),
    ).toEqual(["Name: Must be at least 2 characters"]);
  });
});
