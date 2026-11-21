"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Compass,
  FileText,
  ListChecks,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { fetchApi } from "../lib/api-client";

export interface GrammarExampleItem {
  en: string;
  vi: string;
  note?: string;
}

export interface GrammarMistakeItem {
  wrong: string;
  correct: string;
  reason: string;
}

export interface GrammarExerciseItem {
  type: "mcq" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface GrammarStructureItem {
  badge: string;
  label: string;
  pattern: string;
  color?: string;
  note?: string;
}

export interface GrammarLessonData {
  _id?: string;
  title: string;
  slug?: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  category: string;
  status?: "draft" | "published";
  summary: string;
  formula?: {
    positive?: string;
    negative?: string;
    question?: string;
  };
  structures?: GrammarStructureItem[];
  usage?: string[];
  signals?: string[];
  examples?: GrammarExampleItem[];
  commonMistakes?: GrammarMistakeItem[];
  exercises?: GrammarExerciseItem[];
  content?: string;
  order?: number;
}

interface GrammarEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLesson: GrammarLessonData | null;
  onSaved: (saved: any, isEdit: boolean) => void;
}

const CATEGORY_SUGGESTIONS = [
  "Tenses",
  "Passive Voice",
  "Conditionals",
  "Comparisons",
  "Relative Clauses",
  "Reported Speech",
  "Modal Verbs",
  "Gerunds & Infinitives",
  "Prepositions",
  "Inversion & Emphasis",
];

const FORMULA_PRESETS: Array<{ name: string; items: GrammarStructureItem[] }> = [
  {
    name: "3 thể (+ / - / ?)",
    items: [
      { badge: "+", label: "Thể Khẳng định", pattern: "", color: "emerald", note: "" },
      { badge: "-", label: "Thể Phủ định", pattern: "", color: "rose", note: "" },
      { badge: "?", label: "Thể Nghi vấn", pattern: "", color: "sky", note: "" },
    ],
  },
  {
    name: "Điều kiện (If)",
    items: [
      { badge: "If", label: "Cấu trúc chuẩn", pattern: "If + S + V(...), S + will/would + V", color: "emerald", note: "" },
      { badge: "!", label: "Biến thể với Unless", pattern: "Unless + S + V(khẳng định), ...", color: "amber", note: "Unless = If ... not" },
      { badge: "⇄", label: "Dạng Đảo ngữ", pattern: "Should / Were / Had + S + ..., ...", color: "indigo", note: "Trang trọng hơn khi lược bỏ If" },
    ],
  },
  {
    name: "So sánh",
    items: [
      { badge: "=", label: "So sánh bằng", pattern: "S + V + as + adj/adv + as + O", color: "emerald", note: "" },
      { badge: ">", label: "So sánh hơn", pattern: "S + V + adj-er / more + adj + than + O", color: "sky", note: "" },
      { badge: "★", label: "So sánh nhất", pattern: "S + V + the + adj-est / most + adj + (N)", color: "amber", note: "" },
      { badge: "↗", label: "So sánh kép", pattern: "The + adj-er/more..., the + adj-er/more...", color: "purple", note: "Càng... càng..." },
    ],
  },
  {
    name: "Mệnh đề quan hệ",
    items: [
      { badge: "👤", label: "Chỉ người (who / whom)", pattern: "N (person) + who/whom + (S) + V...", color: "emerald", note: "" },
      { badge: "📦", label: "Chỉ vật / Sở hữu", pattern: "N (thing) + which/that... | N + whose + N", color: "sky", note: "" },
      { badge: "✂", label: "Rút gọn mệnh đề", pattern: "N + V-ing (chủ động) / V3-ed (bị động) / to V", color: "indigo", note: "" },
    ],
  },
  {
    name: "Tường thuật",
    items: [
      { badge: "💬", label: "Câu trần thuật", pattern: "S + said/told O + (that) + S + V(lùi thì)", color: "emerald", note: "" },
      { badge: "?", label: "Câu hỏi Yes/No & Wh-", pattern: "S + asked + O + if/whether/Wh- + S + V(lùi thì)", color: "sky", note: "" },
      { badge: "!", label: "Mệnh lệnh / Đề nghị", pattern: "S + told/asked + O + (not) to V", color: "amber", note: "" },
    ],
  },
];

const BADGE_COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  sky: "bg-sky-600",
  amber: "bg-amber-500",
  indigo: "bg-indigo-600",
  purple: "bg-purple-600",
};

function hydrateStructuresFromLesson(lesson: GrammarLessonData): GrammarStructureItem[] {
  if (Array.isArray(lesson.structures) && lesson.structures.length > 0) {
    return lesson.structures.map((s) => ({
      badge: s.badge || "•",
      label: s.label || "Cấu trúc",
      pattern: s.pattern || "",
      color: s.color || "emerald",
      note: s.note || "",
    }));
  }
  const derived: GrammarStructureItem[] = [];
  if (lesson.formula?.positive) {
    derived.push({ badge: "+", label: "Thể Khẳng định", pattern: lesson.formula.positive, color: "emerald", note: "" });
  }
  if (lesson.formula?.negative) {
    derived.push({ badge: "-", label: "Thể Phủ định", pattern: lesson.formula.negative, color: "rose", note: "" });
  }
  if (lesson.formula?.question) {
    derived.push({ badge: "?", label: "Thể Nghi vấn", pattern: lesson.formula.question, color: "sky", note: "" });
  }
  return derived.length > 0 ? derived : FORMULA_PRESETS[0].items.map((x) => ({ ...x }));
}

export function GrammarEditorModal({
  isOpen,
  onClose,
  editingLesson,
  onSaved,
}: GrammarEditorModalProps) {
  const isEdit = Boolean(editingLesson?._id);

  // Basic Info
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tenses");
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2" | "C1" | "C2">("B1");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [summary, setSummary] = useState("");

  // Dynamic Flexible Structures (works for ALL grammar types!)
  const [structures, setStructures] = useState<GrammarStructureItem[]>(
    FORMULA_PRESETS[0].items.map((x) => ({ ...x }))
  );

  // Usage, Signals & Content
  const [usageText, setUsageText] = useState("");
  const [signalsText, setSignalsText] = useState("");
  const [content, setContent] = useState("");

  // Dynamic arrays
  const [examples, setExamples] = useState<GrammarExampleItem[]>([
    { en: "", vi: "", note: "" },
  ]);
  const [commonMistakes, setCommonMistakes] = useState<GrammarMistakeItem[]>([]);
  const [exercises, setExercises] = useState<GrammarExerciseItem[]>([]);

  // AI Helpers
  const [aiTopicPrompt, setAiTopicPrompt] = useState("");
  const [aiLessonLoading, setAiLessonLoading] = useState(false);
  const [aiExerciseCount, setAiExerciseCount] = useState(5);
  const [aiExerciseType, setAiExerciseType] = useState<"mixed" | "mcq" | "fill_blank">("mixed");
  const [aiExerciseLoading, setAiExerciseLoading] = useState(false);

  // Form states
  const [activeSection, setActiveSection] = useState<"info" | "examples" | "exercises">("info");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiBanner, setAiBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setAiBanner(null);
    setActiveSection("info");

    if (editingLesson) {
      setTitle(editingLesson.title || "");
      setCategory(editingLesson.category || "Tenses");
      setLevel(editingLesson.level || "B1");
      setStatus(editingLesson.status || "published");
      setSummary(editingLesson.summary || "");
      setStructures(hydrateStructuresFromLesson(editingLesson));
      setUsageText((editingLesson.usage || []).join("\n"));
      setSignalsText((editingLesson.signals || []).join(", "));
      setContent(editingLesson.content || "");
      setExamples(
        editingLesson.examples && editingLesson.examples.length > 0
          ? editingLesson.examples.map((e) => ({ en: e.en, vi: e.vi, note: e.note || "" }))
          : [{ en: "", vi: "", note: "" }]
      );
      setCommonMistakes(
        editingLesson.commonMistakes
          ? editingLesson.commonMistakes.map((m) => ({ ...m }))
          : []
      );
      setExercises(
        editingLesson.exercises
          ? editingLesson.exercises.map((ex) => ({
              ...ex,
              options: ex.options ? [...ex.options] : [],
            }))
          : []
      );
      setAiTopicPrompt(editingLesson.title || "");
    } else {
      setTitle("");
      setCategory("Tenses");
      setLevel("B1");
      setStatus("published");
      setSummary("");
      setStructures(FORMULA_PRESETS[0].items.map((x) => ({ ...x })));
      setUsageText("");
      setSignalsText("");
      setContent("");
      setExamples([{ en: "", vi: "", note: "" }]);
      setCommonMistakes([]);
      setExercises([]);
      setAiTopicPrompt("");
    }
  }, [isOpen, editingLesson]);

  if (!isOpen) return null;

  const handleAiDraftLesson = async () => {
    const promptVal = aiTopicPrompt.trim() || title.trim();
    if (!promptVal) {
      setErrorMsg("Vui lòng nhập chủ đề cần AI soạn (ví dụ: Passive Voice - B1)!");
      return;
    }

    try {
      setAiLessonLoading(true);
      setErrorMsg(null);
      setAiBanner(null);

      const res = await fetchApi<{
        provider: string;
        lesson: {
          title: string;
          category: string;
          level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
          summary: string;
          formula: { positive: string; negative: string; question: string };
          structures?: GrammarStructureItem[];
          usage: string[];
          signals: string[];
          examples: GrammarExampleItem[];
          commonMistakes: GrammarMistakeItem[];
          content: string;
        };
      }>("/ai/generate-grammar-lesson", {
        method: "POST",
        body: JSON.stringify({
          topic: promptVal,
          level,
          category,
        }),
      });

      if (res.success && res.data?.lesson) {
        const d = res.data.lesson;
        setTitle(d.title || promptVal);
        setCategory(d.category || category);
        setLevel(d.level || level);
        setSummary(d.summary || "");
        setStructures(hydrateStructuresFromLesson(d));
        setUsageText((d.usage || []).join("\n"));
        setSignalsText((d.signals || []).join(", "));
        setContent(d.content || "");
        if (d.examples?.length > 0) setExamples(d.examples);
        if (d.commonMistakes?.length > 0) setCommonMistakes(d.commonMistakes);
        setAiBanner(
          `AI (${res.data.provider}) đã điền xong khung bài giảng! Hãy kiểm tra và chỉnh sửa nếu cần.`
        );
      } else {
        setErrorMsg(res.message || "AI chưa thể soạn bài gợi ý lúc này.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi gọi trợ lý AI soạn bài.");
    } finally {
      setAiLessonLoading(false);
    }
  };

  const handleAiGenerateExercises = async () => {
    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập Tên bài học trước khi nhờ AI sinh câu hỏi thực hành!");
      return;
    }

    try {
      setAiExerciseLoading(true);
      setErrorMsg(null);
      setAiBanner(null);

      const res = await fetchApi<{
        provider: string;
        exercises: GrammarExerciseItem[];
      }>("/ai/generate-grammar-exercises", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          level,
          summary: summary.trim(),
          formula: {
            positive: structures[0]?.pattern || "",
            negative: structures[1]?.pattern || "",
            question: structures[2]?.pattern || "",
          },
          usage: usageText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          signals: signalsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          count: aiExerciseCount,
          exerciseType: aiExerciseType,
        }),
      });

      if (res.success && Array.isArray(res.data?.exercises)) {
        setExercises(res.data.exercises);
        setAiBanner(
          `AI (${res.data.provider}) đã sinh ${res.data.exercises.length} câu bài tập thực hành gắn vào bài học!`
        );
      } else {
        setErrorMsg(res.message || "Không thể sinh bài tập thực hành.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi sinh bài tập bằng AI.");
    } finally {
      setAiExerciseLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) {
      setErrorMsg("Tên bài học và Chuyên đề không được để trống.");
      return;
    }

    const cleanExamples = examples
      .map((ex) => ({
        en: ex.en.trim(),
        vi: ex.vi.trim(),
        note: ex.note?.trim() || "",
      }))
      .filter((ex) => ex.en && ex.vi);

    const cleanMistakes = commonMistakes
      .map((m) => ({
        wrong: m.wrong.trim(),
        correct: m.correct.trim(),
        reason: m.reason.trim(),
      }))
      .filter((m) => m.wrong && m.correct && m.reason);

    const cleanExercises = exercises
      .map((ex) => ({
        type: ex.type,
        question: ex.question.trim(),
        options:
          ex.type === "mcq"
            ? (ex.options || []).map((o) => o.trim()).filter(Boolean)
            : [],
        correctAnswer: ex.correctAnswer.trim(),
        explanation: ex.explanation?.trim() || "",
      }))
      .filter((ex) => ex.question && ex.correctAnswer);

    const cleanStructures = structures
      .map((s) => ({
        badge: (s.badge || "•").trim(),
        label: s.label.trim(),
        pattern: s.pattern.trim(),
        color: s.color || "emerald",
        note: s.note?.trim() || "",
      }))
      .filter((s) => s.label && s.pattern);

    const posItem = cleanStructures.find((s) => s.badge === "+") || cleanStructures[0];
    const negItem = cleanStructures.find((s) => s.badge === "-");
    const qItem = cleanStructures.find((s) => s.badge === "?");

    const payload = {
      title: title.trim(),
      category: category.trim(),
      level,
      status,
      summary: summary.trim(),
      structures: cleanStructures,
      formula: {
        positive: posItem?.pattern || "",
        negative: negItem?.pattern || "",
        question: qItem?.pattern || "",
      },
      usage: usageText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      signals: signalsText
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      examples: cleanExamples,
      commonMistakes: cleanMistakes,
      exercises: cleanExercises,
      content: content.trim(),
    };

    try {
      setSaving(true);
      setErrorMsg(null);
      const res = isEdit
        ? await fetchApi(`/grammar/${editingLesson!._id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await fetchApi("/grammar", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      if (res.success && res.data) {
        onSaved(res.data, isEdit);
        onClose();
      } else {
        setErrorMsg(res.message || "Không thể lưu bài học ngữ pháp.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi lưu bài học ngữ pháp.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {isEdit ? "Chỉnh sửa bài ngữ pháp" : "Thêm bài ngữ pháp mới"}
              </h2>
              <p className="text-xs text-slate-500">
                Soạn theo mẫu chuẩn hoặc dùng Trợ lý AI điền nhanh khung lý thuyết &amp; bài tập
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="size-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* AI Quick Authoring Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-amber-50/90 via-emerald-50/70 to-teal-50/70 dark:from-amber-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300 shrink-0">
            <Sparkles className="size-4 text-amber-500" />
            <span>Trợ lý AI soạn nhanh:</span>
          </div>
          <input
            type="text"
            placeholder="Nhập chủ đề (VD: Passive Voice - B1, Câu điều kiện loại 2)..."
            value={aiTopicPrompt}
            onChange={(e) => setAiTopicPrompt(e.target.value)}
            className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            disabled={aiLessonLoading}
            onClick={handleAiDraftLesson}
            className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition shrink-0"
          >
            <Sparkles className={`size-3.5 ${aiLessonLoading ? "animate-spin" : ""}`} />
            <span>{aiLessonLoading ? "Đang soạn bài..." : "AI soạn gợi ý"}</span>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection("info")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === "info"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Compass className="size-3.5" /> 1. Khung &amp; Công thức ({structures.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("examples")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === "examples"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <AlertTriangle className="size-3.5" /> 2. Ví dụ ({examples.length}) &amp; Lỗi sai ({commonMistakes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("exercises")}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === "exercises"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListChecks className="size-3.5" /> 3. Bài tập thực hành ({exercises.length})
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {aiBanner && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600 shrink-0" />
              <span>{aiBanner}</span>
            </div>
          )}

          {activeSection === "info" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên bài ngữ pháp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Câu Bị Động (Passive Voice)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Chuyên đề <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="grammar-category-list"
                    placeholder="VD: Tenses, Passive Voice..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="grammar-category-list">
                    {CATEGORY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cấp độ CEFR
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as any)}
                      className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      {["A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
                        <option key={lv} value={lv}>
                          CEFR {lv}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Trạng thái bài
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                      className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="published">Đã xuất bản (Mở)</option>
                      <option value="draft">Nháp (Ẩn học sinh)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tóm tắt ngắn gọn
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả ngắn mục tiêu kiến thức của bài học..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Universal Flexible Formula Builder */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide block">
                      Công thức &amp; Cấu trúc ngữ pháp linh hoạt
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Chọn mẫu có sẵn phù hợp chuyên đề hoặc tự thêm các dạng công thức riêng
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setStructures([
                        ...structures,
                        {
                          badge: String(structures.length + 1),
                          label: "",
                          pattern: "",
                          color: "emerald",
                          note: "",
                        },
                      ])
                    }
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Thêm công thức
                  </button>
                </div>

                {/* Preset Template Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Mẫu nhanh:</span>
                  {FORMULA_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setStructures(preset.items.map((x) => ({ ...x })))}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {structures.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Ký hiệu"
                          title="Ký hiệu (+, -, ?, =, >, If, 1...)"
                          value={st.badge}
                          onChange={(e) => {
                            const next = [...structures];
                            next[idx] = { ...next[idx], badge: e.target.value };
                            setStructures(next);
                          }}
                          className={`w-12 h-8.5 text-center rounded-lg text-xs font-black text-white ${
                            BADGE_COLOR_CLASSES[st.color || "emerald"] || "bg-emerald-600"
                          }`}
                        />

                        <input
                          type="text"
                          placeholder="Tên dạng (VD: Thể khẳng định, So sánh hơn, Đảo ngữ If...)"
                          value={st.label}
                          onChange={(e) => {
                            const next = [...structures];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setStructures(next);
                          }}
                          className="flex-1 min-w-[160px] h-8.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                        />

                        <select
                          value={st.color || "emerald"}
                          onChange={(e) => {
                            const next = [...structures];
                            next[idx] = { ...next[idx], color: e.target.value };
                            setStructures(next);
                          }}
                          className="h-8.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          <option value="emerald">Xanh lá</option>
                          <option value="rose">Đỏ hồng</option>
                          <option value="sky">Xanh dương</option>
                          <option value="amber">Vàng cam</option>
                          <option value="indigo">Chàm</option>
                          <option value="purple">Tím</option>
                        </select>

                        {structures.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setStructures(structures.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                            title="Xóa công thức này"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Công thức (VD: S + V + adj-er + than + O)"
                        value={st.pattern}
                        onChange={(e) => {
                          const next = [...structures];
                          next[idx] = { ...next[idx], pattern: e.target.value };
                          setStructures(next);
                        }}
                        className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />

                      <input
                        type="text"
                        placeholder="Ghi chú ngắn cho công thức này (tùy chọn)..."
                        value={st.note || ""}
                        onChange={(e) => {
                          const next = [...structures];
                          next[idx] = { ...next[idx], note: e.target.value };
                          setStructures(next);
                        }}
                        className="h-8 px-3 rounded-lg bg-slate-50/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cách dùng chính (mỗi dòng 1 ý)
                  </label>
                  <textarea
                    rows={4}
                    placeholder={"Nhấn mạnh đối tượng chịu tác động...\nKhông rõ hoặc không cần nêu chủ thể..."}
                    value={usageText}
                    onChange={(e) => setUsageText(e.target.value)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-y"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dấu hiệu nhận biết (cách nhau bằng dấu phẩy)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="always, usually, by + O, every day..."
                    value={signalsText}
                    onChange={(e) => setSignalsText(e.target.value)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white resize-y"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="size-3.5 text-emerald-600" /> Ghi chú bài giảng chuyên sâu (Markdown)
                </label>
                <textarea
                  rows={4}
                  placeholder="### Lưu ý đặc biệt..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-y"
                />
              </div>
            </div>
          )}

          {activeSection === "examples" && (
            <div className="flex flex-col gap-6">
              {/* Bilingual Examples */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">
                    Ví dụ song ngữ ({examples.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setExamples([...examples, { en: "", vi: "", note: "" }])}
                    className="h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Thêm ví dụ
                  </button>
                </div>

                {examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold text-emerald-600">
                        Ví dụ #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Câu tiếng Anh..."
                      value={ex.en}
                      onChange={(e) => {
                        const next = [...examples];
                        next[idx] = { ...next[idx], en: e.target.value };
                        setExamples(next);
                      }}
                      className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nghĩa tiếng Việt..."
                        value={ex.vi}
                        onChange={(e) => {
                          const next = [...examples];
                          next[idx] = { ...next[idx], vi: e.target.value };
                          setExamples(next);
                        }}
                        className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Ghi chú ngữ pháp (tùy chọn)..."
                        value={ex.note || ""}
                        onChange={(e) => {
                          const next = [...examples];
                          next[idx] = { ...next[idx], note: e.target.value };
                          setExamples(next);
                        }}
                        className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Common Mistakes */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400">
                    Bảng lỗi sai thường gặp ({commonMistakes.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCommonMistakes([
                        ...commonMistakes,
                        { wrong: "", correct: "", reason: "" },
                      ])
                    }
                    className="h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Thêm lỗi sai
                  </button>
                </div>

                {commonMistakes.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có mục lỗi sai. Bấm &quot;+ Thêm lỗi sai&quot; hoặc dùng AI soạn gợi ý ở trên.
                  </p>
                )}

                {commonMistakes.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-rose-600">
                        Lỗi sai #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCommonMistakes(commonMistakes.filter((_, i) => i !== idx))
                        }
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Câu sai (Wrong)..."
                        value={m.wrong}
                        onChange={(e) => {
                          const next = [...commonMistakes];
                          next[idx] = { ...next[idx], wrong: e.target.value };
                          setCommonMistakes(next);
                        }}
                        className="h-9 px-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Câu đúng (Correct)..."
                        value={m.correct}
                        onChange={(e) => {
                          const next = [...commonMistakes];
                          next[idx] = { ...next[idx], correct: e.target.value };
                          setCommonMistakes(next);
                        }}
                        className="h-9 px-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Giải thích lý do..."
                      value={m.reason}
                      onChange={(e) => {
                        const next = [...commonMistakes];
                        next[idx] = { ...next[idx], reason: e.target.value };
                        setCommonMistakes(next);
                      }}
                      className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "exercises" && (
            <div className="flex flex-col gap-4">
              {/* AI Auto-generate Practice Bar */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="size-4 text-amber-500" /> AI tự động sinh bài tập cuối bài
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Sinh nhanh 5–10 câu trắc nghiệm hoặc điền từ từ nội dung ngữ pháp đang soạn.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={aiExerciseCount}
                    onChange={(e) => setAiExerciseCount(Number(e.target.value))}
                    className="h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    {[5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} câu
                      </option>
                    ))}
                  </select>

                  <select
                    value={aiExerciseType}
                    onChange={(e) => setAiExerciseType(e.target.value as any)}
                    className="h-9 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <option value="mixed">Trắc nghiệm + Điền từ</option>
                    <option value="mcq">Chỉ Trắc nghiệm ABCD</option>
                    <option value="fill_blank">Chỉ Điền từ vào chỗ trống</option>
                  </select>

                  <button
                    type="button"
                    disabled={aiExerciseLoading}
                    onClick={handleAiGenerateExercises}
                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className={`size-3.5 ${aiExerciseLoading ? "animate-spin" : ""}`} />
                    <span>{aiExerciseLoading ? "Đang sinh..." : "AI sinh bài tập"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Danh sách câu hỏi ({exercises.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setExercises([
                      ...exercises,
                      {
                        type: "mcq",
                        question: "",
                        options: ["", "", "", ""],
                        correctAnswer: "",
                        explanation: "",
                      },
                    ])
                  }
                  className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Thêm câu thủ công
                </button>
              </div>

              {exercises.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                  Chưa có câu hỏi thực hành nào. Bấm <strong>&quot;AI sinh bài tập&quot;</strong> ở trên để tạo nhanh 5–10 câu!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-emerald-600">
                            Câu #{idx + 1}
                          </span>
                          <select
                            value={ex.type}
                            onChange={(e) => {
                              const nextType = e.target.value as "mcq" | "fill_blank";
                              const next = [...exercises];
                              next[idx] = {
                                ...next[idx],
                                type: nextType,
                                options:
                                  nextType === "mcq"
                                    ? next[idx].options?.length
                                      ? next[idx].options
                                      : ["", "", "", ""]
                                    : [],
                              };
                              setExercises(next);
                            }}
                            className="h-7 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold"
                          >
                            <option value="mcq">Trắc nghiệm ABCD</option>
                            <option value="fill_blank">Điền từ</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExercises(exercises.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Nội dung câu hỏi (dùng ____ cho chỗ trống)..."
                        value={ex.question}
                        onChange={(e) => {
                          const next = [...exercises];
                          next[idx] = { ...next[idx], question: e.target.value };
                          setExercises(next);
                        }}
                        className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      />

                      {ex.type === "mcq" && (
                        <div className="grid grid-cols-2 gap-2">
                          {[0, 1, 2, 3].map((optIdx) => (
                            <input
                              key={optIdx}
                              type="text"
                              placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                              value={ex.options?.[optIdx] || ""}
                              onChange={(e) => {
                                const next = [...exercises];
                                const opts = [...(next[idx].options || ["", "", "", ""])];
                                opts[optIdx] = e.target.value;
                                next[idx] = { ...next[idx], options: opts };
                                setExercises(next);
                              }}
                              className="h-8.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                            />
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Đáp án đúng chính xác..."
                          value={ex.correctAnswer}
                          onChange={(e) => {
                            const next = [...exercises];
                            next[idx] = { ...next[idx], correctAnswer: e.target.value };
                            setExercises(next);
                          }}
                          className="h-9 px-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Giải thích đáp án..."
                          value={ex.explanation || ""}
                          onChange={(e) => {
                            const next = [...exercises];
                            next[idx] = { ...next[idx], explanation: e.target.value };
                            setExercises(next);
                          }}
                          className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-10.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 cursor-pointer transition"
            >
              {saving
                ? "Đang lưu bài học..."
                : isEdit
                ? "Lưu thay đổi"
                : "Tạo bài ngữ pháp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
