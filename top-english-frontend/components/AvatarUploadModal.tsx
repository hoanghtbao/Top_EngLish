/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Modal cập nhật ảnh đại diện đa năng (Tải ảnh từ máy tính, chọn linh vật, hoặc dán link URL)
 */

"use client";

import React, { useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  RefreshCw,
  Smile,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../context/auth-context";
import { fetchApi } from "../lib/api-client";
import UserAvatar from "./UserAvatar";

const MASCOT_OPTIONS = [
  { id: "bear", label: "Gấu", icon: "🐻" },
  { id: "fox", label: "Cáo", icon: "🦊" },
  { id: "lion", label: "Sư Tử", icon: "🦁" },
  { id: "panda", label: "Gấu Trúc", icon: "🐼" },
  { id: "eagle", label: "Đại Bàng", icon: "🦅" },
  { id: "wolf", label: "Sói Tuyết", icon: "🐺" },
  { id: "astronaut", label: "Phi Hành Gia", icon: "🚀" },
  { id: "robot", label: "Người Máy", icon: "🤖" },
  { id: "owl", label: "Cú Mèo Tri Thức", icon: "🦉" },
  { id: "unicorn", label: "Kỳ Lân", icon: "🦄" },
  { id: "crown", label: "Vương Miện", icon: "👑" },
  { id: "target", label: "Mục Tiêu", icon: "🎯" },
  { id: "cat", label: "Mèo", icon: "🐱" },
  { id: "dog", label: "Chó Cưng", icon: "🐶" },
  { id: "tiger", label: "Hổ Dũng Mãnh", icon: "🐯" },
  { id: "dolphin", label: "Cá Heo", icon: "🐬" },
];

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    _id: string;
    fullName: string;
    role: string;
    avatar?: string | null;
  } | null;
  onAvatarUpdated?: (newAvatar: string | null) => void;
}

export default function AvatarUploadModal({
  isOpen,
  onClose,
  targetUser,
  onAvatarUpdated,
}: AvatarUploadModalProps) {
  const { user: currentUser, refreshProfile, showToast } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Người dùng mục tiêu (nếu targetUser truyền vào là Admin đang sửa user khác, ngược lại là user hiện tại)
  const effectiveUser = targetUser || currentUser;

  const [activeTab, setActiveTab] = useState<"upload" | "mascot" | "url">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  if (!isOpen || !effectiveUser) return null;

  const isEditingOtherUser = Boolean(targetUser && targetUser._id !== currentUser?._id);

  // Xử lý khi chọn file từ máy tính
  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    if (!file.type.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i) && !file.type.startsWith("image/")) {
      setErrorMsg("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Kích thước file ảnh không được vượt quá 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Kéo thả file
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Upload file lên máy chủ
  const handleUploadFile = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const endpoint = isEditingOtherUser
        ? `/admin/users/${effectiveUser._id}/avatar`
        : "/auth/avatar";

      const res = await fetchApi<{ avatarUrl: string }>(endpoint, {
        method: "POST",
        body: formData,
      });

      if (res.success && res.data) {
        showToast({
          type: "success",
          title: "Thành công",
          message: isEditingOtherUser
            ? `Đã cập nhật ảnh đại diện cho ${effectiveUser.fullName}`
            : "Đã cập nhật ảnh đại diện cá nhân của bạn!",
        });

        if (!isEditingOtherUser) {
          await refreshProfile();
        }
        if (onAvatarUpdated) {
          onAvatarUpdated(res.data.avatarUrl);
        }
        onClose();
      } else {
        setErrorMsg(res.message || "Tải lên ảnh thất bại");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối khi tải ảnh lên");
    } finally {
      setLoading(false);
    }
  };

  // Chọn Mascot Emoji
  const handleSelectMascot = async (mascot: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const endpoint = isEditingOtherUser
        ? `/admin/users/${effectiveUser._id}/avatar`
        : "/auth/profile";

      const method = isEditingOtherUser ? "PATCH" : "PUT";
      const body = isEditingOtherUser
        ? JSON.stringify({ avatar: mascot })
        : JSON.stringify({ avatar: mascot });

      const res = await fetchApi(endpoint, {
        method,
        body,
      });

      if (res.success) {
        showToast({
          type: "success",
          title: "Đã đổi linh vật",
          message: `Ảnh đại diện đã được đổi thành ${mascot}`,
        });

        if (!isEditingOtherUser) {
          await refreshProfile();
        }
        if (onAvatarUpdated) {
          onAvatarUpdated(mascot);
        }
        onClose();
      } else {
        setErrorMsg(res.message || "Không thể cập nhật linh vật");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu ảnh đại diện");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật qua đường dẫn URL
  const handleSaveUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg("Vui lòng nhập đường dẫn URL ảnh");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const endpoint = isEditingOtherUser
        ? `/admin/users/${effectiveUser._id}/avatar`
        : "/auth/profile";

      const method = isEditingOtherUser ? "PATCH" : "PUT";
      const res = await fetchApi(endpoint, {
        method,
        body: JSON.stringify({ avatar: urlInput.trim() }),
      });

      if (res.success) {
        showToast({
          type: "success",
          title: "Thành công",
          message: "Đã cập nhật ảnh đại diện từ đường dẫn URL",
        });

        if (!isEditingOtherUser) {
          await refreshProfile();
        }
        if (onAvatarUpdated) {
          onAvatarUpdated(urlInput.trim());
        }
        onClose();
      } else {
        setErrorMsg(res.message || "Không thể lưu URL ảnh");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối khi cập nhật URL ảnh");
    } finally {
      setLoading(false);
    }
  };

  // Gỡ bỏ ảnh đại diện (quay về chữ cái đầu)
  const handleRemoveAvatar = async () => {
    if (!confirm("Bạn có chắc chắn muốn gỡ ảnh đại diện và quay về chữ cái mặc định?")) {
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const endpoint = isEditingOtherUser
        ? `/admin/users/${effectiveUser._id}/avatar`
        : "/auth/profile";

      const method = isEditingOtherUser ? "PATCH" : "PUT";
      const res = await fetchApi(endpoint, {
        method,
        body: JSON.stringify({ avatar: "" }),
      });

      if (res.success) {
        showToast({
          type: "success",
          title: "Đã gỡ ảnh đại diện",
          message: "Tài khoản đã quay về ảnh đại diện chữ cái mặc định.",
        });

        if (!isEditingOtherUser) {
          await refreshProfile();
        }
        if (onAvatarUpdated) {
          onAvatarUpdated(null);
        }
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể gỡ ảnh đại diện");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* MODAL HEADER */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Camera className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditingOtherUser
                  ? `Đổi Ảnh Đại Diện: ${effectiveUser.fullName}`
                  : "Cập Nhật Ảnh Đại Diện"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditingOtherUser
                  ? `Vai trò: ${effectiveUser.role.toUpperCase()} (${effectiveUser._id})`
                  : "Tùy biến hình ảnh đại diện hiển thị trên toàn hệ thống"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* CURRENT AVATAR PREVIEW STRIP */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatar={filePreview || effectiveUser.avatar}
              fullName={effectiveUser.fullName}
              role={effectiveUser.role}
              size="lg"
              showRoleBadge
            />
            <div>
              <div className="text-xs text-slate-400 font-medium">Đang hiển thị</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {effectiveUser.fullName}
              </div>
            </div>
          </div>

          {effectiveUser.avatar && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={loading}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Gỡ ảnh đại diện</span>
            </button>
          )}
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "upload"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="size-3.5" />
            Tải Lên Từ Máy
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mascot")}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "mascot"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Smile className="size-3.5" />
            Linh Vật Emoji
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "url"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Globe className="size-3.5" />
            Dán Link Ảnh
          </button>
        </div>

        {/* ERROR ALERT */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: UPLOAD TỪ THIẾT BỊ */}
        {activeTab === "upload" && (
          <div className="p-6 flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40"
                  : selectedFile
                  ? "border-emerald-400 bg-slate-50/80 dark:bg-slate-800/40"
                  : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <Upload className="size-6" />
              </div>

              <div>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">
                  {selectedFile ? selectedFile.name : "Kéo thả ảnh vào đây hoặc bấm để chọn"}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Hỗ trợ PNG, JPG, WEBP, GIF (Dung lượng tối đa 5MB)
                </span>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy chọn
                </button>

                <button
                  type="button"
                  onClick={handleUploadFile}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5" />
                      <span>Lưu Ảnh Mới</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LINH VẬT EMOJI */}
        {activeTab === "mascot" && (
          <div className="p-6 flex flex-col gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Chọn một linh vật đại diện dưới đây để làm mới diện mạo:
            </span>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 max-h-64 overflow-y-auto p-1">
              {MASCOT_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMascot(m.icon)}
                  disabled={loading}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition transform hover:scale-105 ${
                    effectiveUser.avatar === m.icon
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40"
                  }`}
                  title={m.label}
                >
                  <span className="text-2xl leading-none">{m.icon}</span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate w-full text-center">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DÁN LINK URL ẢNH */}
        {activeTab === "url" && (
          <div className="p-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Đường dẫn URL ảnh trực tuyến
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/my-photo.jpg"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dán đường dẫn ảnh hợp lệ từ Imgur, Unsplash, Gravatar hoặc Facebook.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveUrl}
                disabled={loading || !urlInput.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    <span>Áp Dụng URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
