import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Building2,
  Lock,
  KeyRound,
  RotateCw,
  Clock,
  XCircle,
  ChevronDown,
  Check,
  CreditCard,
  Trash2,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

interface WithdrawalMethod {
  id: string;
  name: string;
  code: string;
  type?: 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY' | 'BANK' | 'OTHER';
  minAmount?: number;
  maxAmount?: number;
  feePercentage?: number;
  feeFlat?: number;
  instructions?: string;
}

interface CommissionFeeSetting {
  rateType: 'PERCENTAGE' | 'FLAT';
  value: number;
  isActive: boolean;
  minFee: number;
  maxFee: number;
}

interface SavedPaymentAccount {
  id: string;
  methodType: string;
  accountType: 'PERSONAL' | 'AGENT' | 'BANK';
  accountNumber: string;
  accountName: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  isDefault?: boolean;
}

interface MyWithdrawalItem {
  id: string;
  amount: number | string;
  fee: number | string;
  netAmount: number | string;
  destinationAccount: string;
  accountType?: string;
  bankName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  adminNotes?: string;
  method?: { name: string };
}

const BANGLADESH_BANKS = [
  'Dutch-Bangla Bank PLC (DBBL)',
  'BRAC Bank PLC',
  'Islami Bank Bangladesh PLC',
  'The City Bank Limited',
  'Eastern Bank PLC (EBL)',
  'Sonali Bank PLC',
  'Mutual Trust Bank PLC (MTB)',
  'United Commercial Bank (UCB)',
  'Pubali Bank PLC',
  'Southeast Bank Limited',
  'Standard Chartered Bank Bangladesh',
  'Prime Bank PLC',
  'Dhaka Bank PLC',
  'Trust Bank Limited',
  'Al-Arafah Islami Bank PLC',
  'First Security Islami Bank PLC',
  'Bank Asia PLC',
  'Jamuna Bank PLC',
  'NCC Bank PLC',
  'Mercantile Bank PLC',
  'Shahjalal Islami Bank PLC',
  'অন্যান্য ব্যাংক (Other Bank)',
];

export const WithdrawScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { wallet, refreshWallet, user } = useAuthStore();

  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null);

  // Commission Setting from Admin Panel (/admin/commissions -> /commission/settings)
  const [commissionSettings, setCommissionSettings] = useState<{ withdraw?: CommissionFeeSetting } | null>(null);

  // Saved payout accounts
  const [savedAccounts, setSavedAccounts] = useState<SavedPaymentAccount[]>([]);
  const [selectedSavedAccountId, setSelectedSavedAccountId] = useState<string>('NEW');

  // Security mode (Withdrawal OTP)
  const [withdrawOtpEnabled, setWithdrawOtpEnabled] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [accountType, setAccountType] = useState<'PERSONAL' | 'AGENT'>('PERSONAL');

  // Bank fields
  const [bankName, setBankName] = useState(BANGLADESH_BANKS[0]);
  const [customBankName, setCustomBankName] = useState('');
  const [showBankPickerModal, setShowBankPickerModal] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  // OTP & Submission
  const [submitting, setSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Password Security Modal (First-time / Unsaved Account)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');

  // Success State
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<any>(null);

  // Recent Withdrawals & Cancellation
  const [myWithdrawals, setMyWithdrawals] = useState<MyWithdrawalItem[]>([]);
  const [loadingMyWithdrawals, setLoadingMyWithdrawals] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    let timer: any;
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const loadAllData = async () => {
    try {
      setLoadingMethods(true);
      await Promise.all([
        fetchMethods(),
        fetchCommissionRules(),
        fetchSavedAccounts(),
        fetchSecurityModes(),
        fetchMyWithdrawals(),
      ]);
    } finally {
      setLoadingMethods(false);
    }
  };

  const fetchMethods = async () => {
    try {
      const res: any = await apiClient.get('/wallet/withdrawal-methods');
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setMethods(data);
      if (data.length > 0) {
        setSelectedMethod(data[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch withdrawal methods:', err);
    }
  };

  const fetchCommissionRules = async () => {
    try {
      const res: any = await apiClient.get('/commission/settings');
      const raw = res?.data !== undefined ? res.data : res;
      const data = raw?.data !== undefined ? raw.data : raw;
      if (data) {
        setCommissionSettings(data);
      }
    } catch (err) {
      console.warn('Failed to fetch commission settings:', err);
    }
  };

  const fetchSavedAccounts = async () => {
    try {
      const res: any = await apiClient.get('/users/payment-accounts');
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setSavedAccounts(data);
    } catch (err) {
      console.warn('Failed to fetch saved accounts:', err);
    }
  };

  const fetchSecurityModes = async () => {
    try {
      const res: any = await apiClient.get('/sms/public-modes');
      const data = res?.data !== undefined ? res.data : res;
      if (data?.withdrawOtpEnabled !== undefined) {
        setWithdrawOtpEnabled(Boolean(data.withdrawOtpEnabled));
      }
    } catch (err) {
      console.warn('Failed to fetch security modes:', err);
    }
  };

  const fetchMyWithdrawals = async () => {
    try {
      setLoadingMyWithdrawals(true);
      const res: any = await apiClient.get('/wallet/my-withdrawals');
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setMyWithdrawals(data);
    } catch (err) {
      console.warn('Failed to fetch my withdrawals:', err);
    } finally {
      setLoadingMyWithdrawals(false);
    }
  };

  const availableBalance = Number(
    user?.wallet?.availableBalance ?? wallet?.availableBalance ?? wallet?.balance ?? 0
  );

  const isBankWithdraw =
    selectedMethod?.code?.toUpperCase().includes('BANK') ||
    selectedMethod?.name?.toLowerCase().includes('bank') ||
    selectedMethod?.type === 'BANK';

  // Fee calculation strictly matching /admin/commissions
  const numAmount = parseFloat(amount) || 0;
  const withdrawCommission = commissionSettings?.withdraw;
  const isCommissionActive = withdrawCommission ? withdrawCommission.isActive !== false : false;
  const commRateType = withdrawCommission?.rateType || 'PERCENTAGE';
  const commValue = Number(withdrawCommission?.value ?? 0);
  const commMinFee = Number(withdrawCommission?.minFee ?? 0);
  const commMaxFee = Number(withdrawCommission?.maxFee ?? 0);

  let withdrawFee = 0;
  if (numAmount > 0) {
    if (isCommissionActive) {
      if (commValue > 0) {
        if (commRateType === 'PERCENTAGE') {
          withdrawFee = (numAmount * commValue) / 100;
        } else {
          withdrawFee = commValue;
        }
        if (commMinFee > 0 && withdrawFee < commMinFee) withdrawFee = commMinFee;
        if (commMaxFee > 0 && withdrawFee > commMaxFee) withdrawFee = commMaxFee;
      } else {
        withdrawFee = 0;
      }
    } else if (selectedMethod) {
      const feePct = Number(selectedMethod.feePercentage || 0);
      const feeFlat = Number(selectedMethod.feeFlat || 0);
      if (feePct > 0) withdrawFee += (numAmount * feePct) / 100;
      if (feeFlat > 0) withdrawFee += feeFlat;
    }
    withdrawFee = Math.round(withdrawFee * 100) / 100;
  }
  const netPayout = Math.max(0, Math.round((numAmount - withdrawFee) * 100) / 100);

  // When user selects a saved account
  const handleSelectSavedAccount = (accId: string) => {
    setSelectedSavedAccountId(accId);
    if (accId === 'NEW') {
      setDestinationAccount('');
      setAccountNumber('');
      setAccountHolderName('');
      setBranchName('');
      setRoutingNumber('');
      return;
    }

    const acc = savedAccounts.find((a) => a.id === accId);
    if (!acc) return;

    if (acc.accountType === 'BANK' || acc.bankName) {
      setBankName(acc.bankName || BANGLADESH_BANKS[0]);
      setAccountNumber(acc.accountNumber || '');
      setAccountHolderName(acc.accountName || '');
      setBranchName(acc.branchName || '');
      setRoutingNumber(acc.routingNumber || '');
    } else {
      setDestinationAccount(acc.accountNumber || '');
      setAccountType(acc.accountType === 'AGENT' ? 'AGENT' : 'PERSONAL');
    }
  };

  const handleInitiateWithdraw = async () => {
    if (numAmount <= 0) {
      Alert.alert('ভুল ইনপুট', 'সঠিক উত্তোলনের পরিমাণ লিখুন।');
      return;
    }

    if (numAmount > availableBalance) {
      Alert.alert(
        'অপর্যাপ্ত ব্যালেন্স',
        `আপনার অ্যাভেইলেবল ব্যালেন্স ৳${availableBalance.toLocaleString()}। এসক্রো হোল্ডে থাকা ব্যালেন্স উত্তোলন করা যাবে না।`
      );
      return;
    }

    if (!selectedMethod) {
      Alert.alert('পদ্ধতি নির্বাচন করুন', 'অনুগ্রহ করে উত্তোলনের মাধ্যম নির্বাচন করুন।');
      return;
    }

    const min = Number(selectedMethod.minAmount || 50);
    const max = Number(selectedMethod.maxAmount || 100000);
    if (numAmount < min) {
      Alert.alert('সর্বনিম্ন সীমা', `এই মাধ্যমে সর্বনিম্ন উত্তোলনের পরিমাণ ৳${min}।`);
      return;
    }
    if (numAmount > max) {
      Alert.alert('সর্বোচ্চ সীমা', `এই মাধ্যমে সর্বোচ্চ উত্তোলনের পরিমাণ ৳${max}।`);
      return;
    }

    const payload: any = {
      methodId: selectedMethod.id,
      amount: numAmount,
    };

    if (isBankWithdraw) {
      const finalBank = bankName.includes('অন্যান্য') ? customBankName.trim() : bankName.trim();
      if (!finalBank) {
        Alert.alert('ব্যাংকের নাম', 'অনুগ্রহ করে ব্যাংকের নাম নির্বাচন বা লিখুন।');
        return;
      }
      if (!accountHolderName.trim()) {
        Alert.alert('হিসাবধারীর নাম', 'ব্যাংক অ্যাকাউন্ট হোল্ডারের নাম অবশ্যই প্রদান করতে হবে।');
        return;
      }
      if (!accountNumber.trim()) {
        Alert.alert('অ্যাকাউন্ট নম্বর', 'ব্যাংক অ্যাকাউন্ট নম্বর আবশ্যক।');
        return;
      }
      if (!routingNumber.trim()) {
        Alert.alert('রাউটিং নম্বর', 'ব্যাংক রাউটিং নম্বর (Routing Number) আবশ্যক।');
        return;
      }

      payload.bankName = finalBank;
      payload.accountHolderName = accountHolderName.trim();
      payload.accountNumber = accountNumber.trim();
      payload.routingNumber = routingNumber.trim();
      payload.branchName = branchName.trim() || undefined;
      payload.destinationAccount = `${finalBank} - A/C: ${accountNumber.trim()} (${accountHolderName.trim()})`;
      payload.accountType = 'BANK';
    } else {
      const cleanNumber = destinationAccount.trim();
      if (!cleanNumber || !/^01[3-9]\d{8}$/.test(cleanNumber)) {
        Alert.alert('ভুল মোবাইল নম্বর', 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)।');
        return;
      }
      payload.destinationAccount = cleanNumber;
      payload.accountType = accountType;
    }

    // Security Check: Withdrawal OTP Mode vs Direct Submit
    let isOtpReq = withdrawOtpEnabled;
    try {
      const modeRes: any = await apiClient.get('/sms/public-modes');
      const modeData = modeRes?.data !== undefined ? modeRes.data : modeRes;
      if (modeData?.withdrawOtpEnabled !== undefined) {
        isOtpReq = Boolean(modeData.withdrawOtpEnabled);
      }
    } catch {
      // fallback
    }

    if (isOtpReq) {
      setSubmitting(true);
      try {
        const otpRes: any = await apiClient.post('/wallet/withdraw/send-otp', {
          amount: numAmount,
          methodId: selectedMethod.id,
          destination: payload.destinationAccount,
        });

        const otpData = otpRes?.data !== undefined ? otpRes.data : otpRes;
        if (otpData?.simulatedCode) {
          setSimulatedCode(otpData.simulatedCode);
        } else {
          setSimulatedCode(null);
        }

        setPendingPayload(payload);
        setOtpCooldown(45);
        setOtpCode('');
        setShowOtpModal(true);
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।';
        Alert.alert('ব্যর্থ হয়েছে', msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // If OTP is OFF and user has 0 saved accounts: Prompt for account password
    if (savedAccounts.length === 0) {
      setPendingPayload(payload);
      setWithdrawPassword('');
      setShowPasswordModal(true);
      return;
    }

    // Direct submit
    await executeDirectWithdraw(payload);
  };

  const executeDirectWithdraw = async (payload: any) => {
    try {
      setSubmitting(true);
      const res: any = await apiClient.post('/wallet/withdraw', payload);
      const data = res?.data !== undefined ? res.data : res;
      setSubmittedWithdrawal(data);
      await refreshWallet();
      await fetchMyWithdrawals();
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'উইথড্র রিকোয়েস্ট জমা দেওয়া সম্ভব হয়নি।';
      if (
        msg.includes('পাসওয়ার্ড') ||
        msg.includes('পাসওয়ার্ড') ||
        msg.toLowerCase().includes('password')
      ) {
        setPendingPayload(payload);
        setWithdrawPassword('');
        setShowPasswordModal(true);
      } else {
        Alert.alert('উইথড্রল ত্রুটি', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPassword = async () => {
    if (!withdrawPassword.trim()) {
      Alert.alert('পাসওয়ার্ড দিন', 'নিরাপত্তার জন্য আপনার একাউন্ট পাসওয়ার্ড লিখুন।');
      return;
    }
    setSubmitting(true);
    try {
      const finalPayload = {
        ...pendingPayload,
        password: withdrawPassword.trim(),
      };
      const res: any = await apiClient.post('/wallet/withdraw', finalPayload);
      const data = res?.data !== undefined ? res.data : res;
      setSubmittedWithdrawal(data);
      setShowPasswordModal(false);
      await refreshWallet();
      await fetchMyWithdrawals();
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'পাসওয়ার্ড যাচাইকরণ ব্যর্থ হয়েছে।';
      Alert.alert('উইথড্র ত্রুটি', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      Alert.alert('ভুল ওটিপি', 'সঠিক ওটিপি কোডটি লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      const finalPayload = {
        ...pendingPayload,
        otpCode: otpCode.trim(),
      };
      const res: any = await apiClient.post('/wallet/withdraw', finalPayload);
      const data = res?.data !== undefined ? res.data : res;
      setSubmittedWithdrawal(data);
      setShowOtpModal(false);
      await refreshWallet();
      await fetchMyWithdrawals();
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'ওটিপি কোড ভুল বা মেয়াদোত্তীর্ণ হয়েছে।';
      Alert.alert('যাচাই ব্যর্থ', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPendingWithdrawal = (requestId: string) => {
    Alert.alert(
      'আবেদন বাতিল',
      'আপনি কি নিশ্চিত যে এই উইথড্র আবেদনটি বাতিল করতে চান? টাকা সাথে সাথে আপনার মূল ব্যালেন্সে রিফান্ড করা হবে।',
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, বাতিল করুন',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(requestId);
              await apiClient.post(`/wallet/withdraw/${requestId}/cancel`);
              Alert.alert('সফল', 'উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে এবং ব্যালেন্স ফেরত দেওয়া হয়েছে।');
              await refreshWallet();
              await fetchMyWithdrawals();
            } catch (err: any) {
              Alert.alert('ব্যর্থ', err.response?.data?.message || err.message || 'বাতিল করা সম্ভব হয়নি');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>উইথড্র সম্পন্ন</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.successScroll}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={56} color="#10b981" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>উইথড্র আবেদন জমা হয়েছে!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            আপনার ৳{numAmount.toLocaleString()} টাকার ক্যাশআউট আবেদনটি সফলভাবে সিস্টেমে গ্রহণ করা হয়েছে। ফাইন্যান্স অ্যাডমিন দ্রুত যাচাই করে অর্থ প্রেরণ করবেন।
          </Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>মাধ্যম:</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>{selectedMethod?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>উত্তোলনের পরিমাণ:</Text>
              <Text style={[styles.summaryVal, { color: colors.text, fontWeight: '700' }]}>৳{numAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>অ্যাডমিন ফি / চার্জ:</Text>
              <Text style={[styles.summaryVal, { color: withdrawFee > 0 ? '#ef4444' : '#10b981' }]}>
                {withdrawFee > 0 ? `৳${withdrawFee.toLocaleString()}` : 'ফ্রি (৳০)'}
              </Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 }]}>
              <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '800' }]}>আপনি পাবেন (Net):</Text>
              <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '900', fontSize: 16 }]}>
                ৳{netPayout.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>প্রাপক অ্যাকাউন্ট:</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]} numberOfLines={1}>
                {isBankWithdraw ? `${accountNumber} (${bankName})` : `${destinationAccount} (${accountType})`}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 24 }]}
            onPress={() => {
              setIsSuccess(false);
              setAmount('');
              setDestinationAccount('');
              navigation.goBack();
            }}
          >
            <Text style={styles.primaryButtonText}>ওয়ালেটে ফিরে যান</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>টাকা উত্তোলন (Withdraw)</Text>
        <TouchableOpacity onPress={loadAllData} style={styles.backButton}>
          <RotateCw size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Available Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>উত্তোলনযোগ্য ব্যালেন্স (Available Balance)</Text>
              <Text style={styles.balanceValue}>৳ {availableBalance.toLocaleString()}</Text>
            </View>
            <ShieldCheck size={32} color="#ffffff" opacity={0.8} />
          </View>
          <Text style={styles.balanceHint}>
            * ডিল বা অর্ডারে এসক্রো হোল্ড থাকা ব্যালেন্স উত্তোলনযোগ্য নয়।
          </Text>
        </View>

        {/* Withdrawal Method Selection */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>উত্তোলনের মাধ্যম নির্বাচন করুন</Text>
        {loadingMethods ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.methodGrid}>
            {methods.map((method) => {
              const isSelected = selectedMethod?.id === method.id;
              const isMethodBank =
                method.code?.toUpperCase().includes('BANK') ||
                method.name?.toLowerCase().includes('bank') ||
                method.type === 'BANK';

              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedMethod(method)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.methodIconContainer, { backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary }]}>
                    {isMethodBank ? (
                      <Building2 size={20} color={isSelected ? '#ffffff' : colors.text} />
                    ) : (
                      <Smartphone size={20} color={isSelected ? '#ffffff' : colors.text} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.methodName,
                      { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {method.name}
                  </Text>
                  <Text style={[styles.methodLimit, { color: colors.textMuted }]}>
                    সীমা: ৳{Number(method.minAmount || 50)} - ৳{Number(method.maxAmount || 100000).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Saved Accounts Option (if any) */}
        {savedAccounts.length > 0 && (
          <View style={styles.savedAccountsSection}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>সংরক্ষিত অ্যাকাউন্ট নির্বাচন করুন</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedAccountsRow}>
              <TouchableOpacity
                style={[
                  styles.savedAccountChip,
                  {
                    backgroundColor: selectedSavedAccountId === 'NEW' ? colors.primaryLight : colors.surface,
                    borderColor: selectedSavedAccountId === 'NEW' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSelectSavedAccount('NEW')}
              >
                <Text style={[styles.savedAccountText, { color: selectedSavedAccountId === 'NEW' ? colors.primary : colors.text }]}>
                  + নতুন অ্যাকাউন্ট
                </Text>
              </TouchableOpacity>

              {savedAccounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.savedAccountChip,
                    {
                      backgroundColor: selectedSavedAccountId === acc.id ? colors.primaryLight : colors.surface,
                      borderColor: selectedSavedAccountId === acc.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectSavedAccount(acc.id)}
                >
                  <Text style={[styles.savedAccountText, { color: selectedSavedAccountId === acc.id ? colors.primary : colors.text }]}>
                    {acc.accountType === 'BANK' ? `${acc.bankName} (${acc.accountNumber.slice(-4)})` : `${acc.accountNumber} (${acc.accountType})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>উত্তোলনের পরিমাণ (টাকা)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>৳</Text>
            <TextInput
              style={[styles.inputField, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Quick Amount Chips */}
          <View style={styles.chipRow}>
            {[500, 1000, 2000, 5000].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                onPress={() => setAmount(val.toString())}
              >
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>৳{val}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={() => setAmount(Math.floor(availableBalance).toString())}
            >
              <Text style={[styles.chipText, { color: colors.primary, fontWeight: '700' }]}>সর্বোচ্চ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Destination Account Details */}
        {isBankWithdraw ? (
          <View style={[styles.cardBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardBlockTitle, { color: colors.text }]}>ব্যাংক অ্যাকাউন্টের বিবরণ</Text>

            {/* Bank Name Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>ব্যাংকের নাম</Text>
              <TouchableOpacity
                style={[styles.selectBox, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setShowBankPickerModal(true)}
              >
                <Text style={[styles.selectBoxText, { color: colors.text }]} numberOfLines={1}>
                  {bankName}
                </Text>
                <ChevronDown size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {bankName.includes('অন্যান্য') && (
              <View style={styles.formGroup}>
                <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>ব্যাংকের পূর্ণ নাম লিখুন</Text>
                <TextInput
                  style={[styles.standardInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                  placeholder="যেমন: Premier Bank PLC"
                  placeholderTextColor={colors.textMuted}
                  value={customBankName}
                  onChangeText={setCustomBankName}
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>হিসাবধারীর পূর্ণ নাম (Account Holder)</Text>
              <TextInput
                style={[styles.standardInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                placeholder="যেমন: Md. Rahim Ali"
                placeholderTextColor={colors.textMuted}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>অ্যাকাউন্ট নম্বর</Text>
              <TextInput
                style={[styles.standardInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                placeholder="ব্যাংক একাউন্ট নম্বর"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>রাউটিং নম্বর (Routing Number)</Text>
              <TextInput
                style={[styles.standardInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                placeholder="৯ সংখ্যার রাউটিং নম্বর"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={routingNumber}
                onChangeText={setRoutingNumber}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>শাখার নাম (Branch Name - ঐচ্ছিক)</Text>
              <TextInput
                style={[styles.standardInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                placeholder="যেমন: মতিঝিল শাখা"
                placeholderTextColor={colors.textMuted}
                value={branchName}
                onChangeText={setBranchName}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.cardBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardBlockTitle, { color: colors.text }]}>
              {selectedMethod?.name || 'মোবাইল ব্যাংকিং'} অ্যাকাউন্টের বিবরণ
            </Text>

            {/* Account Type Toggle */}
            <View style={styles.accountTypeRow}>
              <TouchableOpacity
                style={[
                  styles.accountTypeBtn,
                  {
                    backgroundColor: accountType === 'PERSONAL' ? colors.primary : colors.surfaceSecondary,
                    borderColor: accountType === 'PERSONAL' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setAccountType('PERSONAL')}
              >
                <Text style={[styles.accountTypeText, { color: accountType === 'PERSONAL' ? '#ffffff' : colors.text }]}>
                  পার্সোনাল (Personal)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accountTypeBtn,
                  {
                    backgroundColor: accountType === 'AGENT' ? colors.primary : colors.surfaceSecondary,
                    borderColor: accountType === 'AGENT' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setAccountType('AGENT')}
              >
                <Text style={[styles.accountTypeText, { color: accountType === 'AGENT' ? '#ffffff' : colors.text }]}>
                  এজেন্ট (Agent)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>মোবাইল ওয়ালেট নম্বর</Text>
              <TextInput
                style={[styles.standardInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
                placeholder="017XXXXXXXX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={11}
                value={destinationAccount}
                onChangeText={setDestinationAccount}
              />
            </View>
          </View>
        )}

        {/* Live Admin Commission & Net Payout Summary (Strictly honors /admin/commissions) */}
        {numAmount > 0 && (
          <View style={[styles.feeSummaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.feeSummaryLabel, { color: colors.textSecondary }]}>উত্তোলনের পরিমাণ:</Text>
              <Text style={[styles.feeSummaryValue, { color: colors.text }]}>৳{numAmount.toLocaleString()}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.feeSummaryLabel, { color: colors.textSecondary }]}>
                অ্যাডমিন ফি / চার্জ {isCommissionActive && commValue > 0 ? `(${commRateType === 'PERCENTAGE' ? `${commValue}%` : `৳${commValue}`})` : ''}:
              </Text>
              <Text style={[styles.feeSummaryValue, { color: withdrawFee > 0 ? '#ef4444' : '#10b981', fontWeight: '700' }]}>
                {withdrawFee > 0 ? `- ৳${withdrawFee.toLocaleString()}` : 'ফ্রি (৳০)'}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.summaryDivider, { borderTopColor: colors.border }]}>
              <Text style={[styles.feeSummaryLabel, { color: colors.text, fontWeight: '800' }]}>আপনি ক্যাশআউট পাবেন:</Text>
              <Text style={[styles.netPayoutValue, { color: '#059669' }]}>৳{netPayout.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 },
          ]}
          onPress={handleInitiateWithdraw}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>উইথড্র রিকোয়েস্ট নিশ্চিত করুন</Text>
          )}
        </TouchableOpacity>

        {/* Recent Withdrawals Section */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>সাম্প্রতিক উত্তোলনের তালিকা</Text>
          {loadingMyWithdrawals ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : myWithdrawals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Clock size={28} color={colors.textMuted} />
              <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>এখনো কোনো উইথড্র রিকোয়েস্ট করেননি।</Text>
            </View>
          ) : (
            myWithdrawals.map((req) => {
              const isPending = req.status === 'PENDING';
              const isApproved = req.status === 'APPROVED';

              return (
                <View
                  key={req.id}
                  style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.historyCardHeader}>
                    <View>
                      <Text style={[styles.historyMethod, { color: colors.text }]}>
                        {req.method?.name || req.bankName || 'ক্যাশআউট'}
                      </Text>
                      <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                        {new Date(req.createdAt).toLocaleString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isApproved ? '#dcfce7' : isPending ? '#fef3c7' : '#fee2e2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isApproved ? '#166534' : isPending ? '#b45309' : '#b91c1c',
                          },
                        ]}
                      >
                        {isApproved ? 'অনুমোদিত' : isPending ? 'পেন্ডিং' : 'বাতিল'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyDetails}>
                    <Text style={[styles.historyAccount, { color: colors.textSecondary }]}>
                      {req.destinationAccount}
                    </Text>
                    <Text style={[styles.historyAmount, { color: colors.text }]}>
                      ৳{Number(req.amount).toLocaleString()}
                    </Text>
                  </View>

                  {isPending && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelPendingWithdrawal(req.id)}
                      disabled={cancellingId === req.id}
                    >
                      {cancellingId === req.id ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <>
                          <XCircle size={14} color="#ef4444" />
                          <Text style={styles.cancelButtonText}>আবেদন বাতিল ও রিফান্ড</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>ব্যাংক নির্বাচন করুন</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {BANGLADESH_BANKS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[
                    styles.bankSelectItem,
                    { borderBottomColor: colors.border },
                    bankName === b && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => {
                    setBankName(b);
                    setShowBankPickerModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.bankSelectText,
                      { color: bankName === b ? colors.primary : colors.text, fontWeight: bankName === b ? '700' : '500' },
                    ]}
                  >
                    {b}
                  </Text>
                  {bankName === b && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setShowBankPickerModal(false)}
            >
              <Text style={[styles.closeModalBtnText, { color: colors.text }]}>বন্ধ করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderIcon}>
              <KeyRound size={40} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>ওটিপি কোড যাচাই</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              আপনার মোবাইল নম্বরে পাঠানো ৬-সংখ্যার ওটিপি কোডটি লিখুন।
            </Text>

            {simulatedCode && (
              <View style={[styles.simulatedBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                <Text style={styles.simulatedText}>
                  টেস্ট ওটিপি কোড: <Text style={{ fontWeight: '900' }}>{simulatedCode}</Text>
                </Text>
              </View>
            )}

            <TextInput
              style={[styles.otpInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowOtpModal(false)}
              >
                <Text style={{ color: colors.textSecondary }}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleConfirmOtp}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>যাচাই করুন</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal (For first-time or unsaved destination) */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderIcon}>
              <Lock size={40} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>নিরাপত্তা যাচাই</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              নিরাপত্তার স্বার্থে আপনার একাউন্টের লগইন পাসওয়ার্ড দিয়ে উত্তোলন নিশ্চিত করুন।
            </Text>

            <TextInput
              style={[styles.standardInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text, marginTop: 16 }]}
              placeholder="আপনার পাসওয়ার্ড"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={withdrawPassword}
              onChangeText={setWithdrawPassword}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={{ color: colors.textSecondary }}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleConfirmPassword}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>কনফার্ম করুন</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#ffffff',
    fontSize: 13,
    opacity: 0.9,
    fontWeight: '600',
  },
  balanceValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
  },
  balanceHint: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.8,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  methodCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
  },
  methodIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  methodName: {
    fontSize: 14,
    marginBottom: 4,
  },
  methodLimit: {
    fontSize: 11,
  },
  savedAccountsSection: {
    marginBottom: 16,
  },
  savedAccountsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  savedAccountChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  savedAccountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  subFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBlock: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  accountTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  accountTypeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  standardInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  selectBox: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  feeSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryDivider: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 8,
  },
  feeSummaryLabel: {
    fontSize: 13,
  },
  feeSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  netPayoutValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  recentSection: {
    marginTop: 10,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyCardText: {
    fontSize: 13,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyMethod: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyAccount: {
    fontSize: 12,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
    marginTop: 10,
    paddingTop: 8,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    padding: 22,
  },
  modalHeaderIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  simulatedBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  simulatedText: {
    color: '#92400e',
    fontSize: 13,
  },
  otpInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  bankSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  bankSelectText: {
    fontSize: 13,
    flex: 1,
  },
  closeModalBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  successScroll: {
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
  },
});
