import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Share } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors } from '@/theme/colors';
import { fetchOrderDetail, formatOrderStatus, getOrderStatusColor, formatPrice, formatOrderNumber, type Order } from '@/services/orders';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

export default function OrderDetail({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      const data = await fetchOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      console.error('加载订单详情失败:', error);
      Alert.alert('错误', '加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!order) return;

    const message = `订单详情\n\n订单号：${order.order_number}\n客户：${order.customer_name}\n状态：${formatOrderStatus(order.status)}\n总金额：${formatPrice(order.total)}\n\n商品清单：\n${order.items.map(item => `- ${item.product_name} x${item.quantity} ${formatPrice(item.subtotal)}`).join('\n')}`;

    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>订单不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 订单状态 */}
      <View style={styles.statusSection}>
        <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{formatOrderStatus(order.status)}</Text>
        </View>
        <Text style={styles.orderNumber}>{formatOrderNumber(order.order_number)}</Text>
        <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString('zh-CN')}</Text>
      </View>

      {/* 客户信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>客户信息</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>姓名：</Text>
          <Text style={styles.infoValue}>{order.customer_name}</Text>
        </View>
        {order.customer_email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>邮箱：</Text>
            <Text style={styles.infoValue}>{order.customer_email}</Text>
          </View>
        )}
        {order.customer_phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>电话：</Text>
            <Text style={styles.infoValue}>{order.customer_phone}</Text>
          </View>
        )}
      </View>

      {/* 商品列表 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品清单</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.productItem}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.productPrice}>{formatPrice(item.price)} x {item.quantity}</Text>
            </View>
            <Text style={styles.productSubtotal}>{formatPrice(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      {/* 价格明细 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>价格明细</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>商品小计</Text>
          <Text style={styles.priceValue}>{formatPrice(order.subtotal)}</Text>
        </View>
        {order.discount_total > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>优惠金额</Text>
            <Text style={[styles.priceValue, styles.discountText]}>-{formatPrice(order.discount_total)}</Text>
          </View>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>运费</Text>
          <Text style={styles.priceValue}>{formatPrice(order.shipping_total)}</Text>
        </View>
        {order.tax_total > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>税费</Text>
            <Text style={styles.priceValue}>{formatPrice(order.tax_total)}</Text>
          </View>
        )}
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>订单总额</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
        </View>
      </View>

      {/* 配送信息 */}
      {(order.shipping_address || order.tracking_number) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>配送信息</Text>
          {order.shipping_address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>收货地址：</Text>
              <Text style={styles.infoValue}>{order.shipping_address}</Text>
            </View>
          )}
          {order.tracking_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>物流单号：</Text>
              <Text style={styles.infoValue}>{order.tracking_number}</Text>
            </View>
          )}
          {order.tracking_provider && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>物流公司：</Text>
              <Text style={styles.infoValue}>{order.tracking_provider}</Text>
            </View>
          )}
        </View>
      )}

      {/* 备注 */}
      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>备注</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      {/* 分享按钮 */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>分享订单信息</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted,
  },
  errorText: {
    fontSize: 14,
    color: colors.muted,
  },
  statusSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: colors.muted,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.muted,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: colors.muted,
  },
  productSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.text,
  },
  priceValue: {
    fontSize: 14,
    color: colors.text,
  },
  discountText: {
    color: '#ef4444',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  shareButton: {
    margin: 16,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
