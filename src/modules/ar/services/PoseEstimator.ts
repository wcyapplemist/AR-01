import type { DevicePose, SensorConfig, DriftMetrics } from "../types";
import { DEFAULT_SENSOR_CONFIG } from "../types";
import type { Vector3, Quaternion, SensorReading } from "@/shared/types";
import {
  subtractVectors,
  addVectors,
  scaleVector,
  vectorMagnitude,
  normalizeVector,
  rotateVectorByQuaternion,
  conjugateQuaternion,
  slerpQuaternion,
  normalizeQuaternion,
} from "@/shared/utils/math";

const GRAVITY: Vector3 = { x: 0, y: -9.81, z: 0 };
const ZERO_VEC: Vector3 = { x: 0, y: 0, z: 0 };
const IDENTITY_QUAT: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

export class PoseEstimator {
  private readonly config: SensorConfig;
  private position: Vector3 = { ...ZERO_VEC };
  private velocity: Vector3 = { ...ZERO_VEC };
  private linearAcceleration: Vector3 = { ...ZERO_VEC };
  private orientation: Quaternion = { ...IDENTITY_QUAT };
  private prevAcceleration: Vector3 | null = null;
  private prevVelocity: Vector3 = { ...ZERO_VEC };
  private prevTimestamp: number | null = null;
  private startTimestamp: number | null = null;
  private sampleCount = 0;
  private totalDistance = 0;

  constructor(config?: Partial<SensorConfig>) {
    this.config = { ...DEFAULT_SENSOR_CONFIG, ...config };
  }

  updateOrientation(alignedQuat: Quaternion): void {
    const smoothed = slerpQuaternion(
      this.orientation,
      alignedQuat,
      this.config.orientationSmoothing,
    );
    this.orientation = normalizeQuaternion(smoothed);
  }

  update(reading: SensorReading): DevicePose {
    const now = reading.timestamp;

    if (this.startTimestamp === null) {
      this.startTimestamp = now;
      this.prevTimestamp = now;
      this.prevAcceleration = { ...ZERO_VEC };
    }

    const dt = Math.min((now - (this.prevTimestamp ?? now)) / 1000, 0.1);
    this.prevTimestamp = now;
    this.sampleCount++;

    const gravityDevice = rotateVectorByQuaternion(
      GRAVITY,
      conjugateQuaternion(this.orientation),
    );
    const rawAcc = reading.acceleration;
    const linear: Vector3 = subtractVectors(rawAcc, gravityDevice);

    const mag = vectorMagnitude(linear);
    const filteredAcc: Vector3 =
      mag < this.config.accelerationThreshold ? { ...ZERO_VEC } : linear;

    const avgAcc: Vector3 =
      this.prevAcceleration
        ? scaleVector(addVectors(this.prevAcceleration, filteredAcc), 0.5)
        : filteredAcc;
    this.prevAcceleration = filteredAcc;

    const newVel = addVectors(this.velocity, scaleVector(avgAcc, dt));
    const decayedVel = scaleVector(
      newVel,
      Math.pow(this.config.velocityDecayFactor, dt),
    );
    const velMag = vectorMagnitude(decayedVel);
    const clampedVel: Vector3 =
      velMag > this.config.maxVelocity
        ? scaleVector(normalizeVector(decayedVel), this.config.maxVelocity)
        : decayedVel;

    const avgVel = scaleVector(addVectors(this.prevVelocity, clampedVel), 0.5);
    this.prevVelocity = clampedVel;
    this.velocity = clampedVel;

    this.position = addVectors(this.position, scaleVector(avgVel, dt));
    this.totalDistance += vectorMagnitude(avgVel) * dt;
    this.linearAcceleration = filteredAcc;

    return this.getCurrentPose(now);
  }

  getCurrentPose(timestamp?: number): DevicePose {
    return {
      position: { ...this.position },
      orientation: { ...this.orientation },
      velocity: { ...this.velocity },
      acceleration: { ...this.linearAcceleration },
      timestamp: timestamp ?? performance.now(),
    };
  }

  getDriftMetrics(): DriftMetrics {
    return {
      positionDrift: 0,
      velocityMagnitude: vectorMagnitude(this.velocity),
      totalDistanceTraveled: this.totalDistance,
      elapsedTime:
        this.startTimestamp !== null
          ? (performance.now() - this.startTimestamp) / 1000
          : 0,
      sampleCount: this.sampleCount,
    };
  }

  reset(): void {
    this.position = { ...ZERO_VEC };
    this.velocity = { ...ZERO_VEC };
    this.linearAcceleration = { ...ZERO_VEC };
    this.orientation = { ...IDENTITY_QUAT };
    this.prevAcceleration = null;
    this.prevVelocity = { ...ZERO_VEC };
    this.prevTimestamp = null;
    this.startTimestamp = null;
    this.sampleCount = 0;
    this.totalDistance = 0;
  }
}
