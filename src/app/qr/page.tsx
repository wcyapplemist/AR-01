"use client";

import { useQRScanner } from "@/modules/qr/hooks/useQRScanner";
import QRScannerOverlay from "@/modules/qr/components/QRScannerOverlay";

export default function QRPage() {
  const {
    isScanning,
    cameraReady,
    lastResult,
    lastContent,
    error,
    startScanning,
    stopScanning,
    resetResult,
    videoRef,
  } = useQRScanner({ stopOnSuccess: true });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <QRScannerOverlay
        videoRef={videoRef}
        isScanning={isScanning}
        cameraReady={cameraReady}
        lastResult={lastResult}
        lastContent={lastContent}
        error={error}
        onStart={startScanning}
        onStop={stopScanning}
        onReset={resetResult}
      />
    </div>
  );
}
