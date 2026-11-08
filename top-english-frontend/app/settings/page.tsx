/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang Cài Đặt Hệ Thống, Tùy Chỉnh Chế Độ Sáng/Tối & Bảo Mật Tài Khoản (Settings & Security)
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Globe2,
  Key,
  Laptop,
  Lock,
  Moon,
  Palette,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  Upload,
  User as UserIcon,
  Volume2,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../context/auth-context";
import { useTheme, Theme } from "../../context/theme-context";
import { fetchApi } from "../../lib/api-client";
import UserAvatar from "../../components/UserAvatar";
import AvatarUploadModal from "../../components/AvatarUploadModal";

const AVATAR_OPTIONS = [
  { id: "bear", label: "Gấu", icon: "🐻" },
  { id: "fox", label: "Cáo", icon: "🦊" },
  { id: "eagle", label: "Đại Bàng", icon: "🦅" },
  { id: "lion", label: "Sư Tử", icon: "🦁" },
  { id: "panda", label: "Panda", icon: "🐼" },
  { id: "wolf", label: "Sói Tuyết", icon: "🐺" },
  { id: "astronaut", label: "Phi Hành Gia", icon: "🚀" },
  { id: "robot", label: "Robot", icon: "🤖" },
];

export default function SettingsPage() {
  const { user, isAuthenticated, refreshProfile, showToast } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"appearance" | "account" | "security">("appearance");

  // Profile Edit State
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  // Sync profile data
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setAvatar(user.avatar || "");
    }
  }, [user]);

  // Cập nhật thông tin cá nhân
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!fullName.trim()) {
      setProfileMsg({ type: "error", text: "Họ và tên không được để trống." });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetchApi("/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: fullName.trim(),
          avatar: avatar || null,
        }),
      });

      if (res.success) {
        setProfileMsg({ type: "success", text: "Cập nhật thông tin hồ sơ thành công!" });
        showToast({
          type: "success",
          title: "Đã lưu thay đổi",
          message: "Thông tin tài khoản của bạn đã được cập nhật.",
        });
        await refreshProfile();
      } else {
        setProfileMsg({ type: "error", text: res.message || "Không thể lưu thông tin." });
      }
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Lỗi kết nối khi cập nhật hồ sơ." });
    } finally {
      setSavingProfile(false);
    }
  };

  // Đổi mật khẩu
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Vui lòng nhập mật khẩu hiện tại." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu xác nhận không trùng khớp." });
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetchApi("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.success) {
        setPasswordMsg({ type: "success", text: "Đổi mật khẩu tài khoản thành công!" });
        showToast({
          type: "success",
          title: "Bảo mật tài khoản",
          message: "Mật khẩu của bạn đã được thay đổi an toàn.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMsg({ type: "error", text: res.message || "Không thể đổi mật khẩu." });
      }
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Lỗi khi đổi mật khẩu." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* HERO BANNER - THEME NGỌC BÍCH EMERALD-TEAL */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 shadow-xl shadow-teal-900/10 border border-teal-500/20">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 text-emerald-100 w-fit">
                <Palette className="size-3.5" />
                Cài Đặt Hệ Thống & Bảo Mật
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Cài Đặt Tài Khoản & Giao Diện
              </h1>
              <p className="text-xs sm:text-sm text-emerald-50 max-w-xl font-normal leading-relaxed">
                Tùy biến chế độ hiển thị Sáng/Tối, chỉnh sửa thông tin cá nhân và quản lý mật khẩu bảo mật tài khoản.
              </p>
            </div>

            {/* Quick Link to Achievements */}
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Trophy className="size-4 text-amber-300" />
              Xem Tủ Kính Thành Tựu
            </Link>
          </div>
          <div className="absolute -right-12 -bottom-16 size-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        </section>

        {/* SETTINGS TABS CONTAINER */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex-1 py-4 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "appearance"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Palette className="size-4" />
              1. Giao Diện Sáng / Tối
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`flex-1 py-4 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "account"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <UserIcon className="size-4" />
              2. Thông Tin Tài Khoản
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-4 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "security"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Lock className="size-4" />
              3. Bảo Mật & Đổi Mật Khẩu
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* =========================================================================
                TAB 1: GIAO DIỆN SÁNG / TỐI (THEME & APPEARANCE)
            ========================================================================= */}
            {activeTab === "appearance" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <Palette className="size-5 text-emerald-600" />
                    Chế Độ Màu Sắc Giao Diện (Theme Mode)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Lựa chọn giao diện phù hợp với thị lực và thói quen học tập của bạn.
                  </p>
                </div>

                {/* 3 THEME CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Option 1: Light Mode */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-5 rounded-2xl border-2 flex flex-col gap-3 text-left transition-all cursor-pointer ${
                      theme === "light"
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                        <Sun className="size-6" />
                      </div>
                      {theme === "light" && (
                        <div className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        Chế Độ Sáng (Light)
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tươi sáng, rõ ràng, phù hợp học tập ban ngày và nơi nhiều ánh sáng.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Dark Mode */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-5 rounded-2xl border-2 flex flex-col gap-3 text-left transition-all cursor-pointer ${
                      theme === "dark"
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                        <Moon className="size-6" />
                      </div>
                      {theme === "dark" && (
                        <div className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        Chế Độ Tối (Dark)
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dịu mắt, giảm lóa, tiết kiệm pin và tối ưu cho việc học ban đêm.
                      </p>
                    </div>
                  </button>

                  {/* Option 3: System Mode */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`p-5 rounded-2xl border-2 flex flex-col gap-3 text-left transition-all cursor-pointer ${
                      theme === "system"
                        ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-xs">
                        <Laptop className="size-6" />
                      </div>
                      {theme === "system" && (
                        <div className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        Theo Hệ Thống (Auto)
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tự động chuyển đổi theo thiết lập giao diện của thiết bị bạn đang dùng.
                      </p>
                    </div>
                  </button>
                </div>

                {/* LIVE PREVIEW BOX */}
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      ✨
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Đang áp dụng: Chế độ{" "}
                        <span className="text-emerald-600 dark:text-emerald-400 capitalize">
                          {resolvedTheme === "dark" ? "Tối (Dark Mode)" : "Sáng (Light Mode)"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Cấu hình đã được lưu tự động trên trình duyệt của bạn.
                      </div>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    Hoạt động ngay lập tức
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 2: THÔNG TIN TÀI KHOẢN (PROFILE DETAILS)
            ========================================================================= */}
            {activeTab === "account" && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <UserIcon className="size-5 text-emerald-600" />
                    Hồ Sơ & Danh Tính Người Dùng
                  </h2>
                  <p className="text-xs text-slate-500">
                    Cập nhật họ tên hiển thị và lựa chọn linh vật đại diện của bạn trên hệ thống.
                  </p>
                </div>

                {profileMsg && (
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2 ${
                      profileMsg.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                        : "bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    {profileMsg.type === "success" ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0 text-rose-600" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Họ và Tên Hiển Thị
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Hoàng Bảo, Alex Pro..."
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      required
                    />
                  </div>

                  {/* Email Read-only */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Địa Chỉ Email (Tên đăng nhập)
                    </label>
                    <div className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-mono text-sm flex items-center justify-between">
                      <span>{user?.email || "Chưa đăng nhập"}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Đã xác thực
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Email được cố định để đảm bảo tính an toàn cho dữ liệu học tập của bạn.
                    </p>
                  </div>

                  {/* Role & Privileges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <div className="text-xs text-slate-400 font-medium">Vai trò tài khoản</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                        {user?.role === "admin"
                          ? "🛡️ Quản trị viên (Admin)"
                          : user?.role === "teacher"
                          ? "👨‍🏫 Giáo viên (Teacher)"
                          : "🎓 Học viên (Student)"}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <div className="text-xs text-slate-400 font-medium">Tích lũy hệ thống</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-3">
                        <span>🔥 Chuỗi {user?.streak || 0} ngày</span>
                        <span>•</span>
                        <span>⚡ {user?.totalXP || 0} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Avatar & Photo Customizer */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col gap-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Ảnh Đại Diện & Linh Vật (Avatar)
                    </label>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative group shrink-0">
                          <UserAvatar
                            avatar={avatar}
                            fullName={fullName || user?.fullName}
                            role={user?.role}
                            size="xl"
                            editable
                            onEdit={() => setShowAvatarModal(true)}
                            className="shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAvatarModal(true)}
                            className="absolute -bottom-1 -right-1 size-6 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-md flex items-center justify-center hover:scale-110 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                            title="Tải ảnh mới"
                          >
                            <Camera className="size-3 text-emerald-600" />
                          </button>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {avatar
                              ? avatar.startsWith("http") || avatar.startsWith("/uploads")
                                ? "Ảnh tải lên từ thiết bị"
                                : `Linh vật ${avatar}`
                              : "Ảnh đại diện chữ cái mặc định"}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Hỗ trợ tải ảnh từ máy tính (PNG, JPG, WEBP) hoặc linh vật Emoji sinh động.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAvatarModal(true)}
                          className="h-9.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2 shrink-0"
                        >
                          <Upload className="size-3.5" />
                          <span>Tải ảnh lên / Đổi ảnh</span>
                        </button>

                        {avatar && (
                          <button
                            type="button"
                            onClick={() => setAvatar("")}
                            className="h-9.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                            title="Gỡ ảnh đại diện"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Gỡ</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick mascot picker */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[11px] font-semibold text-slate-400 mb-2">
                        Hoặc chọn nhanh linh vật:
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {AVATAR_OPTIONS.map((av) => (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => setAvatar(av.icon)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition ${
                              avatar === av.icon
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40"
                            }`}
                          >
                            <span className="text-xl leading-none">{av.icon}</span>
                            <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 truncate w-full text-center">
                              {av.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="size-4" />
                    {savingProfile ? "Đang lưu thay đổi..." : "Lưu Thông Tin Hồ Sơ"}
                  </button>
                </div>
              </form>
            )}

            {/* =========================================================================
                TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU (SECURITY & PASSWORD)
            ========================================================================= */}
            {activeTab === "security" && (
              <form onSubmit={handleSavePassword} className="flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <ShieldCheck className="size-5 text-emerald-600" />
                    Bảo Mật Tài Khoản & Đổi Mật Khẩu
                  </h2>
                  <p className="text-xs text-slate-500">
                    Nên đặt mật khẩu có độ dài tối thiểu 6 ký tự kết hợp chữ, số và ký tự đặc biệt.
                  </p>
                </div>

                {passwordMsg && (
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2 ${
                      passwordMsg.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                        : "bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    {passwordMsg.type === "success" ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0 text-rose-600" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Mật Khẩu Hiện Tại
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu bạn đang dùng..."
                        className="w-full h-12 pl-4 pr-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showCurrentPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Mật Khẩu Mới (Tối thiểu 6 ký tự)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới an toàn..."
                        className="w-full h-12 pl-4 pr-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Xác Nhận Mật Khẩu Mới
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới vừa gõ..."
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Key className="size-4" />
                    {savingPassword ? "Đang cập nhật..." : "Cập Nhật Mật Khẩu Mới"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onAvatarUpdated={(newAv) => setAvatar(newAv || "")}
      />
    </AppLayout>
  );
}
