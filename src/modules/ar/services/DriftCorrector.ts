import type {
  DevicePose,
  DriftCorrectionConfig,
  RelativePose,
  AbsolutePose,
  DriftCorrectionEvent,
} from "../types";
import { DEFAULT_DRIFT_CORRECTION_CONFIG } from "../types";
import type { Vector3 } from "@/shared/types";
import {
  scaleVector,
  vectorMagnitude,
  normalizeVector,
  subtractVectors,
  addVectors,
  lerp as lerpNum,
  vectorDistance,
} from "@/shared/utils/math";
import { CoordinateTransformer } from "./CoordinateTransformer";

const DRIFT_COEFFICIENT = 0.01;
const ZERO_VEC: Vector3 = { x: 0, y: 0, z: 0 };

export class DriftCorrector {
  private readonly config: DriftCorrectionConfig;
  private prevVelocity: Vector3 = { ...ZERO_VEC };
  private correctedPosition: Vector3 = { ...ZERO_VEC };
  private startTimestamp: number | null = null;
  private totalDrift = 0;
  private correctionCount = 0;
  private maxCorrection = 0;
  private totalCorrectionSum = 0;
  private lastCorrectionTime = 0;

  constructor(config?: Partial<DriftCorrectionConfig>) {
    this.config = { ...DEFAULT_DRIFT_CORRECTION_CONFIG, ...config };
  }

  correct(rawPose: DevicePose, dt: number): RelativePose {
    if (this.startTimestamp === null) {
      this.startTimestamp = rawPose.timestamp;
    }

    const elapsedTime = (rawPose.timestamp - this.startTimestamp) / 1000;

    const accMag = vectorMagnitude(rawPose.acceleration);
    const filteredAcc: Vector3 =
      accMag < this.config.accelerationThreshold
        ? { ...ZERO_VEC }
        : rawPose.acceleration;

    const decayedVel = scaleVector(
      rawPose.velocity,
      Math.pow(this.config.velocityDecay, dt),
    );

    const avgVel: Vector3 = {
      x: (this.prevVelocity.x + decayedVel.x) / 2,
      y: (this.prevVelocity.y + decayedVel.y) / 2,
      z: (this.prevVelocity.z + decayedVel.z) / 2,
    };
    this.prevVelocity = decayedVel;

    this.correctedPosition = addVectors(
      this.correctedPosition,
      scaleVector(avgVel, dt),
    );

    const driftEstimate = DRIFT_COEFFICIENT * Math.sqrt(elapsedTime);

    return {
      pose: {
        position: { ...this.correctedPosition },
        orientation: rawPose.orientation,
      },
      timestamp: rawPose.timestamp,
      driftEstimate,
    };
  }

  applyExternalCorrection(
    currentRelative: RelativePose,
    targetAbsolute: AbsolutePose,
    transformer: CoordinateTransformer,
  ): DriftCorrectionEvent {
    const currentAbsolute = transformer.relativeToAbsolute(currentRelative);
    const currentAbsPos = currentAbsolute?.pose.position ?? currentRelative.pose.position;

    let delta: Vector3 = subtractVectors(
      targetAbsolute.pose.position,
      currentAbsPos,
    );
    const deltaMag = vectorMagnitude(delta);

    if (deltaMag > this.config.maxCorrectionStep) {
      delta = scaleVector(normalizeVector(delta), this.config.maxCorrectionStep);
    }

    const correctedPos: Vector3 = {
      x: lerpNum(currentRelative.pose.position.x, currentRelative.pose.position.x + delta.x, this.config.qrConfidenceWeight),
      y: lerpNum(currentRelative.pose.position.y, currentRelative.pose.position.y + delta.y, this.config.qrConfidenceWeight),
      z: lerpNum(currentRelative.pose.position.z, currentRelative.pose.position.z + delta.z, this.config.qrConfidenceWeight),
    };

    const effectiveDelta: Vector3 = subtractVectors(correctedPos, currentRelative.pose.position);
    const effectiveMag = vectorMagnitude(effectiveDelta);

    this.correctedPosition = { ...correctedPos };
    this.correctionCount++;
    this.totalCorrectionSum += effectiveMag;
    this.maxCorrection = Math.max(this.maxCorrection, effectiveMag);
    this.lastCorrectionTime = Date.now();
    this.totalDrift += effectiveMag;

    return {
      timestamp: Date.now(),
      type: "qr",
      beforePose: {
        position: { ...currentRelative.pose.position },
        orientation: currentRelative.pose.orientation,
      },
      afterPose: {
        position: { ...correctedPos },
        orientation: currentRelative.pose.orientation,
      },
      correctionDelta: effectiveDelta,
      confidence: targetAbsolute.confidence,
    };
  }

  getDriftStats() {
    return {
      totalDrift: this.totalDrift,
      correctionCount: this.correctionCount,
      averageCorrection:
        this.correctionCount > 0
          ? this.totalCorrectionSum / this.correctionCount
          : 0,
      maxCorrection: this.maxCorrection,
      lastCorrectionTime: this.lastCorrectionTime,
    };
  }

  reset(): void {
    this.prevVelocity = { ...ZERO_VEC };
    this.correctedPosition = { ...ZERO_VEC };
    this.startTimestamp = null;
    this.totalDrift = 0;
    this.correctionCount = 0;
    this.maxCorrection = 0;
    this.totalCorrectionSum = 0;
    this.lastCorrectionTime = 0;
  }
}
