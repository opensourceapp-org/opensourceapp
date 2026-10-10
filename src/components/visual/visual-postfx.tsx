"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

type VisualPostFxProps = {
  /** Slightly stronger bloom on the home hero only. */
  intensity?: "subtle" | "hero";
};

export function VisualPostFx({ intensity = "subtle" }: VisualPostFxProps) {
  const bloomIntensity = intensity === "hero" ? 0.35 : 0.22;
  const bloomThreshold = intensity === "hero" ? 0.15 : 0.2;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette eskil offset={0.12} darkness={0.45} />
    </EffectComposer>
  );
}
