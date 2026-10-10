"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { VisualCanvas } from "@/components/visual/visual-canvas";
import { VISUAL_PRIMARY } from "@/components/visual/visual-palette";

function MiniOrbit() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.rotation.y = t * 0.7;
    group.rotation.x = Math.sin(t * 0.5) * 0.15;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <torusGeometry args={[0.55, 0.03, 8, 40]} />
        <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0.55, 0, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.45, 0.1, 0.2]}>
        <octahedronGeometry args={[0.06, 0]} />
        <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export function MiniOrbitScene({
  frameloop,
}: {
  frameloop: "always" | "never";
}) {
  return (
    <VisualCanvas
      frameloop={frameloop}
      camera={{ position: [0, 0, 2], fov: 50 }}
      className="!relative mx-auto h-24 w-24"
    >
      <MiniOrbit />
    </VisualCanvas>
  );
}
