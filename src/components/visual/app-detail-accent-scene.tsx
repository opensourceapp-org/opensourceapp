"use client";

import { useFrame } from "@react-three/fiber";
import { dampE } from "maath/easing";
import { useRef } from "react";
import type * as THREE from "three";
import { VisualCanvas } from "@/components/visual/visual-canvas";
import { VisualPostFx } from "@/components/visual/visual-postfx";
import { VISUAL_PRIMARY } from "@/components/visual/visual-palette";

function OrbitAccent() {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const satellitesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.4) * 0.08;
      ringRef.current.rotation.z = t * 0.25;
    }
    if (coreRef.current) {
      dampE(
        coreRef.current.rotation,
        [t * 0.35, t * 0.5, 0],
        0.8,
        delta,
      );
    }
    if (satellitesRef.current) {
      satellitesRef.current.rotation.y = t * 0.55;
    }
  });

  const satelliteAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshBasicMaterial color={VISUAL_PRIMARY} wireframe transparent opacity={0.35} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.72, 0.018, 12, 64]} />
        <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.28} />
      </mesh>
      <group ref={satellitesRef}>
        {satelliteAngles.map((angle, i) => (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.95, Math.sin(angle) * 0.12, Math.sin(angle) * 0.95]}
          >
            <octahedronGeometry args={[0.07, 0]} />
            <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function AppDetailAccentScene({
  frameloop,
}: {
  frameloop: "always" | "never";
}) {
  return (
    <VisualCanvas
      frameloop={frameloop}
      camera={{ position: [0, 0, 2.4], fov: 45 }}
      className="!relative h-full w-full"
    >
      <OrbitAccent />
      <VisualPostFx intensity="subtle" />
    </VisualCanvas>
  );
}
