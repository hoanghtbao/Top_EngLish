/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Màn hình Đăng ký tài khoản (Register Page) tuân thủ tiêu chuẩn UI/UX Pro Max và Shadcn UI
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe2,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  User,
} from "lucide-react";
import { useAuth } from "../../context/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp nhau");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, fullName);
      router.push("/");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition min-h-[44px]"
      >
        <ArrowLeft className="size-4" /> Quay lại trang chủ
      </Link>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="size-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Globe2 className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tạo tài khoản mới
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bắt đầu hành trình chinh phục tiếng Anh cùng TopEnglish
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
          >
            <ShieldAlert className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form: flex flex-col gap-4 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-name"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Họ và tên
            </label>
            <div className="relative">
              <User className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-email"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <div className="relative">
              <Lock className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="register-confirm-password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Xác nhận lại mật khẩu
            </label>
            <div className="relative">
              <Lock className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="register-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 px-4 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Đang tạo tài khoản...</span>
              </>
            ) : (
              "Đăng ký tài khoản"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-600 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
