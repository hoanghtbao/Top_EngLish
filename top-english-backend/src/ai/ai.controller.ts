/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Controller cung cấp các REST API cho Trợ lý Trí tuệ Nhân tạo AI
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CheckGrammarDto } from './dto/check-grammar.dto';
import { ExplainWordDto } from './dto/explain-word.dto';
import { ChatAiDto } from './dto/chat-ai.dto';
import { AnalyzeQuizDto } from './dto/analyze-quiz.dto';

@ApiTags('Trợ lý AI (AI Assistant)')
@Controller('ai')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái kết nối của Trợ lý AI (Google Gemini vs Smart Engine)',
  })
  @ApiResponse({ status: 200, description: 'Lấy trạng thái thành công' })
  getStatus() {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy trạng thái AI thành công',
      data: this.aiService.getStatus(),
    };
  }

  @Post('check-grammar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kiểm tra và sửa lỗi ngữ pháp tiếng Anh (Grammar Polishing)',
    description: 'Phân tích câu, chỉ ra các lỗi sai ngữ pháp, chấm điểm độ tự nhiên và gợi ý viết lại nâng cao',
  })
  @ApiResponse({ status: 200, description: 'Phân tích ngữ pháp thành công' })
  async checkGrammar(@Body() dto: CheckGrammarDto) {
    const data = await this.aiService.checkGrammar(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Kiểm tra và sửa lỗi ngữ pháp hoàn tất',
      data,
    };
  }

  @Post('explain-word')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tra cứu và giải thích chi tiết từ vựng (Word Deep Dive)',
    description: 'Phân tích ngữ cảnh, từ đồng nghĩa/trái nghĩa, collocations và mẹo ghi nhớ cho từ vựng',
  })
  @ApiResponse({ status: 200, description: 'Tra cứu từ vựng thành công' })
  async explainWord(@Body() dto: ExplainWordDto) {
    const data = await this.aiService.explainWord(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Tra cứu chuyên sâu từ vựng hoàn tất',
      data,
    };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hỏi đáp tương tác với Gia sư AI (AI English Tutor Chat)',
    description: 'Trò chuyện sư phạm, giải đáp mọi thắc mắc học tiếng Anh kèm gợi ý câu hỏi liên quan',
  })
  @ApiResponse({ status: 200, description: 'Phản hồi từ Gia sư AI thành công' })
  async chat(@Body() dto: ChatAiDto) {
    const data = await this.aiService.chat(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Gia sư AI phản hồi thành công',
      data,
    };
  }

  @Post('analyze-quiz-mistake')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Phân tích lỗi sai câu hỏi trắc nghiệm Quiz',
    description: 'Giải thích cặn kẽ tại sao đáp án học viên chọn lại sai và phương án đúng là gì',
  })
  @ApiResponse({ status: 200, description: 'Phân tích câu hỏi trắc nghiệm hoàn tất' })
  async analyzeQuizMistake(@Body() dto: AnalyzeQuizDto) {
    const data = await this.aiService.analyzeQuizMistake(dto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Phân tích câu hỏi hoàn tất',
      data,
    };
  }
}
