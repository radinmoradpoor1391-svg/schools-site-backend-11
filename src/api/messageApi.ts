import { apiClient } from './axios';

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string | null;
  classId: string | null;
  title: string;
  content: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessagePayload {
  receiver_id?: string | number;
  school_class_id?: string | number;
  title: string;
  content: string;
  category?: 'general' | 'homework' | 'grade' | 'announcement';
}

export const messageApi = {
  /**
   * Get user messages
   */
  async getMessages(): Promise<MessageItem[]> {
    const res = await apiClient.get<{ success: boolean; data: MessageItem[] }>('/messages');
    return res.data.data;
  },

  /**
   * Send a new message
   */
  async sendMessage(payload: SendMessagePayload): Promise<any> {
    const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/messages', payload);
    return res.data;
  },

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string | number): Promise<any> {
    const res = await apiClient.post<{ success: boolean; message: string }>(`/messages/${messageId}/read`);
    return res.data;
  },
};
