import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCw,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../config';

export const WalletScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user, refreshMe } = useAuthStore();

  const [wallet, setWallet] = useState<any>(user?.wallet || null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletAndLedger = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [wRes, lRes]: any = await Promise.allSettled([
        api.get('/wallet'),
        api.get('/wallet/ledger?limit=15'),
      ]);

      if (wRes.status === 'fulfilled') {
        const wData = wRes.value?.data !== undefined ? wRes.value.data : wRes.value;
        setWallet(wData);
      }

      if (lRes.status === 'fulfilled') {
        const lData = lRes.value?.items || (Array.isArray(lRes.value) ? lRes.value : []);
        setLedger(lData);
      }
    } catch (err) {
      console.warn('Wallet fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletAndLedger();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (user) {
      refreshMe();
      fetchWalletAndLedger();
    } else {
      setRefreshing(false);
    }
  }, [user]);

  const handleCancelWithdrawal = async (requestId: string) => {
    if (!requestId) return;
    Alert.alert(
      'উইথড্র বাতিল করুন',
      'আপনি কি এই পেন্ডিং উইথড্র আবেদনটি বাতিল করতে চান? পুরো টাকা সাথে সাথে আপনার ওয়ালেটে ফেরত আসবে।',
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, বাতিল করুন',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/wallet/withdraw/${requestId}/cancel`);
              Alert.alert('সফল', 'উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে এবং টাকা ওয়ালেটে ফেরত দেওয়া হয়েছে।');
              onRefresh();
            } catch (err: any) {
              Alert.alert('ত্রুটি', err.response?.data?.message || 'উইথড্র বাতিল করা সম্ভব হয়নি।');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="আমার ওয়ালেট" />
        <View style={styles.centerBox}>
          <Wallet size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>ওয়ালেট দেখতে লগইন করুন</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            আপনার নিরাপদ ওয়ালেট ব্যালেন্স, রিচার্জ ও উত্তোলন করতে লগইন করুন।
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[styles.loginBtn, { backgroundColor: '#0284c7' }]}
          >
            <Text style={styles.loginBtnText}>লগইন করুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const available = Number(wallet?.availableBalance || user.wallet?.availableBalance || 0);
  const hold = Number(wallet?.holdBalance || user.wallet?.holdBalance || 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="সেন্ট্রালাইজড ওয়ালেট" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Balance Cards Row */}
        <View style={styles.cardsRow}>
          {/* Available Balance */}
          <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                <Wallet size={16} color="#059669" />
              </View>
              <Text style={[styles.cardTag, { color: colors.textMuted }]}>অ্যাভেইলেবল</Text>
            </View>
            <Text style={[styles.balanceAmount, { color: colors.success }]}>
              {APP_CONFIG.currency} {available.toLocaleString()}
            </Text>
            <Text style={[styles.balanceDesc, { color: colors.textSecondary }]}>
              লেনদেন বা উত্তোলনের জন্য প্রস্তুত
            </Text>
          </View>

          {/* Hold Balance */}
          <View style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                <Lock size={16} color="#d97706" />
              </View>
              <Text style={[styles.cardTag, { color: colors.textMuted }]}>হোল্ড ব্যালেন্স</Text>
            </View>
            <Text style={[styles.balanceAmount, { color: colors.warning }]}>
              {APP_CONFIG.currency} {hold.toLocaleString()}
            </Text>
            <Text style={[styles.balanceDesc, { color: colors.textSecondary }]}>
              নিরাপদ এসক্রো চুক্তিতে লকড
            </Text>
          </View>
        </View>

        {/* Quick Actions (Recharge / Withdraw) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Recharge')}
            style={[styles.actionBtn, { backgroundColor: '#0284c7' }]}
          >
            <ArrowDownLeft size={18} color="#fff" />
            <Text style={styles.actionBtnText}>ওয়ালেট রিচার্জ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Withdraw')}
            style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 }]}
          >
            <ArrowUpRight size={18} color={colors.text} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>টাকা উত্তোলন (OTP)</Text>
          </TouchableOpacity>
        </View>

        {/* Ledger History Section */}
        <View style={styles.ledgerSection}>
          <View style={styles.ledgerHeader}>
            <Text style={[styles.ledgerTitle, { color: colors.text }]}>সাম্প্রতিক লেনদেন লেজার</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshIconBtn}>
              <RefreshCw size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : ledger.length === 0 ? (
            <View style={[styles.emptyLedgerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Clock size={32} color={colors.textMuted} />
              <Text style={[styles.emptyLedgerText, { color: colors.textSecondary }]}>
                এখনো কোনো লেনদেন সম্পন্ন হয়নি।
              </Text>
            </View>
          ) : (
            ledger.map((item: any) => {
              const isPlus = item.type?.includes('RECHARGE') || item.type?.includes('CREDIT') || item.type?.includes('RELEASE');
              return (
                <View
                  key={item.id}
                  style={[styles.ledgerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.ledgerTopRow}>
                    <View style={styles.ledgerBadgeRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: isPlus ? '#d1fae5' : '#fee2e2' },
                        ]}
                      >
                        <Text style={[styles.typeBadgeText, { color: isPlus ? '#059669' : '#dc2626' }]}>
                          {item.type}
                        </Text>
                      </View>
                      <Text style={[styles.ledgerDate, { color: colors.textMuted }]}>
                        {new Date(item.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.ledgerAmount,
                        { color: isPlus ? colors.success : colors.danger },
                      ]}
                    >
                      {isPlus ? '+' : '-'} {APP_CONFIG.currency} {Number(item.amount || 0).toLocaleString()}
                    </Text>
                  </View>

                  {item.note || item.description ? (
                    <Text style={[styles.ledgerNote, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.note || item.description}
                    </Text>
                  ) : null}

                  {item.type === 'WITHDRAWAL' && (item.status === 'PENDING' || !item.status) && (
                    <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        onPress={() => handleCancelWithdrawal(item.referenceId || item.id)}
                        style={{
                          backgroundColor: '#fee2e2',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <RotateCw size={12} color="#dc2626" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>
                          বাতিল ও রিফান্ড
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
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
    padding: 14,
    paddingBottom: 30,
    gap: 12,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  balanceCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTag: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  balanceDesc: {
    fontSize: 9.5,
    lineHeight: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  ledgerSection: {
    marginTop: 8,
    gap: 8,
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  ledgerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  refreshIconBtn: {
    padding: 4,
  },
  ledgerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  ledgerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ledgerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  ledgerDate: {
    fontSize: 10,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  ledgerNote: {
    fontSize: 11,
  },
  emptyLedgerBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyLedgerText: {
    fontSize: 12,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 8,
  },
  centerLoading: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginBtn: {
    marginTop: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
