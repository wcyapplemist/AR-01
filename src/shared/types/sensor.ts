import type { Vector3 } from "./spatial";

export interface SensorReading {
  acceleration: Vector3;
  angularVelocity: Vector3;
  rotationRate: Vector3;
  timestamp: number;
}
