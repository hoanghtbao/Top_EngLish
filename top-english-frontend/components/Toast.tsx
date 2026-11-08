/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Thông báo dạng Toast nổi góc màn hình (Toast Notification) với nền xanh ngọc bích trong suốt (Emerald Glassmorphism)
 *              đồng bộ tuyệt đối với màu chủ đề của TopEnglish cho cả Đăng nhập, Đăng xuất và mọi thao tác.
 */

"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  id?: string;
  type?: "success" | "error" | "info";
  title: string;
  message?: string;
  position?: "top-right" | "bottom-right";
  duration?: number; // ms, mặc định 4000ms (3-5 giây)
  onClose?: () => void;
}

export default function Toast({
  type = "success",
  title,
  message,
  position = "top-right",
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isRendered, setIsRendered] = useState(true);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    // Kích hoạt hiệu ứng xuất hiện (Fade & Scale In)
    const enterTimer = requestAnimationFrame(() => {
      setIsShowing(true);
    });

    // Tự động đóng sau khoảng thời gian duration (3-5 giây)
    const dismissTimer = setTimeout(() => {
      setIsShowing(false);
      setTimeout(() => {
        setIsRendered(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onClose]);

  const handleManualClose = () => {
    setIsShowing(false);
    setTimeout(() => {
      setIsRendered(false);
      onClose?.();
    }, 300);
  };

  if (!isRendered) return null;

  // Biểu tượng SVG Lucide sắc nét tương ứng từng trạng thái
  const getIcon = () => {
    switch (type) {
      case "error":
        return (
          <div className="size-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <AlertCircle className="size-5 text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" />
          </div>
        );
      case "info":
        return (
          <div className="size-9 rounded-xl bg-emerald-500/25 border border-emerald-400/35 flex items-center justify-center shrink-0 shadow-inner">
            <Info className="size-5 text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]" />
          </div>
        );
      default:
        // Biểu tượng ngọc bích chuẩn bộ nhận diện TopEnglish
        return (
          <div className="size-9 rounded-xl bg-emerald-500/25 border border-emerald-400/35 flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 className="size-5 text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]" />
          </div>
        );
    }
  };

  // Nền kính mờ trong suốt xanh ngọc bích (Emerald / Jade Glassmorphism)
  const getContainerStyle = () => {
    switch (type) {
      case "error":
        return "bg-gradient-to-br from-rose-900/85 via-rose-950/90 to-slate-950/90 border-rose-400/35 shadow-rose-950/50 ring-1 ring-white/10";
      default:
        // Xanh ngọc bích trong suốt đồng bộ thương hiệu TopEnglish (Đăng nhập, Đăng xuất, Thông báo)
        return "bg-gradient-to-br from-emerald-900/85 via-teal-950/90 to-slate-950/90 border-emerald-400/35 shadow-emerald-950/60 ring-1 ring-white/10";
    }
  };

  // Màu sắc dải màu thanh thời gian countdown
  const getProgressBarColor = () => {
    switch (type) {
      case "error":
        return "bg-gradient-to-r from-rose-400 via-pink-400 to-rose-300";
      default:
        // Dải ngọc bích sáng chuyển dần từ emerald sang teal/cyan
        return "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200";
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-right":
        return "bottom-6 right-6";
      default:
        return "top-5 right-5 sm:top-6 sm:right-6";
    }
  };

  const getSheenColor = () => {
    switch (type) {
      case "error":
        return "via-rose-300/40";
      default:
        return "via-emerald-300/40";
    }
  };

  return (
    <div
      role="alert"
      className={`fixed z-[100] max-w-sm w-[calc(100vw-2.5rem)] sm:w-full overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl flex flex-col transition-all duration-300 ease-out ${getPositionClasses()} ${getContainerStyle()} ${
        isShowing
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
      }`}
    >
      {/* Tia sáng mỏng tinh tế ở viền trên cùng của thẻ kính */}
      <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent ${getSheenColor()} to-transparent pointer-events-none`} />

      {/* Phần nội dung chính của Toast */}
      <div className="p-4 flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="text-xs font-bold text-white tracking-wide leading-tight">
            {title}
          </h4>
          {message && (
            <p className="text-[11px] text-emerald-100/90 font-medium mt-1 leading-relaxed">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={handleManualClose}
          className="size-7 rounded-lg text-emerald-200/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label="Đóng thông báo"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Thanh thời gian (Progress Countdown Bar) chạy từ dài (100%) sang ngắn (0%) */}
      <div className="h-1 w-full bg-emerald-950/70 overflow-hidden">
        <div
          className={`h-full ${getProgressBarColor()}`}
          style={{
            animation: `toastProgressShrink ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
