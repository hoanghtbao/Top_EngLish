/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Service xử lý nghiệp vụ đề thi, câu hỏi trắc nghiệm, chấm điểm tự động và thưởng điểm XP
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { Question, QuestionDocument } from './schemas/question.schema';
import {
  QuizSubmission,
  QuizSubmissionDocument,
} from './schemas/quiz-submission.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { GenerateCustomQuizDto } from './dto/generate-custom-quiz.dto';
import { QuizType } from './enums/quiz-type.enum';
import { QuestionType } from './enums/question-type.enum';
import { EnglishLevel } from '../topics/enums/english-level.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Topic, TopicDocument } from '../topics/schemas/topic.schema';
import { VocabClass, VocabClassDocument } from '../topics/schemas/vocab-class.schema';
import { Vocabulary, VocabularyDocument } from '../vocabulary/schemas/vocabulary.schema';
import {
  GrammarLesson,
  GrammarLessonDocument,
} from '../grammar/schemas/grammar-lesson.schema';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class QuizzesService implements OnModuleInit {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>,
    @InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(QuizSubmission.name)
    private readonly submissionModel: Model<QuizSubmissionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(VocabClass.name) private readonly vocabClassModel: Model<VocabClassDocument>,
    @InjectModel(Vocabulary.name) private readonly vocabularyModel: Model<VocabularyDocument>,
    @InjectModel(GrammarLesson.name)
    private readonly lessonModel: Model<GrammarLessonDocument>,
  ) {}

  /**
   * Tự động khởi tạo dữ liệu mẫu 2 đề thi kiểm tra kiến thức (Từ vựng & Ngữ pháp)
   */
  async onModuleInit() {
    const quizCount = await this.quizModel.countDocuments();
    if (quizCount === 0) {
      const admin = await this.userModel.findOne({ role: Role.ADMIN });
      if (!admin) return;

      const techTopic = await this.topicModel.findOne({ slug: 'technology-and-ai' });
      const presentSimpleLesson = await this.lessonModel.findOne({ slug: 'present-simple-tense' });

      // 1. Tạo Đề 1: Từ vựng Công nghệ & AI
      const vocabQuiz = new this.quizModel({
        title: 'Kiểm Tra Từ Vựng Công Nghệ & Trí Tuệ Nhân Tạo',
        description: 'Đánh giá khả năng hiểu nghĩa, cách dùng các thuật ngữ công nghệ thông tin và AI.',
        type: QuizType.VOCABULARY,
        level: EnglishLevel.B1,
        topicId: techTopic ? techTopic._id : undefined,
        durationMinutes: 10,
        passingScore: 70,
        totalQuestions: 5,
        createdBy: admin._id,
      });
      await vocabQuiz.save();

      const vocabQuestions = [
        {
          quizId: vocabQuiz._id,
          questionText: 'What is an "Algorithm" in computer science?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: [
            'A step-by-step procedure for solving a problem',
            'A type of physical computer monitor',
            'A brand of wireless gaming keyboard',
            'An electrical cable connecting devices',
          ],
          correctAnswer: 'A step-by-step procedure for solving a problem',
          explanation: '"Algorithm" có nghĩa là thuật toán, quy trình từng bước rõ ràng để giải quyết vấn đề toán học hoặc điện toán.',
          order: 1,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'Which word means "an organized collection of structured data stored electronically"?',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['Database', 'Cybercrime', 'Innovation', 'Itinerary'],
          correctAnswer: 'Database',
          explanation: '"Database" (Cơ sở dữ liệu) là tập hợp dữ liệu được tổ chức có cấu trúc và truy xuất trên máy tính.',
          order: 2,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'Engineers write scripts to ________ (tự động hóa) repetitive build tasks.',
          type: QuestionType.FILL_IN_THE_BLANK,
          options: [],
          correctAnswer: 'automate',
          explanation: '"automate" (động từ) nghĩa là tự động hóa các tác vụ lặp đi lặp lại để tiết kiệm thời gian.',
          order: 3,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'Criminal activities carried out by means of computers or the internet are known as ________.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['Cybercrime', 'Accommodation', 'Routine', 'Leisure'],
          correctAnswer: 'Cybercrime',
          explanation: '"Cybercrime" nghĩa là tội phạm công nghệ cao, tấn công mạng hoặc đánh cắp dữ liệu trực tuyến.',
          order: 4,
        },
        {
          quizId: vocabQuiz._id,
          questionText: 'The process of translating an idea into a good or service that creates value is called ________.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['Innovation', 'Departure', 'Commute', 'Chore'],
          correctAnswer: 'Innovation',
          explanation: '"Innovation" nghĩa là sự đổi mới, sáng chế mang lại giá trị thực tiễn.',
          order: 5,
        },
      ];

      await this.questionModel.insertMany(vocabQuestions);

      // 2. Tạo Đề 2: Ngữ pháp Các thì & Câu điều kiện
      const grammarQuiz = new this.quizModel({
        title: 'Trắc Nghiệm Các Thì & Câu Điều Kiện Cơ Bản',
        description: 'Kiểm tra nắm bắt thì Hiện Tại Đơn, Quá Khứ Đơn, Hiện Tại Hoàn Thành và Câu Điều Kiện Loại 1.',
        type: QuizType.GRAMMAR,
        level: EnglishLevel.A2,
        grammarLessonId: presentSimpleLesson ? presentSimpleLesson._id : undefined,
        durationMinutes: 10,
        passingScore: 70,
        totalQuestions: 5,
        createdBy: admin._id,
      });
      await grammarQuiz.save();

      const grammarQuestions = [
        {
          quizId: grammarQuiz._id,
          questionText: 'She ________ green tea every morning before going to work.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['drinks', 'drink', 'drinking', 'drank'],
          correctAnswer: 'drinks',
          explanation: 'Chủ ngữ ngôi thứ 3 số ít "She" trong thì Hiện Tại Đơn, động từ "drink" phải thêm "s" -> "drinks".',
          order: 1,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'We ________ Hanoi during our vacation last summer.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['visited', 'visit', 'have visited', 'visiting'],
          correctAnswer: 'visited',
          explanation: 'Có trạng từ chỉ thời gian quá khứ xác định "last summer", ta dùng thì Quá Khứ Đơn "visited".',
          order: 2,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'I have lived in this city ________ (trong/suốt) five years.',
          type: QuestionType.FILL_IN_THE_BLANK,
          options: [],
          correctAnswer: 'for',
          explanation: 'Trong thì Hiện Tại Hoàn Thành, dùng "for" với khoảng thời gian (for five years) và "since" với mốc thời gian.',
          order: 3,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'If it ________ tomorrow, we will stay at home.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ['rains', 'will rain', 'rained', 'is raining'],
          correctAnswer: 'rains',
          explanation: 'Trong câu điều kiện loại 1 (First Conditional), mệnh đề "If" chia ở Hiện Tại Đơn, không dùng "will".',
          order: 4,
        },
        {
          quizId: grammarQuiz._id,
          questionText: 'He ________ wake up early yesterday because it was a public holiday.',
          type: QuestionType.MULTIPLE_CHOICE,
          options: ["didn't", "doesn't", "hasn't", "isn't"],
          correctAnswer: "didn't",
          explanation: 'Phủ định của thì Quá Khứ Đơn mượn trợ động từ "didn\'t" + động từ nguyên mẫu "wake".',
          order: 5,
        },
      ];

      await this.questionModel.insertMany(grammarQuestions);
      this.logger.log('🌱 Đã tự động khởi tạo 2 đề thi mẫu và 10 câu hỏi trắc nghiệm/điền từ');
    }
  }

  /**
   * Trộn ngẫu nhiên mảng theo thuật toán Fisher-Yates
   */
  private shuffleArray<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Lấy danh sách nguồn bài học (Flashcard theo Lớp & Ngữ pháp) để chọn tạo đề tự luyện hoặc Đấu trường
   */
  async getPracticeSources(options?: { publishedGrammarOnly?: boolean }) {
    const grammarFilter = options?.publishedGrammarOnly
      ? { status: 'published' as const }
      : { status: { $ne: 'draft' as const } };

    const [vocabClasses, topics, vocabCounts, grammarLessons] = await Promise.all([
      this.vocabClassModel.find().sort({ createdAt: 1 }).lean(),
      this.topicModel
        .find()
        .select('_id vocabClassId lessonNumber title slug level wordCount tag')
        .sort({ lessonNumber: 1, createdAt: 1 })
        .lean(),
      this.vocabularyModel.aggregate([
        { $group: { _id: '$topicId', count: { $sum: 1 } } },
      ]),
      this.lessonModel
        .find(grammarFilter)
        .select('_id title slug level category exercises order')
        .sort({ order: 1, createdAt: 1 })
        .lean(),
    ]);

    const countByTopicId = new Map<string, number>();
    vocabCounts.forEach((row: any) => {
      if (row?._id) {
        countByTopicId.set(row._id.toString(), Number(row.count || 0));
      }
    });

    const topicsByClassId = new Map<string, any[]>();
    const ungroupedTopics: any[] = [];

    topics.forEach((topic: any) => {
      const realWordCount = countByTopicId.get(topic._id.toString()) ?? topic.wordCount ?? 0;
      const item = {
        _id: topic._id,
        title: topic.title,
        slug: topic.slug,
        lessonNumber: topic.lessonNumber || 1,
        level: topic.level || EnglishLevel.B1,
        tag: topic.tag || '',
        wordCount: realWordCount,
      };
      if (topic.vocabClassId) {
        const key = topic.vocabClassId.toString();
        if (!topicsByClassId.has(key)) topicsByClassId.set(key, []);
        topicsByClassId.get(key)!.push(item);
      } else {
        ungroupedTopics.push(item);
      }
    });

    const formattedClasses = vocabClasses.map((cls: any) => {
      const classTopics = topicsByClassId.get(cls._id.toString()) || [];
      return {
        _id: cls._id,
        name: cls.name,
        code: cls.code,
        description: cls.description || '',
        totalWords: classTopics.reduce((sum, t) => sum + (t.wordCount || 0), 0),
        topics: classTopics,
      };
    });

    const formattedGrammar = grammarLessons.map((lesson: any) => {
      const exercises = Array.isArray(lesson.exercises) ? lesson.exercises : [];
      const mcqCount = exercises.filter(
        (ex: any) =>
          ex?.question &&
          ex?.correctAnswer &&
          ex.type !== 'fill_blank' &&
          Array.isArray(ex.options) &&
          ex.options.length >= 2,
      ).length;

      return {
        _id: lesson._id,
        title: lesson.title,
        slug: lesson.slug,
        level: lesson.level || EnglishLevel.A1,
        category: lesson.category || 'Grammar',
        exerciseCount: exercises.length,
        mcqCount,
      };
    });

    return {
      vocabClasses: formattedClasses,
      ungroupedTopics,
      grammarLessons: formattedGrammar,
    };
  }

  /**
   * Lấy danh sách đề tự luyện ngẫu nhiên do học viên hiện tại tạo
   */
  async getMyCustomQuizzes(userId: string): Promise<QuizDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID học viên không hợp lệ');
    }

    return this.quizModel
      .find({
        isCustomPractice: true,
        ownerId: new Types.ObjectId(userId),
      })
      .populate('sourceTopicIds', 'title lessonNumber slug')
      .populate('sourceGrammarLessonIds', 'title level slug')
      .sort({ createdAt: -1 })
      .limit(24)
      .exec();
  }

  /**
   * Tạo câu hỏi từ 1 thẻ từ vựng Flashcard với đáp án nhiễu không trùng lặp
   */
  private buildVocabQuestion(
    vocab: any,
    mode: 'en_to_vi' | 'vi_to_en' | 'fill_blank',
    allMeanings: string[],
    allWords: string[],
  ) {
    const cleanMeaning = (vocab.meaning || '').trim();
    const cleanWord = (vocab.word || '').trim();
    const phoneticLabel = vocab.phonetic ? ` (${vocab.phonetic})` : '';
    const posLabel = vocab.partOfSpeech ? ` [${vocab.partOfSpeech}]` : '';
    const explanation =
      `${cleanWord}${phoneticLabel}${posLabel}: ${cleanMeaning}` +
      (vocab.exampleSentence
        ? `\nVí dụ: "${vocab.exampleSentence}"${vocab.exampleMeaning ? ` — ${vocab.exampleMeaning}` : ''}`
        : '');

    if (mode === 'fill_blank') {
      return {
        sourceType: 'vocabulary' as const,
        questionText: `Gõ từ tiếng Anh có nghĩa là "${cleanMeaning}"${posLabel}${phoneticLabel}:`,
        type: QuestionType.FILL_IN_THE_BLANK,
        options: [],
        correctAnswer: cleanWord,
        explanation,
      };
    }

    if (mode === 'vi_to_en') {
      const distractors = this.pickUniqueDistractors(
        cleanWord,
        [],
        allWords,
        3,
      );
      if (distractors.length < 3) {
        return {
          sourceType: 'vocabulary' as const,
          questionText: `Gõ từ tiếng Anh có nghĩa là "${cleanMeaning}"${posLabel}${phoneticLabel}:`,
          type: QuestionType.FILL_IN_THE_BLANK,
          options: [],
          correctAnswer: cleanWord,
          explanation,
        };
      }
      return {
        sourceType: 'vocabulary' as const,
        questionText: `Từ tiếng Anh nào có nghĩa là "${cleanMeaning}"${posLabel}?`,
        type: QuestionType.MULTIPLE_CHOICE,
        options: this.shuffleArray([cleanWord, ...distractors]),
        correctAnswer: cleanWord,
        explanation,
      };
    }

    // Mặc định: Anh -> Việt (ưu tiên distractors có sẵn của từ, thiếu thì lấy từ pool)
    const distractors = this.pickUniqueDistractors(
      cleanMeaning,
      Array.isArray(vocab.distractors) ? vocab.distractors : [],
      allMeanings,
      3,
    );
    if (distractors.length < 3) {
      return {
        sourceType: 'vocabulary' as const,
        questionText: `Gõ từ tiếng Anh có nghĩa là "${cleanMeaning}"${posLabel}${phoneticLabel}:`,
        type: QuestionType.FILL_IN_THE_BLANK,
        options: [],
        correctAnswer: cleanWord,
        explanation,
      };
    }
    return {
      sourceType: 'vocabulary' as const,
      questionText: `Nghĩa tiếng Việt của từ "${cleanWord}"${phoneticLabel}${posLabel} là gì?`,
      type: QuestionType.MULTIPLE_CHOICE,
      options: this.shuffleArray([cleanMeaning, ...distractors]),
      correctAnswer: cleanMeaning,
      explanation,
    };
  }

  private pickUniqueDistractors(
    correct: string,
    preferred: string[],
    fallbackPool: string[],
    limit: number,
  ): string[] {
    const used = new Set<string>([correct.trim().toLowerCase()]);
    const result: string[] = [];

    for (const candidate of this.shuffleArray(preferred)) {
      const trimmed = (candidate || '').trim();
      const key = trimmed.toLowerCase();
      if (trimmed && !used.has(key)) {
        used.add(key);
        result.push(trimmed);
        if (result.length >= limit) return result;
      }
    }

    for (const candidate of this.shuffleArray(fallbackPool)) {
      const trimmed = (candidate || '').trim();
      const key = trimmed.toLowerCase();
      if (trimmed && !used.has(key)) {
        used.add(key);
        result.push(trimmed);
        if (result.length >= limit) return result;
      }
    }

    return result;
  }

  /**
   * Sinh bộ câu hỏi trắc nghiệm / điền từ từ các bài Từ vựng & Ngữ pháp (không tự ghi vào DB).
   * Dùng chung cho cả tính năng Luyện Quiz và Đấu Trường Leo Núi.
   */
  async buildPracticeQuestionPool(params: {
    topicIds?: string[];
    grammarLessonIds?: string[];
    vocabQuestionMode?: 'en_to_vi' | 'vi_to_en' | 'mixed_abcd' | 'mixed_all';
    questionCount: number;
    onlyMcq?: boolean;
    publishedGrammarOnly?: boolean;
  }) {
    const topicObjectIds = (params.topicIds || [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const grammarObjectIds = (params.grammarLessonIds || [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (topicObjectIds.length === 0 && grammarObjectIds.length === 0) {
      throw new BadRequestException(
        'Vui lòng chọn ít nhất 1 bài học Từ vựng hoặc 1 bài Ngữ pháp.',
      );
    }

    const grammarStatusFilter = params.publishedGrammarOnly
      ? ('published' as const)
      : { $ne: 'draft' as const };

    const [selectedTopics, selectedVocabs, selectedGrammars] = await Promise.all([
      topicObjectIds.length > 0
        ? this.topicModel.find({ _id: { $in: topicObjectIds } }).lean()
        : Promise.resolve([]),
      topicObjectIds.length > 0
        ? this.vocabularyModel.find({ topicId: { $in: topicObjectIds } }).lean()
        : Promise.resolve([]),
      grammarObjectIds.length > 0
        ? this.lessonModel
            .find({ _id: { $in: grammarObjectIds }, status: grammarStatusFilter })
            .lean()
        : Promise.resolve([]),
    ]);

    // Lấy pool dự phòng từ DB nếu các bài đã chọn có ít hơn 8 từ để vẫn tạo đủ 4 đáp án A/B/C/D
    let extraVocabs: any[] = [];
    if (selectedVocabs.length > 0 && selectedVocabs.length < 8) {
      extraVocabs = await this.vocabularyModel
        .find()
        .select('word meaning')
        .limit(40)
        .lean();
    }

    const allMeanings = [
      ...selectedVocabs.map((v: any) => v.meaning),
      ...extraVocabs.map((v: any) => v.meaning),
    ].filter(Boolean);
    const allWords = [
      ...selectedVocabs.map((v: any) => v.word),
      ...extraVocabs.map((v: any) => v.word),
    ].filter(Boolean);

    const vocabMode = params.vocabQuestionMode || 'mixed_abcd';
    const rawVocabQuestions = selectedVocabs.map((v: any) => {
      let chosenMode: 'en_to_vi' | 'vi_to_en' | 'fill_blank' = 'en_to_vi';
      if (vocabMode === 'vi_to_en') {
        chosenMode = 'vi_to_en';
      } else if (vocabMode === 'mixed_abcd') {
        chosenMode = Math.random() < 0.65 ? 'en_to_vi' : 'vi_to_en';
      } else if (vocabMode === 'mixed_all') {
        const r = Math.random();
        chosenMode = r < 0.45 ? 'en_to_vi' : r < 0.75 ? 'vi_to_en' : 'fill_blank';
      }
      return this.buildVocabQuestion(v, chosenMode, allMeanings, allWords);
    });

    const vocabQuestions = params.onlyMcq
      ? rawVocabQuestions.filter(
          (q) =>
            q.type === QuestionType.MULTIPLE_CHOICE &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            q.options.length <= 4,
        )
      : rawVocabQuestions;

    const grammarQuestions: Array<{
      sourceType: 'grammar';
      questionText: string;
      type: QuestionType;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }> = [];

    selectedGrammars.forEach((lesson: any) => {
      const exercises = Array.isArray(lesson.exercises) ? lesson.exercises : [];
      exercises.forEach((ex: any) => {
        if (!ex?.question || !ex?.correctAnswer) return;
        const isFill =
          ex.type === 'fill_blank' ||
          !Array.isArray(ex.options) ||
          ex.options.length < 2;
        if (params.onlyMcq && isFill) return;

        const uniqueOptions = isFill
          ? []
          : this.shuffleArray(
              Array.from(
                new Set(
                  [ex.correctAnswer, ...(ex.options || [])]
                    .map((o: any) => String(o || '').trim())
                    .filter(Boolean),
                ),
              ),
            );
        if (params.onlyMcq && (uniqueOptions.length < 2 || uniqueOptions.length > 4)) {
          return;
        }

        grammarQuestions.push({
          sourceType: 'grammar',
          questionText: String(ex.question).trim(),
          type: isFill
            ? QuestionType.FILL_IN_THE_BLANK
            : QuestionType.MULTIPLE_CHOICE,
          options: uniqueOptions,
          correctAnswer: String(ex.correctAnswer).trim(),
          explanation:
            (ex.explanation && String(ex.explanation).trim()) ||
            `Ôn lại cấu trúc trong bài "${lesson.title}".`,
        });
      });
    });

    const combinedPool = this.shuffleArray([
      ...vocabQuestions,
      ...grammarQuestions,
    ]);
    if (combinedPool.length === 0) {
      throw new BadRequestException(
        params.onlyMcq
          ? 'Các bài học đã chọn chưa có câu hỏi trắc nghiệm 2–4 đáp án hợp lệ (các câu điền từ đã được lọc bỏ).'
          : 'Các bài học bạn chọn hiện chưa có từ vựng hoặc câu hỏi bài tập nào.',
      );
    }

    const actualCount = Math.min(params.questionCount, combinedPool.length);
    let chosenQuestions = combinedPool.slice(0, actualCount);

    // Nếu chọn cả 2 nguồn và số câu >= 2, đảm bảo cả hai nguồn đều có ít nhất 1 câu
    if (vocabQuestions.length > 0 && grammarQuestions.length > 0 && actualCount >= 2) {
      const hasVocab = chosenQuestions.some((q) => q.sourceType === 'vocabulary');
      const hasGrammar = chosenQuestions.some((q) => q.sourceType === 'grammar');
      if (!hasVocab) {
        chosenQuestions[chosenQuestions.length - 1] =
          this.shuffleArray(vocabQuestions)[0];
      } else if (!hasGrammar) {
        chosenQuestions[chosenQuestions.length - 1] =
          this.shuffleArray(grammarQuestions)[0];
      }
      chosenQuestions = this.shuffleArray(chosenQuestions);
    }

    return {
      chosenQuestions,
      vocabMode,
      selectedTopics,
      selectedGrammars,
      vocabCount: vocabQuestions.length,
      grammarCount: grammarQuestions.length,
    };
  }

  /**
   * Tạo đề luyện thi ngẫu nhiên từ các bài Flashcard và/hoặc Ngữ pháp học sinh chọn
   */
  async generateCustomQuiz(userId: string, dto: GenerateCustomQuizDto): Promise<QuizDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID học viên không hợp lệ');
    }

    const {
      chosenQuestions,
      vocabMode,
      selectedTopics,
      selectedGrammars,
      vocabCount,
      grammarCount,
    } = await this.buildPracticeQuestionPool({
      topicIds: dto.topicIds,
      grammarLessonIds: dto.grammarLessonIds,
      vocabQuestionMode: dto.vocabQuestionMode || 'mixed_abcd',
      questionCount: dto.questionCount,
      onlyMcq: false,
      publishedGrammarOnly: false,
    });

    const actualCount = chosenQuestions.length;

    let quizType = QuizType.GENERAL;
    if (vocabCount > 0 && grammarCount === 0) {
      quizType = QuizType.VOCABULARY;
    } else if (grammarCount > 0 && vocabCount === 0) {
      quizType = QuizType.GRAMMAR;
    }

    const level =
      (selectedTopics[0] as any)?.level ||
      (selectedGrammars[0] as any)?.level ||
      EnglishLevel.B1;

    const parts: string[] = [];
    if (selectedTopics.length > 0) parts.push(`${selectedTopics.length} bài Từ vựng`);
    if (selectedGrammars.length > 0) parts.push(`${selectedGrammars.length} bài Ngữ pháp`);

    const autoTitle = `Đề Tự Luyện ${actualCount} Câu (${parts.join(' + ')})`;
    const durationMinutes =
      dto.durationMinutes || Math.max(5, Math.min(90, Math.ceil(actualCount * 0.75)));

    const createdQuiz = await new this.quizModel({
      title: dto.title?.trim() || autoTitle,
      description: `Đề trộn ngẫu nhiên ${actualCount} câu từ ${parts.join(' và ')}.`,
      type: quizType,
      level,
      durationMinutes,
      passingScore: 70,
      totalQuestions: chosenQuestions.length,
      isCustomPractice: true,
      ownerId: new Types.ObjectId(userId),
      sourceTopicIds: selectedTopics.map((t: any) => t._id),
      sourceGrammarLessonIds: selectedGrammars.map((g: any) => g._id),
      questionMode: vocabMode,
      createdBy: new Types.ObjectId(userId),
    }).save();

    await this.questionModel.insertMany(
      chosenQuestions.map((q, idx) => ({
        quizId: createdQuiz._id,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        order: idx + 1,
      })),
    );

    return this.findById(createdQuiz._id.toString());
  }

  /**
   * Lấy danh sách đề thi công khai theo bộ lọc (ẩn các đề tự luyện cá nhân)
   */
  async findAll(query?: {
    type?: QuizType;
    level?: EnglishLevel;
    topicId?: string;
    grammarLessonId?: string;
    search?: string;
  }): Promise<QuizDocument[]> {
    const filter: Record<string, any> = {
      isCustomPractice: { $ne: true },
    };

    if (query?.type) filter.type = query.type;
    if (query?.level) filter.level = query.level;
    if (query?.topicId && Types.ObjectId.isValid(query.topicId)) {
      filter.topicId = new Types.ObjectId(query.topicId);
    }
    if (query?.grammarLessonId && Types.ObjectId.isValid(query.grammarLessonId)) {
      filter.grammarLessonId = new Types.ObjectId(query.grammarLessonId);
    }
    if (query?.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    return this.quizModel
      .find(filter)
      .populate('topicId', 'title slug level')
      .populate('grammarLessonId', 'title slug level')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết đề thi
   */
  async findById(id: string): Promise<QuizDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const quiz = await this.quizModel
      .findById(id)
      .populate('topicId', 'title slug level')
      .populate('grammarLessonId', 'title slug level')
      .populate('sourceTopicIds', 'title lessonNumber slug')
      .populate('sourceGrammarLessonIds', 'title level slug')
      .populate('createdBy', 'fullName email')
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Không tìm thấy đề thi có ID ${id}`);
    }

    return quiz;
  }

  /**
   * Lấy danh sách câu hỏi phục vụ làm bài kiểm tra (ẨN đáp án đúng & giải thích để chống gian lận)
   */
  async getQuestionsForQuiz(quizId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const questions = await this.questionModel
      .find({ quizId: new Types.ObjectId(quizId) })
      .select('_id quizId questionText type options order')
      .sort({ order: 1 })
      .exec();

    return questions;
  }

  /**
   * Chấm điểm bài kiểm tra tự động và thưởng điểm kinh nghiệm (XP)
   */
  async submitQuiz(
    quizId: string,
    userId: string,
    submitDto: SubmitQuizDto,
  ): Promise<QuizSubmissionDocument> {
    if (!Types.ObjectId.isValid(quizId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID đề thi hoặc học viên không hợp lệ');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy đề thi cần nộp');
    }

    // 1. Lấy toàn bộ câu hỏi gốc có chứa đáp án đúng từ DB
    const questions = await this.questionModel
      .find({ quizId: new Types.ObjectId(quizId) })
      .sort({ order: 1 })
      .exec();

    if (questions.length === 0) {
      throw new BadRequestException('Đề thi này chưa có câu hỏi nào');
    }

    const answerMap = new Map<string, string>();
    submitDto.answers.forEach((ans) => {
      answerMap.set(ans.questionId.toString(), ans.selectedAnswer);
    });

    // 2. Chấm điểm từng câu hỏi
    let correctCount = 0;
    const gradedAnswers = questions.map((q) => {
      const userSelected = (answerMap.get(q._id.toString()) || '').trim();
      const correctAnswer = q.correctAnswer.trim();

      let isCorrect = false;
      if (q.type === QuestionType.FILL_IN_THE_BLANK) {
        // Điền từ: so sánh không phân biệt hoa thường và khoảng trắng thừa
        isCorrect = userSelected.toLowerCase() === correctAnswer.toLowerCase();
      } else {
        // Trắc nghiệm: so khớp chính xác
        isCorrect = userSelected.toLowerCase() === correctAnswer.toLowerCase();
      }

      if (isCorrect) correctCount++;

      return {
        questionId: q._id,
        questionText: q.questionText,
        selectedAnswer: userSelected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= quiz.passingScore;

    // 3. Tính điểm thưởng XP: 10 XP mỗi câu đúng + 30 XP thưởng nếu vượt qua bài thi
    const xpEarned = correctCount * 10 + (passed ? 30 : 0);

    // 4. Lưu kết quả nộp bài vào DB
    const submission = new this.submissionModel({
      userId: new Types.ObjectId(userId),
      quizId: new Types.ObjectId(quizId),
      answers: gradedAnswers,
      score,
      correctCount,
      totalQuestions,
      passed,
      xpEarned,
    });

    const savedSubmission = await submission.save();

    // 5. Cập nhật điểm XP và Streak chuẩn Duolingo cho học viên
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);
    const todayStr = vnTime.toISOString().split('T')[0];

    const d = new Date(todayStr + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    const user = await this.userModel.findById(userId);
    let newStreak = 1;
    let streakIncreased = false;
    let isNewStreakDay = false;
    let newTotalXP = xpEarned;

    if (user) {
      if (user.lastActiveDate === todayStr) {
        newStreak = user.streak || 1;
        streakIncreased = false;
        isNewStreakDay = false;
      } else if (user.lastActiveDate === yesterdayStr) {
        newStreak = (user.streak || 0) + 1;
        streakIncreased = true;
        isNewStreakDay = true;
      } else {
        newStreak = 1;
        streakIncreased = true;
        isNewStreakDay = true;
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          $inc: { totalXP: xpEarned },
          $set: {
            streak: newStreak,
            lastActiveDate: todayStr,
          },
          $addToSet: {
            activeDates: todayStr,
          },
        },
        { new: true },
      );
      newTotalXP = updatedUser?.totalXP || (user.totalXP || 0) + xpEarned;
    }

    const subObj = (savedSubmission as any).toObject
      ? (savedSubmission as any).toObject()
      : savedSubmission;

    return {
      ...subObj,
      streak: newStreak,
      totalXP: newTotalXP,
      streakIncreased,
      isNewStreakDay,
      streakMessage: streakIncreased
        ? `Nối dài chuỗi ngày học lên ${newStreak} ngày liên tiếp!`
        : `Duy trì ngọn lửa học tập ${newStreak} ngày!`,
    };
  }

  /**
   * Xem lịch sử làm bài kiểm tra của học viên
   */
  async getUserSubmissions(userId: string, quizId?: string): Promise<QuizSubmissionDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID học viên không hợp lệ');
    }

    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (quizId && Types.ObjectId.isValid(quizId)) {
      filter.quizId = new Types.ObjectId(quizId);
    }

    return this.submissionModel
      .find(filter)
      .populate('quizId', 'title type level durationMinutes passingScore')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Xem chi tiết một bài nộp cụ thể
   */
  async getSubmissionDetail(submissionId: string, userId: string): Promise<QuizSubmissionDocument> {
    if (!Types.ObjectId.isValid(submissionId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const sub = await this.submissionModel
      .findOne({
        _id: new Types.ObjectId(submissionId),
        userId: new Types.ObjectId(userId),
      })
      .populate('quizId', 'title type level durationMinutes passingScore')
      .exec();

    if (!sub) {
      throw new NotFoundException('Không tìm thấy kết quả bài thi này');
    }

    return sub;
  }

  /**
   * Tạo đề thi mới (Admin / Teacher)
   */
  async createQuiz(createDto: CreateQuizDto, userId: string): Promise<QuizDocument> {
    const quiz = new this.quizModel({
      ...createDto,
      totalQuestions: 0,
      createdBy: new Types.ObjectId(userId),
    });

    return quiz.save();
  }

  /**
   * Thêm câu hỏi vào đề thi (Admin / Teacher)
   */
  async addQuestion(quizId: string, createQuestionDto: CreateQuestionDto): Promise<QuestionDocument> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    const question = new this.questionModel({
      ...createQuestionDto,
      quizId: new Types.ObjectId(quizId),
    });

    const saved = await question.save();

    // Tăng số lượng câu hỏi của đề thi
    await this.quizModel.findByIdAndUpdate(quizId, { $inc: { totalQuestions: 1 } });

    return saved;
  }

  /**
   * Cập nhật thông tin đề thi
   */
  async updateQuiz(id: string, updateDto: UpdateQuizDto): Promise<QuizDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const updated = await this.quizModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    return updated;
  }

  /**
   * Xóa đề thi và các câu hỏi liên quan (ADMIN xóa mọi đề; học viên xóa được đề tự luyện của mình)
   */
  async removeQuiz(
    id: string,
    requesterId?: string,
    requesterRole?: Role,
  ): Promise<{ deleted: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID đề thi không hợp lệ');
    }

    const existing = await this.quizModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Không tìm thấy đề thi');
    }

    const isAdmin = requesterRole === Role.ADMIN;
    const isOwnerCustom =
      existing.isCustomPractice &&
      requesterId &&
      existing.ownerId?.toString() === requesterId;

    if (!isAdmin && !isOwnerCustom) {
      throw new ForbiddenException('Bạn không có quyền xóa đề thi này');
    }

    await this.quizModel.findByIdAndDelete(id).exec();

    // Xóa toàn bộ câu hỏi và bài nộp liên quan
    await this.questionModel.deleteMany({ quizId: new Types.ObjectId(id) });
    await this.submissionModel.deleteMany({ quizId: new Types.ObjectId(id) });

    return { deleted: true, message: `Đã xóa thành công đề thi "${existing.title}"` };
  }
}
