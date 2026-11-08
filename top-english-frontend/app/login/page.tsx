/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Màn hình Đăng nhập (Login Page) tuân thủ bộ tiêu chuẩn UI/UX Pro Max và Shadcn UI
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../../context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin",
      );
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (sampleEmail: string, samplePass: string) => {
    setEmail(sampleEmail);
    setPassword(samplePass);
    setErrorMessage(null);
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
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="size-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Globe2 className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Đăng nhập tài khoản
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Chào mừng bạn trở lại với nền tảng TopEnglish
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

        {/* Form: Sử dụng flex flex-col gap-4 theo chuẩn shadcn / ui-ux */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
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
              htmlFor="login-password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                <span>Đang xác thực...</span>
              </>
            ) : (
              "Đăng nhập ngay"
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons: Sử dụng SVG Lucide icons */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <span className="block text-[11px] font-medium text-slate-400 text-center mb-2.5">
            Tài khoản mẫu để kiểm thử nhanh:
          </span>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fillAccount("teacher@topenglish.com", "Teacher@123")}
              className="min-h-[44px] py-2 px-3 text-xs font-medium rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-semibold">Cô Mai Anh (Giáo viên)</span>
              </div>
              <span className="text-[10px] text-slate-400">teacher@topenglish.com</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillAccount("student@topenglish.com", "Student@123")}
                className="min-h-[44px] py-2 px-2.5 text-[11px] font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Nguyễn Học Viên</span>
              </button>
              <button
                type="button"
                onClick={() => fillAccount("admin@topenglish.com", "Admin@123")}
                className="min-h-[44px] py-2 px-2.5 text-[11px] font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Shield className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Quản trị viên (Admin)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-600 hover:underline"
          >
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}
