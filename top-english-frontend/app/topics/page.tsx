/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang Danh sách Lớp học Từ vựng Flashcard (Cấp 1: Lớp học -> Cấp 2: Bài học -> Luyện tập)
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { fetchApi } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import { useSound } from "../../context/sound-context";

interface VocabClass {
  _id: string;
  name: string;
  code: string;
  description: string;
  lessonCount: number;
  totalWords: number;
}

export default function TopicsClassesPage() {
  const { user } = useAuth();
  const { playClickSound, playSuccessSound } = useSound();
  const isTeacherOrAdmin = user && (user.role === "teacher" || user.role === "admin");

  const [classes, setClasses] = useState<VocabClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Teacher / Admin modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<VocabClass | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [classForm, setClassForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const qs = searchQuery.trim()
        ? `?search=${encodeURIComponent(searchQuery.trim())}`
        : "";
      const res = await fetchApi<VocabClass[]>(`/topics/classes${qs}`);
      if (res.success && Array.isArray(res.data)) {
        setClasses(res.data);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách lớp học từ vựng:", err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchClasses]);

  const openCreateModal = () => {
    playClickSound();
    setErrorMessage(null);
    setClassForm({ name: "", code: "", description: "" });
    setShowCreateModal(true);
  };

  const openManageModal = (cls: VocabClass, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playClickSound();
    setErrorMessage(null);
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      code: cls.code,
      description: cls.description || "",
    });
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim() || !classForm.code.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ Tên lớp học và Mã lớp!");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetchApi<VocabClass>("/topics/classes", {
        method: "POST",
        body: JSON.stringify({
          name: classForm.name.trim(),
          code: classForm.code.trim().toUpperCase(),
          description: classForm.description.trim() || undefined,
        }),
      });

      if (res.success && res.data) {
        playSuccessSound();
        setSuccessMessage(`Đã tạo thành công lớp học "${res.data.name}" (${res.data.code})!`);
        setShowCreateModal(false);
        fetchClasses();
      } else {
        setErrorMessage(res.message || "Không thể tạo lớp học!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Tạo lớp học thất bại. Vui lòng kiểm tra quyền Giáo viên/Admin!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!classForm.name.trim() || !classForm.code.trim()) {
      setErrorMessage("Tên lớp học và Mã lớp không được để trống!");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetchApi<VocabClass>(`/topics/classes/${editingClass._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: classForm.name.trim(),
          code: classForm.code.trim().toUpperCase(),
          description: classForm.description.trim(),
        }),
      });

      if (res.success && res.data) {
        playSuccessSound();
        setSuccessMessage(`Đã cập nhật thông tin lớp học "${res.data.name}"!`);
        setEditingClass(null);
        fetchClasses();
      } else {
        setErrorMessage(res.message || "Không thể cập nhật lớp học!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Cập nhật lớp học thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!editingClass) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa lớp "${editingClass.name}" và toàn bộ ${editingClass.lessonCount} bài học bên trong?`
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetchApi<{ deleted: boolean; message: string }>(
        `/topics/classes/${editingClass._id}`,
        { method: "DELETE" }
      );

      if (res.success) {
        playClickSound();
        setSuccessMessage(`Đã xóa lớp học "${editingClass.name}"!`);
        setEditingClass(null);
        fetchClasses();
      } else {
        setErrorMessage(res.message || "Không thể xóa lớp học!");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Xóa lớp học thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col gap-7">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 w-fit">
              <Sparkles className="size-3.5" />
              Từ vựng Flashcard theo Lớp học
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Danh Sách Lớp Học
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Chọn lớp học bên dưới để xem danh sách bài học và luyện tập theo 3 chế độ: Học Từ (Flashcard), Quiz ABCD và Gõ Từ.
            </p>
          </div>

          {isTeacherOrAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer shrink-0 w-fit"
            >
              <Plus className="size-4 stroke-[3]" />
              Tạo lớp học mới
            </button>
          )}
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm lớp học theo tên, mã lớp (VD: TE2) hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60 shrink-0 self-end sm:self-center">
            <BookOpen className="size-3.5 text-emerald-600" />
            <span>{loading ? "Đang tải..." : `${classes.length} lớp học`}</span>
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-3">
            <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Layers className="size-7" />
            </div>
            <h3 className="text-lg font-bold">Chưa có lớp học nào</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery
                ? `Không tìm thấy lớp học khớp với từ khóa "${searchQuery}".`
                : isTeacherOrAdmin
                ? "Hãy bấm nút \"Tạo lớp học mới\" để bắt đầu xây dựng danh sách bài học Flashcard."
                : "Hiện chưa có lớp học nào được mở."}
            </p>
            {searchQuery ? (
              <button
                onClick={() => {
                  playClickSound();
                  setSearchQuery("");
                }}
                className="mt-2 h-10 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
              >
                Xem tất cả lớp học
              </button>
            ) : isTeacherOrAdmin ? (
              <button
                onClick={openCreateModal}
                className="mt-2 h-10 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-4" />
                Tạo lớp học đầu tiên
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {classes.map((cls) => (
              <Link
                key={cls._id}
                href={`/topics/classes/${cls._id}`}
                onClick={() => playClickSound()}
                className="group relative flex flex-col justify-between gap-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs hover:shadow-xl hover:shadow-emerald-950/10 hover:border-emerald-400/70 dark:hover:border-emerald-500/60 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  {/* Top Badges & Gear Action */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
                        LỚP HỌC
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Mã: <span className="text-slate-800 dark:text-slate-200">{cls.code}</span>
                      </span>
                    </div>

                    {isTeacherOrAdmin && (
                      <button
                        type="button"
                        onClick={(e) => openManageModal(cls, e)}
                        className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center justify-center transition cursor-pointer"
                        title="Cài đặt / Chỉnh sửa lớp học"
                      >
                        <Settings className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* Class Title & Description */}
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {cls.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {cls.description || "Lớp học từ vựng và luyện tập tương tác 3 chế độ."}
                    </p>
                  </div>
                </div>

                {/* Footer Stats & Enter CTA */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="size-3.5 text-emerald-500" />
                      {cls.lessonCount} bài học
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      • {cls.totalWords} từ vựng
                    </span>
                  </div>

                  <div className="h-10 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 group-hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 group-hover:text-white font-bold text-xs flex items-center justify-between border border-emerald-200/80 dark:border-emerald-800/70 group-hover:border-emerald-600 transition-all">
                    <span>Mở danh sách bài học</span>
                    <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* MODAL: TẠO LỚP HỌC MỚI */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Tạo Lớp Học Từ Vựng Mới
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sau khi tạo lớp học, bạn có thể thêm các bài học bên trong
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tên lớp học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: TOEIC 2"
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mã lớp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: TE2"
                      value={classForm.code}
                      onChange={(e) =>
                        setClassForm({ ...classForm, code: e.target.value.toUpperCase() })
                      }
                      className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mô tả lớp học
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Học toeic 4 kĩ năng"
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/30 cursor-pointer"
                  >
                    {isSubmitting ? "Đang tạo..." : "Tạo Lớp Học"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CHỈNH SỬA / XÓA LỚP HỌC */}
        {editingClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Settings className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Quản Lý Lớp Học
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chỉnh sửa thông tin hoặc xóa lớp học
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleUpdateClass} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tên lớp học <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mã lớp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={classForm.code}
                      onChange={(e) =>
                        setClassForm({ ...classForm, code: e.target.value.toUpperCase() })
                      }
                      className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mô tả lớp học
                  </label>
                  <textarea
                    rows={3}
                    value={classForm.description}
                    onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleDeleteClass}
                    disabled={isSubmitting}
                    className="h-10 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa lớp
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingClass(null)}
                      className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/30 cursor-pointer"
                    >
                      {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
