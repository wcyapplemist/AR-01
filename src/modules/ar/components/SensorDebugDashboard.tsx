"use client";

import { useRef, useEffect, useCallback, memo } from "react";
import type { SensorDebugData, SensorStatus } from "../types";
import { quaternionToEuler } from "@/shared/utils/math";

interface Props {
  debugData: SensorDebugData | null;
  sensorStatus: SensorStatus | null;
  isTracking: boolean;
  onStart: () => Promise<void>;
  onStop: () => void;
}

interface RefMap {
  [key: string]: HTMLSpanElement | null;
}

function SensorDebugDashboardInner({
  debugData,
  sensorStatus,
  isTracking,
  onStart,
  onStop,
}: Props) {
  const refs = useRef<RefMap>({});
  const setRef = useCallback((key: string) => (el: HTMLSpanElement | null) => {
    refs.current[key] = el;
  }, []);

  useEffect(() => {
    if (!debugData) return;
    const r = refs.current;
    const d = debugData;
    const set = (key: string, val: string) => {
      if (r[key]) r[key]!.textContent = val;
    };

    if (d.rawOrientation) {
      set("ori-alpha", d.rawOrientation.alpha.toFixed(2));
      set("ori-beta", d.rawOrientation.beta.toFixed(2));
      set("ori-gamma", d.rawOrientation.gamma.toFixed(2));
    }
    if (d.rawAcceleration) {
      set("acc-x", d.rawAcceleration.x.toFixed(3));
      set("acc-y", d.rawAcceleration.y.toFixed(3));
      set("acc-z", d.rawAcceleration.z.toFixed(3));
    }
    if (d.currentPose) {
      const p = d.currentPose;
      set("pos-x", p.position.x.toFixed(3));
      set("pos-y", p.position.y.toFixed(3));
      set("pos-z", p.position.z.toFixed(3));
      const euler = quaternionToEuler(p.orientation);
      set("ori-roll", ((euler.roll * 180) / Math.PI).toFixed(1));
      set("ori-pitch", ((euler.pitch * 180) / Math.PI).toFixed(1));
      set("ori-yaw", ((euler.yaw * 180) / Math.PI).toFixed(1));
      set("vel-mag", Math.sqrt(
        p.velocity.x ** 2 + p.velocity.y ** 2 + p.velocity.z ** 2
      ).toFixed(3));
    }
    set("drift-dist", d.driftMetrics.totalDistanceTraveled.toFixed(3));
    set("drift-time", d.driftMetrics.elapsedTime.toFixed(1));
    set("drift-samples", String(d.driftMetrics.sampleCount));
    set("drift-vel", d.driftMetrics.velocityMagnitude.toFixed(3));
  }, [debugData]);

  const platform = sensorStatus?.platform ?? "other";
  const motionOk = sensorStatus?.motionAvailable ?? false;
  const orientOk = sensorStatus?.orientationAvailable ?? false;
  const secureCtx = sensorStatus?.isSecureContext ?? false;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-72 max-[400px]:w-full overflow-y-auto bg-black/80 text-white text-xs font-mono p-3 space-y-3 z-50">
      <div className="text-sm font-bold text-neutral-300">Sensor Debug</div>

      <section className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-neutral-500">Status</div>
        <div className="flex gap-2 flex-wrap">
          <Badge label="HTTPS" ok={secureCtx} />
          <Badge label="Motion" ok={motionOk} />
          <Badge label="Orient" ok={orientOk} />
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">{platform}</span>
          {isTracking && <span className="px-1.5 py-0.5 rounded bg-green-900 text-green-400">ACTIVE</span>}
        </div>
      </section>

      <Section title="Raw Orientation (°)">
        <Row label="α (alpha)"><span ref={setRef("ori-alpha")}>--</span></Row>
        <Row label="β (beta)"><span ref={setRef("ori-beta")}>--</span></Row>
        <Row label="γ (gamma)"><span ref={setRef("ori-gamma")}>--</span></Row>
      </Section>

      <Section title="Raw Acceleration (m/s²)">
        <Row label="X"><span ref={setRef("acc-x")} className="text-green-400">--</span></Row>
        <Row label="Y"><span ref={setRef("acc-y")} className="text-green-400">--</span></Row>
        <Row label="Z"><span ref={setRef("acc-z")} className="text-green-400">--</span></Row>
      </Section>

      <Section title="Estimated Pose">
        <div className="text-[10px] text-cyan-400 mb-0.5">Position (m)</div>
        <Row label="X"><span ref={setRef("pos-x")} className="text-cyan-400">--</span></Row>
        <Row label="Y"><span ref={setRef("pos-y")} className="text-cyan-400">--</span></Row>
        <Row label="Z"><span ref={setRef("pos-z")} className="text-cyan-400">--</span></Row>
        <div className="text-[10px] text-purple-400 mt-1 mb-0.5">Orientation (°)</div>
        <Row label="Roll"><span ref={setRef("ori-roll")} className="text-purple-400">--</span></Row>
        <Row label="Pitch"><span ref={setRef("ori-pitch")} className="text-purple-400">--</span></Row>
        <Row label="Yaw"><span ref={setRef("ori-yaw")} className="text-purple-400">--</span></Row>
        <Row label="Vel"><span ref={setRef("vel-mag")} className="text-yellow-400">--</span><span className="text-neutral-500 ml-1">m/s</span></Row>
      </Section>

      <Section title="Drift Metrics">
        <Row label="Distance"><span ref={setRef("drift-dist")} className="text-orange-400">--</span><span className="text-neutral-500 ml-1">m</span></Row>
        <Row label="Time"><span ref={setRef("drift-time")}>--</span><span className="text-neutral-500 ml-1">s</span></Row>
        <Row label="Samples"><span ref={setRef("drift-samples")}>--</span></Row>
        <Row label="Vel Mag"><span ref={setRef("drift-vel")} className="text-yellow-400">--</span><span className="text-neutral-500 ml-1">m/s</span></Row>
      </Section>

      <button
        onClick={isTracking ? onStop : onStart}
        className={`w-full py-2 rounded text-sm font-bold transition-colors ${
          isTracking
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {isTracking ? "Stop Tracking" : "Start Tracking"}
      </button>
    </div>
  );
}

function Badge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`px-1.5 py-0.5 rounded ${ok ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1 border-t border-neutral-800 pt-2">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{title}</div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      {children}
    </div>
  );
}

export default memo(SensorDebugDashboardInner);
