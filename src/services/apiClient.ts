/**
 * Centralized API Client Bridge for backward compatibility with existing code.
 * Routes all requests through our standard configured Axios instance.
 */
import apiClient, { ApiError } from '../api/axios';

export { ApiError };

export const api = {
  get: async <T = any>(endpoint: string, params?: Record<string, any>): Promise<T> => {
    const response = await apiClient.get<T>(endpoint, { params });
    return response.data;
  },

  post: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const response = await apiClient.post<T>(endpoint, body);
    return response.data;
  },

  put: async <T = any>(endpoint: string, body?: any): Promise<T> => {
    const response = await apiClient.put<T>(endpoint, body);
    return response.data;
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await apiClient.delete<T>(endpoint);
    return response.data;
  },
};

export default api;

