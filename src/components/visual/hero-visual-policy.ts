/** Whether to mount the WebGL hero canvas (static CSS fallback otherwise). */
export function shouldEnableHeroCanvas(options: {
  prefersReducedMotion: boolean;
  isNarrowViewport: boolean;
}): boolean {
  return !options.prefersReducedMotion && !options.isNarrowViewport;
}
