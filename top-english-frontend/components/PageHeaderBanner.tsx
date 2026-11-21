/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Banner tiêu đề trang chuẩn UI/UX Pro Max — bố cục căn giữa hài hòa (chừa khoảng thoáng 2 bên cho ảnh minh họa), hỗ trợ nền mặc định Jade hoặc ảnh nền riêng do Admin cấu hình
 */

"use client";

import React from "react";
import {
  PageBannerConfig,
  PageBannerValue,
  useBrand,
} from "../context/brand-context";

export interface BannerStatItem {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}

interface PageHeaderBannerProps {
  pageKey?: string;
  backgroundImageUrl?: string;
  badgeIcon?: React.ReactNode;
  badgeText: string;
  title: string;
  description: string;
  stats?: BannerStatItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const DEFAULT_BANNER_CONFIG: PageBannerConfig = {
  url: "",
  overlayOpacity: 0.35,
  blurAmount: 0,
  overlayMode: "dark",
  textColor: "white",
  zoom: 100,
  position: "center",
};

export function normalizeBannerConfig(
  raw?: PageBannerValue | null,
): PageBannerConfig {
  if (!raw) return { ...DEFAULT_BANNER_CONFIG };
  if (typeof raw === "string") {
    return {
      ...DEFAULT_BANNER_CONFIG,
      url: raw.trim(),
    };
  }
  return {
    url: (raw.url || "").trim(),
    overlayOpacity:
      typeof raw.overlayOpacity === "number"
        ? Math.min(0.95, Math.max(0, raw.overlayOpacity))
        : 0.35,
    blurAmount:
      typeof raw.blurAmount === "number"
        ? Math.min(16, Math.max(0, raw.blurAmount))
        : 0,
    overlayMode:
      raw.overlayMode === "light" ||
      raw.overlayMode === "none" ||
      raw.overlayMode === "dark"
        ? raw.overlayMode
        : "dark",
    textColor: raw.textColor === "dark" ? "dark" : "white",
    zoom:
      typeof raw.zoom === "number"
        ? Math.min(200, Math.max(100, raw.zoom))
        : 100,
    position:
      raw.position === "top" || raw.position === "bottom"
        ? raw.position
        : "center",
  };
}

export function resolveBannerImageUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${baseUrl}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function BannerBackgroundLayer({
  pageKey,
  backgroundImageUrl,
  overrideConfig,
}: {
  pageKey?: string;
  backgroundImageUrl?: string;
  overrideConfig?: PageBannerConfig;
}) {
  const { brandSettings } = useBrand();
  const config = overrideConfig
    ? overrideConfig
    : backgroundImageUrl
    ? normalizeBannerConfig(backgroundImageUrl)
    : normalizeBannerConfig(
        pageKey ? brandSettings.pageBannerBackgrounds?.[pageKey] : undefined,
      );

  const resolvedUrl = resolveBannerImageUrl(config.url);

  if (resolvedUrl) {
    const posClass =
      config.position === "top"
        ? "object-top"
        : config.position === "bottom"
        ? "object-bottom"
        : "object-center";

    const scale = (config.zoom || 100) / 100;

    return (
      <>
        <img
          src={resolvedUrl}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover ${posClass} pointer-events-none select-none transition-transform duration-300`}
          style={{
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            filter:
              config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : undefined,
          }}
        />
        {config.overlayMode === "dark" && config.overlayOpacity > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, rgba(2,44,34,${config.overlayOpacity}) 0%, rgba(15,23,42,${Math.max(
                0,
                config.overlayOpacity * 0.85,
              )}) 100%)`,
            }}
          />
        )}
        {config.overlayMode === "light" && config.overlayOpacity > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: `rgba(255,255,255,${config.overlayOpacity})`,
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 size-44 rounded-full bg-teal-300/15 blur-2xl pointer-events-none" />
    </>
  );
}

export default function PageHeaderBanner({
  pageKey,
  backgroundImageUrl,
  badgeIcon,
  badgeText,
  title,
  description,
  stats = [],
  actions,
  className = "",
}: PageHeaderBannerProps) {
  const { brandSettings } = useBrand();
  const config = backgroundImageUrl
    ? normalizeBannerConfig(backgroundImageUrl)
    : normalizeBannerConfig(
        pageKey ? brandSettings.pageBannerBackgrounds?.[pageKey] : undefined,
      );

  const hasCustomImage = Boolean(resolveBannerImageUrl(config.url));
  const isDarkText = hasCustomImage && config.textColor === "dark";

  return (
    <section
      data-banner-tone={isDarkText ? "light" : "dark"}
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-5 sm:px-12 lg:px-20 py-7 sm:py-9 shadow-lg shadow-emerald-900/10 ${
        isDarkText ? "text-slate-900 border border-emerald-200/70" : "text-white"
      } ${className}`}
    >
      <BannerBackgroundLayer
        pageKey={pageKey}
        backgroundImageUrl={backgroundImageUrl}
      />

      {/* Centered Content Block */}
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center gap-3">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full backdrop-blur-md border text-[11px] sm:text-xs font-bold w-fit ${
            isDarkText
              ? "bg-white/90 border-emerald-200/90 text-emerald-800 shadow-xs"
              : "bg-white/15 border-white/25 text-white"
          }`}
        >
          {badgeIcon}
          <span>{badgeText}</span>
        </div>

        {/* Title */}
        <h1
          className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight ${
            isDarkText
              ? "text-emerald-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]"
              : "text-white"
          }`}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          className={`text-xs sm:text-sm leading-relaxed max-w-xl ${
            isDarkText
              ? "text-slate-800 font-semibold drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
              : "text-emerald-50/95"
          }`}
        >
          {description}
        </p>

        {/* Centered Stats Pills + Action Buttons Row */}
        {(stats.length > 0 || actions) && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5">
            {stats.map((item, idx) => (
              <div
                key={idx}
                className={`inline-flex items-center gap-2 backdrop-blur-md px-3.5 py-2 rounded-full border transition ${
                  isDarkText
                    ? "bg-white/90 border-emerald-200/90 text-slate-900 shadow-xs"
                    : "bg-black/25 border-white/20 text-white"
                }`}
              >
                {item.icon && (
                  <span
                    className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                      isDarkText
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    {item.icon}
                  </span>
                )}
                <span
                  className={`text-[11px] font-semibold ${
                    isDarkText ? "text-slate-600" : "text-emerald-100/90"
                  }`}
                >
                  {item.label}:
                </span>
                <span
                  className={`text-xs sm:text-sm font-black ${
                    isDarkText ? "text-emerald-900" : "text-white"
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}

            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
