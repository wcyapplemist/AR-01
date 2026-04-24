"use client";

import { useRef, useEffect, useCallback, memo } from "react";
import type {
  FusionState,
  DriftCorrectionEvent,
  CoordinateFrame,
} from "../types";
import type { QRContent } from "@/modules/qr/types";

interface DriftStats {
  totalDrift: number;
  correctionCount: number;
  averageCorrection: number;
  maxCorrection: number;
  lastCorrectionTime: number;
}

export interface DriftDebugOverlayProps {
  fusionState: FusionState | null;
  driftStats: DriftStats | null;
  lastCorrection: DriftCorrectionEvent | null;
  isCalibrated: boolean;
  calibrationHistory: Array<{
    frame: CoordinateFrame;
    qrContent: QRContent;
    timestamp: number;
  }>;
}

interface RefMap {
  [key: string]: HTMLSpanElement | null;
}

function driftColor(drift: number): string {
  if (drift < 0.1) return "text-green-400";
  if (drift < 0.5) return "text-yellow-400";
  return "text-red-400";
}

function fmt3(v: number): string {
  return v.toFixed(3);
}

function DriftDebugOverlayInner(props: DriftDebugOverlayProps) {
  const { fusionState, driftStats, lastCorrection, isCalibrated, calibrationHistory } = props;
  const refs = useRef<RefMap>({});
  const setRef = useCallback((key: string) => (el: HTMLSpanElement | null) => {
    refs.current[key] = el;
  }, []);

  useEffect(() => {
    const r = refs.current;
    const set = (key: string, val: string) => {
      if (r[key]) r[key]!.textContent = val;
    };
    const setClass = (key: string, cls: string) => {
      if (r[key]) r[key]!.className = cls;
    };

    if (!fusionState) {
      set("status", "Waiting for data...");
      return;
    }

    const rel = fusionState.relativePose.pose;
    set("rel-x", fmt3(rel.position.x));
    set("rel-y", fmt3(rel.position.y));
    set("rel-z", fmt3(rel.position.z));

    if (fusionState.absolutePose) {
      const abs = fusionState.absolutePose.pose;
      set("abs-x", fmt3(abs.position.x));
      set("abs-y", fmt3(abs.position.y));
      set("abs-z", fmt3(abs.position.z));
      const dc = driftColor(fusionState.relativePose.driftEstimate);
      setClass("abs-x", dc);
      setClass("abs-y", dc);
      setClass("abs-z", dc);
    } else {
      set("abs-x", "—");
      set("abs-y", "—");
      set("abs-z", "—");
    }

    const drift = fusionState.relativePose.driftEstimate;
    set("drift-est", fmt3(drift));
    setClass("drift-est", driftColor(drift));

    if (driftStats) {
      set("drift-total", fmt3(driftStats.totalDrift));
      set("drift-avg", fmt3(driftStats.averageCorrection));
      set("drift-max", fmt3(driftStats.maxCorrection));
    }

    if (lastCorrection) {
      set("corr-type", lastCorrection.type.toUpperCase());
      const mag = Math.sqrt(
        lastCorrection.correctionDelta.x ** 2 +
        lastCorrection.correctionDelta.y ** 2 +
        lastCorrection.correctionDelta.z ** 2,
      );
      set("corr-mag", fmt3(mag));
      set("corr-conf", (lastCorrection.confidence * 100).toFixed(1) + "%");
      const ago = ((Date.now() - lastCorrection.timestamp) / 1000).toFixed(1);
      set("corr-ago", ago + "s");
    }

    const w = fusionState.fusionWeights;
    const sw = w.sensor * 100;
    const qw = w.qr * 100;
    const vw = w.visual * 100;
    set("w-sensor", sw.toFixed(0) + "%");
    set("w-qr", qw.toFixed(0) + "%");
    set("w-visual", vw.toFixed(0) + "%");
    set("bar-sensor", sw.toFixed(1) + "%");
    set("bar-qr", qw.toFixed(1) + "%");
    set("bar-visual", vw.toFixed(1) + "%");

    if (fusionState.frame) {
      const f = fusionState.frame;
      set("frame-id", f.id);
      set("frame-origin", `${fmt3(f.origin.x)}, ${fmt3(f.origin.y)}, ${fmt3(f.origin.z)}`);
      set("frame-source", f.calibrationSource);
      set("frame-corrections", String(f.correctionCount));
      const since = ((Date.now() - f.lastUpdated) / 1000).toFixed(1);
      set("frame-since", since + "s");
    }
  }, [fusionState, driftStats, lastCorrection]);

  const lastCalib = calibrationHistory[calibrationHistory.length - 1];

  return (
    <div className="fixed top-0 left-0 bottom-0 w-72 max-[400px]:w-full overflow-y-auto bg-black/80 text-white text-xs font-mono p-3 space-y-3 z-50">
      <div className="text-sm font-bold text-neutral-300">Drift Debug</div>

      <Section title="Calibration">
        <div className="flex gap-2 items-center">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isCalibrated ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
            {isCalibrated ? "CALIBRATED" : "NOT CALIBRATED"}
          </span>
        </div>
        {fusionState?.frame && (
          <>
            <Row label="Frame"><span ref={setRef("frame-id")} className="text-cyan-400">—</span></Row>
            <Row label="Origin"><span ref={setRef("frame-origin")} className="text-cyan-400">—</span></Row>
            <Row label="Source"><span ref={setRef("frame-source")}>—</span></Row>
            <Row label="Since"><span ref={setRef("frame-since")}>—</span></Row>
            <Row label="Corrections"><span ref={setRef("frame-corrections")}>—</span></Row>
          </>
        )}
      </Section>

      <Section title="Position (m)">
        <div className="text-[10px] text-blue-400 mb-0.5">Relative</div>
        <Row label="X"><span ref={setRef("rel-x")} className="text-blue-400">—</span></Row>
        <Row label="Y"><span ref={setRef("rel-y")} className="text-blue-400">—</span></Row>
        <Row label="Z"><span ref={setRef("rel-z")} className="text-blue-400">—</span></Row>
        <div className="text-[10px] text-emerald-400 mt-1 mb-0.5">Absolute</div>
        <Row label="X"><span ref={setRef("abs-x")}>—</span></Row>
        <Row label="Y"><span ref={setRef("abs-y")}>—</span></Row>
        <Row label="Z"><span ref={setRef("abs-z")}>—</span></Row>
      </Section>

      <Section title="Drift Metrics">
        <Row label="Estimate"><span ref={setRef("drift-est")} className="text-yellow-400">—</span><span className="text-neutral-500 ml-1">m</span></Row>
        <Row label="Total"><span ref={setRef("drift-total")}>—</span><span className="text-neutral-500 ml-1">m</span></Row>
        <Row label="Avg Corr"><span ref={setRef("drift-avg")}>—</span><span className="text-neutral-500 ml-1">m</span></Row>
        <Row label="Max Corr"><span ref={setRef("drift-max")}>—</span><span className="text-neutral-500 ml-1">m</span></Row>
      </Section>

      <Section title="Last Correction">
        {lastCorrection ? (
          <>
            <Row label="Type"><span ref={setRef("corr-type")} className="text-purple-400">—</span></Row>
            <Row label="Delta"><span ref={setRef("corr-mag")}>—</span><span className="text-neutral-500 ml-1">m</span></Row>
            <Row label="Conf"><span ref={setRef("corr-conf")}>—</span></Row>
            <Row label="Ago"><span ref={setRef("corr-ago")}>—</span></Row>
          </>
        ) : (
          <div className="text-neutral-600">No corrections yet</div>
        )}
      </Section>

      <Section title="Fusion Weights">
        <div className="flex h-3 rounded overflow-hidden bg-neutral-800">
          <span ref={setRef("bar-sensor")} className="bg-blue-600" style={{ width: "0%" }} />
          <span ref={setRef("bar-qr")} className="bg-green-600" style={{ width: "0%" }} />
          <span ref={setRef("bar-visual")} className="bg-orange-600" style={{ width: "0%" }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-blue-400">S:<span ref={setRef("w-sensor")}>—</span></span>
          <span className="text-green-400">QR:<span ref={setRef("w-qr")}>—</span></span>
          <span className="text-orange-400">V:<span ref={setRef("w-visual")}>—</span></span>
        </div>
      </Section>
    </div>
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

export default memo(DriftDebugOverlayInner);
