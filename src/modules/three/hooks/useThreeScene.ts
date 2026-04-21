import { useEffect, useRef, useState } from "react";
import { SceneManager } from "../services/SceneManager";
import type { ThreeSceneOptions } from "../types";

export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: ThreeSceneOptions
) {
  const managerRef = useRef<SceneManager | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const manager = new SceneManager(options);
    manager.init(canvas);
    managerRef.current = manager;
    setIsReady(true);
    manager.start();

    const handleResize = () => {
      const { width, height } = container.getBoundingClientRect();
      manager.resize(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      manager.dispose();
      managerRef.current = null;
      setIsReady(false);
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [containerRef, options]);

  return { sceneManager: managerRef, isReady };
}
