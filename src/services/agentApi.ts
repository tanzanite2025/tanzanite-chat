/**
 * 客服端 API Service
 * 
 * 对接 WordPress Tanzanite Customer Service 插件的客服端 API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, BASE_URL } from '../config';

const TOKEN_KEY = '@agent_token';
const AGENT_KEY = '@agent_info';

/**
 * 客服信息类型
 */
export interface Agent {
  agent_id: string;
  name: string;
  email: string;
  avatar: string;
}

/**
 * 会话数据类型
 */
export interface Conversation {
  id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  agent_id: string;
  status: string;
  last_message: string;
  last_message_at: string;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 消息数据类型
 */
export interface Message {
  id: number;
  conversation_id: string;
  sender_type: 'agent' | 'visitor';
  sender_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file';
  is_read: number;
  created_at: string;
}

/**
 * API 响应类型
 */
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  agent?: Agent;
  conversations?: Conversation[];
  messages?: Message[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 获取存储的 Token
 */
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('获取 Token 失败:', error);
    return null;
  }
}

/**
 * 保存 Token
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('保存 Token 失败:', error);
  }
}

/**
 * 删除 Token
 */
export async function removeToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(AGENT_KEY);
  } catch (error) {
    console.error('删除 Token 失败:', error);
  }
}

/**
 * 保存客服信息
 */
export async function saveAgent(agent: Agent): Promise<void> {
  try {
    await AsyncStorage.setItem(AGENT_KEY, JSON.stringify(agent));
  } catch (error) {
    console.error('保存客服信息失败:', error);
  }
}

/**
 * 获取客服信息
 */
export async function getAgent(): Promise<Agent | null> {
  try {
    const data = await AsyncStorage.getItem(AGENT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('获取客服信息失败:', error);
    return null;
  }
}

/**
 * 客服登录
 */
export async function login(
  agentId: string,
  password: string,
  deviceInfo?: string
): Promise<ApiResponse> {
  try {
    const url = `${API_BASE}/agent/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: agentId,
        password,
        device_info: deviceInfo || 'React Native App',
      }),
    });

    const data = await response.json();

    if (data.success && data.token) {
      await saveToken(data.token);
      await saveAgent(data.agent);
    }

    return data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

/**
 * 客服登出
 */
export async function logout(): Promise<void> {
  try {
    const token = await getToken();
    if (token) {
      const url = `${API_BASE}/agent/logout`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('登出失败:', error);
  } finally {
    await removeToken();
  }
}

/**
 * 获取客服信息（验证 Token）
 */
export async function getAgentInfo(): Promise<ApiResponse<Agent>> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/me`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('获取客服信息失败:', error);
    throw error;
  }
}

/**
 * 获取会话列表
 */
export async function fetchConversations(
  status: string = 'all',
  page: number = 1
): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/conversations?status=${status}&page=${page}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
  page: number = 1
): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/conversations/${conversationId}/messages?page=${page}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
  messageType: 'text' | 'image' | 'file' = 'text'
): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        message_type: messageType,
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
export async function markAsRead(conversationId: string): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/messages/read`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
      }),
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
 * 转接会话
 */
export async function transferConversation(
  conversationId: string,
  toAgentId: string,
  note?: string
): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/conversations/${conversationId}/transfer`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to_agent_id: toAgentId,
        note: note || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('转接会话失败:', error);
    throw error;
  }
}

/**
 * 获取转接历史
 */
export async function fetchTransferHistory(conversationId: string): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/conversations/${conversationId}/transfer-history`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取转接历史失败:', error);
    throw error;
  }
}

/**
 * 获取客服列表（用于转接）
 */
export async function fetchAgents(): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    // 使用访客端的客服列表 API
    const url = `${BASE_URL}/wp-json/tanzanite/v1/customer-service/agents`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取客服列表失败:', error);
    throw error;
  }
}

/**
 * 获取通知列表
 */
export async function fetchNotifications(unreadOnly: boolean = false): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/notifications${unreadOnly ? '?unread_only=true' : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取通知失败:', error);
    throw error;
  }
}

/**
 * 标记通知已读
 */
export async function markNotificationRead(notificationId: number): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/notifications/${notificationId}/read`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('标记通知已读失败:', error);
    throw error;
  }
}

/**
 * 标记所有通知已读
 */
export async function markAllNotificationsRead(): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/notifications/read-all`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('标记所有通知已读失败:', error);
    throw error;
  }
}

/**
 * 更新客服状态
 */
export async function updateAgentStatus(status: 'online' | 'busy' | 'away' | 'offline'): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/status`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('更新状态失败:', error);
    throw error;
  }
}

/**
 * 获取在线客服列表
 */
export async function fetchOnlineAgents(): Promise<ApiResponse> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const url = `${API_BASE}/agent/online-agents`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取在线客服失败:', error);
    throw error;
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
/**
 * 上传文件
 */
export async function uploadFile(
  conversationId: string,
  file: {
    uri: string;
    type: string;
    name: string;
  }
): Promise<{ url: string; success: boolean }> {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('未登录');
    }

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
    formData.append('conversation_id', conversationId);

    const url = `${API_BASE}/agent/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      url: data.url || data.data?.url || '',
      success: data.success || false,
    };
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
}

export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
