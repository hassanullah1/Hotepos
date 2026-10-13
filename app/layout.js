// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import { nazanin } from "./fonts";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hotel Logistic",
  description: "Your trusted logistics partner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nazanin.variable} min-h-full flex flex-col antialiased`}
      >
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
