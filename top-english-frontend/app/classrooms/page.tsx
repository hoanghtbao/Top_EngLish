/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang quản lý và tham gia lớp học trực tuyến (Classrooms Hub) tuân thủ AppLayout và UI/UX Pro Max
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";

interface ClassroomItem {
  _id: string;
  name: string;
  code: string;
  description: string;
  gradeLevel: string;
  themeColor: string;
  teacher: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  studentCount: number;
  assignmentCount: number;
  maxStudents: number;
  createdAt: string;
}

export default function ClassroomsPage() {
  const { user, isAuthenticated } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    gradeLevel: "B1 - Intermediate",
    themeColor: "emerald",
    maxStudents: 30,
  });

  // Join Form State
  const [joinCode, setJoinCode] = useState("");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const loadClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi<ClassroomItem[]>("/classrooms");
      if (res.success && Array.isArray(res.data)) {
        setClassrooms(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách lớp học:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadClassrooms();
    }
  }, [isAuthenticated, loadClassrooms]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!createForm.name.trim()) {
      setModalError("Vui lòng nhập tên lớp học");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchApi("/classrooms", {
        method: "POST",
        body: JSON.stringify(createForm),
      });

      if (res.success) {
        setModalSuccess(`Đã tạo lớp học thành công! Mã lớp: ${res.data.code}`);
        setCreateForm({
          name: "",
          description: "",
          gradeLevel: "B1 - Intermediate",
          themeColor: "emerald",
          maxStudents: 30,
        });
        await loadClassrooms();
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setModalSuccess("");
        }, 1500);
      }
    } catch (err: any) {
      setModalError(err.message || "Không thể tạo lớp học");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!joinCode.trim()) {
      setModalError("Vui lòng nhập mã lớp học");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetchApi("/classrooms/join", {
        method: "POST",
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });

      if (res.success) {
        setModalSuccess(res.message || "Gia nhập lớp học thành công!");
        setJoinCode("");
        await loadClassrooms();
        setTimeout(() => {
          setIsJoinModalOpen(false);
          setModalSuccess("");
        }, 1500);
      }
    } catch (err: any) {
      setModalError(err.message || "Mã lớp không hợp lệ hoặc bạn đã tham gia lớp này");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClassrooms = classrooms.filter((cls) => {
    const q = searchQuery.toLowerCase();
    return (
      cls.name.toLowerCase().includes(q) ||
      cls.code.toLowerCase().includes(q) ||
      cls.gradeLevel.toLowerCase().includes(q) ||
      (cls.teacher && cls.teacher.fullName.toLowerCase().includes(q))
    );
  });

  const getThemeGradient = (color: string) => {
    switch (color) {
      case "blue":
        return "from-blue-600 to-indigo-700 text-white";
      case "purple":
        return "from-purple-600 to-pink-600 text-white";
      case "amber":
        return "from-amber-500 to-orange-600 text-white";
      case "rose":
        return "from-rose-500 to-pink-700 text-white";
      case "teal":
        return "from-teal-600 to-emerald-700 text-white";
      case "emerald":
      default:
        return "from-emerald-600 to-teal-700 text-white";
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* COMPACT JADE BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 sm:p-6 text-white shadow-lg shadow-emerald-900/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold w-fit border border-white/20">
                <GraduationCap className="size-3.5" />
                <span>Hệ Thống Lớp Học Trực Tuyến</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {isTeacher
                  ? "Không Gian Giảng Dạy & Giao Bài Tập"
                  : "Lớp Học Trực Tuyến Của Bạn"}
              </h1>
              <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed">
                {isTeacher
                  ? "Khởi tạo lớp học mới, cấp mã mời, giao bài tập về nhà và quản lý sổ điểm học viên."
                  : "Tham gia lớp học của giáo viên bằng mã mời, hoàn thành bài tập và nhận điểm thưởng."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isTeacher && (
                <button
                  onClick={() => {
                    setModalError("");
                    setModalSuccess("");
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow hover:bg-emerald-50 active:scale-95 transition cursor-pointer min-h-[38px]"
                >
                  <Plus className="size-4" />
                  <span>Tạo lớp học mới</span>
                </button>
              )}

              <button
                onClick={() => {
                  setModalError("");
                  setModalSuccess("");
                  setIsJoinModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-300/30 text-white font-bold text-xs backdrop-blur active:scale-95 transition cursor-pointer min-h-[38px]"
              >
                <UserCheck className="size-4" />
                <span>Gia nhập bằng mã</span>
              </button>
            </div>
          </div>

          <div className="absolute -right-8 -bottom-8 size-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* COMPACT STATS OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500">
                {isTeacher ? "Lớp đang quản lý" : "Lớp đã tham gia"}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {classrooms.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500">
                Tổng số bài tập
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {classrooms.reduce((acc, c) => acc + (c.assignmentCount || 0), 0)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500">
                {isTeacher ? "Tổng học viên" : "Bạn cùng lớp"}
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {classrooms.reduce((acc, c) => acc + (c.studentCount || 0), 0)}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH BAR & REFRESH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={loadClassrooms}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer self-end sm:self-auto min-h-[36px]"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* CLASSROOMS LIST GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
            <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="size-6" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {searchQuery
                  ? "Không tìm thấy lớp học phù hợp"
                  : "Chưa có lớp học nào"}
              </h3>
              <p className="text-xs text-slate-500">
                {isTeacher
                  ? "Hãy bấm 'Tạo lớp học mới' để bắt đầu kết nối với học viên!"
                  : "Bạn chưa tham gia lớp học nào. Hãy hỏi giáo viên mã mời để vào lớp!"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClassrooms.map((cls) => (
              <div
                key={cls._id}
                className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-500/50 transition group"
              >
                {/* Banner */}
                <div
                  className={`relative p-4 sm:p-5 bg-gradient-to-r ${getThemeGradient(
                    cls.themeColor,
                  )} flex flex-col justify-between min-h-[90px]`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-[10px] font-semibold text-white border border-white/20">
                      {cls.gradeLevel}
                    </span>

                    {/* Copy Code Badge */}
                    <button
                      onClick={(e) => handleCopyCode(cls.code, e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/25 hover:bg-black/40 backdrop-blur text-[11px] font-mono font-bold text-white transition cursor-pointer"
                      title="Sao chép mã mời"
                    >
                      <span>{cls.code}</span>
                      {copiedCode === cls.code ? (
                        <Check className="size-3 text-emerald-300" />
                      ) : (
                        <Copy className="size-3 text-white/80" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold line-clamp-1 mt-2 text-white">
                    {cls.name}
                  </h3>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {cls.description || "Lớp học chưa có mô tả chi tiết."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <div className="size-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[9px]">
                          {cls.teacher?.fullName ? cls.teacher.fullName.charAt(0) : "G"}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                          {cls.teacher?.fullName || "Giáo viên"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3 text-slate-400" />
                          <span>{cls.studentCount || 0}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="size-3 text-slate-400" />
                          <span>{cls.assignmentCount || 0} bài</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/classrooms/${cls._id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition group-hover:bg-emerald-600 group-hover:text-white min-h-[36px]"
                  >
                    <span>Vào lớp học</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL 1: TẠO LỚP HỌC MỚI */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <GraduationCap className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Tạo Lớp Học Mới
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tự động cấp mã mời duy nhất
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="size-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {modalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateClassroom} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tiếng Anh Giao Tiếp Cơ Bản K26"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cấp độ (Level)
                    </label>
                    <select
                      value={createForm.gradeLevel}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, gradeLevel: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    >
                      <option value="A1 - Beginner">A1 - Beginner</option>
                      <option value="A2 - Elementary">A2 - Elementary</option>
                      <option value="B1 - Intermediate">B1 - Intermediate</option>
                      <option value="B2 - Upper Intermediate">
                        B2 - Upper Intermediate
                      </option>
                      <option value="C1 - Advanced">C1 - Advanced</option>
                      <option value="IELTS Prep">IELTS Prep</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Màu chủ đề
                    </label>
                    <select
                      value={createForm.themeColor}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, themeColor: e.target.value })
                      }
                      className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    >
                      <option value="emerald">Xanh ngọc</option>
                      <option value="blue">Xanh dương</option>
                      <option value="purple">Tím</option>
                      <option value="amber">Hổ phách</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mô tả lớp học
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mục tiêu khóa học và tài liệu học tập..."
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
                  >
                    {submitting ? "Đang tạo..." : "Xác nhận tạo lớp"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: GIA NHẬP LỚP BẰNG MÃ */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <UserCheck className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Tham Gia Lớp Học
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nhập mã mời do giáo viên cung cấp
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsJoinModalOpen(false)}
                  className="size-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
                >
                  <X className="size-4" />
                </button>
              </div>

              {modalError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <form onSubmit={handleJoinClassroom} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: TOP-WU859"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="px-3.5 py-2.5 text-center text-base font-mono font-bold tracking-widest uppercase rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 font-semibold text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
                  >
                    {submitting ? "Đang vào..." : "Gia nhập"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
