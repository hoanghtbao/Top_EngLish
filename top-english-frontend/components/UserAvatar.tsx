/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Thành phần hiển thị ảnh đại diện chuẩn UI/UX đa kích thước (User Avatar Component)
 */

"use client";

import React, { useState } from "react";
import { Camera, GraduationCap, Shield, Sparkles } from "lucide-react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type UserRole = "student" | "teacher" | "admin" | string;

interface UserAvatarProps {
  avatar?: string | null;
  fullName?: string;
  role?: UserRole;
  size?: AvatarSize;
  className?: string;
  showRoleBadge?: boolean;
  editable?: boolean;
  onEdit?: () => void;
  title?: string;
}

export function getFullImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.includes("/uploads/")) {
    const filename = url.split("/uploads/").pop();
    return `/uploads/${filename}`;
  }
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
  return `${backendBase}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function UserAvatar({
  avatar,
  fullName = "",
  role = "student",
  size = "md",
  className = "",
  showRoleBadge = false,
  editable = false,
  onEdit,
  title,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Kích thước chuẩn Tailwind
  const sizeClasses: Record<AvatarSize, { container: string; text: string; icon: string; badge: string }> = {
    xs: { container: "size-6", text: "text-[10px]", icon: "size-2.5", badge: "size-2.5 -bottom-0.5 -right-0.5" },
    sm: { container: "size-8", text: "text-xs", icon: "size-3", badge: "size-3 -bottom-0.5 -right-0.5" },
    md: { container: "size-10", text: "text-sm", icon: "size-4", badge: "size-3.5 -bottom-0.5 -right-0.5" },
    lg: { container: "size-12", text: "text-base", icon: "size-5", badge: "size-4 -bottom-1 -right-1" },
    xl: { container: "size-16", text: "text-xl", icon: "size-6", badge: "size-5 -bottom-1 -right-1" },
    "2xl": { container: "size-20", text: "text-2xl", icon: "size-7", badge: "size-6 -bottom-1 -right-1" },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  // Dải màu Gradient theo vai trò người dùng
  const roleGradients: Record<string, string> = {
    admin: "from-purple-600 via-indigo-600 to-violet-700 text-white ring-purple-500/30",
    teacher: "from-blue-600 via-sky-600 to-cyan-600 text-white ring-blue-500/30",
    student: "from-emerald-600 via-teal-600 to-emerald-700 text-white ring-emerald-500/30",
  };

  const gradientClass = roleGradients[role?.toLowerCase()] || roleGradients.student;

  // Kiểm tra xem avatar là URL ảnh hay là Emoji mascot
  const isImageUrl =
    Boolean(avatar) &&
    !imageError &&
    (avatar!.startsWith("http://") ||
      avatar!.startsWith("https://") ||
      avatar!.startsWith("/uploads") ||
      avatar!.startsWith("data:image"));

  const isEmoji = Boolean(avatar) && !isImageUrl;

  // Ký tự viết tắt chữ cái đầu
  const initial = fullName ? fullName.trim().charAt(0).toUpperCase() : "U";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none transition-transform ${
        currentSize.container
      } ${editable ? "cursor-pointer group" : ""} ${className}`}
      onClick={editable && onEdit ? onEdit : undefined}
      title={title || fullName || "Ảnh đại diện"}
    >
      {/* 1. HIỂN THỊ DẠNG ẢNH ĐƯỜNG DẪN URL */}
      {isImageUrl ? (
        <img
          src={getFullImageUrl(avatar)}
          alt={fullName || "Avatar"}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover rounded-2xl shadow-xs ring-1 ring-black/5 dark:ring-white/10 ${
            editable ? "group-hover:opacity-80 transition" : ""
          }`}
        />
      ) : isEmoji ? (
        /* 2. HIỂN THỊ DẠNG EMOJI LINH VẬT */
        <div
          className={`w-full h-full rounded-2xl flex items-center justify-center shadow-xs bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 ${
            currentSize.text
          } ${editable ? "group-hover:opacity-80 transition" : ""}`}
        >
          <span className="leading-none transform group-hover:scale-110 transition-transform">
            {avatar}
          </span>
        </div>
      ) : (
        /* 3. HIỂN THỊ DẠNG CHỮ CÁI ĐẦU VỚI GRADIENT THEO VAI TRÒ */
        <div
          className={`w-full h-full rounded-2xl bg-gradient-to-tr ${gradientClass} flex items-center justify-center font-black shadow-xs ring-1 ${
            currentSize.text
          } ${editable ? "group-hover:opacity-85 transition" : ""}`}
        >
          <span>{initial}</span>
        </div>
      )}

      {/* 4. OVERLAY CHỈNH SỬA KHI HOVER (CAMERA ICON) */}
      {editable && (
        <div className="absolute inset-0 rounded-2xl bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 shadow-md">
          <Camera className={currentSize.icon} />
        </div>
      )}

      {/* 5. ROLE BADGE Ở GÓC DƯỚI NẾU ĐƯỢC BẬT */}
      {showRoleBadge && (
        <span
          className={`absolute rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs ${
            currentSize.badge
          } ${
            role === "admin"
              ? "bg-purple-600 text-white"
              : role === "teacher"
              ? "bg-blue-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
          title={`Vai trò: ${role}`}
        >
          {role === "admin" ? (
            <Shield className="size-2" />
          ) : role === "teacher" ? (
            <GraduationCap className="size-2" />
          ) : (
            <Sparkles className="size-2" />
          )}
        </span>
      )}
    </div>
  );
}
