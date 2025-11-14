import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Share, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors } from '@/theme/colors';
import { fetchProductDetail, formatPrice, getStockStatusText, getStockStatusColor, generateProductShareText, type Product } from '@/services/products';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetail({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadProductDetail();
  }, [productId]);

  const loadProductDetail = async () => {
    try {
      const data = await fetchProductDetail(productId);
      setProduct(data);
    } catch (error) {
      console.error('加载商品详情失败:', error);
      Alert.alert('错误', '加载商品详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const message = generateProductShareText(product);

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

  if (!product) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>商品不存在</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 商品图片 */}
      <View style={styles.imageSection}>
        <Image
          source={{ uri: product.images[selectedImage]?.src || 'https://via.placeholder.com/400' }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        {product.images.length > 1 && (
          <ScrollView horizontal style={styles.thumbnailScroll} showsHorizontalScrollIndicator={false}>
            {product.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(index)}
                style={[
                  styles.thumbnail,
                  selectedImage === index && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri: image.src }} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 商品信息 */}
      <View style={styles.section}>
        <Text style={styles.productName}>{product.name}</Text>
        
        <View style={styles.priceRow}>
          {product.on_sale && product.sale_price ? (
            <>
              <Text style={styles.salePrice}>{formatPrice(product.sale_price)}</Text>
              <Text style={styles.regularPrice}>{formatPrice(product.regular_price)}</Text>
              <View style={styles.saleBadge}>
                <Text style={styles.saleText}>促销</Text>
              </View>
            </>
          ) : (
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          )}
        </View>

        <View style={styles.stockRow}>
          <View style={[styles.stockBadge, { backgroundColor: getStockStatusColor(product.stock_status) }]}>
            <Text style={styles.stockText}>{getStockStatusText(product.stock_status)}</Text>
          </View>
          {product.stock_quantity !== undefined && (
            <Text style={styles.stockQuantity}>库存: {product.stock_quantity} 件</Text>
          )}
        </View>

        {product.sku && (
          <Text style={styles.sku}>SKU: {product.sku}</Text>
        )}
      </View>

      {/* 商品描述 */}
      {product.short_description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品简介</Text>
          <Text style={styles.description}>{product.short_description}</Text>
        </View>
      )}

      {product.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>详细描述</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      )}

      {/* 商品属性 */}
      {product.attributes && product.attributes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品属性</Text>
          {product.attributes.map((attr, index) => (
            <View key={index} style={styles.attrRow}>
              <Text style={styles.attrName}>{attr.name}:</Text>
              <Text style={styles.attrValue}>{attr.options.join(', ')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 商品分类 */}
      {product.categories && product.categories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品分类</Text>
          <View style={styles.tagContainer}>
            {product.categories.map((cat) => (
              <View key={cat.id} style={styles.tag}>
                <Text style={styles.tagText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 分享按钮 */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>分享商品信息</Text>
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
  imageSection: {
    backgroundColor: '#fff',
  },
  mainImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.background,
  },
  thumbnailScroll: {
    padding: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginRight: 8,
  },
  regularPrice: {
    fontSize: 16,
    color: colors.muted,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  saleBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saleText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  stockText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  stockQuantity: {
    fontSize: 14,
    color: colors.text,
  },
  sku: {
    fontSize: 13,
    color: colors.muted,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  attrRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  attrName: {
    fontSize: 14,
    color: colors.muted,
    width: 80,
  },
  attrValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: colors.text,
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
