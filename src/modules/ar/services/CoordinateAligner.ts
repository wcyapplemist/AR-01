import type { Orientation } from "../types";
import type { Quaternion } from "@/shared/types";
import { eulerToQuaternion, multiplyQuaternion, conjugateQuaternion } from "@/shared/utils/math";

export class CoordinateAligner {
  private referenceQuaternion: Quaternion | null = null;

  captureReference(orientation: Orientation): void {
    const euler = {
      roll: (orientation.alpha * Math.PI) / 180,
      pitch: (orientation.beta * Math.PI) / 180,
      yaw: (orientation.gamma * Math.PI) / 180,
    };
    this.referenceQuaternion = eulerToQuaternion(euler);
  }

  alignToReference(orientation: Orientation): Quaternion | null {
    if (!this.referenceQuaternion) return null;
    const euler = {
      roll: (orientation.alpha * Math.PI) / 180,
      pitch: (orientation.beta * Math.PI) / 180,
      yaw: (orientation.gamma * Math.PI) / 180,
    };
    const currentQuat = eulerToQuaternion(euler);
    return multiplyQuaternion(currentQuat, conjugateQuaternion(this.referenceQuaternion));
  }

  getReference(): Quaternion | null {
    return this.referenceQuaternion;
  }

  reset(): void {
    this.referenceQuaternion = null;
  }
}
