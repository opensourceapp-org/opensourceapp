"use client";

import { Canvas } from "@react-three/fiber";
import type { CanvasProps } from "@react-three/fiber";
import { VISUAL_CANVAS_DPR } from "@/components/visual/visual-palette";
import { cn } from "@/lib/utils";

type VisualCanvasProps = Omit<CanvasProps, "dpr" | "gl"> & {
  frameloop: "always" | "never";
  className?: string;
};

/**
 * Shared R3F canvas defaults: capped DPR, transparent low-power GL, full-bleed layout.
 */
export function VisualCanvas({
  frameloop,
  className,
  children,
  ...rest
}: VisualCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={VISUAL_CANVAS_DPR}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      className={cn("!absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </Canvas>
  );
}
