'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { TaskHandoffModal } from '@/components/operations/TaskHandoffModal';
import {
  ArrowDownCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Image as ImageIcon,
  Check,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Sliders,
  Smartphone,
  Building2,
  Cpu,
  Eye,
  EyeOff,
  Copy,
  Info,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Upload,
  X,
  Shuffle,
  Unlock,
  UserCheck,
  Lock,
} from 'lucide-react';
import { getImageUrl, compressImage } from '@/lib/imageUtils';

interface RechargeRequest {
  id: string;
  userId: string;
  amount: string;
  approvedAmount?: string | null;
  senderAccount: string;
  senderNumber?: string;
  transactionNumber: string;
  transactionId?: string;
  proofUrl?: string | null;
  proofImageUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  assignedToId?: string | null;
  assignedAt?: string | null;
  lockedUntil?: string | null;
  assignedTo?: {
    id: string;
    uniqueUserId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  user: {
    id: string;
    uniqueUserId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  method: {
    id?: string;
    name: string;
    accountNumber: string;
    type: string;
  };
}

interface RechargeMethodItem {
  id: string;
  name: string;
  code: string;
  type: 'PERSONAL' | 'MERCHANT' | 'BANK' | 'API';
  accountNumber: string;
  accountName?: string | null;
  bankDetails?: string | null;
  instructions?: string | null;
  minAmount: string | number;
  maxAmount: string | number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  _count?: {
    requests: number;
  };
}

const unwrap = (res: any) => {
  if (res && res.data !== undefined) return res.data;
  return res;
};

export default function AdminRechargesPage() {
  const { lang } = useLanguage();
  const { user, isSuperAdmin } = useAuthStore();

  // Tab State: 'requests' | 'settings'
  const [activeTab, setActiveTab] = useState<'requests' | 'settings'>('requests');

  // Workload & Operations
  const [claimingTask, setClaimingTask] = useState(false);
  const [handoffTask, setHandoffTask] = useState<RechargeRequest | null>(null);

  // Recharge Requests State
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Requests Review
  const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Lightbox Image Preview State
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    trxId?: string;
    userName?: string;
    amount?: string;
  } | null>(null);
  const [isUploadingAdminProof, setIsUploadingAdminProof] = useState(false);

  // Recharge Methods State
  const [methods, setMethods] = useState<RechargeMethodItem[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [editingMethod, setEditingMethod] = useState<RechargeMethodItem | null>(null);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [deletingMethod, setDeletingMethod] = useState<RechargeMethodItem | null>(null);
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [isDeletingMethod, setIsDeletingMethod] = useState(false);

  // Method Form State
  const [methodFormData, setMethodFormData] = useState({
    name: '',
    code: '',
    type: 'PERSONAL' as 'PERSONAL' | 'MERCHANT' | 'BANK' | 'API',
    accountNumber: '',
    accountName: '',
    bankDetails: '',
    instructions: '',
    minAmount: 10,
    maxAmount: 500000,
    isActive: true,
    sortOrder: 0,
  });

  // Global Toast / Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Automated Gateway API State
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [gatewayActiveTab, setGatewayActiveTab] = useState<'bkash' | 'sslcommerz'>('bkash');
  const [loadingGateway, setLoadingGateway] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [showSecretKeys, setShowSecretKeys] = useState<{ [key: string]: boolean }>({});

  const toggleShowKey = (key: string) => {
    setShowSecretKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [gatewayData, setGatewayData] = useState({
    bkash: {
      isEnabled: true,
      isLive: false,
      appKey: '',
      appSecret: '',
      username: '',
      password: '',
      chargeType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
      chargeValue: 1.5,
      minAmount: 10,
      maxAmount: 50000,
      instructions: 'bKash পেমেন্ট গেটওয়ের মাধ্যমে ইনস্ট্যান্ট অটো রিচার্জ সম্পন্ন হবে।',
    },
    sslcommerz: {
      isEnabled: true,
      isLive: false,
      storeId: '',
      storePassword: '',
      chargeType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
      chargeValue: 2.5,
      minAmount: 50,
      maxAmount: 200000,
      instructions: 'ভিসা, মাস্টারকার্ড, বিকাশ, নগদ সহ যেকোনো কার্ড ও মোবাইল ব্যাংকিং দিয়ে অটো রিচার্জ।',
    },
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleClaimNext = async () => {
    try {
      setClaimingTask(true);
      const res = await api.post('/operations/claim', { taskType: 'RECHARGE' });
      if (res.data?.success && res.data?.data) {
        showToast(
          lang === 'bn'
            ? `কাজটি সফলভাবে বরাদ্দ হয়েছে! পরিমাণ: ৳${parseFloat(res.data.data.amount).toLocaleString()}`
            : `Task claimed successfully! Amount: ৳${parseFloat(res.data.data.amount).toLocaleString()}`
        );
        fetchRecharges();
      }
    } catch (err: any) {
      showToast(
        err.response?.data?.message || (lang === 'bn' ? 'কোনো অপেক্ষমাণ রিচার্জ কাজ পাওয়া যায়নি বা সীমা অতিক্রম হয়েছে।' : 'No tasks available or limit reached.'),
        'error'
      );
    } finally {
      setClaimingTask(false);
    }
  };

  const handleReleaseTask = async (taskId: string) => {
    try {
      const res = await api.post('/operations/release', { taskType: 'RECHARGE', taskId });
      if (res.data?.success) {
        showToast(lang === 'bn' ? 'কাজটি সফলভাবে কিউতে ফেরত দেওয়া হয়েছে।' : 'Task released back to queue.');
        fetchRecharges();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to release task', 'error');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // ---------------- Fetch Recharge Requests ----------------
  const fetchRecharges = async () => {
    setLoadingRequests(true);
    try {
      const queryParam = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res: any = await api.get(`/wallet/admin/recharges${queryParam}`);
      const data = unwrap(res);

      if (data?.items && Array.isArray(data.items)) {
        setRecharges(data.items);
      } else if (Array.isArray(data)) {
        setRecharges(data);
      } else if (res?.items && Array.isArray(res.items)) {
        setRecharges(res.items);
      } else if (Array.isArray(res)) {
        setRecharges(res);
      } else {
        setRecharges([]);
      }
    } catch (err: any) {
      console.error('Failed to load recharge requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // ---------------- Fetch Payment Methods ----------------
  const fetchMethods = async () => {
    setLoadingMethods(true);
    try {
      const res: any = await api.get('/wallet/admin/recharge-methods');
      const data = unwrap(res);
      setMethods(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load payment methods:', err);
    } finally {
      setLoadingMethods(false);
    }
  };

  // ---------------- Fetch Gateway API Settings ----------------
  const fetchGatewaySettings = async () => {
    setLoadingGateway(true);
    try {
      const res: any = await api.get('/wallet/admin/gateway-settings');
      const data = unwrap(res);
      if (data?.bkash && data?.sslcommerz) {
        setGatewayData({
          bkash: {
            ...data.bkash,
            chargeValue: Number(data.bkash.chargeValue ?? 1.5),
            minAmount: Number(data.bkash.minAmount ?? 10),
            maxAmount: Number(data.bkash.maxAmount ?? 50000),
          },
          sslcommerz: {
            ...data.sslcommerz,
            chargeValue: Number(data.sslcommerz.chargeValue ?? 2.5),
            minAmount: Number(data.sslcommerz.minAmount ?? 50),
            maxAmount: Number(data.sslcommerz.maxAmount ?? 200000),
          },
        });
      }
    } catch (err: any) {
      console.error('Failed to load gateway settings:', err);
    } finally {
      setLoadingGateway(false);
    }
  };

  const handleSaveGatewaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    try {
      await api.patch('/wallet/admin/gateway-settings', gatewayData);
      showToast(lang === 'bn' ? 'গেটওয়ে এপিআই সেটিংস ও চার্জ সফলভাবে সংরক্ষণ করা হয়েছে!' : 'Gateway API settings & charges saved successfully!');
      setIsGatewayModalOpen(false);
      fetchGatewaySettings();
      fetchMethods(); // Syncs method list as well!
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to save gateway settings', 'error');
    } finally {
      setIsSavingGateway(false);
    }
  };

  useEffect(() => {
    fetchRecharges();
    fetchMethods();
    fetchGatewaySettings();
  }, [statusFilter]);

  // ---------------- Request Review Handlers ----------------
  const handleOpenReviewModal = (req: RechargeRequest, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req);
    setActionType(type);
    setApprovedAmount(parseFloat(req.amount).toString());
    setAdminNotes('');
  };

  const handleCloseReviewModal = () => {
    setSelectedRequest(null);
    setActionType(null);
  };

  const handleAdminUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRequest) return;
    if (!file.type.startsWith('image/')) {
      showToast(lang === 'bn' ? 'শুধুমাত্র ছবি (JPG, PNG) আপলোড করুন' : 'Only image files allowed', 'error');
      return;
    }
    setIsUploadingAdminProof(true);
    try {
      const { base64Data, fileName: cleanFileName } = await compressImage(file, 1200, 1200, 0.85);
      const res: any = await api.post('/uploads', {
        base64Data,
        fileName: cleanFileName,
        folder: 'recharges',
      });
      const uploadedUrl = res?.fileUrl || res?.data?.fileUrl || res?.url;
      if (uploadedUrl) {
        setSelectedRequest({
          ...selectedRequest,
          proofUrl: uploadedUrl,
        });
        showToast(lang === 'bn' ? 'প্রুফ স্লিপ আপলোড সম্পন্ন!' : 'Proof slip uploaded!');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploadingAdminProof(false);
      e.target.value = '';
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !actionType) return;
    setIsSubmittingReview(true);

    try {
      const payload: any = {
        action: actionType,
        adminNotes: adminNotes.trim() || undefined,
        proofUrl: selectedRequest.proofUrl || undefined,
      };

      if (actionType === 'APPROVE') {
        const amt = parseFloat(approvedAmount);
        if (isNaN(amt) || amt <= 0) {
          showToast(lang === 'bn' ? 'সঠিক অনুমোদিত পরিমাণ লিখুন' : 'Enter a valid approved amount', 'error');
          setIsSubmittingReview(false);
          return;
        }
        payload.approvedAmount = amt;
      }

      const res = await api.patch(`/wallet/admin/recharge/${selectedRequest.id}/review`, payload);
      if (res) {
        showToast(
          actionType === 'APPROVE'
            ? (lang === 'bn' ? 'রিচার্জ সফলভাবে অনুমোদিত হয়েছে!' : 'Recharge approved successfully!')
            : (lang === 'bn' ? 'রিচার্জ বাতিল করা হয়েছে।' : 'Recharge rejected successfully.')
        );
        handleCloseReviewModal();
        fetchRecharges();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || (lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Action failed'), 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // ---------------- Method Management Handlers ----------------
  const handleOpenAddMethod = () => {
    setEditingMethod(null);
    setMethodFormData({
      name: '',
      code: '',
      type: 'PERSONAL',
      accountNumber: '',
      accountName: 'SafnexBD Deposit',
      bankDetails: '',
      instructions: 'Send Money করুন, রেফারেন্সে আপনার ইউজারনেম লিখুন এবং নিচে TrxID দিন।',
      minAmount: 50,
      maxAmount: 25000,
      isActive: true,
      sortOrder: methods.length + 1,
    });
    setIsMethodModalOpen(true);
  };

  const handleOpenEditMethod = (method: RechargeMethodItem) => {
    setEditingMethod(method);
    setMethodFormData({
      name: method.name,
      code: method.code,
      type: method.type,
      accountNumber: method.accountNumber,
      accountName: method.accountName || '',
      bankDetails: method.bankDetails || '',
      instructions: method.instructions || '',
      minAmount: Number(method.minAmount) || 10,
      maxAmount: Number(method.maxAmount) || 500000,
      isActive: method.isActive,
      sortOrder: method.sortOrder || 0,
    });
    setIsMethodModalOpen(true);
  };

  // Apply Quick Template Preset
  const handleApplyPreset = (presetKey: string) => {
    if (presetKey === 'bkash_personal') {
      setMethodFormData((prev) => ({
        ...prev,
        name: 'bKash Personal (বিকাশ পার্সোনাল)',
        code: `BKASH_PERSONAL_${Date.now().toString().slice(-4)}`,
        type: 'PERSONAL',
        instructions: 'বিকাশ অ্যাপ থেকে Send Money করুন। ক্যাশইন করবেন না। রেফারেন্সে আপনার ইউজার আইডি দিন। TrxID সংরক্ষণ করে নিচে লিখুন।',
        minAmount: 50,
        maxAmount: 25000,
      }));
    } else if (presetKey === 'bkash_merchant') {
      setMethodFormData((prev) => ({
        ...prev,
        name: 'bKash Merchant (বিকাশ মার্চেন্ট)',
        code: `BKASH_MERCHANT_${Date.now().toString().slice(-4)}`,
        type: 'MERCHANT',
        instructions: 'বিকাশ অ্যাপের Make Payment অপশন ব্যবহার করুন। কাউন্টার নম্বর ১ দিন। পেমেন্ট সম্পন্ন হলে TrxID সাবমিট করুন।',
        minAmount: 100,
        maxAmount: 100000,
      }));
    } else if (presetKey === 'nagad_personal') {
      setMethodFormData((prev) => ({
        ...prev,
        name: 'Nagad Personal (নগদ পার্সোনাল)',
        code: `NAGAD_PERSONAL_${Date.now().toString().slice(-4)}`,
        type: 'PERSONAL',
        instructions: 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন। রেফারেন্সে ইউজার আইডি দিন এবং TrxID ও নম্বর নিচে লিখুন।',
        minAmount: 50,
        maxAmount: 25000,
      }));
    } else if (presetKey === 'rocket_personal') {
      setMethodFormData((prev) => ({
        ...prev,
        name: 'Rocket Personal (রকেট পার্সোনাল)',
        code: `ROCKET_PERSONAL_${Date.now().toString().slice(-4)}`,
        type: 'PERSONAL',
        instructions: 'রকেট অ্যাপ বা *322# ডায়াল করে Send Money করুন। ১২ ডিজিটের রকেট নম্বর দিয়ে পেমেন্ট করে TrxID দিন।',
        minAmount: 50,
        maxAmount: 25000,
      }));
    } else if (presetKey === 'bank_transfer') {
      setMethodFormData((prev) => ({
        ...prev,
        name: 'Bank Transfer (ব্যাংক ট্রান্সফার)',
        code: `BANK_ACC_${Date.now().toString().slice(-4)}`,
        type: 'BANK',
        bankDetails: 'Bank: Islami Bank Bangladesh PLC | Branch: Principal Branch | Routing: 125272345',
        instructions: 'যেকোনো ব্যাংক অ্যাপ (Cellfin, CityTouch, iRecharge) বা ব্রাঞ্চ থেকে NPSB/BEFTN এর মাধ্যমে জমা দিয়ে জমা রশিদ বা স্ক্রিনশট আপলোড করুন।',
        minAmount: 500,
        maxAmount: 500000,
      }));
    } else if (presetKey === 'ssl_commerz') {
      setMethodFormData((prev) => ({
        ...prev,
        name: 'SSLCommerz Automated Gateway',
        code: `SSLCOMMERZ_API_${Date.now().toString().slice(-4)}`,
        type: 'API',
        instructions: 'অটোমেটেড গেটওয়ে দিয়ে ভিসা, মাস্টারকার্ড ও মোবাইল ব্যাংকিং এর মাধ্যমে ইনস্ট্যান্ট ব্যালেন্স যোগ হবে।',
        minAmount: 100,
        maxAmount: 200000,
      }));
    }
  };

  // Save Method (Create or Update)
  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMethod(true);

    try {
      if (!methodFormData.name.trim() || !methodFormData.code.trim() || !methodFormData.accountNumber.trim()) {
        showToast(lang === 'bn' ? 'নাম, কোড এবং অ্যাকাউন্ট নম্বর আবশ্যক' : 'Name, code, and account number are required', 'error');
        setIsSavingMethod(false);
        return;
      }

      if (editingMethod) {
        await api.patch(`/wallet/admin/recharge-methods/${editingMethod.id}`, methodFormData);
        showToast(lang === 'bn' ? 'পেমেন্ট মেথড সফলভাবে আপডেট হয়েছে!' : 'Payment method updated successfully!');
      } else {
        await api.post('/wallet/admin/recharge-methods', methodFormData);
        showToast(lang === 'bn' ? 'নতুন পেমেন্ট মেথড সফলভাবে যোগ করা হয়েছে!' : 'New payment method added successfully!');
      }

      setIsMethodModalOpen(false);
      fetchMethods();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to save payment method', 'error');
    } finally {
      setIsSavingMethod(false);
    }
  };

  // Toggle Method Active Status
  const handleToggleMethod = async (method: RechargeMethodItem) => {
    try {
      await api.patch(`/wallet/admin/recharge-methods/${method.id}/toggle`, {});
      showToast(
        !method.isActive
          ? (lang === 'bn' ? `"${method.name}" সক্রিয় (Active) করা হয়েছে!` : `${method.name} activated!`)
          : (lang === 'bn' ? `"${method.name}" নিষ্ক্রিয় (Inactive) করা হয়েছে!` : `${method.name} deactivated!`)
      );
      fetchMethods();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to toggle status', 'error');
    }
  };

  // Delete Method
  const handleConfirmDeleteMethod = async () => {
    if (!deletingMethod) return;
    setIsDeletingMethod(true);

    try {
      await api.delete(`/wallet/admin/recharge-methods/${deletingMethod.id}`);
      showToast(lang === 'bn' ? 'পেমেন্ট মেথড মুছে ফেলা হয়েছে।' : 'Payment method deleted successfully.');
      setDeletingMethod(null);
      fetchMethods();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete method', 'error');
    } finally {
      setIsDeletingMethod(false);
    }
  };

  // Filtered Recharge Requests
  const filteredRecharges = recharges.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const userId = (item.user?.uniqueUserId || '').toLowerCase();
    const phone = (item.user?.phone || '').toLowerCase();
    const sender = (item.senderAccount || item.senderNumber || '').toLowerCase();
    const trx = (item.transactionNumber || item.transactionId || '').toLowerCase();
    const name = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.toLowerCase();
    const email = (item.user?.email || '').toLowerCase();

    return (
      userId.includes(q) ||
      phone.includes(q) ||
      sender.includes(q) ||
      trx.includes(q) ||
      name.includes(q) ||
      email.includes(q)
    );
  });

  const pendingRequestsCount = recharges.filter((r) => r.status === 'PENDING').length;
  const activeMethodsCount = methods.filter((m) => m.isActive).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PERSONAL':
        return { label: 'পার্সোনাল (Send Money)', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30' };
      case 'MERCHANT':
        return { label: 'মার্চেন্ট (Payment)', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'BANK':
        return { label: 'ব্যাংক একাউন্ট (Transfer)', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'API':
        return { label: 'অটোমেটেড গেটওয়ে (API)', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      default:
        return { label: type, bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border text-sm font-semibold transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-600/50'
              : 'bg-rose-950 text-rose-200 border-rose-600/50'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <ArrowDownCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <span>{lang === 'bn' ? 'ওয়ালেট রিচার্জ ও পেমেন্ট ম্যানেজমেন্ট' : 'Wallet Recharges & Payment Settings'}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn'
                ? 'ইউজারদের জমা দেওয়া ডিপোজিট রিকোয়েস্ট যাচাই এবং বিকাশ, নগদ, রকেট, ব্যাংক সেটিংস ও নির্দেশাবলি নিয়ন্ত্রণ করুন।'
                : 'Review user deposit requests and configure bKash, Nagad, Rocket, Bank accounts & instructions.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'requests' && statusFilter === 'PENDING' && (
            <button
              onClick={handleClaimNext}
              disabled={claimingTask}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              title={lang === 'bn' ? 'অ্যালগরিদম অনুসারে পরবর্তী অপেক্ষমাণ রিচার্জ কাজ নিন' : 'Claim next pending recharge'}
            >
              <Sparkles className={`w-4 h-4 ${claimingTask ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'পরবর্তী কাজ নিন' : 'Claim Next'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === 'requests') fetchRecharges();
              else fetchMethods();
            }}
            disabled={loadingRequests || loadingMethods}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingRequests || loadingMethods) ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          {activeTab === 'settings' && (
            <button
              onClick={handleOpenAddMethod}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? '+ নতুন পেমেন্ট মেথড' : '+ Add Payment Method'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'requests'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>{lang === 'bn' ? 'রিচার্জ রিকোয়েস্ট সমূহ' : 'Recharge Requests'}</span>
          {pendingRequestsCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'requests'
                  ? 'bg-slate-950 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
              }`}
            >
              {pendingRequestsCount} {lang === 'bn' ? 'পেন্ডিং' : 'Pending'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'settings'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{lang === 'bn' ? 'পেমেন্ট মেথড ও গেটওয়ে সেটিংস' : 'Payment Method Settings'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'settings'
                ? 'bg-slate-950 text-emerald-400'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {activeMethodsCount} {lang === 'bn' ? 'সক্রিয়' : 'Active'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RECHARGE REQUESTS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'PENDING'
                    ? (lang === 'bn' ? 'অপেক্ষমাণ (Pending)' : 'Pending')
                    : st === 'APPROVED'
                    ? (lang === 'bn' ? 'অনুমোদিত (Approved)' : 'Approved')
                    : st === 'REJECTED'
                    ? (lang === 'bn' ? 'বাতিল (Rejected)' : 'Rejected')
                    : (lang === 'bn' ? 'সকল (All)' : 'All')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'ইউজার আইডি, TrxID, ফোন...' : 'Search UserID, TrxID, phone...'}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
            {loadingRequests ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-400">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading requests...'}</p>
              </div>
            ) : filteredRecharges.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <ArrowDownCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'bn' ? 'কোনো রিচার্জ রিকোয়েস্ট পাওয়া যায়নি' : 'No recharge requests found'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'বর্তমান ফিল্টারের সাথে মিলে এমন কোনো অনুরোধ নেই।'
                    : 'No requests match your filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">{lang === 'bn' ? 'ইউজার' : 'User'}</th>
                      <th className="py-3.5 px-4">{lang === 'bn' ? 'মেথড ও অ্যাকাউন্ট' : 'Method & Account'}</th>
                      <th className="py-3.5 px-4">{lang === 'bn' ? 'পরিমাণ (Amount)' : 'Amount'}</th>
                      <th className="py-3.5 px-4">{lang === 'bn' ? 'TrxID ও প্রুফ' : 'TrxID & Proof'}</th>
                      <th className="py-3.5 px-4">{lang === 'bn' ? 'অ্যাসাইন / কিউ' : 'Assigned / Queue'}</th>
                      <th className="py-3.5 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th className="py-3.5 px-4">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRecharges.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-850/50 transition">
                        {/* User Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-white">
                              {req.user?.firstName} {req.user?.lastName}
                            </div>
                            <div className="text-[11px] font-mono text-amber-400">
                              @{req.user?.uniqueUserId}
                            </div>
                            <div className="text-[10px] text-slate-400">{req.user?.phone}</div>
                          </div>
                        </td>

                        {/* Method & Account Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-bold text-[10px] border border-slate-700">
                              {req.method?.name || 'Recharge Method'}
                            </span>
                            <div className="text-[11px] text-slate-300 mt-1">
                              Sender: <strong className="text-white font-mono">{req.senderAccount || req.senderNumber}</strong>
                            </div>
                          </div>
                        </td>

                        {/* Amount Column */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="font-extrabold text-emerald-400 text-sm">
                              ৳{parseFloat(req.amount).toLocaleString()}
                            </div>
                            {req.approvedAmount && req.status === 'APPROVED' && (
                              <div className="text-[10px] text-slate-400">
                                Approved: ৳{parseFloat(req.approvedAmount).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* TrxID & Proof */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1 font-mono font-bold text-white bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 w-fit">
                              <span>{req.transactionNumber || req.transactionId}</span>
                              <button
                                onClick={() => handleCopy(req.transactionNumber || req.transactionId || '')}
                                className="text-slate-500 hover:text-amber-400 ml-1"
                                title="Copy TrxID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>

                            {(req.proofUrl || req.proofImageUrl) ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewImage({
                                      url: getImageUrl(req.proofUrl || req.proofImageUrl),
                                      trxId: req.transactionNumber || req.transactionId,
                                      userName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`,
                                      amount: req.amount,
                                    })
                                  }
                                  className="relative group rounded-lg overflow-hidden border border-slate-700 hover:border-sky-500 transition shadow-xs flex-shrink-0"
                                  title={lang === 'bn' ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to zoom'}
                                >
                                  <img
                                    src={getImageUrl(req.proofUrl || req.proofImageUrl)}
                                    alt="Receipt Proof"
                                    className="w-8 h-8 object-cover group-hover:scale-110 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                    <Eye className="w-3 h-3 text-white" />
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewImage({
                                      url: getImageUrl(req.proofUrl || req.proofImageUrl),
                                      trxId: req.transactionNumber || req.transactionId,
                                      userName: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`,
                                      amount: req.amount,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold hover:underline"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'স্লিপ দেখুন' : 'View Slip'}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium italic block">
                                {lang === 'bn' ? 'স্লিপ নেই' : 'No slip'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assigned / Queue Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {req.assignedToId ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                {req.assignedToId === user?.id ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <UserCheck className="w-3 h-3" />
                                    <span>{lang === 'bn' ? 'আমার কাজ' : 'Assigned to Me'}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                    <span>👤 {req.assignedTo?.firstName || 'Staff'}</span>
                                  </span>
                                )}
                              </div>
                              {req.lockedUntil && new Date(req.lockedUntil) > new Date() && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-400">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Locked</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              {lang === 'bn' ? 'উন্মুক্ত পুল' : 'Open Pool'}
                            </span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4">
                          {req.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'পেন্ডিং' : 'Pending'}</span>
                            </span>
                          )}
                          {req.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                              <CheckCircle className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'অনুমোদিত' : 'Approved'}</span>
                            </span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                              <XCircle className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'বাতিল' : 'Rejected'}</span>
                            </span>
                          )}
                        </td>

                        {/* Date Column */}
                        <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>

                        {/* Action Column */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {req.assignedToId && req.assignedToId !== user?.id && !isSuperAdmin() ? (
                                <span className="text-slate-400 text-[10px] italic flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'সহকর্মী দেখছেন' : 'In review'}</span>
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOpenReviewModal(req, 'APPROVE')}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'অনুমোদন' : 'Approve'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenReviewModal(req, 'REJECT')}
                                    className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/40 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>{lang === 'bn' ? 'রিজেক্ট' : 'Reject'}</span>
                                  </button>
                                  {(req.assignedToId === user?.id || isSuperAdmin()) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setHandoffTask(req)}
                                        title={lang === 'bn' ? 'সহকর্মীকে হস্তান্তর করুন' : 'Reassign task'}
                                        className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs transition cursor-pointer"
                                      >
                                        <Shuffle className="w-3.5 h-3.5" />
                                      </button>
                                      {req.assignedToId && (
                                        <button
                                          type="button"
                                          onClick={() => handleReleaseTask(req.id)}
                                          title={lang === 'bn' ? 'পুলে রিলিজ করুন' : 'Release to pool'}
                                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 rounded-lg text-xs transition cursor-pointer"
                                        >
                                          <Unlock className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">
                              {req.status === 'APPROVED' ? 'Resolved' : 'Dismissed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENT METHOD SETTINGS                                           */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-bold text-white text-sm">
                  {lang === 'bn' ? 'পেমেন্ট গেটওয়ে ও মোবাইল ব্যাংকিং কনফিগারেশন' : 'Payment Gateways & Mobile Banking Config'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'এখানে যুক্ত ও সক্রিয় করা প্রতিটি মেথড ইউজাররা তাদের ওয়ালেট রিচার্জ পেইজে বিকল্প হিসেবে দেখতে পাবেন। বিশেষ নির্দেশনা (অ্যাডমিন নোট) লিখে দিন যা ইউজাররা রিচার্জের সময় দেখতে পাবেন।'
                    : 'Configure payment options visible to users during wallet recharge. Set instructions and admin notes for users to follow.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddMethod}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition flex-shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? '+ নতুন পেমেন্ট অপশন যোগ করুন' : '+ Add Payment Option'}</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* AUTOMATED GATEWAY API SETTINGS SECTION (bKash & SSLCommerz)               */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      {lang === 'bn' ? 'অটো রিচার্জ এপিআই সেটিংস (bKash & SSLCommerz)' : 'Automated Recharge Gateway API Settings'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                      Auto Balance
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'বিকাশ ও এসএসএলকমার্স গেটওয়ের ক্রেডেনশিয়াল, লাইভ/স্যান্ডবক্স মোড এবং লেনদেন ফি (চার্জ) কনফিগার করুন।'
                      : 'Configure bKash Checkout & SSLCommerz credentials, live/sandbox mode, and service fees (charges).'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchGatewaySettings();
                  setIsGatewayModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20 flex-shrink-0"
              >
                <Sliders className="w-4 h-4" />
                <span>{lang === 'bn' ? 'এপিআই ক্রেডেনশিয়াল ও ফি সেটআপ' : 'Configure API & Fees'}</span>
              </button>
            </div>

            {/* Gateway Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* bKash PGW Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-[#E2136E] animate-pulse" />
                    <span className="font-extrabold text-white text-sm">bKash PGW (Tokenized API)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                    gatewayData.bkash.isEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {gatewayData.bkash.isEnabled ? (lang === 'bn' ? 'সক্রিয় (Enabled)' : 'Enabled') : (lang === 'bn' ? 'নিষ্ক্রিয় (Disabled)' : 'Disabled')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'bn' ? 'এনভায়রনমেন্ট' : 'Environment'}</span>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${gatewayData.bkash.isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span>{gatewayData.bkash.isLive ? 'LIVE (Production)' : 'SANDBOX (Test Mode)'}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'bn' ? 'গেটওয়ে চার্জ (ফি)' : 'Gateway Fee'}</span>
                    <div className="font-extrabold text-amber-400">
                      {gatewayData.bkash.chargeType === 'PERCENTAGE'
                        ? `${gatewayData.bkash.chargeValue}%`
                        : `৳${gatewayData.bkash.chargeValue} (Fixed)`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{lang === 'bn' ? 'ডিপোজিট লিমিট:' : 'Deposit Limit:'}</span>
                  <span className="text-emerald-400 font-bold">
                    ৳{gatewayData.bkash.minAmount.toLocaleString()} - ৳{gatewayData.bkash.maxAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* SSLCommerz Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
                    <span className="font-extrabold text-white text-sm">SSLCommerz Automated Gateway</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                    gatewayData.sslcommerz.isEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {gatewayData.sslcommerz.isEnabled ? (lang === 'bn' ? 'সক্রিয় (Enabled)' : 'Enabled') : (lang === 'bn' ? 'নিষ্ক্রিয় (Disabled)' : 'Disabled')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'bn' ? 'এনভায়রনমেন্ট' : 'Environment'}</span>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${gatewayData.sslcommerz.isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span>{gatewayData.sslcommerz.isLive ? 'LIVE (Production)' : 'SANDBOX (Test Mode)'}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{lang === 'bn' ? 'গেটওয়ে চার্জ (ফি)' : 'Gateway Fee'}</span>
                    <div className="font-extrabold text-amber-400">
                      {gatewayData.sslcommerz.chargeType === 'PERCENTAGE'
                        ? `${gatewayData.sslcommerz.chargeValue}%`
                        : `৳${gatewayData.sslcommerz.chargeValue} (Fixed)`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{lang === 'bn' ? 'ডিপোজিট লিমিট:' : 'Deposit Limit:'}</span>
                  <span className="text-emerald-400 font-bold">
                    ৳{gatewayData.sslcommerz.minAmount.toLocaleString()} - ৳{gatewayData.sslcommerz.maxAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <h3 className="font-bold text-sm text-slate-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bn' ? 'ম্যানুয়াল ও মোবাইল ব্যাংকিং মেথড সমূহ' : 'Manual & Bank Deposit Methods'}</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {methods.length} {lang === 'bn' ? 'টি চ্যানেল' : 'channels configured'}
            </span>
          </div>

          {/* Methods List */}
          {loadingMethods ? (
            <div className="p-16 text-center space-y-3 bg-slate-900 rounded-2xl border border-slate-800">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'পেমেন্ট মেথড লোড হচ্ছে...' : 'Loading payment methods...'}</p>
            </div>
          ) : methods.length === 0 ? (
            <div className="p-16 text-center space-y-3 bg-slate-900 rounded-2xl border border-slate-800">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                {lang === 'bn' ? 'কোনো পেমেন্ট মেথড কনফিগার করা নেই' : 'No payment methods configured'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {lang === 'bn'
                  ? 'বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্ট যোগ করতে উপরের বাটনটি ক্লিক করুন।'
                  : 'Click the button above to configure your bKash, Nagad, Rocket, or Bank payment channels.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methods.map((m) => {
                const typeInfo = getTypeBadge(m.type);
                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-2xl border transition relative space-y-4 ${
                      m.isActive
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 opacity-75'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-white text-base">{m.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${typeInfo.bg}`}>
                            {typeInfo.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            CODE: {m.code}
                          </span>
                        </div>
                      </div>

                      {/* Active/Inactive Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleMethod(m)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          m.isActive ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                        title={m.isActive ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            m.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Account Details Box */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">{lang === 'bn' ? 'একাউন্ট নম্বর:' : 'Account Number:'}</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400">
                          <span>{m.accountNumber}</span>
                          <button
                            onClick={() => handleCopy(m.accountNumber)}
                            className="text-slate-500 hover:text-white"
                            title="Copy"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {m.accountName && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">{lang === 'bn' ? 'একাউন্টের নাম:' : 'Account Name:'}</span>
                          <span className="font-semibold text-white">{m.accountName}</span>
                        </div>
                      )}

                      {m.bankDetails && (
                        <div className="pt-1 border-t border-slate-900 text-[11px] text-slate-400">
                          <strong className="text-slate-300">Bank Details:</strong> {m.bankDetails}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px] text-slate-400">
                        <span>{lang === 'bn' ? 'ডিপোজিট লিমিট:' : 'Deposit Limits:'}</span>
                        <span className="text-emerald-400 font-bold">
                          ৳{Number(m.minAmount).toLocaleString()} - ৳{Number(m.maxAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Admin Note / User Instructions Box */}
                    {m.instructions && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                        <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'ব্যবহারকারীর জন্য অ্যাডমিন নোট / নির্দেশনা:' : 'Admin Note / User Instructions:'}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line">
                          {m.instructions}
                        </p>
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                      <div>
                        <span>{lang === 'bn' ? 'মোট লেনদেন:' : 'Requests:'}</span>{' '}
                        <strong className="text-white">{m._count?.requests ?? 0} টি</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditMethod(m)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-semibold flex items-center gap-1 transition"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                        </button>

                        <button
                          onClick={() => setDeletingMethod(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700 transition"
                          title="Delete Method"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEW MODAL (APPROVE / REJECT)                                          */}
      {/* ========================================================================= */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[580px] overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900 flex-shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                {actionType === 'APPROVE' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span>
                  {actionType === 'APPROVE'
                    ? lang === 'bn'
                      ? 'রিচার্জ অনুমোদন করুন'
                      : 'Approve Recharge Request'
                    : lang === 'bn'
                    ? 'রিচার্জ বাতিল (Reject) করুন'
                    : 'Reject Recharge Request'}
                </span>
              </h3>
              <button
                onClick={handleCloseReviewModal}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div>
                  <span className="text-slate-400">User:</span>{' '}
                  <strong className="text-white">
                    {selectedRequest.user?.firstName} {selectedRequest.user?.lastName} (@{selectedRequest.user?.uniqueUserId})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Method:</span>{' '}
                  <strong className="text-white">{selectedRequest.method?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Sender Account:</span>{' '}
                  <strong className="text-white font-mono">{selectedRequest.senderAccount || selectedRequest.senderNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400">TrxID:</span>{' '}
                  <strong className="text-amber-400 font-mono">{selectedRequest.transactionNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Requested Amount:</span>{' '}
                  <strong className="text-emerald-400">৳{parseFloat(selectedRequest.amount).toLocaleString()}</strong>
                </div>
              </div>

              {/* Uploaded Receipt / Proof Screenshot Box */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>{lang === 'bn' ? 'পেমেন্ট স্লিপ / স্ক্রিনশট:' : 'Payment Slip / Screenshot:'}</span>
                  </span>

                  <label className="cursor-pointer text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded-lg border border-sky-500/20 transition">
                    {isUploadingAdminProof ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>
                      {selectedRequest.proofUrl || selectedRequest.proofImageUrl
                        ? (lang === 'bn' ? 'স্লিপ পরিবর্তন' : 'Change Slip')
                        : (lang === 'bn' ? 'স্লিপ আপলোড করুন' : 'Upload Slip')}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingAdminProof}
                      onChange={handleAdminUploadProof}
                      className="hidden"
                    />
                  </label>
                </div>

                {(selectedRequest.proofUrl || selectedRequest.proofImageUrl) ? (
                  <div
                    onClick={() =>
                      setPreviewImage({
                        url: getImageUrl(selectedRequest.proofUrl || selectedRequest.proofImageUrl),
                        trxId: selectedRequest.transactionNumber,
                        userName: `${selectedRequest.user?.firstName} ${selectedRequest.user?.lastName}`,
                        amount: selectedRequest.amount,
                      })
                    }
                    className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 max-h-36 bg-black/60 flex items-center justify-center transition shadow-inner"
                    title={lang === 'bn' ? 'ক্লিক করে বড় করুন' : 'Click to zoom'}
                  >
                    <img
                      src={getImageUrl(selectedRequest.proofUrl || selectedRequest.proofImageUrl)}
                      alt="Payment Proof"
                      className="max-h-36 w-full object-contain group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-[11px] font-bold transition">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ক্লিক করে বড় দেখুন' : 'Click to View Full Size'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-500 italic text-center">
                    {lang === 'bn' ? 'ইউজার কোনো পেমেন্ট স্লিপ আপলোড করেননি।' : 'No payment receipt uploaded by user.'}
                  </div>
                )}
              </div>

              {actionType === 'APPROVE' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'অনুমোদিত পরিমাণ (৳) *' : 'Approved Amount (৳) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {lang === 'bn'
                      ? '* ব্যবহারকারীর ওয়ালেটে এই নির্দিষ্ট পরিমাণ টাকা জমা হবে।'
                      : '* This verified amount will be credited to user wallet.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'অ্যাডমিন নোট (ঐচ্ছিক)' : 'Admin Note (Optional)'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'নোট বা মন্তব্য লিখুন...' : 'Write verification note...'}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 min-h-[50px]"
                />
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex-shrink-0 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseReviewModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleSubmitReview}
                className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition flex items-center gap-1.5 shadow-sm ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmittingReview ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{actionType === 'APPROVE' ? (lang === 'bn' ? 'কনফার্ম অনুমোদন' : 'Confirm Approve') : (lang === 'bn' ? 'কনফার্ম রিজেক্ট' : 'Confirm Reject')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT PAYMENT METHOD MODAL                                          */}
      {/* ========================================================================= */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  {editingMethod
                    ? (lang === 'bn' ? 'পেমেন্ট মেথড এডিট করুন' : 'Edit Payment Method')
                    : (lang === 'bn' ? 'নতুন পেমেন্ট মেথড যোগ করুন' : 'Add New Payment Method')}
                </h3>
              </div>
              <button
                onClick={() => setIsMethodModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Quick Template Presets Bar */}
            {!editingMethod && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {lang === 'bn' ? '⚡ দ্রুত টেমপ্লেট নির্বাচন করুন (Quick Preset):' : '⚡ Quick Template Presets:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('bkash_personal')}
                    className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[11px] font-semibold transition"
                  >
                    bKash Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('bkash_merchant')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                  >
                    bKash Merchant
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('nagad_personal')}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-semibold transition"
                  >
                    Nagad Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('rocket_personal')}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition"
                  >
                    Rocket
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('bank_transfer')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition"
                  >
                    Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('ssl_commerz')}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold transition"
                  >
                    SSLCommerz / API
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveMethod} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method Name */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'পেমেন্ট মেথডের নাম *' : 'Method Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bKash Personal"
                    value={methodFormData.name}
                    onChange={(e) => setMethodFormData({ ...methodFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Method Code */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইউনিক কোড (Code) *' : 'Unique Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BKASH_PERSONAL"
                    value={methodFormData.code}
                    onChange={(e) => setMethodFormData({ ...methodFormData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gateway Type */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'গেটওয়ে ক্যাটাগরি / টাইপ *' : 'Gateway Category / Type *'}
                  </label>
                  <select
                    value={methodFormData.type}
                    onChange={(e) => setMethodFormData({ ...methodFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="PERSONAL">PERSONAL (পার্সোনাল - Send Money)</option>
                    <option value="MERCHANT">MERCHANT (মার্চেন্ট - Make Payment)</option>
                    <option value="BANK">BANK (ব্যাংক একাউন্ট ট্রান্সফার)</option>
                    <option value="API">API (মোবাইল এপিআই / SSLCommerz গেটওয়ে)</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'অ্যাকাউন্ট নম্বর / ফোন নম্বর *' : 'Account Number / Phone *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01700000000 or A/C 2050..."
                    value={methodFormData.accountNumber}
                    onChange={(e) => setMethodFormData({ ...methodFormData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Account Holder Name */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'অ্যাকাউন্টধারীর নাম' : 'Account Holder Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SafnexBD Official"
                    value={methodFormData.accountName}
                    onChange={(e) => setMethodFormData({ ...methodFormData, accountName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'প্রদর্শনের ক্রম (Sort Order)' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    value={methodFormData.sortOrder}
                    onChange={(e) => setMethodFormData({ ...methodFormData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Bank Details (If Bank Type) */}
              {methodFormData.type === 'BANK' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'ব্যাংক বিবরণী (Branch, Routing No ইত্যাদি)' : 'Bank Details (Branch, Routing No etc)'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Bank: Islami Bank PLC | Branch: Motijheel | Routing: 125272345"
                    value={methodFormData.bankDetails}
                    onChange={(e) => setMethodFormData({ ...methodFormData, bankDetails: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Admin Note / User Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'অ্যাডমিন নোট / ব্যবহারকারীর জন্য নির্দেশনা *' : 'Admin Note / User Instructions *'}</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {lang === 'bn' ? 'ইউজার রিচার্জের সময় এটি দেখতে পাবে' : 'Visible to users when recharging'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: শুধুমাত্র Send Money করবেন। ক্যাশইন গ্রহণযোগ্য নয়। রেফারেন্সে আপনার ইউজার আইডি লিখুন এবং TrxID নিচে দিন।'
                      : 'e.g. Please Send Money only. Do not cash in. Put your username in reference and provide TrxID.'
                  }
                  value={methodFormData.instructions}
                  onChange={(e) => setMethodFormData({ ...methodFormData, instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-500/30 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* Min & Max Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'সর্বনিম্ন রিচার্জ (৳)' : 'Min Recharge (৳)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={methodFormData.minAmount}
                    onChange={(e) => setMethodFormData({ ...methodFormData, minAmount: parseFloat(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'সর্বোচ্চ রিচার্জ (৳)' : 'Max Recharge (৳)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={methodFormData.maxAmount}
                    onChange={(e) => setMethodFormData({ ...methodFormData, maxAmount: parseFloat(e.target.value) || 500000 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white">
                    {lang === 'bn' ? 'পেমেন্ট মেথডটি সক্রিয় রাখুন' : 'Keep Method Active'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {methodFormData.isActive
                      ? (lang === 'bn' ? 'ইউজাররা রিচার্জের সময় এই মেথড দেখতে পাবে।' : 'Users will see this option on recharge page.')
                      : (lang === 'bn' ? 'বন্ধ আছে - ইউজাররা এটি দেখতে পাবে না।' : 'Inactive - Hidden from user recharge page.')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMethodFormData({ ...methodFormData, isActive: !methodFormData.isActive })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    methodFormData.isActive ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      methodFormData.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMethodModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingMethod}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-2 shadow-sm"
                >
                  {isSavingMethod ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingMethod ? (lang === 'bn' ? 'আপডেট করুন' : 'Update Method') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Method')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                */}
      {/* ========================================================================= */}
      {deletingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-white">
                  {lang === 'bn' ? 'পেমেন্ট মেথড ডিলিট নিশ্চিতকরণ' : 'Confirm Delete Method'}
                </h3>
                <p className="text-xs text-slate-400">{lang === 'bn' ? 'আপনি কি এই মেথডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this method?'}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-white text-sm">{deletingMethod.name}</div>
              <div className="text-slate-400 font-mono mt-0.5">Account: {deletingMethod.accountNumber} ({deletingMethod.type})</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMethod(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                {lang === 'bn' ? 'না, বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingMethod}
                onClick={handleConfirmDeleteMethod}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingMethod ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* GATEWAY API SETTINGS MODAL (bKash & SSLCommerz)                          */}
      {/* ========================================================================= */}
      {isGatewayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {lang === 'bn' ? 'অটো রিচার্জ এপিআই সেটিংস ও চার্জ কনফিগারেশন' : 'Auto Recharge Gateway API & Fee Settings'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'bKash PGW ও SSLCommerz গেটওয়ের ক্রেডেনশিয়াল এবং ফি রেট নির্ধারণ করুন।' : 'Configure bKash PGW & SSLCommerz credentials and gateway fee.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGatewayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Sub Tabs: bKash vs SSLCommerz */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setGatewayActiveTab('bkash')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  gatewayActiveTab === 'bkash'
                    ? 'bg-[#E2136E] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>bKash PGW (Checkout API)</span>
              </button>
              <button
                type="button"
                onClick={() => setGatewayActiveTab('sslcommerz')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  gatewayActiveTab === 'sslcommerz'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>SSLCommerz Automated Gateway</span>
              </button>
            </div>

            <form onSubmit={handleSaveGatewaySettings} className="space-y-4 text-xs">
              {/* ================= BKASH TAB CONTENT ================= */}
              {gatewayActiveTab === 'bkash' && (
                <div className="space-y-4">
                  {/* Status & Environment Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="font-bold text-white text-xs">{lang === 'bn' ? 'bKash গেটওয়ে সক্রিয়' : 'Enable bKash Gateway'}</div>
                        <div className="text-[10px] text-slate-400">
                          {gatewayData.bkash.isEnabled ? (lang === 'bn' ? 'ইউজাররা অটো রিচার্জ করতে পারবে' : 'Users can recharge') : (lang === 'bn' ? 'বন্ধ আছে' : 'Disabled')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setGatewayData({
                            ...gatewayData,
                            bkash: { ...gatewayData.bkash, isEnabled: !gatewayData.bkash.isEnabled },
                          })
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          gatewayData.bkash.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            gatewayData.bkash.isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Live / Sandbox Mode */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="font-bold text-white text-xs">{lang === 'bn' ? 'লাইভ মোড (Live / Sandbox)' : 'Live Production Mode'}</div>
                        <div className="text-[10px] text-slate-400">
                          {gatewayData.bkash.isLive ? (lang === 'bn' ? 'লাইভ পেমেন্ট চালু' : 'Live Production') : (lang === 'bn' ? 'স্যান্ডবক্স টেস্ট মোড' : 'Sandbox Testing')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setGatewayData({
                            ...gatewayData,
                            bkash: { ...gatewayData.bkash, isLive: !gatewayData.bkash.isLive },
                          })
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          gatewayData.bkash.isLive ? 'bg-indigo-600' : 'bg-amber-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            gatewayData.bkash.isLive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Credentials Fields */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>bKash API Credentials</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">bKash App Key</label>
                        <div className="relative">
                          <input
                            type={showSecretKeys['bkash_key'] ? 'text' : 'password'}
                            value={gatewayData.bkash.appKey || ''}
                            onChange={(e) =>
                              setGatewayData({
                                ...gatewayData,
                                bkash: { ...gatewayData.bkash, appKey: e.target.value },
                              })
                            }
                            placeholder="bKash Merchant App Key"
                            className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey('bkash_key')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showSecretKeys['bkash_key'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">bKash App Secret</label>
                        <div className="relative">
                          <input
                            type={showSecretKeys['bkash_secret'] ? 'text' : 'password'}
                            value={gatewayData.bkash.appSecret || ''}
                            onChange={(e) =>
                              setGatewayData({
                                ...gatewayData,
                                bkash: { ...gatewayData.bkash, appSecret: e.target.value },
                              })
                            }
                            placeholder="bKash Merchant App Secret"
                            className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey('bkash_secret')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showSecretKeys['bkash_secret'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">API Username</label>
                        <input
                          type="text"
                          value={gatewayData.bkash.username || ''}
                          onChange={(e) =>
                            setGatewayData({
                              ...gatewayData,
                              bkash: { ...gatewayData.bkash, username: e.target.value },
                            })
                          }
                          placeholder="PGW Username"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">API Password</label>
                        <div className="relative">
                          <input
                            type={showSecretKeys['bkash_pass'] ? 'text' : 'password'}
                            value={gatewayData.bkash.password || ''}
                            onChange={(e) =>
                              setGatewayData({
                                ...gatewayData,
                                bkash: { ...gatewayData.bkash, password: e.target.value },
                              })
                            }
                            placeholder="PGW Password"
                            className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey('bkash_pass')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showSecretKeys['bkash_pass'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fee & Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        {lang === 'bn' ? 'চার্জের ধরন' : 'Charge Type'}
                      </label>
                      <select
                        value={gatewayData.bkash.chargeType}
                        onChange={(e) =>
                          setGatewayData({
                            ...gatewayData,
                            bkash: {
                              ...gatewayData.bkash,
                              chargeType: e.target.value as 'PERCENTAGE' | 'FIXED',
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="PERCENTAGE">{lang === 'bn' ? 'শতাংশ (%)' : 'Percentage (%)'}</option>
                        <option value="FIXED">{lang === 'bn' ? 'নির্দিষ্ট টাকা (Fixed ৳)' : 'Fixed (৳)'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        {lang === 'bn' ? 'গেটওয়ে চার্জ / ফি' : 'Gateway Fee Value'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={gatewayData.bkash.chargeValue}
                        onChange={(e) =>
                          setGatewayData({
                            ...gatewayData,
                            bkash: {
                              ...gatewayData.bkash,
                              chargeValue: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-extrabold text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        {lang === 'bn' ? 'ডিপোজিট রেঞ্জ (Min - Max ৳)' : 'Deposit Limits (৳)'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={gatewayData.bkash.minAmount}
                          onChange={(e) =>
                            setGatewayData({
                              ...gatewayData,
                              bkash: { ...gatewayData.bkash, minAmount: parseFloat(e.target.value) || 10 },
                            })
                          }
                          className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold text-center"
                          placeholder="Min"
                        />
                        <span className="text-slate-500">-</span>
                        <input
                          type="number"
                          value={gatewayData.bkash.maxAmount}
                          onChange={(e) =>
                            setGatewayData({
                              ...gatewayData,
                              bkash: { ...gatewayData.bkash, maxAmount: parseFloat(e.target.value) || 50000 },
                            })
                          }
                          className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold text-center"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      {lang === 'bn' ? 'ইউজারদের জন্য অ্যাডমিন নোট / নির্দেশনা' : 'Admin Note / User Instructions'}
                    </label>
                    <textarea
                      value={gatewayData.bkash.instructions || ''}
                      onChange={(e) =>
                        setGatewayData({
                          ...gatewayData,
                          bkash: { ...gatewayData.bkash, instructions: e.target.value },
                        })
                      }
                      placeholder="bKash পেমেন্ট গেটওয়ের মাধ্যমে ইনস্ট্যান্ট অটো রিচার্জ সম্পন্ন হবে।"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 min-h-[55px]"
                    />
                  </div>
                </div>
              )}

              {/* ================= SSLCOMMERZ TAB CONTENT ================= */}
              {gatewayActiveTab === 'sslcommerz' && (
                <div className="space-y-4">
                  {/* Status & Environment Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="font-bold text-white text-xs">{lang === 'bn' ? 'SSLCommerz গেটওয়ে সক্রিয়' : 'Enable SSLCommerz Gateway'}</div>
                        <div className="text-[10px] text-slate-400">
                          {gatewayData.sslcommerz.isEnabled ? (lang === 'bn' ? 'ইউজাররা অটো রিচার্জ করতে পারবে' : 'Users can recharge') : (lang === 'bn' ? 'বন্ধ আছে' : 'Disabled')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setGatewayData({
                            ...gatewayData,
                            sslcommerz: { ...gatewayData.sslcommerz, isEnabled: !gatewayData.sslcommerz.isEnabled },
                          })
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          gatewayData.sslcommerz.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            gatewayData.sslcommerz.isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Live / Sandbox Mode */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                      <div>
                        <div className="font-bold text-white text-xs">{lang === 'bn' ? 'লাইভ মোড (Live / Sandbox)' : 'Live Production Mode'}</div>
                        <div className="text-[10px] text-slate-400">
                          {gatewayData.sslcommerz.isLive ? (lang === 'bn' ? 'লাইভ পেমেন্ট চালু' : 'Live Production') : (lang === 'bn' ? 'স্যান্ডবক্স টেস্ট মোড' : 'Sandbox Testing')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setGatewayData({
                            ...gatewayData,
                            sslcommerz: { ...gatewayData.sslcommerz, isLive: !gatewayData.sslcommerz.isLive },
                          })
                        }
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          gatewayData.sslcommerz.isLive ? 'bg-sky-600' : 'bg-amber-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            gatewayData.sslcommerz.isLive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Credentials Fields */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>SSLCommerz Store Credentials</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Store ID</label>
                        <input
                          type="text"
                          value={gatewayData.sslcommerz.storeId || ''}
                          onChange={(e) =>
                            setGatewayData({
                              ...gatewayData,
                              sslcommerz: { ...gatewayData.sslcommerz, storeId: e.target.value },
                            })
                          }
                          placeholder="e.g. testbox_live"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Store Password</label>
                        <div className="relative">
                          <input
                            type={showSecretKeys['ssl_pass'] ? 'text' : 'password'}
                            value={gatewayData.sslcommerz.storePassword || ''}
                            onChange={(e) =>
                              setGatewayData({
                                ...gatewayData,
                                sslcommerz: { ...gatewayData.sslcommerz, storePassword: e.target.value },
                              })
                            }
                            placeholder="Store Password / Secret"
                            className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey('ssl_pass')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showSecretKeys['ssl_pass'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fee & Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        {lang === 'bn' ? 'চার্জের ধরন' : 'Charge Type'}
                      </label>
                      <select
                        value={gatewayData.sslcommerz.chargeType}
                        onChange={(e) =>
                          setGatewayData({
                            ...gatewayData,
                            sslcommerz: {
                              ...gatewayData.sslcommerz,
                              chargeType: e.target.value as 'PERCENTAGE' | 'FIXED',
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 font-bold"
                      >
                        <option value="PERCENTAGE">{lang === 'bn' ? 'শতাংশ (%)' : 'Percentage (%)'}</option>
                        <option value="FIXED">{lang === 'bn' ? 'নির্দিষ্ট টাকা (Fixed ৳)' : 'Fixed (৳)'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        {lang === 'bn' ? 'গেটওয়ে চার্জ / ফি' : 'Gateway Fee Value'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={gatewayData.sslcommerz.chargeValue}
                        onChange={(e) =>
                          setGatewayData({
                            ...gatewayData,
                            sslcommerz: {
                              ...gatewayData.sslcommerz,
                              chargeValue: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-extrabold text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        {lang === 'bn' ? 'ডিপোজিট রেঞ্জ (Min - Max ৳)' : 'Deposit Limits (৳)'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={gatewayData.sslcommerz.minAmount}
                          onChange={(e) =>
                            setGatewayData({
                              ...gatewayData,
                              sslcommerz: { ...gatewayData.sslcommerz, minAmount: parseFloat(e.target.value) || 50 },
                            })
                          }
                          className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold text-center"
                          placeholder="Min"
                        />
                        <span className="text-slate-500">-</span>
                        <input
                          type="number"
                          value={gatewayData.sslcommerz.maxAmount}
                          onChange={(e) =>
                            setGatewayData({
                              ...gatewayData,
                              sslcommerz: { ...gatewayData.sslcommerz, maxAmount: parseFloat(e.target.value) || 200000 },
                            })
                          }
                          className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold text-center"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      {lang === 'bn' ? 'ইউজারদের জন্য অ্যাডমিন নোট / নির্দেশনা' : 'Admin Note / User Instructions'}
                    </label>
                    <textarea
                      value={gatewayData.sslcommerz.instructions || ''}
                      onChange={(e) =>
                        setGatewayData({
                          ...gatewayData,
                          sslcommerz: { ...gatewayData.sslcommerz, instructions: e.target.value },
                        })
                      }
                      placeholder="ভিসা, মাস্টারকার্ড, বিকাশ, নগদ সহ যেকোনো কার্ড ও মোবাইল ব্যাংকিং দিয়ে অটো রিচার্জ।"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500 min-h-[55px]"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGatewayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingGateway}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-indigo-600/20"
                >
                  {isSavingGateway ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{lang === 'bn' ? 'গেটওয়ে সেটিংস সংরক্ষণ করুন' : 'Save Gateway Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX / FULL-SIZE PAYMENT PROOF PREVIEW MODAL                         */}
      {/* ========================================================================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>{lang === 'bn' ? 'পেমেন্ট স্লিপ / রসিদ প্রিভিউ' : 'Payment Slip / Receipt Preview'}</span>
                    {previewImage.amount && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px]">
                        ৳{previewImage.amount}
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    {previewImage.userName && <span className="font-semibold text-slate-300">{previewImage.userName}</span>}
                    {previewImage.trxId && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono bg-slate-800/90 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                          Trx: {previewImage.trxId}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                  title={lang === 'bn' ? 'নতুন ট্যাবে দেখুন' : 'Open in new tab'}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'bn' ? 'নতুন ট্যাব' : 'Open Tab'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
                  title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="p-3 sm:p-5 overflow-auto flex items-center justify-center bg-black/60 min-h-[250px] max-h-[75vh]">
              <img
                src={previewImage.url}
                alt="Payment Slip"
                className="max-h-[72vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-800/80"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
              <span className="truncate max-w-[280px] sm:max-w-md font-mono text-[10px] text-slate-500">
                {previewImage.url}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Peer Reassignment Modal */}
      {handoffTask && (
        <TaskHandoffModal
          isOpen={!!handoffTask}
          onClose={() => setHandoffTask(null)}
          taskType="RECHARGE"
          taskId={handoffTask.id}
          taskTitle={`রিচার্জ: ৳${parseFloat(handoffTask.amount).toLocaleString()} (@${handoffTask.user?.uniqueUserId})`}
          currentStaffId={user?.id}
          onSuccess={() => {
            showToast(lang === 'bn' ? 'রিচার্জ কাজটি সফলভাবে সহকর্মীকে হস্তান্তর করা হয়েছে।' : 'Recharge task reassigned to colleague successfully.');
            fetchRecharges();
          }}
        />
      )}
    </div>
  );
}
