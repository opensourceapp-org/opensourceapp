"use client";

import dynamic from "next/dynamic";
import { HeroVisualFallback } from "@/components/visual/hero-visual-fallback";
import { useVisualCanvasPolicy } from "@/components/visual/use-visual-canvas-policy";
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
  const { canvasEnabled, frameloop } = useVisualCanvasPolicy();

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
