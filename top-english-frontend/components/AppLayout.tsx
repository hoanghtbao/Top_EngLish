/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Layout chính (AppLayout) tích hợp Collapsible Left Sidebar và Sticky AppHeader tuân thủ UI/UX Pro Max
 */

"use client";

import React from "react";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import { useSidebar } from "../context/sidebar-context";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isInitialized } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area: Dynamic Left Margin according to Collapse State */}
      <div
        className={`flex-1 flex flex-col ${
          isInitialized ? "transition-all duration-300 ease-in-out" : ""
        } ${isCollapsed ? "md:pl-20" : "md:pl-64"}`}
      >
        {/* Sticky Minimal Header */}
        <AppHeader />

        {/* Page Children Content */}
        <div className="flex-1 w-full">{children}</div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutInner>{children}</AppLayoutInner>;
}
