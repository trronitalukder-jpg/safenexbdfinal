'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { getSocket } from '@/lib/socket';
import {
  Users,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  PhoneCall,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Shuffle,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Settings,
  ChevronRight,
  UserCheck,
  Coffee,
  UserX,
  BookOpen,
} from 'lucide-react';

export default function LiveOperationsPage() {
  const { lang } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rebalancing, setRebalancing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res: any = await api.get('/operations/live-dashboard');
      const d = res?.data !== undefined ? res.data : res;
      setData(d);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch operations dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Realtime WebSocket auto-update
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboard();
    };

    socket.on('operations:presence_changed', handleUpdate);
    socket.on('operations:task_assigned', handleUpdate);
    socket.on('operations:task_escalated', handleUpdate);
    socket.on('operations:queue_rebalanced', handleUpdate);
    socket.on('notification:admin', handleUpdate);

    return () => {
      socket.off('operations:presence_changed', handleUpdate);
      socket.off('operations:task_assigned', handleUpdate);
      socket.off('operations:task_escalated', handleUpdate);
      socket.off('operations:queue_rebalanced', handleUpdate);
      socket.off('notification:admin', handleUpdate);
    };
  }, [fetchDashboard]);

  // Polling fallback
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboard();
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboard]);

  const handleRebalance = async () => {
    const confirmMsg =
      lang === 'bn'
        ? 'আপনি কি উপস্থিত সকল অন-ডিউটি স্টাফদের মাঝে সকল অপেক্ষমাণ কাজ সমানভাবে বণ্টন করতে চান?'
        : 'Do you want to evenly redistribute all unassigned pending tasks across online on-duty staff?';
    if (!confirm(confirmMsg)) return;

    setRebalancing(true);
    setMessage(null);
    try {
      const res: any = await api.post('/operations/rebalance');
      const resData = res?.data !== undefined ? res.data : res;
      setMessage({
        type: 'success',
        text: resData?.message || (lang === 'bn' ? 'সফলভাবে পুনর্বণ্টন করা হয়েছে' : 'Queue successfully rebalanced'),
      });
      fetchDashboard();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'পুনর্বণ্টন ব্যর্থ হয়েছে',
      });
    } finally {
      setRebalancing(false);
    }
  };

  const queues = data?.queues;
  const staff = data?.staff || [];
  const settings = data?.settings;

  const onDutyCount = staff.filter((s: any) => s.dutyStatus === 'ON_DUTY').length;
  const onBreakCount = staff.filter((s: any) => s.dutyStatus === 'ON_BREAK').length;
  const offDutyCount = staff.filter((s: any) => s.dutyStatus === 'OFF_DUTY').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{lang === 'bn' ? 'লাইভ অপারেশনস ও ওয়ার্কলোড কন্ট্রোল' : 'Live Operations & Workload Control'}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  LIVE
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'রিয়েল-টাইম স্টাফ অ্যাক্টিভিটি, পেন্ডিং কিউ এবং ওয়ার্কলোড সমবণ্টন ড্যাশবোর্ড'
                  : 'Real-time staff activity, pending queue health and automated workload balancing'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/docs?tab=workload"
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'অপারেশন ম্যানুয়াল' : 'Operations Manual'}</span>
          </Link>

          <Link
            href="/admin/settings"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
          </Link>

          <button
            type="button"
            onClick={fetchDashboard}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleRebalance}
            disabled={rebalancing || onDutyCount === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            {rebalancing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Shuffle className="w-4 h-4" />
            )}
            <span>{lang === 'bn' ? 'ওয়ার্কলোড সমবণ্টন (Rebalance)' : 'Rebalance Queue'}</span>
          </button>
        </div>
      </div>

      {/* Alert / Notification Message */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mode Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">
              {lang === 'bn' ? 'ওয়ার্কলোড অটো-বণ্টন ইঞ্জিন' : 'Auto-Distribution Engine'}
            </span>
            <span
              className={`text-sm font-black inline-flex items-center gap-1.5 mt-0.5 ${
                settings?.workloadDistributionEnabled
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  settings?.workloadDistributionEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              {settings?.workloadDistributionEnabled
                ? lang === 'bn'
                  ? 'সক্রিয় (Active)'
                  : 'Active'
                : lang === 'bn'
                ? 'নিষ্ক্রিয় (Manual Queue)'
                : 'Disabled'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            {settings?.distributionAlgorithm || 'CLAIM_POOL'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">
              {lang === 'bn' ? 'স্টাফ উপস্থিতি (Presence)' : 'Staff Duty Presence'}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs font-bold">
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {onDutyCount} {lang === 'bn' ? 'ডিউটিতে' : 'On Duty'}
              </span>
              <span className="text-amber-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {onBreakCount} {lang === 'bn' ? 'বিরতিতে' : 'Break'}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                {offDutyCount} {lang === 'bn' ? 'অফলাইন' : 'Off'}
              </span>
            </div>
          </div>
          <Users className="w-5 h-5 text-slate-400" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">
              {lang === 'bn' ? 'কনকারেন্সি লক ও সময়' : 'Lock Window & SLA'}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
              Lock: {settings?.lockDurationMinutes || 10}m | SLA: {settings?.slaWarningMinutes || 15}m
            </span>
          </div>
          <Clock className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* 2. Queue Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Withdrawals Queue Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {lang === 'bn' ? 'উইথড্রল কিউ' : 'Withdrawals Queue'}
                </h3>
                <span className="text-[10px] text-slate-400">Payout Disbursements</span>
              </div>
            </div>
            <Link
              href="/admin/withdrawals"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Open Withdrawals"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-500 block">মোট পেন্ডিং</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {queues?.withdrawals?.pending || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block">চলমান (লকড)</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {queues?.withdrawals?.inProgress || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30">
              <span className="text-[10px] text-sky-600 dark:text-sky-400 block">উন্মুক্ত কিউ</span>
              <span className="text-base font-black text-sky-600 dark:text-sky-400">
                {queues?.withdrawals?.unassigned || 0}
              </span>
            </div>
          </div>

          {Number(queues?.withdrawals?.breached || 0) > 0 && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>SLA বিলম্বিত: {queues.withdrawals.breached} টি</span>
              </span>
              <Link href="/admin/withdrawals" className="underline hover:no-underline">
                দেখুন →
              </Link>
            </div>
          )}
        </div>

        {/* Recharges Queue Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {lang === 'bn' ? 'রিচার্জ কিউ' : 'Recharges Queue'}
                </h3>
                <span className="text-[10px] text-slate-400">Wallet Approvals</span>
              </div>
            </div>
            <Link
              href="/admin/recharges"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Open Recharges"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-500 block">মোট পেন্ডিং</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {queues?.recharges?.pending || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block">চলমান (লকড)</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {queues?.recharges?.inProgress || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30">
              <span className="text-[10px] text-sky-600 dark:text-sky-400 block">উন্মুক্ত কিউ</span>
              <span className="text-base font-black text-sky-600 dark:text-sky-400">
                {queues?.recharges?.unassigned || 0}
              </span>
            </div>
          </div>

          {Number(queues?.recharges?.breached || 0) > 0 && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>SLA বিলম্বিত: {queues.recharges.breached} টি</span>
              </span>
              <Link href="/admin/recharges" className="underline hover:no-underline">
                দেখুন →
              </Link>
            </div>
          )}
        </div>

        {/* Disputes & Calls Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {lang === 'bn' ? 'ডিসপ্যুট ও লাইভ কল' : 'Disputes & Calls'}
                </h3>
                <span className="text-[10px] text-slate-400">Active Mediations</span>
              </div>
            </div>
            <Link
              href="/admin/calling-queue"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Open Calling Queue"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] text-slate-500 block">সক্রিয় কল/বিরোধ</span>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {queues?.disputes?.active || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30">
              <span className="text-[10px] text-purple-600 dark:text-purple-400 block">
                সুপার অ্যাডমিন এসকেলেট
              </span>
              <span className="text-base font-black text-purple-600 dark:text-purple-400">
                {queues?.disputes?.escalated || 0}
              </span>
            </div>
          </div>

          {Number(queues?.disputes?.breached || 0) > 0 && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>জরুরি বিলম্বিত: {queues.disputes.breached} টি</span>
              </span>
              <Link href="/admin/calling-queue" className="underline hover:no-underline">
                সমাধান করুন →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Live Staff Workload Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>{lang === 'bn' ? 'লাইভ স্টাফ উপস্থিতি ও কাজের বণ্টন' : 'Live Staff Duty & Workload Matrix'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'bn'
                ? 'বর্তমানে কর্মরত স্টাফদের রিয়েল-টাইম কাজ, সক্ষমতা ও পারফরম্যান্স'
                : 'Real-time tasks in tray, capacity limits, and daily completions per agent'}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Last sync: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        {staff.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              {lang === 'bn' ? 'কোনো স্টাফ প্রোফাইল পাওয়া যায়নি।' : 'No staff profiles found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((s: any) => {
              const isOnDuty = s.dutyStatus === 'ON_DUTY';
              const isOnBreak = s.dutyStatus === 'ON_BREAK';
              const maxTasks = Number(settings?.maxConcurrentTasksPerStaff || 5);
              const activeCount = Number(s.activeTasks || 0);
              const pct = Math.min(100, Math.round((activeCount / maxTasks) * 100));

              return (
                <div
                  key={s.userId}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    isOnDuty
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 shadow-sm'
                      : 'bg-slate-50/30 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 opacity-75'
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300 overflow-hidden">
                        {s.avatarUrl ? (
                          <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          (s.name || s.uniqueUserId || 'U')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {s.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          @{s.uniqueUserId}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isOnDuty
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                          : isOnBreak
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnDuty ? 'bg-emerald-500 animate-pulse' : isOnBreak ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>
                        {isOnDuty
                          ? lang === 'bn'
                            ? 'অন ডিউটি'
                            : 'On Duty'
                          : isOnBreak
                          ? lang === 'bn'
                            ? 'বিরতি'
                            : 'On Break'
                          : lang === 'bn'
                          ? 'অফলাইন'
                          : 'Off Duty'}
                      </span>
                    </span>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">চলমান কাজ</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {activeCount} / {maxTasks}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 90
                            ? 'bg-rose-500'
                            : pct >= 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Breakdown Pills */}
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>W: <strong>{s.breakdown?.active?.withdrawals || 0}</strong></span>
                      <span>R: <strong>{s.breakdown?.active?.recharges || 0}</strong></span>
                      <span>D: <strong>{s.breakdown?.active?.disputes || 0}</strong></span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      আজ সম্পন্ন: <strong>{s.completedToday || 0}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

