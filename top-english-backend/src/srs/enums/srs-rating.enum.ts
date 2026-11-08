/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Enum các mức đánh giá ghi nhớ trong thuật toán lặp lại ngắt quãng (SRS Rating)
 */

export enum SrsRating {
  AGAIN = 'again', // Quên / Chưa nhớ -> Ôn lại ngay sau 1 ngày (Level 0)
  HARD = 'hard',   // Khó nhớ -> Ôn lại sau 1 ngày (Level 1)
  GOOD = 'good',   // Nhớ tốt -> Ôn lại sau 3 đến 7 ngày (Level 2-3)
  EASY = 'easy',   // Rất dễ / Đã thuộc lòng -> Ôn lại sau 14 đến 30 ngày (Level 4 - Mastered)
}
