// app/offline/page.js
import OfflineGame from "./OfflineGame";

export const metadata = {
  title: "Offline — melmah",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#15121C] px-6 py-12 text-center text-[#F0EAE2]">
      {/* Offline icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C9A227"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 8.5a15 15 0 0 1 20 0" />
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
          <line x1="2" y1="2" x2="22" y2="22" stroke="#E5484D" />
        </svg>
      </div>

      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display, inherit)" }}
      >
        You're offline
      </h1>

      <p className="mt-2 max-w-xs text-sm text-[#9691A6]">
        Check your internet connection. Your cart is saved and will sync
        automatically when you're back online.
      </p>

      {/* Mini-game */}
      <div className="mt-8 w-full max-w-sm">
        <OfflineGame />
      </div>

      {/* Actions */}
      <a
        href="/"
        className="mt-6 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-2.5 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5"
      >
        Try again
      </a>

      <a
        href="/order"
        className="mt-3 text-xs text-[#6E687A] underline-offset-2 hover:text-[#E0B93A] hover:underline"
      >
        Go to menu
      </a>
    </div>
  );
}
