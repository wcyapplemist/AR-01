import type { Vector3, Quaternion } from "@/shared/types";

export interface Orientation {
  alpha: number;
  beta: number;
  gamma: number;
  timestamp: number;
}

export interface Acceleration {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface DevicePose {
  position: Vector3;
  orientation: Quaternion;
  velocity: Vector3;
  acceleration: Vector3;
  timestamp: number;
}

export interface SensorConfig {
  samplingRate: number;
  velocityDecayFactor: number;
  accelerationThreshold: number;
  maxVelocity: number;
  orientationSmoothing: number;
}

export interface DriftMetrics {
  positionDrift: number;
  velocityMagnitude: number;
  totalDistanceTraveled: number;
  elapsedTime: number;
  sampleCount: number;
}

export interface SensorStatus {
  motionAvailable: boolean;
  orientationAvailable: boolean;
  permissionGranted: boolean;
  isActive: boolean;
  platform: "ios" | "android" | "other";
  isSecureContext: boolean;
}

export interface SensorDebugData {
  rawOrientation: Orientation | null;
  rawAcceleration: Acceleration | null;
  referenceOrientation: Quaternion | null;
  currentPose: DevicePose | null;
  driftMetrics: DriftMetrics;
  sensorStatus: SensorStatus;
}

export const DEFAULT_SENSOR_CONFIG: SensorConfig = {
  samplingRate: 60,
  velocityDecayFactor: 0.98,
  accelerationThreshold: 0.1,
  maxVelocity: 2.0,
  orientationSmoothing: 0.8,
};

export type { Vector3, Quaternion, Pose, TimestampedPose, DualCoordinateState } from "@/shared/types";
export type { QRCodeContent } from "@/shared/types";
export type { SensorReading } from "@/shared/types";
