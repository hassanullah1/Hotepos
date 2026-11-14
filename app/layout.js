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
  metadataBase: new URL("https://melmah.app"),

  title: {
    default:
      "MM Melmah | Hotel Management, Restaurant POS & Online Food Ordering Afghanistan",
    template: "%s | MM Melmah",
  },

  description:
    "MM Melmah is an all-in-one hotel management, restaurant POS and online food ordering platform in Afghanistan. Manage hotels, branches, staff, tables, orders, sales and accept online food orders. د هوټل مدیریت او آنلاین خوړو فرمایش سیستم | سیستم مدیریت هوتل و سفارش آنلاین غذا.",

  applicationName: "MM Melmah",

  keywords: [
    // English: Hotel Management
    "MM Melmah",
    "Hotel Management System Afghanistan",
    "Hotel Management Software",
    "Hotel POS Software",
    "Hotel Billing Software",
    "Hotel Accounting Software",
    "Hotel Branch Management",
    "Hotel Staff Management",

    // English: Restaurant POS
    "Restaurant Management Software",
    "Restaurant POS System",
    "Restaurant Billing Software",
    "Restaurant Order Management",
    "Restaurant Table Management",
    "Restaurant Sales Management",

    // English: Online Food Ordering
    "Online Food Ordering Afghanistan",
    "Online Food Ordering System",
    "Food Ordering Platform",
    "Online Restaurant Ordering",
    "Restaurant Online Ordering System",
    "Food Delivery Ordering System",
    "Digital Restaurant Menu",
    "Online Menu for Restaurants",
    "Order Food Online Afghanistan",
    "Online Food Orders Kabul",

    // Pashto: Hotel and Restaurant
    "د هوټل مدیریت سیستم",
    "د هوټلونو مدیریت سافټویر",
    "د رستورانت مدیریت سیستم",
    "د هوټل حسابداري سیستم",
    "د رستورانت POS سیستم",
    "د هوټلونو لپاره سافټویر",

    // Pashto: Online Food Ordering
    "د آنلاین خوړو فرمایش سیستم",
    "آنلاین د خوړو فرمایش",
    "د رستورانت آنلاین فرمایش",
    "د خوړو آنلاین فرمایش سیستم",
    "د رستورانت ډیجیټل مینو",
    "آنلاین د خوراک فرمایش",
    "د افغانستان آنلاین خوراک",

    // Dari: Hotel and Restaurant
    "سیستم مدیریت هوتل",
    "نرم افزار مدیریت هوتل",
    "سیستم مدیریت رستورانت",
    "نرم افزار رستورانت",
    "سیستم فروش هوتل",
    "نرم افزار حسابداری هوتل",

    // Dari: Online Food Ordering
    "سیستم سفارش آنلاین غذا",
    "سفارش آنلاین غذا",
    "سفارش غذای آنلاین",
    "سیستم سفارش آنلاین رستورانت",
    "منوی دیجیتالی رستورانت",
    "سفارش آنلاین رستورانت",
    "پلتفرم سفارش غذا در افغانستان",
  ],

  authors: [{ name: "MM Melmah" }],
  creator: "MM Melmah",
  publisher: "MM Melmah",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title:
      "MM Melmah | Hotel Management, Restaurant POS & Online Food Ordering",
    description:
      "Manage your hotel, restaurant, staff, tables, orders and sales. Let customers browse menus and order food online with MM Melmah.",
    url: "https://melmah.app",
    siteName: "MM Melmah",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MM Melmah | Hotel POS & Online Food Ordering",
    description:
      "Hotel management, restaurant POS and online food ordering platform in Afghanistan.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // PWA
  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MM Melmah",
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
