export class SensorPermission {
  static isSecureContext(): boolean {
    if (typeof window === "undefined") return false;
    return window.isSecureContext === true;
  }

  static needsPermission(): boolean {
    if (typeof window === "undefined") return false;
    return (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission === "function"
    );
  }

  static async requestPermission(): Promise<boolean> {
    if (!this.isSecureContext()) {
      throw new Error(
        "Secure context required. Access via HTTPS is needed for sensor APIs. " +
        "Ensure ngrok or your server provides a fully trusted HTTPS connection."
      );
    }

    const motionReq = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    const orientationReq = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };

    if (typeof motionReq.requestPermission === "function") {
      const motionResult = await motionReq.requestPermission();
      if (motionResult !== "granted") {
        throw new Error("DeviceMotion permission denied");
      }
    }

    if (typeof orientationReq.requestPermission === "function") {
      const orientationResult = await orientationReq.requestPermission();
      if (orientationResult !== "granted") {
        throw new Error("DeviceOrientation permission denied");
      }
    }

    return true;
  }

  static detectPlatform(): "ios" | "android" | "other" {
    if (typeof navigator === "undefined") return "other";
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "other";
  }

  static isMotionSupported(): boolean {
    if (typeof window === "undefined") return false;
    if (!window.isSecureContext) return false;
    return "DeviceMotionEvent" in window;
  }

  static isOrientationSupported(): boolean {
    if (typeof window === "undefined") return false;
    if (!window.isSecureContext) return false;
    return "DeviceOrientationEvent" in window;
  }
}
