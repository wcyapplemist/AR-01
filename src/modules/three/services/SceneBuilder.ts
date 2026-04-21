import * as THREE from "three";
import type { SceneManager } from "./SceneManager";

export class SceneBuilder {
  constructor(private readonly manager: SceneManager) {}

  build(): void {
    this.addLights();
    const opts = this.manager.getOptions();
    if (opts.showGrid) this.addGrid();
    if (opts.showAxes) this.addAxes();
    this.positionCamera();
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.manager.getScene().add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    this.manager.getScene().add(directional);
  }

  private addGrid(): void {
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.manager.getScene().add(grid);
  }

  private addAxes(): void {
    const axes = new THREE.AxesHelper(5);
    this.manager.getScene().add(axes);
  }

  private positionCamera(): void {
    const camera = this.manager.getCamera();
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }
}
