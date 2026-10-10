"use client";

import dynamic from "next/dynamic";
import { HeroVisualFallback } from "@/components/visual/hero-visual-fallback";
import { useVisualCanvasPolicy } from "@/components/visual/use-visual-canvas-policy";
import { cn } from "@/lib/utils";

const BrowseAtmosphereScene = dynamic(
  () =>
    import("@/components/visual/browse-atmosphere-scene").then(
      (mod) => mod.BrowseAtmosphereScene,
    ),
  { ssr: false },
);

type BrowseAtmosphereProps = {
  className?: string;
};

/** /apps browse header atmosphere — instanced grid, shared green palette. */
export function BrowseAtmosphere({ className }: BrowseAtmosphereProps) {
  const { canvasEnabled, frameloop } = useVisualCanvasPolicy();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 min-h-[7rem] overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <HeroVisualFallback variant="compact" />
      {canvasEnabled ? (
        <BrowseAtmosphereScene frameloop={frameloop} />
      ) : null}
    </div>
  );
}
