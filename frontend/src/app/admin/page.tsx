'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import {
  Users,
  ShieldAlert,
  Wallet,
  Lock,
  Percent,
  TrendingUp,
  ArrowUpRight,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let raw: any = null;
      try {
        raw = await api.get('/admin/analytics');
      } catch {
        raw = await api.get('/admin/dashboard');
      }

      // Handle raw directly or unwrap from data
      const data = raw?.users ? raw : (raw?.data?.users ? raw.data : raw?.data?.data || raw);

      if (data && data.users && data.finance) {
        setAnalytics(data);
      } else {
        setErrorMsg('Failed to parse analytics data');
      }
    } catch (err: any) {
      console.error('Failed to load admin analytics:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading control center...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Failed to load analytics</h3>
            <p className="text-xs text-slate-500 mt-1">{errorMsg || 'Unable to connect to analytics service'}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Commission', amount: Number(analytics.finance.totalCommissionEarned) },
    { name: 'Recharges', amount: Number(analytics.finance.totalRechargeApproved) },
    { name: 'Withdrawals', amount: Number(analytics.finance.totalWithdrawalApproved) },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Admin Control Center</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">Realtime platform telemetry, escrow holds & financial auditing</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/calling-queue"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Call Admin Queue</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Cards (Spec #47) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{analytics.users.total}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{analytics.users.active} Active ({analytics.users.newLast30Days} new 30d)</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Available Wallets</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">৳ {Number(analytics.finance.totalAvailableBalance).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Liquid balance in system</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Hold Escrow Balance</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">৳ {Number(analytics.finance.totalHoldBalance).toLocaleString()}</div>
          <div className="text-[10px] text-amber-600/90 dark:text-amber-500/80">Pending seller release</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Platform Commission</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">৳ {Number(analytics.finance.totalCommissionEarned).toLocaleString()}</div>
          <div className="text-[10px] text-purple-600/90 dark:text-purple-300">Earned revenue</div>
        </div>
      </div>

      {/* Secondary Metrics: Products & Transactions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 font-medium">Total Products</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{analytics.products.total}</div>
          <div className="text-[10px] text-slate-500">{analytics.products.physical} Physical | {analytics.products.digital} Digital</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 font-medium">Total Volume</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">৳ {Number(analytics.finance.totalTransactionVolume).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Completed deal volume</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 font-medium">Recharges Approved</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">৳ {Number(analytics.finance.totalRechargeApproved).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Verified cash-in</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm">
          <div className="text-slate-500 dark:text-slate-400 font-medium">Withdrawals Approved</div>
          <div className="text-lg font-bold text-rose-600 dark:text-rose-400">৳ {Number(analytics.finance.totalWithdrawalApproved).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Verified payout</div>
        </div>
      </div>

      {/* Recharts Visualization (Spec #98) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            <span>Financial Telemetry Overview (BDT)</span>
          </h2>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                formatter={(value: any) => [`৳ ${Number(value).toLocaleString()}`, 'Amount']}
              />
              <Bar dataKey="amount" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Recent Transactions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <Link href="/admin/transactions" className="text-sky-600 dark:text-sky-400 hover:underline font-semibold">View All</Link>
          </div>
          <div className="space-y-2">
            {analytics.recentTransactions?.map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-sky-600 dark:text-sky-400">{t.trackingNumber}</div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">{t.sender?.uniqueUserId} ➔ {t.receiver?.uniqueUserId}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">৳ {Number(t.amount).toLocaleString()}</div>
                  <span className="text-[10px] text-slate-500 font-semibold">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white">Recently Joined Users</h3>
            <Link href="/admin/users" className="text-sky-600 dark:text-sky-400 hover:underline font-semibold">Manage</Link>
          </div>
          <div className="space-y-2">
            {analytics.recentUsers?.map((u: any) => (
              <div key={u.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {u.avatarUrl ? (
                    <img
                      src={getImageUrl(u.avatarUrl)}
                      alt={u.firstName || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-sky-500/30 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      {u.firstName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                    <div className="font-mono text-sky-600 dark:text-sky-400 text-[11px]">{u.uniqueUserId}</div>
                  </div>
                </div>
                <div className="text-right text-slate-600 dark:text-slate-400 text-[11px]">
                  <div>{u.email}</div>
                  <div>{u.phone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
