/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Nút Tiếp tục với Google sử dụng luồng OAuth 2.0 + PKCE xác thực qua máy chủ
 */

"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface GoogleAuthButtonProps {
  mode: "login" | "register";
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function getGoogleAuthErrorMessage(code: string | null): string | null {
  switch (code) {
    case "not_configured":
      return "Đăng nhập Google chưa được kích hoạt trên máy chủ. Quản trị viên cần thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào cấu hình backend (.env).";
    case "access_denied":
      return "Bạn đã hủy quá trình xác thực với Google.";
    case "invalid_state":
      return "Phiên xác thực Google đã hết hạn hoặc không khớp (CSRF check). Vui lòng thử lại.";
    case "unverified_email":
      return "Email Google của bạn chưa được xác minh. Vui lòng dùng tài khoản Google đã xác thực email.";
    case "account_disabled":
      return "Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ quản trị viên.";
    case "missing_id_token":
    case "oauth_failed":
      return "Không thể hoàn tất xác thực với Google. Vui lòng thử lại sau.";
    default:
      return null;
  }
}

export default function GoogleAuthButton({
  mode,
  disabled = false,
  onError,
}: GoogleAuthButtonProps) {
  const [checking, setChecking] = useState(false);

  const handleGoogleContinue = async () => {
    if (disabled || checking) return;
    setChecking(true);

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

    try {
      const res = await fetch(`${apiUrl}/auth/google/status`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json?.data?.configured) {
        const callbackUrl =
          json?.data?.callbackUrl ||
          "http://localhost:5001/api/v1/auth/google/callback";
        onError?.(
          `Chức năng Google OAuth chưa có Client ID/Secret trên máy chủ. Hãy cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong top-english-backend/.env (Redirect URI: ${callbackUrl}).`,
        );
        setChecking(false);
        return;
      }

      window.location.href = `${apiUrl}/auth/google?mode=${mode}`;
    } catch {
      onError?.("Không thể kết nối tới máy chủ xác thực Google. Vui lòng thử lại.");
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center justify-center my-1">
        <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
        <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400 bg-white dark:bg-slate-900 shrink-0">
          Hoặc
        </span>
        <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogleContinue}
        disabled={disabled || checking}
        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold shadow-xs transition disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
      >
        {checking ? (
          <Loader2 className="size-4 animate-spin text-emerald-600" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-4.5 shrink-0"
          >
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
        )}
        <span>{checking ? "Đang kết nối Google..." : "Tiếp tục với Google"}</span>
      </button>

      <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 text-center">
        <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
        <span>Xác thực bảo mật 2 lớp thông qua Google OAuth 2.0</span>
      </p>
    </div>
  );
}
