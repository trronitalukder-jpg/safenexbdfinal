'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, MessageSquare, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

export default function MyDisputesPage() {
  const { user } = useAuthStore();
  const { lang, t } = useLanguage();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/transactions/my?status=DISPUTED')
      .then((res: any) => setDisputes(res.items || []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
          <span>{lang === 'bn' ? 'ডিসপ্যুট ও অ্যাডমিন কল ট্র্যাকার' : 'Disputes & Admin Calling Tracker'}</span>
        </h1>
        <p className="text-xs text-slate-500">
          {lang === 'bn' ? 'আপনার সক্রিয় ও মীমাংসিত বিরোধসমূহ' : 'Track and manage your dispute appeals and resolution status'}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300 space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          <span>{lang === 'bn' ? 'অ্যাডমিন মধ্যস্থতা প্রক্রিয়া:' : 'Admin Mediation Process:'}</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {lang === 'bn'
            ? 'ডিসপ্যুট ওপেন হলে অ্যাডমিন সম্পূর্ণ চ্যাট হিস্ট্রি, আপলোডকৃত প্রুফ এবং ট্রানজ্যাকশন ডাটা যাচাই করে চূড়ান্ত সিদ্ধান্ত দেন (টাকা রিফান্ড অথবা সেলারকে রিলিজ)।'
            : 'Admins review full chat conversations, evidence files, and immutable ledgers to deliver a binding resolution.'}
        </p>
      </div>

      {loading ? (
        <div className="text-xs text-slate-400 py-6 text-center">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'কোনো সক্রিয় ডিসপ্যুট নেই' : 'No active disputes found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((tx) => (
            <div
              key={tx.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              {(() => {
                const isBuyer = tx.senderId === user?.id;
                const counterparty = isBuyer ? tx.receiver : tx.sender;
                return (
                  <div className="flex items-center gap-3">
                    {counterparty?.avatarUrl ? (
                      <img
                        src={getImageUrl(counterparty.avatarUrl)}
                        alt={counterparty.firstName || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-rose-500/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {counterparty?.firstName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-600">{tx.trackingNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          with {counterparty?.firstName ? `${counterparty.firstName} ${counterparty.lastName || ''}`.trim() : counterparty?.uniqueUserId}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-0.5">Amount: ৳ {Number(tx.amount).toLocaleString()}</div>
                      <div className="text-[10px] text-amber-500 font-semibold mt-0.5">Status: Dispute Under Active Admin Review</div>
                    </div>
                  </div>
                );
              })()}

              <Link
                href="/dashboard/chat"
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Chat</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

