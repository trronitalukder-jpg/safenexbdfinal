import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Coins,
  TrendingUp,
  Package,
  User as UserIcon,
  CheckCircle2,
  X,
  Wallet,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../config';

export const MyBidsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user, refreshMe } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'USER_ID' | 'PRODUCTS'>('USER_ID');
  const [bidsData, setBidsData] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [bidType, setBidType] = useState<'USER_ID' | 'PRODUCT'>('USER_ID');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [bidAmount, setBidAmount] = useState('50');
  const [bidDays, setBidDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  const fetchBids = async () => {
    try {
      const [bidsRes, productsRes]: any = await Promise.allSettled([
        api.get('/bids/my-bids'),
        api.get('/products/my-products'),
      ]);

      if (bidsRes.status === 'fulfilled') {
        const b = bidsRes.value?.data !== undefined ? bidsRes.value.data : bidsRes.value;
        setBidsData(b);
      }

      if (productsRes.status === 'fulfilled') {
        const p = productsRes.value?.data !== undefined ? productsRes.value.data : productsRes.value;
        setProducts(Array.isArray(p) ? p : []);
      }
    } catch (err) {
      console.warn('Failed to load bids:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshMe();
    fetchBids();
  }, []);

  const handlePlaceBid = async () => {
    const amountNum = parseFloat(bidAmount);
    const daysNum = parseInt(bidDays, 10);
    const available = Number(user?.wallet?.availableBalance || 0);

    if (!amountNum || amountNum < 10) {
      Alert.alert('ভুল তথ্য', 'নূন্যতম বিড পরিমাণ ৳ ১০');
      return;
    }

    if (amountNum > available) {
      Alert.alert('পর্যাপ্ত ব্যালেন্স নেই', 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। রিচার্জ করুন।', [
        { text: 'বাতিল', style: 'cancel' },
        { text: 'রিচার্জ করুন', onPress: () => navigation.navigate('Recharge') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = bidType === 'USER_ID' ? '/bids/user-id' : '/bids/product';
      const payload: any = {
        amount: amountNum,
        days: daysNum || 7,
      };
      if (bidType === 'PRODUCT') {
        payload.productId = selectedProductId;
        payload.scope = 'HOME_PAGE';
      }

      await api.post(endpoint, payload);
      Alert.alert('সফল', 'আপনার বিড সফলভাবে প্লেস করা হয়েছে! র‍্যাঙ্কিং আপডেট হয়েছে।');
      setModalVisible(false);
      fetchBids();
      refreshMe();
    } catch (err: any) {
      Alert.alert('বিড ব্যর্থ হয়েছে', err.message || 'বিড প্লেস করতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="বিডিং ও পজিশন প্রমোশন" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.topSection}>
          <Text style={[styles.heading, { color: colors.text }]}>টপ পজিশন বিডিং সিস্টেম</Text>
          <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
            আপনার সেলার প্রোফাইল বা প্রোডাক্ট হোমপেজ ও সার্চ রেজাল্টের শীর্ষে তুলে ধরুন।
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('USER_ID')}
            style={[
              styles.tabBtn,
              activeTab === 'USER_ID' && { backgroundColor: colors.primary },
            ]}
          >
            <UserIcon size={14} color={activeTab === 'USER_ID' ? '#fff' : colors.textMuted} />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'USER_ID' ? '#fff' : colors.textSecondary },
              ]}
            >
              আইডি বিডিং (Top Seller)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('PRODUCTS')}
            style={[
              styles.tabBtn,
              activeTab === 'PRODUCTS' && { backgroundColor: colors.primary },
            ]}
          >
            <Package size={14} color={activeTab === 'PRODUCTS' ? '#fff' : colors.textMuted} />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'PRODUCTS' ? '#fff' : colors.textSecondary },
              ]}
            >
              প্রোডাক্ট বিডিং
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : activeTab === 'USER_ID' ? (
          /* USER ID BIDDING CARD */
          <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                <TrendingUp size={20} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>আপনার সেলার আইডি র‍্যাঙ্কিং</Text>
                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                  ইউজার আইডি: @{user?.uniqueUserId || 'You'}
                </Text>
              </View>
            </View>

            <View style={[styles.statRow, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={styles.statCol}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>বর্তমান পজিশন</Text>
                <Text style={[styles.statVal, { color: colors.primary }]}>
                  #{bidsData?.userIdBid?.position || 'আনর‍্যাঙ্কড'}
                </Text>
              </View>

              <View style={styles.statCol}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>চলতি বিড রেট</Text>
                <Text style={[styles.statVal, { color: '#059669' }]}>
                  {bidsData?.userIdBid?.amount ? `৳ ${bidsData.userIdBid.amount}` : 'কোনো বিড নেই'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setBidType('USER_ID');
                setModalVisible(true);
              }}
              style={[styles.bidActionBtn, { backgroundColor: colors.primary }]}
            >
              <Sparkles size={16} color="#ffffff" />
              <Text style={styles.bidActionBtnText}>সেলার আইডি টপে তোলার বিড দিন</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* PRODUCT BIDS LIST */
          <View style={styles.productList}>
            {products.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Package size={36} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  আপনার কোনো আপলোডকৃত প্রোডাক্ট নেই। প্রথমে প্রোডাক্ট যোগ করুন।
                </Text>
              </View>
            ) : (
              products.map((p) => (
                <View
                  key={p.id}
                  style={[styles.prodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.prodInfo}>
                    <Text style={[styles.prodTitle, { color: colors.text }]} numberOfLines={1}>
                      {p.title}
                    </Text>
                    <Text style={[styles.prodPrice, { color: colors.primary }]}>
                      মূল্য: ৳ {Number(p.price || 0).toLocaleString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedProductId(p.id);
                      setBidType('PRODUCT');
                      setModalVisible(true);
                    }}
                    style={[styles.prodBidBtn, { backgroundColor: '#059669' }]}
                  >
                    <TrendingUp size={13} color="#ffffff" />
                    <Text style={styles.prodBidBtnText}>টপ পজিশনে বিড করুন</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* BID SUBMISSION MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {bidType === 'USER_ID' ? 'সেলার আইডি বিড প্লেসমেন্ট' : 'প্রোডাক্ট টপ পজিশন বিড'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.balancePill, { backgroundColor: colors.surfaceSecondary }]}>
                <Wallet size={14} color="#059669" />
                <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                  ব্যবহারযোগ্য ব্যালেন্স: ৳ {Number(user?.wallet?.availableBalance || 0).toLocaleString()}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>বিড পরিমাণ (৳):</Text>
                <TextInput
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                  placeholder="যেমন ৫০"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>মেয়াদ (দিন):</Text>
                <TextInput
                  value={bidDays}
                  onChangeText={setBidDays}
                  keyboardType="numeric"
                  placeholder="যেমন ৭"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={submitting}
                onPress={handlePlaceBid}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>বিড নিশ্চিত করুন</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 18,
  },
  tabsRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  mainCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
  },
  statRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
  },
  statCol: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  bidActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bidActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  productList: {
    gap: 10,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  prodCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prodInfo: {
    flex: 1,
    gap: 3,
  },
  prodTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  prodPrice: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  prodBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  prodBidBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalBody: {
    gap: 14,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalSubmitBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

