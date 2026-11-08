/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description WebSocket Gateway xử lý sự kiện thi đấu leo núi thời gian thực (Real-time Mountain Climbing)
 */

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LiveGameService } from './live-game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveGameGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveGameGateway.name);

  constructor(private readonly liveGameService: LiveGameService) {}

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client đã kết nối Socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const { pin, player } = this.liveGameService.removePlayerBySocketId(
      client.id,
    );
    if (pin && player) {
      this.logger.log(`Client [${player.nickname}] đã ngắt kết nối khỏi phòng [${pin}]`);
      const room = this.liveGameService.getRoom(pin);
      if (room) {
        this.server.to(pin).emit('player_left', {
          socketId: client.id,
          nickname: player.nickname,
          players: Array.from(room.players.values()),
        });
      }
    }
  }

  /**
   * Người chơi gia nhập phòng bằng mã PIN, đặt tên và chọn nhân vật
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      pin: string;
      nickname: string;
      characterId: string;
      userId?: string;
    },
  ) {
    try {
      const livePlayer = this.liveGameService.addPlayer(data.pin, {
        socketId: client.id,
        nickname: data.nickname,
        characterId: data.characterId,
        userId: data.userId,
      });

      // Cho client gia nhập kênh Socket.io của phòng
      client.join(data.pin);

      const room = this.liveGameService.getRoom(data.pin);

      // Phản hồi cho chính người chơi
      client.emit('joined_success', {
        player: livePlayer,
        room: {
          pin: room?.pin,
          title: room?.title,
          status: room?.status,
          totalQuestions: room?.questions.length,
          timePerQuestion: room?.timePerQuestion,
        },
      });

      // Phát thông báo cho TẤT CẢ người trong phòng cập nhật danh sách chờ
      this.server.to(data.pin).emit('lobby_updated', {
        players: Array.from(room?.players.values() || []),
      });
    } catch (err: any) {
      client.emit('join_error', { message: err.message || 'Không thể vào phòng' });
    }
  }

  /**
   * Host (Giáo viên / Người tạo) bắt đầu trận đấu leo núi
   */
  @SubscribeMessage('start_game')
  handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pin: string },
  ) {
    const room = this.liveGameService.getRoom(data.pin);
    if (!room) {
      client.emit('game_error', { message: 'Phòng không tồn tại' });
      return;
    }

    room.status = 'playing';
    room.currentQuestionIndex = 0;

    const firstQuestion = room.questions[0];

    // Phát lệnh bắt đầu trận đấu cho TOÀN BỘ người chơi trong phòng
    this.server.to(data.pin).emit('game_started', {
      questionIndex: 0,
      totalQuestions: room.questions.length,
      question: {
        id: firstQuestion.id,
        question: firstQuestion.question,
        options: firstQuestion.options,
        timeLimit: firstQuestion.timeLimit,
      },
      players: Array.from(room.players.values()),
    });

    this.logger.log(`Trận đấu leo núi tại phòng [${data.pin}] chính thức BẮT ĐẦU!`);
  }

  /**
   * Học viên nộp đáp án - NHÍCH LÊN SƯỜN NÚI NGAY LẬP TỨC TRÊN TOÀN BỘ CLIENT
   */
  @SubscribeMessage('submit_answer')
  handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      pin: string;
      answerIndex: number;
      timeRemaining: number;
    },
  ) {
    try {
      const result = this.liveGameService.submitAnswer(
        data.pin,
        client.id,
        data.answerIndex,
        data.timeRemaining,
      );

      // Phản hồi riêng cho học viên nộp bài
      client.emit('answer_result', {
        isCorrect: result.isCorrect,
        correctAnswerIndex: result.correctAnswerIndex,
        scoreGain: result.scoreGain,
        climbGain: result.climbGain,
        totalScore: result.player.score,
        totalProgress: result.player.progress,
      });

      // PHÁT TÍN HIỆU REALTIME CHO TẤT CẢ MÀN HÌNH TRONG PHÒNG:
      // Nhân vật của học viên này nhích lên sườn núi ngay lập tức!
      this.server.to(data.pin).emit('player_climbed', {
        socketId: client.id,
        nickname: result.player.nickname,
        character: result.player.character,
        isCorrect: result.isCorrect,
        climbGain: result.climbGain,
        newProgress: result.player.progress,
        newScore: result.player.score,
        streak: result.player.streak,
      });
    } catch (err: any) {
      client.emit('answer_error', { message: err.message });
    }
  }

  /**
   * Hiển thị kết quả của vòng câu hỏi hiện tại
   */
  @SubscribeMessage('show_round_result')
  handleShowRoundResult(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pin: string },
  ) {
    const room = this.liveGameService.getRoom(data.pin);
    if (!room) return;

    room.status = 'question_result';
    const currentQ = room.questions[room.currentQuestionIndex];

    this.server.to(data.pin).emit('round_result_shown', {
      correctAnswerIndex: currentQ?.correctAnswerIndex,
      explanation: currentQ?.explanation,
      players: Array.from(room.players.values()),
    });
  }

  /**
   * Chuyển sang câu hỏi kế tiếp hoặc kết thúc trận đấu
   */
  @SubscribeMessage('next_question')
  async handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pin: string },
  ) {
    const step = this.liveGameService.nextQuestion(data.pin);

    if (step.hasMore && step.nextQuestion) {
      this.server.to(data.pin).emit('next_question_started', {
        questionIndex: step.questionIndex,
        totalQuestions: step.totalQuestions,
        question: {
          id: step.nextQuestion.id,
          question: step.nextQuestion.question,
          options: step.nextQuestion.options,
          timeLimit: step.nextQuestion.timeLimit,
        },
      });
    } else {
      // Đã hết câu hỏi -> Chạm đỉnh núi vinh quang!
      const finalResult = await this.liveGameService.finishGame(data.pin);
      this.server.to(data.pin).emit('game_finished', {
        podium: finalResult.podium,
        leaderboard: finalResult.leaderboard,
      });
      this.logger.log(`Trận đấu [${data.pin}] KẾT THÚC: Quán quân [${finalResult.podium[0]?.nickname}]`);
    }
  }
}
