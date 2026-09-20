import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ShieldAlert,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { getImageUrl } from '../../utils/imageUtils';
import { APP_CONFIG } from '../../config';

export const MyDisputesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res: any = await api.get('/transactions/my?status=DISPUTED');
      const list = res?.items || (Array.isArray(res) ? res : []);
      setDisputes(list);
    } catch (err) {
      console.warn('Failed to load disputes:', err);
      setDisputes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDisputes();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="ডিসপ্যুট ও মীমাংসা ট্র্যাকার" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.topSection}>
          <Text style={[styles.heading, { color: colors.text }]}>বিরোধ নিষ্পত্তি ট্র্যাকার</Text>
          <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
            আপনার সক্রিয় ও মীমাংসিত বিরোধসমূহ পর্যবেক্ষণ করুন এবং অ্যাডমিন মধ্যস্থতা দেখুন।
          </Text>
        </View>

        {/* Mediation Notice */}
        <View style={[styles.noticeCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <AlertCircle size={18} color="#2563eb" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.noticeTitle}>অ্যাডমিন মধ্যস্থতা প্রক্রিয়া:</Text>
            <Text style={styles.noticeText}>
              ডিসপ্যুট ওপেন হলে অ্যাডমিন সম্পূর্ণ চ্যাট হিস্ট্রি, আপলোডকৃত প্রুফ এবং ট্রানজ্যাকশন ডাটা যাচাই করে চূড়ান্ত সিদ্ধান্ত দেন (টাকা রিফান্ড অথবা সেলারকে রিলিজ)।
            </Text>
          </View>
        </View>

        {/* List of Disputes */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : disputes.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ShieldCheck size={40} color="#10b981" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>কোনো সক্রিয় ডিসপ্যুট নেই</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              আপনার সকল লেনদেন নিরাপদে সম্পন্ন হয়েছে। কোনো অনিষ্পন্ন বিরোধ রেকর্ড নেই।
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {disputes.map((tx) => {
              const isBuyer = tx.senderId === user?.id;
              const counterparty = isBuyer ? tx.receiver : tx.sender;
              const avatar = getImageUrl(counterparty?.avatarUrl);

              return (
                <View
                  key={tx.id}
                  style={[styles.disputeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.userRow}>
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: '#e11d48' }]}>
                          <Text style={styles.avatarFallbackText}>
                            {counterparty?.firstName?.charAt(0) || 'U'}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={[styles.userName, { color: colors.text }]}>
                          @{counterparty?.uniqueUserId || 'User'}
                        </Text>
                        <Text style={[styles.roleTag, { color: colors.textMuted }]}>
                          {isBuyer ? 'Seller (বিক্রেতা)' : 'Buyer (ক্রেতা)'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.disputeBadge}>
                      <ShieldAlert size={12} color="#dc2626" />
                      <Text style={styles.disputeBadgeText}>DISPUTED</Text>
                    </View>
                  </View>

                  <View style={[styles.amountRow, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>হোল্ডকৃত পরিমাণ:</Text>
                    <Text style={[styles.amountVal, { color: '#e11d48' }]}>
                      {APP_CONFIG.currency} {Number(tx.amount || 0).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.trackingRow}>
                    <Text style={[styles.trackingLabel, { color: colors.textMuted }]}>ট্র্যাকিং নম্বর:</Text>
                    <Text style={[styles.trackingVal, { color: colors.text }]}>
                      {tx.trackingNumber || tx.id?.substring(0, 12)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('ChatDetail', {
                        conversationId: tx.conversationId,
                        targetUserId: counterparty?.id,
                        initialDealId: tx.id,
                      })
                    }
                    style={[styles.chatBtn, { backgroundColor: colors.primary }]}
                  >
                    <MessageSquare size={15} color="#ffffff" />
                    <Text style={styles.chatBtnText}>ডিসপ্যুট চ্যাট ওপেন করুন</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  noticeText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: '#1e40af',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 36,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    gap: 12,
  },
  disputeCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
  },
  roleTag: {
    fontSize: 11,
  },
  disputeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  disputeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingLabel: {
    fontSize: 11,
  },
  trackingVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
});

