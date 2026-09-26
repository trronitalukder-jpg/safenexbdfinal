'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Activity,
  Users,
  Clock,
  Globe,
  ShieldAlert,
  Compass,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Ban,
  CheckCircle,
  Smartphone,
  Monitor,
  Tablet,
  Share2,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Send,
  X,
  UserCheck,
  Zap,
} from 'lucide-react';
import VerifiedBadge from '@/components/common/VerifiedBadge';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function AdminTrafficPage() {
  const [activeTab, setActiveTab] = useState<
    'radar' | 'new_vs_repeat' | 'ips' | 'engagement' | 'sources' | 'funnel' | 'reports'
  >('radar');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7d' | '30d'>('today');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  // Tab Data States
  const [radarData, setRadarData] = useState<any>(null);
  const [newVsRepeatData, setNewVsRepeatData] = useState<any>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [sourcesData, setSourcesData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);

  // IP Search & Filter
  const [ipSearch, setIpSearch] = useState('');
  const [ipPage, setIpPage] = useState(1);

  // Block Modal
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  // 360° Profile Drawer
  const [drawerIdentifier, setDrawerIdentifier] = useState<string | null>(null);
  const [drawerProfile, setDrawerProfile] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Telegram Digest State
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Fetch Radar (called frequently if autoRefresh)
  const fetchRadar = async () => {
    try {
      const res = await api.get('/traffic/radar');
      setRadarData(unwrap(res));
    } catch (err) {
      console.error('Failed to fetch radar:', err);
    }
  };

  // Fetch Active Tab Data
  const fetchCurrentTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'radar') {
        await fetchRadar();
      } else if (activeTab === 'new_vs_repeat') {
        const res = await api.get(`/traffic/new-vs-repeat?range=${dateRange}`);
        setNewVsRepeatData(unwrap(res));
      } else if (activeTab === 'ips') {
        const res = await api.get(
          `/traffic/ips?page=${ipPage}&limit=30&search=${encodeURIComponent(ipSearch)}`
        );
        setIpData(unwrap(res));
      } else if (activeTab === 'engagement') {
        const res = await api.get(`/traffic/engagement?range=${dateRange}`);
        setEngagementData(unwrap(res));
      } else if (activeTab === 'sources') {
        const res = await api.get(`/traffic/sources?range=${dateRange}`);
        setSourcesData(unwrap(res));
      } else if (activeTab === 'funnel') {
        const res = await api.get(`/traffic/funnel?range=${dateRange}`);
        setFunnelData(unwrap(res));
      }
    } catch (err) {
      console.error('Tab data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger data fetch on tab/range change
  useEffect(() => {
    fetchCurrentTabData();
  }, [activeTab, dateRange, ipPage]);

  // Search debounce for IPs
  useEffect(() => {
    if (activeTab === 'ips') {
      const timer = setTimeout(() => {
        setIpPage(1);
        fetchCurrentTabData();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [ipSearch]);

  // Live Auto-Refresh for Radar every 10 seconds
  useEffect(() => {
    if (activeTab === 'radar' && autoRefresh) {
      const interval = setInterval(() => {
        fetchRadar();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, autoRefresh]);

  // Open 360° Drawer
  const openDrawer = async (identifier: string) => {
    setDrawerIdentifier(identifier);
    setDrawerLoading(true);
    try {
      const res = await api.get(`/traffic/visitor/${encodeURIComponent(identifier)}`);
      setDrawerProfile(unwrap(res));
    } catch (err) {
      console.error('Failed to load visitor profile:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Block IP handler
  const handleBlockIp = async () => {
    if (!blockingIp) return;
    setBlockSubmitting(true);
    try {
      await api.post('/traffic/ips/block', {
        ipAddress: blockingIp,
        reason: blockReason || 'Suspicious activity detected by admin',
      });
      setBlockingIp(null);
      setBlockReason('');
      fetchCurrentTabData();
      if (drawerIdentifier === blockingIp) {
        openDrawer(blockingIp);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to block IP');
    } finally {
      setBlockSubmitting(false);
    }
  };

  // Unblock IP handler
  const handleUnblockIp = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock IP: ${ip}?`)) return;
    try {
      await api.delete(`/traffic/ips/block/${encodeURIComponent(ip)}`);
      fetchCurrentTabData();
      if (drawerIdentifier === ip) {
        openDrawer(ip);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to unblock IP');
    }
  };

  // Send Telegram Digest
  const handleSendTelegramDigest = async () => {
    setTelegramLoading(true);
    setTelegramStatus(null);
    try {
      const res = await api.post('/traffic/telegram-digest', {});
      const data = unwrap(res);
      setTelegramStatus(
        `সফলভাবে টেলিগ্রামে পাঠানো হয়েছে! (মোট প্রাপক: ${data?.sentTo || 1})`
      );
    } catch (err: any) {
      setTelegramStatus(`ত্রুটি: ${err.message || 'Failed to send'}`);
    } finally {
      setTelegramLoading(false);
    }
  };

  // Helpers
  const formatSeconds = (sec: number = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const getDeviceIcon = (type?: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('DESK')) return <Monitor className="w-4 h-4 text-blue-500" />;
    if (t.includes('TAB')) return <Tablet className="w-4 h-4 text-purple-500" />;
    return <Smartphone className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 space-y-6">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                ট্রাফিক ও ভিজিটর ইন্টেলিজেন্স
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Real-Time Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                লাইভ ভিজিটর রাডার, অবস্থানকাল (Dwell Time), আইপি অডিট এবং কনভার্শন ফানেল
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            {(['today', 'yesterday', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRange === r
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'today'
                  ? 'আজ'
                  : r === 'yesterday'
                  ? 'গতকাল'
                  : r === '7d'
                  ? '৭ দিন'
                  : '৩০ দিন'}
              </button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          {activeTab === 'radar' && (
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              {autoRefresh ? 'Auto Live (10s)' : 'Paused'}
            </button>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchCurrentTabData()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-all border border-slate-600 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-800 scrollbar-thin">
        {[
          { id: 'radar', label: '🔴 লাইভ রাডার (Live Radar)', icon: Activity },
          { id: 'new_vs_repeat', label: '👥 নতুন বনাম রিপিট (New vs Repeat)', icon: Users },
          { id: 'ips', label: '🌐 আইপি অডিট ও ফ্রড (IP Intelligence)', icon: ShieldAlert },
          { id: 'engagement', label: '⏱️ অবস্থানকাল ও বাউন্স (Dwell Time)', icon: Clock },
          { id: 'sources', label: '🧭 ট্রাফিক উৎস (Sources & UTM)', icon: Compass },
          { id: 'funnel', label: '🎯 কনভার্শন ফানেল (Behavior Funnel)', icon: TrendingUp },
          { id: 'reports', label: '📊 এক্সপোর্ট ও টেলিগ্রাম (Reports)', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 border-sky-400'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* ============================================================== */}
      {/* TAB 1: 🔴 Live Radar */}
      {/* ============================================================== */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Live Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  বর্তমানে লাইভ সক্রিয়
                </span>
                <Users className="w-5 h-5 text-emerald-400 opacity-80" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-white">
                {radarData?.activeCount ?? 0}
                <span className="text-sm font-normal text-slate-400 ml-2">জন ভিজিটর</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">গত ৩ মিনিটে সাইটে সক্রিয় আছেন</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                শীর্ষ সক্রিয় পেজ
              </span>
              <div className="mt-3 text-lg font-bold text-white truncate">
                {radarData?.pageDistribution?.[0]?.path || 'হোমপেজ (/)'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {radarData?.pageDistribution?.[0]?.count || 0} জন ব্রাউজ করছেন
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                মোবাইল ইউজার
              </span>
              <div className="mt-3 text-2xl font-bold text-white">
                {radarData?.activeSessions
                  ? Math.round(
                      (radarData.activeSessions.filter((s: any) => s.deviceType === 'MOBILE').length /
                        (radarData.activeSessions.length || 1)) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-[11px] text-slate-400 mt-1">স্মার্টফোন দিয়ে ব্রাউজ করছেন</p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                রিটার্নিং ভিজিটর
              </span>
              <div className="mt-3 text-2xl font-bold text-white">
                {radarData?.activeSessions
                  ? radarData.activeSessions.filter((s: any) => s.isRepeat).length
                  : 0}
                <span className="text-sm font-normal text-slate-400 ml-2">জন</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">পূর্বে ভিজিট করেছেন এমন ইউজার</p>
            </div>
          </div>

          {/* Active Page Distribution Pills */}
          {radarData?.pageDistribution && radarData.pageDistribution.length > 0 && (
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">
                রিয়েল-টাইম পেজ অনুযায়ী ট্রাফিক ভাগ:
              </h3>
              <div className="flex flex-wrap gap-2">
                {radarData.pageDistribution.map((p: any) => (
                  <div
                    key={p.path}
                    className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300"
                  >
                    <span className="font-mono text-sky-400">{p.path}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Visitor Stream Table */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                লাইভ ভিজিটর স্ট্রিম (Real-Time Active Visitors)
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {radarData?.activeSessions?.length || 0} active now
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700/60">
                  <tr>
                    <th className="p-3.5">ভিজিটর / একাউন্ট</th>
                    <th className="p-3.5">আইপি ও নেটওয়ার্ক (ISP)</th>
                    <th className="p-3.5">ডিভাইস ও ব্রাউজার</th>
                    <th className="p-3.5">বর্তমান পেজ</th>
                    <th className="p-3.5">অবস্থানকাল (Dwell)</th>
                    <th className="p-3.5">উৎস (Source)</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {radarData?.activeSessions && radarData.activeSessions.length > 0 ? (
                    radarData.activeSessions.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                        {/* Visitor / User */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {s.user ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white">
                                  {s.user.firstName} ({s.user.uniqueUserId})
                                </span>
                                {s.user.isVerified && <VerifiedBadge size="xs" />}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-300 font-mono">
                                  {s.visitorId.substring(0, 10)}...
                                </span>
                                {s.isRepeat ? (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]">
                                    🔁 #{s.sessionNumber}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                                    🆕 New
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* IP & ISP */}
                        <td className="p-3.5">
                          <div className="font-mono text-slate-200">{s.ipAddress}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                            {s.isp} • {s.city}
                          </div>
                        </td>

                        {/* Device & Browser */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            {getDeviceIcon(s.deviceType)}
                            <span>{s.browser || 'Browser'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{s.os}</div>
                        </td>

                        {/* Current Path */}
                        <td className="p-3.5">
                          <span className="font-mono text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                            {s.currentPath}
                          </span>
                        </td>

                        {/* Dwell Time / Live Stopwatch */}
                        <td className="p-3.5">
                          <div className="font-semibold text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatSeconds(s.durationSeconds)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Active: {formatSeconds(s.activeSeconds)}
                          </div>
                        </td>

                        {/* Traffic Source */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-mono text-[10px]">
                            {s.trafficSource}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => openDrawer(s.ipAddress)}
                            className="px-2.5 py-1 text-xs bg-sky-600/80 hover:bg-sky-600 text-white rounded-lg transition-all shadow"
                          >
                            ৩৬০° প্রোফাইল
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        বর্তমানে কোনো সক্রিয় ভিজিটর নেই অথবা ডাটা রিফ্রেশ হচ্ছে...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: 👥 New vs Repeat Visitors */}
      {/* ============================================================== */}
      {activeTab === 'new_vs_repeat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New Visitors Card */}
            <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  নতুন ভিজিটর (New Visitors)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {newVsRepeatData?.newRatio ?? 0}%
                </span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-white">
                {newVsRepeatData?.newSessions ?? 0}
                <span className="text-sm font-normal text-slate-400 ml-2">টি সেশন</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                গড় অবস্থানকাল: <strong>{formatSeconds(newVsRepeatData?.avgNewDwellSeconds)}</strong>
              </p>
            </div>

            {/* Repeat Visitors Card */}
            <div className="bg-gradient-to-br from-purple-950/30 to-slate-900 border border-purple-500/30 p-6 rounded-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-400" />
                  রিপিট ভিজিটর (Repeat Visitors)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  {newVsRepeatData?.repeatRatio ?? 0}%
                </span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-white">
                {newVsRepeatData?.repeatSessions ?? 0}
                <span className="text-sm font-normal text-slate-400 ml-2">টি সেশন</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                গড় অবস্থানকাল: <strong>{formatSeconds(newVsRepeatData?.avgRepeatDwellSeconds)}</strong>
              </p>
            </div>

            {/* Total Aggregate */}
            <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl">
              <h3 className="text-sm font-semibold text-slate-300">মোট সেশন হিসেব</h3>
              <div className="mt-4 text-3xl font-extrabold text-white">
                {newVsRepeatData?.totalSessions ?? 0}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                রিটার্নিং ইউজাররা নতুনদের তুলনায় গড়ে{' '}
                <strong className="text-sky-400">
                  {newVsRepeatData?.avgRepeatDwellSeconds && newVsRepeatData?.avgNewDwellSeconds
                    ? Math.round(
                        (newVsRepeatData.avgRepeatDwellSeconds /
                          (newVsRepeatData.avgNewDwellSeconds || 1)) *
                          10
                      ) / 10
                    : 1}
                  x
                </strong>{' '}
                বেশি সময় ওয়েবসাইটে থাকেন।
              </p>
            </div>
          </div>

          {/* Frequency Breakdown */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              ভিজিটরের আগমনের ফ্রিকোয়েন্সি (Frequency of Visits)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40">
                <div className="text-xs text-slate-400">১ বার ভিজিট করেছে</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.once ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">প্রথমবারের ভিজিটর</div>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40">
                <div className="text-xs text-slate-400">২ থেকে ৫ বার</div>
                <div className="text-2xl font-bold text-sky-400 mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.twoToFive ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">আগ্রহী রিটার্নিং ট্রাফিক</div>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40">
                <div className="text-xs text-slate-400">৬ থেকে ১০ বার</div>
                <div className="text-2xl font-bold text-purple-400 mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.sixToTen ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">সক্রিয় নিয়মিত গ্রাহক</div>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40">
                <div className="text-xs text-slate-400">১১+ বার ভিজিট</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.elevenPlus ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">লয়াল পাওয়ার ইউজার</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: 🌐 IP Intelligence & Fraud Audit */}
      {/* ============================================================== */}
      {activeTab === 'ips' && (
        <div className="space-y-6">
          {/* IP Stats Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center gap-3">
              <Globe className="w-8 h-8 text-sky-400" />
              <div>
                <div className="text-xs text-slate-400">মোট ইউনিক আইপি (Unique IPs)</div>
                <div className="text-2xl font-bold text-white">
                  {ipData?.totalUniqueIps ?? 0}
                </div>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-xs text-amber-300">মাল্টি-অ্যাকাউন্ট আইপি (Multi-Account)</div>
                <div className="text-2xl font-bold text-amber-400">
                  {ipData?.multiAccountIpsCount ?? 0}
                </div>
                <div className="text-[10px] text-amber-200/70">একই আইপি থেকে ২+ একাউন্ট</div>
              </div>
            </div>

            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3">
              <Ban className="w-8 h-8 text-rose-400" />
              <div>
                <div className="text-xs text-rose-300">ব্লকড আইপি (Blocked Blacklist)</div>
                <div className="text-2xl font-bold text-rose-400">
                  {ipData?.blockedIpsCount ?? 0}
                </div>
                <div className="text-[10px] text-rose-200/70">সাইট এক্সেস নিষিদ্ধ করা হয়েছে</div>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={ipSearch}
              onChange={(e) => setIpSearch(e.target.value)}
              placeholder="আইপি অ্যাড্রেস, ISP বা শহর লিখে সার্চ করুন (যেমনঃ 103.204..., Grameenphone, Dhaka)..."
              className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder:text-slate-500"
            />
            {ipSearch && (
              <button onClick={() => setIpSearch('')} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* IP Intelligence Table */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700/60">
                  <tr>
                    <th className="p-3.5">আইপি অ্যাড্রেস</th>
                    <th className="p-3.5">অপারেটর / ISP ও শহর</th>
                    <th className="p-3.5">মোট সেশন</th>
                    <th className="p-3.5">মোট অবস্থানকাল (Lifetime)</th>
                    <th className="p-3.5">গড় সেশন সময়</th>
                    <th className="p-3.5">লিংকড ইউজার একাউন্ট</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {ipData?.items && ipData.items.length > 0 ? (
                    ipData.items.map((item: any) => (
                      <tr key={item.ipAddress} className="hover:bg-slate-700/20 transition-colors">
                        {/* IP */}
                        <td className="p-3.5">
                          <button
                            onClick={() => openDrawer(item.ipAddress)}
                            className="font-mono text-sky-400 hover:underline font-semibold"
                          >
                            {item.ipAddress}
                          </button>
                        </td>

                        {/* ISP & City */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{item.isp}</div>
                          <div className="text-[11px] text-slate-400">{item.city}, {item.country}</div>
                        </td>

                        {/* Sessions */}
                        <td className="p-3.5 font-bold text-white">{item.sessionCount} বার</td>

                        {/* Total Duration */}
                        <td className="p-3.5 text-emerald-400 font-semibold">
                          {formatSeconds(item.totalDurationSeconds)}
                        </td>

                        {/* Avg Duration */}
                        <td className="p-3.5 text-slate-300">
                          {formatSeconds(item.avgDurationSeconds)}
                        </td>

                        {/* Linked Accounts / Multi-Account Flag */}
                        <td className="p-3.5">
                          {item.linkedUsers && item.linkedUsers.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {item.linkedUsers.map((u: any) => (
                                <span
                                  key={u.id}
                                  className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-700"
                                >
                                  @{u.uniqueUserId}
                                </span>
                              ))}
                              {item.isMultiAccount && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  ⚠️ Multi-Account!
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Guest (লগইন করেনি)</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          {item.isBlocked ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                              ⛔ BLOCKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => openDrawer(item.ipAddress)}
                            className="px-2.5 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all"
                          >
                            ডিটেইলস
                          </button>
                          {item.isBlocked ? (
                            <button
                              onClick={() => handleUnblockIp(item.ipAddress)}
                              className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all font-semibold"
                            >
                              আনব্লক
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setBlockingIp(item.ipAddress);
                                setBlockReason('');
                              }}
                              className="px-2.5 py-1 text-xs bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-all"
                            >
                              ব্লক করুন
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        কোনো আইপি পাওয়া যায়নি...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ⏱️ Dwell Time & Engagement */}
      {/* ============================================================== */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                গড় অবস্থানকাল (Average Dwell Time)
              </span>
              <div className="mt-3 text-3xl font-extrabold text-white">
                {formatSeconds(engagementData?.avgDurationSeconds)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                প্রকৃত সক্রিয় সময়: <strong>{formatSeconds(engagementData?.avgActiveSeconds)}</strong>
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                বাউন্স রেট (Bounce Rate)
              </span>
              <div className="mt-3 text-3xl font-extrabold text-white">
                {engagementData?.bounceRate ?? 0}%
              </div>
              <p className="text-xs text-slate-400 mt-2">
                মাত্র ১ পেজ দেখে দ্রুত বের হয়ে গেছে এমন ট্রাফিক
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl">
              <span className="text-xs font-semibold text-sky-400 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                ডিভাইস ভাগাভাগি (Device Matrix)
              </span>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>📱 মোবাইল:</span>
                  <span className="font-bold">{engagementData?.deviceBreakdown?.MOBILE ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>💻 ডেক্সটপ:</span>
                  <span className="font-bold">{engagementData?.deviceBreakdown?.DESKTOP ?? 0}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>📟 ট্যাবলেট:</span>
                  <span className="font-bold">{engagementData?.deviceBreakdown?.TABLET ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Read / Visited Pages Table */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">
              শীর্ষ পঠিত পেজ ও অবস্থানকাল (Top Pages by Dwell Time)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700/60">
                  <tr>
                    <th className="p-3">র‍্যাংক</th>
                    <th className="p-3">পেজ ইউআরএল (Page Path)</th>
                    <th className="p-3">মোট ভিউ</th>
                    <th className="p-3">গড় সময় (Avg Time Spent)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {engagementData?.topPages && engagementData.topPages.length > 0 ? (
                    engagementData.topPages.map((page: any, idx: number) => (
                      <tr key={page.path} className="hover:bg-slate-700/20">
                        <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="p-3 font-mono text-sky-400">{page.path}</td>
                        <td className="p-3 font-bold text-white">{page.views} ভিউ</td>
                        <td className="p-3 font-semibold text-emerald-400">
                          {formatSeconds(page.avgDwellSeconds)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        কোনো পেজ ভিউ ডাটা পাওয়া যায়নি...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: 🧭 Traffic Sources & UTM Campaigns */}
      {/* ============================================================== */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">
              ট্রাফিক চ্যানেল অনুযায়ী উৎস (Acquisition Channels)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-700/60">
                  <tr>
                    <th className="p-3">চ্যানেল / উৎস</th>
                    <th className="p-3">ভিজিটর সেশন</th>
                    <th className="p-3">শতাংশ (%)</th>
                    <th className="p-3">গড় অবস্থানকাল</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {sourcesData?.sourceBreakdown && sourcesData.sourceBreakdown.length > 0 ? (
                    sourcesData.sourceBreakdown.map((s: any) => (
                      <tr key={s.source} className="hover:bg-slate-700/20">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5 text-sky-400" />
                          {s.source}
                        </td>
                        <td className="p-3 font-mono text-slate-200">{s.count}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-900 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-sky-500 h-full rounded-full"
                                style={{ width: `${s.percentage}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-300">{s.percentage}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-emerald-400 font-semibold">
                          {formatSeconds(s.avgDwellSeconds)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        কোনো ট্রাফিক সোর্স ডাটা পাওয়া যায়নি...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* UTM Campaigns Table */}
          {sourcesData?.utmCampaigns && sourcesData.utmCampaigns.length > 0 && (
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4">
                বিজ্ঞাপন ও ক্যাম্পেইন ট্র্যাকিং (UTM Campaigns)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sourcesData.utmCampaigns.map((c: any) => (
                  <div
                    key={c.campaign}
                    className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 flex justify-between items-center"
                  >
                    <span className="font-mono text-sky-400 text-xs truncate max-w-[200px]">
                      {c.campaign}
                    </span>
                    <span className="font-bold text-white text-sm">{c.count} ভিজিট</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: 🎯 Conversion Funnel & Behavior */}
      {/* ============================================================== */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2">
              ৫-স্টেপ কনভার্শন ফানেল (5-Step User Journey Pipeline)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              ভিজিটরের প্রথম আগমন থেকে শুরু করে একাউন্ট তৈরি ও কাজ সম্পন্ন করা পর্যন্ত প্রতিটি ধাপের
              ড্রপ-অফ ও সাফল্য হার
            </p>

            <div className="space-y-4">
              {funnelData?.funnel &&
                funnelData.funnel.map((step: any) => (
                  <div key={step.step} className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">{step.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-sky-400 font-mono mr-2">
                          {step.count} জন
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                          {step.rate}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, step.rate)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* CTA Heatmap */}
          {funnelData?.ctaClicks && funnelData.ctaClicks.length > 0 && (
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4">
                জনপ্রিয় বাটন ও অ্যাকশন ক্লিক (CTA Heatmap Clicks)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {funnelData.ctaClicks.map((c: any) => (
                  <div
                    key={c.eventName}
                    className="bg-slate-900/80 p-3 rounded-xl border border-slate-700"
                  >
                    <div className="text-[11px] text-slate-400 truncate">{c.eventName}</div>
                    <div className="text-xl font-bold text-white mt-1">{c.clicks} ক্লিক</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: 📊 Reports & Telegram Digest */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">অটোমেটেড টেলিগ্রাম ট্রাফিক ডাইজেস্ট</h3>
              <p className="text-xs text-slate-400 mt-1">
                প্রতিদিন রাত ১২:০০ টায় স্বয়ংক্রিয়ভাবে সুপার অ্যাডমিনের টেলিগ্রামে আজকের ট্রাফিকের
                সম্পূর্ণ সামারি মেসেজ চলে যায়। আপনি এখনই তাৎক্ষণিক টেস্ট রিপোর্ট পাঠাতে পারেন।
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={handleSendTelegramDigest}
                disabled={telegramLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {telegramLoading ? 'রিপোর্ট পাঠানো হচ্ছে...' : 'টেলিগ্রামে এখনই রিপোর্ট পাঠান'}
              </button>

              {telegramStatus && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  {telegramStatus}
                </span>
              )}
            </div>

            <hr className="border-slate-700/60" />

            <div>
              <h3 className="text-base font-bold text-white">ডাটা এক্সপোর্ট (Export Traffic Logs)</h3>
              <p className="text-xs text-slate-400 mt-1">
                আইপি লগ, সেশন হিস্ট্রি এবং অবস্থানকালের সমস্ত ডাটা এক্সেল বা সিএসভি ফরম্যাটে সেভ করে
                রাখার সুবিধা।
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    const jsonStr = JSON.stringify(radarData || {}, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `safnex-traffic-${dateRange}.json`;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  JSON ডাটা ডাম্প ডাউনলোড
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 360° VISITOR / IP PROFILE SLIDE-OVER DRAWER */}
      {/* ============================================================== */}
      {drawerIdentifier && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700 h-full overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  ৩৬০° ভিজিটর ও আইপি ইন্টেলিজেন্স
                </span>
                <h2 className="text-xl font-bold text-white font-mono mt-0.5">
                  {drawerIdentifier}
                </h2>
              </div>
              <button
                onClick={() => setDrawerIdentifier(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />
                ভিজিটর ডাটা লোড হচ্ছে...
              </div>
            ) : drawerProfile ? (
              <div className="space-y-6 text-xs">
                {/* Network & Device Info Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-slate-400">অপারেটর / ISP:</span>
                    <div className="font-semibold text-white mt-0.5">{drawerProfile.isp}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">অবস্থান (Location):</span>
                    <div className="font-semibold text-white mt-0.5">
                      {drawerProfile.city}, {drawerProfile.country}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">ডিভাইস ও ওএস:</span>
                    <div className="font-semibold text-white mt-0.5">
                      {drawerProfile.deviceType} • {drawerProfile.os}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">ব্রাউজার:</span>
                    <div className="font-semibold text-white mt-0.5">{drawerProfile.browser}</div>
                  </div>
                </div>

                {/* Lifetime Time & Visits */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 text-center">
                    <span className="text-slate-400 text-[10px]">মোট আগমন</span>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {drawerProfile.totalVisits} বার
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 text-center">
                    <span className="text-slate-400 text-[10px]">মোট কাটানো সময়</span>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">
                      {formatSeconds(drawerProfile.totalDurationSeconds)}
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40 text-center">
                    <span className="text-slate-400 text-[10px]">ভিজিটর ধরন</span>
                    <div className="text-sm font-bold text-purple-400 mt-1">
                      {drawerProfile.isRepeat ? '🔁 Repeat' : '🆕 New'}
                    </div>
                  </div>
                </div>

                {/* Linked Accounts */}
                {drawerProfile.linkedUsers && drawerProfile.linkedUsers.length > 0 && (
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        সংযুক্ত ইউজার অ্যাকাউন্ট ({drawerProfile.linkedUsers.length})
                      </span>
                      {drawerProfile.isMultiAccount && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          ⚠️ Multi-Account Risk
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 mt-2">
                      {drawerProfile.linkedUsers.map((u: any) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-700"
                        >
                          <div>
                            <span className="font-bold text-white">
                              {u.firstName} {u.lastName}
                            </span>
                            <div className="font-mono text-slate-400 text-[11px]">
                              @{u.uniqueUserId} • {u.email}
                            </div>
                          </div>
                          {u.isVerified && <VerifiedBadge size="xs" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Block / Unblock Button */}
                <div className="pt-2">
                  {drawerProfile.isBlocked ? (
                    <button
                      onClick={() => handleUnblockIp(drawerProfile.ipAddress)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow"
                    >
                      এই আইপি আনব্লক করুন
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setBlockingIp(drawerProfile.ipAddress);
                        setBlockReason('');
                      }}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow"
                    >
                      ⛔ এই আইপি ব্লক করুন (Block IP)
                    </button>
                  )}
                </div>

                {/* Sessions & Journey Timeline */}
                <div>
                  <h4 className="font-bold text-white text-sm mb-3">ভিজিট সেশন ও জার্নি হিস্ট্রি</h4>
                  <div className="space-y-3">
                    {drawerProfile.sessions &&
                      drawerProfile.sessions.map((sess: any, idx: number) => (
                        <div
                          key={sess.id}
                          className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/50 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                              সেশন #{drawerProfile.sessions.length - idx} •{' '}
                              {new Date(sess.createdAt).toLocaleTimeString()}
                            </span>
                            <span className="font-semibold text-emerald-400">
                              ⏱️ {formatSeconds(sess.durationSeconds)}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300">
                            উৎস: <span className="font-mono text-sky-400">{sess.trafficSource}</span>
                          </div>

                          {/* Page Views in this session */}
                          {sess.pageViews && sess.pageViews.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-slate-700 space-y-1">
                              {sess.pageViews.map((pv: any) => (
                                <div
                                  key={pv.id}
                                  className="flex items-center justify-between text-[10px] text-slate-300"
                                >
                                  <span className="font-mono text-slate-200">{pv.pagePath}</span>
                                  <span className="text-slate-400">
                                    {formatSeconds(pv.dwellSeconds)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">কোনো তথ্য পাওয়া যায়নি...</div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BLOCK IP CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {blockingIp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">আইপি ব্লক নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-400 font-mono">{blockingIp}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                ব্লক করার কারণ (Reason):
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="যেমনঃ মাল্টি-অ্যাকাউন্ট রেফারেল স্প্যাম বা সন্দেহজনক বট..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBlockingIp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-all"
              >
                বাতিল
              </button>
              <button
                onClick={handleBlockIp}
                disabled={blockSubmitting}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-rose-600 hover:bg-rose-500 transition-all disabled:opacity-50"
              >
                {blockSubmitting ? 'ব্লক হচ্ছে...' : 'হ্যাঁ, ব্লক করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
