/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Layout gốc bọc toàn bộ ứng dụng bằng AuthProvider
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/auth-context";
import { ThemeProvider } from "../context/theme-context";
import { SidebarProvider } from "../context/sidebar-context";
import { BrandProvider } from "../context/brand-context";
import FloatingAiTutor from "../components/FloatingAiTutor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      >
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <BrandProvider>
                {children}
                <Suspense fallback={null}>
                  <FloatingAiTutor />
                </Suspense>
              </BrandProvider>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
