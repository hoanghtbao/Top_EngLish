/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Sảnh chờ Đấu trường Leo Núi Thời Gian Thực (Mountain Climbing Arena Lobby Hub) tuân thủ AppLayout và UI/UX Pro Max
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  HelpCircle,
  Mountain,
  PlusCircle,
  Radio,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { useAuth } from "../../context/auth-context";
import { fetchApi } from "../../lib/api-client";

interface Character {
  id: string;
  name: string;
  icon: string;
  color: string;
  avatarBg: string;
}

const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "bear",
    name: "Gấu Dũng Mãnh",
    icon: "🐻",
    color: "from-amber-600 to-amber-800",
    avatarBg: "bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800",
  },
  {
    id: "fox",
    name: "Cáo Nhanh Nhẹn",
    icon: "🦊",
    color: "from-orange-500 to-red-600",
    avatarBg: "bg-orange-100 dark:bg-orange-950/70 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-800",
  },
  {
    id: "eagle",
    name: "Đại Bàng Bầu Trời",
    icon: "🦅",
    color: "from-blue-600 to-indigo-700",
    avatarBg: "bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800",
  },
  {
    id: "lion",
    name: "Sư Tử Tiên Phong",
    icon: "🦁",
    color: "from-yellow-500 to-amber-600",
    avatarBg: "bg-yellow-100 dark:bg-yellow-950/70 text-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800",
  },
  {
    id: "panda",
    name: "Panda Kiên Trì",
    icon: "🐼",
    color: "from-emerald-600 to-teal-700",
    avatarBg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
  },
  {
    id: "wolf",
    name: "Sói Tuyết Băng Giá",
    icon: "🐺",
    color: "from-cyan-600 to-blue-700",
    avatarBg: "bg-cyan-100 dark:bg-cyan-950/70 text-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800",
  },
  {
    id: "astronaut",
    name: "Phi Hành Gia",
    icon: "🚀",
    color: "from-purple-600 to-pink-600",
    avatarBg: "bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800",
  },
  {
    id: "robot",
    name: "Robot Siêu Cấp",
    icon: "🤖",
    color: "from-slate-600 to-slate-800",
    avatarBg: "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-400 dark:border-slate-700",
  },
];

export default function LiveGameLobbyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [characters, setCharacters] = useState<Character[]>(DEFAULT_CHARACTERS);
  const [selectedCharId, setSelectedCharId] = useState<string>("bear");

  // Player Join State
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [joinError, setJoinError] = useState("");

  // Host Create State
  const [roomTitle, setRoomTitle] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState<number>(15);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Nạp danh sách nhân vật từ backend
  useEffect(() => {
    async function loadCharacters() {
      try {
        const res = await fetchApi<Character[]>("/live-game/characters");
        if (res.success && res.data && res.data.length > 0) {
          setCharacters(res.data);
        }
      } catch {
        // Giữ default nếu lỗi
      }
    }
    loadCharacters();
  }, []);

  // Tự động điền biệt danh nếu đã đăng nhập
  useEffect(() => {
    if (user?.fullName && !nickname) {
      setNickname(user.fullName);
    }
  }, [user, nickname]);

  // Xử lý tham gia trận đấu
  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");

    const cleanPin = pin.trim().replace(/\D/g, "");
    if (!cleanPin || cleanPin.length !== 6) {
      setJoinError("Vui lòng nhập đúng mã PIN gồm 6 chữ số.");
      return;
    }

    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setJoinError("Vui lòng nhập biệt danh của bạn để thi đấu.");
      return;
    }

    router.push(
      `/live-game/${cleanPin}?nickname=${encodeURIComponent(
        cleanNick,
      )}&character=${encodeURIComponent(selectedCharId)}`,
    );
  };

  // Xử lý Host tạo phòng đấu mới
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setIsCreating(true);

    try {
      const res = await fetchApi<{ pin: string; title: string }>("/live-game/rooms", {
        method: "POST",
        body: JSON.stringify({
          title: roomTitle.trim() || "Trận Đua Leo Núi Tiếng Anh",
          timePerQuestion,
        }),
      });

      if (res.success && res.data?.pin) {
        const defaultHostName = user?.fullName || "Chủ Phòng";
        router.push(
          `/live-game/${res.data.pin}?host=true&nickname=${encodeURIComponent(
            defaultHostName,
          )}&character=${encodeURIComponent(selectedCharId)}`,
        );
      } else {
        setCreateError(res.message || "Không thể tạo phòng lúc này");
      }
    } catch (err: any) {
      setCreateError(err.message || "Lỗi kết nối khi khởi tạo phòng đấu");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* HERO BANNER - THEME NGỌC BÍCH EMERALD-TEAL */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-10 shadow-xl shadow-teal-900/10 border border-teal-500/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 text-emerald-100 w-fit">
                <Radio className="size-3.5 text-emerald-200 animate-pulse" />
                Live Arena Realtime
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                <Mountain className="size-8 sm:size-10 text-emerald-200" />
                Đấu Trường Leo Núi Thời Gian Thực
              </h1>
              <p className="text-sm sm:text-base text-emerald-50 leading-relaxed font-normal">
                Nhập mã phòng, hóa thân thành 8 linh vật leo núi dũng cảm. Mỗi câu trả lời tiếng Anh chính xác giúp bạn nhích lên sườn dốc ngay tức khắc trước mắt đối thủ!
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex md:flex-col gap-3 shrink-0">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl">
                <Trophy className="size-6 text-amber-300" />
                <div>
                  <div className="text-xs text-emerald-100 font-medium">Bục vinh quang</div>
                  <div className="text-base font-bold text-white">Top 3 Chạm Đỉnh</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl">
                <Flame className="size-6 text-orange-300" />
                <div>
                  <div className="text-xs text-emerald-100 font-medium">Điểm số bứt phá</div>
                  <div className="text-base font-bold text-white">Combo & Tốc độ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute -right-12 -bottom-16 size-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -top-12 size-60 rounded-full bg-teal-300/15 blur-2xl pointer-events-none" />
        </section>

        {/* MAIN INTERACTIVE CARD: TABS FOR JOIN VS HOST */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Tab Selection Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-4 px-6 text-sm sm:text-base font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "join"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Swords className="size-5" />
              1. Tham Gia Trận Đấu (Học Viên)
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-4 px-6 text-sm sm:text-base font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "create"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <PlusCircle className="size-5" />
              2. Tạo Phòng Đấu Mới (Host / Giáo Viên)
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* TAB 1: JOIN GAME */}
            {activeTab === "join" && (
              <form onSubmit={handleJoinGame} className="flex flex-col gap-8">
                {joinError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
                    <span className="font-bold">⚠️ Lỗi:</span> {joinError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: PIN and Nickname */}
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Mã PIN Phòng Đấu (6 chữ số)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ví dụ: 987456"
                        className="w-full h-14 px-4 text-center tracking-[0.3em] font-mono text-2xl sm:text-3xl font-black rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition outline-none"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1.5">
                        Nhập 6 số được chia sẻ từ Giáo viên hoặc Bạn bè để vào phòng.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Biệt Danh Của Bạn (Tên hiển thị khi leo núi)
                      </label>
                      <input
                        type="text"
                        maxLength={20}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Ví dụ: Hoàng Bảo, Alex Pro, ChiChi..."
                        className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Character Selection Summary */}
                  <div className="flex flex-col justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                      <Sparkles className="size-4 text-emerald-500" />
                      Linh vật leo núi đang chọn
                    </div>
                    {characters.find((c) => c.id === selectedCharId) && (
                      <div className="flex items-center gap-4">
                        <div
                          className={`size-20 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 ${
                            characters.find((c) => c.id === selectedCharId)?.avatarBg
                          }`}
                        >
                          {characters.find((c) => c.id === selectedCharId)?.icon}
                        </div>
                        <div>
                          <div className="text-xl font-bold text-slate-900 dark:text-white">
                            {characters.find((c) => c.id === selectedCharId)?.name}
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Sẵn sàng chinh phục đỉnh núi 🚩
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Chọn nhân vật khác ở danh sách bên dưới nếu muốn thay đổi.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 8 Character Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Users className="size-4 text-slate-400" />
                      Chọn 1 trong 8 linh vật leo núi
                    </label>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Đã chọn: {characters.find((c) => c.id === selectedCharId)?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {characters.map((char) => {
                      const isSelected = selectedCharId === char.id;
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => setSelectedCharId(char.id)}
                          className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="size-3 stroke-[3]" />
                            </div>
                          )}
                          <div
                            className={`size-14 rounded-xl flex items-center justify-center text-3xl shadow-sm border ${char.avatarBg}`}
                          >
                            {char.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {char.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-lg shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition cursor-pointer"
                  >
                    <Mountain className="size-6" />
                    Vào Phòng Thi Đấu Leo Núi
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE ROOM (HOST) */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-6">
                {createError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
                    ⚠️ {createError}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Tiêu Đề Trận Đấu (Tên Phòng)
                    </label>
                    <input
                      type="text"
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      placeholder="Ví dụ: Đại Chiến Leo Núi Từ Vựng B1 - Lớp 11A1"
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white transition outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Thời Gian Cho Mỗi Câu Hỏi
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { time: 10, label: "10 Giây", desc: "Tốc độ chớp nhoáng" },
                        { time: 15, label: "15 Giây", desc: "Tiêu chuẩn cân bằng" },
                        { time: 20, label: "20 Giây", desc: "Thong thả suy nghĩ" },
                      ].map((item) => (
                        <button
                          key={item.time}
                          type="button"
                          onClick={() => setTimePerQuestion(item.time)}
                          className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
                            timePerQuestion === item.time
                              ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold shadow-sm"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <Clock className="size-5 mb-1 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-bold">{item.label}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Host Character Choice */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Linh vật của Host
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {characters.map((char) => (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => setSelectedCharId(char.id)}
                          className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 cursor-pointer transition ${
                            selectedCharId === char.id
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <span className="text-2xl">{char.icon}</span>
                          <span className="text-[10px] font-medium truncate w-full text-center">
                            {char.name.split(" ")[0]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-lg shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition cursor-pointer"
                  >
                    <PlusCircle className="size-6" />
                    {isCreating ? "Đang tạo phòng đấu..." : "Khởi Tạo Đấu Trường & Lấy Mã PIN"}
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* GAMEPLAY RULES & INSTRUCTIONS CARDS */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Luật Thi Đấu & Cơ Chế Leo Núi Realtime
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold text-base">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chọn Nhân Vật & Vào Phòng
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nhập 6 chữ số mã PIN từ giáo viên hoặc bạn bè, chọn 1 trong 8 nhân vật đặc biệt để đại diện cho bạn trên sườn núi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 flex items-center justify-center font-bold text-base">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Leo Núi Realtime Tức Thì
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mỗi khi chọn đúng đáp án trắc nghiệm, nhân vật của bạn sẽ ngay lập tức leo nhích lên sườn núi trên màn hình của tất cả mọi người!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-bold text-base">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tốc Độ & Chuỗi Thắng (Streak)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trả lời càng nhanh càng nhận được nhiều điểm thưởng (tối đa 1,000 điểm). Duy trì chuỗi đúng liên tiếp để bứt phá dẫn đầu!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="size-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-base">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bục Vinh Quang Top 3
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                3 nhà leo núi chạm đỉnh đầu tiên hoặc đạt điểm số cao nhất sẽ được vinh danh trên bục Podium cùng pháo hoa ăn mừng rực rỡ và nhận thưởng XP!
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
