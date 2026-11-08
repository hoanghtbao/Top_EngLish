/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang chủ TopEnglish tuân thủ bộ tiêu chuẩn UI/UX Pro Max và Shadcn UI
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Flame,
  Globe2,
  GraduationCap,
  Layers,
  Server,
  Shield,
  Sparkles,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useBrand } from "../context/brand-context";
import AppLayout from "../components/AppLayout";
import { fetchApi } from "../lib/api-client";

interface HealthData {
  status: string;
  service: string;
  database: string;
  uptime: number;
  environment: string;
}

// Hàm chuẩn hóa đường dẫn ảnh (hỗ trợ cả đường dẫn cục bộ backend và CDN)
const getFullImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.includes("/uploads/")) {
    const filename = url.split("/uploads/").pop();
    return `/uploads/${filename}`;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const backendBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:5001";
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { brandSettings } = useBrand();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Kiểm tra sức khỏe hệ thống (chỉ cần thiết cho Admin)
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const checkServerHealth = async () => {
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
          const res = await fetch(`${apiUrl}/health`);
          const json = await res.json();
          if (json.success) {
            setHealth(json.data);
          } else {
            setHealthError("Không thể tải trạng thái server");
          }
        } catch {
          setHealthError("Chưa kết nối được với Backend (cổng 5001)");
        } finally {
          setLoadingHealth(false);
        }
      };

      checkServerHealth();
    } else {
      setLoadingHealth(false);
    }
  }, [isAuthenticated, user]);

  return (
    <AppLayout>

      {/* Hero Section with Admin Custom Background */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 py-16 md:py-24">
        {/* Dynamic Background Image uploaded/configured from Admin */}
        {brandSettings.isEnabled && brandSettings.backgroundUrl && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <img
              src={getFullImageUrl(brandSettings.backgroundUrl)}
              alt={`${brandSettings.brandName} Hero Background`}
              className="w-full h-full object-cover transition-opacity duration-700"
              style={{
                filter: brandSettings.blurAmount
                  ? `blur(${brandSettings.blurAmount}px)`
                  : undefined,
                transform: brandSettings.blurAmount ? "scale(1.05)" : undefined,
              }}
            />
            {/* Adaptive Gradient Overlay ensuring high contrast for Light & Dark mode */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/55 to-white/95 dark:from-slate-950/80 dark:via-slate-950/65 dark:to-slate-950/95 transition-colors"
              style={{
                opacity: brandSettings.overlayOpacity ?? 0.5,
              }}
            />
          </div>
        )}

        {/* Ambient Radial Gradient Fallback when no background image */}
        {(!brandSettings.isEnabled || !brandSettings.backgroundUrl) && (
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(15,23,42,0))]" />
        )}

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col gap-6 items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs backdrop-blur-xs">
            <Sparkles className="size-3.5" />
            {brandSettings.heroBadge || "Nền tảng học tiếng Anh thông minh thế hệ mới"}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight drop-shadow-xs">
            {brandSettings.heroTitle || "Chinh phục tiếng Anh với"}{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              {brandSettings.heroHighlight || brandSettings.brandName || "TopEnglish"}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed max-w-2xl font-medium drop-shadow-xs">
            {brandSettings.heroSubtitle ||
              "Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến."}
          </p>

          {/* Personalized welcome badge */}
          {isAuthenticated && user && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs backdrop-blur-xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              Chào mừng trở lại, <span className="font-bold">{user.fullName}</span>! Chuỗi học tập:{" "}
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Flame className="size-3.5 fill-amber-500" /> {user.streak} ngày
              </span>{" "}
              • <span className="text-teal-600 dark:text-teal-400 font-bold">{user.totalXP} XP</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/topics"
              className="h-11 px-6 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="size-4" />
              <span>Học Từ vựng Flashcard</span>
            </Link>
            <Link
              href="/dashboard"
              className="h-11 px-6 rounded-xl font-semibold text-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-300/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Brain className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tiến độ & Phòng ôn SRS</span>
            </Link>
            <Link
              href="/quizzes"
              className="h-11 px-5 rounded-xl font-semibold text-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer flex items-center gap-2"
            >
              <CheckSquare className="size-4 text-sky-500" />
              <span>Luyện thi Quiz</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Features */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col gap-12 sm:gap-16">

        {/* Feature Grid: Upgraded modern cards with icons, badges, and hover effects */}
        <section className="flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Hệ thống học tập chuyên sâu
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Phương pháp học tối ưu cho trí nhớ dài hạn
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Kết hợp hoàn hảo giữa phương pháp lặp lại ngắt quãng khoa học, ngữ cảnh câu thực tế và bài tập kiểm tra đánh giá tức thì.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Flashcard 3D */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between gap-4 group">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="size-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <BookOpen className="size-5.5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    CEFR A1 - B2
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                  Thẻ Flashcard 3D
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Lật thẻ tương tác 2 mặt, phiên âm quốc tế IPA và phát âm tiếng Anh chuẩn Mỹ trực tiếp qua Web Speech API.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Phiên âm IPA
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Audio giọng Mỹ
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Ví dụ song ngữ
                  </span>
                </div>
              </div>
              <Link
                href="/topics"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 pt-2"
              >
                Khám phá chủ đề <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 2: Spaced Repetition System */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between gap-4 group">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="size-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Brain className="size-5.5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Leitner Box
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                  Spaced Repetition (SRS)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Thuật toán tính toán chu kỳ 1-3-7-14-30 ngày theo đường cong quên lãng Ebbinghaus, nhắc ôn đúng thời điểm vàng.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Hộp nhớ 5 cấp
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Phản xạ 4 nút
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Trí nhớ dài hạn
                  </span>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 pt-2"
              >
                Vào phòng ôn tập <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 3: Grammar & Quizzes */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between gap-4 group">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="size-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <GraduationCap className="size-5.5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    Tự động chấm
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                  Ngữ pháp & Đề thi Quiz
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Học cấu trúc 3 thể (+,-,?), dấu hiệu nhận biết, bẫy lỗi sai và luyện thi trắc nghiệm bấm giờ có giải thích chi tiết.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Bài giảng 4 tab
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Bấm giờ thi
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Giải thích đáp án
                  </span>
                </div>
              </div>
              <Link
                href="/quizzes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 pt-2"
              >
                Làm bài kiểm tra <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 4: AI Assistant */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between gap-4 group">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Bot className="size-5.5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Gemini AI 24/7
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                  Trợ lý Trí tuệ Nhân tạo AI
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tích hợp Google Gemini giải đáp thắc mắc ngữ pháp, phân tích câu sai và gợi ý sửa lỗi hành văn tự nhiên như người bản xứ.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Google Gemini
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Chữa lỗi câu
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Gợi ý diễn đạt
                  </span>
                </div>
              </div>
              <Link
                href="/ai-assistant"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 pt-2"
              >
                Hỏi đáp cùng AI <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Server & Database Health Status Card: ONLY SHOWN TO ADMIN */}
        {isAuthenticated && user?.role === "admin" && (
          <section className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Shield className="size-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm block">
                    Giám sát Máy chủ Hệ thống (Dành riêng cho Admin)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Ẩn hoàn toàn với học viên thông thường
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                API Cổng: 5001
              </span>
            </div>

            {loadingHealth ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                Đang nạp trạng thái máy chủ NestJS...
              </div>
            ) : healthError ? (
              <div className="py-3 px-4 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs">
                ⚠️ {healthError}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-800">
                  <span className="block text-[10px] text-slate-400">Máy chủ API</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                    <CheckCircle2 className="size-3.5" /> Hoạt động
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-800">
                  <span className="block text-[10px] text-slate-400">MongoDB</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                    <CheckCircle2 className="size-3.5" /> {health?.database}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-800">
                  <span className="block text-[10px] text-slate-400">Môi trường</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                    {health?.environment}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-800">
                  <span className="block text-[10px] text-slate-400">Thời gian chạy</span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                    {Math.round(health?.uptime || 0)}s
                  </span>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        © 2026 {brandSettings.brandName || "TopEnglish"}. Nền tảng học tiếng Anh trực tuyến phát triển bởi{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {brandSettings.brandSubtitle?.replace(/^by\s+/i, "") || "HoangBao"}
        </span>.
      </footer>
    </AppLayout>
  );
}
