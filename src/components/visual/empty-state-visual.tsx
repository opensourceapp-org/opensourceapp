"use client";

import dynamic from "next/dynamic";
import { useVisualCanvasPolicy } from "@/components/visual/use-visual-canvas-policy";
import { cn } from "@/lib/utils";

const MiniOrbitScene = dynamic(
  () =>
    import("@/components/visual/mini-orbit-scene").then(
      (mod) => mod.MiniOrbitScene,
    ),
  { ssr: false },
);

type EmptyStateVisualProps = {
  className?: string;
};

export function EmptyStateVisual({ className }: EmptyStateVisualProps) {
  const { canvasEnabled, frameloop } = useVisualCanvasPolicy();

  return (
    <div
      className={cn("mb-4 flex justify-center", className)}
      aria-hidden="true"
    >
      <div className="relative h-24 w-24 rounded-full bg-[radial-gradient(circle,oklch(0.42_0.11_168/0.1),transparent_65%)]">
        {canvasEnabled ? <MiniOrbitScene frameloop={frameloop} /> : (
          <div
            className="absolute inset-2 rounded-full border border-dashed border-primary/25"
          />
        )}
      </div>
    </div>
  );
}
