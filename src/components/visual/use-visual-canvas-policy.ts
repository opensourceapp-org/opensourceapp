"use client";

import { useEffect, useState } from "react";
import { VISUAL_NARROW_BREAKPOINT_PX } from "@/components/visual/visual-palette";
import { shouldEnableWebGLCanvas } from "@/components/visual/visual-policy";

export function useVisualCanvasPolicy() {
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowMq = window.matchMedia(
      `(max-width: ${VISUAL_NARROW_BREAKPOINT_PX}px)`,
    );

    const sync = () => {
      setCanvasEnabled(
        shouldEnableWebGLCanvas({
          prefersReducedMotion: motionMq.matches,
          isNarrowViewport: narrowMq.matches,
        }),
      );
    };

    sync();
    motionMq.addEventListener("change", sync);
    narrowMq.addEventListener("change", sync);
    return () => {
      motionMq.removeEventListener("change", sync);
      narrowMq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      setFrameloop(document.hidden ? "never" : "always");
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return { canvasEnabled, frameloop };
}
