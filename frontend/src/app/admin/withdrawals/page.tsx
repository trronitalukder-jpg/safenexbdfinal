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
} from 'lucide-react';

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

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpCircle className="w-7 h-7 text-indigo-500" />
            <span>{lang === 'bn' ? 'উইথড্র রিকোয়েস্ট পর্যালোচনা' : 'Withdrawal Requests Review'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'ইউজারদের উত্তোলনের আবেদন যাচাই করুন এবং পেমেন্ট সম্পন্ন করে পেআউট রেফারেন্স সংরক্ষণ করুন।'
              : 'Review user withdrawal requests, mark payouts, or refund back to user on rejection.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {statusFilter === 'PENDING' && (
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

          <button
            onClick={fetchWithdrawals}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

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

