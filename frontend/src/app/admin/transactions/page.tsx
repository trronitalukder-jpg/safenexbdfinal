'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowLeftRight,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Tag,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface TransactionRecord {
  id: string;
  trackingNumber: string;
  senderId: string;
  receiverId: string;
  productId?: string | null;
  transactionType: string;
  amount: string | number;
  commissionAmount?: string | number;
  commission?: string | number;
  totalRequired?: string | number;
  status: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  workExpectedDuration?: string | null;
  workCompletedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    title: string;
  } | null;
  sender: {
    id: string;
    uniqueUserId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
  receiver: {
    id: string;
    uniqueUserId: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
  dispute?: {
    id: string;
    status: string;
    reason: string;
    adminNotes?: string | null;
  } | null;
}

const unwrap = (res: any) => {
  if (res && res.data !== undefined) return res.data;
  return res;
};

export default function AdminTransactionsPage() {
  const { lang } = useLanguage();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector Modal
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '50');

      const res: any = await api.get(`/transactions/admin/all?${params.toString()}`);
      const data = unwrap(res);

      if (data?.items && Array.isArray(data.items)) {
        setTransactions(data.items);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalCount(data.meta?.total || data.items.length);
      } else if (Array.isArray(data)) {
        setTransactions(data);
        setTotalPages(1);
        setTotalCount(data.length);
      } else if (res?.items && Array.isArray(res.items)) {
        setTransactions(res.items);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalCount(res.meta?.total || res.items.length);
      } else {
        setTransactions([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, page]);

  const filteredItems = transactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const tracking = (t.trackingNumber || '').toLowerCase();
    const id = (t.id || '').toLowerCase();
    const productTitle = (t.product?.title || '').toLowerCase();
    const txType = (t.transactionType || '').toLowerCase();
    const senderId = (t.sender?.uniqueUserId || '').toLowerCase();
    const receiverId = (t.receiver?.uniqueUserId || '').toLowerCase();
    const senderPhone = (t.sender?.phone || '').toLowerCase();
    const receiverPhone = (t.receiver?.phone || '').toLowerCase();
    const senderName = `${t.sender?.firstName || ''} ${t.sender?.lastName || ''}`.toLowerCase();
    const receiverName = `${t.receiver?.firstName || ''} ${t.receiver?.lastName || ''}`.toLowerCase();

    return (
      tracking.includes(q) ||
      id.includes(q) ||
      productTitle.includes(q) ||
      txType.includes(q) ||
      senderId.includes(q) ||
      receiverId.includes(q) ||
      senderPhone.includes(q) ||
      receiverPhone.includes(q) ||
      senderName.includes(q) ||
      receiverName.includes(q)
    );
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'RELEASED':
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
      case 'DISPUTED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse';
      case 'WORKING':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800';
      case 'WORK_COMPLETED':
      case 'WORK_DONE_SUBMITTED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800';
      case 'HOLD':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800';
      case 'REQUESTED':
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{lang === 'bn' ? 'সকল ট্রানজ্যাকশন ও এসক্রো রেকর্ড' : 'All Transactions & Escrow Records'}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn'
                ? `প্ল্যাটফর্মের সকল লেনদেন, এসক্রো স্ট্যাটাস ও কমিশনের হিসাব দেখুন (মোট: ${totalCount} টি)।`
                : `Inspect all marketplace deals, pay requests, escrow states, and fees (Total: ${totalCount}).`}
            </p>
          </div>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'ALL', label: lang === 'bn' ? 'সব (All)' : 'All' },
            { key: 'RELEASED', label: lang === 'bn' ? 'সম্পন্ন (Completed)' : 'Completed' },
            { key: 'DISPUTED', label: lang === 'bn' ? 'ডিসপ্যুট (Disputed)' : 'Disputed' },
            { key: 'HOLD', label: lang === 'bn' ? 'হোল্ড (Hold)' : 'Hold' },
            { key: 'WORKING', label: lang === 'bn' ? 'চলমান (Working)' : 'Working' },
            { key: 'WORK_COMPLETED', label: lang === 'bn' ? 'কাজ জমা (Submitted)' : 'Submitted' },
            { key: 'REQUESTED', label: lang === 'bn' ? 'অনুরোধ (Requested)' : 'Requested' },
            { key: 'REJECTED', label: lang === 'bn' ? 'বাতিল (Rejected)' : 'Rejected' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => {
                setStatusFilter(st.key);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === st.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'ট্র্যাকিং নং, ইউজার আইডি, ফোন...' : 'Search Trx No, User ID, phone...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3.5">{lang === 'bn' ? 'ট্র্যাকিং নং ও বিবরণ' : 'Tracking No & Details'}</th>
                <th className="px-4 py-3.5">{lang === 'bn' ? 'ক্রেতা / প্রেরক (Buyer)' : 'Buyer (Sender)'}</th>
                <th className="px-4 py-3.5">{lang === 'bn' ? 'বিক্রেতা / প্রাপক (Seller)' : 'Seller (Receiver)'}</th>
                <th className="px-4 py-3.5">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                <th className="px-4 py-3.5">{lang === 'bn' ? 'কমিশন ফি' : 'Fee'}</th>
                <th className="px-4 py-3.5">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="px-4 py-3.5">{lang === 'bn' ? 'তারিখ' : 'Created'}</th>
                <th className="px-5 py-3.5 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'View'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>{lang === 'bn' ? 'ট্রানজ্যাকশন লোড হচ্ছে...' : 'Loading transactions...'}</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    {lang === 'bn' ? 'কোনো ট্রানজ্যাকশন পাওয়া যায়নি।' : 'No transactions found.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((tx) => {
                  const feeVal = parseFloat((tx.commissionAmount || tx.commission || 0).toString());
                  const amtVal = parseFloat(tx.amount.toString());
                  const detailTitle =
                    tx.product?.title ||
                    tx.transactionType?.replace(/_/g, ' ') ||
                    'General Transaction';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      {/* Col 1: Tracking No & Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-slate-900 dark:text-white select-all">
                          {tx.trackingNumber || tx.id.substring(0, 14)}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[220px]">
                          {detailTitle}
                        </div>
                      </td>

                      {/* Col 2: Buyer (Sender) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {tx.sender?.avatarUrl ? (
                            <img
                              src={getImageUrl(tx.sender.avatarUrl)}
                              alt="Sender"
                              className="w-7 h-7 rounded-full object-cover border border-blue-500/30 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {tx.sender?.firstName?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-blue-600 dark:text-blue-400">
                              {tx.sender?.uniqueUserId}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {tx.sender?.firstName} {tx.sender?.lastName}
                            </div>
                            {tx.sender?.phone && (
                              <div className="text-[9px] text-slate-400 font-mono">
                                {tx.sender.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Col 3: Seller (Receiver) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {tx.receiver?.avatarUrl ? (
                            <img
                              src={getImageUrl(tx.receiver.avatarUrl)}
                              alt="Receiver"
                              className="w-7 h-7 rounded-full object-cover border border-emerald-500/30 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {tx.receiver?.firstName?.charAt(0) || 'R'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              {tx.receiver?.uniqueUserId}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {tx.receiver?.firstName} {tx.receiver?.lastName}
                            </div>
                            {tx.receiver?.phone && (
                              <div className="text-[9px] text-slate-400 font-mono">
                                {tx.receiver.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Col 4: Amount */}
                      <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white text-sm">
                        ৳{amtVal.toFixed(2)}
                      </td>

                      {/* Col 5: Fee */}
                      <td className="px-4 py-3.5 font-bold text-rose-600 dark:text-rose-400">
                        {feeVal > 0 ? `৳${feeVal.toFixed(2)}` : '৳0.00'}
                      </td>

                      {/* Col 6: Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusBadge(
                            tx.status,
                          )}`}
                        >
                          {tx.status === 'RELEASED' || tx.status === 'COMPLETED' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : tx.status === 'DISPUTED' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : tx.status === 'REJECTED' || tx.status === 'CANCELLED' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{tx.status}</span>
                        </span>
                      </td>

                      {/* Col 7: Date */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                        {new Date(tx.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Col 8: Action */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTx(tx)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} (Total: {totalCount})
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 font-bold transition"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 font-bold transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>{lang === 'bn' ? 'ট্রানজ্যাকশন বিস্তারিত তথ্য' : 'Transaction Details'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Main Info Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white select-all">
                    {selectedTx.trackingNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusBadge(selectedTx.status)}`}>
                    {selectedTx.status}
                  </span>
                </div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedTx.product?.title || selectedTx.transactionType.replace(/_/g, ' ')}
                </div>
                <div className="text-slate-400 text-[10px] font-mono">
                  ID: {selectedTx.id}
                </div>
              </div>

              {/* Buyer and Seller Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-2">
                  <div className="font-bold text-blue-600 dark:text-blue-400">Buyer (Sender / Payer)</div>
                  <div className="flex items-center gap-2">
                    {selectedTx.sender?.avatarUrl ? (
                      <img
                        src={getImageUrl(selectedTx.sender.avatarUrl)}
                        alt="Buyer"
                        className="w-8 h-8 rounded-full object-cover border border-blue-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {selectedTx.sender?.firstName?.charAt(0) || 'B'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {selectedTx.sender?.uniqueUserId}
                      </div>
                      <div className="text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedTx.sender?.firstName} {selectedTx.sender?.lastName}
                      </div>
                      {selectedTx.sender?.phone && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {selectedTx.sender.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-2">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">Seller (Receiver / Payee)</div>
                  <div className="flex items-center gap-2">
                    {selectedTx.receiver?.avatarUrl ? (
                      <img
                        src={getImageUrl(selectedTx.receiver.avatarUrl)}
                        alt="Seller"
                        className="w-8 h-8 rounded-full object-cover border border-emerald-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {selectedTx.receiver?.firstName?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedTx.receiver?.uniqueUserId}
                      </div>
                      <div className="text-[11px] text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedTx.receiver?.firstName} {selectedTx.receiver?.lastName}
                      </div>
                      {selectedTx.receiver?.phone && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {selectedTx.receiver.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
                  <span>Transaction Deal Amount:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ৳{parseFloat(selectedTx.amount.toString()).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
                  <span>Platform Commission Fee:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    ৳{parseFloat((selectedTx.commissionAmount || selectedTx.commission || 0).toString()).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                  <span>Buyer Total Paid (Escrow Held):</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    ৳{parseFloat((selectedTx.totalRequired || (parseFloat(selectedTx.amount.toString()) + parseFloat((selectedTx.commissionAmount || 0).toString()))).toString()).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dispute Alert if any */}
              {selectedTx.dispute && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl space-y-1 text-xs">
                  <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Dispute Active: {selectedTx.dispute.status}</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    Reason: {selectedTx.dispute.reason}
                  </div>
                  {selectedTx.dispute.adminNotes && (
                    <div className="text-slate-500 text-[11px]">
                      Admin Notes: {selectedTx.dispute.adminNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <div>Created: {new Date(selectedTx.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(selectedTx.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
