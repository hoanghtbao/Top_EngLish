"use client";

import React from "react";
import { CheckCircle2, Layers, Settings, Volume2, X, Zap } from "lucide-react";
import { StudyDirection, StudySessionSettings } from "../lib/study-settings";

export interface StudySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudySessionSettings;
  onChange: (patch: Partial<StudySessionSettings>) => void;
}

const DIRECTION_OPTIONS: Array<{ value: StudyDirection; label: string }> = [
  { value: "mixed", label: "Trộn Đều" },
  { value: "en-vi", label: "Anh → Việt" },
  { value: "vi-en", label: "Việt → Anh" },
];

export function StudySettingsModal({
  isOpen,
  onClose,
  settings,
  onChange,
}: StudySettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-settings-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-7 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="study-settings-title"
                className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
              >
                Cài Đặt Phiên Học
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Tùy chỉnh trải nghiệm học tập của bạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cài đặt phiên học"
            className="w-10 h-10 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Setting Rows */}
        <div className="flex flex-col gap-3 mt-1">
          {/* Row 1: Instant Answer */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hiện đáp án tức thì</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hiện đúng/sai &amp; giải thích ngay khi chọn
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.instantAnswer}
              aria-label="Hiện đáp án tức thì"
              onClick={() => onChange({ instantAnswer: !settings.instantAnswer })}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                settings.instantAnswer
                  ? "bg-emerald-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.instantAnswer ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Row 2: Auto Audio */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Volume2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tự động phát âm</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tự động đọc từ tiếng Anh khi sang câu mới
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoAudio}
              aria-label="Tự động phát âm"
              onClick={() => onChange({ autoAudio: !settings.autoAudio })}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                settings.autoAudio
                  ? "bg-emerald-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.autoAudio ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Row 3: Auto Advance */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Tự động chuyển câu khi đúng</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Đợi 1.2s rồi tự chuyển câu tiếp theo
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoAdvance}
              aria-label="Tự động chuyển câu khi đúng"
              onClick={() => onChange({ autoAdvance: !settings.autoAdvance })}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                settings.autoAdvance
                  ? "bg-emerald-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.autoAdvance ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Row 4: Question Direction */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-pink-500 shrink-0" />
              <span>Chiều câu hỏi:</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {DIRECTION_OPTIONS.map((opt) => {
                const active = settings.direction === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ direction: opt.value })}
                    className={`min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                      active
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25"
                        : "bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Apply CTA */}
        <button
          type="button"
          onClick={onClose}
          className="mt-1 h-12 w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-extrabold shadow-lg shadow-emerald-500/25 transition cursor-pointer"
        >
          Áp Dụng &amp; Tiếp Tục Học
        </button>
      </div>
    </div>
  );
}
