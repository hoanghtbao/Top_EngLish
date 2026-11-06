---
name: top-english-standards
description: Tiêu chuẩn kiến trúc, phong cách lập trình và quy tắc kỹ thuật bắt buộc cho toàn bộ dự án TopEnglish (NestJS Backend & Next.js Frontend).
---

# BỘ TIÊU CHUẨN LẬP TRÌNH DỰ ÁN TOPENGLISH
# Author: HoangBao

Mọi đoạn mã được tạo mới, chỉnh sửa hoặc tối ưu hóa trong dự án TopEnglish bắt buộc phải tuân thủ nghiêm ngặt 5 nguyên tắc kỹ thuật sau:

---

## 1. THÔNG TIN TÁC GIẢ & TÀI LIỆU CHUẨN (JSDOC / TSDOC)
1. Ở đầu mỗi file Controller, Service, Component chính, luôn có khối thông tin tác giả chuẩn JSDoc:
   ```typescript
   /**
    * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
    * @author HoangBao
    * @description [Mô tả ngắn gọn chức năng của file này]
    */
   ```
2. Đối với mọi hàm (Method/Function) xử lý nghiệp vụ:
   - Phải có chú thích JSDoc mô tả chức năng, `@param` giải thích các tham số đầu vào và `@returns` mô tả dữ liệu trả về.
   - Nhờ đó, Swagger `/api/docs` và Intellisense trong IDE sẽ tự động hiển thị hướng dẫn chi tiết.

---

## 2. NGUYÊN TẮC CHÚ THÍCH THÔNG MINH (SMART COMMENTING)
- **KHÔNG comment hiển nhiên**: Tránh các comment thừa thãi làm rác code (ví dụ: `import { Injectable }... // nạp Injectable`, `const a = 1; // gán biến a`).
- **BẮT BUỘC comment chi tiết bằng tiếng Việt** tại các vị trí sau:
  1. **Nghiệp vụ cốt lõi (Business Logic)**: Thuật toán tính ngày học liên tục (Streak), thuật toán lặp lại ngắt quãng (Spaced Repetition), logic chấm điểm và cộng điểm thưởng (XP) cho bài tập Quiz.
  2. **Truy vấn phức tạp**: Các câu lệnh MongoDB Aggregation Pipeline phức tạp, tính toán thống kê bảng xếp hạng.
  3. **Bảo mật**: Các đoạn mã mã hóa mật khẩu (`bcrypt`), xác thực token JWT, kiểm tra quyền hạn (Role-based Guard).

---

## 3. TIÊU CHUẨN BACKEND (NESTJS & MONGOOSE)
1. **Kiến trúc Module hóa**:
   - Mỗi tính năng phải là một Module riêng biệt (ví dụ: `AuthModule`, `VocabModule`, `QuizModule`, `UserModule`).
   - Tách biệt rõ ràng các tầng: Controller (nhận request) -> Service (xử lý logic) -> Mongoose Schema (tương tác MongoDB).
2. **TypeScript nghiêm ngặt**:
   - TUYỆT ĐỐI KHÔNG sử dụng kiểu dữ liệu `any`. Luôn định nghĩa rõ Interface, Type hoặc DTO.
3. **Định dạng phản hồi API thống nhất (Unified API Response)**:
   - Mọi API trả về cho Frontend phải tuân theo cấu trúc JSON chuẩn sau:
     ```json
     {
       "success": true,
       "statusCode": 200,
       "message": "Lấy danh sách từ vựng thành công",
       "data": [...]
     }
     ```
4. **Kiểm tra dữ liệu đầu vào (Validation) & Xử lý lỗi**:
   - 100% dữ liệu gửi lên phải qua file DTO sử dụng thư viện `class-validator` (chống thiếu trường, nhập sai định dạng email, password quá ngắn).
   - Luôn sử dụng Exception chuẩn của NestJS (`BadRequestException`, `NotFoundException`, `UnauthorizedException`), không bao giờ để lỗi sập server (500) không kiểm soát.

---

## 4. TIÊU CHUẨN FRONTEND (NEXT.JS, TAILWIND & SHADCN UI)
1. **Phân tách Rõ Ràng Server / Client Components**:
   - Mặc định ưu tiên Server Components để tối ưu tốc độ tải và SEO.
   - Chỉ thêm `"use client"` khi component cần xử lý sự kiện người dùng (bấm nút lật thẻ Flashcard, bấm nút loa phát âm Web Speech API, state form nhập liệu).
2. **Giao diện & Trải nghiệm người dùng (UI/UX)**:
   - Sử dụng Tailwind CSS kết hợp thư viện Shadcn UI.
   - Bố cục phải responsive 100% (hiển thị đẹp và mượt cả trên Mobile và Desktop).
   - Màu sắc chủ đạo: Xanh ngọc / Xanh dương hiện đại kích thích sự tập trung, kết hợp Dark/Light mode chuẩn chỉ.
   - Các hiệu ứng lật thẻ 3D dùng thư viện `framer-motion` mượt mà, không giật lag.

---

## 5. QUY CHUẨN ĐẶT TÊN (NAMING CONVENTIONS)
- **Tên file & thư mục**: Sử dụng `kebab-case` (chữ thường nối dấu gạch ngang): `vocab.controller.ts`, `auth.service.ts`, `flashcard-item.tsx`.
- **Tên Class, Interface, Type**: Sử dụng `PascalCase`: `VocabController`, `UserSchema`, `CreateVocabDto`.
- **Tên biến, hàm, thuộc tính**: Sử dụng `camelCase`: `calculateStreak()`, `userProgress`, `wordList`.
- **Tên hằng số, biến môi trường (.env)**: Sử dụng `UPPER_SNAKE_CASE`: `JWT_SECRET`, `MONGO_URI`, `PORT`.
