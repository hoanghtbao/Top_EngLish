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
import { Model, Types } from 'mongoose';
import {
  CharacterInfo,
  LivePlayer,
  LiveQuestion,
  LiveRoom,
} from './interfaces/live-game.interface';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Quiz, QuizDocument } from '../quizzes/schemas/quiz.schema';
import { Question, QuestionDocument } from '../quizzes/schemas/question.schema';
import { QuestionType } from '../quizzes/enums/question-type.enum';
import { QuizzesService } from '../quizzes/quizzes.service';

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
    private readonly quizzesService: QuizzesService,
  ) {}

  private shuffleArray<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Chuẩn hóa câu hỏi trắc nghiệm (2–4 phương án) sang LiveQuestion.
   * Trả về null nếu là câu điền từ hoặc không khớp được đáp án đúng.
   */
  private mapDbQuestionToLive(
    q: any,
    idx: number,
    timeLimit: number,
    shuffleOptions: boolean,
  ): LiveQuestion | null {
    if (q.type && q.type !== QuestionType.MULTIPLE_CHOICE) {
      return null;
    }

    const rawOptions = Array.isArray(q.options) ? q.options : [];
    const normalizedTexts: string[] = [];
    let legacyCorrectIdx = -1;

    rawOptions.forEach((opt: any) => {
      const text = String(typeof opt === 'string' ? opt : opt?.text || '').trim();
      if (!text) return;
      if (!normalizedTexts.includes(text)) {
        if (typeof opt === 'object' && opt?.isCorrect === true && legacyCorrectIdx === -1) {
          legacyCorrectIdx = normalizedTexts.length;
        }
        normalizedTexts.push(text);
      }
    });

    if (normalizedTexts.length < 2 || normalizedTexts.length > 4) {
      return null;
    }

    const correctAns = String(q.correctAnswer || '').trim();
    let correctIdx = normalizedTexts.findIndex((o) => o === correctAns);
    if (correctIdx === -1 && correctAns) {
      const lower = correctAns.toLowerCase();
      correctIdx = normalizedTexts.findIndex((o) => o.toLowerCase() === lower);
    }
    if (correctIdx === -1 && legacyCorrectIdx >= 0) {
      correctIdx = legacyCorrectIdx;
    }
    if (correctIdx === -1) {
      return null;
    }

    let finalOptions = normalizedTexts;
    let finalCorrectIdx = correctIdx;

    if (shuffleOptions) {
      const tagged = this.shuffleArray(
        normalizedTexts.map((text, i) => ({
          text,
          isCorrect: i === correctIdx,
        })),
      );
      finalOptions = tagged.map((t) => t.text);
      finalCorrectIdx = tagged.findIndex((t) => t.isCorrect);
    }

    return {
      id: q._id?.toString() || `q_${idx}`,
      question: String(q.questionText || q.question || '').trim() || 'Câu hỏi tiếng Anh',
      options: finalOptions,
      correctAnswerIndex: finalCorrectIdx >= 0 ? finalCorrectIdx : 0,
      explanation:
        String(q.explanation || '').trim() || 'Giải thích chi tiết ngữ pháp/từ vựng.',
      timeLimit,
    };
  }

  /**
   * Lấy toàn bộ nguồn tạo đề Đấu trường cho Giáo viên & Admin:
   * - Bộ Quiz chính thức (loại bỏ đề tự luyện cá nhân, kèm số câu MCQ hợp lệ)
   * - Lớp & Lesson Từ vựng + Bài Ngữ pháp đã xuất bản (status: 'published', kèm số câu MCQ)
   */
  async getCreatorSources() {
    const [quizzes, practiceSources] = await Promise.all([
      this.quizModel
        .find({ isCustomPractice: { $ne: true } })
        .select('_id title level type totalQuestions durationMinutes')
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.quizzesService.getPracticeSources({ publishedGrammarOnly: true }),
    ]);

    let formattedQuizzes: Array<{
      _id: string;
      title: string;
      level: string;
      type: string;
      totalQuestions: number;
      mcqCount: number;
      durationMinutes: number;
    }> = [];

    if (quizzes.length > 0) {
      const quizIds = quizzes.map((q) => q._id);
      const questions = await this.questionModel
        .find({ quizId: { $in: quizIds } })
        .select('quizId type options correctAnswer questionText explanation')
        .lean()
        .exec();

      const mcqCountByQuiz = new Map<string, number>();
      questions.forEach((q: any, idx: number) => {
        const valid = this.mapDbQuestionToLive(q, idx, 15, false);
        if (valid) {
          const key = q.quizId.toString();
          mcqCountByQuiz.set(key, (mcqCountByQuiz.get(key) || 0) + 1);
        }
      });

      formattedQuizzes = quizzes.map((quiz: any) => ({
        _id: quiz._id.toString(),
        title: quiz.title,
        level: quiz.level,
        type: quiz.type,
        totalQuestions: quiz.totalQuestions || 0,
        mcqCount: mcqCountByQuiz.get(quiz._id.toString()) || 0,
        durationMinutes: quiz.durationMinutes || 10,
      }));
    }

    return {
      quizzes: formattedQuizzes,
      vocabClasses: practiceSources.vocabClasses,
      ungroupedTopics: practiceSources.ungroupedTopics,
      grammarLessons: practiceSources.grammarLessons,
    };
  }

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
  getDefaultQuestions(timeLimit = 15): LiveQuestion[] {
    return [
      {
        id: 'q1',
        question: 'Which of the following is a synonym of "resilient"?',
        options: ['Fragile', 'Tough & Adaptable', 'Timid', 'Careless'],
        correctAnswerIndex: 1,
        explanation: '"Resilient" có nghĩa là kiên cường, dẻo dai, có khả năng thích nghi tốt (Tough & Adaptable).',
        timeLimit,
      },
      {
        id: 'q2',
        question: 'She has been working at this company _____ 2020.',
        options: ['for', 'since', 'in', 'at'],
        correctAnswerIndex: 1,
        explanation: 'Ta dùng "since" với một mốc thời gian cụ thể trong quá khứ (since 2020) cho thì Hiện tại hoàn thành.',
        timeLimit,
      },
      {
        id: 'q3',
        question: 'If it _____ tomorrow, our mountain hiking trip will be delayed.',
        options: ['rains', 'will rain', 'rained', 'is raining'],
        correctAnswerIndex: 0,
        explanation: 'Trong câu điều kiện loại 1 (Conditional Type 1), mệnh đề If sử dụng thì Hiện tại đơn (rains).',
        timeLimit,
      },
      {
        id: 'q4',
        question: 'What does the idiom "Break a leg" mean?',
        options: ['Be careful', 'Good luck!', 'Give up', 'Get injured'],
        correctAnswerIndex: 1,
        explanation: '"Break a leg" là thành ngữ chúc may mắn trong văn hóa Anh - Mỹ, đặc biệt trong biểu diễn và thi đấu.',
        timeLimit,
      },
      {
        id: 'q5',
        question: 'I look forward to _____ from you soon.',
        options: ['hear', 'heard', 'hearing', 'hears'],
        correctAnswerIndex: 2,
        explanation: 'Cấu trúc "look forward to + V-ing" diễn tả sự háo hức mong chờ điều gì (hearing).',
        timeLimit,
      },
      {
        id: 'q6',
        question: 'Neither the teacher nor the students _____ present at the auditorium.',
        options: ['was', 'were', 'is', 'be'],
        correctAnswerIndex: 1,
        explanation: 'Với cấu trúc "Neither... nor...", động từ chia theo chủ ngữ gần nhất ("the students" số nhiều -> were).',
        timeLimit,
      },
    ];
  }

  /**
   * Khởi tạo phòng đấu trường leo núi mới (tất cả bộ câu hỏi chỉ sống trong LiveRoom RAM, không tạo rác DB)
   */
  async createRoom(
    hostId: string,
    options?: {
      title?: string;
      sourceMode?: 'quiz' | 'custom';
      quizId?: string;
      topicIds?: string[];
      grammarLessonIds?: string[];
      vocabQuestionMode?: 'en_to_vi' | 'vi_to_en' | 'mixed_abcd';
      questionCount?: number;
      timePerQuestion?: number;
      shuffleQuestions?: boolean;
      shuffleOptions?: boolean;
    },
  ): Promise<LiveRoom> {
    const pin = this.generatePin();
    const timePerQuestion = [10, 15, 20, 30].includes(Number(options?.timePerQuestion))
      ? Number(options?.timePerQuestion)
      : 15;
    const shuffleQuestions = options?.shuffleQuestions ?? true;
    const shuffleOptions = options?.shuffleOptions ?? true;
    const sourceMode = options?.sourceMode || 'quiz';
    const title = options?.title?.trim() || 'Cuộc Đua Leo Núi Everest TopEnglish';

    let questions: LiveQuestion[] = [];
    let resolvedQuizId: string | undefined;

    if (sourceMode === 'custom') {
      const requestedCount = Math.max(
        1,
        Math.min(30, Number(options?.questionCount) || 10),
      );
      const { chosenQuestions } = await this.quizzesService.buildPracticeQuestionPool({
        topicIds: options?.topicIds || [],
        grammarLessonIds: options?.grammarLessonIds || [],
        vocabQuestionMode: options?.vocabQuestionMode || 'mixed_abcd',
        questionCount: requestedCount,
        onlyMcq: true,
        publishedGrammarOnly: true,
      });

      questions = chosenQuestions
        .map((q, idx) => this.mapDbQuestionToLive(q, idx, timePerQuestion, shuffleOptions))
        .filter((q): q is LiveQuestion => q !== null);

      if (questions.length === 0) {
        throw new BadRequestException(
          'Các bài học đã chọn chưa có câu hỏi trắc nghiệm 2–4 đáp án hợp lệ để mở Đấu trường.',
        );
      }

      if (shuffleQuestions) {
        questions = this.shuffleArray(questions);
      }
    } else if (options?.quizId && options.quizId !== 'default') {
      if (!Types.ObjectId.isValid(options.quizId)) {
        throw new BadRequestException('ID bộ đề Quiz không hợp lệ');
      }

      const quizObjId = new Types.ObjectId(options.quizId);
      const quiz = await this.quizModel.findById(quizObjId).select('_id title').lean().exec();
      if (!quiz) {
        throw new NotFoundException('Không tìm thấy bộ đề Quiz đã chọn');
      }

      const dbQuestions = await this.questionModel
        .find({ quizId: quizObjId })
        .sort({ order: 1, createdAt: 1 })
        .lean()
        .exec();

      questions = dbQuestions
        .map((q: any, idx: number) =>
          this.mapDbQuestionToLive(q, idx, timePerQuestion, shuffleOptions),
        )
        .filter((q): q is LiveQuestion => q !== null);

      if (questions.length === 0) {
        throw new BadRequestException(
          `Bộ đề "${quiz.title}" hiện chưa có câu hỏi trắc nghiệm 2–4 đáp án hợp lệ để mở Đấu trường!`,
        );
      }

      if (shuffleQuestions) {
        questions = this.shuffleArray(questions);
      }

      const requestedCount = Number(options?.questionCount);
      if (requestedCount > 0 && requestedCount < questions.length) {
        questions = questions.slice(0, requestedCount);
      }

      resolvedQuizId = quizObjId.toString();
    } else {
      questions = this.getDefaultQuestions(timePerQuestion);
      if (shuffleQuestions) {
        questions = this.shuffleArray(questions);
      }
    }

    const room: LiveRoom = {
      pin,
      hostId,
      title,
      quizId: resolvedQuizId,
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
