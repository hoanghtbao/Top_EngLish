/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description Định nghĩa cấu trúc phản hồi chuẩn (Unified API Response)
 */

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp?: string;
}
