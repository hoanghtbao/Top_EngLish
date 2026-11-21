"use client";

import React, { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Send, Users, X } from "lucide-react";
import { fetchApi } from "../lib/api-client";

interface ClassroomOption {
  _id: string;
  name: string;
  code: string;
  gradeLevel?: string;
  students?: any[];
}

interface AssignGrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: { _id: string; title: string } | null;
  onAssigned: (message: string) => void;
}

export function AssignGrammarModal({
  isOpen,
  onClose,
  lesson,
  onAssigned,
}: AssignGrammarModalProps) {
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !lesson) return;
    setErrorMsg(null);
    setSelectedIds([]);
    // Default deadline: +7 days at 23:59 local format for datetime-local
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    setDueDate(
      `${nextWeek.getFullYear()}-${pad(nextWeek.getMonth() + 1)}-${pad(nextWeek.getDate())}T23:59`
    );
    setDescription(`Đọc lý thuyết và hoàn thành bài tập thực hành bài "${lesson.title}".`);

    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const res = await fetchApi<ClassroomOption[]>("/classrooms");
        if (res.success && Array.isArray(res.data)) {
          setClassrooms(res.data);
        } else {
          setClassrooms([]);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Không thể tải danh sách lớp học.");
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, [isOpen, lesson]);

  if (!isOpen || !lesson) return null;

  const toggleClass = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 lớp học để giao bài.");
      return;
    }
    if (!dueDate) {
      setErrorMsg("Vui lòng chọn hạn chót (deadline).");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const isoDue = new Date(dueDate).toISOString();
      const res = await fetchApi<{ assignedCount: number; classroomNames: string[] }>(
        `/grammar/${lesson._id}/assign-classrooms`,
        {
          method: "POST",
          body: JSON.stringify({
            classroomIds: selectedIds,
            dueDate: isoDue,
            description: description.trim(),
            maxScore: 100,
          }),
        }
      );

      if (res.success && res.data) {
        onAssigned(
          `Đã giao bài "${lesson.title}" cho ${res.data.assignedCount} lớp (${res.data.classroomNames.join(", ")})!`
        );
        onClose();
      } else {
        setErrorMsg(res.message || "Không thể giao bài cho lớp.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Giao bài thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
              <Send className="size-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Giao bài học cho lớp
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{lesson.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAssign} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="size-3.5 text-emerald-600" /> Chọn lớp học (có thể chọn nhiều lớp)
            </label>

            {loadingClasses ? (
              <div className="p-4 text-xs text-slate-500 text-center">
                Đang tải danh sách lớp học...
              </div>
            ) : classrooms.length === 0 ? (
              <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 text-center">
                Bạn chưa quản lý lớp học nào. Hãy tạo lớp ở mục <strong>Lớp học</strong> trước nhé!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {classrooms.map((cls) => {
                  const checked = selectedIds.includes(cls._id);
                  return (
                    <button
                      key={cls._id}
                      type="button"
                      onClick={() => toggleClass(cls._id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                        checked
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/30"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {cls.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Mã: {cls.code}</span>
                          <span>•</span>
                          <span>{cls.students?.length || 0} học sinh</span>
                        </div>
                      </div>
                      <div
                        className={`size-5 rounded-md flex items-center justify-center border shrink-0 ${
                          checked
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {checked && <CheckCircle2 className="size-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-emerald-600" /> Hạn chót (Deadline)
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Lời dặn dò gửi học sinh
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || classrooms.length === 0}
              className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>{submitting ? "Đang giao bài..." : `Giao cho ${selectedIds.length} lớp`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
