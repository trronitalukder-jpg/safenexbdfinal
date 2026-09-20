'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  Building2,
  Info,
  Sparkles,
  RefreshCw,
  Zap,
  Upload,
  X,
  Image as ImageIcon,
  RotateCcw,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { compressImage, getImageUrl } from '@/lib/imageUtils';

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
  'EXIM Bank Bangladesh',
  'One Bank PLC',
  'Social Islami Bank PLC',
  'Uttara Bank PLC',
  'Janata Bank PLC',
  'Agrani Bank PLC',
  'Rupali Bank PLC',
  'OTHER',
];

function WalletContent() {
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');
  const { user, refreshMe } = useAuthStore();
  const { lang, t } = useLanguage();

  const [ledgerItems, setLedgerItems] = useState<any[]>([]);
  const [rechargeMethods, setRechargeMethods] = useState<any[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Gateway Configs & Checkout state
  const [gatewayConfigs, setGatewayConfigs] = useState<any>(null);
  const [commissionSettings, setCommissionSettings] = useState<any>(null);
  const [isInitiatingGateway, setIsInitiatingGateway] = useState(false);
  const [isExecutingGateway, setIsExecutingGateway] = useState(false);
  const [gatewaySession, setGatewaySession] = useState<any>(null);
  const [showGatewayCheckoutModal, setShowGatewayCheckoutModal] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutTrxId, setCheckoutTrxId] = useState('');

  // Modals
  const [showRechargeModal, setShowRechargeModal] = useState(initialAction === 'recharge');
  const [showWithdrawModal, setShowWithdrawModal] = useState(initialAction === 'withdraw');

  // Immediately clear URL action query param so page refresh doesn't reopen modal
  useEffect(() => {
    if (initialAction && typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [initialAction]);

  // Recharge Form state
  const [rechargeMethodId, setRechargeMethodId] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState<number>(500);
  const [senderAccount, setSenderAccount] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState('');
  const [rechargeError, setRechargeError] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Proof Upload state
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploadError, setProofUploadError] = useState('');

  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProofUploadError(lang === 'bn' ? 'শুধুমাত্র ছবি (JPG, PNG, WEBP) আপলোড করুন' : 'Only image files allowed');
      return;
    }

    setProofUploadError('');
    setIsUploadingProof(true);

    try {
      const { base64Data, fileName: cleanFileName } = await compressImage(file, 1200, 1200, 0.85);
      const res: any = await api.post('/uploads', {
        base64Data,
        fileName: cleanFileName,
        folder: 'recharges',
      });

      const uploadedUrl = res?.fileUrl || res?.data?.fileUrl || res?.url;
      if (uploadedUrl) {
        setProofUrl(uploadedUrl);
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (err: any) {
      console.error('Proof upload error:', err);
      setProofUploadError(
        lang === 'bn'
          ? 'স্ক্রিনশট আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to upload screenshot. Please try again.'
      );
    } finally {
      setIsUploadingProof(false);
      e.target.value = '';
    }
  };

  // Withdraw Form state
  const [withdrawMethodId, setWithdrawMethodId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [destinationAccount, setDestinationAccount] = useState('');
  const [withdrawAccountType, setWithdrawAccountType] = useState<'PERSONAL' | 'AGENT'>('PERSONAL');
  const [bankName, setBankName] = useState('Dutch-Bangla Bank PLC (DBBL)');
  const [customBankName, setCustomBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  // Security Modes / Withdrawal OTP state (Switchable Dual-Mode)
  const [withdrawOtpEnabled, setWithdrawOtpEnabled] = useState(false);
  const [showWithdrawOtpModal, setShowWithdrawOtpModal] = useState(false);
  const [withdrawOtpCode, setWithdrawOtpCode] = useState('');
  const [isSendingWithdrawOtp, setIsSendingWithdrawOtp] = useState(false);
  const [withdrawOtpCooldown, setWithdrawOtpCooldown] = useState(0);
  const [pendingWithdrawPayload, setPendingWithdrawPayload] = useState<any>(null);
  const [withdrawSimulatedCode, setWithdrawSimulatedCode] = useState<string | null>(null);

  // Security Modes / First-time Withdrawal Password Modal
  const [showWithdrawPasswordModal, setShowWithdrawPasswordModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [showWithdrawPassword, setShowWithdrawPassword] = useState(false);
  const [withdrawPasswordError, setWithdrawPasswordError] = useState('');
  const [cancellingWithdrawId, setCancellingWithdrawId] = useState<string | null>(null);

  // Saved Payout Accounts
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [selectedSavedAccountId, setSelectedSavedAccountId] = useState<string | null>(null);

  const handleSelectSavedAccount = (acc: any, methodsList?: any[]) => {
    setSelectedSavedAccountId(acc.id);
    setWithdrawError('');
    const isBk = acc.methodType === 'BKASH';
    const isNg = acc.methodType === 'NAGAD';
    const isRk = acc.methodType === 'ROCKET';
    const isBank = acc.methodType === 'BANK';

    const listToSearch = (methodsList && methodsList.length > 0) ? methodsList : withdrawalMethods;
    const matchMethod = listToSearch.find((w) => {
      const code = (w.code || '').toUpperCase();
      const name = (w.name || '').toUpperCase();
      if (isBk) return code.includes('BKASH') || name.includes('BKASH');
      if (isNg) return code.includes('NAGAD') || name.includes('NAGAD');
      if (isRk) return code.includes('ROCKET') || name.includes('ROCKET');
      if (isBank) return code.includes('BANK') || name.includes('BANK');
      return false;
    });

    if (matchMethod) {
      setWithdrawMethodId(matchMethod.id);
    }

    if (isBank) {
      if (acc.bankName) {
        if (BANGLADESH_BANKS.includes(acc.bankName)) {
          setBankName(acc.bankName);
          setCustomBankName('');
        } else {
          setBankName('OTHER');
          setCustomBankName(acc.bankName);
        }
      }
      setAccountHolderName(acc.accountName || '');
      setAccountNumber(acc.accountNumber || '');
      setRoutingNumber(acc.routingNumber || '');
      setBranchName(acc.branchName || '');
    } else {
      setDestinationAccount(acc.accountNumber || '');
      setWithdrawAccountType(acc.accountType === 'AGENT' ? 'AGENT' : 'PERSONAL');
    }
  };

  const loadData = () => {
    setLoading(true);
    refreshMe();

    Promise.all([
      api.get('/wallet/ledger'),
      api.get('/wallet/recharge-methods'),
      api.get('/wallet/withdrawal-methods'),
      api.get('/wallet/gateway/configs'),
      api.get('/commission/settings').catch(() => null),
      api.get('/users/payment-accounts').catch(() => []),
    ])
      .then(([ledgerRes, recMethods, withMethods, gwConfigs, commSettings, savedAccounts]: any) => {
        const ledgerList = ledgerRes?.items || (Array.isArray(ledgerRes) ? ledgerRes : []);
        setLedgerItems(ledgerList);
        const recList = Array.isArray(recMethods) ? recMethods : recMethods?.data || [];
        setRechargeMethods(recList);
        if (recList.length > 0) setRechargeMethodId(recList[0].id);
        const withList = Array.isArray(withMethods) ? withMethods : withMethods?.data || [];
        setWithdrawalMethods(withList);
        if (withList.length > 0) setWithdrawMethodId(withList[0].id);
        const configs = gwConfigs?.data || gwConfigs;
        setGatewayConfigs(configs);
        const rawComm = commSettings?.data !== undefined ? commSettings.data : commSettings;
        const commData = rawComm?.data !== undefined ? rawComm.data : rawComm;
        setCommissionSettings(commData);
        const accountsList = Array.isArray(savedAccounts) ? savedAccounts : savedAccounts?.data || [];
        setPaymentAccounts(accountsList);

        // Auto-select default payment account if available
        const defaultAccount = accountsList.find((a: any) => a.isDefault) || accountsList[0];
        if (defaultAccount) {
          handleSelectSavedAccount(defaultAccount, withList);
        }

        // Fetch public security modes (Withdrawal OTP status)
        api
          .get('/sms/public-modes')
          .then((secRes: any) => {
            const secData = secRes?.data !== undefined ? secRes.data : secRes;
            if (secData?.withdrawOtpEnabled !== undefined) {
              setWithdrawOtpEnabled(Boolean(secData.withdrawOtpEnabled));
            }
          })
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // OTP resend cooldown timer
  useEffect(() => {
    if (withdrawOtpCooldown <= 0) return;
    const timer = setInterval(() => {
      setWithdrawOtpCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [withdrawOtpCooldown]);

  const handleInitiateGateway = async (gatewayType: 'BKASH' | 'SSLCOMMERZ') => {
    setRechargeError('');
    setRechargeSuccess('');
    setIsInitiatingGateway(true);
    try {
      const res: any = await api.post('/wallet/gateway/initiate', {
        gateway: gatewayType,
        amount: Number(rechargeAmount),
      });
      const sessionData = res?.data || res;
      setGatewaySession(sessionData);
      setCheckoutTrxId('');
      setShowGatewayCheckoutModal(true);
    } catch (err: any) {
      setRechargeError(err.response?.data?.message || err.message || 'Failed to initiate gateway payment');
    } finally {
      setIsInitiatingGateway(false);
    }
  };

  const handleExecuteGateway = async () => {
    if (!gatewaySession) return;
    setIsExecutingGateway(true);
    setRechargeError('');
    try {
      const res: any = await api.post('/wallet/gateway/execute', {
        paymentId: gatewaySession.paymentId,
        trxId: checkoutTrxId.trim() || undefined,
      });
      setShowGatewayCheckoutModal(false);
      setRechargeSuccess(
        lang === 'bn'
          ? `৳${Number(gatewaySession.amount).toLocaleString()} সফলভাবে আপনার ওয়ালেটে ইনস্ট্যান্ট যোগ হয়েছে!`
          : `৳${Number(gatewaySession.amount).toLocaleString()} successfully added to your wallet!`
      );
      loadData();
      refreshMe();
      setTimeout(() => {
        setShowRechargeModal(false);
        setRechargeSuccess('');
      }, 3500);
    } catch (err: any) {
      setRechargeError(err.response?.data?.message || err.message || 'Payment execution failed');
    } finally {
      setIsExecutingGateway(false);
    }
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError('');
    setRechargeSuccess('');

    try {
      await api.post('/wallet/recharge', {
        methodId: rechargeMethodId,
        amount: Number(rechargeAmount),
        senderAccount: senderAccount.trim(),
        transactionNumber: transactionNumber.trim(),
        proofUrl: proofUrl.trim() || undefined,
      });

      setRechargeSuccess(
        lang === 'bn'
          ? 'রিচার্জ রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে! ওয়ালেট লেজারে "রিচার্জ পেন্ডিং" হিসেবে যুক্ত হয়েছে, অ্যাডমিন অ্যাপ্রুভ করলে ব্যালেন্স যোগ হবে।'
          : 'Recharge request submitted! Listed as "Recharge Pending" in your Wallet Ledger.',
      );
      loadData();
      refreshMe();
      setTimeout(() => setShowRechargeModal(false), 2500);
    } catch (err: any) {
      setRechargeError(err.message || 'Failed to submit recharge request');
    }
  };

  const selectedWithdrawMethod = withdrawalMethods.find((w) => w.id === withdrawMethodId);
  const isBankWithdraw =
    selectedWithdrawMethod?.code?.toUpperCase().includes('BANK') ||
    selectedWithdrawMethod?.name?.toLowerCase().includes('bank');
  const isBkashWithdraw =
    selectedWithdrawMethod?.code?.toUpperCase().includes('BKASH') ||
    selectedWithdrawMethod?.name?.toLowerCase().includes('bkash');
  const isNagadWithdraw =
    selectedWithdrawMethod?.code?.toUpperCase().includes('NAGAD') ||
    selectedWithdrawMethod?.name?.toLowerCase().includes('nagad');
  const isRocketWithdraw =
    selectedWithdrawMethod?.code?.toUpperCase().includes('ROCKET') ||
    selectedWithdrawMethod?.name?.toLowerCase().includes('rocket');

  // Withdraw Commission Setting from Admin Panel (/admin/commissions)
  const withdrawCommission = commissionSettings?.withdraw;
  const hasLoadedCommission = !!withdrawCommission;
  const isCommissionActive = hasLoadedCommission ? withdrawCommission.isActive !== false : false;
  const commRateType = withdrawCommission?.rateType || 'PERCENTAGE';
  const commValue = Number(withdrawCommission?.value ?? 0);
  const commMinFee = Number(withdrawCommission?.minFee ?? 0);
  const commMaxFee = Number(withdrawCommission?.maxFee ?? 0);

  // Withdrawal fee calculations - strictly honors /admin/commissions
  let withdrawFee = 0;
  if (withdrawAmount > 0) {
    if (isCommissionActive) {
      if (commValue > 0) {
        if (commRateType === 'PERCENTAGE') {
          withdrawFee = (withdrawAmount * commValue) / 100;
        } else {
          withdrawFee = commValue;
        }
        if (commMinFee > 0 && withdrawFee < commMinFee) {
          withdrawFee = commMinFee;
        }
        if (commMaxFee > 0 && withdrawFee > commMaxFee) {
          withdrawFee = commMaxFee;
        }
      } else {
        withdrawFee = 0;
      }
    } else if (selectedWithdrawMethod) {
      const feePct = Number(selectedWithdrawMethod.feePercentage || 0);
      const feeFlat = Number(selectedWithdrawMethod.feeFlat || 0);
      if (feePct > 0) {
        withdrawFee += (withdrawAmount * feePct) / 100;
      }
      if (feeFlat > 0) {
        withdrawFee += feeFlat;
      }
    }
    withdrawFee = Math.round(withdrawFee * 100) / 100;
  }
  const netWithdrawAmount = Math.max(0, Math.round((withdrawAmount - withdrawFee) * 100) / 100);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    if (!selectedWithdrawMethod) {
      setWithdrawError(lang === 'bn' ? 'উইথড্র মেথড নির্বাচন করুন' : 'Select a payout method');
      return;
    }

    const minAmt = Number(selectedWithdrawMethod.minAmount || 50);
    const maxAmt = Number(selectedWithdrawMethod.maxAmount || 100000);

    if (withdrawAmount < minAmt || withdrawAmount > maxAmt) {
      setWithdrawError(
        lang === 'bn'
          ? `উত্তোলনের পরিমাণ ৳${minAmt.toLocaleString()} থেকে ৳${maxAmt.toLocaleString()} এর মধ্যে হতে হবে`
          : `Withdrawal amount must be between ৳${minAmt.toLocaleString()} and ৳${maxAmt.toLocaleString()}`
      );
      return;
    }

    const currentAvailable = Number(user?.wallet?.availableBalance || 0);
    if (withdrawAmount > currentAvailable) {
      setWithdrawError(
        lang === 'bn'
          ? `আপনার Available ব্যালেন্স অপর্যাপ্ত। Hold ব্যালেন্স তোলা যাবে না। (Available: ৳${currentAvailable.toLocaleString()})`
          : `Insufficient available balance. Hold balance cannot be withdrawn. (Available: ৳${currentAvailable.toLocaleString()})`
      );
      return;
    }

    const payload: any = {
      methodId: withdrawMethodId,
      amount: Number(withdrawAmount),
    };

    if (isBankWithdraw) {
      const finalBank = bankName === 'OTHER' ? customBankName.trim() : bankName.trim();
      if (!finalBank) {
        setWithdrawError(lang === 'bn' ? 'অনুগ্রহ করে ব্যাংকের নাম নির্বাচন বা লিখুন' : 'Bank Name is required');
        return;
      }
      if (!accountHolderName.trim()) {
        setWithdrawError(lang === 'bn' ? 'ব্যাংক একাউন্ট হোল্ডারের নাম আবশ্যক' : 'Account Holder Name is required');
        return;
      }
      if (!accountNumber.trim()) {
        setWithdrawError(lang === 'bn' ? 'ব্যাংক একাউন্ট নম্বর আবশ্যক' : 'Bank Account Number is required');
        return;
      }
      if (!routingNumber.trim()) {
        setWithdrawError(lang === 'bn' ? 'ব্যাংক রাউটিং নম্বর (Routing Number) আবশ্যক' : 'Bank Routing Number is required');
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
      if (!cleanNumber) {
        setWithdrawError(lang === 'bn' ? 'মোবাইল একাউন্ট নম্বর প্রদান করুন' : 'Mobile number is required');
        return;
      }
      if (!/^01[3-9]\d{8}$/.test(cleanNumber)) {
        setWithdrawError(
          lang === 'bn'
            ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)'
            : 'Enter a valid 11-digit mobile number (e.g. 01712345678)'
        );
        return;
      }
      payload.destinationAccount = cleanNumber;
      payload.accountType = withdrawAccountType;
    }

    // DUAL-MODE WITHDRAWAL: Check Security Settings for Withdrawal OTP
    let isOtpRequired = withdrawOtpEnabled;
    try {
      const modeRes: any = await api.get('/sms/public-modes');
      const modeData = modeRes?.data !== undefined ? modeRes.data : modeRes;
      if (modeData?.withdrawOtpEnabled !== undefined) {
        isOtpRequired = Boolean(modeData.withdrawOtpEnabled);
        setWithdrawOtpEnabled(isOtpRequired);
      }
    } catch {
      // fallback to current state
    }

    if (isOtpRequired) {
      setIsSubmittingWithdraw(true);
      try {
        setPendingWithdrawPayload(payload);
        setWithdrawOtpCode('');
        setWithdrawSimulatedCode(null);

        const res: any = await api.post('/wallet/withdraw/send-otp', {
          amount: payload.amount,
          methodId: payload.methodId,
          destination: payload.destinationAccount,
        });

        const data = res?.data !== undefined ? res.data : res;
        if (data?.simulatedCode) {
          setWithdrawSimulatedCode(data.simulatedCode);
        }

        setWithdrawOtpCooldown(45);
        setShowWithdrawModal(false);
        setShowWithdrawOtpModal(true);
      } catch (err: any) {
        setWithdrawError(err.message || err.response?.data?.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে');
      } finally {
        setIsSubmittingWithdraw(false);
      }
      return;
    }

    // Attach password only if provided
    if (withdrawPassword.trim()) {
      payload.password = withdrawPassword.trim();
    }

    // Direct submit when OTP is OFF
    setIsSubmittingWithdraw(true);
    try {
      await api.post('/wallet/withdraw', payload);
      setWithdrawSuccess(
        lang === 'bn'
          ? 'উইথড্র রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে! এডমিন দ্রুত যাচাই করে পেমেন্ট সম্পন্ন করবেন।'
          : 'Withdrawal request submitted successfully! Admin will review and process payout.'
      );
      loadData();
      refreshMe();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setDestinationAccount('');
        setAccountNumber('');
        setAccountHolderName('');
        setRoutingNumber('');
        setBranchName('');
        setCustomBankName('');
        setWithdrawSuccess('');
      }, 2500);
    } catch (err: any) {
      setWithdrawError(err.message || err.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Confirm Withdrawal with Password (First-time / Unsaved Account auto-save flow)
  const handleConfirmWithdrawWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawPassword.trim()) {
      setWithdrawPasswordError(
        lang === 'bn' ? 'নিরাপত্তার জন্য আপনার পাসওয়ার্ড দিন' : 'Enter your password for security'
      );
      return;
    }
    if (!pendingWithdrawPayload) return;

    setIsSubmittingWithdraw(true);
    setWithdrawPasswordError('');

    try {
      const finalPayload = {
        ...pendingWithdrawPayload,
        password: withdrawPassword.trim(),
      };

      await api.post('/wallet/withdraw', finalPayload);
      setShowWithdrawPasswordModal(false);
      setPendingWithdrawPayload(null);
      setWithdrawPassword('');
      setWithdrawSuccess(
        lang === 'bn'
          ? 'উইথড্র সফলভাবে সাবমিট হয়েছে এবং অ্যাকাউন্টটি স্বয়ংক্রিয়ভাবে সেভ হয়েছে!'
          : 'Withdrawal submitted and destination account automatically saved!'
      );
      loadData();
      refreshMe();
      setTimeout(() => {
        setDestinationAccount('');
        setAccountNumber('');
        setAccountHolderName('');
        setRoutingNumber('');
        setBranchName('');
        setCustomBankName('');
        setWithdrawSuccess('');
      }, 3000);
    } catch (err: any) {
      setWithdrawPasswordError(
        err.response?.data?.message || err.message || (lang === 'bn' ? 'উইথড্র আবেদন ব্যর্থ হয়েছে' : 'Failed to submit withdrawal')
      );
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // User cancels their own PENDING withdrawal request
  const handleCancelWithdrawal = async (requestId: string) => {
    if (!requestId) return;
    const confirmMsg =
      lang === 'bn'
        ? 'আপনি কি এই পেন্ডিং উইথড্র আবেদনটি বাতিল করতে চান? পুরো টাকা সাথে সাথে আপনার মূল ব্যালেন্সে ফেরত আসবে।'
        : 'Are you sure you want to cancel this pending withdrawal request? Full amount will be refunded to your balance.';
    if (!confirm(confirmMsg)) return;

    setCancellingWithdrawId(requestId);
    try {
      await api.post(`/wallet/withdraw/${requestId}/cancel`);
      alert(
        lang === 'bn'
          ? 'উইথড্র আবেদন সফলভাবে বাতিল হয়েছে এবং টাকা আপনার ওয়ালেট ব্যালেন্সে ফেরত দেওয়া হয়েছে।'
          : 'Withdrawal successfully cancelled and refunded to your wallet balance.'
      );
      loadData();
      refreshMe();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel withdrawal');
    } finally {
      setCancellingWithdrawId(null);
    }
  };

  // Confirm Withdrawal with 6-digit OTP code
  const handleConfirmWithdrawWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawOtpCode.trim()) {
      setWithdrawError('অনুগ্রহ করে ৬-সংখ্যার ওটিপি কোডটি প্রদান করুন');
      return;
    }
    if (!pendingWithdrawPayload) return;

    setIsSubmittingWithdraw(true);
    setWithdrawError('');

    try {
      const finalPayload = {
        ...pendingWithdrawPayload,
        otpCode: withdrawOtpCode.trim(),
      };

      await api.post('/wallet/withdraw', finalPayload);
      setShowWithdrawOtpModal(false);
      setPendingWithdrawPayload(null);
      setWithdrawSuccess(
        lang === 'bn'
          ? 'উইথড্র রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে! এডমিন দ্রুত যাচাই করে পেমেন্ট সম্পন্ন করবেন।'
          : 'Withdrawal request submitted successfully! Admin will review and process payout.'
      );
      loadData();
      refreshMe();
      setTimeout(() => {
        setDestinationAccount('');
        setAccountNumber('');
        setAccountHolderName('');
        setRoutingNumber('');
        setBranchName('');
        setCustomBankName('');
        setWithdrawSuccess('');
      }, 3000);
    } catch (err: any) {
      setWithdrawError(err.message || err.response?.data?.message || 'ভুল ওটিপি কোড অথবা আবেদন ব্যর্থ হয়েছে');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Resend Withdrawal OTP
  const handleResendWithdrawOtp = async () => {
    if (!pendingWithdrawPayload || withdrawOtpCooldown > 0) return;
    setIsSendingWithdrawOtp(true);
    setWithdrawError('');
    try {
      const res: any = await api.post('/wallet/withdraw/send-otp', {
        amount: pendingWithdrawPayload.amount,
        methodId: pendingWithdrawPayload.methodId,
        destination: pendingWithdrawPayload.destinationAccount,
      });
      const data = res?.data !== undefined ? res.data : res;
      if (data?.simulatedCode) {
        setWithdrawSimulatedCode(data.simulatedCode);
      }
      setWithdrawOtpCooldown(45);
    } catch (err: any) {
      setWithdrawError(err.message || err.response?.data?.message || 'ওটিপি পুনরায় পাঠাতে ব্যর্থ হয়েছে');
    } finally {
      setIsSendingWithdrawOtp(false);
    }
  };

  const available = Number(user?.wallet?.availableBalance || 0);
  const hold = Number(user?.wallet?.holdBalance || 0);
  const selectedRechargeMethod = rechargeMethods.find((m) => m.id === rechargeMethodId);

  const isApiGateway = selectedRechargeMethod?.type === 'API' || selectedRechargeMethod?.code?.includes('API');
  const isBkashApi = isApiGateway && (selectedRechargeMethod?.code === 'BKASH_API' || selectedRechargeMethod?.name?.toLowerCase().includes('bkash'));
  const isSslApi = isApiGateway && (selectedRechargeMethod?.code === 'SSLCOMMERZ_API' || selectedRechargeMethod?.name?.toLowerCase().includes('ssl'));

  const activeGatewayConfig = isBkashApi ? gatewayConfigs?.bkash : isSslApi ? gatewayConfigs?.sslcommerz : null;
  const chargeType = activeGatewayConfig?.chargeType || 'PERCENTAGE';
  const chargeValue = Number(activeGatewayConfig?.chargeValue ?? (isBkashApi ? 1.5 : isSslApi ? 2.5 : 0));
  const calculatedFee = isApiGateway
    ? (chargeType === 'PERCENTAGE'
        ? Math.round(((Number(rechargeAmount) * chargeValue) / 100) * 100) / 100
        : chargeValue)
    : 0;
  const totalPayable = Math.round((Number(rechargeAmount) + calculatedFee) * 100) / 100;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'ওয়ালেট ও আর্থিক লেজার' : 'Wallet & Financial Ledger'}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'ব্যালেন্স রিচার্জ, উত্তোলন এবং সম্পূর্ণ অপরিবর্তনীয় অডিট লেজার' : 'Recharge, withdraw, and audit your complete financial ledger history'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>{t('recharge')}</span>
          </button>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>{t('withdraw')}</span>
          </button>
        </div>
      </div>

      {/* Balance Cards (Spec #65) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-4">
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 dark:text-emerald-400 min-w-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{t('available_balance')}</span>
            </div>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
              WITHDRAWABLE
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ৳ {available.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {lang === 'bn' ? 'উইথড্র বা ডিলে ব্যবহারযোগ্য' : 'Immediate payout available'}
          </p>
        </div>

        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-500 min-w-0">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{t('hold_balance')}</span>
            </div>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-500">
              LOCKED
            </span>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ৳ {hold.toLocaleString()}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {lang === 'bn' ? 'এসক্রো রিলিজের পর পাবেন' : 'Releases after escrow'}
          </p>
        </div>
      </div>

      {/* Immutable Wallet Ledger Table (Spec #12) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500" />
            <span>{t('wallet_ledger')}</span>
          </h2>
          <span className="text-[11px] sm:text-xs text-slate-400">
            {lang === 'bn' ? 'লেনদেনের অডিট রেকর্ড' : 'Immutable Financial Trail'}
          </span>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 py-6 text-center">Loading ledger records...</div>
        ) : ledgerItems.length === 0 ? (
          <div className="text-xs text-slate-400 py-6 text-center">
            {lang === 'bn' ? 'কোনো লেজার হিস্টোরি নেই' : 'No ledger records yet'}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Before</th>
                  <th className="p-3">After</th>
                  <th className="p-3">Hold Balance</th>
                  <th className="p-3">Audit Notes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledgerItems.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isRejected = item.status === 'REJECTED';
                  const isCompleted = item.status === 'COMPLETED' || item.status === 'SUCCESS';
                  const isWithdraw = item.type === 'WITHDRAWAL';
                  const isRecharge = item.type === 'RECHARGE';
                  const isCredit =
                    item.type === 'RECHARGE' ||
                    item.type === 'ADMIN_ADJUSTMENT' ||
                    item.type === 'TRANSFER_IN' ||
                    item.type === 'HOLD_REFUND' ||
                    item.type === 'BID_RELEASE';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.type === 'RECHARGE'
                              ? isPending
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : item.type === 'WITHDRAWAL'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : item.type === 'HOLD_LOCK'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                              : item.type === 'HOLD_RELEASE'
                              ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                              : isRejected
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          }`}
                        >
                          {isRecharge ? (
                            isPending ? (
                              <>
                                <Clock className="w-3 h-3 animate-spin text-amber-500" />
                                <span>{lang === 'bn' ? 'রিচার্জ পেন্ডিং' : 'Recharge Pending'}</span>
                              </>
                            ) : isRejected ? (
                              <>
                                <X className="w-3 h-3 text-rose-500" />
                                <span>{lang === 'bn' ? 'রিচার্জ বাতিল' : 'Recharge Rejected'}</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>{lang === 'bn' ? 'রিচার্জ সফল' : 'Recharge Success'}</span>
                              </>
                            )
                          ) : (
                            isPending ? (
                              <>
                                <Clock className="w-3 h-3 animate-spin text-amber-500" />
                                <span>{lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</span>
                              </>
                            ) : isRejected ? (
                              <>
                                <X className="w-3 h-3 text-rose-500" />
                                <span>{lang === 'bn' ? 'বাতিল' : 'Rejected'}</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>{lang === 'bn' ? 'সম্পন্ন' : 'Completed'}</span>
                              </>
                            )
                          )}
                        </span>
                      </td>

                      <td className="p-3 font-bold whitespace-nowrap">
                        {isRecharge && isPending ? (
                          <div>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              ৳ {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="block text-[9px] text-amber-500 font-normal">
                              {lang === 'bn' ? 'পেন্ডিং (অনুমোদন বাকি)' : 'Pending Approval'}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={
                              isWithdraw
                                ? 'text-rose-600 dark:text-rose-400'
                                : isCredit && !isPending
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }
                          >
                            {isWithdraw ? '-' : isCredit && !isPending ? '+' : ''}৳{' '}
                            {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        ৳ {Number(item.balanceBefore).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                        {isPending ? (
                          <span className="text-slate-400" title={lang === 'bn' ? 'অ্যাডমিন অনুমোদনের পর যোগ হবে' : 'Credited after admin approval'}>
                            ৳ {Number(item.balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ৳ {Number(item.balanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-amber-500 whitespace-nowrap font-mono text-[11px]">
                        ৳ {Number(item.holdAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 max-w-sm text-[11px] leading-relaxed">
                        {item.notes}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isWithdraw && isPending && (
                          <button
                            type="button"
                            onClick={() => handleCancelWithdrawal(item.referenceId || item.id)}
                            disabled={cancellingWithdrawId === (item.referenceId || item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition disabled:opacity-50"
                            title={lang === 'bn' ? 'পেন্ডিং উইথড্র রিকোয়েস্ট বাতিল করে ব্যালেন্স ফেরত নিন' : 'Cancel pending withdrawal and refund to balance'}
                          >
                            {cancellingWithdrawId === (item.referenceId || item.id) ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span>{lang === 'bn' ? 'বাতিল' : 'Cancel'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Ledger Cards View (Visible on phone screens < sm) */}
          <div className="sm:hidden space-y-2.5">
            {ledgerItems.map((item) => {
              const isPending = item.status === 'PENDING';
              const isRejected = item.status === 'REJECTED';
              const isWithdraw = item.type === 'WITHDRAWAL';
              const isCredit =
                item.type === 'RECHARGE' ||
                item.type === 'ADMIN_ADJUSTMENT' ||
                item.type === 'TRANSFER_IN' ||
                item.type === 'HOLD_REFUND' ||
                item.type === 'BID_RELEASE';

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        isPending
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : isRejected
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {item.type}
                    </span>
                    <div className="text-right">
                      <span
                        className={`font-black text-sm ${
                          isCredit
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isWithdraw
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {isCredit ? '+' : isWithdraw ? '-' : ''}৳{' '}
                        {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>
                      Avail: <strong className="font-mono text-slate-800 dark:text-slate-200">৳{Number(item.balanceAfter).toLocaleString()}</strong>
                    </span>
                    {Number(item.holdAfter) > 0 && (
                      <span>
                        Hold: <strong className="font-mono text-amber-500">৳{Number(item.holdAfter).toLocaleString()}</strong>
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
                      {item.notes}
                    </p>
                  )}

                  {isWithdraw && isPending && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleCancelWithdrawal(item.referenceId || item.id)}
                        disabled={cancellingWithdrawId === (item.referenceId || item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800 transition disabled:opacity-50"
                      >
                        {cancellingWithdrawId === (item.referenceId || item.id) ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        <span>{lang === 'bn' ? 'উইথড্র বাতিল ও রিফান্ড' : 'Cancel & Refund'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      </div>

      {/* Recharge Modal (Spec #13, #14) */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto">
            {/* 1. Fixed Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex-shrink-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-sky-500" />
                <span>{lang === 'bn' ? 'ওয়ালেট রিচার্জ রিকোয়েস্ট' : 'Wallet Recharge Request'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRechargeModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* 2. Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
              {rechargeError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-900/50">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{rechargeError}</span>
                </div>
              )}

              {rechargeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-900/50">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{rechargeSuccess}</span>
                </div>
              )}

              <form id="recharge-form" onSubmit={handleRechargeSubmit} className="space-y-3.5 text-xs">
                {/* Method Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                      {lang === 'bn' ? '১. পেমেন্ট মেথড বেছে নিন *' : '1. Select Payment Method *'}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {rechargeMethods.length} {lang === 'bn' ? 'টি চ্যানেল' : 'channels'}
                    </span>
                  </div>

                  {rechargeMethods.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-center text-xs">
                      {lang === 'bn' ? 'কোনো পেমেন্ট মেথড সক্রিয় নেই।' : 'No active payment methods available.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-0.5 custom-scrollbar">
                      {rechargeMethods.map((m) => {
                        const isSelected = m.id === rechargeMethodId;
                        const isAuto = m.type === 'API' || m.code?.includes('API');
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setRechargeMethodId(m.id);
                              setRechargeError('');
                            }}
                            className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                              isSelected
                                ? isAuto
                                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
                                  : 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/20'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{m.name}</span>
                              {isSelected && <Check className={`w-3.5 h-3.5 flex-shrink-0 ${isAuto ? 'text-indigo-500' : 'text-sky-500'}`} />}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px]">
                              {isAuto ? (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 font-extrabold flex items-center gap-0.5 text-[9px]">
                                  <Zap className="w-2.5 h-2.5" />
                                  <span>AUTO</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium uppercase text-[9px]">
                                  {m.type}
                                </span>
                              )}
                              <span className="text-slate-400 font-mono font-semibold text-[10px]">
                                {isAuto ? 'Instant' : `${m.accountNumber.slice(0, 5)}...`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Method Details Box */}
                {selectedRechargeMethod && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {isApiGateway
                            ? (lang === 'bn' ? 'অটোমেটেড গেটওয়ে চ্যানেল:' : 'Automated Channel:')
                            : (lang === 'bn' ? 'টাকা পাঠানোর একাউন্ট নম্বর:' : 'Deposit Account Number:')}
                        </div>
                        <div className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-amber-400">
                          {selectedRechargeMethod.accountNumber}
                        </div>
                      </div>

                      {!isApiGateway ? (
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(selectedRechargeMethod.accountNumber)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-100 transition shadow-xs"
                        >
                          {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedNumber ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'নম্বর কপি' : 'Copy')}</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-extrabold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'অটো ভেরিফাইড' : 'Instant Auto'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{lang === 'bn' ? 'সর্বনিম্ন / সর্বোচ্চ ডিপোজিট:' : 'Min/Max Deposit Limit:'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ৳{Number(selectedRechargeMethod.minAmount).toLocaleString()} - ৳{Number(selectedRechargeMethod.maxAmount).toLocaleString()}
                      </span>
                    </div>

                    {selectedRechargeMethod.instructions && (
                      <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                        💡 {selectedRechargeMethod.instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs">
                      {lang === 'bn' ? '২. রিচার্জের পরিমাণ (টাকা) *' : '2. Recharge Amount (BDT) *'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[500, 1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setRechargeAmount(amt)}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-sm">৳</span>
                    <input
                      type="number"
                      min={10}
                      required
                      value={rechargeAmount}
                      onChange={(e) => {
                        setRechargeAmount(parseFloat(e.target.value) || 0);
                        setRechargeError('');
                      }}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                {/* Real-time Fee & Total Breakdown Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>{lang === 'bn' ? 'রিচার্জের মূল পরিমাণ:' : 'Recharge Amount:'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">৳{Number(rechargeAmount || 0).toLocaleString()}</span>
                  </div>

                  {isApiGateway && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium">
                      <span>{lang === 'bn' ? `গেটওয়ে ফি (${chargeType === 'PERCENTAGE' ? `${chargeValue}%` : `৳${chargeValue}`}):` : `Gateway Fee:`}</span>
                      <span className="font-bold">+৳{calculatedFee.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {lang === 'bn' ? 'সর্বমোট প্রদেয় টাকা:' : 'Total Payable:'}
                    </span>
                    <span className="font-black text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                      ৳{totalPayable.toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{lang === 'bn' ? 'ওয়ালেটে যোগ হবে:' : 'Credited to Wallet:'}</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{Number(rechargeAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Conditional Form Inputs (Only for Manual Methods) */}
                {!isApiGateway && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">
                          {lang === 'bn' ? '৩. প্রেরক নম্বর *' : '3. Sender Phone *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={senderAccount}
                          onChange={(e) => setSenderAccount(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">
                          {lang === 'bn' ? '৪. ট্রানজ্যাকশন আইডি *' : '4. TrxID *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={transactionNumber}
                          onChange={(e) => setTransactionNumber(e.target.value.toUpperCase())}
                          placeholder="e.g. 9J8B7G52"
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold uppercase text-xs text-slate-900 dark:text-amber-400"
                        />
                      </div>
                    </div>

                    {/* Payment Proof / Receipt Upload */}
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">
                        {lang === 'bn' ? '৫. পেমেন্ট স্লিপ / রসিদ আপলোড (ঐচ্ছিক)' : '5. Payment Receipt / Slip (Optional)'}
                      </label>

                      {proofUrl ? (
                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-emerald-500/40">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getImageUrl(proofUrl)}
                              alt="Payment Receipt"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-700 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{lang === 'bn' ? 'স্ক্রিনশট আপলোড সম্পন্ন' : 'Screenshot Attached'}</span>
                              </div>
                              <a
                                href={getImageUrl(proofUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-sky-500 hover:underline truncate block"
                              >
                                {lang === 'bn' ? 'ছবি দেখুন (Open)' : 'View image'}
                              </a>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setProofUrl('')}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl border-2 border-dashed text-xs cursor-pointer transition ${
                              isUploadingProof
                                ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-400 text-slate-500'
                                : 'bg-sky-50/50 hover:bg-sky-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-sky-300 dark:border-slate-700 text-sky-700 dark:text-sky-300'
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingProof}
                              onChange={handleProofFileChange}
                              className="hidden"
                            />
                            {isUploadingProof ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
                                <span className="font-semibold text-xs">
                                  {lang === 'bn' ? 'স্ক্রিনশট আপলোড হচ্ছে...' : 'Uploading Screenshot...'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-sky-500" />
                                <span className="font-bold text-xs">
                                  {lang === 'bn' ? 'রিসিপ্ট স্ক্রিনশট আপলোড করুন' : 'Upload Receipt Screenshot'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(JPG, PNG, WEBP)</span>
                              </>
                            )}
                          </label>

                          {proofUploadError && (
                            <p className="text-[11px] text-rose-500 font-medium">{proofUploadError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* 3. Fixed Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex-shrink-0 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowRechargeModal(false)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition text-xs"
              >
                {t('cancel')}
              </button>

              {isApiGateway ? (
                isBkashApi ? (
                  <button
                    type="button"
                    disabled={isInitiatingGateway || Number(rechargeAmount) <= 0}
                    onClick={() => handleInitiateGateway('BKASH')}
                    className="w-2/3 py-2.5 rounded-xl bg-[#D82A6B] hover:bg-[#c2215d] text-white font-extrabold text-xs transition shadow-md shadow-[#D82A6B]/25 flex items-center justify-center gap-1.5"
                  >
                    {isInitiatingGateway ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                    <span>{lang === 'bn' ? `bKash দিয়ে পে করুন (৳${totalPayable.toLocaleString()})` : `Pay with bKash (৳${totalPayable.toLocaleString()})`}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isInitiatingGateway || Number(rechargeAmount) <= 0}
                    onClick={() => handleInitiateGateway('SSLCOMMERZ')}
                    className="w-2/3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition shadow-md shadow-sky-600/25 flex items-center justify-center gap-1.5"
                  >
                    {isInitiatingGateway ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                    <span>{lang === 'bn' ? `SSLCommerz দিয়ে পে করুন (৳${totalPayable.toLocaleString()})` : `Pay with SSLCommerz (৳${totalPayable.toLocaleString()})`}</span>
                  </button>
                )
              ) : (
                <button
                  type="submit"
                  form="recharge-form"
                  disabled={Number(rechargeAmount) <= 0}
                  className="w-2/3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ম্যানুয়াল রিকোয়েস্ট পাঠান' : 'Submit Recharge'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal (bKash, Nagad, Rocket, Bank Transfer) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'উইথড্র রিকোয়েস্ট (টাকা উত্তোলন)' : 'Withdrawal Request'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'bn' ? 'bKash, Nagad, Rocket ও ব্যাংক ট্রান্সফার সাপোর্টেড' : 'Supports bKash, Nagad, Rocket & Bank Transfer'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Rule 2 Notice / Balance Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    {lang === 'bn' ? 'উত্তোলনযোগ্য ব্যালেন্স:' : 'Withdrawable Balance:'}
                  </span>
                  <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                    ৳ {available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {lang === 'bn'
                    ? 'শুধু Available ব্যালেন্স তোলা যাবে। অর্ডার/বিড প্রক্রিয়ার Hold ব্যালেন্স তোলা যাবে না।'
                    : 'Only Available balance can be withdrawn. Hold balance is strictly locked for escrow/bids.'}
                </p>
              </div>
            </div>

            {withdrawError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              {/* Saved Accounts Quick Selection */}
              {paymentAccounts.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent border border-sky-500/25 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-sky-500" />
                      <span>{lang === 'bn' ? 'সেভ করা অ্যাকাউন্ট থেকে ১-ক্লিক পূরণ' : '1-Click Fill from Saved Accounts'}</span>
                    </span>
                    <Link
                      href="/dashboard/settings?tab=payouts"
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>{lang === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Manage'}</span>
                      <span>→</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {paymentAccounts.map((acc) => {
                      const isSelected = selectedSavedAccountId === acc.id;
                      const isBk = acc.methodType === 'BKASH';
                      const isNg = acc.methodType === 'NAGAD';
                      const isRk = acc.methodType === 'ROCKET';
                      const isBank = acc.methodType === 'BANK';

                      let badgeTheme = isBk
                        ? 'bg-[#E2136E]/15 text-[#E2136E]'
                        : isNg
                        ? 'bg-[#F7941D]/15 text-[#F7941D]'
                        : isRk
                        ? 'bg-[#8C3494]/15 text-[#8C3494]'
                        : isBank
                        ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-200 text-slate-700';

                      return (
                        <button
                          type="button"
                          key={acc.id}
                          onClick={() => handleSelectSavedAccount(acc)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-sky-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-sky-500/20'
                              : 'border-slate-200 dark:border-slate-700/80 bg-white/80 dark:bg-slate-850 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5 truncate mr-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.2 rounded-full font-black text-[10px] ${badgeTheme}`}>
                                {acc.methodType}
                              </span>
                              {acc.isDefault && (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate">
                              {acc.accountNumber}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {acc.accountName} {acc.bankName ? `(${acc.bankName})` : ''}
                            </div>
                          </div>

                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition ${
                              isSelected
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? (lang === 'bn' ? '✓ যুক্ত' : '✓ Added') : (lang === 'bn' ? 'ব্যবহার করুন' : 'Use')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payout Method Selection Grid */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                  {lang === 'bn' ? 'উইথড্র মেথড সিলেক্ট করুন *' : 'Select Payout Method *'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {withdrawalMethods.map((w) => {
                    const isSelected = w.id === withdrawMethodId;
                    const isBk = w.code?.includes('BKASH') || w.name?.toLowerCase().includes('bkash');
                    const isNg = w.code?.includes('NAGAD') || w.name?.toLowerCase().includes('nagad');
                    const isRk = w.code?.includes('ROCKET') || w.name?.toLowerCase().includes('rocket');
                    const isBkOrBank = w.code?.includes('BANK') || w.name?.toLowerCase().includes('bank');

                    let brandBorder = isSelected
                      ? isBk
                        ? 'border-[#E2136E] bg-[#E2136E]/10 ring-2 ring-[#E2136E]/20'
                        : isNg
                        ? 'border-[#F7941D] bg-[#F7941D]/10 ring-2 ring-[#F7941D]/20'
                        : isRk
                        ? 'border-[#8C3494] bg-[#8C3494]/10 ring-2 ring-[#8C3494]/20'
                        : 'border-blue-600 bg-blue-500/10 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/70 dark:bg-slate-800/60';

                    let badgeColor = isBk
                      ? 'text-[#E2136E] bg-[#E2136E]/15'
                      : isNg
                      ? 'text-[#F7941D] bg-[#F7941D]/15'
                      : isRk
                      ? 'text-[#8C3494] bg-[#8C3494]/15'
                      : 'text-blue-600 dark:text-blue-400 bg-blue-500/15';

                    return (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => {
                          setWithdrawMethodId(w.id);
                          setWithdrawError('');
                        }}
                        className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between gap-2 ${brandBorder}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            {isBkOrBank ? (
                              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            ) : (
                              <Smartphone className="w-4 h-4 shrink-0 text-slate-700 dark:text-slate-300" />
                            )}
                            <span className="truncate">
                              {isBk ? 'bKash' : isNg ? 'Nagad' : isRk ? 'Rocket' : isBkOrBank ? 'Bank' : w.name}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                            {isCommissionActive && commValue > 0
                              ? commRateType === 'PERCENTAGE'
                                ? `${commValue}% ${lang === 'bn' ? 'ফি' : 'fee'}`
                                : `৳${commValue} ${lang === 'bn' ? 'ফি' : 'fee'}`
                              : isCommissionActive && commValue === 0
                              ? lang === 'bn' ? 'ফ্রি' : 'Free'
                              : Number(w.feePercentage) > 0
                              ? `${w.feePercentage}% fee`
                              : Number(w.feeFlat) > 0
                              ? `৳${w.feeFlat} fee`
                              : lang === 'bn' ? 'ফ্রি' : 'Free'}
                          </span>
                          <p className="text-[10px] text-slate-400">
                            ৳{Number(w.minAmount)} - ৳{Number(w.maxAmount).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">
                    {lang === 'bn' ? 'উইথড্র অ্যামাউন্ট (টাকা) *' : 'Withdrawal Amount (BDT) *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedWithdrawMethod) {
                        const maxAllowed = Math.min(available, Number(selectedWithdrawMethod.maxAmount || available));
                        setWithdrawAmount(Math.max(0, maxAllowed));
                      }
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400"
                  >
                    {lang === 'bn' ? 'সর্বোচ্চ তুলুন (Max)' : 'Use Max'}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
                  <input
                    type="number"
                    min={selectedWithdrawMethod ? Number(selectedWithdrawMethod.minAmount) : 50}
                    max={selectedWithdrawMethod ? Math.min(available, Number(selectedWithdrawMethod.maxAmount)) : available}
                    required
                    value={withdrawAmount || ''}
                    onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                    placeholder="500"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Conditional Inputs: Bank vs Mobile */}
              {isBankWithdraw ? (
                /* Bank Transfer Fields */
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40 space-y-3.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs pb-1 border-b border-blue-200/60 dark:border-blue-800/50">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{lang === 'bn' ? 'ব্যাংক ট্রান্সফার তথ্য (Bank Transfer Details)' : 'Bank Transfer Details'}</span>
                  </div>

                  {/* Bank Name Dropdown */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      {lang === 'bn' ? 'ব্যাংকের নাম (Bank Name) *' : 'Bank Name *'}
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">{lang === 'bn' ? '-- ব্যাংক নির্বাচন করুন --' : '-- Select Bank --'}</option>
                      {BANGLADESH_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b === 'OTHER' ? (lang === 'bn' ? 'অন্যান্য ব্যাংক (Other Bank)' : 'Other Bank (Specify)') : b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Bank Name if OTHER */}
                  {bankName === 'OTHER' && (
                    <div className="animate-in fade-in">
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        {lang === 'bn' ? 'ব্যাংকের নাম লিখুন *' : 'Enter Bank Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        placeholder="e.g. Bangladesh Commerce Bank Ltd"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      {lang === 'bn' ? 'অ্যাকাউন্টধারীর নাম (Account Holder Name) *' : 'Account Holder Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder={lang === 'bn' ? 'ব্যাংক একাউন্টে থাকা হুবহু নাম' : 'Exact name as in bank account'}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      {lang === 'bn' ? 'ব্যাংক অ্যাকাউন্ট নম্বর (Account Number) *' : 'Bank Account Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 20501234567890"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Bank Routing Number & Branch */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        {lang === 'bn' ? 'রাউটিং নম্বর (Routing Number) *' : 'Routing Number (9 Digits) *'}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={9}
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 090271234"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {lang === 'bn' ? 'চেকবই বা ব্যাংক অ্যাপে থাকা ৯ ডিজিটের কোড' : '9-digit code on chequebook or app'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        {lang === 'bn' ? 'শাখার নাম (Branch Name)' : 'Branch Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="e.g. Agrabad Branch"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile Banking Fields (bKash, Nagad, Rocket) */
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">
                      {lang === 'bn' ? 'অ্যাকাউন্টের ধরন (Account Type)' : 'Account Type'}
                    </label>
                    <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-700 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setWithdrawAccountType('PERSONAL')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          withdrawAccountType === 'PERSONAL'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {lang === 'bn' ? 'পার্সোনাল' : 'Personal'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawAccountType('AGENT')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          withdrawAccountType === 'AGENT'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {lang === 'bn' ? 'এজেন্ট' : 'Agent'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      {lang === 'bn' ? 'মোবাইল একাউন্ট নম্বর (১১ ডিজিট) *' : 'Mobile Account Number (11 digits) *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        🇧🇩 +88
                      </span>
                      <input
                        type="tel"
                        maxLength={11}
                        required
                        value={destinationAccount}
                        onChange={(e) => setDestinationAccount(e.target.value.replace(/\D/g, ''))}
                        placeholder="01712345678"
                        className="w-full pl-16 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'bn'
                        ? 'সঠিক নম্বর দিন, টাকা সরাসরি এই নম্বরে ক্যাশ-আউট/সেন্ট মানি হবে'
                        : 'Ensure accurate phone number; payout will be sent directly here'}
                    </p>
                  </div>
                </div>
              )}

              {/* Optional Password Field */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/70 dark:border-slate-800 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lang === 'bn' ? 'অ্যাকাউন্টের পাসওয়ার্ড (ঐচ্ছিক)' : 'Account Password (Optional)'}</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showWithdrawPassword ? 'text' : 'password'}
                    value={withdrawPassword}
                    onChange={(e) => {
                      setWithdrawPassword(e.target.value);
                      if (withdrawError) setWithdrawError('');
                    }}
                    placeholder={lang === 'bn' ? 'পাসওয়ার্ড দিন (যদি চান)' : 'Enter password (optional)'}
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWithdrawPassword(!showWithdrawPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showWithdrawPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Payout Calculation Breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{lang === 'bn' ? 'উইথড্র রিকোয়েস্ট অ্যামাউন্ট:' : 'Withdrawal Amount:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">৳ {Number(withdrawAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-start text-slate-600 dark:text-slate-300">
                  <div>
                    <span>{lang === 'bn' ? 'উইথড্র ফি / কমিশন:' : 'Withdrawal Fee / Commission:'}</span>
                    {isCommissionActive && commValue > 0 && (
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {commRateType === 'PERCENTAGE'
                          ? `${commValue}%${commMinFee > 0 ? ` (${lang === 'bn' ? 'সর্বনিম্ন' : 'min'} ৳${commMinFee})` : ''}${commMaxFee > 0 ? ` (${lang === 'bn' ? 'সর্বোচ্চ' : 'max'} ৳${commMaxFee})` : ''}`
                          : `৳${commValue} ${lang === 'bn' ? 'ফ্ল্যাট' : 'flat'}`}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-rose-500">- ৳ {withdrawFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-bold">
                  <span className="text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'আপনি পাবেন (Net Payout):' : 'You Will Receive:'}
                  </span>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-black">
                    ৳ {netWithdrawAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={isSubmittingWithdraw}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={available < 50 || isSubmittingWithdraw || withdrawAmount > available}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'bn' ? 'সাবমিট হচ্ছে...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'উইথড্র রিকোয়েস্ট নিশ্চিত করুন' : 'Confirm Withdrawal'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WITHDRAWAL OTP VERIFICATION MODAL                                         */}
      {/* ========================================================================= */}
      {showWithdrawOtpModal && pendingWithdrawPayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl space-y-0 my-6">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-wide">
                    {lang === 'bn' ? 'উইথড্র সিকিউরিটি ওটিপি' : 'Withdrawal OTP Security'}
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {lang === 'bn' ? 'টাকা উত্তোলন নিশ্চিত করতে ওটিপি কোড দিন' : 'Enter OTP to verify payout request'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawOtpModal(false);
                  setPendingWithdrawPayload(null);
                  setWithdrawError('');
                }}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmWithdrawWithOtp} className="p-6 space-y-4 text-xs">
              {/* Amount Summary */}
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold block">
                    {lang === 'bn' ? 'উত্তোলনের পরিমাণ' : 'Withdrawal Amount'}
                  </span>
                  <span className="text-base font-black text-purple-900 dark:text-purple-100">
                    ৳ {Number(pendingWithdrawPayload.amount).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">গন্তব্য একাউন্ট</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {pendingWithdrawPayload.destinationAccount}
                  </span>
                </div>
              </div>

              {/* Dev Simulation Code */}
              {withdrawSimulatedCode && (
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between font-mono">
                  <span>টেস্ট ওটিপি: <strong>{withdrawSimulatedCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setWithdrawOtpCode(withdrawSimulatedCode)}
                    className="px-2 py-0.5 bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 rounded text-[10px]"
                  >
                    অটোভিল
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {withdrawError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-1.5 text-center">
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                  {lang === 'bn' ? '৬-সংখ্যার ওটিপি (OTP) কোড দিন *' : 'Enter 6-digit OTP code *'}
                </label>
                <input
                  type="text"
                  maxLength={8}
                  required
                  autoFocus
                  value={withdrawOtpCode}
                  onChange={(e) => setWithdrawOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="739201"
                  className="w-full text-center text-2xl font-black tracking-widest py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  আপনার একাউন্টে নিবন্ধিত ফোন নম্বরে ওটিপি কোড পাঠানো হয়েছে।
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawOtpModal(false);
                    setPendingWithdrawPayload(null);
                  }}
                  disabled={isSubmittingWithdraw}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || !withdrawOtpCode.trim()}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>যাচাই হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>উইথড্র নিশ্চিত করুন</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resend Cooldown */}
              <div className="text-center pt-1">
                {withdrawOtpCooldown > 0 ? (
                  <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন: {withdrawOtpCooldown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendWithdrawOtp}
                    disabled={isSendingWithdrawOtp || isSubmittingWithdraw}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSendingWithdrawOtp ? 'animate-spin' : ''}`} />
                    <span>{isSendingWithdrawOtp ? 'পাঠানো হচ্ছে...' : 'পুনরায় ওটিপি কোড পাঠান'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FIRST-TIME / UNSAVED ACCOUNT WITHDRAWAL PASSWORD VERIFICATION MODAL       */}
      {/* ========================================================================= */}
      {showWithdrawPasswordModal && pendingWithdrawPayload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl space-y-0 my-6">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base tracking-wide">
                    {lang === 'bn' ? 'নিরাপত্তার জন্য আপনার পাসওয়ার্ড দিন' : 'Enter Password for Security'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    {lang === 'bn' ? 'উইথড্র নিশ্চিত ও অ্যাকাউন্ট সুরক্ষিতভাবে সেভ করতে' : 'Confirm withdrawal and securely save account'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawPasswordModal(false);
                  setPendingWithdrawPayload(null);
                  setWithdrawPassword('');
                  setWithdrawPasswordError('');
                }}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmWithdrawWithPassword} className="p-6 space-y-4 text-xs">
              {/* Info Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[11px] leading-relaxed">
                  {lang === 'bn'
                    ? 'যেহেতু আপনার কোনো সেভ করা উইথড্র অ্যাকাউন্ট নেই, পাসওয়ার্ড নিশ্চিত করলে উইথড্র সম্পন্ন হবে এবং এই নম্বরটি আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে সেভ হয়ে যাবে।'
                    : 'Since you do not have a saved withdrawal account, confirming your password will execute the withdrawal and automatically save this account for future 1-click payouts.'}
                </p>
              </div>

              {/* Amount & Destination Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">
                    {lang === 'bn' ? 'উত্তোলনের পরিমাণ' : 'Withdrawal Amount'}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    ৳ {Number(pendingWithdrawPayload.amount).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {lang === 'bn' ? 'গন্তব্য অ্যাকাউন্ট' : 'Destination'}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {pendingWithdrawPayload.destinationAccount}
                  </span>
                </div>
              </div>

              {/* Error Alert */}
              {withdrawPasswordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{withdrawPasswordError}</span>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                  {lang === 'bn' ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড *' : 'Your Account Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showWithdrawPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={withdrawPassword}
                    onChange={(e) => {
                      setWithdrawPassword(e.target.value);
                      if (withdrawPasswordError) setWithdrawPasswordError('');
                    }}
                    placeholder={lang === 'bn' ? 'পাসওয়ার্ড দিন' : 'Enter account password'}
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWithdrawPassword(!showWithdrawPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showWithdrawPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawPasswordModal(false);
                    setPendingWithdrawPayload(null);
                    setWithdrawPassword('');
                    setWithdrawPasswordError('');
                  }}
                  disabled={isSubmittingWithdraw}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || !withdrawPassword.trim()}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'উইথড্র নিশ্চিত করুন' : 'Confirm Withdrawal'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GATEWAY CHECKOUT MODAL (bKash & SSLCommerz Execution)                    */}
      {/* ========================================================================= */}
      {showGatewayCheckoutModal && gatewaySession && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl space-y-0 my-6">
            {/* Branded Header */}
            <div
              className={`p-5 text-white flex items-center justify-between ${
                gatewaySession.gateway === 'BKASH'
                  ? 'bg-gradient-to-r from-[#D82A6B] to-[#b81855]'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  {gatewaySession.gateway === 'BKASH' ? (
                    <Smartphone className="w-6 h-6" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base tracking-wide">
                    {gatewaySession.gateway === 'BKASH' ? 'bKash PGW Checkout' : 'SSLCommerz Gateway'}
                  </h3>
                  <p className="text-xs text-white/80 font-medium">
                    Merchant: SafnexBD Platform
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGatewayCheckoutModal(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Environment Mode Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Payment Verification
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    gatewaySession.isLive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {gatewaySession.isLive ? 'LIVE PRODUCTION' : 'SANDBOX SIMULATOR'}
                </span>
              </div>

              {/* Payment Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Session / Invoice ID:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {gatewaySession.paymentId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>{lang === 'bn' ? 'রিচার্জের পরিমাণ:' : 'Recharge Amount:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ৳{Number(gatewaySession.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium">
                  <span>{lang === 'bn' ? 'গেটওয়ে সার্ভিস ফি:' : 'Gateway Fee:'}</span>
                  <span className="font-bold">+৳{Number(gatewaySession.charge).toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {lang === 'bn' ? 'মোট প্রদেয়:' : 'Total Payable:'}
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                    ৳{Number(gatewaySession.totalPayable).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Instructions Notice */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-xs text-sky-900 dark:text-sky-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sky-800 dark:text-sky-300">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  <span>
                    {lang === 'bn' ? 'ইনস্ট্যান্ট অটো ব্যালেন্স যোগ' : 'Instant Balance Credited'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'bn'
                    ? 'নিচে "পেমেন্ট নিশ্চিত করুন" বাটনে ক্লিক করলেই আপনার ট্রানজ্যাকশন অনুমোদিত হবে এবং তাৎক্ষণিকভাবে আপনার ওয়ালেটে ব্যালেন্স জমা হয়ে যাবে।'
                    : 'Click "Confirm Payment" below to complete checkout. The amount will be instantly credited to your available balance.'}
                </p>
              </div>

              {/* Optional Custom TrxID for Testing */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-xs">
                  {lang === 'bn' ? 'কাস্টম TrxID (ঐচ্ছিক - টেস্ট করার জন্য):' : 'Custom TrxID (Optional):'}
                </label>
                <input
                  type="text"
                  value={checkoutTrxId}
                  onChange={(e) => setCheckoutTrxId(e.target.value.toUpperCase())}
                  placeholder={`TRX${Date.now().toString().slice(-6)}`}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs uppercase"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGatewayCheckoutModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition text-xs"
                >
                  {lang === 'bn' ? 'পেমেন্ট বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isExecutingGateway}
                  onClick={handleExecuteGateway}
                  className={`flex-1 py-3 rounded-2xl text-white font-extrabold text-xs transition shadow-lg flex items-center justify-center gap-2 ${
                    gatewaySession.gateway === 'BKASH'
                      ? 'bg-[#D82A6B] hover:bg-[#c2215d] shadow-[#D82A6B]/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {isExecutingGateway ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>
                    {lang === 'bn'
                      ? `পেমেন্ট নিশ্চিত করুন (৳${Number(gatewaySession.totalPayable).toLocaleString()})`
                      : `Confirm & Pay (৳${Number(gatewaySession.totalPayable).toLocaleString()})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading wallet...</div>}>
      <WalletContent />
    </Suspense>
  );
}

