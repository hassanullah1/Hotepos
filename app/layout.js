// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import { nazanin } from "./fonts";
import InstallPrompt from "./components/InstallPrompt"; 
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ─────────── metadata (includes PWA) ───────────
export const metadata = {
  title: "melmah",
  description: "Your trusted melmah partner",

  // PWA
  manifest: "/manifest.webmanifest",
  applicationName: "melmah",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "melmah",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/icons/icon-192.png",
  },
  formatDetection: {
    telephone: false,
  },
};

// ─────────── viewport (separate export in Next 15+) ───────────
export const viewport = {
  themeColor: "#C9A227",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* iOS PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="melmah" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nazanin.variable} min-h-full flex flex-col antialiased`}
      >
        <main className="flex-1">{children}</main>
        <ServiceWorkerRegister />
        
      </body>
    </html>
  );
}
