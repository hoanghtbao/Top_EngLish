/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Theme Context quản lý chế độ Sáng / Tối (Light, Dark, System Mode) với lưu trữ LocalStorage
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "top_english_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Áp dụng class .dark lên <html>
  const applyTheme = (themeValue: Theme) => {
    let isDark = false;
    if (themeValue === "dark") {
      isDark = true;
    } else if (themeValue === "light") {
      isDark = false;
    } else {
      // System mode
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      setResolvedTheme("dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      setResolvedTheme("light");
    }
  };

  // Khởi tạo theme khi mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system";
    setThemeState(savedTheme);
    applyTheme(savedTheme);

    // Lắng nghe thay đổi theme từ hệ điều hành nếu đang ở chế độ System
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const current = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system";
      if (current === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme phải được sử dụng bên trong ThemeProvider");
  }
  return context;
}
