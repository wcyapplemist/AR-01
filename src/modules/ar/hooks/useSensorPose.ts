"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { PositionIntegrator } from "../services/PositionIntegrator";
import type { DevicePose, SensorDebugData, SensorStatus, SensorConfig } from "../types";

export function useSensorPose(config?: Partial<SensorConfig>) {
  const integratorRef = useRef<PositionIntegrator | null>(null);
  const [pose, setPose] = useState<DevicePose | null>(null);
  const [debugData, setDebugData] = useState<SensorDebugData | null>(null);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const integrator = new PositionIntegrator(config);
    integratorRef.current = integrator;

    const unsubPose = integrator.onPoseUpdate((p) => setPose(p));
    const unsubDebug = integrator.onDebugUpdate((d) => {
      setDebugData(d);
      setSensorStatus(d.sensorStatus);
    });

    integrator.emitInitialStatus();

    return () => {
      unsubPose();
      unsubDebug();
      integrator.stop();
      integratorRef.current = null;
    };
  }, [config]);

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

  return { pose, debugData, sensorStatus, isTracking, error, startTracking, stopTracking };
}
