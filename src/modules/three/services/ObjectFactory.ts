import * as THREE from "three";
import type { SceneManager } from "./SceneManager";

export function createDemoCube(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x4fc3f7,
    metalness: 0.3,
    roughness: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0.5, 0);
  return mesh;
}

export function addRotationAnimation(
  mesh: THREE.Object3D,
  manager: SceneManager,
  speed: number = 1
): () => void {
  return manager.onUpdate((_time, delta) => {
    mesh.rotation.x += delta * speed * 0.5;
    mesh.rotation.y += delta * speed;
  });
}

export function createSphere(
  position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
  color: number = 0xff7043,
  radius: number = 0.3
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.2,
    roughness: 0.6,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  return mesh;
}
