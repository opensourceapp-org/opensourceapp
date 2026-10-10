import { describe, expect, it } from "vitest";
import {
  shouldEnableHeroCanvas,
  shouldEnableWebGLCanvas,
} from "./visual-policy";

describe("shouldEnableWebGLCanvas", () => {
  it("disables canvas when reduced motion is preferred", () => {
    expect(
      shouldEnableWebGLCanvas({
        prefersReducedMotion: true,
        isNarrowViewport: false,
      }),
    ).toBe(false);
  });

  it("disables canvas on narrow viewports", () => {
    expect(
      shouldEnableWebGLCanvas({
        prefersReducedMotion: false,
        isNarrowViewport: true,
      }),
    ).toBe(false);
  });

  it("enables canvas on desktop without reduced motion", () => {
    expect(
      shouldEnableWebGLCanvas({
        prefersReducedMotion: false,
        isNarrowViewport: false,
      }),
    ).toBe(true);
  });

  it("aliases shouldEnableHeroCanvas", () => {
    expect(shouldEnableHeroCanvas).toBe(shouldEnableWebGLCanvas);
  });
});
