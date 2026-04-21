"use client";

import { useSensorPose } from "@/modules/ar/hooks/useSensorPose";
import SensorDebugDashboard from "@/modules/ar/components/SensorDebugDashboard";
import { quaternionToEuler } from "@/shared/utils/math";
import { useRef, useEffect } from "react";
import type { DevicePose } from "@/modules/ar/types";

function PoseDisplay({ pose }: { pose: DevicePose | null }) {
  const posRef = useRef<HTMLDivElement>(null);
  const oriRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pose || !posRef.current || !oriRef.current) return;
    const p = pose.position;
    posRef.current.textContent = `X: ${p.x.toFixed(3)}  Y: ${p.y.toFixed(3)}  Z: ${p.z.toFixed(3)}`;
    const e = quaternionToEuler(pose.orientation);
    oriRef.current.textContent =
      `R: ${((e.roll * 180) / Math.PI).toFixed(1)}°  P: ${((e.pitch * 180) / Math.PI).toFixed(1)}°  Y: ${((e.yaw * 180) / Math.PI).toFixed(1)}°`;
  }, [pose]);

  if (!pose) {
    return (
      <div className="text-center text-neutral-500">
        <div className="text-lg mb-1">Press Start to begin</div>
        <div className="text-xs">Sensor data will appear here</div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-cyan-500 mb-1">Position (m)</div>
        <div ref={posRef} className="font-mono text-cyan-400 text-sm" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-purple-500 mb-1">Orientation (°)</div>
        <div ref={oriRef} className="font-mono text-purple-400 text-sm" />
      </div>
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

export default function ARPage() {
  const { pose, debugData, sensorStatus, isTracking, error, startTracking, stopTracking } = useSensorPose();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="flex flex-col items-center justify-center h-full pr-72 max-[400px]:pr-0 max-[400px]:pb-48">
        <h1 className="text-xl font-bold mb-6 text-neutral-300">AR Sensor Demo</h1>
        <PoseDisplay pose={pose} />
        <div className="mt-6">
          <TrackingBadge active={isTracking} />
        </div>
      </div>

      <SensorDebugDashboard
        debugData={debugData}
        sensorStatus={sensorStatus}
        isTracking={isTracking}
        onStart={startTracking}
        onStop={stopTracking}
      />

      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-900/90 text-red-200 px-4 py-2 text-sm flex justify-between items-center z-[60]">
          <span>{error}</span>
          <button onClick={stopTracking} className="text-red-400 hover:text-white ml-2">✕</button>
        </div>
      )}
    </div>
  );
}
