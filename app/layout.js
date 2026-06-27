// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import HeaderClient from "../components/HeaderClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Kohistan Logistic",
  description: "Your trusted logistics partner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}
      >
        <Providers>
          <HeaderClient />
          <main className="flex-1">{children}</main>
          <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 text-sm text-gray-600 dark:text-gray-400 transition-colors">
            © {new Date().getFullYear()} Kohistan Logistic
          </footer>
        </Providers>
      </body>
    </html>
  );
}
