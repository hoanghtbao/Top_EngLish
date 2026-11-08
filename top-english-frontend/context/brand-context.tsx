/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Context quản lý thương hiệu Logo, Tiêu đề Hero và cấu hình giao diện thời gian thực
 */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchApi } from "../lib/api-client";

export interface BrandSettings {
  brandName: string;
  brandSubtitle: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroBadge: string;
  backgroundUrl: string;
  overlayOpacity: number;
  blurAmount: number;
  isEnabled: boolean;
}

const defaultBrandSettings: BrandSettings = {
  brandName: "TopEnglish",
  brandSubtitle: "by HoangBao",
  heroTitle: "Chinh phục tiếng Anh với",
  heroHighlight: "TopEnglish",
  heroSubtitle:
    "Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.",
  heroBadge: "Nền tảng học tiếng Anh thông minh thế hệ mới",
  backgroundUrl: "",
  overlayOpacity: 0.5,
  blurAmount: 0,
  isEnabled: true,
};

interface BrandContextType {
  brandSettings: BrandSettings;
  updateBrandState: (newSettings: Partial<BrandSettings>) => void;
  refreshBrandSettings: () => Promise<void>;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType>({
  brandSettings: defaultBrandSettings,
  updateBrandState: () => {},
  refreshBrandSettings: async () => {},
  isLoading: false,
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandSettings, setBrandSettings] =
    useState<BrandSettings>(defaultBrandSettings);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBrandSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi<BrandSettings>("/settings/homepage");
      if (res.success && res.data) {
        setBrandSettings({
          brandName: res.data.brandName || "TopEnglish",
          brandSubtitle: res.data.brandSubtitle || "by HoangBao",
          heroTitle: res.data.heroTitle || "Chinh phục tiếng Anh với",
          heroHighlight: res.data.heroHighlight || "TopEnglish",
          heroSubtitle:
            res.data.heroSubtitle ||
            "Ghi nhớ từ vựng qua thẻ Flashcard 3D, thuật toán lặp lại ngắt quãng (Spaced Repetition), ngữ pháp tương tác 4 thể và phòng luyện thi trắc nghiệm bấm giờ thực chiến.",
          heroBadge:
            res.data.heroBadge ||
            "Nền tảng học tiếng Anh thông minh thế hệ mới",
          backgroundUrl: res.data.backgroundUrl || "",
          overlayOpacity:
            typeof res.data.overlayOpacity === "number"
              ? res.data.overlayOpacity
              : 0.5,
          blurAmount:
            typeof res.data.blurAmount === "number" ? res.data.blurAmount : 0,
          isEnabled:
            typeof res.data.isEnabled === "boolean" ? res.data.isEnabled : true,
        });
      }
    } catch (err) {
      console.warn("Không thể tải cấu hình thương hiệu:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBrandState = (newSettings: Partial<BrandSettings>) => {
    setBrandSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  useEffect(() => {
    refreshBrandSettings();
  }, [refreshBrandSettings]);

  return (
    <BrandContext.Provider
      value={{
        brandSettings,
        updateBrandState,
        refreshBrandSettings,
        isLoading,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand phải được dùng bên trong BrandProvider");
  }
  return context;
}
