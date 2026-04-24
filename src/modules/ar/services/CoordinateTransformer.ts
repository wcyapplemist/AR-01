import type {
  RelativePose,
  AbsolutePose,
  CoordinateFrame,
} from "../types";
import type { Vector3, Quaternion } from "@/shared/types";
import {
  rotateVectorByQuaternion,
  addVectors,
  subtractVectors,
  conjugateQuaternion,
  multiplyQuaternion,
} from "@/shared/utils/math";

export class CoordinateTransformer {
  private frame: CoordinateFrame | null = null;

  constructor(frame?: CoordinateFrame) {
    if (frame) this.frame = frame;
  }

  relativeToAbsolute(relativePose: RelativePose): AbsolutePose | null {
    if (!this.frame) return null;
    const rotatedPos = rotateVectorByQuaternion(
      relativePose.pose.position,
      this.frame.orientation,
    );
    const absolutePosition: Vector3 = addVectors(rotatedPos, this.frame.origin);
    const absoluteOrientation: Quaternion = multiplyQuaternion(
      this.frame.orientation,
      relativePose.pose.orientation,
    );
    return {
      pose: {
        position: absolutePosition,
        orientation: absoluteOrientation,
      },
      timestamp: relativePose.timestamp,
      source: "fusion",
      confidence: 1 - relativePose.driftEstimate,
    };
  }

  absoluteToRelative(absolutePose: AbsolutePose): RelativePose | null {
    if (!this.frame) return null;
    const translated: Vector3 = subtractVectors(
      absolutePose.pose.position,
      this.frame.origin,
    );
    const invOrientation = conjugateQuaternion(this.frame.orientation);
    const relativePosition = rotateVectorByQuaternion(translated, invOrientation);
    const relativeOrientation: Quaternion = multiplyQuaternion(
      invOrientation,
      absolutePose.pose.orientation,
    );
    return {
      pose: {
        position: relativePosition,
        orientation: relativeOrientation,
      },
      timestamp: absolutePose.timestamp,
      driftEstimate: 1 - absolutePose.confidence,
    };
  }

  updateFrame(frame: CoordinateFrame): void {
    this.frame = frame;
  }

  getFrame(): CoordinateFrame | null {
    return this.frame;
  }

  hasFrame(): boolean {
    return this.frame !== null;
  }

  reset(): void {
    this.frame = null;
  }
}
