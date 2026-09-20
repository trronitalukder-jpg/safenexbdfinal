'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, UserCheck, MessageSquare, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

function UserBidBadge({ position }: { position: number; expiresAt?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
      #{position}
    </span>
  );
}

export default function UsersSearchPage() {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const searchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (isVerified) params.append('isVerified', 'true');

    api.get(`/users/search?${params.toString()}`)
      .then((res: any) => setUsers(res || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    searchUsers();
  }, [isVerified]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers();
  };

  return (
    <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {lang === 'bn' ? 'ইউজার অনুসন্ধান' : 'Find Users & Sellers'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {lang === 'bn' ? 'ইউজার আইডি, নাম বা ফোন নম্বর দিয়ে খুঁজুন এবং সরাসরি নিরাপদে লেনদেন করুন' : 'Search by Unique User ID, Name or contact to transact safely'}
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'ইউজার আইডি (যেমন Rahim2345), নাম বা ইমেইল লিখুন...' : 'Search User ID (e.g. Rahim2345), name...'}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:border-sky-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        <button
          type="button"
          onClick={() => setIsVerified(!isVerified)}
          className={`px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition ${
            isVerified ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{lang === 'bn' ? 'শুধু ভেরিফাইড' : 'Verified Only'}</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition"
        >
          {lang === 'bn' ? 'সার্চ করুন' : 'Search'}
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => <div key={n} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'কোনো ইউজার খুঁজে পাওয়া যায়নি' : 'No users found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {users.map((u) => {
            const hasActiveBid = Boolean(u.activeBid);

            return (
              <div
                key={u.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-4 flex flex-col justify-between ${
                  hasActiveBid
                    ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-amber-500/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {u.avatarUrl ? (
                      <img
                        src={getImageUrl(u.avatarUrl)}
                        alt={u.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-sky-500/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-bold text-base flex items-center justify-center flex-shrink-0">
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {u.fullName}
                        </h3>
                        {u.isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      </div>
                      <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                        ID: {u.uniqueUserId}
                      </div>
                      {u.businessName && (
                        <div className="text-[11px] text-slate-400 truncate">{u.businessName}</div>
                      )}
                    </div>
                  </div>

                  {hasActiveBid && (
                    <div className="flex-shrink-0">
                      <UserBidBadge position={u.activeBid.targetPosition} expiresAt={u.activeBid.expiresAt} />
                    </div>
                  )}
                </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                <div>
                  <span>Products: </span>
                  <strong className="text-slate-900 dark:text-white">{u.activeProductsCount}</strong>
                </div>
                <div>
                  <span>Completed Deals: </span>
                  <strong className="text-emerald-600 font-bold">{u.completedTransactionsCount}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/users/${u.uniqueUserId}`}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs text-center transition"
                >
                  {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
                </Link>
                <Link
                  href={`/dashboard/chat?targetUserId=${u.id}`}
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('chat')}</span>
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

