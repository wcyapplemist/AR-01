import * as THREE from "three";
import type { ThreeSceneOptions } from "../types";

const DEFAULT_OPTIONS: Required<ThreeSceneOptions> = {
  antialias: true,
  alpha: false,
  backgroundColor: "#1a1a2e",
  showGrid: true,
  showAxes: true,
};

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private animationFrameId: number = 0;
  private isRunning = false;
  private readonly options: Required<ThreeSceneOptions>;
  private readonly callbacks: Array<(time: number, delta: number) => void> = [];
  private lastTime = 0;

  constructor(options: ThreeSceneOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  }

  init(canvas: HTMLCanvasElement): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.options.antialias,
      alpha: this.options.alpha,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(this.options.backgroundColor);

    const parent = canvas.parentElement;
    if (parent) {
      const { width, height } = parent.getBoundingClientRect();
      this.resize(width, height);
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== 0) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  dispose(): void {
    this.stop();
    this.callbacks.length = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    this.renderer?.dispose();
    this.renderer = null;
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(width, height);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  getOptions(): Required<ThreeSceneOptions> {
    return this.options;
  }

  onUpdate(callback: (time: number, delta: number) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index !== -1) this.callbacks.splice(index, 1);
    };
  }

  private tick = (time: number): void => {
    if (!this.isRunning) return;
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    for (const cb of this.callbacks) {
      cb(time, delta);
    }

    this.renderer?.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
