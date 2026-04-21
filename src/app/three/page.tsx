"use client";

import { useEffect, useRef } from "react";
import { useThreeScene } from "@/modules/three/hooks/useThreeScene";
import { SceneBuilder } from "@/modules/three/services/SceneBuilder";
import { createDemoCube, addRotationAnimation, createSphere } from "@/modules/three/services/ObjectFactory";
import FPSCounter from "@/modules/three/components/FPSCounter";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function ThreePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { sceneManager, isReady } = useThreeScene(containerRef);

  useEffect(() => {
    if (!isReady || !sceneManager.current) return;
    const manager = sceneManager.current;

    const builder = new SceneBuilder(manager);
    builder.build();

    const cube = createDemoCube();
    manager.getScene().add(cube);
    const removeCubeRotation = addRotationAnimation(cube, manager);

    const sphere = createSphere(
      new THREE.Vector3(2, 0.3, -1),
      0xff7043,
      0.3
    );
    manager.getScene().add(sphere);

    const renderer = manager.getRenderer();
    const camera = manager.getCamera();
    let controls: OrbitControls | null = null;
    if (renderer) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 50;
      manager.onUpdate(() => controls?.update());
    }

    return () => {
      removeCubeRotation();
      controls?.dispose();
    };
  }, [isReady, sceneManager]);

  return (
    <div className="relative h-screen w-screen bg-black">
      <div ref={containerRef} className="h-full w-full" />
      <FPSCounter />
      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-neutral-500">
        Three.js Module Demo
      </div>
    </div>
  );
}
