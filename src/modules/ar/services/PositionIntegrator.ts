import type { SensorConfig, DevicePose, SensorDebugData, SensorStatus, Acceleration } from "../types";
import { DEFAULT_SENSOR_CONFIG } from "../types";
import { SensorPermission } from "./SensorPermission";
import { SensorCollector } from "./SensorCollector";
import { CoordinateAligner } from "./CoordinateAligner";
import { PoseEstimator } from "./PoseEstimator";

export class PositionIntegrator {
  private readonly config: SensorConfig;
  private readonly collector: SensorCollector;
  private readonly aligner: CoordinateAligner;
  private readonly estimator: PoseEstimator;
  private tracking = false;
  private referenceCaptured = false;
  private readonly poseCallbacks: Array<(pose: DevicePose) => void> = [];
  private readonly debugCallbacks: Array<(data: SensorDebugData) => void> = [];
  private unsubMotion: (() => void) | null = null;
  private unsubOrientation: (() => void) | null = null;
  private currentPose: DevicePose | null = null;
  private rawAcceleration: Acceleration | null = null;
  private permissionGranted = false;

  constructor(config?: Partial<SensorConfig>) {
    this.config = { ...DEFAULT_SENSOR_CONFIG, ...config };
    this.collector = new SensorCollector(this.config);
    this.aligner = new CoordinateAligner();
    this.estimator = new PoseEstimator(this.config);
  }

  emitInitialStatus(): void {
    this.emitDebug();
  }

  async start(): Promise<void> {
    if (this.tracking) return;

    try {
      await SensorPermission.requestPermission();
    } catch (e) {
      this.emitDebug();
      throw e;
    }
    this.permissionGranted = true;

    this.estimator.reset();
    this.aligner.reset();
    this.referenceCaptured = false;

    this.unsubOrientation = this.collector.onOrientation((reading) => {
      if (!this.referenceCaptured) {
        this.aligner.captureReference(reading);
        this.referenceCaptured = true;
      }
      const aligned = this.aligner.alignToReference(reading);
      if (aligned) {
        this.estimator.updateOrientation(aligned);
      }
    });

    this.unsubMotion = this.collector.onMotion((reading) => {
      this.rawAcceleration = {
        x: reading.acceleration.x,
        y: reading.acceleration.y,
        z: reading.acceleration.z,
        timestamp: reading.timestamp,
      };
      const pose = this.estimator.update(reading);
      this.currentPose = pose;
      for (const cb of this.poseCallbacks) cb(pose);
      this.emitDebug();
    });

    this.collector.start();
    this.tracking = true;
    this.emitDebug();
  }

  stop(): void {
    if (!this.tracking) return;
    this.collector.stop();
    this.unsubMotion?.();
    this.unsubOrientation?.();
    this.unsubMotion = null;
    this.unsubOrientation = null;
    this.tracking = false;
    this.emitDebug();
  }

  onPoseUpdate(callback: (pose: DevicePose) => void): () => void {
    this.poseCallbacks.push(callback);
    return () => {
      const idx = this.poseCallbacks.indexOf(callback);
      if (idx !== -1) this.poseCallbacks.splice(idx, 1);
    };
  }

  onDebugUpdate(callback: (data: SensorDebugData) => void): () => void {
    this.debugCallbacks.push(callback);
    return () => {
      const idx = this.debugCallbacks.indexOf(callback);
      if (idx !== -1) this.debugCallbacks.splice(idx, 1);
    };
  }

  getCurrentPose(): DevicePose | null {
    return this.currentPose;
  }

  getSensorStatus(): SensorStatus {
    return {
      motionAvailable: SensorPermission.isMotionSupported(),
      orientationAvailable: SensorPermission.isOrientationSupported(),
      permissionGranted: this.permissionGranted,
      isActive: this.tracking,
      platform: SensorPermission.detectPlatform(),
      isSecureContext: SensorPermission.isSecureContext(),
    };
  }

  isTracking(): boolean {
    return this.tracking;
  }

  emitDebug(): void {
    const data: SensorDebugData = {
      rawOrientation: this.collector.getLatestOrientation(),
      rawAcceleration: this.rawAcceleration,
      referenceOrientation: this.aligner.getReference(),
      currentPose: this.currentPose,
      driftMetrics: this.estimator.getDriftMetrics(),
      sensorStatus: this.getSensorStatus(),
    };
    for (const cb of this.debugCallbacks) cb(data);
  }
}
