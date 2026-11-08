/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Bot Gia sư AI 24/7 toàn trang (Floating AI Tutor Widget) với đôi mắt robot phát sáng màu xanh ngọc nhấp nháy theo thời gian thực
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { fetchApi } from "../lib/api-client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "assistant",
  content:
    "Xin chào! Mình là **Gia sư AI** của TopEnglish 🤖.\n\nBạn có thắc mắc gì về **từ vựng**, **ngữ pháp**, **dịch thuật** hay muốn luyện câu tiếng Anh cùng mình không? Hãy hỏi mình bất kỳ lúc nào nhé!",
  timestamp: "Vừa xong",
};

const SUGGESTED_QUESTIONS = [
  "💡 Sửa lỗi ngữ pháp câu này giúp tôi",
  "📚 Phân biệt In, On, At trong chỉ thời gian",
  "⚡ Giải thích cách dùng Thì Hiện Tại Hoàn Thành",
  "🎯 Dịch câu tiếng Việt sang tiếng Anh tự nhiên",
];

export default function FloatingAiTutor() {
  const pathname = usePathname();

  // Đảm bảo widget chỉ render ở Client để triệt tiêu hoàn toàn lỗi Hydration Mismatch
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Vị trí kéo thả tự do của con bot (Draggable Coordinates)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasDragged: boolean;
  }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    hasDragged: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ẩn bot nếu người dùng đang ở trực tiếp trang chuyên sâu /ai-assistant
  const isAiPage = pathname === "/ai-assistant";

  // Đánh dấu đã mount phía Client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Khởi tạo vị trí bot từ localStorage hoặc mặc định góc dưới bên phải
  useEffect(() => {
    if (typeof window === "undefined") return;

    const BOT_SIZE = 64;
    const MARGIN = 24;

    const initPos = () => {
      try {
        const saved = localStorage.getItem("topenglish_ai_tutor_pos");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            const maxX = Math.max(10, window.innerWidth - BOT_SIZE - 10);
            const maxY = Math.max(10, window.innerHeight - BOT_SIZE - 10);
            return {
              x: Math.min(Math.max(10, parsed.x), maxX),
              y: Math.min(Math.max(10, parsed.y), maxY),
            };
          }
        }
      } catch {}
      return {
        x: Math.max(10, window.innerWidth - BOT_SIZE - MARGIN),
        y: Math.max(10, window.innerHeight - BOT_SIZE - MARGIN),
      };
    };

    setPosition(initPos());

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const maxX = Math.max(10, window.innerWidth - BOT_SIZE - 10);
        const maxY = Math.max(10, window.innerHeight - BOT_SIZE - 10);
        return {
          x: Math.min(Math.max(10, prev.x), maxX),
          y: Math.min(Math.max(10, prev.y), maxY),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Xử lý bắt đầu kéo chuột / chạm màn hình (Pointer Down)
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const curX = position?.x ?? (window.innerWidth - 88);
    const curY = position?.y ?? (window.innerHeight - 88);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: curX,
      origY: curY,
      hasDragged: false,
    };
    setIsDragging(true);
  };

  // Xử lý di chuyển chuột khi đang kéo (Pointer Move)
  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    // Ngưỡng 4px để phân biệt nhấp chuột (Click) hay kéo di chuyển (Drag)
    if (!dragRef.current.hasDragged && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
      dragRef.current.hasDragged = true;
      setShowTooltip(false);
    }

    if (dragRef.current.hasDragged) {
      const BOT_SIZE = 64;
      const maxX = Math.max(10, window.innerWidth - BOT_SIZE - 10);
      const maxY = Math.max(10, window.innerHeight - BOT_SIZE - 10);

      const nextX = Math.min(Math.max(10, dragRef.current.origX + deltaX), maxX);
      const nextY = Math.min(Math.max(10, dragRef.current.origY + deltaY), maxY);

      setPosition({ x: nextX, y: nextY });
    }
  };

  // Xử lý thả chuột / kết thúc kéo (Pointer Up)
  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    setIsDragging(false);

    if (dragRef.current.hasDragged) {
      if (position) {
        try {
          localStorage.setItem("topenglish_ai_tutor_pos", JSON.stringify(position));
        } catch {}
      }
    } else {
      setIsOpen((prev) => !prev);
      setShowTooltip(false);
    }
  };

  // Tính toán vị trí mở cửa sổ chat neo thông minh theo con bot
  const getChatWindowStyle = (): React.CSSProperties => {
    if (!position || typeof window === "undefined") {
      return {
        bottom: "96px",
        right: "24px",
        width: "410px",
        maxWidth: "calc(100vw - 32px)",
        height: "560px",
        maxHeight: "82vh",
      };
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const chatWidth = Math.min(410, windowWidth - 32);
    const chatHeight = Math.min(560, windowHeight * 0.82);

    let left = 0;
    let top = 0;

    // Trục ngang: Neo theo nửa màn hình trái hoặc phải
    if (position.x > windowWidth / 2) {
      left = Math.max(16, position.x + 64 - chatWidth);
    } else {
      left = Math.min(windowWidth - chatWidth - 16, position.x);
    }

    // Trục dọc: Mở lên trên hoặc xuống dưới bot
    if (position.y > windowHeight / 2) {
      top = Math.max(16, position.y - chatHeight - 12);
    } else {
      top = Math.min(windowHeight - chatHeight - 16, position.y + 64 + 12);
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${chatWidth}px`,
      height: `${chatHeight}px`,
    };
  };

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Tự động focus ô nhập khi mở hộp chat
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Hiển thị bóng thoại chào mừng sau 3 giây khi vào trang lần đầu
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && !isAiPage) {
        setShowTooltip(true);
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [isOpen, isAiPage]);

  // Không render trên Server hoặc khi ở trang chuyên sâu /ai-assistant để ngăn ngừa Hydration Mismatch
  if (!mounted || isAiPage) {
    return null;
  }

  // Gửi câu hỏi đến Backend AI
  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại gần nhất (tối đa 4 lượt)
      const history = messages
        .filter((m) => m.id !== "welcome-msg")
        .slice(-4)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetchApi<{
        reply?: string;
        response?: string;
        suggestions?: string[];
        suggestedFollowUps?: string[];
      }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          history,
        }),
      });

      if (res.success && res.data) {
        const replyText =
          res.data.reply || res.data.response || "Mình đã nhận được câu hỏi của bạn!";
        const followUps = res.data.suggestions || res.data.suggestedFollowUps || [];

        const botMsg: ChatMessage = {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: replyText,
          suggestions: followUps,
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.message || "Không thể kết nối với Gia sư AI");
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: `Rất tiếc, mình gặp trục trặc tạm thời: ${
          err.message || "Vui lòng thử lại sau giây lát!"
        }. Bạn có thể thử lại câu hỏi nhé!`,
        timestamp: "Lỗi kết nối",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Sao chép nội dung câu trả lời
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Đọc phát âm tiếng Anh bằng Web Speech API
  const handleSpeak = (id: string, text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // Lọc lấy các câu tiếng Anh cơ bản
    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/[#_`]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 0.95;

    utterance.onstart = () => setPlayingId(id);
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Làm mới cuộc trò chuyện
  const handleResetChat = () => {
    if (confirm("Làm mới cuộc trò chuyện với Gia sư AI?")) {
      setMessages([INITIAL_WELCOME_MESSAGE]);
      window.speechSynthesis?.cancel();
    }
  };

  return (
    <>
      {/* =========================================================================
          1. CỬA SỔ HỘI THOẠI NỔI (FLOATING CHAT WINDOW)
      ========================================================================= */}
      {isOpen && (
        <div
          style={getChatWindowStyle()}
          className="fixed z-50 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* HEADER */}
          <div className="px-4 py-3.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center gap-3">
              {/* Mini Animated Robot Avatar in Header */}
              <div className="relative size-10 rounded-2xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-emerald-400/80 flex items-center justify-center shadow-xs shrink-0">
                <div className="w-7 h-5.5 rounded-lg bg-white/90 dark:bg-slate-950 border border-emerald-500/30 flex items-start justify-center pt-0.5 gap-1 px-1 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent pointer-events-none animate-robot-scanline" />
                  <div className="relative w-2 h-3 rounded-full bg-gradient-to-b from-emerald-300 via-teal-400 to-emerald-500 animate-robot-active-eyes flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0.2 right-0.2 size-0.5 rounded-full bg-white animate-robot-catchlight" />
                  </div>
                  <div className="relative w-2 h-3 rounded-full bg-gradient-to-b from-emerald-300 via-teal-400 to-emerald-500 animate-robot-active-eyes flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0.2 right-0.2 size-0.5 rounded-full bg-white animate-robot-catchlight" />
                  </div>
                  {/* Mini Curved LED Smile */}
                  <div className="absolute bottom-0.2 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
                    <svg className="w-2.5 h-1 overflow-visible" viewBox="0 0 16 8" fill="none">
                      <path
                        d="M 2 1.5 Q 8 6.5 14 1.5"
                        stroke="#10b981"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_2px_#10b981]"
                      />
                    </svg>
                  </div>
                </div>
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white tracking-wide">
                    Gia sư AI
                  </h4>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Gemini
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Sẵn sàng giải đáp mọi lúc</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <Link
                href="/ai-assistant"
                onClick={() => setIsOpen(false)}
                title="Mở toàn màn hình chuyên sâu"
                className="size-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <Maximize2 className="size-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleResetChat}
                title="Làm mới đoạn hội thoại"
                className="size-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="size-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-slate-50/70 dark:bg-slate-950/50 no-scrollbar">
            {messages.map((m) => {
              const isBot = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${
                    isBot ? "justify-start" : "justify-end"
                  }`}
                >
                  {isBot && (
                    <div className="size-7 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-emerald-400/60 text-slate-800 dark:text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <div className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-robot-active-eyes shadow-[0_0_4px_#10b981]" />
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-robot-active-eyes shadow-[0_0_4px_#10b981]" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`relative max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                      isBot
                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium"
                    }`}
                  >
                    {/* Message Text with simple bold/markdown support */}
                    <div className="whitespace-pre-wrap break-words">
                      {m.content}
                    </div>

                    {/* Bot Actions: Copy & Audio TTS */}
                    {isBot && m.id !== "welcome-msg" && (
                      <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          className="hover:text-emerald-600 flex items-center gap-1 transition cursor-pointer"
                          title="Sao chép câu trả lời"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="size-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Chép</span>
                            </>
                          )}
                        </button>

                        <span>•</span>

                        <button
                          type="button"
                          onClick={() => handleSpeak(m.id, m.content)}
                          className={`hover:text-emerald-600 flex items-center gap-1 transition cursor-pointer ${
                            playingId === m.id ? "text-emerald-500 font-bold animate-pulse" : ""
                          }`}
                          title="Nghe phát âm tiếng Anh"
                        >
                          <Volume2 className="size-3" />
                          <span>{playingId === m.id ? "Đang đọc..." : "Phát âm"}</span>
                        </button>
                      </div>
                    )}

                    {/* Bot Follow-up Suggestions */}
                    {isBot && m.suggestions && m.suggestions.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Sparkles className="size-2.5" />
                          Gợi ý hỏi tiếp:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.suggestions.map((sug, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => handleSendMessage(sug)}
                              className="text-left text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer font-medium"
                            >
                              💬 {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="size-7 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-emerald-400/60 flex items-center justify-center shrink-0 shadow-xs">
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 font-medium">
                    Gia sư AI đang suy nghĩ...
                  </span>
                </div>
              </div>
            )}

            {/* SUGGESTED PILLS (Chỉ hiện khi cuộc hội thoại mới bắt đầu) */}
            {messages.length <= 1 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Gợi ý câu hỏi nhanh:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-[11px] font-medium p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-xs transition cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi tiếng Anh bất kỳ..."
              disabled={loading}
              className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="size-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Gửi câu hỏi"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          2. CON BOT NỔI HÌNH TRÒN KÉO THẢ TỰ DO TOÀN MÀN HÌNH (DRAGGABLE BOT)
      ========================================================================= */}
      <div
        style={{
          left: position ? `${position.x}px` : undefined,
          top: position ? `${position.y}px` : undefined,
        }}
        className={`fixed z-50 select-none touch-none ${
          !position ? "bottom-6 right-6" : ""
        }`}
      >
        {/* Tooltip / Speech Bubble Callout */}
        {showTooltip && !isOpen && !isDragging && (
          <div
            className={`absolute mb-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-400/60 dark:border-emerald-500/60 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-2xl shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap animate-in fade-in duration-200 ${
              !position || position.x > (typeof window !== "undefined" ? window.innerWidth / 2 : 500)
                ? "right-full mr-3 slide-in-from-right-4"
                : "left-full ml-3 slide-in-from-left-4"
            }`}
          >
            <span>🤖 Nhấp để chat • Giữ chuột để kéo thả!</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 cursor-pointer"
            >
              <X className="size-3" />
            </button>
            {/* Speech arrow */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 size-3 bg-white dark:bg-slate-900 ${
                !position || position.x > (typeof window !== "undefined" ? window.innerWidth / 2 : 500)
                  ? "-right-1.5 border-r border-t border-emerald-400/60 dark:border-emerald-500/60 rotate-45"
                  : "-left-1.5 border-l border-b border-emerald-400/60 dark:border-emerald-500/60 rotate-45"
              }`}
            />
          </div>
        )}

        {/* Circular Robot Bot Trigger Button with Draggable Pointer Events */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative size-15 sm:size-16 rounded-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-2 border-emerald-400 shadow-2xl shadow-emerald-500/25 ring-4 ring-emerald-500/20 flex flex-col items-center justify-center transition-all select-none touch-none ${
            isDragging
              ? "cursor-grabbing scale-112 ring-emerald-400 ring-6 shadow-[0_0_35px_rgba(16,185,129,0.55)]"
              : "cursor-grab hover:scale-108 active:scale-95 animate-robot-float"
          } ${isOpen ? "rotate-12 ring-emerald-500/40" : ""}`}
          title="Gia sư AI - Nhấp để mở chat • Giữ và rê chuột để di chuyển toàn màn hình"
          aria-label="Mở Gia sư AI"
        >
          {/* Top Robot Antenna with Pulsing Emerald LED */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="w-0.5 h-1.5 bg-emerald-500/80" />
          </div>

          {/* Robot Frosted Glass Visor Screen with ample vertical breathing room */}
          <div className="w-10 sm:w-11 h-7.5 sm:h-8 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-emerald-500/30 flex items-start justify-center pt-1 gap-2 px-1 relative shadow-inner overflow-hidden pointer-events-none">
            {/* Ambient High-tech Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent pointer-events-none animate-robot-scanline" />

            {/* Left Eye: Lifelike Blinking Green Eye with Catchlight Sparkle */}
            <div
              className={`relative w-3.5 h-4.5 rounded-full bg-gradient-to-b from-emerald-300 via-teal-400 to-emerald-500 flex items-center justify-center overflow-hidden ${
                loading ? "animate-robot-thinking" : "animate-robot-active-eyes"
              }`}
            >
              <div className="size-1.5 rounded-full bg-emerald-950/70" />
              {/* Specular highlights for soulful eyes */}
              <div className="absolute top-0.5 right-0.5 size-1 rounded-full bg-white shadow-xs animate-robot-catchlight" />
              <div className="absolute bottom-0.5 left-0.5 size-0.5 rounded-full bg-white/90 animate-robot-catchlight" />
            </div>

            {/* Right Eye: Lifelike Blinking Green Eye with Catchlight Sparkle */}
            <div
              className={`relative w-3.5 h-4.5 rounded-full bg-gradient-to-b from-emerald-300 via-teal-400 to-emerald-500 flex items-center justify-center overflow-hidden ${
                loading ? "animate-robot-thinking" : "animate-robot-active-eyes"
              }`}
            >
              <div className="size-1.5 rounded-full bg-emerald-950/70" />
              {/* Specular highlights for soulful eyes */}
              <div className="absolute top-0.5 right-0.5 size-1 rounded-full bg-white shadow-xs animate-robot-catchlight" />
              <div className="absolute bottom-0.5 left-0.5 size-0.5 rounded-full bg-white/90 animate-robot-catchlight" />
            </div>

            {/* Adorable Curved Animated LED Smile - Dịch xuống dưới tạo khoảng cách hài hòa với mắt */}
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
              <svg
                className={`w-4 h-1.5 overflow-visible transition-transform duration-300 ${
                  loading ? "animate-robot-talk" : "animate-robot-smile"
                }`}
                viewBox="0 0 20 10"
                fill="none"
              >
                <path
                  d="M 3 2 Q 10 9 17 2"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_4px_#10b981]"
                />
              </svg>
            </div>

            {/* Cute Rosy Blush Cheeks on smile */}
            <span className="absolute bottom-1 left-1.5 size-1.5 rounded-full bg-rose-400/40 dark:bg-rose-400/60 blur-[0.4px] animate-pulse pointer-events-none" />
            <span className="absolute bottom-1 right-1.5 size-1.5 rounded-full bg-rose-400/40 dark:bg-rose-400/60 blur-[0.4px] animate-pulse pointer-events-none" />
          </div>

          {/* Online status green dot with ping */}
          <span className="absolute top-0.5 right-0.5 size-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          </span>
        </button>
      </div>
    </>
  );
}
