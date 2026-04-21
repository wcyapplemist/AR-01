export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface EulerAngles {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface Pose {
  position: Vector3;
  orientation: Quaternion;
}

export interface TimestampedPose {
  pose: Pose;
  timestamp: number;
}

export interface DualCoordinateState {
  relative: Pose;
  absolute: Pose | null;
  lastCorrectionTime: number;
  correctionCount: number;
}
