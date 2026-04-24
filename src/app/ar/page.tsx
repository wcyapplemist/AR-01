"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDualCoordinate } from "@/modules/ar/hooks/useDualCoordinate";
import { useSensorPose } from "@/modules/ar/hooks/useSensorPose";
import { useQRScanner } from "@/modules/qr/hooks/useQRScanner";
import SensorDebugDashboard from "@/modules/ar/components/SensorDebugDashboard";
import DriftDebugOverlay from "@/modules/ar/components/DriftDebugOverlay";
import { quaternionToEuler } from "@/shared/utils/math";
import type { DevicePose } from "@/modules/ar/types";
import type { QRContent } from "@/modules/qr/types";

function useQRCalibration(calibrateFromQR: (qr: QRContent) => unknown) {
  const seenIds = useRef(new Set<string>());

  return useCallback((qr: QRContent | null) => {
    if (!qr || !qr.isValid || seenIds.current.has(qr.id)) return false;
    seenIds.current.add(qr.id);
    calibrateFromQR(qr);
    return true;
  }, [calibrateFromQR]);
}

function DualPoseDisplay({
  relativePose,
  absolutePose,
  isCalibrated,
}: {
  relativePose: DevicePose | null;
  absolutePose: { x: number; y: number; z: number } | null;
  isCalibrated: boolean;
}) {
  const relRef = useRef<HTMLDivElement>(null);
  const oriRef = useRef<HTMLDivElement>(null);
  const absRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!relativePose || !relRef.current || !oriRef.current) return;
    const p = relativePose.position;
    relRef.current.textContent = `X: ${p.x.toFixed(3)}  Y: ${p.y.toFixed(3)}  Z: ${p.z.toFixed(3)}`;
    const e = quaternionToEuler(relativePose.orientation);
    oriRef.current.textContent =
      `R: ${((e.roll * 180) / Math.PI).toFixed(1)}°  P: ${((e.pitch * 180) / Math.PI).toFixed(1)}°  Y: ${((e.yaw * 180) / Math.PI).toFixed(1)}°`;
  }, [relativePose]);

  useEffect(() => {
    if (!absRef.current) return;
    if (!absolutePose || !isCalibrated) {
      absRef.current.textContent = "—  —  —";
      return;
    }
    absRef.current.textContent =
      `X: ${absolutePose.x.toFixed(3)}  Y: ${absolutePose.y.toFixed(3)}  Z: ${absolutePose.z.toFixed(3)}`;
  }, [absolutePose, isCalibrated]);

  return (
    <div className="text-center space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-blue-500 mb-1">Relative Position (m)</div>
        <div ref={relRef} className="font-mono text-blue-400 text-sm">—</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-purple-500 mb-1">Orientation (°)</div>
        <div ref={oriRef} className="font-mono text-purple-400 text-sm">—</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-emerald-500 mb-1">Absolute Position (m)</div>
        <div ref={absRef} className="font-mono text-emerald-400 text-sm">—</div>
      </div>
    </div>
  );
}

function CalibrationBadge({ isCalibrated }: { isCalibrated: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${
      isCalibrated ? "bg-green-900/60 text-green-400" : "bg-red-900/60 text-red-400"
    }`}>
      <span className={`w-2 h-2 rounded-full ${isCalibrated ? "bg-green-400" : "bg-red-400"}`} />
      {isCalibrated ? "Calibrated" : "Not Calibrated"}
    </div>
  );
}

function TrackingBadge({ active }: { active: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${
      active ? "bg-green-900/60 text-green-400" : "bg-neutral-800 text-neutral-500"
    }`}>
      <span className={`w-2 h-2 rounded-full ${active ? "bg-green-400 animate-pulse" : "bg-neutral-600"}`} />
      {active ? "Tracking" : "Idle"}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-green-900/90 text-green-200 px-4 py-2 text-sm flex justify-between items-center z-[60]">
      <span>{message}</span>
      <button onClick={onClose} className="text-green-400 hover:text-white ml-2">✕</button>
    </div>
  );
}

export default function ARPage() {
  const {
    fusionState,
    isCalibrated,
    isTracking,
    error,
    startTracking,
    stopTracking,
    calibrateFromQR,
    resetCalibration,
    driftStats,
    calibrationHistory,
    lastCorrection,
  } = useDualCoordinate();

  const { debugData, sensorStatus } = useSensorPose();
  const {
    isScanning,
    lastContent: qrContent,
    error: qrError,
    startScanning,
    stopScanning,
    resetResult,
  } = useQRScanner();

  const [toast, setToast] = useState<string | null>(null);
  const handleCalibrate = useQRCalibration(calibrateFromQR);

  useEffect(() => {
    if (!qrContent || !qrContent.isValid) return;
    if (!handleCalibrate(qrContent)) return;
    stopScanning();
    queueMicrotask(() => setToast(`Calibrated from QR: ${qrContent.id}`));
  }, [qrContent, handleCalibrate, stopScanning]);

  useEffect(() => {
    if (!qrError) return;
    const msg = qrError;
    queueMicrotask(() => setToast(msg));
  }, [qrError]);

  const handleScanQR = useCallback(() => {
    resetResult();
    startScanning();
  }, [resetResult, startScanning]);

  const handleStartTracking = useCallback(async () => {
    await startTracking();
  }, [startTracking]);

  const absolutePos = fusionState?.absolutePose?.pose.position ?? null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="flex flex-col items-center justify-center h-full pl-72 pr-72 max-[900px]:pl-0 max-[900px]:pr-0 max-[900px]:pb-96">
        <h1 className="text-xl font-bold mb-4 text-neutral-300">AR Spatial Demo</h1>

        <DualPoseDisplay
          relativePose={debugData?.currentPose ?? null}
          absolutePose={absolutePos}
          isCalibrated={isCalibrated}
        />

        <div className="mt-4 flex flex-wrap gap-2 items-center justify-center">
          <TrackingBadge active={isTracking} />
          <CalibrationBadge isCalibrated={isCalibrated} />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={isTracking ? stopTracking : handleStartTracking}
            className={`px-4 py-2 rounded text-sm font-bold transition-colors ${
              isTracking
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </button>

          {isTracking && !isScanning && (
            <button
              onClick={handleScanQR}
              className="px-4 py-2 rounded text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Scan QR to Calibrate
            </button>
          )}

          {isScanning && (
            <button
              onClick={stopScanning}
              className="px-4 py-2 rounded text-sm font-bold bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
            >
              Cancel Scan
            </button>
          )}

          {isCalibrated && (
            <button
              onClick={resetCalibration}
              className="px-4 py-2 rounded text-sm font-bold bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-neutral-600 max-w-sm text-center">
          {isCalibrated
            ? "Dual coordinate system active. Walk around to see drift correction in action."
            : "Start tracking, then scan a QR code with ARPOS|id|x,y,z|checksum format to calibrate absolute coordinates."}
        </div>
      </div>

      <DriftDebugOverlay
        fusionState={fusionState}
        driftStats={driftStats}
        lastCorrection={lastCorrection}
        isCalibrated={isCalibrated}
        calibrationHistory={calibrationHistory}
      />

      <div className="max-[900px]:bottom-0 max-[900px]:left-0 max-[900px]:right-0 max-[900px]:top-auto max-[900px]:h-48 max-[900px]:w-full">
        <SensorDebugDashboard
          debugData={debugData}
          sensorStatus={sensorStatus}
          isTracking={isTracking}
          onStart={handleStartTracking}
          onStop={stopTracking}
        />
      </div>

      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-900/90 text-red-200 px-4 py-2 text-sm flex justify-between items-center z-[60]">
          <span>{error}</span>
          <button onClick={stopTracking} className="text-red-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
