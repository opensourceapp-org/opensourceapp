"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { VisualCanvas } from "@/components/visual/visual-canvas";
import { VisualPostFx } from "@/components/visual/visual-postfx";
import { VISUAL_PRIMARY } from "@/components/visual/visual-palette";

type NodeNetworkProps = {
  nodeCount: number;
  linkDistance: number;
};

function NodeNetwork({ nodeCount, linkDistance }: NodeNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { nodes, lineGeometry } = useMemo(() => {
    const nodePositions: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodePositions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 2.8,
          (Math.random() - 0.5) * 2.2,
        ),
      );
    }
    const positions: number[] = [];
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < linkDistance) {
          positions.push(
            nodePositions[i].x,
            nodePositions[i].y,
            nodePositions[i].z,
            nodePositions[j].x,
            nodePositions[j].y,
            nodePositions[j].z,
          );
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return { nodes: nodePositions, lineGeometry: geometry };
  }, [nodeCount, linkDistance]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.06;
    group.rotation.x = Math.sin(performance.now() * 0.00015) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.22} />
      </lineSegments>
      {nodes.map((position, index) => (
        <mesh key={index} position={position}>
          <octahedronGeometry args={[0.055, 0]} />
          <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export type HeroSceneCanvasProps = {
  frameloop: "always" | "never";
  variant: "home" | "compact";
};

export function HeroSceneCanvas({ frameloop, variant }: HeroSceneCanvasProps) {
  const nodeCount = variant === "home" ? 16 : 10;
  const linkDistance = variant === "home" ? 1.85 : 1.6;

  return (
    <VisualCanvas
      frameloop={frameloop}
      camera={{ position: [0, 0, 4.8], fov: 42 }}
    >
      <NodeNetwork nodeCount={nodeCount} linkDistance={linkDistance} />
      {variant === "home" ? <VisualPostFx intensity="hero" /> : null}
    </VisualCanvas>
  );
}
