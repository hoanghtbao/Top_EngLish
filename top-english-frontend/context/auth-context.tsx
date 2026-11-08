/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Context quản lý trạng thái đăng nhập, lưu trữ JWT và thông báo Toast góc phải toàn hệ thống
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "../lib/api-client";
import Toast from "../components/Toast";
import StreakModal, { WeeklyActivityDay } from "../components/StreakModal";

export interface User {
  _id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  role: "student" | "teacher" | "admin";
  streak: number;
  totalXP: number;
  lastActiveDate?: string | null;
}

export interface StreakPayload {
  streak?: number;
  totalXP?: number;
  xpEarned?: number;
  streakIncreased?: boolean;
  isNewStreakDay?: boolean;
  streakMessage?: string;
  weeklyActivity?: WeeklyActivityDay[];
}

export interface ToastNotification {
  type?: "success" | "error" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  showToast: (toast: ToastNotification) => void;
  updateStreakInfo: (payload: StreakPayload) => void;
  addXP: (xpEarned: number, exactTotalXP?: number) => void;
  celebrateStreak: (payload: StreakPayload) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [streakModalData, setStreakModalData] = useState<StreakPayload | null>(null);

  // Khi tải ứng dụng, kiểm tra xem đã có token trong localStorage chưa
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetchApi<User>("/auth/me");
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Lắng nghe sự kiện mất phiên xác thực (Token hết hạn và không thể làm mới)
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  // Kiểm tra nếu có pending toast trong sessionStorage từ các lượt chuyển trang
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("pending_welcome_toast");
      if (pending) {
        sessionStorage.removeItem("pending_welcome_toast");
        const parsed = JSON.parse(pending);
        setToast(parsed);
      }
    } catch {
      sessionStorage.removeItem("pending_welcome_toast");
    }
  }, []);

  const showToast = (toastData: ToastNotification) => {
    setToast(toastData);
  };

  const login = async (email: string, password: string) => {
    const res = await fetchApi<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    if (res.success && res.data) {
      localStorage.setItem("access_token", res.data.tokens.accessToken);
      localStorage.setItem("refresh_token", res.data.tokens.refreshToken);
      setUser(res.data.user);

      // Kích hoạt Toast chào mừng góc bên phải trên cùng kéo dài 3-5s
      const welcomeToast: ToastNotification = {
        type: "success",
        title: "Chào mừng trở lại!",
        message: `Chào mừng trở lại, ${res.data.user.fullName}!`,
        duration: 4000,
      };
      sessionStorage.setItem("pending_welcome_toast", JSON.stringify(welcomeToast));
      setToast(welcomeToast);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await fetchApi<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, fullName }),
      },
    );

    if (res.success && res.data) {
      localStorage.setItem("access_token", res.data.tokens.accessToken);
      localStorage.setItem("refresh_token", res.data.tokens.refreshToken);
      setUser(res.data.user);

      const welcomeToast: ToastNotification = {
        type: "success",
        title: "Chào mừng thành viên mới!",
        message: `Chào mừng bạn ${res.data.user.fullName} đến với TopEnglish!`,
        duration: 4000,
      };
      sessionStorage.setItem("pending_welcome_toast", JSON.stringify(welcomeToast));
      setToast(welcomeToast);
    }
  };

  const logout = async () => {
    try {
      await fetchApi("/auth/logout", { method: "POST" });
    } catch {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      setToast({
        type: "success",
        title: "Đã đăng xuất thành công",
        message: "Hẹn gặp lại bạn trong buổi học tiếp theo!",
        duration: 3500,
      });
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await fetchApi<User>("/auth/me");
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (err) {
      console.error("Lỗi khi làm mới thông tin tài khoản:", err);
    }
  };

  const updateStreakInfo = (payload: StreakPayload) => {
    setUser((prev) => {
      if (!prev) return null;
      let nextXP = prev.totalXP || 0;
      if (payload.totalXP !== undefined) {
        nextXP = payload.totalXP;
      } else if (payload.xpEarned) {
        nextXP = (prev.totalXP || 0) + payload.xpEarned;
      }

      return {
        ...prev,
        streak: payload.streak !== undefined ? payload.streak : (prev.streak || 0),
        totalXP: nextXP,
      };
    });

    // Nếu có điểm thưởng xpEarned mà không có streakIncreased -> Báo toast cộng điểm XP
    if (payload.xpEarned && !payload.streakIncreased && !payload.isNewStreakDay) {
      showToast({
        type: "success",
        title: `+${payload.xpEarned} XP!`,
        message: "Điểm kinh nghiệm đã được cộng vào tài khoản.",
        duration: 2500,
      });
    }

    // Nếu chuỗi tăng hoặc hôm nay là ngày mới giữ chuỗi -> Kích hoạt Modal Duolingo
    if ((payload.streakIncreased || payload.isNewStreakDay) && payload.streak !== undefined) {
      setStreakModalData(payload);
    }
  };

  const addXP = (xpEarned: number, exactTotalXP?: number) => {
    if (xpEarned <= 0 && exactTotalXP === undefined) return;
    setUser((prev) => {
      if (!prev) return null;
      const nextXP = exactTotalXP !== undefined ? exactTotalXP : (prev.totalXP || 0) + xpEarned;
      return {
        ...prev,
        totalXP: nextXP,
      };
    });

    showToast({
      type: "success",
      title: `+${xpEarned} XP!`,
      message: `Bạn vừa nhận được ${xpEarned} điểm kinh nghiệm.`,
      duration: 3000,
    });
  };

  const celebrateStreak = (payload: StreakPayload) => {
    setStreakModalData(payload);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
        showToast,
        updateStreakInfo,
        addXP,
        celebrateStreak,
      }}
    >
      {children}
      {streakModalData && (
        <StreakModal
          isOpen={true}
          streak={streakModalData.streak || 0}
          message={streakModalData.streakMessage}
          weeklyActivity={streakModalData.weeklyActivity}
          onClose={() => setStreakModalData(null)}
        />
      )}
      {toast && (
        <Toast
          key={toast.title + (toast.message || "")}
          position="top-right"
          type={toast.type || "success"}
          title={toast.title}
          message={toast.message}
          duration={toast.duration || 4000}
          onClose={() => {
            setToast(null);
            sessionStorage.removeItem("pending_welcome_toast");
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
}
