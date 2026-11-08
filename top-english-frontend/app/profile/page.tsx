/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang Hồ sơ cá nhân, Tủ kính Huy hiệu Thành tựu & Cài đặt bảo mật (Profile & Achievements)
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  GraduationCap,
  HelpCircle,
  Layers,
  Lock,
  Medal,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";
import AppLayout from "../../components/AppLayout";
import UserAvatar from "../../components/UserAvatar";
import AvatarUploadModal from "../../components/AvatarUploadModal";

interface BadgeItem {
  id: string;
  title: string;
  category: "streak" | "vocabulary" | "quiz" | "classroom" | "xp";
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt: string | null;
  xpBonus: number;
}

interface AchievementsResponse {
  userStats: {
    streak: number;
    totalXP: number;
    tier: string;
    tierName: string;
    vocabStudied: number;
    vocabMastered: number;
    quizzesCompleted: number;
    homeworkSubmitted: number;
  };
  badges: BadgeItem[];
  unlockedCount: number;
  totalBadges: number;
  completionPercentage: number;
}

export default function ProfilePage() {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [badgeFilter, setBadgeFilter] = useState<string>("all");
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi<AchievementsResponse>("/achievements");
      if (res.success && res.data) {
        setAchievements(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thành tựu:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAchievements();
    }
  }, [isAuthenticated, loadAchievements]);

  const getTierGradient = (tier?: string) => {
    switch (tier) {
      case "master":
        return "from-red-600 via-rose-600 to-pink-600 text-white";
      case "diamond":
        return "from-cyan-600 via-teal-600 to-blue-600 text-white";
      case "platinum":
        return "from-teal-600 via-emerald-600 to-cyan-700 text-white";
      case "gold":
        return "from-amber-500 via-orange-500 to-yellow-600 text-white";
      case "silver":
        return "from-slate-400 via-slate-500 to-slate-600 text-white";
      default:
        return "from-emerald-600 via-teal-600 to-cyan-700 text-white";
    }
  };

  const filteredBadges = (achievements?.badges || []).filter((b) => {
    if (badgeFilter === "all") return true;
    if (badgeFilter === "unlocked") return b.unlocked;
    if (badgeFilter === "locked") return !b.unlocked;
    return b.category === badgeFilter;
  });

  const renderBadgeIcon = (icon: string) => {
    switch (icon) {
      case "Flame":
        return <Flame className="size-6 text-amber-500 fill-amber-500" />;
      case "BookOpen":
        return <BookOpen className="size-6 text-emerald-500" />;
      case "Star":
        return <Star className="size-6 text-yellow-500 fill-yellow-500" />;
      case "HelpCircle":
        return <HelpCircle className="size-6 text-blue-500" />;
      case "Target":
        return <Target className="size-6 text-rose-500" />;
      case "Award":
        return <Award className="size-6 text-purple-500" />;
      case "GraduationCap":
        return <GraduationCap className="size-6 text-indigo-500" />;
      case "Sparkles":
        return <Sparkles className="size-6 text-cyan-500" />;
      case "Trophy":
      default:
        return <Trophy className="size-6 text-amber-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* USER HERO BANNER */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${getTierGradient(
          achievements?.userStats.tier,
        )} p-5 sm:p-6 shadow-lg shadow-emerald-900/10`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <UserAvatar
                avatar={user?.avatar}
                fullName={user?.fullName}
                role={user?.role}
                size="xl"
                editable
                onEdit={() => setShowAvatarModal(true)}
                className="shadow-xl ring-2 ring-white/50"
                title="Bấm để cập nhật ảnh đại diện"
              />
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1 -right-1 size-6 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-md flex items-center justify-center hover:scale-110 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="size-3 text-emerald-600" />
              </button>
            </div>

            <div className="flex flex-col gap-0.5 text-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.2 rounded-full bg-white/20 backdrop-blur text-[10px] font-bold uppercase tracking-wider border border-white/20">
                  {user?.role === "teacher"
                    ? "Giáo viên"
                    : user?.role === "admin"
                    ? "Quản trị viên"
                    : "Học viên"}
                </span>
                <span className="px-2 py-0.2 rounded-full bg-black/20 backdrop-blur text-[10px] font-bold border border-white/10 flex items-center gap-1">
                  <Shield className="size-2.5" />
                  <span>{achievements?.userStats.tierName || "Hạng Đồng"}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {user?.fullName || "Người Học TopEnglish"}
              </h1>
              <p className="text-white/80 text-xs font-medium">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Quick Trophy & Streak Badges */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/20 self-start md:self-auto">
            <div className="flex flex-col items-center px-2.5 border-r border-white/15">
              <span className="flex items-center gap-1 text-amber-300 font-extrabold text-base">
                <Flame className="size-3.5 fill-amber-400" />
                <span>{achievements?.userStats.streak || user?.streak || 0}</span>
              </span>
              <span className="text-[9px] text-white/70 font-semibold uppercase">
                Chuỗi Streak
              </span>
            </div>

            <div className="flex flex-col items-center px-2.5">
              <span className="flex items-center gap-1 text-white font-extrabold text-base">
                <Trophy className="size-3.5 text-amber-300" />
                <span>{achievements?.userStats.totalXP || user?.totalXP || 0}</span>
              </span>
              <span className="text-[9px] text-white/70 font-semibold uppercase">
                Điểm XP
              </span>
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-10 -bottom-10 size-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
          <span className="text-xs font-semibold text-slate-500">Huy hiệu đã mở</span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Award className="size-5" />
            <span>
              {achievements?.unlockedCount || 0} / {achievements?.totalBadges || 12}
            </span>
          </span>
        </div>

        <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
          <span className="text-xs font-semibold text-slate-500">Từ vựng đã học</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <BookOpen className="size-5" />
            <span>{achievements?.userStats.vocabStudied || 0}</span>
          </span>
        </div>

        <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
          <span className="text-xs font-semibold text-slate-500">Bài Quiz hoàn thành</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <HelpCircle className="size-5" />
            <span>{achievements?.userStats.quizzesCompleted || 0}</span>
          </span>
        </div>

        <div className="flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm gap-1">
          <span className="text-xs font-semibold text-slate-500">Bài tập lớp đã nộp</span>
          <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <GraduationCap className="size-5" />
            <span>{achievements?.userStats.homeworkSubmitted || 0}</span>
          </span>
        </div>
      </div>

      {/* SECTION HEADER & QUICK LINK TO SETTINGS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Award className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Tủ Kính Huy Hiệu & Vinh Danh
            </h2>
            <p className="text-xs text-slate-500">
              Mở khóa huy hiệu qua chuỗi ngày học, bài tập và điểm số
            </p>
          </div>
        </div>

        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Settings className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Cài Đặt Hồ Sơ & Bảo Mật</span>
        </Link>
      </div>

      {/* TỦ KÍNH THÀNH TỰU & HUY HIỆU */}
      <div className="flex flex-col gap-6">
          {/* PROGRESS BAR */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Tiến độ mở khóa toàn bộ huy hiệu
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {achievements?.unlockedCount || 0} / {achievements?.totalBadges || 12} (
                {achievements?.completionPercentage || 0}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${achievements?.completionPercentage || 0}%` }}
              />
            </div>
          </div>

          {/* BADGES FILTER CHIPS */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "unlocked", label: "Đã đạt được" },
              { id: "locked", label: "Đang chinh phục" },
              { id: "streak", label: "Chuỗi ngày" },
              { id: "vocabulary", label: "Từ vựng" },
              { id: "quiz", label: "Trắc nghiệm" },
              { id: "classroom", label: "Lớp học" },
              { id: "xp", label: "Kinh nghiệm" },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setBadgeFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[32px] ${
                  badgeFilter === chip.id
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* BADGES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => {
              const pct = Math.round((badge.progress / badge.maxProgress) * 100);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col justify-between p-5 rounded-2xl border transition relative overflow-hidden ${
                    badge.unlocked
                      ? "bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-500/60 shadow-md"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80"
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`size-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                          badge.unlocked
                            ? "bg-gradient-to-tr from-amber-100 to-yellow-50 dark:from-amber-950/60 dark:to-yellow-900/40 border border-amber-300"
                            : "bg-slate-200 dark:bg-slate-800 grayscale"
                        }`}
                      >
                        {renderBadgeIcon(badge.icon)}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {badge.unlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            <Check className="size-3" /> Đã đạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Lock className="size-3" /> Đang khóa
                          </span>
                        )}

                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          +{badge.xpBonus} XP
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h3
                        className={`text-base font-bold line-clamp-1 ${
                          badge.unlocked
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {badge.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Tiến độ:</span>
                      <strong>
                        {badge.progress} / {badge.maxProgress} ({pct}%)
                      </strong>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          badge.unlocked
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-amber-500 to-yellow-400"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </AppLayout>
  );
}
