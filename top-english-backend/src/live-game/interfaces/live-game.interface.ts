/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Định nghĩa các kiểu dữ liệu và Interface cho Game Leo Núi thời gian thực
 */

export interface CharacterInfo {
  id: string;
  name: string;
  icon: string; // Emoji hoặc mã icon
  color: string; // Tailwind gradient / border color
  avatarBg: string;
}

export interface LivePlayer {
  id: string; // Socket ID hoặc User ID
  userId?: string;
  socketId: string;
  nickname: string;
  character: CharacterInfo;
  score: number; // Tổng điểm số
  progress: number; // Tỷ lệ leo núi (0% chân núi -> 100% đỉnh núi)
  streak: number; // Chuỗi trả lời đúng liên tiếp
  answersCount: number;
  correctAnswersCount: number;
  isAnswered: boolean;
  lastAnswerCorrect: boolean | null;
}

export interface LiveQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  timeLimit: number; // Số giây cho mỗi câu (ví dụ 15s)
}

export interface LiveRoom {
  pin: string; // Mã phòng 6 chữ số (e.g. "849201")
  hostId: string;
  hostSocketId?: string;
  title: string;
  quizId?: string;
  timePerQuestion: number;
  status: 'lobby' | 'playing' | 'question_result' | 'finished';
  currentQuestionIndex: number;
  questions: LiveQuestion[];
  players: Map<string, LivePlayer>;
  createdAt: Date;
}
