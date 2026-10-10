"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { VisualCanvas } from "@/components/visual/visual-canvas";
import { VisualPostFx } from "@/components/visual/visual-postfx";
import { VISUAL_PRIMARY } from "@/components/visual/visual-palette";

const TILE_COUNT = 48;

function BrowseGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const matrices = useMemo(() => {
    const items: { x: number; z: number; phase: number }[] = [];
    const span = 7;
    const step = span / Math.sqrt(TILE_COUNT);
    let i = 0;
    for (let x = -span / 2; x < span / 2 && i < TILE_COUNT; x += step) {
      for (let z = -span / 2; z < span / 2 && i < TILE_COUNT; z += step) {
        items.push({ x, z, phase: Math.random() * Math.PI * 2 });
        i++;
      }
    }
    return items;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    matrices.forEach((item, index) => {
      dummy.position.set(item.x, -0.8, item.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.22, 0.04, 0.22);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, matrices]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    matrices.forEach((item, index) => {
      const y = Math.sin(t * 0.6 + item.phase) * 0.06;
      dummy.position.set(item.x, -0.8 + y, item.z);
      dummy.rotation.y = t * 0.08 + item.phase * 0.2;
      dummy.scale.set(0.22, 0.04, 0.22);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TILE_COUNT]}>
      <boxGeometry />
      <meshBasicMaterial color={VISUAL_PRIMARY} transparent opacity={0.18} />
    </instancedMesh>
  );
}

export function BrowseAtmosphereScene({
  frameloop,
}: {
  frameloop: "always" | "never";
}) {
  return (
    <VisualCanvas
      frameloop={frameloop}
      camera={{ position: [0, 1.2, 5.5], fov: 38 }}
    >
      <group rotation={[-0.35, 0.15, 0]}>
        <BrowseGrid />
      </group>
      <VisualPostFx intensity="subtle" />
    </VisualCanvas>
  );
}
