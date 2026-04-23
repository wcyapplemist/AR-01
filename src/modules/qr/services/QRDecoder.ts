import jsQR from "jsqr";
import { CameraService } from "./CameraService";
import type { QRResult, ScanOptions } from "../types";
import { DEFAULT_SCAN_OPTIONS } from "../types";

export class QRDecoder {
  private cameraService: CameraService;
  private options: Required<ScanOptions>;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private resultCallbacks: Set<(result: QRResult) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private stopped = false;

  constructor(cameraService: CameraService, options?: Partial<ScanOptions>) {
    this.cameraService = cameraService;
    this.options = { ...DEFAULT_SCAN_OPTIONS, ...options };
  }

  startDecode(): void {
    this.stopDecode();
    this.stopped = false;

    const video = this.cameraService.getVideoElement();
    if (!video) {
      this.emitError(new Error("No video element available"));
      return;
    }

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

    if (!this.ctx) {
      this.emitError(new Error("Failed to create canvas context"));
      return;
    }

    this.intervalId = setInterval(() => {
      if (this.stopped) return;
      const result = this.decodeSingleFrame();
      if (result) {
        this.emitResult(result);
        if (this.options.stopOnSuccess) {
          this.stopDecode();
        }
      }
    }, this.options.scanInterval);
  }

  stopDecode(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.stopped = true;
    this.canvas = null;
    this.ctx = null;
  }

  decodeSingleFrame(): QRResult | null {
    const video = this.cameraService.getVideoElement();
    if (!video || !this.canvas || !this.ctx) return null;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return null;

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    this.ctx.drawImage(video, 0, 0, w, h);
    const imageData = this.ctx.getImageData(0, 0, w, h);

    try {
      const code = jsQR(imageData.data, w, h, {
        inversionAttempts: "dontInvert",
      });
      if (!code) return null;

      return {
        data: code.data,
        location: {
          topLeft: code.location.topLeftCorner,
          topRight: code.location.topRightCorner,
          bottomRight: code.location.bottomRightCorner,
          bottomLeft: code.location.bottomLeftCorner,
        },
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  onResult(callback: (result: QRResult) => void): () => void {
    this.resultCallbacks.add(callback);
    return () => {
      this.resultCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  isDecoding(): boolean {
    return this.intervalId !== null && !this.stopped;
  }

  private emitResult(result: QRResult): void {
    this.resultCallbacks.forEach((cb) => cb(result));
  }

  private emitError(error: Error): void {
    this.errorCallbacks.forEach((cb) => cb(error));
  }
}
