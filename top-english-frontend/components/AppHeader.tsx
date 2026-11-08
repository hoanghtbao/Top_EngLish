/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Thanh tiêu đề trên cùng (App Header) tinh gọn kết hợp nút mở/thu gọn Sidebar
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Trophy,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useSidebar } from "../context/sidebar-context";
import { useTheme } from "../context/theme-context";
import { useBrand } from "../context/brand-context";
import { fetchApi } from "../lib/api-client";
import { WeeklyActivityDay } from "./StreakModal";
import UserAvatar from "./UserAvatar";
import AvatarUploadModal from "./AvatarUploadModal";

export default function AppHeader() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleMobile } = useSidebar();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { brandSettings } = useBrand();

  const [showStreakPopover, setShowStreakPopover] = useState(false);
  const [streakData, setStreakData] = useState<{
    streak: number;
    isStreakActiveToday: boolean;
    streakMessage: string;
    weeklyActivity: WeeklyActivityDay[];
  } | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [highlightXP, setHighlightXP] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const prevXpRef = useRef(user?.totalXP);

  // Hiệu ứng Realtime nảy số khi điểm XP tăng
  useEffect(() => {
    if (
      user?.totalXP !== undefined &&
      prevXpRef.current !== undefined &&
      user.totalXP > prevXpRef.current
    ) {
      setHighlightXP(true);
      const timer = setTimeout(() => setHighlightXP(false), 1800);
      return () => clearTimeout(timer);
    }
    prevXpRef.current = user?.totalXP;
  }, [user?.totalXP]);

  const toggleStreakPopover = () => {
    if (!showStreakPopover) {
      loadStreakDetails();
    }
    setShowStreakPopover((prev) => !prev);
  };

  const loadStreakDetails = async () => {
    try {
      setLoadingStreak(true);
      const res = await fetchApi<any>("/gamification/streak");
      if (res.success && res.data) {
        setStreakData(res.data);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin streak:", err);
    } finally {
      setLoadingStreak(false);
    }
  };

  // Click outside to close streak popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowStreakPopover(false);
      }
    };
    if (showStreakPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStreakPopover]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield className="size-2.5" /> Admin
          </span>
        );
      case "teacher":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <GraduationCap className="size-3" /> Giáo viên
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <UserIcon className="size-2.5" /> Học viên
          </span>
        );
    }
  };

  // Tạo tiêu đề động theo đường dẫn hiện tại
  const getPageTitle = () => {
    if (pathname === "/") return "Trang chủ";
    if (pathname.startsWith("/dashboard")) return "Tiến độ học tập & SRS";
    if (pathname.startsWith("/topics")) return "Từ vựng Flashcard";
    if (pathname.startsWith("/grammar")) return "Ngữ pháp chuyên sâu";
    if (pathname.startsWith("/quizzes")) return "Luyện thi trắc nghiệm Quiz";
    if (pathname.startsWith("/ai-assistant")) return "Trợ lý Trí tuệ Nhân tạo AI";
    if (pathname.startsWith("/classrooms")) return "Lớp học trực tuyến & Bài tập";
    if (pathname.startsWith("/live-game")) return "Đấu Trường Leo Núi Thời Gian Thực";
    if (pathname.startsWith("/admin")) return "Bảng Quản Trị Hệ Thống Toàn Diện";
    if (pathname.startsWith("/leaderboard")) return "Đấu trường Xếp hạng";
    if (pathname.startsWith("/profile")) return "Tủ Kính Thành Tựu & Vinh Danh";
    if (pathname.startsWith("/settings")) return "Cài Đặt Hệ Thống & Giao Diện";
    if (pathname.startsWith("/login")) return "Đăng nhập tài khoản";
    if (pathname.startsWith("/register")) return "Đăng ký thành viên";
    return "Không gian học tập";
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* LEFT: MOBILE HAMBURGER & BREADCRUMB */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={toggleMobile}
          className="md:hidden size-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="size-5" />
        </button>

        {/* Breadcrumb / Page Title */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Link
            href="/"
            title={`${brandSettings.brandName || "TopEnglish"} - Về Trang chủ`}
            className="hidden sm:inline text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-normal transition cursor-pointer"
          >
            {brandSettings.brandName || "TopEnglish"}
          </Link>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
            /
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-[200px] sm:max-w-none">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* RIGHT: CONTROLS, THEME TOGGLE, USER PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Quick Switcher (Light / Dark) */}
        <button
          onClick={toggleTheme}
          title={
            resolvedTheme === "dark"
              ? "Chuyển sang Giao diện Sáng (Light Mode)"
              : "Chuyển sang Giao diện Tối (Dark Mode)"
          }
          aria-label="Chuyển đổi giao diện Sáng / Tối"
          className="size-9.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition cursor-pointer shrink-0"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-4.5 text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon className="size-4.5 text-slate-700" />
          )}
        </button>

        {/* Settings Quick Link */}
        <Link
          href="/settings"
          title="Cài Đặt Hệ Thống & Bảo Mật"
          className="size-9.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition cursor-pointer shrink-0"
        >
          <Settings className="size-4.5 text-slate-600 dark:text-slate-400" />
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak & XP Quick Badges + Duolingo Popover */}
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={toggleStreakPopover}
                className="hidden sm:inline-flex items-center gap-2 h-9.5 px-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-200/80 dark:border-slate-700/80 text-xs transition-all shadow-xs cursor-pointer shrink-0"
                title="Chuỗi ngày học liên tục kiểu Duolingo (Bấm để xem chi tiết lịch tuần)"
              >
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <Flame
                    className={`size-4 ${
                      user.streak > 0
                        ? "fill-amber-500 text-amber-500 animate-pulse"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{user.streak} ngày</span>
                </span>
                <span className="h-3.5 w-px bg-slate-300 dark:bg-slate-600" />
                <span
                  className={`inline-flex items-center gap-1.5 font-bold transition-all duration-300 ${
                    highlightXP
                      ? "text-emerald-500 dark:text-emerald-300 scale-110 drop-shadow font-black"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  <Trophy className={`size-3.5 ${highlightXP ? "animate-bounce" : ""}`} />
                  <span>{user.totalXP} XP</span>
                </span>
              </button>

              {/* DUOLINGO STREAK POPOVER */}
              {showStreakPopover && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header Popover */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
                        <Flame className="size-4.5 fill-white" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
                          Chuỗi {user.streak} Ngày Học
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Theo dõi chuẩn Duolingo
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowStreakPopover(false)}
                      className="size-6 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  {/* Status Banner */}
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      streakData?.isStreakActiveToday
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    {streakData?.isStreakActiveToday ? (
                      <Check className="size-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Flame className="size-4 text-amber-600 fill-amber-500 shrink-0 animate-pulse" />
                    )}
                    <span className="text-[11px] leading-tight">
                      {streakData?.isStreakActiveToday
                        ? "Bạn đã hoàn thành bài học và giữ lửa hôm nay!"
                        : "Hôm nay bạn chưa học bài nào. Hãy học 1 bài để không mất chuỗi!"}
                    </span>
                  </div>

                  {/* 7-DAY WEEKLY CALENDAR */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                      Tiến độ tuần này
                    </span>
                    <div className="flex items-center justify-between gap-1">
                      {(streakData?.weeklyActivity || []).map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                          <span
                            className={`text-[9px] font-bold uppercase ${
                              day.isToday
                                ? "text-orange-600 dark:text-orange-400 font-black"
                                : "text-slate-400"
                            }`}
                          >
                            {day.dayLabel}
                          </span>
                          <div
                            className={`size-7 rounded-lg flex items-center justify-center transition-all ${
                              day.isActive
                                ? day.isToday
                                  ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs"
                                  : "bg-emerald-500 text-white"
                                : day.isToday
                                ? "border-2 border-dashed border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-500"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                            }`}
                            title={`${day.dayLabel} - ${day.date}${day.isActive ? " (Đã học)" : ""}`}
                          >
                            {day.isActive ? (
                              day.isToday ? (
                                <Flame className="size-3.5 fill-white text-white" />
                              ) : (
                                <Check className="size-3 stroke-[3]" />
                              )
                            ) : (
                              <span className="size-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer links */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href="/topics"
                      onClick={() => setShowStreakPopover(false)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold text-center transition cursor-pointer"
                    >
                      Học từ vựng ngay
                    </Link>
                    <Link
                      href="/leaderboard"
                      onClick={() => setShowStreakPopover(false)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Đua TOP</span>
                      <ChevronRight className="size-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info & Logout with spacious whitespace and perfect vertical alignment */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 hover:opacity-90 transition-all cursor-pointer group"
                title="Tủ Kính Thành Tựu & Vinh Danh (Bấm để xem hồ sơ)"
              >
                <UserAvatar
                  avatar={user.avatar}
                  fullName={user.fullName}
                  role={user.role}
                  size="sm"
                  showRoleBadge
                  className="shadow-sm group-hover:scale-105 transition-all"
                />
                <div className="hidden lg:flex flex-col justify-center text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug truncate max-w-[130px]">
                    {user.fullName}
                  </span>
                  <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                </div>
              </Link>

              <button
                onClick={() => logout()}
                title="Đăng xuất khỏi tài khoản"
                aria-label="Đăng xuất"
                className="size-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 flex items-center justify-center transition cursor-pointer"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="h-9 px-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition flex items-center"
            >
              Bắt đầu học
            </Link>
          </div>
        )}
      </div>

      {/* Quick Avatar Upload Modal accessible from Header */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </header>
  );
}
