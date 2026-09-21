'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  MessageSquare,
  ShieldCheck,
  Coins,
  ArrowRight,
  PlusCircle,
  Clock,
  ShieldAlert,
  Settings,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  User,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

export default function DashboardOverviewPage() {
  const { user, refreshMe } = useAuthStore();
  const { lang, t } = useLanguage();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [bidsCount, setBidsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshMe();

    // Fetch user recent transactions
    api.get('/transactions/my?limit=6')
      .then((res: any) => setTransactions(res.items || []))
      .catch(() => setTransactions([]));

    // Fetch user products count
    api.get('/products/my-products')
      .then((res: any) => {
        if (Array.isArray(res)) {
          setProductsCount(res.length);
        }
      })
      .catch(() => {});

    // Fetch user bids count
    api.get('/bids/my-bids')
      .then((res: any) => {
        if (Array.isArray(res)) {
          setBidsCount(res.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const available = Number(user?.wallet?.availableBalance || 0);
  const hold = Number(user?.wallet?.holdBalance || 0);
  const activeDeals = transactions.filter(
    (tx) => tx.status === 'WORKING' || tx.status === 'REQUESTED' || tx.status === 'APPROVED' || tx.status === 'HOLD'
  ).length;

  return (
    <div className="space-y-8 pb-8">
      {/* 1. Full-Width Welcome & User Profile Command Banner */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white shadow-xl flex flex-col md:flex-row items-center md:items-start justify-between gap-4 sm:gap-6 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left z-10 w-full md:w-auto">
          <div className="relative group shrink-0">
            {user?.avatarUrl ? (
              <img
                src={getImageUrl(user.avatarUrl)}
                alt={user.firstName}
                className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 sm:border-3 border-white/70 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-white/20 backdrop-blur-md text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-2 sm:border-3 border-white/40 shadow-lg">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            )}
            {user?.isVerified && (
              <span
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 sm:p-1 border-2 border-white shadow"
                title="Verified Trader"
              >
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            )}
          </div>

          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight">
                {lang === 'bn' ? `স্বাগতম, ${user?.firstName} ${user?.lastName || ''}!` : `Welcome, ${user?.firstName} ${user?.lastName || ''}!`}
              </h1>
              {user?.isVerified && (
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-sky-100 font-medium">
              <span className="bg-black/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-mono font-bold tracking-wider">
                ID: {user?.uniqueUserId}
              </span>
              {user?.phone && (
                <span className="bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg">
                  📞 {user.phone}
                </span>
              )}
              {user?.email && (
                <span className="bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg hidden lg:inline">
                  ✉️ {user.email}
                </span>
              )}
            </div>

            <p className="text-[11px] text-sky-100/90 pt-0.5 max-w-xl hidden xs:block">
              {lang === 'bn'
                ? 'একটি নিরাপদ প্রোফাইল থেকেই আপনি বায়ার, সেলার ও সার্ভিস প্রোভাইডার হিসেবে কাজ করতে পারছেন।'
                : 'Your multi-role dashboard for buying, selling, and executing escrow-guaranteed transactions.'}
            </p>
          </div>
        </div>

        {/* Quick Profile Actions */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 z-10 w-full md:w-auto">
          <Link
            href={`/users/${user?.uniqueUserId}`}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center justify-center gap-1.5 backdrop-blur-md border border-white/20 transition text-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'পাবলিক ভিউ' : 'Public Profile'}</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition text-center"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Telemetry Metric Cards (4 Grid on desktop, 2x2 on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {/* Card 1: Available Balance */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 sm:space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 dark:text-emerald-400 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{t('available_balance')}</span>
            </div>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              READY
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ৳ {available.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
              {lang === 'bn' ? 'উইথড্র বা নতুন ডিলে প্রস্তুত' : 'Ready for withdrawal/deal'}
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 pt-0.5 sm:pt-1">
            <Link
              href="/dashboard/wallet?action=recharge"
              prefetch={true}
              className="flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition"
            >
              <ArrowDownCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{t('recharge')}</span>
            </Link>
            <Link
              href="/dashboard/wallet?action=withdraw"
              prefetch={true}
              className="flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition"
            >
              <ArrowUpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{t('withdraw')}</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Hold Balance (Escrow Locked) */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 sm:space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-500 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 shrink-0">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">{t('hold_balance')}</span>
            </div>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              LOCKED
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ৳ {hold.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
              {lang === 'bn' ? 'চলমান এসক্রো সুরক্ষিত' : 'Protected in escrow'}
            </p>
          </div>

          <Link
            href="/dashboard/transactions"
            className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition"
          >
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{lang === 'bn' ? 'হোল্ড ডিটেইলস' : 'View Escrows'}</span>
          </Link>
        </div>

        {/* Card 3: Active Transactions & Deals */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 sm:space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 text-sky-600 dark:text-sky-400 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-sky-500/10 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                {lang === 'bn' ? 'চলমান ডিল' : 'Active Deals'}
              </span>
            </div>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-sky-500/10 text-sky-600 border border-sky-500/20">
              ACTIVE
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeDeals}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
              {lang === 'bn' ? 'টাইমার ও কাজ চলমান' : 'Deals executing'}
            </p>
          </div>

          <Link
            href="/dashboard/chat"
            className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition"
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{lang === 'bn' ? 'লাইভ চ্যাট ডিল' : 'Live Chat Deals'}</span>
          </Link>
        </div>

        {/* Card 4: My Products & Bids */}
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 sm:space-y-4 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2 text-purple-600 dark:text-purple-400 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">
                {lang === 'bn' ? 'প্রোডাক্ট ও বিড' : 'Products & Bids'}
              </span>
            </div>
            <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-purple-500/10 text-purple-600 border border-purple-500/20">
              STOCK
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1.5">
              <span>{productsCount}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold font-mono">({bidsCount} Bids)</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
              {lang === 'bn' ? 'লিস্টেড প্রোডাক্ট' : 'Active listings'}
            </p>
          </div>

          <Link
            href="/dashboard/products/new"
            className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition"
          >
            <PlusCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{lang === 'bn' ? 'প্রোডাক্ট আপলোড' : 'Upload Listing'}</span>
          </Link>
        </div>
      </div>

      {/* 3. Quick Action Hub (6 Distinct Service Cards) */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <span>{lang === 'bn' ? 'প্রয়োজনীয় অ্যাকশন ও সার্ভিসেস' : 'Quick Actions & Workspace'}</span>
        </h2>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-4">
          <Link
            href="/dashboard/chat"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 hover:shadow-md transition flex flex-col items-center text-center gap-2.5 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'লাইভ চ্যাট ও ডিল' : 'Live Chat'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'Pay / Receive রিকোয়েস্ট' : 'Escrow Chat'}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/products/new"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition flex flex-col items-center text-center gap-2.5 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'প্রোডাক্ট আপলোড' : 'New Listing'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'ডিজিটাল বা ফিজিক্যাল' : 'Post Product'}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/products"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition flex flex-col items-center text-center gap-2.5 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'আমার প্রোডাক্ট' : 'My Inventory'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'ম্যানেজ ও এডিট' : 'Manage Listings'}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/bids"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 hover:shadow-md transition flex flex-col items-center text-center gap-2.5 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-500 flex items-center justify-center group-hover:scale-110 transition">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'পজিশন বিড' : 'Promote Bids'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? '১ম, ২য়, ৩য় স্লট' : 'Top Rankings'}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/wallet"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500 hover:shadow-md transition flex flex-col items-center text-center gap-2.5 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'ফুল লেজার' : 'Full Ledger'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'অপরিবর্তনীয় অডিট' : 'Audit Logs'}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/disputes"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 hover:shadow-md transition flex flex-col items-center text-center gap-2.5 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/70 text-rose-500 flex items-center justify-center group-hover:scale-110 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'ডিসপ্যুট সাপোর্ট' : 'Disputes'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'কল অ্যাডমিন ২৪/৭' : 'Arbitration'}
              </div>
            </div>
          </Link>

          <Link
            href="/guides"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500 hover:shadow-md transition flex flex-col items-center text-center gap-2.5 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'গাইডস ও ভিডিও' : 'Guides'}
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'নির্দেশিকা ও টিউটোরিয়াল' : 'Tutorials & Help'}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Recent Safe Transactions Section (Full Detail Table) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" />
              <span>{lang === 'bn' ? 'সাম্প্রতিক নিরাপদ ট্রানজ্যাকশনসমূহ' : 'Recent Safe Escrow Transactions'}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {lang === 'bn' ? 'আপনার সকল চলমান ও সম্পন্ন হওয়া ডিলের রিয়েল-টাইম স্ট্যাটাস' : 'Live status and escrow tracking of your deals'}
            </p>
          </div>

          <Link
            href="/dashboard/transactions"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>{lang === 'bn' ? 'সকল লেনদেন দেখুন' : 'View All Transactions'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-xs font-medium text-slate-400">
              {lang === 'bn' ? 'কোনো সাম্প্রতিক লেনদেন পাওয়া যায়নি' : 'No safe transactions recorded yet'}
            </div>
            <Link
              href="/dashboard/chat"
              className="inline-flex px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition"
            >
              {lang === 'bn' ? 'নতুন ডিল শুরু করুন' : 'Start a Deal in Chat'}
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {transactions.map((tx) => {
              const isSender = tx.senderId === user?.id;
              const counterparty = isSender ? tx.receiver : tx.sender;

              return (
                <div
                  key={tx.id}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 hover:border-sky-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      {counterparty?.firstName?.charAt(0) || 'U'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          #{tx.trackingNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>{isSender ? (lang === 'bn' ? 'প্রাপক:' : 'Paid to:') : (lang === 'bn' ? 'প্রেরক:' : 'From:')}</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold font-mono">
                          {counterparty?.uniqueUserId || 'Counterparty'}
                        </strong>
                        {tx.product?.title && (
                          <span className="text-slate-400 truncate max-w-[150px] hidden md:inline">
                            • {tx.product.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-left sm:text-right">
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        ৳ {Number(tx.amount).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tx.transactionType === 'GENERAL_TRANSACTION' ? 'Escrow Deal' : tx.transactionType}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          tx.status === 'RELEASED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : tx.status === 'HOLD'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : tx.status === 'DISPUTED'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                        }`}
                      >
                        {tx.status}
                      </span>

                      <Link
                        href={`/dashboard/chat?conversationId=${tx.conversationId || ''}`}
                        className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-600 dark:text-slate-300 transition"
                        title="Open Deal Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Escrow Trust Guarantee & Rules Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              {lang === 'bn' ? '১০০% নিরাপদ এসক্রো গ্যারান্টি' : '100% Guaranteed Safe Escrow Protection'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              {lang === 'bn'
                ? 'SafnexBD প্ল্যাটফর্মে বায়ার বা সেলার কেউই প্রতারিত হতে পারেন না। কাজ অথবা প্রোডাক্ট সম্পূর্ণ বুঝে না পাওয়া পর্যন্ত অর্থ নিরপেক্ষ হোল্ড ব্যালেন্সে সুরক্ষিত থাকে।'
                : 'Buyer and seller funds are held in secure escrow. Released only upon complete satisfaction or unilateral dispute resolution.'}
            </p>
          </div>
        </div>

        <Link
          href="/escrow-rules"
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 whitespace-nowrap transition"
        >
          {lang === 'bn' ? 'নিয়মাবলী পড়ুন' : 'Read Escrow Rules'}
        </Link>
      </div>
    </div>
  );
}
