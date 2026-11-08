/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Bảng điều khiển Quản trị hệ thống & Báo cáo số liệu toàn diện (Admin Dashboard) tuân thủ UI/UX Pro Max
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  Flame,
  GraduationCap,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  Moon,
  MoreVertical,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
  Type,
  Unlock,
  UploadCloud,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../context/auth-context";
import { useBrand } from "../../context/brand-context";
import { fetchApi } from "../../lib/api-client";
import UserAvatar from "../../components/UserAvatar";
import AvatarUploadModal from "../../components/AvatarUploadModal";

interface SystemStats {
  users: {
    total: number;
    students: number;
    teachers: number;
    admins: number;
    active: number;
    inactive: number;
  };
  content: {
    totalTopics: number;
    totalVocabularies: number;
    totalGrammars: number;
    totalQuizzes: number;
    totalQuestions: number;
    totalClassrooms: number;
  };
  engagement: {
    totalXP: number;
    avgStreak: number;
    recentUsers: Array<{
      _id: string;
      fullName: string;
      email: string;
      role: "student" | "teacher" | "admin";
      avatar?: string;
      streak: number;
      totalXP: number;
      isActive: boolean;
      createdAt: string;
    }>;
  };
  system: {
    nodeVersion: string;
    uptimeSeconds: number;
    memoryUsageMB: number;
    serverTime: string;
  };
}

interface UserItem {
  _id: string;
  fullName: string;
  email: string;
  role: "student" | "teacher" | "admin";
  avatar?: string;
  streak: number;
  totalXP: number;
  isActive: boolean;
  createdAt: string;
}

interface ContentSummary {
  topics: Array<{
    _id: string;
    title: string;
    level: string;
    totalWords: number;
    isPublished: boolean;
    createdAt: string;
  }>;
  grammars: Array<{
    _id: string;
    title: string;
    level: string;
    order: number;
    isPublished: boolean;
    createdAt: string;
  }>;
  quizzes: Array<{
    _id: string;
    title: string;
    level: string;
    timeLimit: number;
    totalXP: number;
    createdAt: string;
  }>;
  classrooms: Array<{
    _id: string;
    name: string;
    code: string;
    teacher?: { fullName: string; email: string };
    students: string[];
    createdAt: string;
  }>;
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

export default function AdminDashboardPage() {
  const { user, isAuthenticated, showToast } = useAuth();
  const { brandSettings, updateBrandState, refreshBrandSettings } = useBrand();

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "content" | "homepage"
  >("overview");

  // State: Cấu hình Giao diện & Ảnh nền Hero Trang chủ
  const [heroBgUrl, setHeroBgUrl] = useState("");
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [blurAmount, setBlurAmount] = useState(0);
  const [isHeroBgEnabled, setIsHeroBgEnabled] = useState(true);
  const [loadingHeroSettings, setLoadingHeroSettings] = useState(false);
  const [isSavingHeroSettings, setIsSavingHeroSettings] = useState(false);
  const [isUploadingHeroBg, setIsUploadingHeroBg] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("light");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State: Tên Thương Hiệu Logo & Tiêu Đề Hero Trang Chủ
  const [brandName, setBrandName] = useState("TopEnglish");
  const [brandSubtitle, setBrandSubtitle] = useState("by HoangBao");
  const [heroTitle, setHeroTitle] = useState("Chinh phục tiếng Anh với");
  const [heroHighlight, setHeroHighlight] = useState("TopEnglish");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.",
  );
  const [heroBadge, setHeroBadge] = useState(
    "Nền tảng học tiếng Anh thông minh thế hệ mới",
  );

  // Presets ảnh nền đẹp chuẩn TopEnglish
  const heroPresets = [
    {
      id: "oxford-lib",
      title: "Thư viện Hoàng gia Oxford",
      desc: "Không gian cổ điển, tôn vinh văn hóa học thuật Anh",
      category: "Cổ Điển",
      url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2000&auto=format&fit=crop",
    },
    {
      id: "campus-modern",
      title: "Khuôn Viên Đại Học Quốc Tế",
      desc: "Hiện đại, cởi mở, truyền cảm hứng học tập năng động",
      category: "Campus",
      url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop",
    },
    {
      id: "study-cozy",
      title: "Góc Học Tập & Tri Thức Mở",
      desc: "Ấm cúng, tối giản, thanh lịch, tạo cảm giác thư thái",
      category: "Tối Giản",
      url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2000&auto=format&fit=crop",
    },
    {
      id: "tech-mesh",
      title: "Công Nghệ & AI Tương Lai",
      desc: "Mạng lưới kỹ thuật số phong cách Emerald tương lai",
      category: "Công Nghệ",
      url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000&auto=format&fit=crop",
    },
    {
      id: "london-city",
      title: "Tháp Luân Đôn & Sông Thames",
      desc: "Biểu tượng thủ đô nước Anh đậm đà bản sắc ngôn ngữ",
      category: "London",
      url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2000&auto=format&fit=crop",
    },
  ];

  // State: Thống kê tổng thể
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // State: Danh sách người dùng
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // State: Giám sát học liệu
  const [contentSummary, setContentSummary] = useState<ContentSummary | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // State: Modal Đổi vai trò
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserItem | null>(null);
  const [newRoleChoice, setNewRoleChoice] = useState<"student" | "teacher" | "admin">("student");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // State: Modal Cập nhật Avatar cho người dùng
  const [editingAvatarUser, setEditingAvatarUser] = useState<UserItem | null>(null);

  // 1. Tải số liệu thống kê
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await fetchApi<SystemStats>("/admin/stats");
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Lỗi tải thống kê",
        message: err.message || "Không thể tải số liệu báo cáo",
      });
    } finally {
      setLoadingStats(false);
    }
  }, [showToast]);

  // 2. Tải danh sách người dùng
  const loadUsers = useCallback(
    async (page = 1) => {
      try {
        setLoadingUsers(true);
        let queryParams = `?page=${page}&limit=10`;
        if (searchQuery.trim()) queryParams += `&search=${encodeURIComponent(searchQuery.trim())}`;
        if (roleFilter) queryParams += `&role=${roleFilter}`;
        if (statusFilter) queryParams += `&status=${statusFilter}`;

        const res = await fetchApi<UserItem[]>(`/admin/users${queryParams}`);
        if (res.success && res.data) {
          setUsersList(res.data);
          if (res.pagination) {
            setUsersPagination(res.pagination);
          }
        }
      } catch (err: any) {
        showToast({
          type: "error",
          title: "Lỗi danh sách người dùng",
          message: err.message,
        });
      } finally {
        setLoadingUsers(false);
      }
    },
    [searchQuery, roleFilter, statusFilter, showToast],
  );

  // 3. Tải giám sát học liệu
  const loadContentSummary = useCallback(async () => {
    try {
      setLoadingContent(true);
      const res = await fetchApi<ContentSummary>("/admin/content/summary");
      if (res.success && res.data) {
        setContentSummary(res.data);
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Lỗi tải dữ liệu học liệu",
        message: err.message,
      });
    } finally {
      setLoadingContent(false);
    }
  }, [showToast]);

  // 4. Tải cấu hình ảnh nền & thương hiệu Hero trang chủ
  const loadHeroSettings = useCallback(async () => {
    try {
      setLoadingHeroSettings(true);
      const res = await fetchApi<any>("/admin/settings/homepage");
      if (res.success && res.data) {
        setHeroBgUrl(res.data.backgroundUrl || "");
        setUrlInput(res.data.backgroundUrl || "");
        setOverlayOpacity(
          typeof res.data.overlayOpacity === "number"
            ? res.data.overlayOpacity
            : 0.5,
        );
        setBlurAmount(
          typeof res.data.blurAmount === "number" ? res.data.blurAmount : 0,
        );
        setIsHeroBgEnabled(
          typeof res.data.isEnabled === "boolean" ? res.data.isEnabled : true,
        );

        // Nạp tên thương hiệu và tiêu đề trang chủ
        if (res.data.brandName) setBrandName(res.data.brandName);
        if (res.data.brandSubtitle) setBrandSubtitle(res.data.brandSubtitle);
        if (res.data.heroTitle) setHeroTitle(res.data.heroTitle);
        if (res.data.heroHighlight) setHeroHighlight(res.data.heroHighlight);
        if (res.data.heroSubtitle) setHeroSubtitle(res.data.heroSubtitle);
        if (res.data.heroBadge) setHeroBadge(res.data.heroBadge);
      }
    } catch (err: any) {
      console.error("Lỗi tải cấu hình trang chủ:", err);
    } finally {
      setLoadingHeroSettings(false);
    }
  }, []);

  // Lưu cấu hình ảnh nền & thương hiệu trang chủ
  const handleSaveHeroSettings = async () => {
    try {
      setIsSavingHeroSettings(true);
      const payload = {
        backgroundUrl: heroBgUrl,
        overlayOpacity: Number(overlayOpacity),
        blurAmount: Number(blurAmount),
        isEnabled: isHeroBgEnabled,
        brandName: brandName.trim() || "TopEnglish",
        brandSubtitle: brandSubtitle.trim() || "by HoangBao",
        heroTitle: heroTitle.trim() || "Chinh phục tiếng Anh với",
        heroHighlight: heroHighlight.trim() || "TopEnglish",
        heroSubtitle:
          heroSubtitle.trim() ||
          "Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.",
        heroBadge:
          heroBadge.trim() || "Nền tảng học tiếng Anh thông minh thế hệ mới",
      };

      const res = await fetchApi("/admin/settings/homepage", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        // Cập nhật BrandContext toàn cục ngay lập tức (Logo, Sidebar, Header)
        updateBrandState(payload);
        await refreshBrandSettings();

        showToast({
          type: "success",
          title: "Đã lưu thành công! 🎉",
          message:
            "Tên thương hiệu Logo, tiêu đề trang chủ và ảnh nền đã được áp dụng toàn hệ thống!",
        });
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Lỗi lưu cấu hình",
        message: err.message || "Không thể cập nhật cấu hình",
      });
    } finally {
      setIsSavingHeroSettings(false);
    }
  };

  // Upload ảnh nền từ máy tính
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: "error",
        title: "File quá lớn",
        message: "Dung lượng ảnh không được vượt quá 5MB",
      });
      return;
    }

    try {
      setIsUploadingHeroBg(true);
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("access_token");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
      const res = await fetch(`${apiUrl}/admin/upload/hero-bg`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        const uploadedUrl = data.data.url;
        setHeroBgUrl(uploadedUrl);
        setUrlInput(uploadedUrl);
        setIsHeroBgEnabled(true);

        // Tự động lưu trực tiếp cấu hình ảnh mới lên Database để Trang chủ hiển thị ngay lập tức
        const payload = {
          backgroundUrl: uploadedUrl,
          overlayOpacity: Number(overlayOpacity),
          blurAmount: Number(blurAmount),
          isEnabled: true,
          brandName: brandName.trim() || "TopEnglish",
          brandSubtitle: brandSubtitle.trim() || "by HoangBao",
          heroTitle: heroTitle.trim() || "Chinh phục tiếng Anh với",
          heroHighlight: heroHighlight.trim() || "TopEnglish",
          heroSubtitle: heroSubtitle.trim(),
          heroBadge: heroBadge.trim(),
        };

        try {
          await fetchApi("/admin/settings/homepage", {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
          updateBrandState(payload);
          await refreshBrandSettings();
        } catch (saveErr) {
          console.warn("Lưu cấu hình nền ngầm gặp lỗi:", saveErr);
        }

        showToast({
          type: "success",
          title: "Đã tải ảnh & áp dụng thành công! 🎉",
          message:
            "Ảnh nền mới đã được lưu và cập nhật trực tiếp cho Trang chủ TopEnglish.",
        });
      } else {
        throw new Error(data.message || "Lỗi khi tải ảnh");
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Tải ảnh thất bại",
        message: err.message || "Không thể tải ảnh lên máy chủ",
      });
    } finally {
      setIsUploadingHeroBg(false);
    }
  };

  // Load ban đầu khi vào trang
  useEffect(() => {
    if (user?.role === "admin") {
      loadStats();
      loadHeroSettings();
    }
  }, [user, loadStats, loadHeroSettings]);

  useEffect(() => {
    if (activeTab === "users" && user?.role === "admin") {
      loadUsers(1);
    } else if (activeTab === "content" && user?.role === "admin") {
      loadContentSummary();
    } else if (activeTab === "homepage" && user?.role === "admin") {
      loadHeroSettings();
    }
  }, [activeTab, user, loadUsers, loadContentSummary, loadHeroSettings]);

  // Xử lý Cập nhật vai trò (Role)
  const handleUpdateRoleSubmit = async () => {
    if (!selectedUserForRole) return;
    try {
      setIsUpdatingRole(true);
      const res = await fetchApi(`/admin/users/${selectedUserForRole._id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRoleChoice }),
      });
      if (res.success) {
        showToast({
          type: "success",
          title: "Cập nhật thành công",
          message: `Đã đổi vai trò của ${selectedUserForRole.fullName} thành ${newRoleChoice}`,
        });
        setSelectedUserForRole(null);
        loadUsers(usersPagination.page);
        loadStats();
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Lỗi cập nhật vai trò",
        message: err.message,
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Xử lý Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (targetUser: UserItem) => {
    const nextStatus = !targetUser.isActive;
    try {
      const res = await fetchApi(`/admin/users/${targetUser._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.success) {
        showToast({
          type: "success",
          title: nextStatus ? "Mở khóa thành công" : "Đã khóa tài khoản",
          message: `Tài khoản ${targetUser.email} hiện đã ${nextStatus ? "hoạt động trở lại" : "bị tạm khóa"}.`,
        });
        loadUsers(usersPagination.page);
        loadStats();
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Lỗi thay đổi trạng thái",
        message: err.message,
      });
    }
  };

  // Helper format uptime
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ""}${h}h ${m}m`;
  };

  // KIỂM TRA PHÂN QUYỀN TRUY CẬP (ACCESS CONTROL)
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="size-20 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-600/10 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="size-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
            Quyền Truy Cập Bị Giới Hạn
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 text-sm sm:text-base leading-relaxed">
            Khu vực Bảng Quản Trị Hệ Thống chỉ dành riêng cho Quản trị viên (Admin). Vui lòng đăng nhập bằng tài khoản Quản trị để tiếp tục.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-6 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
            >
              Đăng nhập tài khoản Admin
            </Link>
            <Link
              href="/"
              className="px-6 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-sm transition"
            >
              Trở về Trang chủ
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* HERO BANNER - THEME NGỌC BÍCH JADE EMERALD */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 shadow-xl shadow-teal-900/10 border border-teal-500/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 text-emerald-100 w-fit">
                <Shield className="size-3.5" />
                Hệ Thống Quản Trị Trung Tâm • TopEnglish Admin
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                Bảng Quản Trị Hệ Thống & Thống Kê
              </h1>
              <p className="text-sm sm:text-base text-emerald-50 font-normal">
                Giám sát tình trạng vận hành, phân tích số liệu học tập, quản lý tài khoản người dùng và kiểm soát học liệu toàn hệ thống.
              </p>
            </div>

            {/* Server Health Status Pill */}
            {stats && (
              <div className="flex flex-col gap-2 shrink-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-xs text-emerald-50">
                <div className="flex items-center justify-between gap-4 font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Server className="size-4 text-emerald-300" /> Máy chủ NestJS
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/40 text-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-300 animate-ping" />
                    Online
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1 border-t border-white/10">
                  <span>Node: <strong>{stats.system.nodeVersion}</strong></span>
                  <span>RAM: <strong>{stats.system.memoryUsageMB} MB</strong></span>
                  <span>Uptime: <strong>{formatUptime(stats.system.uptimeSeconds)}</strong></span>
                  <span>Database: <strong className="text-emerald-200">MongoDB OK</strong></span>
                </div>
              </div>
            )}
          </div>
          <div className="absolute -right-12 -bottom-16 size-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        </section>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap sm:flex-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-1.5 gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Activity className="size-4 shrink-0" />
            <span className="truncate">1. Thống Kê Tổng Quan</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === "users"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Users className="size-4 shrink-0" />
            <span className="truncate">2. Quản Lý Người Dùng ({stats?.users.total || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === "content"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Layers className="size-4 shrink-0" />
            <span className="truncate">3. Giám Sát Học Liệu</span>
          </button>
          <button
            onClick={() => setActiveTab("homepage")}
            className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === "homepage"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Palette className="size-4 shrink-0" />
            <span className="truncate">4. Giao Diện & Ảnh Nền</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: TỔNG QUAN & THỐNG KÊ (ANALYTICS)
        ========================================================================= */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {loadingStats ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="size-8 animate-spin text-emerald-600" />
                <p className="text-sm">Đang tổng hợp số liệu hệ thống...</p>
              </div>
            ) : stats ? (
              <>
                {/* 4 KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Users */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Tổng Người Dùng
                      </span>
                      <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                        <Users className="size-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats.users.total}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>🎓 {stats.users.students} Học viên</span>
                      <span>•</span>
                      <span>👨‍🏫 {stats.users.teachers} Giáo viên</span>
                    </div>
                  </div>

                  {/* Card 2: Content */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Kho Học Liệu
                      </span>
                      <div className="size-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                        <BookOpen className="size-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats.content.totalVocabularies + stats.content.totalGrammars}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>📖 {stats.content.totalVocabularies} Từ vựng</span>
                      <span>•</span>
                      <span>📝 {stats.content.totalGrammars} Ngữ pháp</span>
                    </div>
                  </div>

                  {/* Card 3: Quizzes & Classrooms */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Đề Thi & Lớp Học
                      </span>
                      <div className="size-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                        <GraduationCap className="size-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats.content.totalQuizzes + stats.content.totalClassrooms}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>🎯 {stats.content.totalQuizzes} Bộ đề</span>
                      <span>•</span>
                      <span>🏫 {stats.content.totalClassrooms} Lớp học</span>
                    </div>
                  </div>

                  {/* Card 4: Total XP */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Tổng XP Tích Lũy
                      </span>
                      <div className="size-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                        <Zap className="size-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats.engagement.totalXP.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-amber-600 font-bold flex items-center">
                        🔥 Chuỗi Streak TB: {stats.engagement.avgStreak} ngày
                      </span>
                    </div>
                  </div>
                </div>

                {/* VISUAL CHARTS & BREAKDOWN */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column (2/3): Role distribution & Content breakdown */}
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="size-5 text-emerald-600" />
                        Cơ Cấu Người Dùng & Phân Bổ Vai Trò
                      </h3>
                      <span className="text-xs text-slate-400">
                        Hoạt động: {stats.users.active} / {stats.users.total}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Students Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-blue-600 flex items-center gap-1">
                            🎓 Học viên (Students)
                          </span>
                          <span>
                            {stats.users.students} người (
                            {Math.round((stats.users.students / stats.users.total) * 100 || 0)}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${(stats.users.students / stats.users.total) * 100}%`,
                            }}
                            className="h-full bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Teachers Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-emerald-600 flex items-center gap-1">
                            👨‍🏫 Giáo viên (Teachers)
                          </span>
                          <span>
                            {stats.users.teachers} người (
                            {Math.round((stats.users.teachers / stats.users.total) * 100 || 0)}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${(stats.users.teachers / stats.users.total) * 100}%`,
                            }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Admins Progress */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-purple-600 flex items-center gap-1">
                            🛡️ Quản trị viên (Admins)
                          </span>
                          <span>
                            {stats.users.admins} người (
                            {Math.round((stats.users.admins / stats.users.total) * 100 || 0)}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${(stats.users.admins / stats.users.total) * 100}%`,
                            }}
                            className="h-full bg-purple-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content Metrics Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                        <div className="text-xs text-slate-400 font-medium">Chủ Đề Từ Vựng</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {stats.content.totalTopics} topics
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                        <div className="text-xs text-slate-400 font-medium">Ngân Hàng Câu Hỏi</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {stats.content.totalQuestions} câu
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                        <div className="text-xs text-slate-400 font-medium">Lớp Học Hoạt Động</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {stats.content.totalClassrooms} lớp
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (1/3): Recent New Users */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserPlus className="size-5 text-emerald-600" />
                        Người Dùng Mới Nhất
                      </h3>
                      <button
                        onClick={() => setActiveTab("users")}
                        className="text-xs font-bold text-emerald-600 hover:underline"
                      >
                        Xem tất cả
                      </button>
                    </div>

                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                      {stats.engagement.recentUsers.map((u) => (
                        <div key={u._id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <UserAvatar
                              avatar={u.avatar}
                              fullName={u.fullName}
                              role={u.role}
                              size="sm"
                              showRoleBadge
                            />
                            <div className="overflow-hidden">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {u.fullName}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {u.email}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                                : u.role === "teacher"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* =========================================================================
            TAB 2: QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT)
        ========================================================================= */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-6">
            {/* SEARCH & FILTERS BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo họ tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadUsers(1)}
                  className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                  }}
                  className="h-11 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="student">🎓 Học viên</option>
                  <option value="teacher">👨‍🏫 Giáo viên</option>
                  <option value="admin">🛡️ Quản trị viên</option>
                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                  }}
                  className="h-11 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="active">🟢 Đang hoạt động</option>
                  <option value="inactive">🔴 Đã bị khóa</option>
                </select>

                <button
                  onClick={() => loadUsers(1)}
                  className="h-11 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FilterIcon className="size-3.5" />
                  Lọc
                </button>
              </div>
            </div>

            {/* USERS DATA TABLE */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Người Dùng</th>
                    <th className="py-3 px-4">Vai Trò (Role)</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Streak & XP</th>
                    <th className="py-3 px-4">Ngày Tham Gia</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Đang tải danh sách người dùng...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Không tìm thấy người dùng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => {
                      const isMe = u._id === user?._id;
                      return (
                        <tr
                          key={u._id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                        >
                          {/* User info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group shrink-0">
                                <UserAvatar
                                  avatar={u.avatar}
                                  fullName={u.fullName}
                                  role={u.role}
                                  size="md"
                                  showRoleBadge
                                  editable
                                  onEdit={() => setEditingAvatarUser(u)}
                                  title="Bấm để đổi ảnh đại diện cho người dùng này"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {u.fullName}
                                  {isMe && (
                                    <span className="text-[10px] text-emerald-600 font-black">
                                      (Bạn)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            {u.role === "admin" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <Shield className="size-3" /> Admin
                              </span>
                            ) : u.role === "teacher" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <GraduationCap className="size-3" /> Giáo Viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <UserCheck className="size-3" /> Học Viên
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 className="size-3" /> Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                <XCircle className="size-3" /> Đã khóa
                              </span>
                            )}
                          </td>

                          {/* Streak & XP */}
                          <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                <Flame className="size-3.5" /> {u.streak}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-600 font-bold">
                                {u.totalXP} XP
                              </span>
                            </div>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Change Role Button */}
                              <button
                                onClick={() => {
                                  setSelectedUserForRole(u);
                                  setNewRoleChoice(u.role);
                                }}
                                disabled={isMe}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                                title="Đổi vai trò"
                              >
                                Đổi vai trò
                              </button>

                              {/* Update Avatar Button */}
                              <button
                                onClick={() => setEditingAvatarUser(u)}
                                className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                                title="Đổi ảnh đại diện"
                              >
                                <Camera className="size-3.5" />
                              </button>

                              {/* Toggle Status Button */}
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={isMe}
                                className={`size-8 rounded-xl flex items-center justify-center transition disabled:opacity-40 cursor-pointer ${
                                  u.isActive
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50"
                                }`}
                                title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              >
                                {u.isActive ? (
                                  <Lock className="size-3.5" />
                                ) : (
                                  <Unlock className="size-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {usersPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Hiển thị trang {usersPagination.page} / {usersPagination.totalPages} (Tổng cộng{" "}
                  {usersPagination.total} người dùng)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadUsers(usersPagination.page - 1)}
                    disabled={usersPagination.page <= 1 || loadingUsers}
                    className="size-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 disabled:opacity-30 transition cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="px-3 py-1 font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {usersPagination.page}
                  </span>
                  <button
                    onClick={() => loadUsers(usersPagination.page + 1)}
                    disabled={
                      usersPagination.page >= usersPagination.totalPages || loadingUsers
                    }
                    className="size-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 disabled:opacity-30 transition cursor-pointer"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: GIÁM SÁT HỌC LIỆU & LỚP HỌC (CONTENT OVERSIGHT)
        ========================================================================= */}
        {activeTab === "content" && (
          <div className="flex flex-col gap-6">
            {loadingContent ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="size-8 animate-spin text-emerald-600" />
                <p className="text-sm">Đang tải dữ liệu học liệu toàn hệ thống...</p>
              </div>
            ) : contentSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Topics Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="size-4 text-emerald-600" />
                      Chủ Đề Từ Vựng ({contentSummary.topics.length})
                    </h3>
                    <Link href="/topics" className="text-xs text-emerald-600 font-bold hover:underline">
                      Xem thư viện
                    </Link>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                    {contentSummary.topics.map((t) => (
                      <div key={t._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{t.title}</div>
                          <div className="text-[11px] text-slate-400">
                            Cấp độ: {t.level} • {t.totalWords} từ vựng
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Đã xuất bản
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Grammar Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="size-4 text-blue-600" />
                      Bài Giảng Ngữ Pháp ({contentSummary.grammars.length})
                    </h3>
                    <Link href="/grammar" className="text-xs text-blue-600 font-bold hover:underline">
                      Xem bài học
                    </Link>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                    {contentSummary.grammars.map((g) => (
                      <div key={g._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{g.title}</div>
                          <div className="text-[11px] text-slate-400">
                            Cấp độ: {g.level} • Thứ tự: #{g.order}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          Công khai
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Quizzes Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="size-4 text-purple-600" />
                      Bộ Đề Thi Quiz ({contentSummary.quizzes.length})
                    </h3>
                    <Link href="/quizzes" className="text-xs text-purple-600 font-bold hover:underline">
                      Luyện thi
                    </Link>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                    {contentSummary.quizzes.map((q) => (
                      <div key={q._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{q.title}</div>
                          <div className="text-[11px] text-slate-400">
                            Thời gian: {q.timeLimit}s • Thưởng: +{q.totalXP} XP
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                          Sẵn sàng
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Classrooms Summary */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="size-4 text-amber-600" />
                      Lớp Học Trực Tuyến ({contentSummary.classrooms.length})
                    </h3>
                    <Link href="/classrooms" className="text-xs text-amber-600 font-bold hover:underline">
                      Xem lớp
                    </Link>
                  </div>
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                    {contentSummary.classrooms.map((c) => (
                      <div key={c._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Mã: <strong className="font-mono text-emerald-600">{c.code}</strong> •{" "}
                            {c.teacher?.fullName || "Giáo viên"}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          {c.students?.length || 0} học viên
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* =========================================================================
            TAB 4: GIAO DIỆN & ẢNH NỀN HERO TRANG CHỦ
        ========================================================================= */}
        {activeTab === "homepage" && (
          <div className="flex flex-col gap-8">
            {/* Header Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <Palette className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Tùy Biến Giao Diện & Ảnh Nền Trang Chủ
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tải lên ảnh nền tùy chỉnh chất lượng cao hoặc chọn từ thư viện mẫu cho Hero Banner trang chủ.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    isHeroBgEnabled && heroBgUrl
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isHeroBgEnabled && heroBgUrl
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-slate-400"
                    }`}
                  />
                  {isHeroBgEnabled && heroBgUrl
                    ? "Ảnh nền đang hoạt động"
                    : "Ảnh nền đang tắt (Nền mặc định)"}
                </span>
              </div>
            </div>

            {/* Main Content Grid: Settings & Live Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Controls & Presets (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* 1. Tên Thương Hiệu Logo & Tiêu Đề Hero */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Type className="size-4.5 text-emerald-600" />
                      1. Tùy Chỉnh Thương Hiệu Logo & Tiêu Đề Trang Chủ
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Cập nhật Realtime toàn hệ thống
                    </span>
                  </div>

                  {/* Row 1: Logo Brand Name & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Tên Thương Hiệu Logo</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="TopEnglish"
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        Hiển thị cạnh Logo quả địa cầu trên thanh Sidebar & Breadcrumbs
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Phụ Đề Dưới Logo
                      </label>
                      <input
                        type="text"
                        value={brandSubtitle}
                        onChange={(e) => setBrandSubtitle(e.target.value)}
                        placeholder="by HoangBao"
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        Dòng chữ nhỏ dưới logo (vd: by HoangBao, Edu Platform...)
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Hero Main Title & Highlight Keyword */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Tiêu Đề Mở Đầu Hero
                      </label>
                      <input
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        placeholder="Chinh phục tiếng Anh với"
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        Phần chữ đầu tiên của câu tiêu đề lớn trang chủ
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Từ Khóa Nổi Bật Dải Màu
                      </label>
                      <input
                        type="text"
                        value={heroHighlight}
                        onChange={(e) => setHeroHighlight(e.target.value)}
                        placeholder="TopEnglish"
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        Từ khóa được highlight bằng dải gradient ngọc bích Jade
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Hero Badge */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Huy Hiệu Đầu Banner (Badge)
                    </label>
                    <input
                      type="text"
                      value={heroBadge}
                      onChange={(e) => setHeroBadge(e.target.value)}
                      placeholder="Nền tảng học tiếng Anh thông minh thế hệ mới"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Row 4: Hero Subtitle / Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Đoạn Mô Tả Giới Thiệu Hero
                    </label>
                    <textarea
                      rows={2}
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      placeholder="Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng..."
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs leading-relaxed text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>

                {/* 2. Upload from Computer */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <UploadCloud className="size-4.5 text-emerald-600" />
                      2. Tải Lên Ảnh Nền Từ Máy Tính
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      PNG, JPG, WEBP • Tối đa 5MB
                    </span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />

                  {/* Drag & Drop Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition group ${
                      isUploadingHeroBg
                        ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                        : "border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10"
                    }`}
                  >
                    <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/60 text-slate-500 group-hover:text-emerald-600 flex items-center justify-center transition shadow-xs">
                      {isUploadingHeroBg ? (
                        <RefreshCw className="size-7 animate-spin text-emerald-600" />
                      ) : (
                        <UploadCloud className="size-7" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {isUploadingHeroBg
                          ? "Đang tải ảnh lên máy chủ..."
                          : "Kéo thả ảnh vào đây hoặc bấm để chọn từ máy tính"}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Ảnh sẽ được lưu an toàn trên máy chủ và phục vụ tự động
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isUploadingHeroBg}
                      className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="size-3.5" />
                      <span>Chọn file từ thiết bị</span>
                    </button>
                  </div>

                  {/* Ảnh đang được kích hoạt hiện tại */}
                  {heroBgUrl && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="size-14 rounded-xl overflow-hidden shrink-0 border border-emerald-300 dark:border-emerald-700 bg-slate-100 shadow-xs">
                        <img
                          src={getFullImageUrl(heroBgUrl)}
                          alt="Ảnh nền đang dùng"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          <CheckCircle2 className="size-3" /> Đang dùng làm ảnh nền
                        </span>
                        <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate mt-1">
                          {heroBgUrl}
                        </div>
                      </div>
                      <a
                        href={getFullImageUrl(heroBgUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-700 transition shrink-0"
                      >
                        Xem ảnh gốc
                      </a>
                    </div>
                  )}
                </div>

                {/* 3. Direct URL Input */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="size-4.5 text-teal-600" />
                    3. Hoặc Dán Đường Dẫn URL Ảnh Trực Tiếp
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!urlInput.trim()) return;
                        setHeroBgUrl(urlInput.trim());
                        setIsHeroBgEnabled(true);
                        showToast({
                          type: "success",
                          title: "Đã cập nhật URL",
                          message: "Xem trước bên phải và bấm 'Lưu Cấu Hình' để áp dụng.",
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      Áp Dụng URL
                    </button>
                  </div>
                </div>

                {/* 4. Preset Gallery */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="size-4.5 text-amber-500" />
                      4. Bộ Sưu Tập Ảnh Mẫu Chuẩn Học Thuật (1-Click Chọn)
                    </h3>
                    <span className="text-[11px] text-slate-400">Độ phân giải cao</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {heroPresets.map((preset) => {
                      const isSelected = heroBgUrl === preset.url;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setHeroBgUrl(preset.url);
                            setUrlInput(preset.url);
                            setIsHeroBgEnabled(true);
                          }}
                          className={`group relative overflow-hidden rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <div className="h-28 w-full overflow-hidden relative">
                            <img
                              src={preset.url}
                              alt={preset.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/90 text-slate-900 backdrop-blur-xs">
                              {preset.category}
                            </span>
                            {isSelected && (
                              <span className="absolute top-2 right-2 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                <Check className="size-3 stroke-[3]" />
                              </span>
                            )}
                            <div className="absolute bottom-2 left-2.5 right-2.5">
                              <span className="text-xs font-bold text-white block truncate leading-tight drop-shadow-sm">
                                {preset.title}
                              </span>
                              <span className="text-[10px] text-slate-300 block truncate leading-tight">
                                {preset.desc}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Visual Tuning: Opacity & Blur */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="size-4.5 text-emerald-600" />
                    5. Tinh Chỉnh Hiệu Ứng Lớp Phủ & Độ Tương Phản
                  </h3>

                  {/* Toggle Enable */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Kích hoạt hiển thị ảnh nền Hero
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Khi tắt, trang chủ sẽ quay về nền màu tối giản mặc định
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHeroBgEnabled}
                        onChange={(e) => setIsHeroBgEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>

                  {/* Slider: Overlay Opacity */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Độ mờ lớp phủ văn bản (Overlay Opacity)
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {Math.round(overlayOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.95"
                      step="0.05"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Ảnh rõ hơn (10%)</span>
                      <span className="text-emerald-600 font-bold">Khuyên dùng: 80% - 90% (Dễ đọc nhất)</span>
                      <span>Che mờ nhiều (95%)</span>
                    </div>
                  </div>

                  {/* Slider: Blur Amount */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Độ mờ nghệ thuật của ảnh nền (Blur Effect)
                      </span>
                      <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                        {blurAmount}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="1"
                      value={blurAmount}
                      onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Sắc nét nguyên bản (0px)</span>
                      <span>Mờ nhẹ (2-4px)</span>
                      <span>Mờ sâu trừu tượng (12px)</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={isSavingHeroSettings}
                      onClick={handleSaveHeroSettings}
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingHeroSettings ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          <span>Đang lưu cấu hình...</span>
                        </>
                      ) : (
                        <>
                          <Check className="size-4" />
                          <span>Lưu Cấu Hình Giao Diện</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHeroBgUrl("");
                        setUrlInput("");
                        setOverlayOpacity(0.5);
                        setBlurAmount(0);
                        setIsHeroBgEnabled(false);
                        setBrandName("TopEnglish");
                        setBrandSubtitle("by HoangBao");
                        setHeroTitle("Chinh phục tiếng Anh với");
                        setHeroHighlight("TopEnglish");
                        setHeroBadge("Nền tảng học tiếng Anh thông minh thế hệ mới");
                        setHeroSubtitle(
                          "Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.",
                        );
                      }}
                      className="h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Khôi phục mặc định</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live Interactive Simulator (5 cols) */}
              <div className="lg:col-span-5 sticky top-20 flex flex-col gap-4">
                <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-4">
                  {/* Simulator Control Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Eye className="size-4 text-emerald-600" />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Bản Xem Trước Trực Quan
                      </span>
                    </div>

                    {/* Light / Dark Mode Toggle inside preview */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPreviewTheme("light")}
                        className={`size-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          previewTheme === "light"
                            ? "bg-white text-amber-500 shadow-xs font-bold"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                        title="Xem chế độ Sáng (Light Mode)"
                      >
                        <Sun className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTheme("dark")}
                        className={`size-7 rounded-lg flex items-center justify-center transition cursor-pointer ${
                          previewTheme === "dark"
                            ? "bg-slate-900 text-amber-300 shadow-xs font-bold"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Xem chế độ Tối (Dark Mode)"
                      >
                        <Moon className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Simulator Canvas Frame */}
                  <div
                    className={`relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 transition-colors ${
                      previewTheme === "dark"
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-900"
                    }`}
                  >
                    {/* Simulated Background Image */}
                    {isHeroBgEnabled && heroBgUrl ? (
                      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                        <img
                          src={getFullImageUrl(heroBgUrl)}
                          alt="Hero Background Preview"
                          className="w-full h-full object-cover transition-all duration-300"
                          style={{
                            filter: blurAmount ? `blur(${blurAmount}px)` : undefined,
                            transform: blurAmount ? "scale(1.08)" : undefined,
                          }}
                        />
                        {/* Adaptive Gradient Overlay */}
                        <div
                          className={`absolute inset-0 transition-opacity ${
                            previewTheme === "dark"
                              ? "bg-gradient-to-b from-slate-950/80 via-slate-950/65 to-slate-950/95"
                              : "bg-gradient-to-b from-white/75 via-white/55 to-white/95"
                          }`}
                          style={{
                            opacity: overlayOpacity,
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`absolute inset-0 -z-0 ${
                          previewTheme === "dark"
                            ? "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(15,23,42,0))]"
                            : "bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))]"
                        }`}
                      />
                    )}

                    {/* Simulated Mini Logo Bar */}
                    <div className="relative z-10 px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                          {brandName.slice(0, 2).toUpperCase() || "TE"}
                        </div>
                        <div className="text-left">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white block leading-tight">
                            {brandName || "TopEnglish"}
                          </span>
                          <span className="text-[9px] text-slate-500 block leading-tight font-medium">
                            {brandSubtitle || "by HoangBao"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Live Preview
                      </span>
                    </div>

                    {/* Simulated Hero Content */}
                    <div className="relative z-10 p-6 flex flex-col items-center text-center gap-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/90 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs">
                        <Sparkles className="size-3" />
                        {heroBadge || "Nền tảng học tiếng Anh thông minh"}
                      </span>

                      <h4 className="text-lg font-black tracking-tight leading-tight">
                        {heroTitle || "Chinh phục tiếng Anh với"}{" "}
                        <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                          {heroHighlight || brandName || "TopEnglish"}
                        </span>
                      </h4>

                      <p
                        className={`text-[11px] leading-relaxed max-w-xs ${
                          previewTheme === "dark" ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {heroSubtitle ||
                          "Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (SRS)..."}
                      </p>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-semibold bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                        <Flame className="size-3 fill-amber-500 text-amber-500" />
                        <span>Chuỗi học: 6 ngày • 890 XP</span>
                      </div>

                      {/* Mock Buttons */}
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] shadow-xs">
                          Học Flashcard
                        </div>
                        <div
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold ${
                            previewTheme === "dark"
                              ? "bg-slate-900/90 border-slate-700 text-slate-200"
                              : "bg-white/90 border-slate-300 text-slate-800"
                          }`}
                        >
                          Phòng ôn SRS
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulator Footer note */}
                  <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>Xem trực tiếp trước khi áp dụng ra toàn bộ người dùng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ĐỔI VAI TRÒ NGƯỜI DÙNG */}
        {selectedUserForRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="size-5 text-emerald-600" />
                  Cập Nhật Vai Trò Người Dùng
                </h3>
                <button
                  onClick={() => setSelectedUserForRole(null)}
                  className="size-8 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <div className="text-sm">
                Bạn đang phân quyền cho tài khoản:
                <div className="font-bold text-slate-900 dark:text-white mt-1">
                  {selectedUserForRole.fullName} ({selectedUserForRole.email})
                </div>
              </div>

              {/* Role selection radio cards */}
              <div className="flex flex-col gap-2.5">
                {[
                  {
                    role: "student",
                    label: "Học Viên (Student)",
                    desc: "Học từ vựng, ngữ pháp, làm bài tập và tham gia lớp học",
                    color: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30",
                  },
                  {
                    role: "teacher",
                    label: "Giáo Viên (Teacher)",
                    desc: "Tạo lớp học, biên soạn từ vựng, bài giảng và giao bài tập",
                    color: "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
                  },
                  {
                    role: "admin",
                    label: "Quản Trị Viên (Admin)",
                    desc: "Toàn quyền quản trị hệ thống, phân quyền và giám sát học liệu",
                    color: "border-purple-500 bg-purple-50/50 dark:bg-purple-950/30",
                  },
                ].map((item) => (
                  <label
                    key={item.role}
                    className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                      newRoleChoice === item.role
                        ? item.color
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleSelection"
                      value={item.role}
                      checked={newRoleChoice === item.role}
                      onChange={() => setNewRoleChoice(item.role as any)}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRole(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isUpdatingRole}
                  onClick={handleUpdateRoleSubmit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingRole ? "Đang lưu..." : "Xác nhận đổi vai trò"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cập Nhật Avatar Người Dùng (Admin) */}
        <AvatarUploadModal
          isOpen={!!editingAvatarUser}
          onClose={() => setEditingAvatarUser(null)}
          targetUser={editingAvatarUser}
          onAvatarUpdated={() => {
            loadUsers(usersPagination.page);
            loadStats();
          }}
        />
      </div>
    </AppLayout>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
