'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { TaskHandoffModal } from '@/components/operations/TaskHandoffModal';
import {
  ArrowUpCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Building2,
  Smartphone,
  Copy,
  Check,
  Sparkles,
  Shuffle,
  Unlock,
  UserCheck,
  Lock,
  Sliders,
  Plus,
  Edit,
  Trash2,
  Info,
  X,
} from 'lucide-react';

export interface WithdrawalMethodItem {
  id: string;
  name: string;
  code: string;
  minAmount: number | string;
  maxAmount: number | string;
  feePercentage: number | string;
  feeFlat: number | string;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    requests: number;
  };
}


interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: string;
  fee: string;
  netAmount: string;
  destinationAccount: string;
  accountType?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  routingNumber?: string;
  branchName?: string;
  accountDetails?: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  assignedToId?: string;
  assignedAt?: string;
  lockedUntil?: string;
  assignedTo?: {
    id: string;
    uniqueUserId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  user: {
    id: string;
    uniqueUserId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  method: {
    name: string;
    code?: string;
    type?: string;
  };
}

export default function AdminWithdrawalsPage() {
  const { lang } = useLanguage();
  const { user, isSuperAdmin } = useAuthStore();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab & Methods State
  const [activeTab, setActiveTab] = useState<'requests' | 'settings'>('requests');
  const [methods, setMethods] = useState<WithdrawalMethodItem[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<WithdrawalMethodItem | null>(null);
  const [methodForm, setMethodForm] = useState({
    name: '',
    code: '',
    minAmount: 100,
    maxAmount: 25000,
    feePercentage: 0,
    feeFlat: 0,
    isActive: true,
    sortOrder: 1,
  });
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [methodActionError, setMethodActionError] = useState<string | null>(null);
  const [topNotification, setTopNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Operations & Workload State
  const [claimingTask, setClaimingTask] = useState(false);
  const [handoffTask, setHandoffTask] = useState<WithdrawalRequest | null>(null);

  // Modals
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [payoutTrxId, setPayoutTrxId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClaimNext = async () => {
    try {
      setClaimingTask(true);
      const res = await api.post('/operations/claim', { taskType: 'WITHDRAWAL' });
      if (res.data?.success && res.data?.data) {
        setFeedbackMsg({
          type: 'success',
          text:
            lang === 'bn'
              ? `কাজটি সফলভাবে বরাদ্দ হয়েছে! পরিমাণ: ৳${res.data.data.amount}`
              : `Task claimed successfully! Amount: ৳${res.data.data.amount}`,
        });
        fetchWithdrawals();
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || (lang === 'bn' ? 'কোনো অপেক্ষমাণ কাজ পাওয়া যায়নি বা সীমা অতিক্রম হয়েছে।' : 'No tasks available or limit reached.'),
      });
    } finally {
      setClaimingTask(false);
    }
  };

  const handleReleaseTask = async (taskId: string) => {
    try {
      const res = await api.post('/operations/release', { taskType: 'WITHDRAWAL', taskId });
      if (res.data?.success) {
        setFeedbackMsg({
          type: 'success',
          text: lang === 'bn' ? 'কাজটি সফলভাবে কিউতে ফেরত দেওয়া হয়েছে।' : 'Task released back to queue.',
        });
        fetchWithdrawals();
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to release task',
      });
    }
  };

  const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const queryParam = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res: any = await api.get(`/wallet/admin/withdrawals${queryParam}`);
      const data = unwrap(res);

      if (data?.items && Array.isArray(data.items)) {
        setWithdrawals(data.items);
      } else if (Array.isArray(data)) {
        setWithdrawals(data);
      } else if (res?.items && Array.isArray(res.items)) {
        setWithdrawals(res.items);
      } else if (Array.isArray(res)) {
        setWithdrawals(res);
      } else {
        setWithdrawals([]);
      }
    } catch (err: any) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalMethods = async () => {
    setLoadingMethods(true);
    try {
      const res: any = await api.get('/wallet/admin/withdrawal-methods');
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : data?.data || [];
      setMethods(list);
    } catch (err: any) {
      console.error('Failed to load withdrawal methods:', err);
    } finally {
      setLoadingMethods(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  useEffect(() => {
    fetchWithdrawalMethods();
  }, []);

  const handleOpenAddMethod = () => {
    setEditingMethod(null);
    setMethodForm({
      name: '',
      code: '',
      minAmount: 100,
      maxAmount: 25000,
      feePercentage: 0,
      feeFlat: 0,
      isActive: true,
      sortOrder: (methods.length + 1) * 10,
    });
    setMethodActionError(null);
    setIsMethodModalOpen(true);
  };

  const handleOpenEditMethod = (m: WithdrawalMethodItem) => {
    setEditingMethod(m);
    setMethodForm({
      name: m.name,
      code: m.code,
      minAmount: Number(m.minAmount),
      maxAmount: Number(m.maxAmount),
      feePercentage: Number(m.feePercentage),
      feeFlat: Number(m.feeFlat),
      isActive: m.isActive,
      sortOrder: m.sortOrder,
    });
    setMethodActionError(null);
    setIsMethodModalOpen(true);
  };

  const handleSaveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMethod(true);
    setMethodActionError(null);

    try {
      if (!methodForm.name.trim() || !methodForm.code.trim()) {
        setMethodActionError(lang === 'bn' ? 'নাম এবং কোড দেওয়া আবশ্যক' : 'Name and Code are required');
        setIsSavingMethod(false);
        return;
      }

      if (Number(methodForm.minAmount) < 0 || Number(methodForm.maxAmount) < Number(methodForm.minAmount)) {
        setMethodActionError(lang === 'bn' ? 'সর্বোচ্চ উইথড্র লিমিট অবশ্যই সর্বনিম্ন লিমিটের চেয়ে বড় বা সমান হতে হবে' : 'Max amount must be greater than or equal to min amount');
        setIsSavingMethod(false);
        return;
      }

      const payload = {
        name: methodForm.name.trim(),
        code: methodForm.code.trim().toUpperCase(),
        minAmount: Number(methodForm.minAmount),
        maxAmount: Number(methodForm.maxAmount),
        feePercentage: Number(methodForm.feePercentage),
        feeFlat: Number(methodForm.feeFlat),
        isActive: methodForm.isActive,
        sortOrder: Number(methodForm.sortOrder),
      };

      if (editingMethod) {
        await api.patch(`/wallet/admin/withdrawal-methods/${editingMethod.id}`, payload);
        setTopNotification({
          type: 'success',
          text: lang === 'bn' ? `'${payload.name}' মেথডের লিমিট ও তথ্য সফলভাবে আপডেট হয়েছে` : `'${payload.name}' updated successfully`,
        });
      } else {
        await api.post('/wallet/admin/withdrawal-methods', payload);
        setTopNotification({
          type: 'success',
          text: lang === 'bn' ? `'${payload.name}' নতুন উইথড্র মেথড সফলভাবে যোগ করা হয়েছে` : `'${payload.name}' created successfully`,
        });
      }

      setIsMethodModalOpen(false);
      fetchWithdrawalMethods();
      setTimeout(() => setTopNotification(null), 5000);
    } catch (err: any) {
      setMethodActionError(err.response?.data?.message || (lang === 'bn' ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Save failed'));
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleToggleMethod = async (m: WithdrawalMethodItem) => {
    try {
      await api.patch(`/wallet/admin/withdrawal-methods/${m.id}/toggle`);
      fetchWithdrawalMethods();
      setTopNotification({
        type: 'success',
        text: lang === 'bn' ? `'${m.name}' স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে` : `'${m.name}' status toggled`,
      });
      setTimeout(() => setTopNotification(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteMethod = async (m: WithdrawalMethodItem) => {
    if (!confirm(lang === 'bn' ? `আপনি কি নিশ্চিত '${m.name}' মেথডটি মুছতে বা নিষ্ক্রিয় করতে চান?` : `Are you sure you want to delete/deactivate '${m.name}'?`)) {
      return;
    }
    try {
      await api.delete(`/wallet/admin/withdrawal-methods/${m.id}`);
      fetchWithdrawalMethods();
      setTopNotification({
        type: 'success',
        text: lang === 'bn' ? `'${m.name}' সফলভাবে সরানো/নিষ্ক্রিয় করা হয়েছে` : `'${m.name}' deleted/deactivated`,
      });
      setTimeout(() => setTopNotification(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete method');
    }
  };

  const getMethodBrand = (code: string, name: string) => {
    const c = code?.toUpperCase() || '';
    const n = name?.toLowerCase() || '';
    if (c.includes('BKASH') || n.includes('bkash')) {
      return {
        border: 'border-[#E2136E]/40 dark:border-[#E2136E]/30',
        badge: 'bg-[#E2136E]/15 text-[#E2136E] border-[#E2136E]/30',
        accentBg: 'bg-[#E2136E]/10',
        accentText: 'text-[#E2136E]',
        label: 'bKash',
        isMobile: true,
      };
    }
    if (c.includes('NAGAD') || n.includes('nagad')) {
      return {
        border: 'border-[#F7941D]/40 dark:border-[#F7941D]/30',
        badge: 'bg-[#F7941D]/15 text-[#F7941D] border-[#F7941D]/30',
        accentBg: 'bg-[#F7941D]/10',
        accentText: 'text-[#F7941D]',
        label: 'Nagad',
        isMobile: true,
      };
    }
    if (c.includes('ROCKET') || n.includes('rocket')) {
      return {
        border: 'border-[#8C3494]/40 dark:border-[#8C3494]/30',
        badge: 'bg-[#8C3494]/15 text-[#8C3494] border-[#8C3494]/30',
        accentBg: 'bg-[#8C3494]/10',
        accentText: 'text-[#8C3494]',
        label: 'Rocket',
        isMobile: true,
      };
    }
    return {
      border: 'border-blue-500/40 dark:border-blue-500/30',
      badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      accentBg: 'bg-blue-500/10',
      accentText: 'text-blue-600 dark:text-blue-400',
      label: 'Bank',
      isMobile: false,
    };
  };

  const handleOpenModal = (req: WithdrawalRequest, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(req);
    setActionType(type);
    setAdminNotes('');
    setPayoutTrxId('');
    setFeedbackMsg(null);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setActionType(null);
    setFeedbackMsg(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest || !actionType) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      let combinedNotes = adminNotes.trim();
      if (actionType === 'APPROVE' && payoutTrxId.trim()) {
        combinedNotes = `Payout TrxID: ${payoutTrxId.trim()}. ${combinedNotes}`;
      }

      if (actionType === 'REJECT' && !combinedNotes) {
        setFeedbackMsg({
          type: 'error',
          text: lang === 'bn' ? 'বাতিলের সুনির্দিষ্ট কারণ আবশ্যক' : 'Rejection reason is mandatory',
        });
        setIsSubmitting(false);
        return;
      }

      const res = await api.patch(`/wallet/admin/withdrawal/${selectedRequest.id}/review`, {
        action: actionType,
        adminNotes: combinedNotes,
      });
      const data = unwrap(res);

      if (data || res) {
        setFeedbackMsg({
          type: 'success',
          text:
            actionType === 'APPROVE'
              ? lang === 'bn' ? 'উইথড্রয়াল সফলভাবে অনুমোদিত ও পরিশোধিত চিহ্নিত হয়েছে' : 'Withdrawal approved & marked paid'
              : lang === 'bn' ? 'উইথড্রয়াল বাতিল হয়েছে এবং ইউজারের ব্যালেন্স ফেরত দেওয়া হয়েছে' : 'Withdrawal rejected & refunded to user',
        });
        setTimeout(() => {
          handleCloseModal();
          fetchWithdrawals();
        }, 1000);
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || (lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Action failed'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = withdrawals.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchUser =
      item.user?.uniqueUserId?.toLowerCase().includes(q) ||
      item.user?.phone?.includes(q) ||
      item.destinationAccount?.toLowerCase().includes(q) ||
      item.bankName?.toLowerCase().includes(q) ||
      item.accountHolderName?.toLowerCase().includes(q) ||
      item.accountNumber?.toLowerCase().includes(q) ||
      item.routingNumber?.toLowerCase().includes(q) ||
      item.id?.toLowerCase().includes(q);
    return matchUser;
  });

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;
  const activeMethodsCount = methods.filter((m) => m.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Notification */}
      {topNotification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            topNotification.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {topNotification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{topNotification.text}</span>
          </div>
          <button
            onClick={() => setTopNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {activeTab === 'requests' ? (
              <ArrowUpCircle className="w-7 h-7 text-indigo-500" />
            ) : (
              <Sliders className="w-7 h-7 text-indigo-500" />
            )}
            <span>
              {activeTab === 'requests'
                ? lang === 'bn' ? 'উইথড্র রিকোয়েস্ট পর্যালোচনা' : 'Withdrawal Requests Review'
                : lang === 'bn' ? 'উইথড্র মেথড ও লিমিট সেটিংস' : 'Withdrawal Methods & Limits Settings'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'requests'
              ? lang === 'bn'
                ? 'ইউজারদের উত্তোলনের আবেদন যাচাই করুন এবং পেমেন্ট সম্পন্ন করে পেআউট রেফারেন্স সংরক্ষণ করুন।'
                : 'Review user withdrawal requests, mark payouts, or refund back to user on rejection.'
              : lang === 'bn'
                ? 'বিকাশ, নগদ, রকেট এবং ব্যাংকের সর্বনিম্ন ও সর্বোচ্চ উইথড্র লিমিট এবং চার্জ এখানে পরিবর্তন করুন।'
                : 'Configure min/max withdrawal amounts and fees for bKash, Nagad, Rocket, and Bank.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'requests' && statusFilter === 'PENDING' && (
            <button
              onClick={handleClaimNext}
              disabled={claimingTask}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              title={lang === 'bn' ? 'অ্যালগরিদম অনুসারে পরবর্তী অপেক্ষমাণ কাজ নিন' : 'Claim next pending withdrawal'}
            >
              <Sparkles className={`w-4 h-4 ${claimingTask ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'পরবর্তী কাজ নিন' : 'Claim Next'}</span>
            </button>
          )}

          {activeTab === 'settings' && (
            <button
              onClick={handleOpenAddMethod}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? '+ নতুন মেথড' : '+ Add Method'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === 'requests') fetchWithdrawals();
              else fetchWithdrawalMethods();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || loadingMethods) ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>{lang === 'bn' ? 'উইথড্র রিকোয়েস্ট সমূহ' : 'Withdrawal Requests'}</span>
          {pendingCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'requests'
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse'
              }`}
            >
              {pendingCount} {lang === 'bn' ? 'পেন্ডিং' : 'Pending'}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            fetchWithdrawalMethods();
          }}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{lang === 'bn' ? 'উইথড্র মেথড ও লিমিট সেটিংস' : 'Methods & Limits Settings'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {activeMethodsCount} {lang === 'bn' ? 'সক্রিয়' : 'Active'}
          </span>
        </button>
      </div>

      {activeTab === 'requests' && (
        <>
      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st === 'PENDING'
                ? lang === 'bn' ? 'অপেক্ষমাণ (Pending)' : 'Pending'
                : st === 'APPROVED'
                ? lang === 'bn' ? 'অনুমোদিত (Paid)' : 'Paid'
                : st === 'REJECTED'
                ? lang === 'bn' ? 'বাতিল ও রিফান্ড (Rejected)' : 'Rejected'
                : lang === 'bn' ? 'সকল (All)' : 'All'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'ইউজার আইডি, ফোন, অ্যাকাউন্ট...' : 'Search UserID, phone, account...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Destination Account</th>
                <th className="px-4 py-3.5">Requested</th>
                <th className="px-4 py-3.5">Fee</th>
                <th className="px-4 py-3.5">Net Payout</th>
                <th className="px-4 py-3.5">Assigned / Queue</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>{lang === 'bn' ? 'তথ্য লোড হচ্ছে...' : 'Loading withdrawal requests...'}</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    {lang === 'bn' ? 'কোনো উইথড্র রিকোয়েস্ট পাওয়া যায়নি।' : 'No withdrawal requests found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                      <div className="font-semibold text-amber-600 dark:text-amber-400">
                        {req.user?.uniqueUserId}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {req.user?.firstName} {req.user?.lastName} ({req.user?.phone})
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {req.method?.name || 'Manual Payout'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-[300px]">
                      {req.bankName ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{req.bankName}</span>
                          </div>
                          <div className="font-mono text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="font-semibold">{req.accountNumber || req.destinationAccount}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(req.accountNumber || req.destinationAccount, `row-ac-${req.id}`)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                              title="Copy A/C"
                            >
                              {copiedField === `row-ac-${req.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {req.accountHolderName && (
                            <div className="text-[11px] text-slate-500 truncate">
                              Holder: <span className="font-medium text-slate-700 dark:text-slate-300">{req.accountHolderName}</span>
                            </div>
                          )}
                          {req.routingNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Routing: {req.routingNumber} {req.branchName ? `(${req.branchName})` : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{req.destinationAccount}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(req.destinationAccount, `row-num-${req.id}`)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                              title="Copy Number"
                            >
                              {copiedField === `row-num-${req.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          {req.accountType && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {req.accountType}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                      ৳{parseFloat(req.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3.5 text-rose-500 font-medium">
                      -৳{parseFloat(req.fee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      ৳{parseFloat(req.netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Assigned / Queue Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {req.assignedToId ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {req.assignedToId === user?.id ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <UserCheck className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'আমার কাজ' : 'My Task'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span>👤 {req.assignedTo?.firstName || 'Staff'}</span>
                              </span>
                            )}
                          </div>
                          {req.lockedUntil && new Date(req.lockedUntil) > new Date() && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-amber-500">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Locked</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {lang === 'bn' ? 'উন্মুক্ত পুল' : 'Open Pool'}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {req.status === 'APPROVED' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : req.status === 'REJECTED' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{req.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(req.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3.5 text-right">
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
                                onClick={() => handleOpenModal(req, 'APPROVE')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                              >
                                {lang === 'bn' ? 'পেইড' : 'Paid'}
                              </button>
                              <button
                                onClick={() => handleOpenModal(req, 'REJECT')}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                              >
                                {lang === 'bn' ? 'বাতিল' : 'Reject'}
                              </button>
                              {(req.assignedToId === user?.id || isSuperAdmin()) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setHandoffTask(req)}
                                    title={lang === 'bn' ? 'সহকর্মীকে হস্তান্তর করুন' : 'Reassign task'}
                                    className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs transition cursor-pointer"
                                  >
                                    <Shuffle className="w-3.5 h-3.5" />
                                  </button>
                                  {req.assignedToId && (
                                    <button
                                      type="button"
                                      onClick={() => handleReleaseTask(req.id)}
                                      title={lang === 'bn' ? 'পুলে রিলিজ করুন' : 'Release to pool'}
                                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs transition cursor-pointer"
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
                        <span className="text-slate-400 text-[11px] italic">
                          {req.adminNotes ? `Ref: ${req.adminNotes}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* TAB 2: WITHDRAWAL METHODS & LIMITS SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                <Sliders className="w-6 h-6" />
              </span>
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'উইথড্র মেথড, সর্বনিম্ন ও সর্বোচ্চ লিমিট কনফিগারেশন' : 'Withdrawal Methods & Limits Configuration'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                  {lang === 'bn'
                    ? 'এখানে প্রতিটি পেমেন্ট মেথডের (বিকাশ, নগদ, রকেট, ব্যাংক ইত্যাদি) সর্বনিম্ন ও সর্বোচ্চ উইথড্র লিমিট (Min/Max Amount) এবং উইথড্র ফি পরিবর্তন করতে পারবেন। সংরক্ষিত সেটিংস তাৎক্ষণিকভাবে ইউজারের উইথড্র পেজে কার্যকর হবে।'
                    : 'Configure minimum/maximum withdrawal limits and fees per payout method (bKash, Nagad, Rocket, Bank). Changes apply instantly on user withdrawal screens.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddMethod}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shrink-0 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? '+ নতুন উইথড্র মেথড যোগ করুন' : '+ Add Withdrawal Method'}</span>
            </button>
          </div>

          {/* Quick Tip / Info Box */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {lang === 'bn' ? 'কীভাবে লিমিট কাজ করে?' : 'How do limits work?'}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                {lang === 'bn'
                  ? 'প্রতিটি মেথডের জন্য আপনি আলাদা সর্বনিম্ন ও সর্বোচ্চ টাকার পরিমাণ নির্ধারণ করতে পারবেন (যেমন: বিকাশ ও নগদে সর্বনিম্ন ৳৫০ বা ৳১০০ এবং ব্যাংকে সর্বনিম্ন ৳৫০০)। ইউজার এই সীমার বাইরে উইথড্র সাবমিট করতে পারবে না।'
                  : 'You can set custom minimum and maximum withdrawal amounts for each method individually (e.g. bKash/Nagad min ৳50 or ৳100, Bank min ৳500). Users cannot submit withdrawals outside these limits.'}
              </p>
            </div>
          </div>

          {/* Methods Grid / Cards */}
          {loadingMethods ? (
            <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'উইথড্র মেথডসমূহ লোড হচ্ছে...' : 'Loading withdrawal methods...'}
              </p>
            </div>
          ) : methods.length === 0 ? (
            <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <CreditCard className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'কোনো উইথড্র মেথড পাওয়া যায়নি' : 'No withdrawal methods found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {lang === 'bn'
                  ? 'বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্ট যোগ করতে উপরের বাটনটি ক্লিক করুন।'
                  : 'Click the button above to add your bKash, Nagad, Rocket, or Bank withdrawal options.'}
              </p>
              <button
                onClick={handleOpenAddMethod}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'মেথড যোগ করুন' : 'Add Method'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {methods.map((m) => {
                const brand = getMethodBrand(m.code, m.name);
                const isMobile = brand.isMobile;
                const minVal = Number(m.minAmount);
                const maxVal = Number(m.maxAmount);
                const feePerc = Number(m.feePercentage);
                const feeFlat = Number(m.feeFlat);

                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-3xl border transition relative space-y-4 shadow-sm flex flex-col justify-between ${
                      m.isActive
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Row: Method Info & Toggle */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${brand.border} ${brand.accentBg}`}>
                            {isMobile ? (
                              <Smartphone className={`w-5 h-5 ${brand.accentText}`} />
                            ) : (
                              <Building2 className={`w-5 h-5 ${brand.accentText}`} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                              {m.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${brand.badge}`}>
                                {m.code}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ক্রম: {m.sortOrder}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Active Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleMethod(m)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            m.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
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

                      {/* Limits Display Box */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {lang === 'bn' ? 'উইথড্রয়াল লিমিট (Min - Max Limits)' : 'Withdrawal Limits'}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                              {lang === 'bn' ? 'সর্বনিম্ন (Min Amount)' : 'Min Limit'}
                            </span>
                            <div className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                              ৳{minVal.toLocaleString()}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-0.5">
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                              {lang === 'bn' ? 'সর্বোচ্চ (Max Amount)' : 'Max Limit'}
                            </span>
                            <div className="font-black text-indigo-700 dark:text-indigo-300 text-sm">
                              ৳{maxVal.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Fee and Requests Summary */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <div>
                            <span className="font-medium">{lang === 'bn' ? 'ফি:' : 'Fee:'} </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {feePerc > 0 && feeFlat > 0
                                ? `${feePerc}% + ৳${feeFlat}`
                                : feePerc > 0
                                ? `${feePerc}%`
                                : feeFlat > 0
                                ? `৳${feeFlat} Flat`
                                : lang === 'bn' ? 'ফ্রি (০%)' : 'Free (0%)'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{lang === 'bn' ? 'রিকোয়েস্ট:' : 'Requests:'} </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {m._count?.requests ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <button
                        onClick={() => handleOpenEditMethod(m)}
                        className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'এডিট ও লিমিট পরিবর্তন' : 'Edit & Change Limits'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMethod(m)}
                        className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                        title={lang === 'bn' ? 'মুছুন বা নিষ্ক্রিয় করুন' : 'Delete or Deactivate'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Method Edit / Create Modal */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingMethod
                      ? lang === 'bn'
                        ? `'${editingMethod.name}' লিমিট ও তথ্য এডিট করুন`
                        : `Edit '${editingMethod.name}' & Limits`
                      : lang === 'bn'
                        ? 'নতুন উইথড্র মেথড যোগ করুন'
                        : 'Add New Withdrawal Method'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'সর্বনিম্ন ও সর্বোচ্চ উত্তোলনের সীমা পরিবর্তন করুন'
                      : 'Set min/max withdrawal thresholds and payout fees'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMethodModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error feedback */}
            {methodActionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{methodActionError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveMethod} className="space-y-4">
              {/* Method Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মেথডের নাম *' : 'Method Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={methodForm.name}
                    onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                    placeholder="e.g. bKash Personal, Nagad, Bank"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মেথড কোড *' : 'Method Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={methodForm.code}
                    onChange={(e) => setMethodForm({ ...methodForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. BKASH, NAGAD, BANK"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* CRITICAL: Minimum & Maximum Withdrawal Limits */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-950/80 border border-indigo-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {lang === 'bn' ? 'উইথড্রয়াল লিমিট (টাকা)' : 'Withdrawal Limits (BDT)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Min Amount */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {lang === 'bn' ? 'সর্বনিম্ন উইথড্র অ্যামাউন্ট (৳) *' : 'Minimum Withdrawal (৳) *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={methodForm.minAmount}
                        onChange={(e) => setMethodForm({ ...methodForm, minAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400">প্রিসেট:</span>
                      {[50, 100, 200, 500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setMethodForm({ ...methodForm, minAmount: val })}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                            methodForm.minAmount === val
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          ৳{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max Amount */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {lang === 'bn' ? 'সর্বোচ্চ উইথড্র অ্যামাউন্ট (৳) *' : 'Maximum Withdrawal (৳) *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ৳
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="100"
                        value={methodForm.maxAmount}
                        onChange={(e) => setMethodForm({ ...methodForm, maxAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-white dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400">প্রিসেট:</span>
                      {[10000, 25000, 50000, 100000].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setMethodForm({ ...methodForm, maxAmount: val })}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                            methodForm.maxAmount === val
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          ৳{val / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'শতকরা ফি (Fee %)' : 'Fee Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={methodForm.feePercentage}
                    onChange={(e) => setMethodForm({ ...methodForm, feePercentage: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {lang === 'bn' ? 'যেমন: ১.৫% হলে ১.৫ লিখুন (ফ্রি হলে ০)' : 'e.g. 1.5 for 1.5% fee'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ফিক্সড ফি (Flat Fee ৳)' : 'Flat Fee (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={methodForm.feeFlat}
                    onChange={(e) => setMethodForm({ ...methodForm, feeFlat: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {lang === 'bn' ? 'নির্দিষ্ট ফিক্সড চার্জ থাকলে দিন' : 'Fixed charge per payout'}
                  </span>
                </div>
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'সিরিয়াল ক্রম (Sort Order)' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={methodForm.sortOrder}
                    onChange={(e) => setMethodForm({ ...methodForm, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={methodForm.isActive}
                      onChange={(e) => setMethodForm({ ...methodForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {lang === 'bn' ? 'মেথডটি সক্রিয় (Active) রাখুন' : 'Keep Method Active'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {lang === 'bn' ? 'লাইভ প্রিভিউ (ইউজার যা দেখবে)' : 'Live Preview'}
                </span>
                <p className="text-slate-700 dark:text-slate-300 font-semibold">
                  {lang === 'bn'
                    ? `ইউজার প্রতিবার সর্বনিম্ন ৳${Number(methodForm.minAmount).toLocaleString()} থেকে সর্বোচ্চ ৳${Number(methodForm.maxAmount).toLocaleString()} উত্তোলন করতে পারবেন।`
                    : `Users can withdraw between ৳${Number(methodForm.minAmount).toLocaleString()} and ৳${Number(methodForm.maxAmount).toLocaleString()} per transaction.`}
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMethodModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingMethod}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
                >
                  {isSavingMethod && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSavingMethod
                      ? lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'
                      : lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {actionType === 'APPROVE' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span>{lang === 'bn' ? 'উইথড্রয়াল পেআউট নিশ্চিত করুন' : 'Confirm Payout Approval'}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <span>{lang === 'bn' ? 'উইথড্রয়াল বাতিল ও রিফান্ড করুন' : 'Reject Withdrawal & Refund'}</span>
                  </>
                )}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Details Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-500 block text-[11px]">User ID:</span>
                  <span className="font-bold text-amber-500 text-xs">{selectedRequest.user?.uniqueUserId}</span>
                  <span className="text-slate-400 block text-[10px]">{selectedRequest.user?.firstName} {selectedRequest.user?.lastName} ({selectedRequest.user?.phone})</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Method:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRequest.method?.name}</span>
                </div>
              </div>

              {/* Bank Transfer Details Card */}
              {selectedRequest.bankName ? (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                      <Building2 className="w-4 h-4" />
                      <span>{selectedRequest.bankName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const info = `Bank: ${selectedRequest.bankName}\nA/C Number: ${selectedRequest.accountNumber || selectedRequest.destinationAccount}\nA/C Holder: ${selectedRequest.accountHolderName || ''}\nRouting: ${selectedRequest.routingNumber || ''}\nBranch: ${selectedRequest.branchName || ''}\nAmount: ৳${parseFloat(selectedRequest.netAmount).toFixed(2)}`;
                        handleCopy(info, 'modal-all-bank');
                      }}
                      className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 text-blue-700 dark:text-blue-300 font-semibold text-[10px] flex items-center gap-1 transition"
                    >
                      {copiedField === 'modal-all-bank' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'modal-all-bank' ? 'Copied All' : 'Copy All Info'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-blue-200/50 dark:border-blue-800/40 text-[11px]">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                      <div>
                        <span className="text-slate-400 block text-[10px]">A/C Number:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {selectedRequest.accountNumber || selectedRequest.destinationAccount}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedRequest.accountNumber || selectedRequest.destinationAccount, 'modal-ac')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                        title="Copy A/C"
                      >
                        {copiedField === 'modal-ac' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                      <div>
                        <span className="text-slate-400 block text-[10px]">A/C Holder Name:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {selectedRequest.accountHolderName || 'N/A'}
                        </span>
                      </div>
                      {selectedRequest.accountHolderName && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedRequest.accountHolderName || '', 'modal-holder')}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                          title="Copy Holder Name"
                        >
                          {copiedField === 'modal-holder' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Routing Number:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {selectedRequest.routingNumber || 'N/A'}
                        </span>
                      </div>
                      {selectedRequest.routingNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedRequest.routingNumber || '', 'modal-routing')}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                          title="Copy Routing Number"
                        >
                          {copiedField === 'modal-routing' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                      <span className="text-slate-400 block text-[10px]">Branch:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-xs">
                        {selectedRequest.branchName || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mobile Banking Details */
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        {selectedRequest.method?.name} {selectedRequest.accountType ? `(${selectedRequest.accountType})` : ''}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {selectedRequest.destinationAccount}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedRequest.destinationAccount, 'modal-mobile')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    {copiedField === 'modal-mobile' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'modal-mobile' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              {/* Financial Calculation Row */}
              <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
                  <span>Requested Amount:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">৳{parseFloat(selectedRequest.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-xs">
                  <span>Platform Fee:</span>
                  <span className="text-rose-500 font-medium">-৳{parseFloat(selectedRequest.fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 items-center">
                  <span className="font-bold text-slate-800 dark:text-slate-100">Net Payout to Send:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                      ৳{parseFloat(selectedRequest.netAmount).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(parseFloat(selectedRequest.netAmount).toFixed(2), 'modal-net-amt')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
                      title="Copy Net Amount"
                    >
                      {copiedField === 'modal-net-amt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Specific Inputs */}
            {actionType === 'APPROVE' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'পেআউট রেফারেন্স বা ট্রানজ্যাকশন আইডি' : 'Payout Reference / Transaction ID'}
                  </label>
                  <input
                    type="text"
                    value={payoutTrxId}
                    onChange={(e) => setPayoutTrxId(e.target.value)}
                    placeholder={lang === 'bn' ? 'যথা: bKash TrxID বা Bank EFT/NPSB Ref' : 'e.g. bKash TrxID or Bank EFT reference'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'অ্যাডমিন নোট (ঐচ্ছিক)' : 'Admin Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={lang === 'bn' ? 'যথা: ম্যানুয়াল পেমেন্ট সফল' : 'e.g. Sent via agent app'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-400">
                  {lang === 'bn'
                    ? '⚠️ বাতিল করলে কর্তনকৃত সম্পূর্ণ পরিমাণ ৳' +
                      parseFloat(selectedRequest.amount).toFixed(2) +
                      ' ইউজারের মূল অ্যাভেইলেবল ব্যালেন্সে স্বয়ংক্রিয়ভাবে রিফান্ড হবে।'
                    : '⚠️ Rejecting will automatically refund the full amount of ৳' +
                      parseFloat(selectedRequest.amount).toFixed(2) +
                      ' back to user available balance.'}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                    {lang === 'bn' ? 'বাতিলের কারণ লিখুন (আবশ্যক)' : 'Rejection Reason (Required)'}
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={lang === 'bn' ? 'যথা: ভুল বা বন্ধ অ্যাকাউন্ট নাম্বার অথবা সিকিউরিটি হোল্ড।' : 'e.g. Invalid account number or inactive mobile wallet.'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-900/50 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow transition flex items-center gap-2 ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {actionType === 'APPROVE'
                    ? lang === 'bn' ? 'পেমেন্ট নিশ্চিত করুন' : 'Confirm Payout'
                    : lang === 'bn' ? 'বাতিল ও রিফান্ড নিশ্চিত করুন' : 'Confirm Rejection'}
                </span>
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
          taskType="WITHDRAWAL"
          taskId={handoffTask.id}
          taskTitle={`উইথড্রয়াল: ৳${parseFloat(handoffTask.netAmount).toLocaleString()} (@${handoffTask.user?.uniqueUserId})`}
          currentStaffId={user?.id}
          onSuccess={() => {
            setFeedbackMsg({
              type: 'success',
              text: lang === 'bn' ? 'কাজটি সফলভাবে সহকর্মীকে হস্তান্তর করা হয়েছে।' : 'Task reassigned to colleague successfully.',
            });
            fetchWithdrawals();
          }}
        />
      )}
    </div>
  );
}

