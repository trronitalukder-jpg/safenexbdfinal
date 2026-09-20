import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useThemeStore } from '../../store/useThemeStore';

interface MyProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  productType: 'DIGITAL' | 'PHYSICAL';
  status: string;
  images?: { imageUrl: string; isMain?: boolean }[];
  category?: { name: string };
  createdAt: string;
}

export const MyProductsScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();

  const [products, setProducts] = useState<MyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyProducts = useCallback(async () => {
    try {
      const res = await apiClient.get<MyProduct[]>('/products/my-products');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load my products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyProducts();
  };

  const handleDeleteProduct = (productId: string, title: string) => {
    Alert.alert(
      'বিজ্ঞাপন ডিলিট নিশ্চিতকরণ',
      `আপনি কি "${title}" বিজ্ঞাপনটি স্থায়ীভাবে ডিলিট করতে চান?`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'ডিলিট করুন',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/products/${productId}`);
              setProducts((prev) => prev.filter((p) => p.id !== productId));
              Alert.alert('সফল', 'বিজ্ঞাপনটি ডিলিট করা হয়েছে।');
            } catch (err: any) {
              Alert.alert('ত্রুটি', err.response?.data?.message || 'বিজ্ঞাপন ডিলিট করা সম্ভব হয়নি।');
            }
          },
        },
      ]
    );
  };

  const renderProductItem = ({ item }: { item: MyProduct }) => {
    const mainImg = item.images?.find((img) => img.isMain)?.imageUrl || item.images?.[0]?.imageUrl;
    const isDigital = item.productType === 'DIGITAL';

    return (
      <View style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          {mainImg ? (
            <Image source={{ uri: mainImg }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.background }]}>
              <Package size={24} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.detailsCol}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: isDigital ? '#8B5CF618' : '#F59E0B18' },
                ]}
              >
                <Text style={[styles.typeBadgeText, { color: isDigital ? '#8B5CF6' : '#F59E0B' }]}>
                  {isDigital ? 'ডিজিটাল' : 'ফিজিক্যাল'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 'PUBLISHED' || item.status === 'ACTIVE'
                        ? '#10B98118'
                        : '#6B728018',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        item.status === 'PUBLISHED' || item.status === 'ACTIVE'
                          ? '#10B981'
                          : '#6B7280',
                    },
                  ]}
                >
                  {item.status === 'PUBLISHED' || item.status === 'ACTIVE' ? 'সক্রিয়' : item.status}
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>

            <Text style={[styles.price, { color: colors.primary }]}>৳{Number(item.price).toLocaleString()}</Text>
          </View>
        </View>

        {/* Card Action Footer */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
          >
            <Eye size={15} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>ভিউ দেখুন</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: '#EF444450' }]}
            onPress={() => handleDeleteProduct(item.id, item.title)}
          >
            <Trash2 size={15} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>ডিলিট</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>আমার প্রোডাক্ট ও সার্ভিস</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>বিজ্ঞাপন লোড হচ্ছে...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBox, { backgroundColor: colors.primary + '18' }]}>
            <Package size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>কোনো প্রোডাক্ট পাওয়া যায়নি</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            আপনি এখনো কোনো প্রোডাক্ট বা সার্ভিস আপলোড করেননি। এখনই নতুন বিজ্ঞাপন পোস্ট করে বিক্রি শুরু করুন।
          </Text>
          <TouchableOpacity
            style={[styles.postFirstBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.postFirstBtnText}>বিজ্ঞাপন পোস্ট করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 8,
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  postFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 10,
  },
  postFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
