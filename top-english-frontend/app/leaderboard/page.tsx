/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang Đấu trường thi đua và Bảng xếp hạng toàn hệ thống (Global Leaderboard) tuân thủ AppLayout và UI/UX Pro Max
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Crown,
  Flame,
  Medal,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";
import UserAvatar from "../../components/UserAvatar";

interface LeaderboardUser {
  rank: number;
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  streak: number;
  totalXP: number;
  tier: string;
  tierName: string;
}

interface LeaderboardResponse {
  period: string;
  totalLearners: number;
  leaderboard: LeaderboardUser[];
  myRank: LeaderboardUser | null;
}

export default function LeaderboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [period, setPeriod] = useState<"all-time" | "monthly" | "weekly">("all-time");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi<LeaderboardResponse>(
        `/leaderboard?period=${period}`,
      );
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải bảng xếp hạng:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "master":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Sparkles className="size-2.5" /> Cao Thủ
          </span>
        );
      case "diamond":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            <Shield className="size-2.5" /> Kim Cương
          </span>
        );
      case "platinum":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <Award className="size-2.5" /> Bạch Kim
          </span>
        );
      case "gold":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Crown className="size-2.5" /> Vàng
          </span>
        );
      case "silver":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Medal className="size-2.5" /> Bạc
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Shield className="size-2.5" /> Đồng
          </span>
        );
    }
  };

  const top3 = data?.leaderboard.slice(0, 3) || [];
  const restUsers = data?.leaderboard.slice(3) || [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* COMPACT & ELEGANT JADE BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 sm:p-6 text-white shadow-lg shadow-emerald-900/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold w-fit border border-white/20">
                <Trophy className="size-3.5" />
                <span>Đấu Trường Thi Đua Toàn Hệ Thống</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Bảng Vàng Danh Dự TopEnglish
              </h1>
              <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed">
                Tích lũy XP từ bài tập Quiz, thẻ từ vựng Flashcard và lớp học để chinh phục các giải đấu và vinh danh trên bục Quán quân!
              </p>
            </div>

            {/* Total Learners Pill */}
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 self-start md:self-auto shrink-0">
              <div className="size-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Users className="size-4.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-emerald-200 uppercase tracking-wider">
                  Tổng Học Viên
                </span>
                <span className="text-lg font-black text-white">
                  {data?.totalLearners || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -right-8 -bottom-8 size-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* TIME PERIOD TABS & REFRESH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full sm:w-fit">
            <button
              onClick={() => setPeriod("all-time")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                period === "all-time"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Mọi thời đại
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                period === "monthly"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setPeriod("weekly")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                period === "weekly"
                  ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tuần này
            </button>
          </div>

          <button
            onClick={loadLeaderboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer self-end sm:self-auto min-h-[36px]"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* STICKY CARD: MY RANK */}
        {data?.myRank && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/60 shadow-xs gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                #{data.myRank.rank}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {data.myRank.fullName} (Bạn)
                  </span>
                  {getTierBadge(data.myRank.tier)}
                </div>
                <span className="text-[11px] text-slate-500">
                  Vị trí xếp hạng của bạn trên toàn hệ thống
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-bold text-amber-600 border border-slate-200/60 dark:border-slate-700">
                <Flame className="size-3.5 fill-amber-500" />
                <span>{data.myRank.streak} ngày</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
                <Trophy className="size-3.5" />
                <span>{data.myRank.totalXP} XP</span>
              </div>
            </div>
          </div>
        )}

        {/* REFINED PODIUM TOP 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Rank 2 (Silver) */}
            {top3[1] && (
              <div className="order-2 md:order-1 flex flex-col items-center text-center p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative">
                <div className="size-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs flex items-center justify-center absolute -top-3.5 border-2 border-white dark:border-slate-900 shadow-xs z-10">
                  2
                </div>
                <UserAvatar
                  avatar={top3[1].avatar}
                  fullName={top3[1].fullName}
                  size="xl"
                  className="mt-1 shadow-md"
                />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 line-clamp-1">
                  {top3[1].fullName}
                </h3>
                <div className="mt-1">{getTierBadge(top3[1].tier)}</div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <Flame className="size-3 fill-amber-500" /> {top3[1].streak}d
                  </span>
                  <span className="opacity-30">•</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {top3[1].totalXP} XP
                  </span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold Hero) */}
            {top3[0] && (
              <div className="order-1 md:order-2 flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400 dark:border-amber-500/60 shadow-md relative md:-mt-2">
                <div className="size-9 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-xs flex items-center justify-center absolute -top-4.5 border-2 border-white dark:border-slate-900 shadow-md z-10">
                  <Crown className="size-4.5 text-amber-900" />
                </div>
                <UserAvatar
                  avatar={top3[0].avatar}
                  fullName={top3[0].fullName}
                  size="2xl"
                  className="mt-1 shadow-lg ring-2 ring-amber-400"
                />
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
                  <Star className="size-2.5 fill-amber-500 text-amber-500" /> Quán Quân
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-white mt-1 line-clamp-1">
                  {top3[0].fullName}
                </h3>
                <div className="mt-1">{getTierBadge(top3[0].tier)}</div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Flame className="size-3.5 fill-amber-500" /> {top3[0].streak} ngày
                  </span>
                  <span className="opacity-30">•</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {top3[0].totalXP} XP
                  </span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3[2] && (
              <div className="order-3 flex flex-col items-center text-center p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative">
                <div className="size-7 rounded-full bg-orange-200 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-black text-xs flex items-center justify-center absolute -top-3.5 border-2 border-white dark:border-slate-900 shadow-xs z-10">
                  3
                </div>
                <UserAvatar
                  avatar={top3[2].avatar}
                  fullName={top3[2].fullName}
                  size="xl"
                  className="mt-1 shadow-md"
                />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2 line-clamp-1">
                  {top3[2].fullName}
                </h3>
                <div className="mt-1">{getTierBadge(top3[2].tier)}</div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <Flame className="size-3 fill-amber-500" /> {top3[2].streak}d
                  </span>
                  <span className="opacity-30">•</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {top3[2].totalXP} XP
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FULL LEADERBOARD TABLE */}
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Danh Sách Xếp Hạng Chi Tiết
          </h2>

          {loading ? (
            <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 w-14 text-center">Hạng</th>
                    <th className="px-4 py-3">Học viên</th>
                    <th className="px-4 py-3">Giải đấu</th>
                    <th className="px-4 py-3 text-center">Chuỗi Streak</th>
                    <th className="px-4 py-3 text-right">Tổng XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.leaderboard || []).map((u) => {
                    const isMe = user?.email === u.email;
                    return (
                      <tr
                        key={u.userId}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                          isMe
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center size-6 rounded-lg font-black text-[11px] ${
                              u.rank === 1
                                ? "bg-amber-400 text-amber-950"
                                : u.rank === 2
                                ? "bg-slate-300 text-slate-800"
                                : u.rank === 3
                                ? "bg-orange-300 text-orange-900"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {u.rank}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              avatar={u.avatar}
                              fullName={u.fullName}
                              size="sm"
                              className="shrink-0 shadow-xs"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {u.fullName}
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                                    Bạn
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">{getTierBadge(u.tier)}</td>

                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Flame className="size-3 fill-amber-500" />
                            <span>{u.streak} ngày</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <Trophy className="size-3.5" />
                            <span>{u.totalXP.toLocaleString()} XP</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
