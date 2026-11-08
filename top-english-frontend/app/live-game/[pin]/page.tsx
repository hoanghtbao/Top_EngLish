/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Phòng thi đấu Leo Núi Thời Gian Thực (Live Mountain Climbing Arena) qua Socket.io tuân thủ UI/UX Pro Max
 */

"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Crown,
  Flame,
  HelpCircle,
  Home,
  Medal,
  Mountain,
  Play,
  Radio,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Volume2,
  XCircle,
  Zap,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import { useAuth } from "../../../context/auth-context";
import { io, Socket } from "socket.io-client";

interface CharacterInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  avatarBg: string;
}

interface LivePlayer {
  socketId: string;
  userId?: string;
  nickname: string;
  character: CharacterInfo;
  score: number;
  streak: number;
  progress: number; // 0 to 100%
  answersCount: number;
  correctAnswersCount: number;
  isReady: boolean;
  lastClimbGain?: number;
}

interface LiveQuestionClient {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
}

interface PodiumPlayer {
  rank: number;
  nickname: string;
  character: CharacterInfo;
  score: number;
  progress: number;
  correctCount: number;
  xpReward: number;
}

function LiveGameRoomInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const pin = (params?.pin as string) || "";
  const initialNickname =
    searchParams.get("nickname") || user?.fullName || "Nhà Leo Núi";
  const initialCharacter = searchParams.get("character") || "bear";
  const isHostParam = searchParams.get("host") === "true";

  // Socket instance
  const socketRef = useRef<Socket | null>(null);

  // Connection & Room Status
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<
    "lobby" | "playing" | "question_result" | "finished"
  >("lobby");
  const [roomTitle, setRoomTitle] = useState("Đấu Trường Leo Núi");
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [myPlayer, setMyPlayer] = useState<LivePlayer | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedPin, setCopiedPin] = useState(false);

  // Question & Round State
  const [currentQuestion, setCurrentQuestion] =
    useState<LiveQuestionClient | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(6);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [totalQuestionTime, setTotalQuestionTime] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Player Answer State
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    null,
  );
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    correctAnswerIndex: number;
    scoreGain: number;
    climbGain: number;
  } | null>(null);
  const [roundExplanation, setRoundExplanation] = useState<string | null>(null);

  // Recent climb animation notification
  const [climbingAlert, setClimbingAlert] = useState<{
    nickname: string;
    icon: string;
    climbGain: number;
    isCorrect: boolean;
  } | null>(null);

  // Podium & Final Results
  const [podium, setPodium] = useState<PodiumPlayer[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<PodiumPlayer[]>([]);

  // 1. Khởi tạo Socket.io Connection
  useEffect(() => {
    if (!pin) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setErrorMessage("");

      // Gửi sự kiện gia nhập phòng
      socket.emit("join_room", {
        pin,
        nickname: initialNickname,
        characterId: initialCharacter,
        userId: user?._id,
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("joined_success", (data: any) => {
      setMyPlayer(data.player);
      if (data.room?.title) setRoomTitle(data.room.title);
      if (data.room?.totalQuestions)
        setTotalQuestions(data.room.totalQuestions);
      if (data.room?.timePerQuestion)
        setTotalQuestionTime(data.room.timePerQuestion);
    });

    socket.on("join_error", (data: any) => {
      setErrorMessage(data.message || "Không thể gia nhập phòng");
    });

    socket.on("lobby_updated", (data: { players: LivePlayer[] }) => {
      setPlayers(data.players || []);
    });

    socket.on(
      "player_left",
      (data: { nickname: string; players: LivePlayer[] }) => {
        setPlayers(data.players || []);
      },
    );

    // Bắt đầu trận đấu
    socket.on(
      "game_started",
      (data: {
        questionIndex: number;
        totalQuestions: number;
        question: LiveQuestionClient;
        players: LivePlayer[];
      }) => {
        setGameState("playing");
        setQuestionIndex(data.questionIndex);
        setTotalQuestions(data.totalQuestions);
        setCurrentQuestion(data.question);
        setTotalQuestionTime(data.question.timeLimit || 15);
        setTimeRemaining(data.question.timeLimit || 15);
        setPlayers(data.players || []);
        setSelectedAnswerIndex(null);
        setHasAnswered(false);
        setAnswerFeedback(null);
        setRoundExplanation(null);
      },
    );

    // Nhận kết quả nộp bài của chính mình
    socket.on("answer_result", (data: any) => {
      setAnswerFeedback({
        isCorrect: data.isCorrect,
        correctAnswerIndex: data.correctAnswerIndex,
        scoreGain: data.scoreGain,
        climbGain: data.climbGain,
      });

      // Cập nhật điểm cho myPlayer
      setMyPlayer((prev) =>
        prev
          ? {
              ...prev,
              score: data.totalScore,
              progress: data.totalProgress,
            }
          : null,
      );
    });

    // NHẬN SỰ KIỆN LEO NÚI REALTIME CỦA BẤT KỲ AI TRONG PHÒNG
    socket.on(
      "player_climbed",
      (data: {
        socketId: string;
        nickname: string;
        character: CharacterInfo;
        isCorrect: boolean;
        climbGain: number;
        newProgress: number;
        newScore: number;
        streak: number;
      }) => {
        // Cập nhật vị trí leo núi của người chơi trong danh sách realtime
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.socketId === data.socketId) {
              return {
                ...p,
                progress: data.newProgress,
                score: data.newScore,
                streak: data.streak,
                lastClimbGain: data.climbGain,
              };
            }
            return p;
          }),
        );

        // Hiển thị thông báo leo núi kịch tính
        if (data.isCorrect && data.climbGain > 0) {
          setClimbingAlert({
            nickname: data.nickname,
            icon: data.character.icon,
            climbGain: data.climbGain,
            isCorrect: true,
          });
          setTimeout(() => setClimbingAlert(null), 3000);
        }
      },
    );

    // Hiển thị kết quả vòng
    socket.on("round_result_shown", (data: any) => {
      setGameState("question_result");
      setRoundExplanation(data.explanation || null);
      if (data.players) setPlayers(data.players);
    });

    // Chuyển sang câu kế tiếp
    socket.on(
      "next_question_started",
      (data: {
        questionIndex: number;
        totalQuestions: number;
        question: LiveQuestionClient;
      }) => {
        setGameState("playing");
        setQuestionIndex(data.questionIndex);
        setTotalQuestions(data.totalQuestions);
        setCurrentQuestion(data.question);
        setTotalQuestionTime(data.question.timeLimit || 15);
        setTimeRemaining(data.question.timeLimit || 15);
        setSelectedAnswerIndex(null);
        setHasAnswered(false);
        setAnswerFeedback(null);
        setRoundExplanation(null);
      },
    );

    // Kết thúc trận đấu - Chạm đỉnh vinh quang
    socket.on(
      "game_finished",
      (data: { podium: PodiumPlayer[]; leaderboard: PodiumPlayer[] }) => {
        setGameState("finished");
        setPodium(data.podium || []);
        setFinalLeaderboard(data.leaderboard || []);

        // Bắn pháo hoa ăn mừng rực rỡ
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
          setTimeout(() => {
            confetti({
              particleCount: 80,
              angle: 60,
              spread: 60,
              origin: { x: 0.1, y: 0.7 },
            });
            confetti({
              particleCount: 80,
              angle: 120,
              spread: 60,
              origin: { x: 0.9, y: 0.7 },
            });
          }, 400);
        } catch {
          // Fallback if confetti fails
        }
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [pin, initialNickname, initialCharacter, user?._id]);

  // 2. Countdown Timer đếm ngược câu hỏi
  useEffect(() => {
    if (gameState !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Hết giờ -> Nếu là Host thì tự động chuyển sang hiển thị kết quả vòng
          if (isHostParam && socketRef.current) {
            socketRef.current.emit("show_round_result", { pin });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isHostParam, pin]);

  // 3. Xử lý Nộp Đáp Án
  const handleSelectAnswer = (optionIndex: number) => {
    if (hasAnswered || gameState !== "playing" || !socketRef.current) return;

    setSelectedAnswerIndex(optionIndex);
    setHasAnswered(true);

    socketRef.current.emit("submit_answer", {
      pin,
      answerIndex: optionIndex,
      timeRemaining,
    });
  };

  // 4. Host bắt đầu trận đấu
  const handleHostStartGame = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("start_game", { pin });
  };

  // 5. Host chuyển sang câu hỏi kế tiếp
  const handleHostNextQuestion = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("next_question", { pin });
  };

  // 6. Copy mã PIN
  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  // Sắp xếp người chơi theo độ cao leo núi (progress) giảm dần
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    return b.score - a.score;
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6">
        {/* TOP STATUS BAR */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/live-game"
              className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
              title="Rời phòng thi đấu"
            >
              <RotateCcw className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {roomTitle}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isConnected
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`}
                  />
                  {isConnected ? "Trực tuyến" : "Mất kết nối"}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                <span>
                  Đại diện: <strong>{myPlayer?.nickname || initialNickname}</strong> (
                  {myPlayer?.character?.name || "Linh vật"})
                </span>
                <span>•</span>
                <span>{players.length} người đang tham gia</span>
              </div>
            </div>
          </div>

          {/* PIN BADGE & COPY */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 mr-2 uppercase">Mã PIN:</span>
              <span className="font-mono text-lg font-black tracking-widest text-emerald-600 dark:text-emerald-400">
                {pin}
              </span>
            </div>
            <button
              onClick={handleCopyPin}
              className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Sao chép mã PIN"
            >
              {copiedPin ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </header>

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <Link
              href="/live-game"
              className="text-xs font-bold underline hover:no-underline"
            >
              Quay lại sảnh đấu
            </Link>
          </div>
        )}

        {/* =========================================================================
            STATE 1: LOBBY (PHÒNG CHỜ TRƯỚC KHI BẮT ĐẦU)
        ========================================================================= */}
        {gameState === "lobby" && (
          <div className="flex flex-col gap-6">
            {/* LOBBY HERO BANNER */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 text-center relative overflow-hidden shadow-lg">
              <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur border border-white/30 text-white">
                  <Users className="size-3.5" />
                  Sảnh Chờ Thi Đấu
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Chuẩn Bị Chinh Phục Đỉnh Núi!
                </h2>
                <p className="text-sm text-emerald-50">
                  Hãy chia sẻ mã PIN{" "}
                  <strong className="underline font-mono tracking-wider">{pin}</strong> cho bạn bè để cùng bước vào cuộc đua leo dốc kịch tính.
                </p>

                {isHostParam ? (
                  <button
                    onClick={handleHostStartGame}
                    disabled={players.length === 0}
                    className="mt-3 px-8 h-13 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 font-black text-base shadow-lg shadow-amber-500/30 flex items-center gap-2.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="size-5 fill-slate-900" />
                    Bắt Đầu Trận Đấu Ngay ({players.length} người)
                  </button>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-emerald-100 text-sm font-medium">
                    <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                    Đang chờ Chủ phòng nhấn Bắt đầu trận đấu...
                  </div>
                )}
              </div>
            </div>

            {/* JOINED PLAYERS LIST */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Users className="size-4 text-emerald-500" />
                  Danh sách nhà leo núi đã tham gia ({players.length})
                </h3>
              </div>

              {players.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Đang kết nối vào phòng...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {players.map((p) => {
                    const isMe = p.socketId === myPlayer?.socketId;
                    return (
                      <div
                        key={p.socketId}
                        className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition ${
                          isMe
                            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                        }`}
                      >
                        <div
                          className={`size-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border shrink-0 ${p.character.avatarBg}`}
                        >
                          {p.character.icon}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-1">
                            {p.nickname}
                            {isMe && (
                              <span className="text-[10px] text-emerald-600 font-extrabold">
                                (Bạn)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {p.character.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: PLAYING & QUESTION RESULT (ĐANG ĐUA LEO NÚI REALTIME)
        ========================================================================= */}
        {(gameState === "playing" || gameState === "question_result") && (
          <div className="flex flex-col gap-6">
            {/* FLOATING CLIMB NOTIFICATION */}
            {climbingAlert && (
              <div className="fixed top-20 right-6 z-50 animate-bounce bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-emerald-400 text-sm font-bold">
                <span className="text-xl">{climbingAlert.icon}</span>
                <span>
                  {climbingAlert.nickname} vừa leo thêm +{climbingAlert.climbGain.toFixed(1)}%!
                </span>
                <Flame className="size-4 text-amber-300" />
              </div>
            )}

            {/* 1. INTERACTIVE MOUNTAIN CLIMBING ARENA (SƯỜN NÚI REALTIME) */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-sky-400 via-teal-500 to-emerald-700 dark:from-slate-900 dark:via-teal-950 dark:to-slate-900 shadow-xl min-h-[360px] p-4 sm:p-6 flex flex-col justify-between">
              {/* Mountain Slope SVG Illustration Background */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-25"
                preserveAspectRatio="none"
                viewBox="0 0 1000 400"
              >
                {/* Back Mountain Ridges */}
                <polygon
                  points="0,400 200,220 380,310 600,140 820,260 1000,80 1000,400"
                  fill="#0f766e"
                />
                {/* Main Climbing Slope Path */}
                <path
                  d="M 50,360 Q 250,330 450,230 T 900,60"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="6"
                  strokeDasharray="8 8"
                />
              </svg>

              {/* Top Banner inside Mountain Arena */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-white text-xs font-bold">
                  <Mountain className="size-4 text-emerald-300" />
                  Sườn Núi Trực Tuyến: Trả lời đúng để leo lên!
                </div>

                {/* Summit Flag Marker */}
                <div className="flex items-center gap-1.5 bg-amber-400/90 text-slate-950 font-black px-3 py-1 rounded-xl shadow-md text-xs">
                  <Crown className="size-3.5 fill-slate-950" />
                  ĐỈNH NÚI (100%) 🚩
                </div>
              </div>

              {/* Dynamic Mountain Trail Milestones */}
              <div className="relative z-10 w-full my-6 min-h-[220px]">
                {/* 4 Slope Checkpoints */}
                <div className="absolute left-[5%] bottom-2 text-white/80 text-[10px] font-bold flex flex-col items-center">
                  <span>🏕️ Trạm Chân Núi (0%)</span>
                </div>
                <div className="absolute left-[30%] bottom-[30%] text-white/80 text-[10px] font-bold flex flex-col items-center">
                  <span>🌲 Trạm Nghỉ 1 (30%)</span>
                </div>
                <div className="absolute left-[60%] bottom-[58%] text-white/80 text-[10px] font-bold flex flex-col items-center">
                  <span>🧗 Vách Băng (60%)</span>
                </div>
                <div className="absolute right-[5%] top-2 text-amber-200 text-[11px] font-black flex flex-col items-center">
                  <span>🚩 Đỉnh Cao Vinh Quang (100%)</span>
                </div>

                {/* PLAYERS AVATARS CLIMBING IN REALTIME */}
                {sortedPlayers.map((p, idx) => {
                  const isMe = p.socketId === myPlayer?.socketId;
                  // Compute X (from 5% to 88%) and Y (from 80% to 10%) based on progress
                  const progressRatio = Math.min(100, Math.max(0, p.progress)) / 100;
                  const leftPercent = 5 + progressRatio * 83; // 5% to 88%
                  const bottomPercent = 8 + progressRatio * 74; // 8% to 82%

                  // Stagger slightly if multiple players are at similar progress to avoid overlap
                  const offsetStagger = (idx % 3) * 6 - 6;

                  return (
                    <div
                      key={p.socketId}
                      style={{
                        left: `${leftPercent}%`,
                        bottom: `calc(${bottomPercent}% + ${offsetStagger}px)`,
                      }}
                      className={`absolute z-20 flex flex-col items-center transition-all duration-700 ease-out transform -translate-x-1/2 ${
                        isMe ? "scale-110" : "scale-95"
                      }`}
                    >
                      {/* Altitude / Gain Tag */}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-black/60 text-white backdrop-blur shadow-sm border border-white/20 whitespace-nowrap mb-1">
                        <span>{p.progress.toFixed(0)}%</span>
                        {p.streak >= 2 && (
                          <span className="text-amber-300 flex items-center">
                            🔥{p.streak}
                          </span>
                        )}
                      </div>

                      {/* Character Avatar Icon */}
                      <div
                        className={`size-11 sm:size-12 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xl border-2 transition-transform duration-300 hover:scale-125 ${
                          isMe
                            ? "ring-4 ring-amber-400 border-white bg-emerald-600 animate-pulse"
                            : `${p.character.avatarBg} border-white/80`
                        }`}
                      >
                        {p.character.icon}
                      </div>

                      {/* Nickname Label */}
                      <div
                        className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold max-w-[85px] truncate shadow ${
                          isMe
                            ? "bg-amber-400 text-slate-950 font-black"
                            : "bg-white/90 text-slate-900"
                        }`}
                      >
                        {p.nickname}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Leaderboard Strip */}
              <div className="relative z-10 flex items-center justify-between bg-black/40 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 text-white text-xs overflow-x-auto gap-4">
                <div className="flex items-center gap-2 font-bold shrink-0">
                  <Trophy className="size-4 text-amber-400" />
                  Top Leo Núi:
                </div>
                <div className="flex items-center gap-3">
                  {sortedPlayers.slice(0, 4).map((p, idx) => (
                    <div
                      key={p.socketId}
                      className="flex items-center gap-1.5 shrink-0 bg-white/10 px-2.5 py-1 rounded-xl"
                    >
                      <span className="font-mono font-black text-amber-300">
                        #{idx + 1}
                      </span>
                      <span>{p.character.icon}</span>
                      <span className="font-semibold">{p.nickname}</span>
                      <span className="text-emerald-300 font-bold">
                        {p.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. QUESTION & ANSWERS CARD */}
            {currentQuestion && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col gap-6">
                {/* Question Header & Countdown Timer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase">
                      Câu hỏi {questionIndex + 1} / {totalQuestions}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Trả lời nhanh để cộng nhiều điểm leo núi!
                    </span>
                  </div>

                  {/* Countdown Timer with Color Indicator */}
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-slate-400" />
                    <span
                      className={`font-mono text-xl font-black ${
                        timeRemaining <= 5
                          ? "text-rose-600 dark:text-rose-400 animate-ping"
                          : timeRemaining <= 8
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {timeRemaining}s
                    </span>
                    <div className="w-24 sm:w-36 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${(timeRemaining / totalQuestionTime) * 100}%`,
                        }}
                        className={`h-full transition-all duration-1000 ${
                          timeRemaining <= 5
                            ? "bg-rose-500"
                            : timeRemaining <= 8
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQuestion.question}
                </div>

                {/* 4 KAHOOT-STYLE COLORFUL ANSWER BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, idx) => {
                    // Option styling colors
                    const colorStyles = [
                      "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
                      "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
                      "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
                      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
                    ];
                    const letterKeys = ["A", "B", "C", "D"];
                    const isSelected = selectedAnswerIndex === idx;

                    // If round result is shown
                    const isCorrectAnswer =
                      answerFeedback?.correctAnswerIndex === idx;

                    let customBtnClass = colorStyles[idx % 4];
                    if (gameState === "question_result") {
                      if (isCorrectAnswer) {
                        customBtnClass =
                          "bg-emerald-600 text-white ring-4 ring-emerald-300 font-black scale-[1.02]";
                      } else if (isSelected) {
                        customBtnClass = "bg-rose-700 text-white opacity-80";
                      } else {
                        customBtnClass = "bg-slate-300 dark:bg-slate-800 text-slate-500 opacity-50";
                      }
                    } else if (hasAnswered) {
                      if (isSelected) {
                        customBtnClass = `${colorStyles[idx % 4]} ring-4 ring-white/50 scale-[1.02]`;
                      } else {
                        customBtnClass = "bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={hasAnswered || gameState !== "playing"}
                        onClick={() => handleSelectAnswer(idx)}
                        className={`min-h-[72px] sm:min-h-[84px] p-4 rounded-2xl flex items-center gap-4 text-left font-bold text-base sm:text-lg shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${customBtnClass}`}
                      >
                        <span className="size-10 rounded-xl bg-black/20 flex items-center justify-center font-mono font-black text-xl shrink-0">
                          {letterKeys[idx]}
                        </span>
                        <span className="flex-1 leading-snug">{opt}</span>
                        {gameState === "question_result" && isCorrectAnswer && (
                          <CheckCircle2 className="size-6 text-white shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ANSWER FEEDBACK BADGE */}
                {answerFeedback && (
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      answerFeedback.isCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                        : "bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {answerFeedback.isCorrect ? (
                        <CheckCircle2 className="size-6 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="size-6 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm sm:text-base">
                          {answerFeedback.isCorrect
                            ? "Chính xác! Bạn vừa leo nhích lên sườn núi!"
                            : "Chưa chính xác! Giữ dây an toàn ở độ cao hiện tại nhé!"}
                        </div>
                        <div className="text-xs opacity-80 mt-0.5">
                          {answerFeedback.isCorrect
                            ? `+${answerFeedback.climbGain.toFixed(1)}% độ cao • +${answerFeedback.scoreGain} điểm bứt phá`
                            : "Cố gắng ở câu kế tiếp để tiếp tục leo dốc!"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROUND RESULT EXPLANATION */}
                {gameState === "question_result" && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <HelpCircle className="size-4" />
                      Giải thích đáp án
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {roundExplanation ||
                        "Đáp án đúng đã được hiển thị trên bảng câu hỏi."}
                    </p>
                  </div>
                )}

                {/* HOST CONTROL: NEXT QUESTION BUTTON */}
                {isHostParam && (
                  <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleHostNextQuestion}
                      className="px-6 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md flex items-center gap-2 transition cursor-pointer"
                    >
                      {questionIndex + 1 >= totalQuestions
                        ? "Xem Bục Vinh Quang Top 3 🏆"
                        : "Chuyển Sang Câu Kế Tiếp"}
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STATE 3: FINISHED (BỤC VINH QUANG TOP 3 & TỔNG KẾT TRẬN ĐẤU)
        ========================================================================= */}
        {gameState === "finished" && (
          <div className="flex flex-col gap-8">
            {/* SUMMIT VICTORY HERO BANNER */}
            <div className="relative rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-emerald-700 text-white p-6 sm:p-10 text-center overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-black/20 backdrop-blur border border-white/30 text-amber-100">
                  <Crown className="size-4 text-amber-300 fill-amber-300" />
                  Chạm Đỉnh Núi Vinh Quang
                </div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
                  Vinh Danh Nhà Vô Địch!
                </h2>
                <p className="text-sm sm:text-base text-amber-100">
                  Cuộc đua leo núi đã khép lại. Chúc mừng các nhà leo núi kiên cường đã xuất sắc vượt qua các thử thách tiếng Anh!
                </p>
              </div>
              <div className="absolute -left-12 -bottom-16 size-72 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
              <div className="absolute -right-12 -top-16 size-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
            </div>

            {/* 3D VICTORY PODIUM FOR TOP 3 */}
            {podium.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm flex flex-col items-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" />
                  Bục Vinh Quang 3 Nhà Leo Núi Xuất Sắc Nhất
                </div>

                {/* 3 Pedestals Container */}
                <div className="grid grid-cols-3 items-end gap-3 sm:gap-6 w-full max-w-2xl min-h-[300px]">
                  {/* RANK 2: SILVER (Left) */}
                  {podium[1] ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-16 sm:size-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md border-2 border-slate-300 bg-slate-100 dark:bg-slate-800">
                        {podium[1].character.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[120px]">
                          {podium[1].nickname}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">
                          {podium[1].score} pts
                        </div>
                      </div>
                      <div className="w-full h-32 sm:h-40 rounded-t-2xl bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex flex-col items-center justify-center text-white font-black shadow-md">
                        <Medal className="size-7 text-slate-100" />
                        <span className="text-2xl sm:text-3xl font-black mt-1">2</span>
                        <span className="text-[10px] font-bold text-slate-100 mt-1">
                          +{podium[1].xpReward} XP
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* RANK 1: GOLD CHAMPION (Center - Tallest) */}
                  {podium[0] ? (
                    <div className="flex flex-col items-center gap-2">
                      {/* Crown */}
                      <Crown className="size-8 text-amber-400 fill-amber-400 animate-bounce" />
                      <div className="size-20 sm:size-24 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-xl border-4 border-amber-400 bg-gradient-to-tr from-amber-100 to-yellow-200 dark:from-amber-950 dark:to-yellow-900 ring-4 ring-amber-400/30">
                        {podium[0].character.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[140px]">
                          {podium[0].nickname}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-black">
                          {podium[0].score} pts • {podium[0].progress.toFixed(0)}%
                        </div>
                      </div>
                      <div className="w-full h-44 sm:h-52 rounded-t-2xl bg-gradient-to-t from-amber-500 to-yellow-400 flex flex-col items-center justify-center text-slate-950 font-black shadow-xl">
                        <Trophy className="size-8 text-slate-950" />
                        <span className="text-3xl sm:text-4xl font-black mt-1">1</span>
                        <span className="text-xs font-black text-slate-950 mt-1">
                          +{podium[0].xpReward} XP
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* RANK 3: BRONZE (Right) */}
                  {podium[2] ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-16 sm:size-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-md border-2 border-amber-700 bg-amber-50 dark:bg-amber-950/60">
                        {podium[2].character.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[120px]">
                          {podium[2].nickname}
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">
                          {podium[2].score} pts
                        </div>
                      </div>
                      <div className="w-full h-24 sm:h-32 rounded-t-2xl bg-gradient-to-t from-amber-800 to-amber-700 flex flex-col items-center justify-center text-white font-black shadow-md">
                        <Award className="size-6 text-amber-200" />
                        <span className="text-2xl sm:text-3xl font-black mt-1">3</span>
                        <span className="text-[10px] font-bold text-amber-200 mt-1">
                          +{podium[2].xpReward} XP
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            )}

            {/* FULL RACE STANDINGS TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Bảng Điểm Toàn Đoàn Leo Núi ({finalLeaderboard.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                      <th className="py-3 px-4">Hạng</th>
                      <th className="py-3 px-4">Nhà leo núi</th>
                      <th className="py-3 px-4">Độ cao chạm tới</th>
                      <th className="py-3 px-4">Số câu đúng</th>
                      <th className="py-3 px-4">Tổng điểm</th>
                      <th className="py-3 px-4 text-right">Phần thưởng XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {finalLeaderboard.map((item) => (
                      <tr
                        key={item.nickname}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {item.rank === 1 ? (
                            <span className="text-amber-500 font-black">🥇 #1</span>
                          ) : item.rank === 2 ? (
                            <span className="text-slate-400 font-black">🥈 #2</span>
                          ) : item.rank === 3 ? (
                            <span className="text-amber-700 font-black">🥉 #3</span>
                          ) : (
                            <span>#{item.rank}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{item.character.icon}</span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.nickname}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {item.character.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.progress.toFixed(0)}%
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                          {item.correctCount} / {totalQuestions}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {item.score}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                          +{item.xpReward} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ACTION FOOTER BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-4">
              <Link
                href="/live-game"
                className="px-6 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition"
              >
                <RotateCcw className="size-4" />
                Chơi Trận Mới
              </Link>
              <Link
                href="/leaderboard"
                className="px-6 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-2 transition"
              >
                <Trophy className="size-4" />
                Xem Bảng Xếp Hạng Hệ Thống
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function LiveGameRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Đang tải phòng leo núi trực tiếp...</p>
          </div>
        </div>
      }
    >
      <LiveGameRoomInner />
    </Suspense>
  );
}
