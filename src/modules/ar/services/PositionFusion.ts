import type {
  DevicePose,
  DriftCorrectionConfig,
  DriftCorrectionEvent,
  FusionState,
  CoordinateFrame,
  RelativePose,
} from "../types";
import { DEFAULT_DRIFT_CORRECTION_CONFIG } from "../types";
import type { VisualCorrection } from "../types";
import type { QRContent } from "@/modules/qr/types";
import { addVectors, scaleVector, vectorMagnitude, subtractVectors } from "@/shared/utils/math";
import { DriftCorrector } from "./DriftCorrector";
import { CoordinateTransformer } from "./CoordinateTransformer";
import { QRCalibrationService } from "./QRCalibrationService";

const WEIGHTS_NO_VISUAL = { sensor: 0.7, qr: 0.3, visual: 0.0 };
const WEIGHTS_WITH_VISUAL = { sensor: 0.3, qr: 0.5, visual: 0.2 };
const TRANSITION_FRAMES = 10;

function normalizeWeights(w: { sensor: number; qr: number; visual: number }) {
  const sum = w.sensor + w.qr + w.visual;
  if (sum === 0) return { sensor: 1, qr: 0, visual: 0 };
  return {
    sensor: w.sensor / sum,
    qr: w.qr / sum,
    visual: w.visual / sum,
  };
}

export class PositionFusion {
  private readonly config: DriftCorrectionConfig;
  private readonly driftCorrector: DriftCorrector;
  private readonly transformer: CoordinateTransformer;
  private readonly calibration: QRCalibrationService;

  private readonly fusionCallbacks: Array<(state: FusionState) => void> = [];
  private readonly correctionCallbacks: Array<(event: DriftCorrectionEvent) => void> = [];

  private pendingVisual: VisualCorrection | null = null;
  private hasVisualCorrection = false;
  private recalibrationTransitionFrame = 0;
  private lastCorrectionEvent: DriftCorrectionEvent | null = null;

  constructor(
    config?: Partial<DriftCorrectionConfig>,
    driftCorrector?: DriftCorrector,
    transformer?: CoordinateTransformer,
    calibration?: QRCalibrationService,
  ) {
    this.config = { ...DEFAULT_DRIFT_CORRECTION_CONFIG, ...config };
    this.transformer = transformer ?? new CoordinateTransformer();
    this.driftCorrector = driftCorrector ?? new DriftCorrector(this.config);
    this.calibration = calibration ?? new QRCalibrationService(this.transformer, this.config);

    this.calibration.onCorrection((event) => {
      this.lastCorrectionEvent = event;
      this.recalibrationTransitionFrame = TRANSITION_FRAMES;
      for (const cb of this.correctionCallbacks) cb(event);
    });
  }

  updateSensorPose(sensorPose: DevicePose, dt: number): void {
    const correctedRelative = this.driftCorrector.correct(sensorPose, dt);

    let absolutePose = this.transformer.relativeToAbsolute(correctedRelative);

    if (this.pendingVisual && absolutePose) {
      const vc = this.pendingVisual;
      const blended: typeof absolutePose = {
        pose: {
          position: {
            x: absolutePose.pose.position.x * (1 - vc.confidence) + vc.absolutePosition.x * vc.confidence,
            y: absolutePose.pose.position.y * (1 - vc.confidence) + vc.absolutePosition.y * vc.confidence,
            z: absolutePose.pose.position.z * (1 - vc.confidence) + vc.absolutePosition.z * vc.confidence,
          },
          orientation: absolutePose.pose.orientation,
        },
        timestamp: absolutePose.timestamp,
        source: "fusion" as const,
        confidence: Math.min(absolutePose.confidence + vc.confidence * 0.5, 1),
      };
      absolutePose = blended;
      this.hasVisualCorrection = true;
      this.pendingVisual = null;
    }

    let targetWeights = this.hasVisualCorrection
      ? { ...WEIGHTS_WITH_VISUAL }
      : { ...WEIGHTS_NO_VISUAL };

    if (this.recalibrationTransitionFrame > 0) {
      const t = this.recalibrationTransitionFrame / TRANSITION_FRAMES;
      targetWeights.sensor = WEIGHTS_NO_VISUAL.sensor * (1 - t) + targetWeights.sensor * t;
      targetWeights.qr = WEIGHTS_NO_VISUAL.qr * (1 - t) + targetWeights.qr * t;
      this.recalibrationTransitionFrame--;
    }

    const fusionWeights = normalizeWeights(targetWeights);

    const state: FusionState = {
      relativePose: correctedRelative,
      absolutePose,
      frame: this.transformer.getFrame(),
      lastCorrection: this.lastCorrectionEvent,
      fusionWeights,
    };

    for (const cb of this.fusionCallbacks) cb(state);
  }

  updateQRCalibration(qrContent: QRContent): CoordinateFrame {
    return this.calibration.calibrate(qrContent);
  }

  updateVisualCorrection(correction: VisualCorrection): void {
    this.pendingVisual = correction;
    this.hasVisualCorrection = true;

    if (correction.confidence > this.config.correctionThreshold) {
      const event: DriftCorrectionEvent = {
        timestamp: correction.timestamp,
        type: "visual",
        beforePose: {
          position: correction.detectedPosition,
          orientation: { x: 0, y: 0, z: 0, w: 1 },
        },
        afterPose: {
          position: correction.absolutePosition,
          orientation: { x: 0, y: 0, z: 0, w: 1 },
        },
        correctionDelta: correction.correctionDelta,
        confidence: correction.confidence,
      };
      this.lastCorrectionEvent = event;
      for (const cb of this.correctionCallbacks) cb(event);
    }
  }

  getFusionState(): FusionState {
    const correctedPose = this.driftCorrector.correct(
      {
        position: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        timestamp: performance.now(),
      },
      0,
    );

    return {
      relativePose: correctedPose,
      absolutePose: this.transformer.relativeToAbsolute(correctedPose),
      frame: this.transformer.getFrame(),
      lastCorrection: this.lastCorrectionEvent,
      fusionWeights: normalizeWeights(
        this.hasVisualCorrection ? WEIGHTS_WITH_VISUAL : WEIGHTS_NO_VISUAL,
      ),
    };
  }

  onFusionUpdate(callback: (state: FusionState) => void): () => void {
    this.fusionCallbacks.push(callback);
    return () => {
      const idx = this.fusionCallbacks.indexOf(callback);
      if (idx !== -1) this.fusionCallbacks.splice(idx, 1);
    };
  }

  onCorrection(callback: (event: DriftCorrectionEvent) => void): () => void {
    this.correctionCallbacks.push(callback);
    return () => {
      const idx = this.correctionCallbacks.indexOf(callback);
      if (idx !== -1) this.correctionCallbacks.splice(idx, 1);
    };
  }

  reset(): void {
    this.driftCorrector.reset();
    this.calibration.reset();
    this.pendingVisual = null;
    this.hasVisualCorrection = false;
    this.recalibrationTransitionFrame = 0;
    this.lastCorrectionEvent = null;
    this.fusionCallbacks.length = 0;
    this.correctionCallbacks.length = 0;
  }
}
