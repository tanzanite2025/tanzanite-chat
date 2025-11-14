/**
 * Products Service
 * 
 * 处理商品相关的 API 请求
 */

import { API_BASE } from '../config';
import { formatPrice } from '../utils/format';

/**
 * 商品类型
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  regular_price: number;
  sale_price?: number;
  on_sale: boolean;
  stock_quantity?: number;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  sku?: string;
  images: ProductImage[];
  categories: ProductCategory[];
  tags: ProductTag[];
  attributes: ProductAttribute[];
  variations?: ProductVariation[];
  created_at: string;
  updated_at: string;
}

/**
 * 商品图片
 */
export interface ProductImage {
  id: number;
  src: string;
  alt?: string;
}

/**
 * 商品分类
 */
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

/**
 * 商品标签
 */
export interface ProductTag {
  id: number;
  name: string;
  slug: string;
}

/**
 * 商品属性
 */
export interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
}

/**
 * 商品变体
 */
export interface ProductVariation {
  id: number;
  price: number;
  regular_price: number;
  sale_price?: number;
  stock_quantity?: number;
  attributes: Record<string, string>;
}

/**
 * 商品列表响应
 */
interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * 商品详情响应
 */
interface ProductDetailResponse {
  product: Product;
}

/**
 * 获取商品列表
 */
export async function fetchProducts(
  page: number = 1,
  perPage: number = 20,
  filters?: {
    search?: string;
    category?: string;
    tag?: string;
    on_sale?: boolean;
    in_stock?: boolean;
  }
): Promise<ProductsResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.tag) {
      params.append('tag', filters.tag);
    }
    if (filters?.on_sale !== undefined) {
      params.append('on_sale', filters.on_sale ? '1' : '0');
    }
    if (filters?.in_stock !== undefined) {
      params.append('in_stock', filters.in_stock ? '1' : '0');
    }

    const response = await fetch(`${API_BASE}/products?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取商品列表失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取商品列表失败:', error);
    throw error;
  }
}

/**
 * 获取商品详情
 */
export async function fetchProductDetail(productId: number): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('获取商品详情失败');
    }

    const data: ProductDetailResponse = await response.json();
    return data.product;
  } catch (error) {
    console.error('获取商品详情失败:', error);
    throw error;
  }
}

/**
 * 搜索商品
 */
export async function searchProducts(keyword: string): Promise<Product[]> {
  try {
    const response = await fetchProducts(1, 50, {
      search: keyword,
    });
    return response.items;
  } catch (error) {
    console.error('搜索商品失败:', error);
    throw error;
  }
}

/**
 * 获取商品主图
 */
export function getProductMainImage(product: Product): string {
  return product.images?.[0]?.src || 'https://via.placeholder.com/300';
}

/**
 * 获取库存状态文本
 */
export function getStockStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    instock: '有货',
    outofstock: '缺货',
    onbackorder: '可预订',
  };
  return statusMap[status] || '未知';
}

/**
 * 获取库存状态颜色
 */
export function getStockStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    instock: '#10b981',
    outofstock: '#ef4444',
    onbackorder: '#f59e0b',
  };
  return colorMap[status] || '#6b7280';
}

/**
 * 生成商品分享文本
 */
export function generateProductShareText(product: Product): string {
  const price = product.on_sale && product.sale_price
    ? `${formatPrice(product.sale_price)} (原价 ${formatPrice(product.regular_price)})`
    : formatPrice(product.price);

  return `【${product.name}】\n\n${product.short_description || product.description || ''}\n\n价格：${price}\n库存：${getStockStatusText(product.stock_status)}`;
}
