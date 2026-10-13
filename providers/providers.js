// app/providers.js
"use client";

import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";

export function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
     
   
    >
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
