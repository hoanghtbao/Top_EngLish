/**
 * @project TopEnglish - Nền tảng học tiếng Anh trực tuyến
 * @author HoangBao
 * @description HTTP Client gọi API Backend với Silent Token Refresh và định dạng phản hồi chuẩn Unified Response
 */

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

// Singleton Promise để xếp hàng các request đồng thời khi làm mới Access Token
let isRefreshingPromise: Promise<string | null> | null = null;

/**
 * Hàm làm mới Access Token thông qua Refresh Token một cách âm thầm (Silent Refresh)
 */
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    localStorage.removeItem('access_token');
    window.dispatchEvent(new Event('auth:unauthorized'));
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
      return null;
    }

    const data: ApiResponse<{ accessToken: string; refreshToken?: string }> =
      await res.json();

    if (data.success && data.data?.accessToken) {
      localStorage.setItem('access_token', data.data.accessToken);
      if (data.data.refreshToken) {
        localStorage.setItem('refresh_token', data.data.refreshToken);
      }
      return data.data.accessToken;
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('auth:unauthorized'));
    return null;
  } catch {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('auth:unauthorized'));
    return null;
  }
}

/**
 * Hàm gọi API tổng quát có xử lý Bearer Token, Silent Refresh khi 401 và Unified Response
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  // Nạp token từ localStorage nếu đang ở phía client
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Xử lý tự động làm mới Token (Silent Token Refresh) khi nhận 401 Unauthorized
    const isAuthRoute =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/refresh');

    if (response.status === 401 && typeof window !== 'undefined' && !isAuthRoute) {
      // Dùng chung Promise refresh để tránh race condition khi nhiều request 401 đồng thời
      if (!isRefreshingPromise) {
        isRefreshingPromise = refreshAccessToken().finally(() => {
          isRefreshingPromise = null;
        });
      }

      const newAccessToken = await isRefreshingPromise;
      if (newAccessToken) {
        // Gửi lại request ban đầu với Access Token mới
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });

        const retryData: ApiResponse<T> = await retryResponse.json();
        if (retryResponse.ok && retryData.success) {
          return retryData;
        }
      }
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Đã có lỗi xảy ra khi gọi API');
    }

    return data;
  } catch (err: any) {
    // Tự động thử lại với 127.0.0.1 nếu gặp sự cố phân giải IPv6 localhost trên Windows
    if (url.includes('localhost') && err.name === 'TypeError') {
      try {
        const fallbackUrl = url.replace('localhost', '127.0.0.1');
        const fallbackResponse = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
        const fallbackData: ApiResponse<T> = await fallbackResponse.json();
        if (fallbackResponse.ok && fallbackData.success) {
          return fallbackData;
        }
      } catch {
        // Tiếp tục ném lỗi gốc nếu cả 2 đều không kết nối được
      }
    }
    throw err;
  }
}
