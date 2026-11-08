/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Dịch vụ Trí tuệ Nhân tạo (AI Service) kết hợp Google Gemini API v1beta
 *              và Smart Offline Heuristic Engine bảo đảm độ sẵn sàng 100% không gián đoạn
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { CheckGrammarDto } from './dto/check-grammar.dto';
import { ExplainWordDto } from './dto/explain-word.dto';
import { ChatAiDto } from './dto/chat-ai.dto';
import { AnalyzeQuizDto } from './dto/analyze-quiz.dto';
import { AI_TUTOR_SYSTEM_GUARDRAILS } from './constants/ai-guardrails.constant';

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
}
