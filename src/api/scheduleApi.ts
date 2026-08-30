import { apiClient } from './axios';
import { SchedulePeriod } from '../types';

export interface SchedulePeriodPayload {
  school_class_id?: string | number;
  class_id?: string | number;
  subject_id: string | number;
  teacher_id: string | number;
  day_of_week: string | number;
  period_number: number;
  start_time: string;
  end_time: string;
  room_number?: string | number;
}

export const scheduleApi = {
  /**
   * Fetch schedules with optional filters
   */
  async getSchedules(params?: { class_id?: string; teacher_id?: string; day_of_week?: string; view_all?: boolean }): Promise<SchedulePeriod[]> {
    const res = await apiClient.get<{ success: boolean; data: SchedulePeriod[] }>('/schedules', { params });
    return res.data.data;
  },

  /**
   * Create a new schedule period
   */
  async createSchedule(payload: SchedulePeriodPayload): Promise<any> {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/schedules', payload);
    return res.data;
  },

  /**
   * Update a schedule period
   */
  async updateSchedule(id: string | number, payload: Partial<SchedulePeriodPayload>): Promise<any> {
    const res = await apiClient.put<{ success: boolean; message: string; data: any }>(`/schedules/${id}`, payload);
    return res.data;
  },

  /**
   * Delete a schedule period
   */
  async deleteSchedule(id: string | number): Promise<any> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/schedules/${id}`);
    return res.data;
  },
};
