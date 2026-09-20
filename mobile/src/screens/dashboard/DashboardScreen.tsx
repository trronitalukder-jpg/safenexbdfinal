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
  Platform,
  TextInput,
  Modal,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import {
  Wallet,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  MessageSquare,
  ShieldCheck,
  Coins,
  TrendingUp,
  ShieldAlert,
  BookOpen,
  PlusCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  Settings,
  Percent,
  ExternalLink,
  Moon,
  Sun,
  LogOut,
  RefreshCw,
  AlertTriangle,
  User,
  Copy,
  FileText,
  Check,
  X,
  Smartphone,
  Headphones,
  LogIn,
  UserPlus,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { getImageUrl } from '../../utils/imageUtils';
import { APP_CONFIG } from '../../config';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { mode, colors, toggleTheme } = useThemeStore();
  const { user, refreshMe, logout } = useAuthStore();
  const { lang, toggleLang, t } = useLanguageStore();
  const insets = useSafeAreaInsets();

  // State: Data
  const [transactions, setTransactions] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [bidsCount, setBidsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State: Commission Settings & Interactive Calculator
  const [commissionSettings, setCommissionSettings] = useState<any>(null);
  const [calcAmount, setCalcAmount] = useState<string>('2000');
  const [calcType, setCalcType] = useState<'TRANSACTION' | 'WITHDRAW'>('TRANSACTION');

  // State: Settings Modal
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchDashboardData = async () => {
    try {
      await refreshMe();

      const [txRes, prodRes, bidRes, commRes]: any = await Promise.allSettled([
        api.get('/transactions/my?limit=8'),
        api.get('/products/my-products'),
        api.get('/bids/my-bids'),
        api.get('/commission/settings'),
      ]);

      if (txRes.status === 'fulfilled') {
        const txList = txRes.value?.items || (Array.isArray(txRes.value) ? txRes.value : []);
        setTransactions(txList);
      }

      if (prodRes.status === 'fulfilled') {
        const prodList = prodRes.value?.data !== undefined ? prodRes.value.data : prodRes.value;
        if (Array.isArray(prodList)) {
          setProductsCount(prodList.length);
        }
      }

      if (bidRes.status === 'fulfilled') {
        const bidList = bidRes.value?.data !== undefined ? bidRes.value.data : bidRes.value;
        if (Array.isArray(bidList)) {
          setBidsCount(bidList.length);
        }
      }

      if (commRes.status === 'fulfilled') {
        const commData = commRes.value?.data !== undefined ? commRes.value.data : commRes.value;
        setCommissionSettings(commData);
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sync modal inputs when user data updates
  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      lang === 'bn' ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Logout',
      lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?' : 'Are you sure you want to log out of your account?',
      [
        { text: lang === 'bn' ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'bn' ? 'লগআউট' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim()) {
      Alert.alert('অবহিতকরণ', 'অনুগ্রহ করে প্রথম নাম প্রদান করুন।');
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch('/users/profile', {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim() || undefined,
      });
      await refreshMe();
      setSettingsModalVisible(false);
      Alert.alert('সফল', 'আপনার প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে।');
    } catch (err: any) {
      Alert.alert('ত্রুটি', err?.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSupportPress = () => {
    Linking.openURL('https://wa.me/8801800000000').catch(() => {
      Alert.alert('সহায়তা', `সাপোর্ট সেন্টারে যোগাযোগ করতে আমাদের হেল্পলাইন ${APP_CONFIG.supportPhone} এ যোগাযোগ করুন।`);
    });
  };

  // Commission Calculations
  const withdrawCommSetting = commissionSettings?.withdraw;
  const isWithdrawCommActive = withdrawCommSetting ? withdrawCommSetting.isActive !== false : true;
  const withdrawRateType = withdrawCommSetting?.rateType || 'PERCENTAGE';
  const withdrawRateVal = withdrawCommSetting?.value !== undefined ? Number(withdrawCommSetting.value) : 2.0;
  const withdrawMinFee = Number(withdrawCommSetting?.minFee || 0);
  const withdrawMaxFee = Number(withdrawCommSetting?.maxFee || 0);

  const txCommSetting = commissionSettings?.transaction;
  const isTxCommActive = txCommSetting ? txCommSetting.isActive !== false : true;
  const txRateType = txCommSetting?.rateType || 'PERCENTAGE';
  const txRateVal = txCommSetting?.value !== undefined ? Number(txCommSetting.value) : 5.0;
  const txMinFee = Number(txCommSetting?.minFee || 0);
  const txMaxFee = Number(txCommSetting?.maxFee || 0);

  const parsedCalcAmount = parseFloat(calcAmount) || 0;

  // Calculate live fee
  let liveFee = 0;
  if (calcType === 'TRANSACTION' && isTxCommActive) {
    if (txRateType === 'PERCENTAGE') {
      liveFee = (parsedCalcAmount * txRateVal) / 100;
    } else {
      liveFee = txRateVal;
    }
    if (txMinFee > 0 && liveFee < txMinFee) liveFee = txMinFee;
    if (txMaxFee > 0 && liveFee > txMaxFee) liveFee = txMaxFee;
  } else if (calcType === 'WITHDRAW' && isWithdrawCommActive) {
    if (withdrawRateType === 'PERCENTAGE') {
      liveFee = (parsedCalcAmount * withdrawRateVal) / 100;
    } else {
      liveFee = withdrawRateVal;
    }
    if (withdrawMinFee > 0 && liveFee < withdrawMinFee) liveFee = withdrawMinFee;
    if (withdrawMaxFee > 0 && liveFee > withdrawMaxFee) liveFee = withdrawMaxFee;
  }

  const netReceiverAmount = Math.max(0, parsedCalcAmount - liveFee);
  const totalBuyerNeeded = parsedCalcAmount + liveFee;

  // Guest State Screen
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={lang === 'bn' ? 'ইউজার ড্যাশবোর্ড' : 'User Dashboard'} showWalletPill={false} />
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
          <View style={[styles.guestHeroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.guestIconCircle, { backgroundColor: colors.primary + '15' }]}>
              <ShieldCheck size={48} color={colors.primary} />
            </View>
            <Text style={[styles.guestTitle, { color: colors.text }]}>
              {lang === 'bn' ? 'SafnexBD ইউজার ড্যাশবোর্ড' : 'SafnexBD User Dashboard'}
            </Text>
            <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
              {lang === 'bn'
                ? 'আপনার ওয়ালেট ব্যালেন্স, চলমান এসক্রো চুক্তি, পেমেন্ট ও লাইভ চ্যাট পরিচালনা করতে অ্যাকাউন্টে লগইন করুন।'
                : 'Log in to manage your wallet balance, active escrow transactions, payments, and live chat deals.'}
            </Text>

            <View style={styles.guestActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Login')}
                style={[styles.guestPrimaryBtn, { backgroundColor: colors.primary }]}
              >
                <LogIn size={18} color="#FFFFFF" />
                <Text style={styles.guestPrimaryBtnText}>{lang === 'bn' ? 'লগইন করুন' : 'Log In'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Register')}
                style={[styles.guestSecondaryBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              >
                <UserPlus size={18} color={colors.text} />
                <Text style={[styles.guestSecondaryBtnText, { color: colors.text }]}>
                  {lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const availableBalance = Number(user.wallet?.availableBalance || 0);
  const holdBalance = Number(user.wallet?.holdBalance || 0);
  const activeDeals = transactions.filter(
    (tx) => tx.status === 'HOLD' || tx.status === 'WORKING' || tx.status === 'REQUESTED' || tx.status === 'APPROVED'
  ).length;

  const avatar = getImageUrl(user.avatarUrl);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={lang === 'bn' ? 'ইউজার ড্যাশবোর্ড' : 'User Dashboard'}
        showWalletPill={true}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Full User Profile Command Banner (Gradient) */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBannerGlow} />

          <View style={styles.heroTopRow}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.heroAvatar as any} />
              ) : (
                <View style={styles.heroAvatarFallback}>
                  <Text style={styles.heroAvatarText}>
                    {user.firstName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {user.isVerified && (
                <View style={styles.verifiedCheckBadge}>
                  <CheckCircle2 size={13} color="#ffffff" />
                </View>
              )}
            </View>

            {/* Identity Info */}
            <View style={styles.heroDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.heroUserName} numberOfLines={1}>
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'সম্মানিত ইউজার'}
                </Text>
                {user.isVerified && (
                  <View style={styles.verifiedPill}>
                    <ShieldCheck size={11} color="#a7f3d0" />
                    <Text style={styles.verifiedPillText}>Verified</Text>
                  </View>
                )}
              </View>

              <View style={styles.identityBadgesRow}>
                <View style={styles.idBadge}>
                  <Text style={styles.idBadgeText}>ID: {user.uniqueUserId || 'USER'}</Text>
                </View>
                {user.phone ? (
                  <View style={styles.contactBadge}>
                    <Text style={styles.contactBadgeText}>📞 {user.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Quick Profile Action Buttons */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('UsersSearch')}
              style={styles.heroActionBtn}
            >
              <ExternalLink size={13} color="#ffffff" />
              <Text style={styles.heroActionBtnText}>
                {lang === 'bn' ? 'পাবলিক প্রোফাইল' : 'Public Profile'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSettingsModalVisible(true)}
              style={[styles.heroActionBtn, styles.heroActionBtnSolid]}
            >
              <Settings size={13} color="#0369a1" />
              <Text style={[styles.heroActionBtnText, { color: '#0369a1', fontWeight: '800' }]}>
                {lang === 'bn' ? 'সেটিংস' : 'Settings'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Key Telemetry Metric Cards (2x2 Grid) */}
        <View style={styles.metricsGrid}>
          {/* Metric 1: Available Balance */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#ecfdf5' }]}>
                <Wallet size={16} color="#059669" />
              </View>
              <View style={styles.metricTagReady}>
                <Text style={styles.metricTagReadyText}>READY</Text>
              </View>
            </View>

            <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
              {lang === 'bn' ? 'ব্যবহারযোগ্য ব্যালেন্স' : 'Available Balance'}
            </Text>
            <Text style={[styles.metricValue, { color: '#059669' }]}>
              ৳ {availableBalance.toLocaleString()}
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'উইথড্র বা ডিলে প্রস্তুত' : 'Ready for deals/payout'}
            </Text>

            {/* Quick In-Card Actions */}
            <View style={styles.cardBtnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Recharge')}
                style={[styles.cardBtnPrimary, { backgroundColor: '#0284c7' }]}
              >
                <ArrowDownCircle size={13} color="#ffffff" />
                <Text style={styles.cardBtnPrimaryText}>{lang === 'bn' ? 'রিচার্জ' : 'Recharge'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Withdraw')}
                style={[styles.cardBtnSecondary, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <ArrowUpCircle size={13} color={colors.text} />
                <Text style={[styles.cardBtnSecondaryText, { color: colors.text }]}>
                  {lang === 'bn' ? 'উত্তোলন' : 'Withdraw'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Metric 2: Hold Balance */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#fffbeb' }]}>
                <Lock size={16} color="#d97706" />
              </View>
              <View style={styles.metricTagLocked}>
                <Text style={styles.metricTagLockedText}>LOCKED</Text>
              </View>
            </View>

            <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
              {lang === 'bn' ? 'এসক্রো হোল্ড ব্যালেন্স' : 'Escrow Hold Balance'}
            </Text>
            <Text style={[styles.metricValue, { color: '#d97706' }]}>
              ৳ {holdBalance.toLocaleString()}
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'চলমান এসক্রো সুরক্ষিত' : 'Protected in escrow'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TransactionsHub')}
              style={[styles.cardSingleActionBtn, { backgroundColor: '#fef3c7' }]}
            >
              <ShieldCheck size={13} color="#b45309" />
              <Text style={[styles.cardSingleActionText, { color: '#b45309' }]}>
                {lang === 'bn' ? 'হোল্ড ডিটেইলস' : 'View Escrows'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Metric 3: Active Deals */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Clock size={16} color="#2563eb" />
              </View>
              <View style={styles.metricTagActive}>
                <Text style={styles.metricTagActiveText}>ACTIVE</Text>
              </View>
            </View>

            <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
              {lang === 'bn' ? 'চলমান ডিল' : 'Active Deals'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {activeDeals} {lang === 'bn' ? 'টি' : 'Deals'}
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'টাইমার ও কাজ চলমান' : 'Deals executing'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
              style={[styles.cardSingleActionBtn, { backgroundColor: '#eff6ff' }]}
            >
              <MessageSquare size={13} color="#1d4ed8" />
              <Text style={[styles.cardSingleActionText, { color: '#1d4ed8' }]}>
                {lang === 'bn' ? 'লাইভ চ্যাট ডিল' : 'Live Chat Deals'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Metric 4: Products & Bids */}
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#f3e8ff' }]}>
                <Package size={16} color="#7e22ce" />
              </View>
              <View style={styles.metricTagStock}>
                <Text style={styles.metricTagStockText}>STOCK</Text>
              </View>
            </View>

            <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
              {lang === 'bn' ? 'প্রোডাক্ট ও বিড' : 'Products & Bids'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {productsCount} <Text style={{ fontSize: 13, color: colors.textMuted }}>({bidsCount} Bids)</Text>
            </Text>
            <Text style={[styles.metricSubtext, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'লিস্টেড প্রোডাক্ট' : 'Active listings'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AddProduct')}
              style={[styles.cardSingleActionBtn, { backgroundColor: '#f5f3ff' }]}
            >
              <PlusCircle size={13} color="#6d28d9" />
              <Text style={[styles.cardSingleActionText, { color: '#6d28d9' }]}>
                {lang === 'bn' ? 'প্রোডাক্ট আপলোড' : 'Upload Listing'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Platform Commission & Live Fee Calculator Widget */}
        <View style={[styles.sectionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.smallIconCircle, { backgroundColor: '#0284c715' }]}>
                <Percent size={16} color="#0284c7" />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {lang === 'bn' ? 'প্ল্যাটফর্ম কমিশন ও ফি ক্যালকুলেটর' : 'Platform Commission & Fee Calculator'}
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                  {lang === 'bn' ? 'স্বচ্ছ ও নিরপেক্ষ সরকারি/ব্যক্তিগত লেনদেন ফি' : 'Transparent real-time escrow & withdrawal charges'}
                </Text>
              </View>
            </View>
          </View>

          {/* Active Rates Chips */}
          <View style={styles.ratesRow}>
            <View style={[styles.rateBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.rateBadgeLabel, { color: colors.textMuted }]}>
                {lang === 'bn' ? '🤝 এসক্রো ডিল ফি:' : '🤝 Escrow Fee:'}
              </Text>
              <Text style={[styles.rateBadgeVal, { color: colors.primary }]}>
                {isTxCommActive ? (txRateType === 'PERCENTAGE' ? `${txRateVal}%` : `৳${txRateVal}`) : '0% (ফ্রি)'}
              </Text>
            </View>

            <View style={[styles.rateBadge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.rateBadgeLabel, { color: colors.textMuted }]}>
                {lang === 'bn' ? '💸 উইথড্র ফি:' : '💸 Withdraw Fee:'}
              </Text>
              <Text style={[styles.rateBadgeVal, { color: '#059669' }]}>
                {isWithdrawCommActive ? (withdrawRateType === 'PERCENTAGE' ? `${withdrawRateVal}%` : `৳${withdrawRateVal}`) : '0% (ফ্রি)'}
              </Text>
            </View>
          </View>

          {/* Calculator Tabs */}
          <View style={[styles.calcTabContainer, { backgroundColor: colors.surfaceSecondary }]}>
            <TouchableOpacity
              onPress={() => setCalcType('TRANSACTION')}
              style={[
                styles.calcTab,
                calcType === 'TRANSACTION' && [styles.calcTabActive, { backgroundColor: colors.surface }],
              ]}
            >
              <Text
                style={[
                  styles.calcTabText,
                  { color: calcType === 'TRANSACTION' ? colors.primary : colors.textSecondary },
                ]}
              >
                {lang === 'bn' ? 'এসক্রো লেনদেন ফি' : 'Escrow Deal Fee'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCalcType('WITHDRAW')}
              style={[
                styles.calcTab,
                calcType === 'WITHDRAW' && [styles.calcTabActive, { backgroundColor: colors.surface }],
              ]}
            >
              <Text
                style={[
                  styles.calcTabText,
                  { color: calcType === 'WITHDRAW' ? colors.primary : colors.textSecondary },
                ]}
              >
                {lang === 'bn' ? 'উইথড্রয়াল ক্যাশআউট ফি' : 'Withdrawal Cashout'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={[styles.calcInputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.calcCurrencyPrefix, { color: colors.primary }]}>৳</Text>
            <TextInput
              value={calcAmount}
              onChangeText={setCalcAmount}
              keyboardType="numeric"
              placeholder="টাকার পরিমাণ লিখুন"
              placeholderTextColor={colors.textMuted}
              style={[styles.calcInput, { color: colors.text }]}
            />
          </View>

          {/* Quick Amount Chips */}
          <View style={styles.quickChipsRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setCalcAmount(amt.toString())}
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor: calcAmount === amt.toString() ? colors.primary : colors.surfaceSecondary,
                    borderColor: calcAmount === amt.toString() ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipBtnText,
                    { color: calcAmount === amt.toString() ? '#ffffff' : colors.text },
                  ]}
                >
                  +{amt.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Live Breakdown Result */}
          <View style={[styles.calcResultCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.calcResultRow}>
              <Text style={[styles.calcResultLabel, { color: colors.textSecondary }]}>
                {lang === 'bn' ? 'লেনদেনের পরিমাণ:' : 'Amount:'}
              </Text>
              <Text style={[styles.calcResultVal, { color: colors.text }]}>
                ৳ {parsedCalcAmount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.calcResultRow}>
              <Text style={[styles.calcResultLabel, { color: colors.textSecondary }]}>
                {lang === 'bn' ? 'প্ল্যাটফর্ম সার্ভিস ফি / কমিশন:' : 'Platform Fee / Commission:'}
              </Text>
              <Text style={[styles.calcResultVal, { color: '#dc2626', fontWeight: '800' }]}>
                - ৳ {liveFee.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={[styles.calcDivider, { backgroundColor: colors.border }]} />

            <View style={styles.calcResultRow}>
              <Text style={[styles.calcResultHighlight, { color: colors.text }]}>
                {calcType === 'TRANSACTION'
                  ? (lang === 'bn' ? 'নেট সেলার / প্রাপক পাবে:' : 'Net Seller Payout:')
                  : (lang === 'bn' ? 'নেট ওয়ালেট থেকে উইথড্র মিলবে:' : 'Net Bank/MFS Receive:')}
              </Text>
              <Text style={[styles.calcResultHighlightVal, { color: '#059669' }]}>
                ৳ {netReceiverAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Quick Actions & Workspace Hub (8 Grid Cards) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            {lang === 'bn' ? 'প্রয়োজনীয় অ্যাকশন ও সার্ভিসেস' : 'Quick Actions & Workspace'}
          </Text>

          <View style={styles.actionGrid}>
            {/* Action 1: Live Chat & Deals */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
                <MessageSquare size={20} color="#2563eb" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'লাইভ চ্যাট ও ডিল' : 'Live Chat'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'Pay / Receive রিকোয়েস্ট' : 'Escrow Chat'}
              </Text>
            </TouchableOpacity>

            {/* Action 2: Upload Listing */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AddProduct')}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#ecfdf5' }]}>
                <PlusCircle size={20} color="#059669" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'প্রোডাক্ট আপলোড' : 'New Listing'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'ডিজিটাল বা ফিজিক্যাল' : 'Post Ad'}
              </Text>
            </TouchableOpacity>

            {/* Action 3: My Inventory */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyProducts')}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#e0e7ff' }]}>
                <Package size={20} color="#4f46e5" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'আমার প্রোডাক্ট' : 'My Inventory'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'ম্যানেজ ও স্টক' : 'Manage Ads'}
              </Text>
            </TouchableOpacity>

            {/* Action 4: Promote Bids */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyBids')}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#fef3c7' }]}>
                <Coins size={20} color="#d97706" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'পজিশন বিড' : 'Promote Bids'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? '১ম, ২য় স্লট র‍্যাংক' : 'Top Rankings'}
              </Text>
            </TouchableOpacity>

            {/* Action 5: Full Ledger & Wallet */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Wallet' })}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Wallet size={20} color="#7e22ce" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'ফুল লেজার' : 'Full Ledger'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'অপরিবর্তনীয় অডিট' : 'Audit Logs'}
              </Text>
            </TouchableOpacity>

            {/* Action 6: Disputes & Arbitration */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyDisputes')}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#fee2e2' }]}>
                <ShieldAlert size={20} color="#dc2626" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'ডিসপ্যুট সাপোর্ট' : 'Disputes'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'কল অ্যাডমিন ২৪/৭' : 'Arbitration'}
              </Text>
            </TouchableOpacity>

            {/* Action 7: P2P Money Exchange */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MoneyExchange')}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#fef3c7' }]}>
                <TrendingUp size={20} color="#b45309" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'মানি এক্সচেঞ্জ' : 'P2P Exchange'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'USD / EUR / USDT' : 'Currency'}
              </Text>
            </TouchableOpacity>

            {/* Action 8: Guides & Help */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Guides')}
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
                <BookOpen size={20} color="#0284c7" />
              </View>
              <Text style={[styles.actionTileTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'গাইডস ও ভিডিও' : 'Guides'}
              </Text>
              <Text style={[styles.actionTileDesc, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'নির্দেশিকা ও টিউটোরিয়াল' : 'Tutorials'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Recent Safe Escrow Transactions Feed */}
        <View style={[styles.sectionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.smallIconCircle, { backgroundColor: '#10b98115' }]}>
                <ShieldCheck size={16} color="#10b981" />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {lang === 'bn' ? 'সাম্প্রতিক নিরাপদ ট্রানজ্যাকশনসমূহ' : 'Recent Safe Escrow Transactions'}
                </Text>
                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                  {lang === 'bn' ? 'আপনার সকল চলমান ও সম্পন্ন হওয়া ডিলের রিয়েল-টাইম স্ট্যাটাস' : 'Live status and escrow tracking of your deals'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('TransactionsHub')}
              style={styles.viewAllRow}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                {lang === 'bn' ? 'সকল লেনদেন' : 'View All'}
              </Text>
              <ArrowRight size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                {lang === 'bn' ? 'লেনদেন লোড হচ্ছে...' : 'Loading transactions...'}
              </Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Clock size={36} color={colors.textMuted} />
              <Text style={[styles.emptyBoxTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'কোনো সাম্প্রতিক লেনদেন পাওয়া যায়নি' : 'No safe transactions recorded yet'}
              </Text>
              <Text style={[styles.emptyBoxSub, { color: colors.textSecondary }]}>
                {lang === 'bn' ? 'চ্যাটে কারও সাথে মেসেজ করে ইনস্ট্যান্ট এসক্রো ডিল শুরু করুন।' : 'Start a deal in chat with 100% escrow protection.'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
                style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.emptyActionBtnText}>
                  {lang === 'bn' ? 'নতুন ডিল শুরু করুন' : 'Start Deal in Chat'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.txListContainer}>
              {transactions.map((tx) => {
                const isSender = tx.senderId === user.id;
                const counterparty = isSender ? tx.receiver : tx.sender;

                let statusBg = '#f1f5f9';
                let statusColor = '#64748b';
                if (tx.status === 'RELEASED') {
                  statusBg = '#ecfdf5';
                  statusColor = '#059669';
                } else if (tx.status === 'HOLD') {
                  statusBg = '#fffbeb';
                  statusColor = '#d97706';
                } else if (tx.status === 'DISPUTED') {
                  statusBg = '#fee2e2';
                  statusColor = '#dc2626';
                } else if (tx.status === 'WORKING') {
                  statusBg = '#eff6ff';
                  statusColor = '#2563eb';
                }

                return (
                  <View
                    key={tx.id}
                    style={[styles.txCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  >
                    <View style={styles.txCardLeft}>
                      <View style={[styles.txAvatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.txAvatarText, { color: colors.primary }]}>
                          {counterparty?.firstName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>

                      <View style={styles.txInfoCol}>
                        <View style={styles.txTrackingRow}>
                          <Text style={[styles.txTrackingNo, { color: colors.text }]}>
                            #{tx.trackingNumber || tx.id?.substring(0, 8).toUpperCase()}
                          </Text>
                          <Text style={[styles.txDate, { color: colors.textMuted }]}>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </Text>
                        </View>

                        <Text style={[styles.txCounterparty, { color: colors.textSecondary }]}>
                          {isSender ? (lang === 'bn' ? 'প্রাপক: ' : 'Paid to: ') : (lang === 'bn' ? 'প্রেরক: ' : 'From: ')}
                          <Text style={{ fontWeight: '700', color: colors.text }}>
                            @{counterparty?.uniqueUserId || 'Counterparty'}
                          </Text>
                        </Text>

                        {tx.product?.title ? (
                          <Text style={[styles.txProductTitle, { color: colors.textMuted }]} numberOfLines={1}>
                            📦 {tx.product.title}
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.txCardRight}>
                      <Text style={[styles.txAmount, { color: colors.text }]}>
                        ৳ {Number(tx.amount || 0).toLocaleString()}
                      </Text>

                      <View style={styles.txStatusActions}>
                        <View style={[styles.txStatusPill, { backgroundColor: statusBg }]}>
                          <Text style={[styles.txStatusPillText, { color: statusColor }]}>
                            {tx.status}
                          </Text>
                        </View>

                        {tx.conversationId ? (
                          <TouchableOpacity
                            onPress={() =>
                              navigation.navigate('ChatDetail', {
                                conversationId: tx.conversationId,
                              })
                            }
                            style={[styles.txChatBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          >
                            <MessageSquare size={13} color={colors.primary} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 6. Escrow Trust Guarantee & Safety Banner */}
        <View style={styles.guaranteeBanner}>
          <View style={styles.guaranteeIconWrap}>
            <ShieldCheck size={28} color="#34d399" />
          </View>
          <View style={styles.guaranteeTextCol}>
            <Text style={styles.guaranteeTitle}>
              {lang === 'bn' ? '১০০% নিরাপদ এসক্রো গ্যারান্টি' : '100% Guaranteed Safe Escrow Protection'}
            </Text>
            <Text style={styles.guaranteeDesc}>
              {lang === 'bn'
                ? 'SafnexBD প্ল্যাটফর্মে বায়ার বা সেলার কেউই প্রতারিত হতে পারেন না। কাজ অথবা প্রোডাক্ট সম্পূর্ণ বুঝে না পাওয়া পর্যন্ত অর্থ নিরপেক্ষ হোল্ড ব্যালেন্সে সুরক্ষিত থাকে।'
                : 'Funds are securely held in neutral escrow. Released only upon complete satisfaction or verified dispute resolution.'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('DisputePolicy')}
              style={styles.guaranteeLinkBtn}
            >
              <Text style={styles.guaranteeLinkText}>
                {lang === 'bn' ? 'নিয়মাবলী ও পলিসি পড়ুন ➔' : 'Read Escrow Rules & Policy ➔'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. Account Preferences & Logout Footer */}
        <View style={[styles.accountFooterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.accountFooterHeading, { color: colors.text }]}>
            {lang === 'bn' ? 'অ্যাকাউন্ট ও সেটিংস' : 'Account & Preferences'}
          </Text>

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              {mode === 'dark' ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color={colors.primary} />}
              <Text style={[styles.prefLabel, { color: colors.text }]}>
                {lang === 'bn' ? 'ডার্ক মোড' : 'Dark Theme'}
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Text style={{ fontSize: 16 }}>🌐</Text>
              <Text style={[styles.prefLabel, { color: colors.text }]}>
                {lang === 'bn' ? 'ভাষা / Language (বাংলা / EN)' : 'Language (BN / EN)'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleLang}
              style={[styles.langTogglePill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <Text style={[styles.langTogglePillText, { color: colors.primary }]}>
                {lang === 'bn' ? 'বাংলা' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            onPress={handleSupportPress}
            style={styles.prefRowBtn}
          >
            <View style={styles.prefLeft}>
              <Headphones size={18} color="#0284c7" />
              <Text style={[styles.prefLabel, { color: colors.text }]}>
                {lang === 'bn' ? '২৪/৭ কাস্টমার সাপোর্ট (WhatsApp)' : '24/7 Customer Support'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.logoutBtnText}>
              {lang === 'bn' ? 'অ্যাকাউন্ট থেকে লগআউট করুন' : 'Log Out of Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 8. Settings & Profile Edit Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {lang === 'bn' ? 'প্রোফাইল তথ্য পরিবর্তন' : 'Edit Profile Information'}
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {lang === 'bn' ? 'প্রথম নাম (First Name)' : 'First Name'}
              </Text>
              <TextInput
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="First Name"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {lang === 'bn' ? 'শেষ নাম (Last Name)' : 'Last Name'}
              </Text>
              <TextInput
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="Last Name"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {lang === 'bn' ? 'মোবাইল নম্বর (Phone)' : 'Phone Number'}
              </Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="01XXXXXXXXX"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
              />

              <TouchableOpacity
                disabled={savingProfile}
                onPress={handleSaveProfile}
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={18} color="#ffffff" />
                    <Text style={styles.modalSaveBtnText}>
                      {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    padding: 14,
    gap: 14,
  },

  // Hero Command Banner
  heroBanner: {
    backgroundColor: '#0284c7',
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    gap: 14,
  },
  heroBannerGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ffffff20',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  heroAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  heroAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#ffffff25',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10b981',
    borderRadius: 10,
    padding: 2,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  heroDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroUserName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10b98130',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b98160',
  },
  verifiedPillText: {
    color: '#d1fae5',
    fontSize: 10,
    fontWeight: '800',
  },
  identityBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  idBadge: {
    backgroundColor: '#00000030',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  idBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  contactBadge: {
    backgroundColor: '#ffffff20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  contactBadgeText: {
    color: '#f0f9ff',
    fontSize: 11,
    fontWeight: '600',
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#ffffff25',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff35',
  },
  heroActionBtnSolid: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  heroActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // 4 Metrics Grid (2x2)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTagReady: {
    marginLeft: 'auto',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricTagReadyText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
  },
  metricTagLocked: {
    marginLeft: 'auto',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricTagLockedText: {
    color: '#d97706',
    fontSize: 9,
    fontWeight: '900',
  },
  metricTagActive: {
    marginLeft: 'auto',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricTagActiveText: {
    color: '#2563eb',
    fontSize: 9,
    fontWeight: '900',
  },
  metricTagStock: {
    marginLeft: 'auto',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricTagStockText: {
    color: '#7e22ce',
    fontSize: 9,
    fontWeight: '900',
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '900',
  },
  metricSubtext: {
    fontSize: 10,
  },
  cardBtnRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
  },
  cardBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardBtnSecondaryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardSingleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  cardSingleActionText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // Platform Commission & Fee Calculator
  sectionBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  smallIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  sectionSub: {
    fontSize: 10,
    marginTop: 1,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBadge: {
    flex: 1,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  rateBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  rateBadgeVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  calcTabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  calcTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  calcTabActive: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  calcTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calcInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  calcCurrencyPrefix: {
    fontSize: 18,
    fontWeight: '900',
    marginRight: 6,
  },
  calcInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '800',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calcResultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  calcResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcResultLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  calcResultVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  calcDivider: {
    height: 1,
  },
  calcResultHighlight: {
    fontSize: 12,
    fontWeight: '900',
  },
  calcResultHighlightVal: {
    fontSize: 16,
    fontWeight: '900',
  },

  // Quick Action Hub (8 Grid Cards)
  sectionContainer: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionTile: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTileTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionTileDesc: {
    fontSize: 10,
  },

  // Recent Transactions Section
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBoxSub: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyActionBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  txListContainer: {
    gap: 8,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  txCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txAvatarText: {
    fontSize: 14,
    fontWeight: '900',
  },
  txInfoCol: {
    flex: 1,
    gap: 2,
  },
  txTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txTrackingNo: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  txDate: {
    fontSize: 9,
  },
  txCounterparty: {
    fontSize: 10,
  },
  txProductTitle: {
    fontSize: 10,
  },
  txCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
  txStatusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txStatusPillText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  txChatBtn: {
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  // 100% Escrow Guarantee Banner
  guaranteeBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guaranteeIconWrap: {
    backgroundColor: '#10b98120',
    padding: 8,
    borderRadius: 14,
  },
  guaranteeTextCol: {
    flex: 1,
    gap: 4,
  },
  guaranteeTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  guaranteeDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  guaranteeLinkBtn: {
    marginTop: 4,
  },
  guaranteeLinkText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },

  // Account Preferences & Logout Footer
  accountFooterCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  accountFooterHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  prefRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  prefDivider: {
    height: 1,
  },
  langTogglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  langTogglePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },

  // Guest Hero Card
  guestHeroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  guestActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  guestPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  guestPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  guestSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  guestSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Settings Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000070',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
  },
  modalBody: {
    gap: 10,
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 10,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
