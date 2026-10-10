"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroVisualFallback } from "@/components/visual/hero-visual-fallback";
import { shouldEnableHeroCanvas } from "@/components/visual/hero-visual-policy";
import { cn } from "@/lib/utils";

const HeroSceneCanvas = dynamic(
  () =>
    import("@/components/visual/hero-scene").then((mod) => mod.HeroSceneCanvas),
  { ssr: false },
);

export type HeroVisualVariant = "home" | "compact";

type HeroVisualProps = {
  variant?: HeroVisualVariant;
  className?: string;
};

/**
 * Decorative hero backdrop: CSS fallback always, optional low-poly WebGL on capable viewports.
 */
export function HeroVisual({ variant = "home", className }: HeroVisualProps) {
  const [canvasEnabled, setCanvasEnabled] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowMq = window.matchMedia("(max-width: 767px)");

    const sync = () => {
      setCanvasEnabled(
        shouldEnableHeroCanvas({
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

  const minHeight =
    variant === "home" ? "min-h-[22rem] md:min-h-[26rem]" : "min-h-[7rem]";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        minHeight,
        className,
      )}
      aria-hidden="true"
    >
      <HeroVisualFallback variant={variant} />
      {canvasEnabled ? (
        <HeroSceneCanvas frameloop={frameloop} variant={variant} />
      ) : null}
    </div>
  );
}
