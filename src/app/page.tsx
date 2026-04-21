import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <h1 className="text-3xl font-bold mb-2">AR Spatial Positioning</h1>
      <p className="text-neutral-400 mb-10 text-center">
        Mobile Web AR app for spatial positioning using QR codes and sensor
        fusion
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
        <Link
          href="/ar"
          className="flex flex-col items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 p-6 hover:bg-neutral-800 transition-colors"
        >
          <span className="text-3xl mb-2">AR</span>
          <span className="text-sm text-neutral-400">AR Module</span>
        </Link>

        <Link
          href="/qr"
          className="flex flex-col items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 p-6 hover:bg-neutral-800 transition-colors"
        >
          <span className="text-3xl mb-2">QR</span>
          <span className="text-sm text-neutral-400">QR Scanner</span>
        </Link>

        <Link
          href="/three"
          className="flex flex-col items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 p-6 hover:bg-neutral-800 transition-colors"
        >
          <span className="text-3xl mb-2">3D</span>
          <span className="text-sm text-neutral-400">Three.js</span>
        </Link>
      </div>

      <footer className="mt-12 text-neutral-600 text-xs">
        Next.js + Three.js + AR.js + Tailwind CSS
      </footer>
    </div>
  );
}
