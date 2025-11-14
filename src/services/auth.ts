/**
 * Authentication Service
 * 
 * 处理用户登录、登出和身份验证
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config';

/**
 * 用户数据类型
 */
export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  avatar: string;
  roles: string[];
}

/**
 * 登录响应类型
 */
interface LoginResponse {
  user: User;
}

/**
 * 存储键
 */
const STORAGE_KEYS = {
  USER: '@chat_user',
  IS_LOGGED_IN: '@chat_is_logged_in',
};

/**
 * 登录
 */
export async function login(username: string, password: string): Promise<User> {
  try {
    const response = await fetch(`${API_BASE}/chat/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '登录失败');
    }

    const data: LoginResponse = await response.json();
    
    // 保存用户信息
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');

    return data.user;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/chat/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('登出失败:', error);
  } finally {
    // 清除本地存储
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE}/chat/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: LoginResponse = await response.json();
    
    // 更新本地存储
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');

    return data.user;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 从本地存储获取用户信息
 */
export async function getStoredUser(): Promise<User | null> {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    console.error('获取本地用户信息失败:', error);
    return null;
  }
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    return isLoggedIn === 'true';
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
}

/**
 * 验证登录状态（从服务器）
 */
export async function validateSession(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    return false;
  }
}
