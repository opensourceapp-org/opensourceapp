import { describe, expect, it } from "vitest";
import { sanitizeAppSvg } from "./svg";

describe("sanitizeAppSvg", () => {
  it("accepts a minimal svg", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>';
    expect(sanitizeAppSvg(svg)?.includes("<svg")).toBe(true);
  });

  it("rejects script content", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const clean = sanitizeAppSvg(svg);
    expect(clean?.includes("script")).toBeFalsy();
  });
});
