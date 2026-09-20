import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/cards/ProductCard';
import { api } from '../../api/client';

export const MarketplaceScreen: React.FC = () => {
  const route = useRoute<any>();
  const { colors } = useThemeStore();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(route.params?.type || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(route.params?.category || '');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    api.get('/categories')
      .then((res: any) => {
        const catData = res?.data !== undefined ? res.data : res;
        if (Array.isArray(catData)) setCategories(catData);
      })
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.append('search', search.trim());
      if (selectedType === 'EXCHANGE') {
        query.append('canonicalUrl', '/money-exchange');
      } else if (selectedType) {
        query.append('type', selectedType);
      }
      if (selectedCategory) query.append('category', selectedCategory);

      const res: any = await api.get(`/products?${query.toString()}`);
      const list = res?.items || (Array.isArray(res) ? res : []);
      setProducts(list);
    } catch (e) {
      console.warn('Marketplace fetch error:', e);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedType, selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [selectedType, selectedCategory, search]);

  const handleSearchSubmit = () => {
    fetchProducts();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="মার্কেটপ্লেস" />

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          placeholder="প্রোডাক্ট বা ক্যাটাগরি দিয়ে খুঁজুন..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); fetchProducts(); }}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Type Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setSelectedType('')}
          style={[
            styles.filterPill,
            selectedType === ''
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: selectedType === '' ? '#fff' : colors.text },
            ]}
          >
            সকল
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedType('DIGITAL_DOWNLOAD')}
          style={[
            styles.filterPill,
            selectedType === 'DIGITAL_DOWNLOAD'
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: selectedType === 'DIGITAL_DOWNLOAD' ? '#fff' : colors.text },
            ]}
          >
            ডিজিটাল
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedType('PHYSICAL')}
          style={[
            styles.filterPill,
            selectedType === 'PHYSICAL'
              ? { backgroundColor: colors.success, borderColor: colors.success }
              : { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: selectedType === 'PHYSICAL' ? '#fff' : colors.text },
            ]}
          >
            ফিজিক্যাল
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedType('EXCHANGE')}
          style={[
            styles.filterPill,
            selectedType === 'EXCHANGE'
              ? { backgroundColor: '#D97706', borderColor: '#D97706' }
              : { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: selectedType === 'EXCHANGE' ? '#fff' : colors.text },
            ]}
          >
            এক্সচেঞ্জ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills Horizontal Scroll */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('')}
            style={[
              styles.categoryPill,
              selectedCategory === ''
                ? { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                { color: selectedCategory === '' ? colors.primary : colors.textMuted },
              ]}
            >
              সব ক্যাটাগরি
            </Text>
          </TouchableOpacity>

          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
              style={[
                styles.categoryPill,
                selectedCategory === c.slug
                  ? { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  { color: selectedCategory === c.slug ? colors.primary : colors.textMuted },
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Product Grid */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>প্রোডাক্ট লোড হচ্ছে...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <View style={styles.gridCol}>
              <ProductCard product={item} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>কোনো প্রোডাক্ট পাওয়া যায়নি</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                ভিন্ন নাম বা ফিল্টার দিয়ে পুনরায় অনুসন্ধান করুন।
              </Text>
            </View>
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  gridCol: {
    width: '50%',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 11.5,
    marginTop: 4,
    textAlign: 'center',
  },
});
