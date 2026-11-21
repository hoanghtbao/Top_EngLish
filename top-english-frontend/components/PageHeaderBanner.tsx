/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Banner tiêu đề trang chuẩn UI/UX Pro Max — cân đối giữa nội dung giới thiệu, chỉ số nhanh và nút hành động
 */

import React from "react";

export interface BannerStatItem {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

interface PageHeaderBannerProps {
  badgeIcon?: React.ReactNode;
  badgeText: string;
  title: string;
  description: string;
  stats?: BannerStatItem[];
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeaderBanner({
  badgeIcon,
  badgeText,
  title,
  description,
  stats = [],
  actions,
  className = "",
}: PageHeaderBannerProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 sm:p-7 text-white shadow-lg shadow-emerald-900/10 ${className}`}
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Badge + Heading + Description */}
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] sm:text-xs font-bold text-white w-fit">
            {badgeIcon}
            <span>{badgeText}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-50/95 leading-relaxed max-w-xl">
            {description}
          </p>
        </div>

        {/* Right: Quick Stats Pills + Primary Actions */}
        {(stats.length > 0 || actions) && (
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0">
            {stats.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {stats.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20"
                  >
                    {item.icon && (
                      <div className="size-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 text-white">
                        {item.icon}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-emerald-100/90 uppercase tracking-wider leading-tight">
                        {item.label}
                      </span>
                      <span className="text-sm sm:text-base font-black text-white leading-tight">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
          </div>
        )}
      </div>

      {/* Subtle Ambient Glow */}
      <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -top-12 size-40 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />
    </section>
  );
}
