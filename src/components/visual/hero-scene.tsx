"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PRIMARY = "#3a7562";

type NodeNetworkProps = {
  nodeCount: number;
  linkDistance: number;
};

function NodeNetwork({ nodeCount, linkDistance }: NodeNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5.5,
          (Math.random() - 0.5) * 2.8,
          (Math.random() - 0.5) * 2.2,
        ),
      );
    }
    return positions;
  }, [nodeCount]);

  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < linkDistance) {
          positions.push(
            nodes[i].x,
            nodes[i].y,
            nodes[i].z,
            nodes[j].x,
            nodes[j].y,
            nodes[j].z,
          );
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geometry;
  }, [nodes, linkDistance]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.06;
    group.rotation.x = Math.sin(performance.now() * 0.00015) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={PRIMARY} transparent opacity={0.22} />
      </lineSegments>
      {nodes.map((position, index) => (
        <mesh key={index} position={position}>
          <octahedronGeometry args={[0.055, 0]} />
          <meshBasicMaterial color={PRIMARY} transparent opacity={0.5} />
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
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.8], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      className="!absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <NodeNetwork nodeCount={nodeCount} linkDistance={linkDistance} />
    </Canvas>
  );
}
