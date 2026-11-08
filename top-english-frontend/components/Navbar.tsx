/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Thanh điều hướng chính (Navbar) tuân thủ tiêu chuẩn UI/UX Pro Max và Shadcn UI
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Brain,
  CheckSquare,
  Flame,
  Globe2,
  GraduationCap,
  LogOut,
  Shield,
  Trophy,
  User,
} from "lucide-react";
import { useAuth } from "../context/auth-context";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Shield className="size-3" /> Admin
          </span>
        );
      case "teacher":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <GraduationCap className="size-3" /> GV
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <User className="size-3" /> HV
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Globe2 className="size-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                TopEnglish
              </span>
              <span className="block text-[10px] text-slate-500 -mt-1 font-medium">
                by HoangBao
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === "/"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Trang chủ
            </Link>
            <Link
              href="/topics"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith("/topics")
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BookOpen className="size-4" /> Từ vựng Flashcard
            </Link>
            <Link
              href="/grammar"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith("/grammar")
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <GraduationCap className="size-4" /> Ngữ pháp
            </Link>
            <Link
              href="/quizzes"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith("/quizzes")
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <CheckSquare className="size-4" /> Luyện thi Quiz
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith("/dashboard")
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Brain className="size-4" /> Tiến độ & SRS
            </Link>
          </nav>
        </div>

        {/* User Controls & Actions */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:5001/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center h-10 px-3.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Swagger API
          </a>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Gamification Stats */}
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-xs transition cursor-pointer"
                title="Bảng tiến độ học tập cá nhân"
              >
                <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400" title="Chuỗi ngày học liên tục">
                  <Flame className="size-3.5 fill-amber-500" /> {user.streak}d
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400" title="Điểm kinh nghiệm">
                  <Trophy className="size-3.5" /> {user.totalXP} XP
                </span>
              </Link>

              {/* Profile Badge */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 hover:opacity-85 transition cursor-pointer"
                title="Hồ sơ cá nhân & Tiến độ"
              >
                <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                  {user.fullName.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <span className="block text-xs font-bold leading-tight truncate max-w-[120px]">
                    {user.fullName}
                  </span>
                  <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                </div>
              </Link>

              {/* Logout Button */}
              <button
                onClick={() => logout()}
                title="Đăng xuất"
                aria-label="Đăng xuất khỏi tài khoản"
                className="size-10 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="h-10 px-4 flex items-center text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="h-10 px-4 flex items-center text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition"
              >
                Bắt đầu học
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
