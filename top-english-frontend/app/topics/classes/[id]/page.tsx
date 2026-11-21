/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang Chi tiết Lớp học Từ vựng & Danh sách Bài học (1. Học Từ, 2. Quiz ABCD, 3. Gõ Từ)
 */

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileJson,
  Keyboard,
  Layers,
  Plus,
  Settings,
  Tag,
  Target,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import AppLayout from "../../../../components/AppLayout";
import { fetchApi } from "../../../../lib/api-client";
import { useAuth } from "../../../../context/auth-context";
import { useSound } from "../../../../context/sound-context";
import {
  DEFAULT_STUDY_SETTINGS,
  getDirectionBadgeLabel,
  loadStudySettings,
  saveStudySettings,
  StudySessionSettings,
} from "../../../../lib/study-settings";
import { StudySettingsModal } from "../../../../components/StudySettingsModal";

interface VocabClassInfo {
  _id: string;
  name: string;
  code: string;
  description: string;
}

interface LessonTopic {
  _id: string;
  vocabClassId: string;
  lessonNumber: number;
  tag: string;
  title: string;
  slug: string;
  description: string;
  wordCount: number;
}

interface ClassDetailResponse {
  classInfo: VocabClassInfo;
  lessons: LessonTopic[];
}

function VocabClassDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex items-center justify-center">
      <div className="size-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  );
}

function VocabClassDetailInner() {
  const params = useParams();
  const classIdOrCode = params?.id as string;
  const { user } = useAuth();
  const { playClickSound, playSuccessSound } = useSound();

  const isTeacherOrAdmin = user && (user.role === "teacher" || user.role === "admin");

  const [classInfo, setClassInfo] = useState<VocabClassInfo | null>(null);
  const [lessons, setLessons] = useState<LessonTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Study Session Settings
  const [studySettings, setStudySettings] =
    useState<StudySessionSettings>(DEFAULT_STUDY_SETTINGS);
  const [showStudySettingsModal, setShowStudySettingsModal] = useState<boolean>(false);

  // Teacher Lesson Modals
  const [showCreateLessonModal, setShowCreateLessonModal] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<LessonTopic | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [lessonForm, setLessonForm] = useState({
    lessonNumber: 1,
    tag: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    setStudySettings(loadStudySettings());
  }, []);

  const loadClassDetail = useCallback(async () => {
    if (!classIdOrCode) return;
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await fetchApi<ClassDetailResponse>(`/topics/classes/${classIdOrCode}`);
      if (res.success && res.data) {
        setClassInfo(res.data.classInfo);
        setLessons(Array.isArray(res.data.lessons) ? res.data.lessons : []);
      } else {
        setClassInfo(null);
        setErrorBanner(res.message || "Không tìm thấy lớp học này.");
      }
    } catch (err: any) {
      setClassInfo(null);
      setErrorBanner(err?.message || "Không thể tải thông tin lớp học.");
    } finally {
      setLoading(false);
    }
  }, [classIdOrCode]);

  useEffect(() => {
    loadClassDetail();
  }, [loadClassDetail]);

  const updateSettings = (patch: Partial<StudySessionSettings>) => {
    playClickSound();
    const next = { ...studySettings, ...patch };
    setStudySettings(next);
    saveStudySettings(next);
  };

  const openCreateLesson = () => {
    playClickSound();
    setModalError(null);
    const maxNum = lessons.reduce((acc, l) => Math.max(acc, l.lessonNumber || 0), 0);
    setLessonForm({
      lessonNumber: maxNum + 1,
      tag: "",
      title: "",
      description: "",
    });
    setShowCreateLessonModal(true);
  };

  const openManageLesson = (lesson: LessonTopic) => {
    playClickSound();
    setModalError(null);
    setEditingLesson(lesson);
    setLessonForm({
      lessonNumber: lesson.lessonNumber || 1,
      tag: lesson.tag || "",
      title: lesson.title,
      description: lesson.description || "",
    });
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classInfo?._id) return;
    if (!lessonForm.title.trim()) {
      setModalError("Vui lòng nhập tên bài học!");
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      const res = await fetchApi<LessonTopic>("/topics", {
        method: "POST",
        body: JSON.stringify({
          vocabClassId: classInfo._id,
          lessonNumber: Number(lessonForm.lessonNumber) || lessons.length + 1,
          tag: lessonForm.tag.trim() || undefined,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || undefined,
        }),
      });

      if (res.success && res.data) {
        playSuccessSound();
        setSuccessBanner(`Đã tạo thành công bài học "${res.data.title}"!`);
        setShowCreateLessonModal(false);
        loadClassDetail();
      } else {
        setModalError(res.message || "Không thể tạo bài học mới!");
      }
    } catch (err: any) {
      setModalError(err?.message || "Tạo bài học thất bại. Vui lòng kiểm tra quyền Giáo viên/Admin!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    if (!lessonForm.title.trim()) {
      setModalError("Tên bài học không được để trống!");
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);

      const res = await fetchApi<LessonTopic>(`/topics/${editingLesson._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          lessonNumber: Number(lessonForm.lessonNumber) || 1,
          tag: lessonForm.tag.trim(),
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim(),
        }),
      });

      if (res.success && res.data) {
        playSuccessSound();
        setSuccessBanner(`Đã cập nhật bài học "${res.data.title}"!`);
        setEditingLesson(null);
        loadClassDetail();
      } else {
        setModalError(res.message || "Không thể cập nhật bài học!");
      }
    } catch (err: any) {
      setModalError(err?.message || "Cập nhật bài học thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!editingLesson) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài học "${editingLesson.title}"?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetchApi<{ deleted: boolean }>(`/topics/${editingLesson._id}`, {
        method: "DELETE",
      });

      if (res.success) {
        playClickSound();
        setSuccessBanner(`Đã xóa bài học "${editingLesson.title}"!`);
        setEditingLesson(null);
        loadClassDetail();
      } else {
        setModalError(res.message || "Không thể xóa bài học!");
      }
    } catch (err: any) {
      setModalError(err?.message || "Xóa bài học thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-9 flex flex-col gap-6">
        {/* Back Button */}
        <div>
          <Link
            href="/topics"
            onClick={() => playClickSound()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Quay lại danh sách lớp
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-5 animate-pulse">
            <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : !classInfo ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {errorBanner || "Không tìm thấy lớp học"}
            </h2>
            <Link
              href="/topics"
              className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2"
            >
              Về danh sách lớp học
            </Link>
          </div>
        ) : (
          <>
            {/* Success Banner */}
            {successBanner && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{successBanner}</span>
                </div>
                <button
                  onClick={() => setSuccessBanner(null)}
                  className="text-emerald-700 hover:text-emerald-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* CLASS HEADER BANNER CARD (GIỐNG ẢNH MẪU) */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
                    LỚP HỌC
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Mã: <span className="font-bold text-slate-700 dark:text-slate-200">{classInfo.code}</span>
                  </span>
                </div>

                {/* Cài đặt phiên học button */}
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowStudySettingsModal(true);
                  }}
                  className="h-10 px-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 shadow-2xs transition cursor-pointer w-fit"
                >
                  <Settings className="size-4 text-emerald-600" />
                  <span>Cài Đặt Phiên Học</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60">
                    {getDirectionBadgeLabel(studySettings.direction)}
                  </span>
                </button>
              </div>

              <div className="mt-1">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {classInfo.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {classInfo.description || "Lớp học từ vựng và luyện tập tương tác."}
                </p>
              </div>
            </section>

            {/* LESSONS LIST HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Danh Sách Bài Học ({lessons.length})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Quick session indicators */}
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => updateSettings({ instantAnswer: !studySettings.instantAnswer })}
                    className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer"
                    title="Bấm để bật/tắt đáp án tức thì"
                  >
                    <CheckCircle2
                      className={`size-3.5 ${
                        studySettings.instantAnswer ? "text-emerald-500" : "text-slate-400"
                      }`}
                    />
                    <span>
                      Đáp án tức thì:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {studySettings.instantAnswer ? "Bật" : "Tắt"}
                      </strong>
                    </span>
                  </button>

                  <span className="text-slate-300 dark:text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={() => updateSettings({ autoAudio: !studySettings.autoAudio })}
                    className="inline-flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer"
                    title="Bấm để bật/tắt tự động phát âm"
                  >
                    {studySettings.autoAudio ? (
                      <Volume2 className="size-3.5 text-emerald-500" />
                    ) : (
                      <VolumeX className="size-3.5 text-slate-400" />
                    )}
                    <span>
                      Phát âm:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {studySettings.autoAudio ? "Bật" : "Tắt"}
                      </strong>
                    </span>
                  </button>
                </div>

                {/* Teacher / Admin Create Lesson CTA */}
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={openCreateLesson}
                    className="h-9.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="size-4 stroke-[3]" />
                    <span>Tạo bài học mới</span>
                  </button>
                )}
              </div>
            </div>

            {/* LESSONS LIST */}
            {lessons.length === 0 ? (
              <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center gap-3">
                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <BookOpen className="size-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Lớp học này chưa có bài học nào
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  {isTeacherOrAdmin
                    ? "Hãy tạo bài học đầu tiên rồi thêm từ vựng (nhập tay hoặc import bằng JSON) cho học viên luyện tập."
                    : "Giáo viên đang chuẩn bị bài học cho lớp này. Vui lòng quay lại sau!"}
                </p>
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={openCreateLesson}
                    className="mt-1 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    Tạo bài học đầu tiên
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {lessons.map((lesson, idx) => (
                  <article
                    key={lesson._id}
                    className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300/80 dark:hover:border-emerald-700/70 transition-all"
                  >
                    {/* Top Row: Lesson Badges + Gear Icon */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                          Bài {lesson.lessonNumber || idx + 1}
                        </span>

                        {lesson.tag && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Tag className="size-3 text-slate-400" />
                            {lesson.tag}
                          </span>
                        )}

                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          • {lesson.wordCount} từ vựng
                        </span>
                      </div>

                      {isTeacherOrAdmin && (
                        <button
                          type="button"
                          onClick={() => openManageLesson(lesson)}
                          className="size-8 rounded-full bg-slate-100/90 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center justify-center transition cursor-pointer shrink-0"
                          title="Quản lý bài học & Nhập từ vựng (Form / JSON)"
                        >
                          <Settings className="size-4" />
                        </button>
                      )}
                    </div>

                    {/* Main Row: Title + Description on Left | 3 Mode Buttons on Right */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                          {lesson.title}
                        </h3>
                        {lesson.description && (
                          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      {/* 3 Practice Buttons: 1. Học Từ | 2. Quiz ABCD | 3. Gõ Từ */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                        <Link
                          href={`/topics/${lesson.slug || lesson._id}?mode=flashcard`}
                          onClick={() => playClickSound()}
                          className="h-10.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition shadow-2xs cursor-pointer"
                        >
                          <Layers className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>1. Học Từ</span>
                        </Link>

                        <Link
                          href={`/topics/${lesson.slug || lesson._id}?mode=quiz`}
                          onClick={() => playClickSound()}
                          className="h-10.5 px-4.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-500/25 active:scale-95 transition cursor-pointer"
                        >
                          <Target className="size-3.5" />
                          <span>2. Quiz ABCD</span>
                        </Link>

                        <Link
                          href={`/topics/${lesson.slug || lesson._id}?mode=typing`}
                          onClick={() => playClickSound()}
                          className="h-10.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/30 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition shadow-2xs cursor-pointer"
                        >
                          <Keyboard className="size-3.5 text-rose-500" />
                          <span>3. Gõ Từ</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}

                {/* Card "+ Tạo bài học mới" ở cuối danh sách dành cho Giáo viên / Admin */}
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={openCreateLesson}
                    className="group w-full rounded-2xl border-2 border-dashed border-emerald-300/80 dark:border-emerald-800/70 bg-emerald-50/25 dark:bg-emerald-950/15 hover:bg-emerald-50/75 dark:hover:bg-emerald-950/35 hover:border-emerald-500 p-5 flex items-center justify-center gap-3.5 transition-all duration-200 cursor-pointer"
                  >
                    <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all duration-200 group-hover:scale-105 shrink-0">
                      <Plus className="size-6 stroke-[2.75]" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        Tạo bài học mới trong lớp {classInfo?.code || ""}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Bấm để thêm Lesson mới rồi nhập từ vựng hoặc nhờ AI tạo tự động
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* MODAL: CÀI ĐẶT PHIÊN HỌC */}
        <StudySettingsModal
          isOpen={showStudySettingsModal}
          onClose={() => setShowStudySettingsModal(false)}
          settings={studySettings}
          onChange={updateSettings}
        />

        {/* MODAL: TẠO BÀI HỌC MỚI TRONG LỚP */}
        {showCreateLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
                    <Plus className="size-5 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Tạo Bài Học Mới
                    </h3>
                    <p className="text-xs text-slate-500">
                      Thuộc lớp: <span className="font-bold text-emerald-600">{classInfo?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateLessonModal(false)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateLesson} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bài số <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={lessonForm.lessonNumber}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          lessonNumber: Number(e.target.value) || 1,
                        })
                      }
                      className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nhãn chủ đề ngắn (Tag)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Articles & Reports"
                      value={lessonForm.tag}
                      onChange={(e) => setLessonForm({ ...lessonForm, tag: e.target.value })}
                      className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên bài học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lesson 8: A. Reading - Articles & Reports"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kỹ năng mục tiêu / Mô tả
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Target skills: Reading Part 7: Articles & Reports | Writing: Review for Questions 6&7"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateLessonModal(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/30 cursor-pointer"
                  >
                    {isSubmitting ? "Đang tạo..." : "Tạo Bài Học"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: QUẢN LÝ BÀI HỌC (SỬA THÔNG TIN / NHẬP TỪ VỰNG JSON / XÓA BÀI) */}
        {editingLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Settings className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Cài Đặt Bài Học
                    </h3>
                    <p className="text-xs text-slate-500">
                      Quản lý từ vựng hoặc chỉnh sửa thông tin bài học
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="size-8 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Quick Link to Manage Words / Import JSON */}
              <Link
                href={`/topics/${editingLesson.slug || editingLesson._id}?mode=list&action=add`}
                onClick={() => playClickSound()}
                className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileJson className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                      Quản lý &amp; Nhập từ vựng (Form / JSON)
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Hiện có {editingLesson.wordCount} từ vựng — Bấm để thêm, sửa, xóa hoặc import JSON
                    </div>
                  </div>
                </div>
                <Plus className="size-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
              </Link>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleUpdateLesson} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bài số
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={lessonForm.lessonNumber}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          lessonNumber: Number(e.target.value) || 1,
                        })
                      }
                      className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nhãn chủ đề ngắn (Tag)
                    </label>
                    <input
                      type="text"
                      value={lessonForm.tag}
                      onChange={(e) => setLessonForm({ ...lessonForm, tag: e.target.value })}
                      className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên bài học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kỹ năng mục tiêu / Mô tả
                  </label>
                  <textarea
                    rows={2}
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleDeleteLesson}
                    disabled={isSubmitting}
                    className="h-10 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa bài học
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingLesson(null)}
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

export default function VocabClassDetailPage() {
  return (
    <Suspense fallback={<VocabClassDetailSkeleton />}>
      <VocabClassDetailInner />
    </Suspense>
  );
}
