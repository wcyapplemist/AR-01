import type {
  CoordinateFrame,
  DriftCorrectionConfig,
  DriftCorrectionEvent,
} from "../types";
import { DEFAULT_DRIFT_CORRECTION_CONFIG } from "../types";
import type { QRContent } from "@/modules/qr/types";
import type { Vector3, Quaternion } from "@/shared/types";
import {
  subtractVectors,
  vectorDistance,
  lerp,
  rotateVectorByQuaternion,
  conjugateQuaternion,
} from "@/shared/utils/math";
import { CoordinateTransformer } from "./CoordinateTransformer";

interface CalibrationRecord {
  frame: CoordinateFrame;
  qrContent: QRContent;
  timestamp: number;
}

export class QRCalibrationService {
  private readonly transformer: CoordinateTransformer;
  private readonly config: DriftCorrectionConfig;
  private readonly history: CalibrationRecord[] = [];
  private readonly correctionCallbacks: Array<
    (event: DriftCorrectionEvent) => void
  > = [];
  private calibrationCount = 0;

  constructor(
    transformer: CoordinateTransformer,
    config?: Partial<DriftCorrectionConfig>,
  ) {
    this.transformer = transformer;
    this.config = { ...DEFAULT_DRIFT_CORRECTION_CONFIG, ...config };
  }

  calibrate(
    qrContent: QRContent,
    currentRelativePose?: {
      position: Vector3;
      orientation: Quaternion;
    },
    referenceOrientation?: Quaternion,
  ): CoordinateFrame {
    const now = Date.now();

    if (!this.isCalibrated()) {
      return this.initialCalibration(
        qrContent,
        currentRelativePose,
        referenceOrientation,
        now,
      );
    }

    return this.recalibrate(qrContent, now);
  }

  private initialCalibration(
    qrContent: QRContent,
    currentRelativePose: { position: Vector3; orientation: Quaternion } | undefined,
    referenceOrientation: Quaternion | undefined,
    now: number,
  ): CoordinateFrame {
    const relPos = currentRelativePose?.position ?? { x: 0, y: 0, z: 0 };
    const refOrient =
      referenceOrientation ?? { x: 0, y: 0, z: 0, w: 1 };

    const rotatedRel = rotateVectorByQuaternion(
      relPos,
      conjugateQuaternion(refOrient),
    );
    const origin: Vector3 = subtractVectors(qrContent.pos, rotatedRel);

    const frame: CoordinateFrame = {
      id: `frame-${this.calibrationCount}`,
      origin,
      orientation: refOrient,
      createdAt: now,
      lastUpdated: now,
      calibrationSource: "qr",
      correctionCount: 0,
    };

    this.transformer.updateFrame(frame);
    this.calibrationCount++;
    this.history.push({ frame, qrContent, timestamp: now });

    return frame;
  }

  private recalibrate(qrContent: QRContent, now: number): CoordinateFrame {
    const currentFrame = this.transformer.getFrame();
    if (!currentFrame) {
      return this.initialCalibration(qrContent, undefined, undefined, now);
    }

    const currentOrigin = currentFrame.origin;
    const qrPos = qrContent.pos;
    const distance = vectorDistance(currentOrigin, qrPos);

    let newOrigin: Vector3 = { ...currentOrigin };

    if (distance > this.config.correctionThreshold) {
      const w = this.config.qrConfidenceWeight;
      newOrigin = {
        x: lerp(currentOrigin.x, qrPos.x, w),
        y: lerp(currentOrigin.y, qrPos.y, w),
        z: lerp(currentOrigin.z, qrPos.z, w),
      };

      const correctionDelta: Vector3 = subtractVectors(newOrigin, currentOrigin);
      const event: DriftCorrectionEvent = {
        timestamp: now,
        type: "qr",
        beforePose: {
          position: { ...currentOrigin },
          orientation: currentFrame.orientation,
        },
        afterPose: {
          position: { ...newOrigin },
          orientation: currentFrame.orientation,
        },
        correctionDelta,
        confidence: this.config.qrConfidenceWeight,
      };

      for (const cb of this.correctionCallbacks) cb(event);
    }

    const updatedFrame: CoordinateFrame = {
      ...currentFrame,
      id: `frame-${this.calibrationCount}`,
      origin: newOrigin,
      lastUpdated: now,
      correctionCount: currentFrame.correctionCount + 1,
    };

    this.transformer.updateFrame(updatedFrame);
    this.calibrationCount++;
    this.history.push({ frame: updatedFrame, qrContent, timestamp: now });

    return updatedFrame;
  }

  onCorrection(callback: (event: DriftCorrectionEvent) => void): () => void {
    this.correctionCallbacks.push(callback);
    return () => {
      const idx = this.correctionCallbacks.indexOf(callback);
      if (idx !== -1) this.correctionCallbacks.splice(idx, 1);
    };
  }

  isCalibrated(): boolean {
    return this.transformer.hasFrame();
  }

  getFrame(): CoordinateFrame | null {
    return this.transformer.getFrame();
  }

  getCalibrationHistory(): CalibrationRecord[] {
    return [...this.history];
  }

  reset(): void {
    this.transformer.reset();
    this.history.length = 0;
    this.correctionCallbacks.length = 0;
    this.calibrationCount = 0;
  }
}
