'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Search, Filter, ArrowRight, ArrowLeftRight, Clock, PlusCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

export default function TransactionsMarketplacePage() {
  const { lang, t } = useLanguage();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/transactions/admin/all?limit=20')
      .then((res: any) => setTransactions(res.items || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'bn' ? 'মার্কেটপ্লেস এসক্রো' : 'Safe Escrow Marketplace'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'নিরাপদ লেনদেন মার্কেটপ্লেস' : 'Safe Transactions Hub'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'বায়ার ও সেলারের মধ্যে মধ্যস্থতাকৃত সকল নিরাপদ লেনদেন' : 'Peer-to-peer arbitrated safe transactions protected by SafnexBD'}
          </p>
        </div>

        <Link
          href="/dashboard/chat"
          className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-sky-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন লেনদেন শুরু করুন' : 'Start Safe Transaction'}</span>
        </Link>
      </div>

      {/* Transactions Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'এখনো কোনো লেনদেন রেকর্ড নেই' : 'No transactions recorded yet'}</p>
          <Link href="/dashboard/chat" className="text-xs font-semibold text-sky-600 hover:underline">
            {lang === 'bn' ? 'প্রথম নিরাপদ লেনদেন শুরু করুন' : 'Start your first transaction'}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-600">{tx.trackingNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {tx.transactionType}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tx.status === 'RELEASED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                    tx.status === 'HOLD' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                    tx.status === 'DISPUTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                    'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {tx.sender?.avatarUrl ? (
                      <img
                        src={getImageUrl(tx.sender.avatarUrl)}
                        alt="Buyer"
                        className="w-5 h-5 rounded-full object-cover border border-sky-500/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[8px] flex items-center justify-center flex-shrink-0">
                        {tx.sender?.firstName?.charAt(0) || 'B'}
                      </div>
                    )}
                    <span>Buyer: <strong className="font-mono text-slate-700 dark:text-slate-300">{tx.sender?.uniqueUserId}</strong></span>
                  </div>
                  <span>➔</span>
                  <div className="flex items-center gap-1.5">
                    {tx.receiver?.avatarUrl ? (
                      <img
                        src={getImageUrl(tx.receiver.avatarUrl)}
                        alt="Seller"
                        className="w-5 h-5 rounded-full object-cover border border-emerald-500/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[8px] flex items-center justify-center flex-shrink-0">
                        {tx.receiver?.firstName?.charAt(0) || 'S'}
                      </div>
                    )}
                    <span>Seller: <strong className="font-mono text-slate-700 dark:text-slate-300">{tx.receiver?.uniqueUserId}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">৳ {Number(tx.amount).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400">Commission: ৳ {Number(tx.commissionAmount)}</div>
                </div>

                <Link
                  href={`/dashboard/chat`}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>{lang === 'bn' ? 'চ্যাটে দেখুন' : 'View in Chat'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

