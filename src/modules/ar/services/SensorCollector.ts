import type { SensorConfig, Orientation } from "../types";
import { DEFAULT_SENSOR_CONFIG } from "../types";
import type { SensorReading } from "@/shared/types";

export class SensorCollector {
  private readonly config: SensorConfig;
  private active = false;
  private latestMotion: SensorReading | null = null;
  private latestOrientation: Orientation | null = null;
  private readonly motionCallbacks: Array<(reading: SensorReading) => void> = [];
  private readonly orientationCallbacks: Array<(reading: Orientation) => void> = [];
  private lastMotionTime = 0;
  private lastOrientationTime = 0;
  private handleMotion: ((e: DeviceMotionEvent) => void) | null = null;
  private handleOrientation: ((e: DeviceOrientationEvent) => void) | null = null;

  constructor(config?: Partial<SensorConfig>) {
    this.config = { ...DEFAULT_SENSOR_CONFIG, ...config };
  }

  start(): void {
    if (this.active) return;

    const minInterval = 1000 / this.config.samplingRate;

    this.handleMotion = (e: DeviceMotionEvent) => {
      const now = performance.now();
      if (now - this.lastMotionTime < minInterval) return;
      this.lastMotionTime = now;

      const acc = e.accelerationIncludingGravity;
      const rot = e.rotationRate;
      this.latestMotion = {
        acceleration: {
          x: acc?.x ?? 0,
          y: acc?.y ?? 0,
          z: acc?.z ?? 0,
        },
        angularVelocity: {
          x: rot?.alpha ?? 0,
          y: rot?.beta ?? 0,
          z: rot?.gamma ?? 0,
        },
        rotationRate: {
          x: rot?.alpha ?? 0,
          y: rot?.beta ?? 0,
          z: rot?.gamma ?? 0,
        },
        timestamp: now,
      };
      for (const cb of this.motionCallbacks) cb(this.latestMotion);
    };

    this.handleOrientation = (e: DeviceOrientationEvent) => {
      const now = performance.now();
      if (now - this.lastOrientationTime < minInterval) return;
      this.lastOrientationTime = now;

      this.latestOrientation = {
        alpha: e.alpha ?? 0,
        beta: e.beta ?? 0,
        gamma: e.gamma ?? 0,
        timestamp: now,
      };
      for (const cb of this.orientationCallbacks) cb(this.latestOrientation);
    };

    window.addEventListener("devicemotion", this.handleMotion);
    window.addEventListener("deviceorientation", this.handleOrientation);
    this.active = true;
  }

  stop(): void {
    if (!this.active) return;
    if (this.handleMotion) {
      window.removeEventListener("devicemotion", this.handleMotion);
      this.handleMotion = null;
    }
    if (this.handleOrientation) {
      window.removeEventListener("deviceorientation", this.handleOrientation);
      this.handleOrientation = null;
    }
    this.active = false;
  }

  getLatestMotion(): SensorReading | null {
    return this.latestMotion;
  }

  getLatestOrientation(): Orientation | null {
    return this.latestOrientation;
  }

  onMotion(callback: (reading: SensorReading) => void): () => void {
    this.motionCallbacks.push(callback);
    return () => {
      const idx = this.motionCallbacks.indexOf(callback);
      if (idx !== -1) this.motionCallbacks.splice(idx, 1);
    };
  }

  onOrientation(callback: (reading: Orientation) => void): () => void {
    this.orientationCallbacks.push(callback);
    return () => {
      const idx = this.orientationCallbacks.indexOf(callback);
      if (idx !== -1) this.orientationCallbacks.splice(idx, 1);
    };
  }

  isActive(): boolean {
    return this.active;
  }
}
