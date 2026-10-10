"use client";

import dynamic from "next/dynamic";
import { useVisualCanvasPolicy } from "@/components/visual/use-visual-canvas-policy";

const NotFoundScene = dynamic(
  () =>
    import("@/components/visual/not-found-scene").then(
      (mod) => mod.NotFoundScene,
    ),
  { ssr: false },
);

export function NotFoundVisual() {
  const { canvasEnabled, frameloop } = useVisualCanvasPolicy();

  return (
    <div className="relative" aria-hidden="true">
      <div
        className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,oklch(0.42_0.11_168/0.1),transparent_70%)]"
      />
      {canvasEnabled ? (
        <NotFoundScene frameloop={frameloop} />
      ) : (
        <div className="mx-auto flex h-40 max-w-md items-center justify-center">
          <div className="h-24 w-24 rounded-full border border-dashed border-primary/30" />
        </div>
      )}
    </div>
  );
}
