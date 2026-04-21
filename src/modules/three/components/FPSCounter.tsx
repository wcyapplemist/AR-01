"use client";

import { useEffect, useRef, useState } from "react";

export default function FPSCounter() {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = (now: number) => {
      frameCountRef.current++;
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 500) {
        setFps(Math.round((frameCountRef.current / elapsed) * 1000));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="fixed top-3 right-3 z-50 rounded bg-black/60 px-2 py-1 font-mono text-xs text-green-400">
      {fps} FPS
    </div>
  );
}
