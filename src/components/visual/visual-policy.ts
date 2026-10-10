/** Whether to mount decorative WebGL canvases (CSS fallback otherwise). */
export function shouldEnableWebGLCanvas(options: {
  prefersReducedMotion: boolean;
  isNarrowViewport: boolean;
}): boolean {
  return !options.prefersReducedMotion && !options.isNarrowViewport;
}

/** @deprecated Use shouldEnableWebGLCanvas */
export const shouldEnableHeroCanvas = shouldEnableWebGLCanvas;
