import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Base URL configured for Laravel 12 API (defaults to /api via proxy or VITE_API_URL)
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Standardized API Error Object preserving HTTP status, validation errors, and server messages
 */
export class ApiError extends Error {
  status: number;
  data: any;
  validationErrors?: Record<string, string[]>;

  constructor(status: number, message: string, data?: any, validationErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.validationErrors = validationErrors;
  }
}

/**
 * Pre-configured Axios instance with Sanctum Token interceptors and comprehensive error handling.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request Interceptor: Attach Bearer Token automatically
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const rawToken = localStorage.getItem('auth_token');
    if (rawToken && config.headers) {
      const trimmed = rawToken.trim();
      const token = trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
      config.headers.Authorization = token;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401, 403, 422, and network errors gracefully
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;
      const requestUrl = error.config?.url || '';
      const isLoginEndpoint = requestUrl.includes('/auth/login');

      // 1. Handle 401 Unauthorized (Expired or invalid token on protected endpoints)
      if (status === 401 && !isLoginEndpoint) {
        localStorage.removeItem('auth_token');
        // Notify application of auth state expiration
        window.dispatchEvent(
          new CustomEvent('auth_unauthorized', {
            detail: { message: data?.message || 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.' },
          })
        );
        window.dispatchEvent(new Event('auth_state_changed'));
      }

      // 2. Handle 403 Forbidden (Insufficient role or deactivated account)
      if (status === 403) {
        window.dispatchEvent(
          new CustomEvent('auth_forbidden', {
            detail: { message: data?.message || 'شما دسترسی لازم برای این عملیات را ندارید.' },
          })
        );
      }

      // 3. Handle 422 Validation Errors from Laravel
      let validationErrors: Record<string, string[]> | undefined;
      let errorMessage = data?.message || data?.error || `خطای سرور (${status})`;

      if (status === 422 && data?.errors) {
        validationErrors = data.errors;
        const firstErrorKey = Object.keys(data.errors)[0];
        if (firstErrorKey && Array.isArray(data.errors[firstErrorKey]) && data.errors[firstErrorKey].length > 0) {
          errorMessage = data.errors[firstErrorKey][0];
        }
      }

      return Promise.reject(new ApiError(status, errorMessage, data, validationErrors));
    } else if (error.request) {
      // Network error, CORS rejection, or connection refused
      return Promise.reject(
        new ApiError(
          0,
          'عدم امکان برقراری ارتباط با سرور بک‌اند لاراول. لطفاً از روشن بودن سرور Laravel 12 بر روی پورت 8001 و صحت تنظیمات شبکه/CORS اطمینان حاصل فرمایید.',
          null
        )
      );
    } else {
      return Promise.reject(new ApiError(500, error.message || 'خطای نامشخص در پردازش درخواست.', null));
    }
  }
);

export default apiClient;

