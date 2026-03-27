"use client";

import { createContext, useContext, useState } from "react";
import { Locale } from "@/lib/i18n";

const LanguageContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);

  // 🔒 Prerender-safe fallback
  if (!ctx) {
    return {
      language: "en",
      setLanguage: () => {},
    };
  }

  return ctx;
}
