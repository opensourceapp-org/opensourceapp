"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { VisualCanvas } from "@/components/visual/visual-canvas";
import { VisualPostFx } from "@/components/visual/visual-postfx";
import { VISUAL_PRIMARY } from "@/components/visual/visual-palette";

function LostNodes() {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = useMemo(() => {
    return Array.from({ length: 8 }, () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.2,
      ),
    );
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.12;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.4} />
        </mesh>
      ))}
      <mesh>
        <torusGeometry args={[0.9, 0.02, 8, 48]} />
        <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export function NotFoundScene({
  frameloop,
}: {
  frameloop: "always" | "never";
}) {
  return (
    <VisualCanvas
      frameloop={frameloop}
      camera={{ position: [0, 0, 3.2], fov: 42 }}
      className="!relative mx-auto h-40 w-full max-w-md"
    >
      <LostNodes />
      <VisualPostFx intensity="subtle" />
    </VisualCanvas>
  );
}
