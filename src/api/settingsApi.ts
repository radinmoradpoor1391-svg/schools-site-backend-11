import { apiClient } from './axios';
import { SchoolConfig } from '../types';

export const settingsApi = {
  /**
   * Get school settings
   */
  async getSettings(): Promise<SchoolConfig> {
    const res = await apiClient.get<{ success: boolean; data: SchoolConfig }>('/settings');
    return res.data.data;
  },

  /**
   * Update school settings (Admin only)
   */
  async updateSettings(settings: Partial<SchoolConfig>): Promise<any> {
    const res = await apiClient.put<{ success: boolean; message: string }>('/admin/settings', settings);
    return res.data;
  },
};
