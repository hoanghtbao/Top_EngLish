/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Layout gốc bọc toàn bộ ứng dụng bằng AuthProvider
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/auth-context";
import { ThemeProvider } from "../context/theme-context";
import { SidebarProvider } from "../context/sidebar-context";
import { BrandProvider } from "../context/brand-context";
import { SoundProvider } from "../context/sound-context";
import FloatingAiTutor from "../components/FloatingAiTutor";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TopEnglish - Nền tảng học tiếng Anh trực tuyến thông minh",
  description: "Học từ vựng Flashcard, Spaced Repetition, ngữ pháp và trợ lý AI thông minh. Phát triển bởi HoangBao.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      >
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <BrandProvider>
                <SoundProvider>
                  {children}
                  <Suspense fallback={null}>
                    <FloatingAiTutor />
                  </Suspense>
                </SoundProvider>
              </BrandProvider>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
