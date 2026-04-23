import type { Vector3 } from "@/shared/types";

export interface QRResult {
  data: string;
  location: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
  timestamp: number;
}

export interface QRContent {
  id: string;
  pos: Vector3;
  raw: string;
  format: "standard" | "extended";
  checksum: string;
  isValid: boolean;
  decodedAt: number;
}

export interface ScanOptions {
  facingMode?: "user" | "environment";
  resolution?: {
    width: number;
    height: number;
  };
  scanInterval?: number;
  stopOnSuccess?: boolean;
  expectedFormat?: "standard" | "extended" | "any";
}

export interface ScannerState {
  isScanning: boolean;
  cameraReady: boolean;
  lastResult: QRResult | null;
  lastContent: QRContent | null;
  error: string | null;
  scanCount: number;
  startTime: number | null;
}

export interface CameraInfo {
  deviceId: string;
  label: string;
  facingMode: "user" | "environment";
}

export interface ScannerCallbacks {
  onResult?: (result: QRResult) => void;
  onContentValidated?: (content: QRContent) => void;
  onError?: (error: Error) => void;
  onCameraReady?: () => void;
  onCameraError?: (error: Error) => void;
}

export const DEFAULT_SCAN_OPTIONS: Required<ScanOptions> = {
  facingMode: "environment",
  resolution: { width: 1280, height: 720 },
  scanInterval: 100,
  stopOnSuccess: true,
  expectedFormat: "any",
};
