# Top_EngLish

Nền tảng trực tuyến hỗ trợ học tiếng Anh từ vựng, ngữ pháp, luyện tập (Spaced Repetition & Quiz), theo dõi tiến độ cá nhân và trợ lý AI thông minh.
**Tác giả:** HoangBao

## Cấu trúc dự án

- **`top-english-backend/`**: Hệ thống Backend xây dựng bằng NestJS 12, Mongoose (MongoDB), TypeScript, JWT Authentication, Swagger Docs.
- **`top-english-frontend/`**: Ứng dụng Frontend xây dựng bằng Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Shadcn UI.

---

## Hướng dẫn cài đặt & khởi chạy

### 1. Khởi chạy Backend (NestJS)
```bash
cd top-english-backend
npm install
npm run start:dev
```
- **API Base URL:** `http://localhost:5001/api/v1`
- **Swagger UI (Tài liệu API):** `http://localhost:5001/api/docs`
- **Health Check Endpoint:** `http://localhost:5001/api/v1/health`

### 2. Khởi chạy Frontend (Next.js)
```bash
cd top-english-frontend
npm install
npm run dev
```
- **Website URL:** `http://localhost:3000`
