/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service quản lý trạng thái phòng chơi Đấu Trường Leo Núi và tính điểm thời gian thực
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CharacterInfo,
  LivePlayer,
  LiveQuestion,
  LiveRoom,
} from './interfaces/live-game.interface';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Quiz, QuizDocument } from '../quizzes/schemas/quiz.schema';
import { Question, QuestionDocument } from '../quizzes/schemas/question.schema';

// Bộ 8 nhân vật leo núi mặc định
export const CLIMBING_CHARACTERS: CharacterInfo[] = [
  {
    id: 'bear',
    name: 'Gấu Dũng Mãnh',
    icon: '🐻',
    color: 'from-amber-600 to-amber-800',
    avatarBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'fox',
    name: 'Cáo Nhanh Nhẹn',
    icon: '🦊',
    color: 'from-orange-500 to-red-600',
    avatarBg: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    id: 'eagle',
    name: 'Đại Bàng Bầu Trời',
    icon: '🦅',
    color: 'from-blue-600 to-indigo-700',
    avatarBg: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'lion',
    name: 'Sư Tử Tiên Phong',
    icon: '🦁',
    color: 'from-yellow-500 to-amber-600',
    avatarBg: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  },
  {
    id: 'panda',
    name: 'Panda Kiên Trì',
    icon: '🐼',
    color: 'from-emerald-600 to-teal-700',
    avatarBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'wolf',
    name: 'Sói Tuyết Băng Giá',
    icon: '🐺',
    color: 'from-cyan-600 to-blue-700',
    avatarBg: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  },
  {
    id: 'astronaut',
    name: 'Phi Hành Gia',
    icon: '🚀',
    color: 'from-purple-600 to-pink-600',
    avatarBg: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'robot',
    name: 'Robot Siêu Cấp',
    icon: '🤖',
    color: 'from-slate-600 to-slate-800',
    avatarBg: 'bg-slate-200 text-slate-900 border-slate-400',
  },
];

@Injectable()
export class LiveGameService {
  private readonly logger = new Logger(LiveGameService.name);

  // Quản lý các phòng chơi đang hoạt động trong RAM
  private rooms: Map<string, LiveRoom> = new Map();

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  /**
   * Sinh mã PIN 6 số duy nhất không trùng lặp (ví dụ: 849201)
   */
  private generatePin(): string {
    let pin = '';
    do {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(pin));
    return pin;
  }

  /**
   * Tạo bộ câu hỏi leo núi mặc định chất lượng cao
   */
  getDefaultQuestions(): LiveQuestion[] {
    return [
      {
        id: 'q1',
        question: 'Which of the following is a synonym of "resilient"?',
        options: ['Fragile', 'Tough & Adaptable', 'Timid', 'Careless'],
        correctAnswerIndex: 1,
        explanation: '"Resilient" có nghĩa là kiên cường, dẻo dai, có khả năng thích nghi tốt (Tough & Adaptable).',
        timeLimit: 15,
      },
      {
        id: 'q2',
        question: 'She has been working at this company _____ 2020.',
        options: ['for', 'since', 'in', 'at'],
        correctAnswerIndex: 1,
        explanation: 'Ta dùng "since" với một mốc thời gian cụ thể trong quá khứ (since 2020) cho thì Hiện tại hoàn thành.',
        timeLimit: 15,
      },
      {
        id: 'q3',
        question: 'If it _____ tomorrow, our mountain hiking trip will be delayed.',
        options: ['rains', 'will rain', 'rained', 'is raining'],
        correctAnswerIndex: 0,
        explanation: 'Trong câu điều kiện loại 1 (Conditional Type 1), mệnh đề If sử dụng thì Hiện tại đơn (rains).',
        timeLimit: 15,
      },
      {
        id: 'q4',
        question: 'What does the idiom "Break a leg" mean?',
        options: ['Be careful', 'Good luck!', 'Give up', 'Get injured'],
        correctAnswerIndex: 1,
        explanation: '"Break a leg" là thành ngữ chúc may mắn trong văn hóa Anh - Mỹ, đặc biệt trong biểu diễn và thi đấu.',
        timeLimit: 15,
      },
      {
        id: 'q5',
        question: 'I look forward to _____ from you soon.',
        options: ['hear', 'heard', 'hearing', 'hears'],
        correctAnswerIndex: 2,
        explanation: 'Cấu trúc "look forward to + V-ing" diễn tả sự háo hức mong chờ điều gì (hearing).',
        timeLimit: 15,
      },
      {
        id: 'q6',
        question: 'Neither the teacher nor the students _____ present at the auditorium.',
        options: ['was', 'were', 'is', 'be'],
        correctAnswerIndex: 1,
        explanation: 'Với cấu trúc "Neither... nor...", động từ chia theo chủ ngữ gần nhất ("the students" số nhiều -> were).',
        timeLimit: 15,
      },
    ];
  }

  /**
   * Khởi tạo phòng đấu trường leo núi mới
   */
  async createRoom(
    hostId: string,
    title = 'Cuộc Đua Leo Núi Everest TopEnglish',
    quizId?: string,
    timePerQuestion = 15,
  ): Promise<LiveRoom> {
    const pin = this.generatePin();

    let questions: LiveQuestion[] = [];

    // Nếu chọn Quiz từ CSDL
    if (quizId) {
      try {
        const dbQuestions = await this.questionModel.find({ quizId }).lean();
        if (dbQuestions && dbQuestions.length > 0) {
          questions = dbQuestions.map((q: any, idx: number) => {
            const opts = q.options.map((o: any) => o.text || o);
            const correctIdx = q.options.findIndex(
              (o: any) => o.isCorrect === true,
            );
            return {
              id: q._id.toString() || `q_${idx}`,
              question: q.questionText || q.question || 'Câu hỏi tiếng Anh',
              options: opts,
              correctAnswerIndex: correctIdx >= 0 ? correctIdx : 0,
              explanation: q.explanation || 'Giải thích chi tiết ngữ pháp/từ vựng.',
              timeLimit: timePerQuestion,
            };
          });
        }
      } catch (err) {
        this.logger.warn(`Không thể nạp quizId ${quizId}, sử dụng câu hỏi mặc định`);
      }
    }

    if (questions.length === 0) {
      questions = this.getDefaultQuestions();
    }

    const room: LiveRoom = {
      pin,
      hostId,
      title,
      quizId,
      timePerQuestion,
      status: 'lobby',
      currentQuestionIndex: 0,
      questions,
      players: new Map(),
      createdAt: new Date(),
    };

    this.rooms.set(pin, room);
    this.logger.log(
      `Đã tạo phòng Đấu trường Leo Núi: PIN [${pin}] bởi Host [${hostId}] với ${questions.length} câu hỏi`,
    );
    return room;
  }

  /**
   * Lấy thông tin phòng theo mã PIN
   */
  getRoom(pin: string): LiveRoom | null {
    return this.rooms.get(pin) || null;
  }

  /**
   * Thêm người chơi vào phòng chờ
   */
  addPlayer(
    pin: string,
    player: {
      socketId: string;
      nickname: string;
      characterId: string;
      userId?: string;
    },
  ): LivePlayer {
    const room = this.rooms.get(pin);
    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng chơi với mã PIN ${pin}`);
    }

    if (room.status !== 'lobby') {
      throw new BadRequestException('Trận đấu leo núi đã bắt đầu, không thể gia nhập!');
    }

    const character =
      CLIMBING_CHARACTERS.find((c) => c.id === player.characterId) ||
      CLIMBING_CHARACTERS[0];

    const livePlayer: LivePlayer = {
      id: player.socketId,
      userId: player.userId,
      socketId: player.socketId,
      nickname: player.nickname.trim(),
      character,
      score: 0,
      progress: 0,
      streak: 0,
      answersCount: 0,
      correctAnswersCount: 0,
      isAnswered: false,
      lastAnswerCorrect: null,
    };

    room.players.set(player.socketId, livePlayer);
    this.logger.log(
      `Người chơi "${livePlayer.nickname}" (${character.name}) đã vào phòng [${pin}]`,
    );
    return livePlayer;
  }

  /**
   * Xử lý khi người chơi nộp đáp án câu hỏi
   */
  submitAnswer(
    pin: string,
    socketId: string,
    answerIndex: number,
    timeRemaining: number,
  ): {
    player: LivePlayer;
    isCorrect: boolean;
    correctAnswerIndex: number;
    scoreGain: number;
    climbGain: number;
  } {
    const room = this.rooms.get(pin);
    if (!room) {
      throw new NotFoundException('Phòng chơi không tồn tại');
    }

    const player = room.players.get(socketId);
    if (!player) {
      throw new NotFoundException('Không tìm thấy người chơi trong phòng');
    }

    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion) {
      throw new BadRequestException('Không có câu hỏi hiện tại');
    }

    const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;
    player.isAnswered = true;
    player.lastAnswerCorrect = isCorrect;
    player.answersCount = (player.answersCount || 0) + 1;

    let scoreGain = 0;
    let climbGain = 0;

    if (isCorrect) {
      player.correctAnswersCount = (player.correctAnswersCount || 0) + 1;
      // 1. Nhích lên 1 đoạn trên sườn núi: 100% chia đều cho tổng số câu hỏi
      climbGain = Math.round(100 / room.questions.length);
      player.progress = Math.min(100, player.progress + climbGain);

      // 2. Điểm thưởng: 1000 điểm cơ bản + điểm tốc độ (tối đa 500 điểm nếu trả lời ngay giây đầu)
      const speedBonus = Math.round(
        (timeRemaining / currentQuestion.timeLimit) * 500,
      );
      scoreGain = 1000 + speedBonus;
      player.score += scoreGain;
      player.streak += 1;
    } else {
      player.streak = 0;
    }

    return {
      player,
      isCorrect,
      correctAnswerIndex: currentQuestion.correctAnswerIndex,
      scoreGain,
      climbGain,
    };
  }

  /**
   * Chuyển sang câu hỏi kế tiếp
   */
  nextQuestion(pin: string): {
    hasMore: boolean;
    nextQuestion?: LiveQuestion;
    questionIndex: number;
    totalQuestions: number;
  } {
    const room = this.rooms.get(pin);
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    // Đặt lại cờ trả lời của toàn bộ người chơi trong phòng
    room.players.forEach((p) => {
      p.isAnswered = false;
      p.lastAnswerCorrect = null;
    });

    room.currentQuestionIndex += 1;
    if (room.currentQuestionIndex < room.questions.length) {
      room.status = 'playing';
      return {
        hasMore: true,
        nextQuestion: room.questions[room.currentQuestionIndex],
        questionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
      };
    } else {
      room.status = 'finished';
      return {
        hasMore: false,
        questionIndex: room.questions.length,
        totalQuestions: room.questions.length,
      };
    }
  }

  /**
   * Kết thúc trận đấu leo núi & Vinh danh Top 3 Quán quân
   */
  async finishGame(pin: string): Promise<{
    podium: LivePlayer[];
    leaderboard: LivePlayer[];
  }> {
    const room = this.rooms.get(pin);
    if (!room) throw new NotFoundException('Phòng không tồn tại');

    room.status = 'finished';

    // Sắp xếp người chơi theo độ cao leo núi (progress) giảm dần, sau đó theo tổng điểm (score)
    const sortedPlayers = Array.from(room.players.values()).sort((a, b) => {
      if (b.progress !== a.progress) {
        return b.progress - a.progress;
      }
      return b.score - a.score;
    });

    const podium = sortedPlayers.slice(0, 3).map((p, idx) => ({
      ...p,
      rank: idx + 1,
      xpReward: idx === 0 ? 100 : idx === 1 ? 70 : 50,
      correctCount: p.correctAnswersCount,
    }));

    const leaderboard = sortedPlayers.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      xpReward: idx === 0 ? 100 : idx === 1 ? 70 : idx === 2 ? 50 : 20,
      correctCount: p.correctAnswersCount,
    }));

    // Tự động thưởng XP vào CSDL cho người dùng đã đăng nhập
    try {
      if (podium[0]?.userId) {
        await this.userModel.findByIdAndUpdate(podium[0].userId, {
          $inc: { totalXP: 100 },
        });
      }
      if (podium[1]?.userId) {
        await this.userModel.findByIdAndUpdate(podium[1].userId, {
          $inc: { totalXP: 70 },
        });
      }
      if (podium[2]?.userId) {
        await this.userModel.findByIdAndUpdate(podium[2].userId, {
          $inc: { totalXP: 50 },
        });
      }
    } catch (err) {
      this.logger.warn('Lỗi cộng XP tự động cho quán quân leo núi:', err);
    }

    return {
      podium: podium as any,
      leaderboard: leaderboard as any,
    };
  }

  /**
   * Xóa người chơi khi disconnect
   */
  removePlayerBySocketId(socketId: string): {
    pin?: string;
    player?: LivePlayer;
  } {
    for (const [pin, room] of this.rooms.entries()) {
      if (room.players.has(socketId)) {
        const player = room.players.get(socketId);
        room.players.delete(socketId);
        return { pin, player };
      }
    }
    return {};
  }
}
