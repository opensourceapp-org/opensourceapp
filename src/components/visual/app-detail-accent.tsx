"use client";

import dynamic from "next/dynamic";
import { useVisualCanvasPolicy } from "@/components/visual/use-visual-canvas-policy";
import { cn } from "@/lib/utils";

const AppDetailAccentScene = dynamic(
  () =>
    import("@/components/visual/app-detail-accent-scene").then(
      (mod) => mod.AppDetailAccentScene,
    ),
  { ssr: false },
);

type AppDetailAccentProps = {
  className?: string;
};

/** Small orbit accent beside app detail headers (desktop WebGL only). */
export function AppDetailAccent({ className }: AppDetailAccentProps) {
  const { canvasEnabled, frameloop } = useVisualCanvasPolicy();

  return (
    <div
      className={cn(
        "relative hidden h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-primary/10 bg-[radial-gradient(ellipse_at_center,oklch(0.42_0.11_168/0.12),transparent_70%)] md:block",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.42 0.11 168 / 8%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.42 0.11 168 / 8%) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {canvasEnabled ? (
        <AppDetailAccentScene frameloop={frameloop} />
      ) : null}
    </div>
  );
}
