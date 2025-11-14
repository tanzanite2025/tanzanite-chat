/**
 * Chat API Service
 * 
 * 对接 WordPress Tanzanite Setting 插件的聊天 API
 */

import { API_BASE } from '../config';

/**
 * 会话数据类型
 */
export interface Conversation {
  id: string;
  customer_id: number;
  customer_name: string;
  customer_avatar: string;
  customer_phone: string;
  agent_id: number;
  status: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  online: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 消息数据类型
 */
export interface ChatMessage {
  id: number;
  conversation_id: string;
  sender_id: number;
  sender_name: string;
  sender_type: 'agent' | 'customer';
  message: string;
  type: 'text' | 'image' | 'file';
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

/**
 * API 响应类型
 */
interface ApiResponse<T> {
  items?: T[];
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages?: number;
    has_more?: boolean;
  };
  message?: any;
  success?: boolean;
  count?: number;
  statuses?: any[];
  url?: string;
  type?: string;
  size?: number;
}

/**
 * 获取会话列表
 */
export async function fetchConversations(
  agentId: number,
  page = 1,
  perPage = 20
): Promise<ApiResponse<Conversation>> {
  try {
    const url = `${API_BASE}/chat/conversations?agent_id=${agentId}&page=${page}&per_page=${perPage}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取会话列表失败:', error);
    throw error;
  }
}

/**
 * 获取消息列表
 */
export async function fetchMessages(
  conversationId: string,
  page = 1,
  perPage = 50
): Promise<ApiResponse<ChatMessage>> {
  try {
    const url = `${API_BASE}/chat/messages/${conversationId}?page=${page}&per_page=${perPage}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取消息列表失败:', error);
    throw error;
  }
}

/**
 * 发送消息
 */
export async function sendMessage(
  conversationId: string,
  message: string,
  type: 'text' | 'image' | 'file' = 'text',
  attachmentUrl?: string
): Promise<ApiResponse<ChatMessage>> {
  try {
    const url = `${API_BASE}/chat/send`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        type,
        attachment_url: attachmentUrl || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
}

/**
 * 标记消息为已读
 */
export async function markAsRead(conversationId: string): Promise<any> {
  try {
    const url = `${API_BASE}/chat/mark-read/${conversationId}`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('标记已读失败:', error);
    throw error;
  }
}

/**
 * 获取在线状态
 */
export async function fetchStatus(conversationIds: string[]): Promise<any> {
  try {
    const ids = conversationIds.join(',');
    const url = `${API_BASE}/chat/status?conversation_ids=${encodeURIComponent(ids)}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取在线状态失败:', error);
    throw error;
  }
}

/**
 * 上传文件
 */
export async function uploadFile(
  conversationId: string,
  file: {
    uri: string;
    type?: string;
    name?: string;
  }
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    
    // 添加文件
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'upload.jpg',
    } as any);
    
    formData.append('conversation_id', conversationId);

    const url = `${API_BASE}/chat/upload`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
}

/**
 * 获取未读消息总数
 */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const url = `${API_BASE}/chat/unread-count`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    return 0;
  }
}

/**
 * 格式化时间
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  // 超过 7 天显示日期
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化消息时间（显示时:分）
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
