/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Modal vinh danh Chuỗi ngày học liên tục (Streak Celebration Modal) theo chuẩn phong cách Duolingo
 */

"use client";

import React, { useEffect, useState } from "react";
import { Check, Flame, Sparkles, Trophy, X } from "lucide-react";

export interface WeeklyActivityDay {
  dayLabel: string;
  date: string;
  isToday: boolean;
  isActive: boolean;
  isFuture: boolean;
}

interface StreakModalProps {
  isOpen: boolean;
  streak: number;
  message?: string;
  weeklyActivity?: WeeklyActivityDay[];
  onClose: () => void;
}

export default function StreakModal({
  isOpen,
  streak,
  message,
  weeklyActivity,
  onClose,
}: StreakModalProps) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Nếu không có weeklyActivity truyền vào, tự động tính tuần hiện tại
  const fallbackWeek: WeeklyActivityDay[] = (() => {
    if (weeklyActivity && weeklyActivity.length === 7) return weeklyActivity;
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);
    const todayStr = vnTime.toISOString().split("T")[0];

    const today = new Date(todayStr + "T00:00:00.000Z");
    const dayOfWeek = today.getUTCDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() + distanceToMonday);

    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    return dayNames.map((name, i) => {
      const cur = new Date(monday);
      cur.setUTCDate(monday.getUTCDate() + i);
      const dateStr = cur.toISOString().split("T")[0];
      return {
        dayLabel: name,
        date: dateStr,
        isToday: dateStr === todayStr,
        isActive: dateStr <= todayStr,
        isFuture: dateStr > todayStr,
      };
    });
  })();

  const week = weeklyActivity && weeklyActivity.length === 7 ? weeklyActivity : fallbackWeek;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-250">
        {/* Nút đóng góc phải */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>

        {/* HIỆU ỨNG NGỌN LỬA DUOLINGO BÙNG CHÁY */}
        <div className="relative my-3 flex items-center justify-center">
          {/* Quầng sáng cam vàng tỏa ra */}
          <div className="absolute size-36 rounded-full bg-gradient-to-tr from-amber-500/40 via-orange-500/30 to-rose-500/20 blur-2xl animate-pulse" />

          {/* Vòng tròn nền lửa */}
          <div className="relative size-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-xl shadow-orange-500/30 ring-4 ring-amber-400/30 transform hover:scale-105 transition-transform duration-300">
            <Flame className="size-16 text-white fill-white animate-bounce" />
            <Sparkles className="absolute -top-2 -right-2 size-6 text-yellow-200 animate-spin" />
          </div>
        </div>

        {/* TIÊU ĐỀ & SỐ NGÀY STREAK */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 mb-2">
          <Sparkles className="size-3.5" />
          Chuỗi Ngày Học Rực Cháy
        </span>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            {streak} Ngày Liên Tiếp!
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xs font-medium leading-relaxed">
          {message ||
            "Tuyệt vời! Bạn đã hoàn thành bài học và giữ vững ngọn lửa chăm chỉ ngày hôm nay theo chuẩn Duolingo."}
        </p>

        {/* LỊCH TUẦN 7 NGÀY CHUẨN DUOLINGO (WEEKLY STREAK CALENDAR) */}
        <div className="w-full mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {week.map((day) => {
              const isToday = day.isToday;
              const isActive = day.isActive;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isToday
                        ? "text-orange-600 dark:text-orange-400 font-black"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {day.dayLabel}
                  </span>

                  <div
                    className={`size-8 sm:size-9 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? isToday
                          ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-amber-400"
                          : "bg-emerald-500 text-white shadow-xs"
                        : isToday
                        ? "border-2 border-dashed border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-950/30"
                        : "bg-slate-200/80 dark:bg-slate-700/60 text-slate-400"
                    }`}
                    title={`${day.dayLabel} - ${day.date}${isActive ? " (Đã học)" : ""}`}
                  >
                    {isActive ? (
                      isToday ? (
                        <Flame className="size-4.5 fill-white text-white" />
                      ) : (
                        <Check className="size-4 stroke-[3]" />
                      )
                    ) : (
                      <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NÚT TIẾP TỤC HỌC TẬP */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition cursor-pointer active:scale-98"
        >
          Tiếp tục học tập 🔥
        </button>
      </div>
    </div>
  );
}
