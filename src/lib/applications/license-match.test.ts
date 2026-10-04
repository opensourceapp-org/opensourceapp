import { describe, expect, it } from "vitest";
import { guessLicenseSlug } from "./license-match";

describe("guessLicenseSlug", () => {
  it("maps MIT SPDX id", () => {
    expect(
      guessLicenseSlug({ spdxId: "MIT", key: "mit", name: "MIT License" }),
    ).toBe("mit");
  });

  it("maps Apache SPDX id", () => {
    expect(
      guessLicenseSlug({
        spdxId: "Apache-2.0",
        key: "apache-2.0",
        name: "Apache License 2.0",
      }),
    ).toBe("apache-2");
  });

  it("returns null when unknown", () => {
    expect(
      guessLicenseSlug({ spdxId: null, key: null, name: null }),
    ).toBeNull();
  });
});
