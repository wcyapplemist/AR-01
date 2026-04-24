"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { PositionFusion } from "../services/PositionFusion";
import { PositionIntegrator } from "../services/PositionIntegrator";
import type {
  SensorConfig,
  DriftCorrectionConfig,
  FusionState,
  CoordinateFrame,
  DriftCorrectionEvent,
} from "../types";
import type { QRContent } from "@/modules/qr/types";

export function useDualCoordinate(
  sensorConfig?: Partial<SensorConfig>,
  driftConfig?: Partial<DriftCorrectionConfig>,
) {
  const fusionRef = useRef<PositionFusion | null>(null);
  const integratorRef = useRef<PositionIntegrator | null>(null);
  const prevTimestampRef = useRef<number | null>(null);

  const [fusionState, setFusionState] = useState<FusionState | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCorrection, setLastCorrection] = useState<DriftCorrectionEvent | null>(null);
  const [driftStats, setDriftStats] = useState<{
    totalDrift: number;
    correctionCount: number;
    averageCorrection: number;
    maxCorrection: number;
    lastCorrectionTime: number;
  } | null>(null);
  const [calibrationHistory, setCalibrationHistory] = useState<
    Array<{
      frame: CoordinateFrame;
      qrContent: QRContent;
      timestamp: number;
    }>
  >([]);

  useEffect(() => {
    const fusion = new PositionFusion(driftConfig);
    fusionRef.current = fusion;

    const integrator = new PositionIntegrator(sensorConfig);
    integratorRef.current = integrator;

    const unsubFusion = fusion.onFusionUpdate((state) => {
      setFusionState(state);
    });

    const unsubCorrection = fusion.onCorrection((event) => {
      setLastCorrection(event);
    });

    const unsubPose = integrator.onPoseUpdate((pose) => {
      const now = pose.timestamp;
      const dt = prevTimestampRef.current !== null
        ? (now - prevTimestampRef.current) / 1000
        : 0.016;
      prevTimestampRef.current = now;
      fusion.updateSensorPose(pose, dt);
    });

    return () => {
      unsubFusion();
      unsubCorrection();
      unsubPose();
      integrator.stop();
      fusion.reset();
      fusionRef.current = null;
      integratorRef.current = null;
      prevTimestampRef.current = null;
    };
  }, [sensorConfig, driftConfig]);

  const startTracking = useCallback(async () => {
    setError(null);
    try {
      await integratorRef.current?.start();
      setIsTracking(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start sensor tracking";
      setError(msg);
      setIsTracking(false);
    }
  }, []);

  const stopTracking = useCallback(() => {
    integratorRef.current?.stop();
    setIsTracking(false);
  }, []);

  const calibrateFromQR = useCallback((qrContent: QRContent): CoordinateFrame => {
    const fusion = fusionRef.current;
    if (!fusion) {
      throw new Error("PositionFusion not initialized");
    }
    const frame = fusion.updateQRCalibration(qrContent);
    setIsCalibrated(true);
    return frame;
  }, []);

  const resetCalibration = useCallback(() => {
    fusionRef.current?.reset();
    setIsCalibrated(false);
    setLastCorrection(null);
    setCalibrationHistory([]);
  }, []);

  return {
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
  };
}
