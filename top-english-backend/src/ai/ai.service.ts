/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Dịch vụ Trí tuệ Nhân tạo (AI Service) kết hợp Google Gemini API v1beta
 *              và Smart Offline Heuristic Engine bảo đảm độ sẵn sàng 100% không gián đoạn
 */

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { CheckGrammarDto } from './dto/check-grammar.dto';
import { ExplainWordDto } from './dto/explain-word.dto';
import { ChatAiDto } from './dto/chat-ai.dto';
import { AnalyzeQuizDto } from './dto/analyze-quiz.dto';
import { GenerateVocabJsonDto } from './dto/generate-vocab-json.dto';
import { AI_TUTOR_SYSTEM_GUARDRAILS } from './constants/ai-guardrails.constant';
import { PartOfSpeech } from '../vocabulary/enums/part-of-speech.enum';

export interface GrammarIssue {
  type: string;
  originalPart: string;
  suggestion: string;
  description: string;
}

export interface CheckGrammarResponse {
  originalText: string;
  correctedText: string;
  hasErrors: boolean;
  naturalnessScore: number;
  issues: GrammarIssue[];
  explanation: string;
  alternativeExpressions: string[];
}

export interface ExplainWordResponse {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  vietnameseMeaning: string;
  englishDefinition: string;
  cefrLevel: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  examples: Array<{ sentence: string; translation: string }>;
  memoryTip: string;
}

export interface ChatAiResponse {
  reply: string;
  suggestions: string[];
}

export interface AnalyzeQuizResponse {
  analysis: string;
  reasoning: string;
  grammarRule: string;
  tipToRemember: string;
}

export interface GeneratedVocabJsonItem {
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
  exampleSentence: string;
  exampleMeaning: string;
  distractors: string[];
  difficulty: number;
}

export interface GenerateVocabJsonResponse {
  mode: 'topic' | 'provided';
  provider: string;
  totalGenerated: number;
  requestedCount: number;
  strictTeacherListApplied: boolean;
  items: GeneratedVocabJsonItem[];
  jsonText: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private apiKey: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.getApiKey();

    if (this.apiKey) {
      this.logger.log('✨ Google Gemini API Key đã được cấu hình thành công từ .env.');
    } else {
      this.logger.warn('ℹ️ Chưa phát hiện GEMINI_API_KEY trong .env. Hệ thống chạy bằng Smart Offline Heuristic Engine.');
    }
  }

  /**
   * Đọc API Key động từ biến môi trường hoặc tệp .env (không cần restart máy chủ)
   */
  public getApiKey(): string | null {
    // 1. Thử lấy từ process.env hoặc ConfigService
    let key =
      process.env.GEMINI_API_KEY?.trim() ||
      this.configService.get<string>('GEMINI_API_KEY')?.trim() ||
      this.configService.get<string>('AI_API_KEY')?.trim() ||
      this.apiKey ||
      null;

    // 2. Nếu chưa có hoặc server đang chạy trước khi dán, đọc trực tiếp từ tệp top-english-backend/.env
    if (!key) {
      const envPaths = [
        path.resolve(process.cwd(), 'top-english-backend', '.env'),
        path.resolve(process.cwd(), '.env'),
      ];

      for (const envPath of envPaths) {
        try {
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('GEMINI_API_KEY=')) {
                const val = trimmedLine.replace('GEMINI_API_KEY=', '').trim();
                if (val && !val.startsWith('#')) {
                  key = val;
                  process.env.GEMINI_API_KEY = key;
                  this.apiKey = key;
                  break;
                }
              }
            }
            if (key) break;
          }
        } catch {}
      }
    }

    return key && key.length > 0 ? key : null;
  }

  /**
   * Lấy trạng thái kết nối hiện tại của AI
   */
  getStatus() {
    const key = this.getApiKey();
    return {
      hasKey: !!key,
      maskedKey: key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null,
      provider: key ? 'Google Gemini 2.5 Flash' : 'Smart Offline Heuristic Engine',
      description: key
        ? 'Đã cấu hình Google Gemini API Key phía Backend. Hệ thống xử lý bằng Gemini 2.5 Flash Cloud.'
        : 'Backend đang chạy Smart Engine sư phạm nội bộ (chưa dán GEMINI_API_KEY trong top-english-backend/.env).',
    };
  }

  /**
   * Gọi Google Gemini API nếu backend đã cấu hình API Key trong .env
   * Hỗ trợ systemInstruction chính thức để áp đặt các hàng rào bảo mật (Hard Guardrails)
   */
  private async callGemini(
    prompt: string,
    expectJson = true,
    systemInstruction?: string,
  ): Promise<any> {
    const key = this.getApiKey();
    if (!key) return null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
      const payload: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      if (expectJson) {
        payload.generationConfig.responseMimeType = 'application/json';
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(`Gemini API phản hồi mã lỗi ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) return null;

      if (expectJson) {
        const firstBrace = textOutput.indexOf('{');
        const lastBrace = textOutput.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonSub = textOutput.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonSub);
        }
        const cleanJson = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }

      return textOutput;
    } catch (err: any) {
      this.logger.warn(`Lỗi khi kết nối Google Gemini API: ${err.message}. Chuyển sang Smart Engine dự phòng.`);
      return null;
    }
  }

  /**
   * 1. Sửa lỗi ngữ pháp và viết lại câu (Grammar & Sentence Polishing)
   */
  async checkGrammar(dto: CheckGrammarDto): Promise<CheckGrammarResponse> {
    const text = dto.text.trim();
    const key = this.getApiKey();

    // Thử gọi Gemini API trước nếu backend đã có key
    if (key) {
      const prompt = `Bạn là chuyên gia ngôn ngữ tiếng Anh sư phạm hàng đầu của nền tảng TopEnglish. Hãy phân tích, sửa lỗi ngữ pháp và nâng cấp câu sau đây:
Văn bản cần sửa: "${text}"

Hãy trả về DUY NHẤT một JSON hợp lệ có định dạng sau:
{
  "originalText": "${text}",
  "correctedText": "câu đã được sửa chuẩn xác ngữ pháp và dấu câu",
  "hasErrors": true_hoặc_false,
  "naturalnessScore": điểm_từ_0_đến_100,
  "issues": [
    {
      "type": "Tên loại lỗi (ví dụ: Subject-Verb Agreement, Tense, Preposition...)",
      "originalPart": "từ hoặc cụm từ bị sai",
      "suggestion": "từ hoặc cụm từ thay thế",
      "description": "Giải thích chi tiết bằng tiếng Việt lý do sai và quy tắc ngữ pháp"
    }
  ],
  "explanation": "Nhận xét tổng quan bằng tiếng Việt về câu của học viên",
  "alternativeExpressions": [
    "Cách diễn đạt tự nhiên hơn trình độ B2/C1",
    "Cách diễn đạt trang trọng hoặc sinh động khác"
  ]
}`;
      const geminiResult = await this.callGemini(prompt, true);
      if (geminiResult && geminiResult.correctedText) {
        return geminiResult as CheckGrammarResponse;
      }
    }

    // Smart Offline Heuristic Engine
    return this.smartOfflineGrammarCheck(text);
  }

  /**
   * 2. Tra cứu và giải thích chi tiết từ vựng (Word Deep Dive)
   */
  async explainWord(dto: ExplainWordDto): Promise<ExplainWordResponse> {
    const word = dto.word.trim();
    const context = dto.context?.trim() || '';
    const key = this.getApiKey();

    // Thử gọi Gemini API trước nếu backend đã có key
    if (key) {
      const prompt = `Bạn là từ điển sư phạm thông minh của TopEnglish. Hãy phân tích chuyên sâu từ tiếng Anh sau:
Từ vựng: "${word}"
Ngữ cảnh sử dụng (nếu có): "${context}"

Hãy trả về DUY NHẤT một JSON hợp lệ có định dạng sau:
{
  "word": "${word}",
  "phonetic": "phiên âm IPA chuẩn Anh-Mỹ ví dụ /rɪˈzɪl.jənt/",
  "partOfSpeech": "từ loại ví dụ adjective / noun / verb",
  "vietnameseMeaning": "nghĩa tiếng Việt ngắn gọn, súc tích",
  "englishDefinition": "định nghĩa tiếng Anh chuẩn Oxford/Cambridge",
  "cefrLevel": "cấp độ ví dụ B1, B2, C1",
  "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2", "từ đồng nghĩa 3"],
  "antonyms": ["từ trái nghĩa 1", "từ trái nghĩa 2"],
  "collocations": ["cụm từ đi kèm 1", "cụm từ đi kèm 2", "cụm từ đi kèm 3"],
  "examples": [
    {
      "sentence": "Câu ví dụ tiếng Anh tự nhiên",
      "translation": "Dịch nghĩa tiếng Việt câu ví dụ"
    }
  ],
  "memoryTip": "Mẹo ghi nhớ nhanh liên tưởng hoặc nguồn gốc từ vựng"
}`;
      const geminiResult = await this.callGemini(prompt, true);
      if (geminiResult && geminiResult.vietnameseMeaning) {
        return geminiResult as ExplainWordResponse;
      }
    }

    // Smart Offline Word Engine
    return this.smartOfflineWordExplain(word, context);
  }

  /**
   * 3. Trò chuyện và hỏi đáp với Gia sư AI (AI English Tutor Chat)
   * Áp dụng mô hình phòng thủ đa lớp (Defense-in-depth):
   * - Lớp 1: Pre-flight Guardrail Detector kiểm tra đầu vào
   * - Lớp 2: Google Gemini System Instructions áp đặt nguyên tắc bảo mật cứng
   * - Lớp 3: Post-flight Output Sanitizer lọc bỏ các chuỗi nhạy cảm
   */
  async chat(dto: ChatAiDto): Promise<ChatAiResponse> {
    const message = dto.message.trim();
    const history = dto.history || [];

    // Lớp 1: Kiểm tra an ninh đầu vào (Pre-flight Security Gate)
    const securityCheck = this.validateChatSecurity(message);
    if (!securityCheck.isSafe) {
      this.logger.warn(
        `[AI Security Alert] Chặn câu hỏi chứa nghi vấn khai thác Database / System: "${message.substring(0, 80)}"`,
      );
      return {
        reply: securityCheck.refusalMessage,
        suggestions: [
          'Giải thích ngữ pháp Thì Hiện Tại Hoàn Thành',
          'Phân biệt từ vựng Make và Do',
          'Luyện nói câu tiếng Anh giao tiếp hàng ngày',
        ],
      };
    }

    const key = this.getApiKey();

    if (key) {
      const conversationHistory = history
        .map(
          (h) =>
            `${h.role === 'user' ? 'Học viên' : 'Gia sư TopEnglish'}: ${h.content}`,
        )
        .join('\n');

      const prompt = `Lịch sử hội thoại gần nhất:
${conversationHistory || 'Chưa có lịch sử trước đó.'}

Câu hỏi mới nhất của học viên: "${message}"

Hãy trả lời học viên bằng tiếng Việt sư phạm, chu đáo, đưa ví dụ tiếng Anh kèm phiên âm và dịch nghĩa, TUÂN THỦ 100% BỘ NGUYÊN TẮC BẢO MẬT HỆ THỐNG VÀ PHẠM VI NGHIỆP VỤ HỌC TIẾNG ANH ĐÃ ĐƯỢC CHỈ ĐỊNH TRONG SYSTEM INSTRUCTION.
Trả về JSON hợp lệ:
{
  "reply": "Nội dung phản hồi sư phạm an toàn",
  "suggestions": ["Gợi ý câu hỏi 1", "Gợi ý câu hỏi 2"]
}`;

      const geminiResult = await this.callGemini(
        prompt,
        true,
        AI_TUTOR_SYSTEM_GUARDRAILS,
      );

      if (geminiResult && geminiResult.reply) {
        // Lớp 3: Khử sạch dữ liệu nhạy cảm nếu có (Post-flight Sanitizer)
        const cleanReply = this.sanitizeAiOutput(geminiResult.reply);
        return {
          reply: cleanReply,
          suggestions: geminiResult.suggestions || [
            'Giải thích thêm ví dụ về chủ điểm này',
            'Cho tôi bài tập tự luyện tương tự',
          ],
        };
      }
    }

    return this.smartOfflineChat(message);
  }

  /**
   * 4. Phân tích lỗi sai bài tập Quiz (Quiz Mistake Explainer)
   */
  async analyzeQuizMistake(dto: AnalyzeQuizDto): Promise<AnalyzeQuizResponse> {
    const key = this.getApiKey();
    if (key) {
      const prompt = `Học viên làm bài kiểm tra tiếng Anh và chọn sai đáp án:
- Câu hỏi: "${dto.question}"
- Đáp án học viên chọn (Sai): "${dto.selectedAnswer}"
- Đáp án đúng của hệ thống: "${dto.correctAnswer}"
- Giải thích sơ bộ: "${dto.explanation || ''}"

Hãy phân tích cặn kẽ vì sao đáp án đã chọn lại sai và lý do tại sao đáp án đúng mới chuẩn ngữ pháp. Trả về JSON:
{
  "analysis": "Phân tích vì sao đáp án '${dto.selectedAnswer}' chưa đúng",
  "reasoning": "Lý do vì sao '${dto.correctAnswer}' là câu trả lời chuẩn xác nhất",
  "grammarRule": "Tên chủ điểm ngữ pháp liên quan",
  "tipToRemember": "Mẹo mẹo nhận biết nhanh trong bài thi trắc nghiệm"
}`;
      const geminiResult = await this.callGemini(prompt, true);
      if (geminiResult && geminiResult.reasoning) {
        return geminiResult as AnalyzeQuizResponse;
      }
    }

    return {
      analysis: `Bạn chọn "${dto.selectedAnswer}" chưa chính xác. Lỗi này thường do nhầm lẫn giữa thì của động từ hoặc cấu trúc hòa hợp trong câu.`,
      reasoning: `Đáp án chính xác là "${dto.correctAnswer}". Cấu trúc này phù hợp với ngữ cảnh câu hỏi và tuân theo nguyên tắc ngữ pháp tiêu chuẩn. ${dto.explanation || ''}`,
      grammarRule: 'Quy tắc hòa hợp thì và cấu trúc câu ngữ pháp',
      tipToRemember: 'Hãy tìm các từ khóa nhận biết (Signal Words) như trạng từ chỉ thời gian, giới từ đi kèm trước khi chọn phương án.',
    };
  }

  // ==========================================
  // SMART OFFLINE HEURISTIC ENGINES (FALLBACK)
  // ==========================================

  private smartOfflineGrammarCheck(text: string): CheckGrammarResponse {
    let corrected = text;
    const issues: GrammarIssue[] = [];

    const patterns: Array<{
      regex: RegExp;
      replace: string;
      type: string;
      desc: string;
    }> = [
      {
        regex: /\b(he|she|it)\s+don't\b/gi,
        replace: "$1 doesn't",
        type: 'Subject-Verb Agreement',
        desc: "Chủ ngữ ngôi thứ ba số ít (He/She/It) đi với trợ động từ phủ định 'doesn\\'t', không dùng 'don\\'t'.",
      },
      {
        regex: /\b(they|we|you)\s+is\b/gi,
        replace: '$1 are',
        type: 'Subject-Verb Agreement',
        desc: "Chủ ngữ số nhiều (They/We/You) đi với to be 'are', không dùng 'is'.",
      },
      {
        regex: /\b(he|she|it)\s+have\b/gi,
        replace: '$1 has',
        type: 'Subject-Verb Agreement',
        desc: "Chủ ngữ ngôi thứ ba số ít dùng 'has', không dùng 'have'.",
      },
      {
        regex: /\b(i)\s+is\b/gi,
        replace: 'I am',
        type: 'Subject-Verb Agreement',
        desc: "Đại từ 'I' luôn đi với động từ to be 'am'.",
      },
      {
        regex: /\b(i\s+am\s+agree)\b/gi,
        replace: 'I agree',
        type: 'Word Form / Collocation',
        desc: "'Agree' là một động từ thường mang nghĩa 'đồng ý', không dùng to be đi kèm 'I am agree' mà dùng 'I agree'.",
      },
      {
        regex: /\b(listen\s+music)\b/gi,
        replace: 'listen to music',
        type: 'Preposition',
        desc: "Động từ 'listen' cần có giới từ 'to' đi kèm trước tân ngữ: 'listen to music'.",
      },
      {
        regex: /\b(every\s+days)\b/gi,
        replace: 'every day',
        type: 'Noun Form',
        desc: "Sau 'every' là danh từ đếm được số ít: 'every day', không dùng 'every days'.",
      },
      {
        regex: /\b(since\s+(\d+|three|two|four|five|several)\s+(years|months|days))\b/gi,
        replace: 'for $2 $3',
        type: 'Tense Preposition',
        desc: "Chỉ một khoảng thời gian (khoảng bao lâu) dùng giới từ 'for', không dùng 'since'.",
      },
      {
        regex: /\b(look\s+forward\s+to\s+see)\b/gi,
        replace: 'look forward to seeing',
        type: 'Gerund Form',
        desc: "Cấu trúc 'look forward to' đi với V-ing: 'look forward to seeing'.",
      },
      {
        regex: /\b(discuss\s+about)\b/gi,
        replace: 'discuss',
        type: 'Unnecessary Preposition',
        desc: "'Discuss' là ngoại động từ mang nghĩa 'thảo luận về', không cần thêm giới từ 'about'.",
      },
      {
        regex: /\b(informations)\b/gi,
        replace: 'information',
        type: 'Uncountable Noun',
        desc: "'Information' là danh từ không đếm được trong tiếng Anh, không thêm số nhiều '-s'.",
      },
      {
        regex: /\b(advices)\b/gi,
        replace: 'advice',
        type: 'Uncountable Noun',
        desc: "'Advice' là danh từ không đếm được, không thêm '-s'. Muốn đếm dùng 'a piece of advice'.",
      },
    ];

    for (const p of patterns) {
      if (p.regex.test(corrected)) {
        const matches = text.match(p.regex);
        const originalPart = matches ? matches[0] : '';
        const replacedPart = originalPart ? originalPart.replace(p.regex, p.replace) : p.replace;
        corrected = corrected.replace(p.regex, p.replace);
        issues.push({
          type: p.type,
          originalPart,
          suggestion: replacedPart,
          description: p.desc,
        });
      }
    }

    // Viết hoa chữ cái đầu câu nếu chưa viết hoa
    if (corrected.length > 0 && corrected[0] === corrected[0].toLowerCase() && /[a-z]/.test(corrected[0])) {
      corrected = corrected[0].toUpperCase() + corrected.slice(1);
      issues.push({
        type: 'Capitalization',
        originalPart: text[0],
        suggestion: corrected[0],
        description: 'Chữ cái đầu câu luôn phải được viết hoa theo quy chuẩn chính tả tiếng Anh.',
      });
    }

    // Bổ sung dấu chấm cuối câu nếu thiếu
    if (corrected.length > 0 && !/[.!?]$/.test(corrected)) {
      corrected += '.';
      issues.push({
        type: 'Punctuation',
        originalPart: '(Cuối câu)',
        suggestion: '.',
        description: 'Câu trần thuật tiếng Anh cần có dấu chấm câu kết thúc.',
      });
    }

    const hasErrors = issues.length > 0;
    const naturalnessScore = hasErrors
      ? Math.max(50, 100 - issues.length * 15)
      : 98;

    return {
      originalText: text,
      correctedText: corrected,
      hasErrors,
      naturalnessScore,
      issues,
      explanation: hasErrors
        ? `Hệ thống phát hiện ${issues.length} điểm cần cải thiện trong câu của bạn về mặt ngữ pháp, cấu trúc động từ và dấu câu.`
        : 'Câu của bạn đã rất chuẩn xác và tự nhiên về mặt ngữ pháp!',
      alternativeExpressions: [
        `Gợi ý viết lại tự nhiên: "${corrected.replace(/\.$/, '')} as well."`,
        `Gợi ý nâng cao (B2/C1): "From my perspective, ${corrected.toLowerCase()}"`,
      ],
    };
  }

  private smartOfflineWordExplain(word: string, context: string): ExplainWordResponse {
    const lower = word.toLowerCase();

    const vocabularyDb: Record<string, Partial<ExplainWordResponse>> = {
      resilient: {
        phonetic: '/rɪˈzɪl.jənt/',
        partOfSpeech: 'Adjective',
        vietnameseMeaning: 'Kiên cường, mau hồi phục sau biến cố hoặc khó khăn',
        englishDefinition: 'Able to quickly return to a previous good condition or recover from difficulties.',
        cefrLevel: 'B2 - C1',
        synonyms: ['tenacious', 'adaptable', 'tough', 'durable'],
        antonyms: ['fragile', 'vulnerable', 'weak'],
        collocations: ['resilient economy', 'resilient personality', 'highly resilient'],
        examples: [
          {
            sentence: 'Children are often remarkably resilient in coping with difficult situations.',
            translation: 'Trẻ em thường kiên cường một cách đáng ngạc nhiên khi đối phó với những tình huống khó khăn.',
          },
          {
            sentence: 'The local economy proved to be remarkably resilient during the crisis.',
            translation: 'Nền kinh tế địa phương tỏ ra đặc biệt kiên cường trong thời kỳ khủng hoảng.',
          },
        ],
        memoryTip: "Gốc từ Latin 'silire' có nghĩa là 'bật nảy trở lại' (như lò xo bật lại khi bị nén).",
      },
      perseverance: {
        phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
        partOfSpeech: 'Noun',
        vietnameseMeaning: 'Sự kiên trì, bền chí vượt qua thử thách để đạt mục tiêu',
        englishDefinition: 'Continued effort to do or achieve something despite difficulties, failure, or opposition.',
        cefrLevel: 'B2',
        synonyms: ['persistence', 'determination', 'dedication', 'tenacity'],
        antonyms: ['apathy', 'laziness', 'hesitation'],
        collocations: ['remarkable perseverance', 'through sheer perseverance', 'show perseverance'],
        examples: [
          {
            sentence: 'Through hard work and perseverance, she achieved her dream of studying abroad.',
            translation: 'Nhờ sự chăm chỉ và bền bỉ, cô ấy đã đạt được ước mơ đi du học.',
          },
        ],
        memoryTip: "Nhớ từ: 'Per-' (xuyên suốt) + 'Severe' (gian khổ, khắc nghiệt) = Đi xuyên qua mọi khắc nghiệt.",
      },
      eloquent: {
        phonetic: '/ˈel.ə.kwənt/',
        partOfSpeech: 'Adjective',
        vietnameseMeaning: 'Hùng biện, lưu loát, có tài ăn nói thuyết phục',
        englishDefinition: 'Giving a clear, strong message; expressing oneself fluently and persuasively.',
        cefrLevel: 'C1',
        synonyms: ['articulate', 'expressive', 'persuasive', 'fluent'],
        antonyms: ['inarticulate', 'hesitant'],
        collocations: ['eloquent speech', 'eloquent speaker', 'eloquent plea'],
        examples: [
          {
            sentence: 'She made an eloquent speech in defense of environmental protection.',
            translation: 'Cô ấy đã có một bài phát biểu hùng biện đầy sức thuyết phục bảo vệ môi trường.',
          },
        ],
        memoryTip: "Gốc từ Latin 'loquor' mang nghĩa 'nói' (tương tự 'colloquial', 'soliloquy').",
      },
    };

    if (vocabularyDb[lower]) {
      const data = vocabularyDb[lower];
      return {
        word,
        phonetic: data.phonetic || `/${word}/`,
        partOfSpeech: data.partOfSpeech || 'Noun / Verb',
        vietnameseMeaning: data.vietnameseMeaning || `Ý nghĩa của từ "${word}"`,
        englishDefinition: data.englishDefinition || `The English definition of "${word}".`,
        cefrLevel: data.cefrLevel || 'B1',
        synonyms: data.synonyms || [],
        antonyms: data.antonyms || [],
        collocations: data.collocations || [],
        examples: data.examples || [],
        memoryTip: data.memoryTip || 'Gợi ý: Hãy đặt câu với từ này 3 lần trong ngày để nhớ lâu.',
      };
    }

    return {
      word,
      phonetic: `/${word.toLowerCase()}/`,
      partOfSpeech: 'Vocabulary Word',
      vietnameseMeaning: `Từ vựng tiếng Anh: "${word}"`,
      englishDefinition: context
        ? `Used in context: "${context}". Represents a key English vocabulary concept.`
        : `An important English word in everyday communication and academic study.`,
      cefrLevel: 'B1 - B2',
      synonyms: ['related term', 'parallel expression'],
      antonyms: ['opposite word'],
      collocations: [`use ${word}`, `practice ${word}`, `learn ${word} effectively`],
      examples: [
        {
          sentence: context || `You can use the word "${word}" to enrich your English speaking and writing.`,
          translation: `Bạn có thể dùng từ "${word}" để làm phong phú thêm vốn tiếng Anh nói và viết của mình.`,
        },
      ],
      memoryTip: `Mẹo: Ghi chép từ "${word}" vào sổ tay từ vựng và luyện tập với Flashcard 3D trong TopEnglish!`,
    };
  }

  private smartOfflineChat(message: string): ChatAiResponse {
    // Kiểm tra bảo mật ngay cả trên Smart Offline Engine
    const securityCheck = this.validateChatSecurity(message);
    if (!securityCheck.isSafe) {
      return {
        reply: securityCheck.refusalMessage,
        suggestions: [
          'Giải thích ngữ pháp Thì Hiện Tại Hoàn Thành',
          'Phân biệt từ vựng Make và Do',
          'Luyện nói câu tiếng Anh giao tiếp hàng ngày',
        ],
      };
    }

    const lower = message.toLowerCase();

    if (lower.includes('listen') && lower.includes('hear')) {
      return {
        reply: `Chào bạn! Rất nhiều người học hay nhầm lẫn giữa **"Listen"** và **"Hear"**:

1. **HEAR (Nghe thấy - thụ động):**
   - Diễn tả âm thanh tự lọt vào tai bạn mà bạn không cần chú ý hay cố gắng lắng nghe.
   - *Ví dụ:* "Did you hear that thunder?" (Cậu có nghe thấy tiếng sấm vừa rồi không?)

2. **LISTEN (Lắng nghe - chủ động):**
   - Bạn có ý thức tập trung, chú ý để nghe âm thanh đó.
   - **Lưu ý quan trọng:** Khi có tân ngữ phía sau, bắt buộc phải có **"to"**: *Listen to music*, *Listen to the teacher*.
   - *Ví dụ:* "I am listening to music." (Tôi đang lắng nghe nhạc.)`,
        suggestions: [
          'Cho tôi thêm bài tập phân biệt Hear và Listen',
          'Phân biệt Look, See và Watch',
        ],
      };
    }

    if (lower.includes('present perfect') || lower.includes('hiện tại hoàn thành') || lower.includes('quá khứ đơn')) {
      return {
        reply: `Chào bạn! Điểm khác biệt mấu chốt giữa **Hiện tại hoàn thành (Present Perfect)** và **Quá khứ đơn (Past Simple)** là:

- **Quá khứ đơn (Past Simple):**
  - Hành động đã xảy ra và **kết thúc hoàn toàn trong quá khứ**, có thời gian xác định cụ thể (*yesterday, in 2020, 2 days ago*).
  - *Ví dụ:* "I went to Da Nang last year." (Năm ngoái tôi đi Đà Nẵng).

- **Hiện tại hoàn thành (Present Perfect):**
  - Hành động xảy ra trong quá khứ nhưng **kết quả hoặc ảnh hưởng vẫn liên quan đến hiện tại**, hoặc diễn tả **trải nghiệm** tính đến nay không nhắc thời điểm cụ thể (*already, ever, never, since, for*).
  - *Ví dụ:* "I have visited Da Nang three times." (Tôi từng đến Đà Nẵng 3 lần).`,
        suggestions: [
          'Dấu hiệu nhận biết thì Hiện tại hoàn thành',
          'Cách chia động từ bất quy tắc phổ biến',
        ],
      };
    }

    if (lower.includes('in') && lower.includes('on') && lower.includes('at')) {
      return {
        reply: `Chào bạn! Quy tắc "Kim tự tháp ngược" cho giới từ **IN - ON - AT**:

1. **IN (Rộng nhất / Chung nhất):**
   - Thời gian: Năm, tháng, mùa, thế kỷ (*in 2026, in May, in summer*).
   - Địa điểm: Quốc gia, thành phố, không gian khép kín (*in Vietnam, in Hanoi, in the room*).

2. **ON (Cụ thể hơn một bậc):**
   - Thời gian: Ngày trong tuần, ngày tháng cụ thể (*on Monday, on May 15th*).
   - Địa điểm: Mặt phẳng, tên đường (*on the table, on Nguyen Hue street*).

3. **AT (Cụ thể và chính xác nhất):**
   - Thời gian: Giờ giấc chính xác, thời điểm (*at 7:00 AM, at noon, at midnight*).
   - Địa điểm: Địa chỉ nhà cụ thể, vị trí xác định (*at 123 Main Street, at the bus stop*).`,
        suggestions: [
          'Giới từ đi với phương tiện giao thông (in a car vs on a bus)',
          'Bài tập thực hành giới từ In On At',
        ],
      };
    }

    return {
      reply: `Chào bạn! Mình là Gia sư Tiếng Anh AI của TopEnglish 🌟. 

Mình có thể hỗ trợ bạn mọi vấn đề học tiếng Anh như:
- Sửa lỗi ngữ pháp và viết lại câu tự nhiên hơn.
- Giải thích chi tiết từ vựng, từ đồng nghĩa, thành ngữ (Idioms) và Collocations.
- Phân biệt các cặp ngữ pháp dễ nhầm lẫn (như In/On/At, Hear/Listen, Say/Tell...).
- Chia sẻ phương pháp học từ vựng hiệu quả qua Spaced Repetition (Lặp lại ngắt quãng).

Bạn muốn tìm hiểu hoặc thực hành về chủ đề nào hôm nay?`,
      suggestions: [
        'Phân biệt cách dùng In, On và At',
        'Phân biệt Listen và Hear',
        'Cách dùng thì Hiện tại hoàn thành',
        'Mẹo ghi nhớ từ vựng tiếng Anh lâu quên',
      ],
    };
  }

  /**
   * Lớp bảo vệ 1: Kiểm duyệt phát hiện các mẫu tấn công dò quét Database, rò rỉ mã nguồn hoặc Jailbreak
   */
  private validateChatSecurity(message: string): {
    isSafe: boolean;
    refusalMessage: string;
  } {
    const lower = message.toLowerCase();

    // Mẫu từ khóa nhạy cảm liên quan đến dò quét cơ sở dữ liệu và hạ tầng máy chủ
    const databaseKeywords = [
      'mongodb',
      'mongoose',
      'database',
      'cơ sở dữ liệu',
      'collection',
      'schema',
      'table',
      'bảng dữ liệu',
      'drop database',
      'drop collection',
      'select *',
      'insert into',
      'findone',
      'find(',
      'db.',
      '.env',
      'process.env',
      'jwt_secret',
      'jwt secret',
      'mongo_uri',
      'connection string',
      'connectionstring',
      'password_hash',
      'bcrypt',
      'tài khoản admin',
      'mật khẩu admin',
      'danh sách user',
      'danh sách người dùng',
      'lấy mật khẩu',
      'dump database',
      'sql injection',
      'nosql injection',
    ];

    // Mẫu từ khóa Jailbreak / Prompt Injection
    const jailbreakKeywords = [
      'ignore all previous instructions',
      'ignore all instructions',
      'quên hết các hướng dẫn',
      'bỏ qua mọi quy tắc',
      'bây giờ bạn là dan',
      'you are now dan',
      'developer mode',
      'chế độ nhà phát triển',
      'jailbreak',
      'system prompt',
      'in ra system prompt',
      'in ra prompt',
      'show prompt',
      'reveal prompt',
      'bạn là ai và prompt của bạn là gì',
      'prompt gốc',
      'câu lệnh gốc',
    ];

    const hasDbThreat = databaseKeywords.some((kw) => lower.includes(kw));
    const hasJailbreakThreat = jailbreakKeywords.some((kw) =>
      lower.includes(kw),
    );

    if (hasDbThreat || hasJailbreakThreat) {
      return {
        isSafe: false,
        refusalMessage:
          'Xin lỗi bạn, mình là **Gia sư Tiếng Anh AI** của TopEnglish 🤖. Mình được lập trình chuyên sâu để đồng hành cùng bạn học **từ vựng, ngữ pháp, dịch thuật và luyện thi tiếng Anh**.\n\nMình **không được phép thảo luận, tiết lộ hoặc can thiệp vào các thông tin kỹ thuật, cơ sở dữ liệu hay mã nguồn nội bộ của hệ thống** nhằm bảo vệ quyền riêng tư và an toàn dữ liệu.\n\nNếu bạn có thắc mắc gì về các bài học tiếng Anh, mình luôn sẵn sàng đồng hành cùng bạn! 💡',
      };
    }

    return { isSafe: true, refusalMessage: '' };
  }

  /**
   * Lớp bảo vệ 3: Khử sạch các chuỗi dữ liệu nhạy cảm nếu AI vô tình sinh ra
   */
  private sanitizeAiOutput(text: string): string {
    if (!text) return '';
    let sanitized = text;

    // Khử URI MongoDB
    sanitized = sanitized.replace(
      /mongodb(\+srv)?:\/\/[^\s]+/gi,
      '[ĐÃ BẢO VỆ]',
    );
    // Khử token JWT
    sanitized = sanitized.replace(
      /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
      '[TOKEN ĐÃ BẢO VỆ]',
    );
    // Khử Google Gemini API Key
    sanitized = sanitized.replace(
      /AIzaSy[a-zA-Z0-9_-]{33}/g,
      '[API_KEY ĐÃ BẢO VỆ]',
    );
    // Khử chuỗi hash bcrypt
    sanitized = sanitized.replace(
      /\$2[aby]\$[0-9]{2}\$[a-zA-Z0-9./]{53}/g,
      '[HASH ĐÃ BẢO VỆ]',
    );

    return sanitized;
  }

  /**
   * 5. Tạo danh sách từ vựng chuẩn JSON cho Giáo viên / Admin (Hỗ trợ 2 chế độ: Tự tạo theo chủ đề & Đúng danh sách giáo viên cung cấp)
   */
  async generateVocabJson(
    dto: GenerateVocabJsonDto,
  ): Promise<GenerateVocabJsonResponse> {
    const level = dto.level?.trim() || 'B1';
    const topicContext = dto.topicContext?.trim() || 'Business & Everyday English';
    const extraInstructions = dto.extraInstructions?.trim() || '';
    const hasKey = !!this.getApiKey();

    if (dto.mode === 'provided') {
      const seen = new Set<string>();
      const providedList: string[] = [];
      for (const raw of dto.providedWords || []) {
        const cleaned = String(raw || '').trim();
        if (!cleaned) continue;
        const keyLower = cleaned.toLowerCase();
        if (!seen.has(keyLower)) {
          seen.add(keyLower);
          providedList.push(cleaned);
        }
      }

      if (providedList.length === 0) {
        throw new BadRequestException(
          'Vui lòng nhập ít nhất 1 từ vựng do giáo viên cung cấp.',
        );
      }

      let rawAiItems: any[] = [];
      if (hasKey) {
        const systemRule = `You are a strict lexicographer assistant for TopEnglish teachers.
STRICT NON-NEGOTIABLE RULE FOR TEACHER-PROVIDED WORD LISTS:
1. You MUST generate vocabulary entries ONLY for the EXACT English words provided in the teacher's list, in the EXACT spelling and order given.
2. NEVER add extra words, synonyms as separate entries, or related words that are NOT in the teacher's list.
3. NEVER omit, skip, merge, or rename any word from the teacher's list.
4. The returned "items" array length MUST equal ${providedList.length}.`;

        const prompt = `Compile Vietnamese vocabulary JSON entries strictly for ONLY these ${providedList.length} English words/phrases:
${providedList.map((w, idx) => `${idx + 1}. "${w}"`).join('\n')}

Lesson context: "${topicContext}"
Target CEFR level: ${level}
${extraInstructions ? `Additional teacher notes: "${extraInstructions}"` : ''}

Return ONLY a valid JSON object matching this exact schema:
{
  "items": [
    {
      "word": "exact word from the numbered list above",
      "phonetic": "/IPA transcription/",
      "partOfSpeech": "noun | verb | adjective | adverb | preposition | conjunction | phrase",
      "meaning": "concise, accurate Vietnamese meaning(s) separated by comma",
      "exampleSentence": "natural English example sentence using this word",
      "exampleMeaning": "Vietnamese translation of exampleSentence",
      "distractors": ["3 plausible but clearly WRONG Vietnamese distractors for ABCD quiz"],
      "difficulty": 3
    }
  ]
}`;

        const geminiResult = await this.callGemini(prompt, true, systemRule);
        if (geminiResult && Array.isArray(geminiResult.items)) {
          rawAiItems = geminiResult.items;
        }
      }

      // Hard deterministic enforcement: align strictly 1-to-1 with teacher's providedList (zero extra words allowed)
      const aiMap = new Map<string, any>();
      for (const item of rawAiItems) {
        if (item && typeof item.word === 'string') {
          const k = item.word.trim().toLowerCase();
          if (seen.has(k) && !aiMap.has(k)) {
            aiMap.set(k, item);
          }
        }
      }

      const finalItems: GeneratedVocabJsonItem[] = providedList.map((teacherWord) => {
        const matched = aiMap.get(teacherWord.toLowerCase());
        if (matched) {
          return this.normalizeGeneratedVocabItem(matched, teacherWord, level);
        }
        return this.buildOfflineVocabItem(teacherWord, topicContext, level);
      });

      return {
        mode: 'provided',
        provider: hasKey && rawAiItems.length > 0 ? 'Google Gemini 2.5 Flash' : 'Smart Offline Engine',
        totalGenerated: finalItems.length,
        requestedCount: providedList.length,
        strictTeacherListApplied: true,
        items: finalItems,
        jsonText: JSON.stringify(finalItems, null, 2),
      };
    }

    // Mode: 'topic' — AI tự tạo danh sách từ vựng mới theo chủ đề
    if (!dto.topicContext || !dto.topicContext.trim()) {
      throw new BadRequestException(
        'Vui lòng nhập chủ đề hoặc ngữ cảnh bài học để AI tự tạo từ vựng.',
      );
    }

    const requestedCount = Math.min(Math.max(dto.count ?? 10, 1), 50);
    let rawTopicItems: any[] = [];

    if (hasKey) {
      const systemRule = `You are a curriculum designer and lexicographer for TopEnglish. Generate high-quality, practical English-Vietnamese vocabulary items strictly tailored to the requested topic and CEFR level.`;
      const prompt = `Generate ${requestedCount} distinct English vocabulary words or phrases for this lesson topic:
Topic / Context: "${topicContext}"
Target CEFR level: ${level}
${extraInstructions ? `Additional teacher notes: "${extraInstructions}"` : ''}

Return ONLY a valid JSON object with an "items" array of exactly ${requestedCount} unique items:
{
  "items": [
    {
      "word": "English word or phrase",
      "phonetic": "/IPA transcription/",
      "partOfSpeech": "noun | verb | adjective | adverb | preposition | conjunction | phrase",
      "meaning": "concise, accurate Vietnamese meaning(s) separated by comma",
      "exampleSentence": "natural English example sentence using this word",
      "exampleMeaning": "Vietnamese translation of exampleSentence",
      "distractors": ["3 plausible but clearly WRONG Vietnamese distractors for ABCD quiz"],
      "difficulty": 3
    }
  ]
}`;

      const geminiResult = await this.callGemini(prompt, true, systemRule);
      if (geminiResult && Array.isArray(geminiResult.items)) {
        rawTopicItems = geminiResult.items;
      }
    }

    const dedupMap = new Map<string, GeneratedVocabJsonItem>();
    for (const item of rawTopicItems) {
      if (!item || typeof item.word !== 'string' || !item.word.trim()) continue;
      const cleanedWord = item.word.trim();
      const key = cleanedWord.toLowerCase();
      if (!dedupMap.has(key)) {
        dedupMap.set(key, this.normalizeGeneratedVocabItem(item, cleanedWord, level));
      }
      if (dedupMap.size >= requestedCount) break;
    }

    let finalTopicItems = Array.from(dedupMap.values());
    if (finalTopicItems.length === 0) {
      finalTopicItems = this.buildOfflineTopicFallback(topicContext, level, requestedCount);
    }

    return {
      mode: 'topic',
      provider: hasKey && rawTopicItems.length > 0 ? 'Google Gemini 2.5 Flash' : 'Smart Offline Engine',
      totalGenerated: finalTopicItems.length,
      requestedCount,
      strictTeacherListApplied: false,
      items: finalTopicItems,
      jsonText: JSON.stringify(finalTopicItems, null, 2),
    };
  }

  private normalizeVocabPos(raw?: string): PartOfSpeech {
    const val = String(raw || '').trim().toLowerCase();
    if (val === 'n' || val === 'n.' || val === 'noun') return PartOfSpeech.NOUN;
    if (val === 'v' || val === 'v.' || val === 'verb') return PartOfSpeech.VERB;
    if (val === 'adj' || val === 'adj.' || val === 'adjective') return PartOfSpeech.ADJECTIVE;
    if (val === 'adv' || val === 'adv.' || val === 'adverb') return PartOfSpeech.ADVERB;
    if (val === 'prep' || val === 'prep.' || val === 'preposition') return PartOfSpeech.PREPOSITION;
    if (val === 'conj' || val === 'conj.' || val === 'conjunction') return PartOfSpeech.CONJUNCTION;
    if (val === 'phrase' || val === 'idiom') return PartOfSpeech.PHRASE;
    return PartOfSpeech.NOUN;
  }

  private defaultDifficultyForLevel(level: string): number {
    const lv = level.toUpperCase();
    if (lv.includes('A1')) return 1;
    if (lv.includes('A2')) return 2;
    if (lv.includes('B1')) return 3;
    if (lv.includes('B2')) return 4;
    if (lv.includes('C1') || lv.includes('C2')) return 5;
    return 3;
  }

  private normalizeGeneratedVocabItem(
    raw: any,
    exactWord: string,
    level: string,
  ): GeneratedVocabJsonItem {
    const meaning =
      typeof raw?.meaning === 'string' && raw.meaning.trim()
        ? raw.meaning.trim()
        : `Nghĩa của từ "${exactWord}"`;

    const distractors = Array.isArray(raw?.distractors)
      ? raw.distractors
          .filter((d: unknown): d is string => typeof d === 'string')
          .map((d: string) => d.trim())
          .filter((d: string, i: number, arr: string[]) => d && d !== meaning && arr.indexOf(d) === i)
          .slice(0, 3)
      : [];

    const fallbackDistractors = [
      'từ chối thực hiện',
      'trì hoãn vô thời hạn',
      'hủy bỏ hoàn toàn',
    ].filter((d) => d !== meaning && !distractors.includes(d));

    while (distractors.length < 3 && fallbackDistractors.length > 0) {
      distractors.push(fallbackDistractors.shift()!);
    }

    const diffNum = Number(raw?.difficulty);
    const difficulty =
      Number.isFinite(diffNum) && diffNum >= 1 && diffNum <= 5
        ? Math.round(diffNum)
        : this.defaultDifficultyForLevel(level);

    return {
      word: exactWord,
      phonetic:
        typeof raw?.phonetic === 'string' && raw.phonetic.trim()
          ? raw.phonetic.trim()
          : `/${exactWord.toLowerCase()}/`,
      partOfSpeech: this.normalizeVocabPos(raw?.partOfSpeech),
      meaning,
      exampleSentence:
        typeof raw?.exampleSentence === 'string' && raw.exampleSentence.trim()
          ? raw.exampleSentence.trim()
          : `We practiced using "${exactWord}" in our lesson today.`,
      exampleMeaning:
        typeof raw?.exampleMeaning === 'string' && raw.exampleMeaning.trim()
          ? raw.exampleMeaning.trim()
          : `Chúng tôi đã luyện tập sử dụng từ "${exactWord}" trong bài học hôm nay.`,
      distractors,
      difficulty,
    };
  }

  private buildOfflineVocabItem(
    word: string,
    topicContext: string,
    level: string,
  ): GeneratedVocabJsonItem {
    const offline = this.smartOfflineWordExplain(word, topicContext);
    const pos = word.includes(' ')
      ? PartOfSpeech.PHRASE
      : this.normalizeVocabPos(offline.partOfSpeech);
    return {
      word,
      phonetic: offline.phonetic || `/${word.toLowerCase()}/`,
      partOfSpeech: pos,
      meaning: offline.vietnameseMeaning || `Từ vựng: ${word}`,
      exampleSentence:
        offline.examples?.[0]?.sentence ||
        `This sentence illustrates the usage of "${word}" in ${topicContext}.`,
      exampleMeaning:
        offline.examples?.[0]?.translation ||
        `Câu này minh họa cách dùng từ "${word}" trong ngữ cảnh ${topicContext}.`,
      distractors: ['bỏ qua hoàn toàn', 'trì hoãn kế hoạch', 'giảm thiểu hiệu quả'],
      difficulty: this.defaultDifficultyForLevel(level),
    };
  }

  private buildOfflineTopicFallback(
    topicContext: string,
    level: string,
    count: number,
  ): GeneratedVocabJsonItem[] {
    const bank = [
      { word: 'collaborate', phonetic: '/kəˈlæb.ə.reɪt/', pos: PartOfSpeech.VERB, meaning: 'hợp tác, cộng tác', ex: 'Teams collaborate closely to meet tight project deadlines.', exVi: 'Các nhóm hợp tác chặt chẽ để kịp thời hạn dự án.' },
      { word: 'efficiency', phonetic: '/ɪˈfɪʃ.ən.si/', pos: PartOfSpeech.NOUN, meaning: 'hiệu suất, năng suất', ex: 'New workflow tools significantly improve operational efficiency.', exVi: 'Công cụ quy trình mới cải thiện đáng kể hiệu suất vận hành.' },
      { word: 'implement', phonetic: '/ˈɪm.plɪ.ment/', pos: PartOfSpeech.VERB, meaning: 'thực hiện, triển khai', ex: 'The company will implement the updated policy next quarter.', exVi: 'Công ty sẽ triển khai chính sách cập nhật vào quý tới.' },
      { word: 'negotiate', phonetic: '/nɪˈɡəʊ.ʃi.eɪt/', pos: PartOfSpeech.VERB, meaning: 'đàm phán, thương lượng', ex: 'Both parties met to negotiate the contract renewal terms.', exVi: 'Hai bên gặp nhau để đàm phán các điều khoản gia hạn hợp đồng.' },
      { word: 'proposal', phonetic: '/prəˈpəʊ.zəl/', pos: PartOfSpeech.NOUN, meaning: 'bản đề xuất, phương án', ex: 'The marketing team submitted a detailed budget proposal.', exVi: 'Nhóm tiếp thị đã nộp bản đề xuất ngân sách chi tiết.' },
      { word: 'reliable', phonetic: '/rɪˈlaɪ.ə.bəl/', pos: PartOfSpeech.ADJECTIVE, meaning: 'đáng tin cậy, ổn định', ex: 'We need a reliable supplier for raw materials.', exVi: 'Chúng tôi cần một nhà cung cấp nguyên liệu đáng tin cậy.' },
      { word: 'deadline', phonetic: '/ˈded.laɪn/', pos: PartOfSpeech.NOUN, meaning: 'hạn chót, thời hạn', ex: 'All reports must be submitted before Friday deadline.', exVi: 'Mọi báo cáo phải được nộp trước hạn chót thứ Sáu.' },
      { word: 'confirm', phonetic: '/kənˈfɜːm/', pos: PartOfSpeech.VERB, meaning: 'xác nhận', ex: 'Please confirm your attendance via email before noon.', exVi: 'Vui lòng xác nhận sự tham dự của bạn qua email trước trưa.' },
    ];
    return bank.slice(0, Math.min(count, bank.length)).map((item) => ({
      word: item.word,
      phonetic: item.phonetic,
      partOfSpeech: item.pos,
      meaning: item.meaning,
      exampleSentence: item.ex,
      exampleMeaning: item.exVi,
      distractors: ['bỏ lỡ cơ hội', 'hủy bỏ hợp đồng', 'từ chối tiếp nhận'],
      difficulty: this.defaultDifficultyForLevel(level),
    }));
  }
}
