"use client";

import { createContext, useContext, useState } from "react";
import { Theme, themes } from "@/lib/themes";

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: any) {
  const [theme, setTheme] = useState<Theme>("central");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={themes[theme] + " min-h-screen"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  // 🔒 prerender-safe fallback
  if (!ctx) {
    return {
      theme: "centralbank",
      setTheme: () => {},
    };
  }

  return ctx;
}
