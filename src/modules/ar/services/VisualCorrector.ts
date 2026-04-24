import type {
  DriftCorrectionConfig,
  VisualCorrection,
  DevicePose,
} from "../types";
import { DEFAULT_DRIFT_CORRECTION_CONFIG } from "../types";
import type { Vector3 } from "@/shared/types";
import {
  addVectors,
  subtractVectors,
  vectorMagnitude,
  normalizeVector,
  scaleVector,
  rotateVectorByQuaternion,
  conjugateQuaternion,
} from "@/shared/utils/math";

interface RegisteredMarker {
  id: string;
  absolutePosition: Vector3;
  size: number;
}

const DEFAULT_FOV = 60;
const IDEAL_DISTANCE = 2.0;
const MAX_DISTANCE = 10.0;

export class VisualCorrector {
  private readonly config: DriftCorrectionConfig;
  private readonly markers = new Map<string, RegisteredMarker>();
  private lastDetectedId: string | null = null;
  private consecutiveCount = 0;

  constructor(config?: Partial<DriftCorrectionConfig>) {
    this.config = { ...DEFAULT_DRIFT_CORRECTION_CONFIG, ...config };
  }

  detectAndCorrect(
    videoFrame: HTMLVideoElement | HTMLCanvasElement,
    currentPose: DevicePose,
  ): VisualCorrection | null {
    if (this.markers.size === 0) return null;

    const detected = this.detectMarkerInFrame(videoFrame);
    if (!detected) return null;

    const marker = this.markers.get(detected.id);
    if (!marker) return null;

    const estimatedDistance = this.estimateDistance(
      detected.pixelSize,
      marker.size,
    );
    if (estimatedDistance <= 0 || estimatedDistance > MAX_DISTANCE) return null;

    const invOrientation = conjugateQuaternion(currentPose.orientation);
    const forward: Vector3 = rotateVectorByQuaternion(
      { x: 0, y: 0, z: -1 },
      invOrientation,
    );

    const offsetFromCenter = Math.abs(detected.centerX - 0.5);
    const distanceFactor = 1 - Math.min(estimatedDistance / MAX_DISTANCE, 1);
    const centerFactor = 1 - offsetFromCenter * 2;

    if (detected.id === this.lastDetectedId) {
      this.consecutiveCount++;
    } else {
      this.consecutiveCount = 1;
    }
    this.lastDetectedId = detected.id;

    const consistencyFactor = Math.min(this.consecutiveCount / 5, 1);
    const confidence = Math.max(
      0,
      Math.min(
        1,
        distanceFactor * 0.4 + centerFactor * 0.3 + consistencyFactor * 0.3,
      ),
    );

    const detectedPosition: Vector3 = addVectors(
      currentPose.position,
      scaleVector(forward, estimatedDistance),
    );

    const correctionDelta: Vector3 = subtractVectors(
      marker.absolutePosition,
      detectedPosition,
    );

    return {
      markerId: marker.id,
      detectedPosition,
      absolutePosition: { ...marker.absolutePosition },
      correctionDelta,
      confidence,
      timestamp: Date.now(),
    };
  }

  registerMarker(marker: {
    id: string;
    absolutePosition: Vector3;
    size: number;
  }): void {
    this.markers.set(marker.id, {
      id: marker.id,
      absolutePosition: { ...marker.absolutePosition },
      size: marker.size,
    });
  }

  getMarkers(): RegisteredMarker[] {
    return Array.from(this.markers.values());
  }

  isAvailable(): boolean {
    return this.markers.size > 0;
  }

  reset(): void {
    this.markers.clear();
    this.lastDetectedId = null;
    this.consecutiveCount = 0;
  }

  private detectMarkerInFrame(
    _videoFrame: HTMLVideoElement | HTMLCanvasElement,
  ): {
    id: string;
    pixelSize: number;
    centerX: number;
  } | null {
    return null;
  }

  private estimateDistance(
    pixelSize: number,
    physicalSize: number,
  ): number {
    if (pixelSize <= 0) return 0;
    const fovRad = (DEFAULT_FOV * Math.PI) / 180;
    return (physicalSize * (1 / Math.tan(fovRad / 2))) / pixelSize;
  }
}
