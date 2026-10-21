// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Providers } from "../../providers/providers";
import HeaderClient from "../../components/HeaderClient";
import Footer from "../../components/Footer";
import InstallPrompt from "../components/InstallPrompt";


export default function Layout({ children }) {
  return (
    <div>
      <Providers>
        <HeaderClient />
        <main className="flex-1">{children}</main>
        <Footer />
        <InstallPrompt />
      </Providers>
    </div>
  );
}
