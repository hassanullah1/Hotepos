// app/fonts.js
import localFont from "next/font/local";

export const nazanin = localFont({
  src: [
    {
      path: "./fonts/BNR.woff2",
      weight: "400", // ✅ Must be "400" for regular
      style: "normal",
    },
    {
      path: "./fonts/BNB.woff2",
      weight: "700", // ✅ Must be "700" for bold
      style: "normal",
    },
  ],
  variable: "--font-nazanin",
  display: "swap",
});
