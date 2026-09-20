import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  CreditCard,
  AlertCircle,
  Building2,
  Smartphone,
  Info,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../config';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

interface RechargeMethod {
  id: string;
  name: string;
  code: string;
  type: 'MANUAL' | 'API';
  accountNumber: string;
  accountName?: string | null;
  bankDetails?: string | null;
  instructions?: string | null;
  minAmount?: number;
  maxAmount?: number;
}

export const RechargeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user, refreshMe } = useAuthStore();

  const [methods, setMethods] = useState<RechargeMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<RechargeMethod | null>(null);

  // Form Fields
  const [amount, setAmount] = useState('1000');
  const [senderAccount, setSenderAccount] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoadingMethods(true);
      const res: any = await api.get('/wallet/recharge-methods');
      const data = Array.isArray(res) ? res : res?.data || [];
      setMethods(data);
      if (data.length > 0) {
        setSelectedMethod(data[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load recharge methods:', err);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleCopyAccount = (accNo: string) => {
    Clipboard.setString(accNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecharge = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      setError('নূন্যতম রিচার্জের পরিমাণ ৳ ১০');
      return;
    }

    if (!selectedMethod) {
      setError('অনুগ্রহ করে একটি পেমেন্ট মেথড নির্বাচন করুন।');
      return;
    }

    if (selectedMethod.minAmount && numAmount < Number(selectedMethod.minAmount)) {
      setError(`এই মাধ্যমে সর্বনিম্ন রিচার্জের পরিমাণ ৳ ${Number(selectedMethod.minAmount)}`);
      return;
    }

    if (selectedMethod.maxAmount && numAmount > Number(selectedMethod.maxAmount)) {
      setError(`এই মাধ্যমে সর্বোচ্চ রিচার্জের পরিমাণ ৳ ${Number(selectedMethod.maxAmount)}`);
      return;
    }

    if (!senderAccount.trim()) {
      setError('যে অ্যাকাউন্ট/নম্বর থেকে টাকা পাঠিয়েছেন তা লিখুন।');
      return;
    }

    if (!transactionNumber.trim()) {
      setError('পেমেন্টের ট্রানজ্যাকশন আইডি (TrxID) অবশ্যই লিখুন।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/wallet/recharge', {
        methodId: selectedMethod.id,
        amount: numAmount,
        senderAccount: senderAccount.trim(),
        transactionNumber: transactionNumber.trim().toUpperCase(),
        proofUrl: proofUrl.trim() || undefined,
      });

      setSuccess(true);
      await refreshMe();
    } catch (err: any) {
      console.warn('Recharge error:', err);
      setError(err?.message || 'রিচার্জ রিকোয়েস্টে সমস্যা হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title="রিচার্জ সফল" />
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={56} color="#10b981" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>রিচার্জ আবেদন জমা হয়েছে!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            আপনার ৳{parseFloat(amount).toLocaleString()} টাকার রিচার্জ আবেদনটি সফলভাবে জমা নেওয়া হয়েছে। ট্রানজ্যাকশন আইডি যাচাই করে এডমিন দ্রুত ব্যালেন্স যুক্ত করে দেবেন।
          </Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>মেথড:</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>{selectedMethod?.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>টাকার পরিমাণ:</Text>
              <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '900' }]}>
                {APP_CONFIG.currency} {parseFloat(amount).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>TrxID:</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>{transactionNumber.toUpperCase()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>স্ট্যাটাস:</Text>
              <View style={styles.statusPillPending}>
                <Text style={styles.statusPillPendingText}>PENDING APPROVAL</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.backHomeBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Wallet' })}
          >
            <Text style={styles.backHomeBtnText}>ওয়ালেটে ফিরে যান</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="ওয়ালেট রিচার্জ" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* 1. Amount Input Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>রিচার্জের পরিমাণ (টাকা)</Text>
          <View style={[styles.amountInputRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.currencyPrefix, { color: colors.primary }]}>{APP_CONFIG.currency}</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError('');
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={[styles.amountInput, { color: colors.text }]}
            />
          </View>

          {/* Quick Amounts */}
          <View style={styles.quickAmountRow}>
            {QUICK_AMOUNTS.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => {
                  setAmount(q.toString());
                  setError('');
                }}
                style={[
                  styles.quickChip,
                  {
                    backgroundColor: amount === q.toString() ? colors.primary : colors.surfaceSecondary,
                    borderColor: amount === q.toString() ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    { color: amount === q.toString() ? '#ffffff' : colors.text },
                  ]}
                >
                  +{q.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Select Payment Method */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>পেমেন্ট মেথড নির্বাচন করুন</Text>

          {loadingMethods ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : methods.length === 0 ? (
            <Text style={[styles.emptyMethodText, { color: colors.textMuted }]}>
              কোনো সক্রিয় পেমেন্ট মেথড পাওয়া যায়নি। এডমিনের সাথে যোগাযোগ করুন।
            </Text>
          ) : (
            <View style={styles.methodsGrid}>
              {methods.map((m) => {
                const isSelected = selectedMethod?.id === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      setSelectedMethod(m);
                      setError('');
                    }}
                    style={[
                      styles.methodItem,
                      {
                        backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.methodIconRow}>
                      <Smartphone size={16} color={isSelected ? colors.primary : colors.textSecondary} />
                      <Text
                        style={[
                          styles.methodName,
                          { color: isSelected ? colors.primary : colors.text, fontWeight: '800' },
                        ]}
                      >
                        {m.name}
                      </Text>
                    </View>
                    {m.accountNumber ? (
                      <Text style={[styles.methodAccBadge, { color: colors.textMuted }]}>
                        {m.accountNumber}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Selected Method Details & Copy Box */}
          {selectedMethod && (
            <View style={[styles.instructionBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.instructionHeader}>
                <Info size={16} color={colors.primary} />
                <Text style={[styles.instructionTitle, { color: colors.text }]}>
                  {selectedMethod.name} পেমেন্ট নির্দেশনা:
                </Text>
              </View>

              {selectedMethod.accountNumber ? (
                <View style={[styles.copyAccountRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View>
                    <Text style={[styles.copyAccountLabel, { color: colors.textMuted }]}>
                      নিচের নম্বরে টাকা পাঠান (Send Money):
                    </Text>
                    <Text style={[styles.copyAccountNumber, { color: colors.primary }]}>
                      {selectedMethod.accountNumber}
                    </Text>
                    {selectedMethod.accountName ? (
                      <Text style={[styles.copyAccountName, { color: colors.textSecondary }]}>
                        অ্যাকাউন্টের নাম: {selectedMethod.accountName}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleCopyAccount(selectedMethod.accountNumber)}
                    style={[styles.copyBtn, { backgroundColor: copied ? '#10b981' : colors.primary }]}
                  >
                    {copied ? <Check size={14} color="#ffffff" /> : <Copy size={14} color="#ffffff" />}
                    <Text style={styles.copyBtnText}>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {selectedMethod.instructions ? (
                <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                  {selectedMethod.instructions}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* 3. Transaction Details Form */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            টাকা পাঠানোর বিবরণ (Transaction Proof)
          </Text>

          {/* Sender Account */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            আপনার প্রেরক নম্বর / অ্যাকাউন্ট (Sender Account) *
          </Text>
          <TextInput
            value={senderAccount}
            onChangeText={(text) => {
              setSenderAccount(text);
              setError('');
            }}
            placeholder="01XXXXXXXXX"
            keyboardType="phone-pad"
            placeholderTextColor={colors.textMuted}
            style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
          />

          {/* Transaction Number / TrxID */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            ট্রানজ্যাকশন আইডি (TrxID) *
          </Text>
          <TextInput
            value={transactionNumber}
            onChangeText={(text) => {
              setTransactionNumber(text);
              setError('');
            }}
            placeholder="যেমন: 9J2K8L10P"
            autoCapitalize="characters"
            placeholderTextColor={colors.textMuted}
            style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
          />

          {/* Optional Proof URL */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            স্ক্রিনশট / রসিদ লিংক (ঐচ্ছিক)
          </Text>
          <TextInput
            value={proofUrl}
            onChangeText={setProofUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            style={[styles.formInput, { backgroundColor: colors.surfaceSecondary, color: colors.text, borderColor: colors.border }]}
          />
        </View>

        {/* 4. Security Pledge */}
        <View style={[styles.securityBox, { backgroundColor: '#0284c715', borderColor: '#0284c740' }]}>
          <ShieldCheck size={20} color="#0284c7" />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            সঠিক ট্রানজ্যাকশন আইডি প্রদান করুন। ভেরিফিকেশনের পর সাথে সাথে ব্যালেন্স আপনার ওয়ালেটে জমা হবে।
          </Text>
        </View>

        {/* 5. Submit Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRecharge}
          disabled={loading}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>রিচার্জ রিকোয়েস্ট জমা দিন</Text>
              <ArrowRight size={16} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
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
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingBottom: 6,
    gap: 6,
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '900',
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    paddingVertical: 4,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  methodsGrid: {
    gap: 8,
  },
  emptyMethodText: {
    fontSize: 12,
    paddingVertical: 8,
  },
  methodItem: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 4,
  },
  methodIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '800',
  },
  methodAccBadge: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 24,
  },
  instructionBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  copyAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  copyAccountLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  copyAccountNumber: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  copyAccountName: {
    fontSize: 10,
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  instructionText: {
    fontSize: 11,
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  securityText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Success State
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillPending: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillPendingText: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '900',
  },
  backHomeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  backHomeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
