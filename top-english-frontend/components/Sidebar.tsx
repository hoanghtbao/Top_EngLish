/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Thanh điều hướng bên trái có khả năng thu gọn (Collapsible Left Sidebar) tuân thủ tiêu chuẩn UI/UX Pro Max
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  Bot,
  CheckSquare,
  Code2,
  Globe2,
  GraduationCap,
  LayoutDashboard,
  Mountain,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { useSidebar } from "../context/sidebar-context";
import { useBrand } from "../context/brand-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  isExternal?: boolean;
  disabled?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { isCollapsed, isMobileOpen, isInitialized, toggleCollapse, closeMobile } =
    useSidebar();
  const { brandSettings } = useBrand();

  const [hoveredItem, setHoveredItem] = useState<{
    label: string;
    badge?: string;
    top: number;
  } | null>(null);

  const mainNavItems: NavItem[] = [
    {
      label: "Tiến độ & SRS",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "SRS",
      badgeColor: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    },
    {
      label: "Từ vựng Flashcard",
      href: "/topics",
      icon: BookOpen,
    },
    {
      label: "Ngữ pháp Chuyên sâu",
      href: "/grammar",
      icon: GraduationCap,
    },
    {
      label: "Luyện thi Quiz",
      href: "/quizzes",
      icon: CheckSquare,
    },
    {
      label: "Trợ lý AI Gemini",
      href: "/ai-assistant",
      icon: Bot,
      badge: "AI 24/7",
      badgeColor: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800",
    },
    {
      label: "Lớp học Trực tuyến",
      href: "/classrooms",
      icon: Users,
      badge: "Lớp học",
      badgeColor: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    },
    {
      label: "Đấu Trường Leo Núi",
      href: "/live-game",
      icon: Mountain,
      badge: "LIVE",
      badgeColor: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse",
    },
    {
      label: "Đấu Trường Xếp Hạng",
      href: "/leaderboard",
      icon: Trophy,
      badge: "Đua TOP",
      badgeColor: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    },
    {
      label: "Tủ Kính Thành Tựu",
      href: "/profile",
      icon: Award,
    },
  ];

  const upcomingNavItems: NavItem[] = [];

  const teacherNavItems: NavItem[] = [
    {
      label: "Quản lý Lớp học",
      href: "/classrooms",
      icon: Users,
      badge: "GV",
      badgeColor: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    {
      label: "Soạn bài giảng & Đề thi",
      href: "/topics",
      icon: GraduationCap,
      badge: "GV",
      badgeColor: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      label: "Bảng Quản Trị Hệ Thống",
      href: "/admin",
      icon: Shield,
      badge: "Admin",
      badgeColor: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
  ];

  const developerNavItems: NavItem[] = [
    {
      label: "Swagger API Docs",
      href: "http://localhost:5001/api/docs",
      icon: Code2,
      isExternal: true,
      badge: "Docs",
      badgeColor: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
  ];

  // Mục Cài Đặt Hệ Thống đặt riêng ở chân thanh điều hướng (Bottom Nav)
  const settingsNavItem: NavItem = {
    label: "Cài Đặt Hệ Thống",
    href: "/settings",
    icon: Settings,
    badge: "Mới",
    badgeColor: "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800",
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive =
      !item.isExternal &&
      !item.disabled &&
      (item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href));

    const itemContent = (
          <div
            onMouseEnter={(e) => {
              if (isCollapsed) {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredItem({
                  label: item.label,
                  badge: item.badge,
                  top: rect.top + rect.height / 2,
                });
              }
            }}
            onMouseLeave={() => setHoveredItem(null)}
            className={`group relative flex items-center ${
              isCollapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2.5"
            } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? isCollapsed
                  ? ""
                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold"
                : item.disabled
                ? "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-75"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            {/* Active Left Indicator Bar (only when sidebar is expanded) */}
            {isActive && !isCollapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-600 dark:bg-emerald-400 rounded-r-full" />
            )}

            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/20"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
              }`}
            >
              <Icon className="size-5" />
            </div>

            {/* Label & Badge: hidden when collapsed */}
            <div
              className={`flex-1 flex items-center justify-between gap-1 overflow-hidden transition-all duration-200 ${
                isCollapsed
                  ? "w-0 opacity-0 pointer-events-none"
                  : "w-auto opacity-100"
              }`}
            >
              <span className="truncate whitespace-nowrap">{item.label}</span>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                    item.badgeColor ||
                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        );

        if (item.disabled) {
          return (
            <div key={item.label} title={`${item.label} (Đang phát triển)`}>
              {itemContent}
            </div>
          );
        }

        if (item.isExternal) {
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? item.label : undefined}
            >
              {itemContent}
            </a>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => closeMobile()}
            title={isCollapsed ? item.label : undefined}
          >
            {itemContent}
          </Link>
        );
      };

      const renderNavGroup = (title: string, items: NavItem[]) => (
        <div className="flex flex-col gap-1">
          {/* Group Title: hidden when collapsed */}
          <div
            className={`px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase transition-opacity duration-200 ${
              isCollapsed ? "opacity-0 h-0 p-0 overflow-hidden" : "opacity-100"
            }`}
          >
            {title}
          </div>

          {items.map((item) => renderNavItem(item))}
        </div>
      );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-lg md:shadow-none ${
          isInitialized ? "transition-all duration-300 ease-in-out" : ""
        } ${
          /* Responsive widths */
          isCollapsed ? "w-20" : "w-64"
        } ${
          /* Mobile slide-in positioning */
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* TOP BRAND HEADER */}
        <div
          className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 shrink-0 transition-all ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link
            href="/"
            onClick={closeMobile}
            className="group flex items-center gap-3 overflow-hidden cursor-pointer"
            title={`${brandSettings.brandName || "TopEnglish"} - Về Trang chủ`}
          >
            <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 group-hover:shadow-emerald-500/35 group-active:scale-95 transition-all">
              <Globe2 className="size-5.5 transition-transform group-hover:rotate-12 duration-300" />
            </div>
            <div
              className={`transition-all duration-200 overflow-hidden ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <span className="text-base font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent block truncate group-hover:from-emerald-500 group-hover:to-teal-400 transition-all">
                {brandSettings.brandName || "TopEnglish"}
              </span>
              <span className="block text-[10px] text-slate-500 -mt-1 font-medium truncate">
                {brandSettings.brandSubtitle || "by HoangBao"}
              </span>
            </div>
          </Link>

          {/* Mobile close button (only on mobile) */}
          <button
            onClick={closeMobile}
            className="md:hidden size-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* MIDDLE SCROLLABLE NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6 no-scrollbar">
          {renderNavGroup("Học tập", mainNavItems)}
          {(user?.role === "teacher" || user?.role === "admin") &&
            renderNavGroup("Khu vực Giảng dạy", teacherNavItems)}
          {upcomingNavItems.length > 0 &&
            renderNavGroup("Lộ trình tiếp theo", upcomingNavItems)}
          {user?.role === "admin" &&
            renderNavGroup("Quản trị Hệ thống", adminNavItems)}
          {user?.role === "admin" &&
            renderNavGroup("Dành cho nhà phát triển", developerNavItems)}
        </div>

        {/* BOTTOM SECTION: SETTINGS & COLLAPSE/EXPAND TOGGLE */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 flex flex-col gap-1.5 shrink-0 bg-slate-50/70 dark:bg-slate-950/40">
          {/* Cài Đặt Hệ Thống đặt riêng ở đáy thanh điều hướng theo xu hướng chuẩn SaaS */}
          {renderNavItem(settingsNavItem)}

          {/* Nút thu gọn / mở rộng sidebar */}
          <div className="hidden md:flex pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={toggleCollapse}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              title={
                isCollapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng sang trái"
              }
              aria-label={
                isCollapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng sang trái"
              }
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-4.5" />
              ) : (
                <>
                  <PanelLeftClose className="size-4.5" />
                  <span>Thu gọn sidebar</span>
                </>
              )}
            </button>
          </div>
        </div>
        {/* Floating Tooltip outside overflow clipping */}
        {isCollapsed && hoveredItem && (
          <div
            style={{ top: `${hoveredItem.top}px` }}
            className="fixed left-[76px] -translate-y-1/2 z-[100] px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-bold whitespace-nowrap shadow-2xl border border-slate-700/60 backdrop-blur pointer-events-none flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 size-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-l border-b border-slate-700/60" />
            <span>{hoveredItem.label}</span>
            {hoveredItem.badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                {hoveredItem.badge}
              </span>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
