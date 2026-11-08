/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Trang chi tiết lớp học: Danh sách bài tập, Quản lý học viên, Chấm điểm và Sổ điểm xếp hạng
 */

"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  Flame,
  GraduationCap,
  HelpCircle,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/auth-context";
import { fetchApi } from "../../../lib/api-client";
import AppLayout from "../../../components/AppLayout";
import UserAvatar from "../../../components/UserAvatar";

interface TeacherInfo {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

interface StudentInfo {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  streak: number;
  totalXP: number;
  createdAt: string;
}

interface ClassroomDetail {
  _id: string;
  name: string;
  code: string;
  description: string;
  gradeLevel: string;
  themeColor: string;
  teacher: TeacherInfo;
  students: StudentInfo[];
  studentCount: number;
  isTeacher: boolean;
  isEnrolled: boolean;
  maxStudents: number;
}

interface AssignmentItem {
  _id: string;
  title: string;
  description: string;
  type: "quiz" | "vocabulary" | "grammar" | "custom";
  targetId?: string;
  targetTitle?: string;
  dueDate: string;
  maxScore: number;
  isOverdue: boolean;
  totalSubmissions: number;
  mySubmission?: {
    _id: string;
    status: "submitted" | "graded" | "late";
    score: number | null;
    teacherFeedback?: string;
    submittedAt: string;
    gradedAt?: string;
  } | null;
}

interface GradebookData {
  classroomId: string;
  className: string;
  totalStudents: number;
  totalAssignments: number;
  assignments: {
    _id: string;
    title: string;
    type: string;
    dueDate: string;
    maxScore: number;
  }[];
  students: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
    streak: number;
    totalXP: number;
    completedAssignments: number;
    averageScore: number;
    scores: Record<string, { status: string; score: number | null }>;
  }[];
  leaderboard: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
    streak: number;
    totalXP: number;
    completedAssignments: number;
    averageScore: number;
  }[];
}

interface SubmissionItem {
  _id: string;
  student: StudentInfo;
  status: "submitted" | "graded" | "late";
  score: number | null;
  content: string;
  teacherFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

function ClassroomDetailContent() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params?.id as string;
  const { user, isAuthenticated } = useAuth();

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [gradebook, setGradebook] = useState<GradebookData | null>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "students" | "gradebook">(
    "assignments",
  );
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal 1: Create Assignment (Teacher)
  const [isCreateAsgOpen, setIsCreateAsgOpen] = useState(false);
  const [asgForm, setAsgForm] = useState({
    title: "",
    description: "",
    type: "quiz" as "quiz" | "vocabulary" | "grammar" | "custom",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    maxScore: 100,
  });

  // Modal 2: Submit Assignment (Student)
  const [submitModalAsg, setSubmitModalAsg] = useState<AssignmentItem | null>(null);
  const [submitContent, setSubmitContent] = useState("");

  // Modal 3: View & Grade Submissions (Teacher)
  const [gradeModalAsg, setGradeModalAsg] = useState<AssignmentItem | null>(null);
  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Common Modal Messages
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const isTeacher =
    classroom?.isTeacher ||
    user?.role === "teacher" ||
    user?.role === "admin";

  const loadData = useCallback(async () => {
    if (!classroomId) return;
    try {
      setLoading(true);
      const [clsRes, asgRes] = await Promise.all([
        fetchApi<ClassroomDetail>(`/classrooms/${classroomId}`),
        fetchApi<AssignmentItem[]>(`/classrooms/${classroomId}/assignments`),
      ]);

      if (clsRes.success) setClassroom(clsRes.data);
      if (asgRes.success) setAssignments(asgRes.data);
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin lớp học:", err);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  const loadGradebook = useCallback(async () => {
    if (!classroomId) return;
    try {
      const gbRes = await fetchApi<GradebookData>(
        `/classrooms/${classroomId}/gradebook`,
      );
      if (gbRes.success) {
        setGradebook(gbRes.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải sổ điểm:", err);
    }
  }, [classroomId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (activeTab === "gradebook" && isAuthenticated) {
      loadGradebook();
    }
  }, [activeTab, isAuthenticated, loadGradebook]);

  const handleCopyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMsg(null);

    if (!asgForm.title.trim()) {
      setModalMsg({ type: "error", text: "Vui lòng nhập tiêu đề bài tập" });
      return;
    }

    try {
      setModalLoading(true);
      const res = await fetchApi(`/classrooms/${classroomId}/assignments`, {
        method: "POST",
        body: JSON.stringify({
          ...asgForm,
          dueDate: new Date(asgForm.dueDate).toISOString(),
        }),
      });

      if (res.success) {
        setModalMsg({ type: "success", text: "Đã giao bài tập mới thành công!" });
        setAsgForm({
          title: "",
          description: "",
          type: "quiz",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
          maxScore: 100,
        });
        await loadData();
        setTimeout(() => {
          setIsCreateAsgOpen(false);
          setModalMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message || "Không thể tạo bài tập" });
    } finally {
      setModalLoading(false);
    }
  };

  // Student Submit Assignment
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalAsg) return;
    setModalMsg(null);

    try {
      setModalLoading(true);
      const res = await fetchApi(`/assignments/${submitModalAsg._id}/submit`, {
        method: "POST",
        body: JSON.stringify({ content: submitContent }),
      });

      if (res.success) {
        setModalMsg({ type: "success", text: "Nộp bài thành công!" });
        setSubmitContent("");
        await loadData();
        setTimeout(() => {
          setSubmitModalAsg(null);
          setModalMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message || "Không thể nộp bài" });
    } finally {
      setModalLoading(false);
    }
  };

  // Open Teacher Submissions Modal
  const openSubmissionsModal = async (asg: AssignmentItem) => {
    setGradeModalAsg(asg);
    setLoadingSubmissions(true);
    setGradingSubId(null);
    setModalMsg(null);
    try {
      const res = await fetchApi<SubmissionItem[]>(
        `/assignments/${asg._id}/submissions`,
      );
      if (res.success) {
        setSubmissionsList(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải bài nộp:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Teacher Grade Submission
  const handleGradeSubmission = async (subId: string) => {
    setModalMsg(null);
    try {
      setModalLoading(true);
      const res = await fetchApi(`/submissions/${subId}/grade`, {
        method: "PATCH",
        body: JSON.stringify({
          score: Number(gradeScore),
          teacherFeedback: gradeFeedback,
        }),
      });

      if (res.success) {
        setModalMsg({ type: "success", text: "Đã chấm điểm thành công!" });
        // Refresh submissions
        if (gradeModalAsg) {
          const updated = await fetchApi<SubmissionItem[]>(
            `/assignments/${gradeModalAsg._id}/submissions`,
          );
          if (updated.success) setSubmissionsList(updated.data);
        }
        await loadData();
        setGradingSubId(null);
      }
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message || "Không thể lưu điểm" });
    } finally {
      setModalLoading(false);
    }
  };

  // Remove Student (Teacher only)
  const handleRemoveStudent = async (studentId: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học viên "${name}" ra khỏi lớp học?`)) {
      return;
    }
    try {
      const res = await fetchApi(
        `/classrooms/${classroomId}/students/${studentId}`,
        {
          method: "DELETE",
        },
      );
      if (res.success) {
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || "Không thể xóa học viên");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 animate-pulse">
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </AppLayout>
    );
  }

  if (!classroom) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center gap-4 text-center">
          <div className="size-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="text-xl font-bold">Không tìm thấy lớp học này</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            Lớp học không tồn tại hoặc bạn chưa được cấp quyền truy cập.
          </p>
          <Link
            href="/classrooms"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm"
          >
            <ArrowLeft className="size-4" />
            <span>Quay lại danh sách lớp</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* BREADCRUMB & BACK LINK */}
      <div className="flex items-center justify-between">
        <Link
          href="/classrooms"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
        >
          <ArrowLeft className="size-4" />
          <span>Tất cả lớp học</span>
        </Link>
      </div>

      {/* CLASSROOM BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 sm:p-6 text-white shadow-lg shadow-emerald-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[10px] font-semibold border border-white/20">
                {classroom.gradeLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur text-[10px] font-semibold border border-white/10 flex items-center gap-1.5">
                <Users className="size-3" />
                <span>{classroom.studentCount} học viên</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {classroom.name}
            </h1>

            <p className="text-emerald-50 text-xs leading-relaxed max-w-lg">
              {classroom.description || "Chưa có mô tả chi tiết cho lớp học này."}
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-100 mt-0.5">
              <GraduationCap className="size-3.5" />
              <span>Phụ trách: <strong>{classroom.teacher?.fullName}</strong></span>
              <span className="opacity-50">•</span>
              <span>{classroom.teacher?.email}</span>
            </div>
          </div>

          {/* Classroom Code Card */}
          <div className="flex flex-col items-start md:items-end gap-1.5 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 self-start md:self-auto shrink-0">
            <span className="text-[10px] font-medium text-emerald-200 uppercase tracking-wider">
              Mã mời vào lớp
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-mono font-black tracking-widest text-white">
                {classroom.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="size-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
                title="Sao chép mã lớp"
              >
                {copiedCode ? (
                  <Check className="size-3.5 text-emerald-300" />
                ) : (
                  <Copy className="size-3.5 text-white" />
                )}
              </button>
            </div>
            {copiedCode && (
              <span className="text-[10px] text-emerald-300 font-medium">
                Đã sao chép!
              </span>
            )}
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 size-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab("assignments")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
            activeTab === "assignments"
              ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <BookOpen className="size-3.5" />
          <span>Bài tập & Nhiệm vụ ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
            activeTab === "students"
              ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="size-3.5" />
          <span>Thành viên ({classroom.studentCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("gradebook")}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
            activeTab === "gradebook"
              ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Trophy className="size-3.5" />
          <span>Sổ điểm & Bảng xếp hạng</span>
        </button>
      </div>

      {/* TAB 1: BÀI TẬP & NHIỆM VỤ */}
      {activeTab === "assignments" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Danh Sách Bài Tập Cần Hoàn Thành
              </h2>
              <p className="text-xs text-slate-500">
                {isTeacher
                  ? "Giao bài tập mới và chấm điểm bài nộp của học viên"
                  : "Hoàn thành bài tập trước hạn nộp để nhận điểm và XP"}
              </p>
            </div>

            {isTeacher && (
              <button
                onClick={() => {
                  setModalMsg(null);
                  setIsCreateAsgOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer min-h-[44px]"
              >
                <Plus className="size-4" />
                <span>Giao bài tập mới</span>
              </button>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
              <div className="size-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <BookOpen className="size-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Lớp học chưa có bài tập nào
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {isTeacher
                  ? "Hãy bấm 'Giao bài tập mới' để tạo bài kiểm tra Quiz hoặc từ vựng cho lớp."
                  : "Giáo viên chưa giao bài tập nào. Hãy kiểm tra lại sau nhé!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((asg) => {
                const sub = asg.mySubmission;
                const isSubmitted = !!sub;
                const isGraded = sub?.status === "graded";
                const isOverdue = asg.isOverdue && !isSubmitted;

                return (
                  <div
                    key={asg._id}
                    className="flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition gap-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {asg.type === "quiz"
                            ? "Bài thi Quiz"
                            : asg.type === "vocabulary"
                            ? "Từ vựng Flashcard"
                            : asg.type === "grammar"
                            ? "Ngữ pháp"
                            : "Tự luận"}
                        </span>

                        {/* Status for Student */}
                        {!isTeacher && (
                          <div>
                            {isGraded ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle className="size-3.5" />
                                <span>{sub?.score} / {asg.maxScore} đ</span>
                              </span>
                            ) : isSubmitted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                <Clock className="size-3.5" />
                                <span>Đã nộp (Chờ chấm)</span>
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <AlertCircle className="size-3.5" />
                                <span>Quá hạn</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <Clock className="size-3.5" />
                                <span>Chưa nộp</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Status for Teacher */}
                        {isTeacher && (
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <UserCheck className="size-3.5 text-emerald-600" />
                            <span>
                              Đã nộp: <strong>{asg.totalSubmissions}</strong> /{" "}
                              {classroom.studentCount}
                            </span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                        {asg.title}
                      </h3>

                      {asg.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {asg.description}
                        </p>
                      )}

                      {/* Teacher Feedback Note if student view */}
                      {!isTeacher && sub?.teacherFeedback && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs flex flex-col gap-1">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <MessageSquare className="size-3.5" />
                            Nhận xét của Giáo viên:
                          </span>
                          <p className="text-emerald-700 dark:text-emerald-400 italic">
                            "{sub.teacherFeedback}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-400" />
                        <span>
                          Hạn chót:{" "}
                          <strong>
                            {new Date(asg.dueDate).toLocaleDateString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </strong>
                        </span>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center gap-2">
                        {isTeacher ? (
                          <button
                            onClick={() => openSubmissionsModal(asg)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition cursor-pointer min-h-[36px]"
                          >
                            Xem bài nộp & Chấm điểm
                          </button>
                        ) : !isSubmitted ? (
                          <button
                            onClick={() => {
                              setModalMsg(null);
                              setSubmitContent("");
                              setSubmitModalAsg(asg);
                            }}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer min-h-[36px]"
                          >
                            Làm bài & Nộp ngay
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setModalMsg(null);
                              setSubmitContent("");
                              setSubmitModalAsg(asg);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer min-h-[36px]"
                          >
                            Cập nhật bài nộp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DANH SÁCH THÀNH VIÊN */}
      {activeTab === "students" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Danh Sách Học Viên Trong Lớp
              </h2>
              <p className="text-xs text-slate-500">
                Tổng cộng {classroom.studentCount} thành viên đã tham gia
              </p>
            </div>
          </div>

          {classroom.students.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
              <Users className="size-10 text-slate-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chưa có học viên nào tham gia
              </h3>
              <p className="text-xs text-slate-500">
                Hãy chia sẻ mã lớp <strong>{classroom.code}</strong> cho học viên của bạn!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classroom.students.map((stu) => (
                <div
                  key={stu._id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatar={stu.avatar}
                      fullName={stu.fullName}
                      size="md"
                      className="shadow-sm"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {stu.fullName}
                      </span>
                      <span className="text-xs text-slate-400 line-clamp-1">
                        {stu.email}
                      </span>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Flame className="size-3 text-orange-500" />
                          <span>{stu.streak || 0} ngày</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="size-3 text-amber-500" />
                          <span>{stu.totalXP || 0} XP</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {isTeacher && (
                    <button
                      onClick={() => handleRemoveStudent(stu._id, stu.fullName)}
                      className="size-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition cursor-pointer"
                      title="Xóa khỏi lớp học"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SỔ ĐIỂM & BẢNG XẾP HẠNG */}
      {activeTab === "gradebook" && (
        <div className="flex flex-col gap-8">
          {/* LEADERBOARD PODIUM */}
          {gradebook && gradebook.leaderboard.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <span>Bảng Xếp Hạng Thi Đua Lớp Học</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {gradebook.leaderboard.slice(0, 3).map((stu, index) => {
                  const medalColors = [
                    "from-amber-400 to-yellow-600 border-amber-300 text-amber-950",
                    "from-slate-300 to-slate-400 border-slate-300 text-slate-900",
                    "from-amber-600 to-orange-700 border-orange-400 text-white",
                  ];
                  return (
                    <div
                      key={stu._id}
                      className="relative flex flex-col items-center text-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md gap-3"
                    >
                      <div
                        className={`size-8 rounded-full bg-gradient-to-tr ${medalColors[index]} font-black text-xs flex items-center justify-center shadow-md`}
                      >
                        Top {index + 1}
                      </div>

                      <UserAvatar
                        avatar={stu.avatar}
                        fullName={stu.fullName}
                        size="xl"
                        className="shadow-md"
                      />

                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {stu.fullName}
                        </span>
                        <span className="text-xs text-slate-400">{stu.email}</span>
                      </div>

                      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ĐTB: {stu.averageScore} đ
                        </span>
                        <span className="opacity-40">•</span>
                        <span className="font-semibold text-slate-500">
                          {stu.completedAssignments} bài nộp
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GRADEBOOK MATRIX TABLE */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="size-5 text-emerald-600" />
              <span>Sổ Điểm Tổng Hợp Toàn Lớp</span>
            </h2>

            {!gradebook || gradebook.students.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                Chưa có dữ liệu bài tập hoặc học viên để hiển thị sổ điểm.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Học viên</th>
                      <th className="px-4 py-3 text-center">ĐTB</th>
                      <th className="px-4 py-3 text-center">Đã nộp</th>
                      {gradebook.assignments.map((asg) => (
                        <th
                          key={asg._id}
                          className="px-4 py-3 text-center max-w-[120px] truncate"
                          title={asg.title}
                        >
                          {asg.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {gradebook.students.map((stu) => (
                      <tr
                        key={stu._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {stu.fullName}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {stu.averageScore}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {stu.completedAssignments} / {gradebook.assignments.length}
                        </td>
                        {gradebook.assignments.map((asg) => {
                          const res = stu.scores[asg._id];
                          const score = res?.score;
                          const hasScore = score !== null && score !== undefined;

                          return (
                            <td key={asg._id} className="px-4 py-3 text-center">
                              {hasScore ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                    score >= 80
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                      : score >= 50
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                  }`}
                                >
                                  {score}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-bold">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: GIÁO VIÊN GIAO BÀI TẬP */}
      {isCreateAsgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Giao Bài Tập Mới
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bài tập sẽ hiển thị ngay cho toàn bộ học viên trong lớp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateAsgOpen(false)}
                className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  modalMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                }`}
              >
                {modalMsg.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tiêu đề bài tập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ôn tập 30 từ vựng Chủ đề Công nghệ"
                  value={asgForm.title}
                  onChange={(e) =>
                    setAsgForm({ ...asgForm, title: e.target.value })
                  }
                  className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phân loại bài tập
                  </label>
                  <select
                    value={asgForm.type}
                    onChange={(e: any) =>
                      setAsgForm({ ...asgForm, type: e.target.value })
                    }
                    className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="quiz">Trắc nghiệm Quiz</option>
                    <option value="vocabulary">Từ vựng Flashcard</option>
                    <option value="grammar">Bài học Ngữ pháp</option>
                    <option value="custom">Tự luận / Tự chọn</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Điểm số tối đa
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={asgForm.maxScore}
                    onChange={(e) =>
                      setAsgForm({ ...asgForm, maxScore: Number(e.target.value) })
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hạn chót nộp bài (Due Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={asgForm.dueDate}
                  onChange={(e) =>
                    setAsgForm({ ...asgForm, dueDate: e.target.value })
                  }
                  className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hướng dẫn làm bài
                </label>
                <textarea
                  rows={3}
                  placeholder="Yêu cầu học viên ôn lại kiến thức trước khi làm, làm bài cẩn thận..."
                  value={asgForm.description}
                  onChange={(e) =>
                    setAsgForm({ ...asgForm, description: e.target.value })
                  }
                  className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAsgOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition min-h-[44px]"
                >
                  {modalLoading ? "Đang giao..." : "Xác nhận giao bài"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HỌC VIÊN NỘP BÀI TẬP */}
      {submitModalAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Send className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Nộp Bài Tập
                  </h3>
                  <p className="text-xs text-slate-500">
                    {submitModalAsg.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubmitModalAsg(null)}
                className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  modalMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                }`}
              >
                {modalMsg.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAssignment} className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Hạn chót nộp bài:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {new Date(submitModalAsg.dueDate).toLocaleString("vi-VN")}
                  </strong>
                </div>
                {submitModalAsg.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-2 border-t border-slate-200 dark:border-slate-700">
                    "{submitModalAsg.description}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nội dung bài làm / Báo cáo hoàn thành <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Ghi chú kết quả học tập của bạn, các câu hỏi đã trả lời, hoặc nội dung bài làm chi tiết..."
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalAsg(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition min-h-[44px]"
                >
                  {modalLoading ? "Đang nộp..." : "Xác nhận nộp bài"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GIÁO VIÊN XEM BÀI NỘP & CHẤM ĐIỂM */}
      {gradeModalAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Bài Làm Đã Nộp Của Học Viên
                  </h3>
                  <p className="text-xs text-slate-500">
                    {gradeModalAsg.title} ({submissionsList.length} bài nộp)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGradeModalAsg(null)}
                className="size-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  modalMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                }`}
              >
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{modalMsg.text}</span>
              </div>
            )}

            <div className="overflow-y-auto flex-1 flex flex-col gap-4 pr-1">
              {loadingSubmissions ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Đang tải danh sách bài nộp...
                </div>
              ) : submissionsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Chưa có học viên nào nộp bài tập này.
                </div>
              ) : (
                submissionsList.map((sub) => {
                  const isGradingThis = gradingSubId === sub._id;
                  return (
                    <div
                      key={sub._id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            avatar={sub.student?.avatar}
                            fullName={sub.student?.fullName}
                            size="sm"
                            className="shadow-xs"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {sub.student?.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {sub.score !== null ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs">
                              {sub.score} / {gradeModalAsg.maxScore} điểm
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-xs">
                              Chưa chấm
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setGradingSubId(isGradingThis ? null : sub._id);
                              setGradeScore(sub.score || 100);
                              setGradeFeedback(sub.teacherFeedback || "");
                            }}
                            className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                          >
                            {isGradingThis ? "Đóng" : "Chấm điểm"}
                          </button>
                        </div>
                      </div>

                      {/* Student Submitted Content */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {sub.content || "Học viên không để lại ghi chú bài nộp."}
                      </div>

                      {/* Grading Form */}
                      {isGradingThis && (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex flex-col gap-3 mt-1">
                          <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                              Điểm số (0 - {gradeModalAsg.maxScore}):
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={gradeModalAsg.maxScore}
                              value={gradeScore}
                              onChange={(e) => setGradeScore(Number(e.target.value))}
                              className="w-24 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 text-xs font-bold text-center text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                              Lời nhận xét / Góp ý cho học viên:
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Nhận xét ưu điểm, chỉ ra các lỗi cần khắc phục..."
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 text-xs text-slate-900 dark:text-white resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleGradeSubmission(sub._id)}
                              disabled={modalLoading}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer min-h-[36px]"
                            >
                              {modalLoading ? "Đang lưu..." : "Lưu điểm & Nhận xét"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}

export default function ClassroomDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col gap-6 animate-pulse">
          <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      }
    >
      <ClassroomDetailContent />
    </Suspense>
  );
}
