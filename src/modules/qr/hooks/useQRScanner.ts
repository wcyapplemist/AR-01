"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { CameraService } from "../services/CameraService";
import { QRDecoder } from "../services/QRDecoder";
import { QRContentValidator } from "../services/QRContentValidator";
import type { QRResult, QRContent, ScanOptions } from "../types";
import { DEFAULT_SCAN_OPTIONS } from "../types";

function stopScanner(
  camera: CameraService,
  decoder: QRDecoder | null,
  setCameraReady: (v: boolean) => void,
  setIsScanning: (v: boolean) => void
) {
  decoder?.stopDecode();
  camera.stopCamera();
  setCameraReady(false);
  setIsScanning(false);
}

export function useQRScanner(options?: Partial<ScanOptions>) {
  const opts = useRef({ ...DEFAULT_SCAN_OPTIONS, ...options });

  const cameraRef = useRef<CameraService>(new CameraService());
  const decoderRef = useRef<QRDecoder | null>(null);
  const validatorRef = useRef<QRContentValidator>(new QRContentValidator());

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [lastResult, setLastResult] = useState<QRResult | null>(null);
  const [lastContent, setLastContent] = useState<QRContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    const camera = cameraRef.current;
    return () => {
      stopScanner(
        camera,
        decoderRef.current,
        () => {},
        () => {}
      );
    };
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);

    try {
      const camera = cameraRef.current;
      const stream = await camera.startCamera(
        opts.current.facingMode,
        opts.current.resolution
      );

      const video = camera.getVideoElement();
      videoRef.current = video;
      setCameraReady(true);

      if (stream) {
        const decoder = new QRDecoder(camera, {
          scanInterval: opts.current.scanInterval,
          stopOnSuccess: opts.current.stopOnSuccess,
        });
        decoderRef.current = decoder;

        decoder.onResult((result) => {
          setLastResult(result);
          setScanCount((c) => c + 1);

          try {
            const content = validatorRef.current.validate(result.data);
            setLastContent(content);
          } catch {
            setLastContent(null);
          }

          if (opts.current.stopOnSuccess) {
            setIsScanning(false);
          }
        });

        decoder.onError((err) => {
          setError(err.message);
        });

        decoder.startDecode();
        setIsScanning(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start scanner";
      setError(msg);
      setIsScanning(false);
      setCameraReady(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    stopScanner(
      cameraRef.current,
      decoderRef.current,
      setCameraReady,
      setIsScanning
    );
  }, []);

  const resetResult = useCallback(() => {
    setLastResult(null);
    setLastContent(null);
    setError(null);
  }, []);

  return {
    isScanning,
    cameraReady,
    lastResult,
    lastContent,
    error,
    scanCount,
    startScanning,
    stopScanning,
    resetResult,
    videoRef,
  };
}
