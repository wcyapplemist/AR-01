"use client";

import { useEffect, useRef, memo } from "react";
import type { RefObject } from "react";
import type { QRResult, QRContent } from "../types";

interface QRScannerOverlayProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isScanning: boolean;
  cameraReady: boolean;
  lastResult: QRResult | null;
  lastContent: QRContent | null;
  error: string | null;
  onStart: () => Promise<void>;
  onStop: () => void;
  onReset: () => void;
}

function QRScannerOverlayInner({
  videoRef,
  isScanning,
  cameraReady,
  lastResult,
  lastContent,
  error,
  onStart,
  onStop,
  onReset,
}: QRScannerOverlayProps) {
  const previewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (previewRef.current && videoRef.current && cameraReady) {
      previewRef.current.srcObject = videoRef.current.srcObject;
    }
  }, [videoRef, cameraReady]);

  const hasResult = lastResult !== null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {cameraReady && (
        <video
          ref={previewRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {!cameraReady && !isScanning && !hasResult && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-6xl mb-4 opacity-30">📷</div>
          <p className="text-neutral-400 text-sm">Tap Start to scan QR codes</p>
        </div>
      )}

      {isScanning && !hasResult && (
        <div className="absolute inset-0">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 right-0 bottom-0">
              <div className="absolute top-0 left-0 right-0 h-[calc(50%-125px)] bg-black/50" />
              <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-125px)] bg-black/50" />
              <div className="absolute top-[calc(50%-125px)] left-0 w-[calc(50%-125px)] h-[250px] bg-black/50" />
              <div className="absolute top-[calc(50%-125px)] right-0 w-[calc(50%-125px)] h-[250px] bg-black/50" />

              <div className="absolute top-[calc(50%-125px)] left-[calc(50%-125px)] w-[250px] h-[250px]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-green-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-green-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-green-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-green-400 rounded-br" />

                <div className="scan-line absolute left-2 right-2 h-0.5 bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
              </div>
            </div>
          </div>

          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                SCANNING
              </span>
            </div>
          </div>
        </div>
      )}

      {hasResult && lastContent && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-6 z-20">
          <div
            className={`w-full max-w-sm rounded-xl border-2 p-5 ${
              lastContent.isValid
                ? "border-green-500 bg-green-950/80"
                : "border-red-500 bg-red-950/80"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">QR Result</h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  lastContent.isValid
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {lastContent.isValid ? "VALID" : "INVALID"}
              </span>
            </div>

            {lastContent.isValid && (
              <div className="space-y-2 mb-4">
                <DataRow label="ID" value={lastContent.id} />
                <DataRow
                  label="Position"
                  value={`X: ${lastContent.pos.x.toFixed(2)}  Y: ${lastContent.pos.y.toFixed(2)}  Z: ${lastContent.pos.z.toFixed(2)}`}
                />
                <DataRow label="Format" value={lastContent.format} />
              </div>
            )}

            {!lastContent.isValid && (
              <div className="mb-4">
                <DataRow label="Raw Data" value={lastContent.raw || "(empty)"} />
              </div>
            )}

            <button
              onClick={onReset}
              className="w-full py-3 rounded-lg bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-colors"
            >
              Scan Again
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-12 left-4 right-4 z-30">
          <div className="bg-red-900/90 border border-red-500 rounded-lg px-4 py-3 text-white text-sm">
            <p className="font-bold mb-0.5">Error</p>
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-4 right-4 z-10 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
          <div
            className={`w-2 h-2 rounded-full ${
              cameraReady ? "bg-green-400" : "bg-neutral-600"
            }`}
          />
          {cameraReady ? "Camera Ready" : "Camera Off"}
        </div>

        <button
          onClick={isScanning ? onStop : onStart}
          disabled={hasResult}
          className={`px-8 py-3 rounded-full font-bold text-sm transition-colors min-h-[44px] min-w-[44px] ${
            hasResult
              ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
              : isScanning
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isScanning ? "Stop" : "Start Scanning"}
        </button>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className="text-white font-mono">{value}</span>
    </div>
  );
}

export default memo(QRScannerOverlayInner);
