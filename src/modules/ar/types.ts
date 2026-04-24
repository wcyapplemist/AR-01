import type { Vector3, Quaternion, Pose } from "@/shared/types";

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

export interface RelativePose {
  pose: Pose;
  timestamp: number;
  driftEstimate: number;
}

export interface AbsolutePose {
  pose: Pose;
  timestamp: number;
  source: "qr" | "visual" | "fusion";
  confidence: number;
}

export interface CoordinateFrame {
  id: string;
  origin: Vector3;
  orientation: Quaternion;
  createdAt: number;
  lastUpdated: number;
  calibrationSource: "qr" | "manual";
  correctionCount: number;
}

export interface DriftCorrectionEvent {
  timestamp: number;
  type: "qr" | "visual" | "decay" | "threshold";
  beforePose: Pose;
  afterPose: Pose;
  correctionDelta: Vector3;
  confidence: number;
}

export interface DriftCorrectionConfig {
  velocityDecay: number;
  accelerationThreshold: number;
  maxVelocity: number;
  correctionThreshold: number;
  maxCorrectionStep: number;
  qrConfidenceWeight: number;
  visualConfidenceWeight: number;
  sensorConfidenceWeight: number;
}

export interface FusionState {
  relativePose: RelativePose;
  absolutePose: AbsolutePose | null;
  frame: CoordinateFrame | null;
  lastCorrection: DriftCorrectionEvent | null;
  fusionWeights: {
    sensor: number;
    qr: number;
    visual: number;
  };
}

export interface VisualCorrection {
  markerId: string;
  detectedPosition: Vector3;
  absolutePosition: Vector3;
  correctionDelta: Vector3;
  confidence: number;
  timestamp: number;
}

export const DEFAULT_SENSOR_CONFIG: SensorConfig = {
  samplingRate: 60,
  velocityDecayFactor: 0.98,
  accelerationThreshold: 0.1,
  maxVelocity: 2.0,
  orientationSmoothing: 0.8,
};

export const DEFAULT_DRIFT_CORRECTION_CONFIG: DriftCorrectionConfig = {
  velocityDecay: 0.98,
  accelerationThreshold: 0.1,
  maxVelocity: 2.0,
  correctionThreshold: 0.05,
  maxCorrectionStep: 0.5,
  qrConfidenceWeight: 0.9,
  visualConfidenceWeight: 0.7,
  sensorConfidenceWeight: 0.3,
};

export type { Vector3, Quaternion, Pose, TimestampedPose, DualCoordinateState } from "@/shared/types";
export type { QRCodeContent } from "@/shared/types";
export type { SensorReading } from "@/shared/types";
