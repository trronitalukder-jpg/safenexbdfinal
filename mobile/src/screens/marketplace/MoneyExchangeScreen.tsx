import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Coins,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../config';

const BENCHMARK_PAIRS = [
  { from: 'USD (Payoneer / Wise)', to: 'BDT (bKash / Bank)', rate: '1 USD = 124.50 BDT', fee: '2.0% Escrow Fee' },
  { from: 'BDT (bKash / Nagad)', to: 'USD (Wise / Bank)', rate: '127.00 BDT = 1 USD', fee: '2.0% Escrow Fee' },
  { from: 'EUR (SEPA Transfer)', to: 'BDT (Local Bank)', rate: '1 EUR = 135.00 BDT', fee: '2.0% Escrow Fee' },
  { from: 'USDT (TRC20)', to: 'BDT (bKash / Bank)', rate: '1 USDT = 125.00 BDT', fee: '1.5% Escrow Fee' },
];

export const MoneyExchangeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [exchangeProducts, setExchangeProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExchangeOffers = async () => {
    try {
      const res: any = await api.get('/products?canonicalUrl=/money-exchange&limit=30');
      const list = res?.items || (Array.isArray(res) ? res : res?.data?.items || []);
      setExchangeProducts(list);
    } catch (e) {
      console.warn('Money exchange fetch error:', e);
      setExchangeProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExchangeOffers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExchangeOffers();
  }, []);

  const handlePostOffer = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('AddProduct', { destination: 'money_exchange' });
  };

  const handleStartChat = (sellerId: string) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('ChatDetail', { targetUserId: sellerId });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="মানি এক্সচেঞ্জ ও এসক্রো" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Hub Introduction Header */}
        <View style={styles.topSection}>
          <View style={[styles.badgePill, { backgroundColor: '#fef3c7' }]}>
            <Coins size={14} color="#d97706" />
            <Text style={styles.badgePillText}>পিয়ার-টু-পিয়ার কারেন্সি এক্সচেঞ্জ</Text>
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>মানি এক্সচেঞ্জ অফারসমূহ</Text>
          <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
            ডলার, ইউরো ও ক্রিপ্টো নিরাপদে এক্সচেঞ্জ করুন। টাকা থাকবে SafnexBD এসক্রো হোল্ডে।
          </Text>

          {/* Action Button: Post Offer */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePostOffer}
            style={[styles.postBtn, { backgroundColor: '#f59e0b' }]}
          >
            <Plus size={16} color="#ffffff" />
            <Text style={styles.postBtnText}>এক্সচেঞ্জ অফার পোস্ট করুন</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Disclaimer Card */}
        <View style={[styles.noticeCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
          <AlertCircle size={18} color="#b45309" style={{ marginTop: 2 }} />
          <Text style={styles.noticeText}>
            সতর্কবার্তা: মানি এক্সচেঞ্জের ক্ষেত্রে কেবল প্ল্যাটফর্মের চ্যাট এবং অফিসিয়াল এসক্রো হোল্ড ব্যবহার করুন। বাইরে লেনদেন করলে প্ল্যাটফর্ম দায়ী থাকবে না।
          </Text>
        </View>

        {/* Benchmark Rates Section */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>চলতি মার্কেট বেঞ্চমার্ক রেট</Text>
          </View>

          <View style={styles.benchmarkGrid}>
            {BENCHMARK_PAIRS.map((item, idx) => (
              <View
                key={idx}
                style={[styles.rateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.ratePair, { color: colors.text }]}>{item.from} ➔ {item.to}</Text>
                <Text style={[styles.rateValue, { color: '#059669' }]}>{item.rate}</Text>
                <Text style={[styles.rateFee, { color: colors.textMuted }]}>{item.fee}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* User-Uploaded Live Exchange Offers */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeader}>
            <Sparkles size={16} color="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>লাইভ এক্সচেঞ্জ লিস্টিং</Text>
            <Text style={[styles.countTag, { color: colors.textMuted }]}>({exchangeProducts.length} টি অফার)</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : exchangeProducts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Coins size={36} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                বর্তমানে কোনো কাস্টম এক্সচেঞ্জ অফার নেই।
              </Text>
              <TouchableOpacity onPress={handlePostOffer} style={[styles.smallBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.smallBtnText}>প্রথম অফারটি পোস্ট করুন</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.offersList}>
              {exchangeProducts.map((p) => (
                <View
                  key={p.id}
                  style={[styles.offerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.offerCardTop}>
                    <View style={styles.sellerRow}>
                      <View style={styles.sellerIconBox}>
                        <Coins size={14} color="#d97706" />
                      </View>
                      <Text style={[styles.sellerName, { color: colors.textSecondary }]}>
                        @{p.seller?.uniqueUserId || 'Trader'}
                      </Text>
                    </View>
                    <View style={styles.exchangeBadge}>
                      <Text style={styles.exchangeBadgeText}>EXCHANGE</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('ProductDetail', { slug: p.slug, id: p.id })}
                  >
                    <Text style={[styles.offerTitle, { color: colors.text }]} numberOfLines={2}>
                      {p.title}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: colors.textMuted }]}>অফার রেট / পরিমাণ:</Text>
                    <Text style={[styles.priceVal, { color: '#d97706' }]}>
                      {APP_CONFIG.currency} {Number(p.price || 0).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('ProductDetail', { slug: p.slug, id: p.id })}
                      style={[styles.viewBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                    >
                      <Text style={[styles.viewBtnText, { color: colors.text }]}>বিস্তারিত</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleStartChat(p.seller?.id)}
                      style={[styles.chatBtn, { backgroundColor: '#f59e0b' }]}
                    >
                      <MessageSquare size={14} color="#ffffff" />
                      <Text style={styles.chatBtnText}>চ্যাটে কথা বলুন</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  topSection: {
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 19,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  postBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#92400e',
    fontWeight: '500',
  },
  sectionBox: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  countTag: {
    fontSize: 12,
  },
  benchmarkGrid: {
    gap: 8,
  },
  rateCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
  },
  ratePair: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  rateValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  rateFee: {
    fontSize: 10.5,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  smallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  smallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  offersList: {
    gap: 10,
  },
  offerCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  offerCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
  },
  exchangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
  },
  exchangeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#d97706',
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  priceLabel: {
    fontSize: 11,
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chatBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});

