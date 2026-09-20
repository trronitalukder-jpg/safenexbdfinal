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
  ShieldCheck,
  PlusCircle,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../config';

const STATUS_FILTERS = ['ALL', 'HOLD', 'RELEASED', 'WORKING', 'DISPUTED'];

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchTransactions = async () => {
    try {
      // Fetch public transactions feed or user transactions
      const res: any = await api.get('/transactions/admin/all?limit=30').catch(() => api.get('/transactions/my?limit=30'));
      const list = res?.items || (Array.isArray(res) ? res : res?.data?.items || []);
      setTransactions(list);
    } catch (e) {
      console.warn('Transactions fetch error:', e);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, []);

  const filteredList = transactions.filter((tx) => {
    if (selectedStatus === 'ALL') return true;
    return tx.status === selectedStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RELEASED':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'HOLD':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'DISPUTED':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'WORKING':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      default:
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="নিরাপদ লেনদেন হাব" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Top Header Card */}
        <View style={styles.topSection}>
          <View style={[styles.badgePill, { backgroundColor: '#f3e8ff' }]}>
            <ShieldCheck size={14} color="#7e22ce" />
            <Text style={styles.badgePillText}>মার্কেটপ্লেস এসক্রো</Text>
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>নিরাপদ লেনদেন ফিড</Text>
          <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
            বায়ার ও সেলারের মধ্যে মধ্যস্থতাকৃত সকল নিরাপদ লেনদেন পর্যবেক্ষণ করুন।
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
            style={[styles.startDealBtn, { backgroundColor: colors.primary }]}
          >
            <PlusCircle size={16} color="#ffffff" />
            <Text style={styles.startDealBtnText}>নতুন লেনদেন শুরু করুন</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setSelectedStatus(st)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedStatus === st ? colors.primary : colors.surface,
                  borderColor: selectedStatus === st ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedStatus === st ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {st === 'ALL'
                  ? 'সকল লেনদেন'
                  : st === 'HOLD'
                  ? 'সুরক্ষিত Hold'
                  : st === 'RELEASED'
                  ? 'সম্পন্ন (Released)'
                  : st === 'WORKING'
                  ? 'চলমান (Working)'
                  : 'ডিসপ্যুট (Disputed)'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : filteredList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ShieldCheck size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              এই ক্যাটাগরিতে কোনো লেনদেন রেকর্ড নেই।
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredList.map((tx) => {
              const statusStyle = getStatusColor(tx.status);
              return (
                <View
                  key={tx.id}
                  style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.txCardHeader}>
                    <View style={styles.trackingBox}>
                      <Text style={[styles.trackingText, { color: colors.primary }]}>
                        {tx.trackingNumber || tx.id?.substring(0, 10).toUpperCase()}
                      </Text>
                      {tx.transactionType ? (
                        <View style={[styles.typeTag, { backgroundColor: colors.surfaceSecondary }]}>
                          <Text style={[styles.typeTagText, { color: colors.textSecondary }]}>
                            {tx.transactionType}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                      ]}
                    >
                      <Text style={[styles.statusPillText, { color: statusStyle.text }]}>{tx.status}</Text>
                    </View>
                  </View>

                  {/* Parties Row */}
                  <View style={styles.partiesRow}>
                    <View style={styles.partyCol}>
                      <Text style={[styles.partyLabel, { color: colors.textMuted }]}>Buyer:</Text>
                      <Text style={[styles.partyId, { color: colors.text }]}>
                        @{tx.sender?.uniqueUserId || 'User'}
                      </Text>
                    </View>

                    <ArrowRight size={14} color={colors.textMuted} />

                    <View style={styles.partyCol}>
                      <Text style={[styles.partyLabel, { color: colors.textMuted }]}>Seller:</Text>
                      <Text style={[styles.partyId, { color: colors.text }]}>
                        @{tx.receiver?.uniqueUserId || 'User'}
                      </Text>
                    </View>
                  </View>

                  {/* Amount Row */}
                  <View style={styles.amountRow}>
                    <Text style={[styles.amountLabel, { color: colors.textMuted }]}>মোট সুরক্ষিত মূল্য:</Text>
                    <Text style={[styles.amountValue, { color: colors.success }]}>
                      {APP_CONFIG.currency} {Number(tx.amount || 0).toLocaleString()}
                    </Text>
                  </View>
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
    color: '#7e22ce',
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 19,
  },
  startDealBtn: {
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
  startDealBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  filterRow: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
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
  emptyText: {
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  txCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  txCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingText: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
  },
  typeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f920',
  },
  partyCol: {
    gap: 2,
  },
  partyLabel: {
    fontSize: 10,
  },
  partyId: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 11.5,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '900',
  },
});

