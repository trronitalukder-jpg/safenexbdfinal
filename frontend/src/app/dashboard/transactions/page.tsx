'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

export default function MyTransactionsPage() {
  const { user } = useAuthStore();
  const { lang } = useLanguage();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTransactions = () => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/transactions/my${query}`)
      .then((res: any) => setTransactions(res.items || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'আমার লেনদেনসমূহ' : 'My Safe Transactions'}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'আপনার শুরু করা বা প্রাপ্ত সকল নিরাপদ এসক্রো ট্রানজ্যাকশন' : 'Safe escrow deals where you are the buyer or seller'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="WORKING">Working</option>
            <option value="WORK_COMPLETED">Work Completed</option>
            <option value="HOLD">Hold (Escrow)</option>
            <option value="RELEASED">Released</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 py-6 text-center">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'কোনো ট্রানজ্যাকশন রেকর্ড নেই' : 'No transactions found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isBuyer = tx.senderId === user?.id;
            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-600">{tx.trackingNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {isBuyer ? 'BUYER' : 'SELLER'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tx.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-700' :
                      tx.status === 'HOLD' ? 'bg-amber-100 text-amber-700' :
                      tx.status === 'DISPUTED' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {tx.status}
                    </span>
                  </div>

                  {(() => {
                    const counterparty = isBuyer ? tx.receiver : tx.sender;
                    return (
                      <Link
                        href={`/users/${counterparty?.uniqueUserId || counterparty?.id}`}
                        className="flex items-center gap-2 pt-1 hover:opacity-80 transition cursor-pointer group"
                        title={lang === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
                      >
                        {counterparty?.avatarUrl ? (
                          <img
                            src={getImageUrl(counterparty.avatarUrl)}
                            alt={counterparty.firstName || 'User'}
                            className="w-6 h-6 rounded-full object-cover border border-sky-500/30 flex-shrink-0 group-hover:ring-1 group-hover:ring-sky-500 transition"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 group-hover:ring-1 group-hover:ring-sky-500 transition">
                            {counterparty?.firstName?.charAt(0) || (isBuyer ? 'S' : 'B')}
                          </div>
                        )}
                        <div className="text-slate-500 text-xs">
                          {isBuyer ? (
                            <span>Seller: <strong className="text-slate-900 dark:text-white group-hover:text-sky-600 transition">{counterparty?.firstName ? `${counterparty.firstName} ${counterparty.lastName || ''}`.trim() : counterparty?.uniqueUserId}</strong> {counterparty?.firstName && <span className="font-mono text-sky-600">({counterparty?.uniqueUserId})</span>}</span>
                          ) : (
                            <span>Buyer: <strong className="text-slate-900 dark:text-white group-hover:text-sky-600 transition">{counterparty?.firstName ? `${counterparty.firstName} ${counterparty.lastName || ''}`.trim() : counterparty?.uniqueUserId}</strong> {counterparty?.firstName && <span className="font-mono text-sky-600">({counterparty?.uniqueUserId})</span>}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      ৳ {Number(tx.amount).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Fee: ৳ {Number(tx.commissionAmount)}
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/chat`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white font-semibold transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Deal</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

