import { describe, expect, it } from "vitest";
import { shouldEnableHeroCanvas } from "./hero-visual-policy";

describe("shouldEnableHeroCanvas", () => {
  it("disables canvas when reduced motion is preferred", () => {
    expect(
      shouldEnableHeroCanvas({
        prefersReducedMotion: true,
        isNarrowViewport: false,
      }),
    ).toBe(false);
  });

  it("disables canvas on narrow viewports", () => {
    expect(
      shouldEnableHeroCanvas({
        prefersReducedMotion: false,
        isNarrowViewport: true,
      }),
    ).toBe(false);
  });

  it("enables canvas on desktop without reduced motion", () => {
    expect(
      shouldEnableHeroCanvas({
        prefersReducedMotion: false,
        isNarrowViewport: false,
      }),
    ).toBe(true);
  });
});
