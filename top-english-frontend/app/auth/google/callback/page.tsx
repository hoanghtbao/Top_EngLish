/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang tiếp nhận callback Google OAuth và đổi one-time code lấy phiên JWT an toàn
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Globe2, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../../context/auth-context";

const processedExchanges = new Map<string, Promise<void>>();

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { exchangeGoogleCode } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setErrorMessage("Thiếu mã xác thực từ Google. Vui lòng thử đăng nhập lại.");
      return;
    }

    let exchangePromise = processedExchanges.get(code);
    if (!exchangePromise) {
      exchangePromise = exchangeGoogleCode(code);
      processedExchanges.set(code, exchangePromise);
    }

    let cancelled = false;
    exchangePromise
      .then(() => {
        if (!cancelled) {
          router.replace("/");
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setErrorMessage(
            err?.message || "Không thể hoàn tất đăng nhập với Google. Vui lòng thử lại.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, exchangeGoogleCode, router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
        <div className="size-12 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Globe2 className="size-7" />
        </div>

        {errorMessage ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 text-left">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
            >
              <ArrowLeft className="size-4" /> Quay lại trang đăng nhập
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-7 animate-spin text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Đang xác thực tài khoản Google...
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hệ thống đang thiết lập phiên đăng nhập an toàn cho bạn, vui lòng chờ trong giây lát.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="size-7 animate-spin text-emerald-600" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
