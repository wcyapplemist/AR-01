import type { CameraInfo } from "../types";

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  async startCamera(
    facingMode: "user" | "environment" = "environment",
    resolution?: { width: number; height: number }
  ): Promise<MediaStream> {
    this.stopCamera();

    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.style.position = "absolute";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.style.width = "1px";
    video.style.height = "1px";
    document.body.appendChild(video);
    this.videoElement = video;

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode,
        width: { ideal: resolution?.width ?? 1280 },
        height: { ideal: resolution?.height ?? 720 },
      },
      audio: false,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      document.body.removeChild(video);
      this.videoElement = null;
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        throw new Error(
          "Camera permission denied. Please enable camera access in your browser settings and try again."
        );
      }
      if (err instanceof DOMException && err.name === "NotFoundError") {
        throw new Error("No camera found on this device.");
      }
      throw new Error(
        `Camera error: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    video.srcObject = this.stream;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject);
      };
      video.onerror = () => reject(new Error("Failed to load video stream"));
    });

    return this.stream;
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  isActive(): boolean {
    return this.stream !== null && this.stream.active === true;
  }

  static async enumerateDevices(): Promise<CameraInfo[]> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === "videoinput")
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
        facingMode: /back|rear|environment/i.test(d.label)
          ? ("environment" as const)
          : ("user" as const),
      }));
  }

  static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices !== undefined &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
  }

  async switchCamera(facingMode: "user" | "environment"): Promise<void> {
    this.stopCamera();
    await this.startCamera(facingMode);
  }
}
