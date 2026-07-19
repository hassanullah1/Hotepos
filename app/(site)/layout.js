// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Providers } from "../../providers/providers";
import HeaderClient from "../../components/HeaderClient";
import Footer from "../../components/Footer";

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

export default function Layout({ children }) {
  return (
    <div>
      <Providers>
        <HeaderClient />
        <main className="flex-1">{children}</main>
        <Footer />
      </Providers>
    </div>
  );
}
