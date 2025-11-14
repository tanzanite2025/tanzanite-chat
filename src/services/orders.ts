/**
 * Orders Service
 * 
 * 处理订单相关的 API 请求
 */

import { API_BASE } from '../config';
import { formatPrice, formatOrderNumber } from '../utils/format';

/**
 * 订单状态类型
 */
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

/**
 * 订单项类型
 */
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/**
 * 订单类型
 */
export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: OrderStatus;
  payment_method: string;
  channel: string;
  total: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  tracking_provider?: string;
  tracking_number?: string;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

/**
 * 订单列表响应
 */
interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * 订单详情响应
 */
interface OrderDetailResponse {
  order: Order;
}

/**
 * 获取订单列表
 */
export async function fetchOrders(
  page: number = 1,
  perPage: number = 20,
  filters?: {
    status?: OrderStatus;
    customer_keyword?: string;
    date_start?: string;
    date_end?: string;
  }
): Promise<OrdersResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.customer_keyword) {
      params.append('customer_keyword', filters.customer_keyword);
    }
    if (filters?.date_start) {
      params.append('date_start', filters.date_start);
    }
    if (filters?.date_end) {
      params.append('date_end', filters.date_end);
    }

    const response = await fetch(`${API_BASE}/orders?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取订单列表失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取订单列表失败:', error);
    throw error;
  }
}

/**
 * 获取订单详情
 */
export async function fetchOrderDetail(orderId: number): Promise<Order> {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取订单详情失败');
    }

    const data: OrderDetailResponse = await response.json();
    return data.order;
  } catch (error) {
    console.error('获取订单详情失败:', error);
    throw error;
  }
}

/**
 * 搜索订单
 */
export async function searchOrders(keyword: string): Promise<Order[]> {
  try {
    const response = await fetchOrders(1, 50, {
      customer_keyword: keyword,
    });
    return response.items;
  } catch (error) {
    console.error('搜索订单失败:', error);
    throw error;
  }
}

/**
 * 格式化订单状态
 */
export function formatOrderStatus(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  };
  return statusMap[status] || status;
}

/**
 * 获取订单状态颜色
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colorMap: Record<OrderStatus, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    completed: '#10b981',
    cancelled: '#6b7280',
    refunded: '#ef4444',
  };
  return colorMap[status] || '#6b7280';
}

// formatPrice 和 formatOrderNumber 已移至 utils/format.ts
