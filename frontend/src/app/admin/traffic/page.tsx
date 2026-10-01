'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import {
  Activity,
  Users,
  Clock,
  Globe,
  ShieldAlert,
  Compass,
  RefreshCw,
  Search,
  Ban,
  CheckCircle,
  Smartphone,
  Monitor,
  Tablet,
  Share2,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Eye,
  FileSpreadsheet,
  Send,
  X,
  UserCheck,
  Zap,
  Download,
  Power,
  Filter,
  ShieldCheck,
  Sparkles,
  Megaphone,
} from 'lucide-react';
import VerifiedBadge from '@/components/common/VerifiedBadge';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function AdminTrafficPage() {
  const { lang } = useLanguage();
  const { refreshSettings } = useSettings();
  const t = (bn: string, en: string) => (lang === 'bn' ? bn : en);

  const [activeTab, setActiveTab] = useState<
    'radar' | 'new_vs_repeat' | 'ips' | 'engagement' | 'sources' | 'funnel' | 'reports'
  >('radar');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7d' | '30d'>('today');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  // Master Traffic Tracking ON/OFF State
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);
  const [adminSettingsCache, setAdminSettingsCache] = useState<any>(null);
  const [togglingTracking, setTogglingTracking] = useState<boolean>(false);
  const [trackingToast, setTrackingToast] = useState<string | null>(null);

  // Tab Data States
  const [radarData, setRadarData] = useState<any>(null);
  const [newVsRepeatData, setNewVsRepeatData] = useState<any>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [sourcesData, setSourcesData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);

  // Live Radar Quick Search & Filters
  const [radarSearch, setRadarSearch] = useState('');
  const [radarUserFilter, setRadarUserFilter] = useState<'ALL' | 'LOGGED_IN' | 'GUEST' | 'REPEAT'>('ALL');
  const [radarDeviceFilter, setRadarDeviceFilter] = useState<'ALL' | 'MOBILE' | 'DESKTOP'>('ALL');

  // IP Search & Filter
  const [ipSearch, setIpSearch] = useState('');
  const [ipStatusFilter, setIpStatusFilter] = useState<'ALL' | 'MULTI' | 'BLOCKED' | 'LINKED'>('ALL');
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

  // Load Master Traffic Tracking Setting from /settings/admin
  const fetchTrafficTrackingSetting = async () => {
    try {
      const res = await api.get('/settings/admin');
      const data = unwrap(res);
      if (data && typeof data === 'object') {
        setAdminSettingsCache(data);
        const isEnabled =
          data?.trafficTracking?.enabled !== undefined
            ? Boolean(data.trafficTracking.enabled)
            : data?.tracking?.trafficTrackingEnabled !== undefined
            ? Boolean(data.tracking.trafficTrackingEnabled)
            : true;
        setTrackingEnabled(isEnabled);
      }
    } catch (err) {
      console.error('Failed to load traffic tracking setting:', err);
    }
  };

  useEffect(() => {
    fetchTrafficTrackingSetting();
  }, []);

  const handleToggleTrafficTracking = async () => {
    const nextEnabled = !trackingEnabled;
    setTogglingTracking(true);
    setTrackingToast(null);
    try {
      const updatedTrafficTracking = {
        ...(adminSettingsCache?.trafficTracking || {
          heartbeatIntervalSeconds: 15,
          activeWindowSeconds: 180,
          autoTelegramDigest: true,
          retentionDays: 90,
        }),
        enabled: nextEnabled,
      };
      const updatedTracking = {
        ...(adminSettingsCache?.tracking || {}),
        trafficTrackingEnabled: nextEnabled,
      };

      const res = await api.post('/settings/admin', {
        trafficTracking: updatedTrafficTracking,
        tracking: updatedTracking,
      });
      const data = unwrap(res);
      if (data && typeof data === 'object') {
        setAdminSettingsCache(data);
      }
      setTrackingEnabled(nextEnabled);
      refreshSettings();
      setTrackingToast(
        nextEnabled
          ? t('ট্রাফিক ট্র্যাকিং চালু করা হয়েছে!', 'Traffic Tracking enabled!')
          : t('ট্রাফিক ট্র্যাকিং সাময়িকভাবে বন্ধ করা হয়েছে।', 'Traffic Tracking paused.')
      );
      setTimeout(() => setTrackingToast(null), 3500);
    } catch (err: any) {
      alert(
        err?.message ||
          t('ট্রাফিক ট্র্যাকিং সেটিংস পরিবর্তন ব্যর্থ হয়েছে', 'Failed to update traffic tracking setting')
      );
    } finally {
      setTogglingTracking(false);
    }
  };

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
      } else if (activeTab === 'reports') {
        await Promise.all([
          fetchRadar(),
          api.get(`/traffic/ips?page=1&limit=50`).then((r) => setIpData(unwrap(r))),
          api.get(`/traffic/engagement?range=${dateRange}`).then((r) => setEngagementData(unwrap(r))),
        ]);
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
    if (activeTab === 'radar' && autoRefresh && trackingEnabled) {
      const interval = setInterval(() => {
        fetchRadar();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, autoRefresh, trackingEnabled]);

  // Always fetch sources data when dateRange changes so top highlight cards are accurate
  useEffect(() => {
    const fetchSourcesOverview = async () => {
      try {
        const res = await api.get(`/traffic/sources?range=${dateRange}`);
        setSourcesData(unwrap(res));
      } catch (err) {
        console.error('Failed to fetch sources summary:', err);
      }
    };
    fetchSourcesOverview();
  }, [dateRange]);

  const getSourceMetric = (keyword: string) => {
    if (!sourcesData?.sourceBreakdown) return { count: 0, percentage: 0, avgDwellSeconds: 0 };
    const matches = sourcesData.sourceBreakdown.filter((s: any) =>
      s.source.toUpperCase().includes(keyword.toUpperCase())
    );
    const count = matches.reduce((acc: number, m: any) => acc + m.count, 0);
    const total = sourcesData.totalSessions || 1;
    const percentage = Number(((count / total) * 100).toFixed(1));
    const avgDwell = matches.length > 0 ? matches[0].avgDwellSeconds : 0;
    return { count, percentage, avgDwellSeconds: avgDwell };
  };

  const fbMetric = getSourceMetric('FACEBOOK');
  const directMetric = getSourceMetric('DIRECT');
  const tgMetric = getSourceMetric('TELEGRAM');
  const waMetric = getSourceMetric('WHATSAPP');
  const googleMetric = getSourceMetric('GOOGLE');
  const affiliateMetric = getSourceMetric('AFFILIATE');

  // Filtered Live Radar Sessions
  const filteredRadarSessions = useMemo(() => {
    const list: any[] = radarData?.activeSessions || [];
    return list.filter((s) => {
      // User Type Filter
      if (radarUserFilter === 'LOGGED_IN' && !s.user) return false;
      if (radarUserFilter === 'GUEST' && s.user) return false;
      if (radarUserFilter === 'REPEAT' && !s.isRepeat) return false;

      // Device Filter
      const dev = (s.deviceType || '').toUpperCase();
      if (radarDeviceFilter === 'MOBILE' && !dev.includes('MOB')) return false;
      if (radarDeviceFilter === 'DESKTOP' && !dev.includes('DESK')) return false;

      // Search Query
      if (radarSearch.trim()) {
        const q = radarSearch.toLowerCase();
        const matchPath = (s.currentPath || '').toLowerCase().includes(q);
        const matchIp = (s.ipAddress || '').toLowerCase().includes(q);
        const matchIsp = (s.isp || '').toLowerCase().includes(q);
        const matchCity = (s.city || '').toLowerCase().includes(q);
        const matchVisitor = (s.visitorId || '').toLowerCase().includes(q);
        const matchUser =
          (s.user?.firstName || '').toLowerCase().includes(q) ||
          (s.user?.uniqueUserId || '').toLowerCase().includes(q);
        if (!matchPath && !matchIp && !matchIsp && !matchCity && !matchVisitor && !matchUser) {
          return false;
        }
      }
      return true;
    });
  }, [radarData, radarUserFilter, radarDeviceFilter, radarSearch]);

  // Filtered IP Intelligence Rows
  const filteredIpItems = useMemo(() => {
    const list: any[] = ipData?.items || [];
    return list.filter((item) => {
      if (ipStatusFilter === 'MULTI' && !item.isMultiAccount) return false;
      if (ipStatusFilter === 'BLOCKED' && !item.isBlocked) return false;
      if (ipStatusFilter === 'LINKED' && (!item.linkedUsers || item.linkedUsers.length === 0)) {
        return false;
      }
      return true;
    });
  }, [ipData, ipStatusFilter]);

  // CSV Export Helper
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join(
        '\n'
      );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportRadarCsv = () => {
    const headers = [
      'Visitor / User',
      'User ID',
      'Visitor Type',
      'IP Address',
      'ISP',
      'City',
      'Device',
      'OS',
      'Browser',
      'Current Page',
      'Dwell Time (sec)',
      'Active Time (sec)',
      'Traffic Source',
    ];
    const rows = filteredRadarSessions.map((s: any) => [
      s.user ? `${s.user.firstName || ''}` : s.visitorId || 'Guest',
      s.user?.uniqueUserId || '-',
      s.isRepeat ? `Repeat (#${s.sessionNumber || 1})` : 'New',
      s.ipAddress || '-',
      s.isp || '-',
      s.city || '-',
      s.deviceType || '-',
      s.os || '-',
      s.browser || '-',
      s.currentPath || '/',
      s.durationSeconds || 0,
      s.activeSeconds || 0,
      s.trafficSource || 'DIRECT',
    ]);
    downloadCsv(`safnex-live-radar-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportIpsCsv = () => {
    const headers = [
      'IP Address',
      'ISP / Operator',
      'City',
      'Country',
      'Total Sessions',
      'Total Duration (sec)',
      'Avg Duration (sec)',
      'Linked Accounts',
      'Multi-Account Risk',
      'Status',
    ];
    const rows = filteredIpItems.map((item: any) => [
      item.ipAddress || '-',
      item.isp || '-',
      item.city || '-',
      item.country || '-',
      item.sessionCount || 0,
      item.totalDurationSeconds || 0,
      item.avgDurationSeconds || 0,
      item.linkedUsers && item.linkedUsers.length > 0
        ? item.linkedUsers.map((u: any) => `@${u.uniqueUserId}`).join(' | ')
        : 'Guest',
      item.isMultiAccount ? 'YES' : 'NO',
      item.isBlocked ? 'BLOCKED' : 'ACTIVE',
    ]);
    downloadCsv(`safnex-ip-intelligence-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

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
      alert(err.message || t('আইপি ব্লক করতে ব্যর্থ হয়েছে', 'Failed to block IP'));
    } finally {
      setBlockSubmitting(false);
    }
  };

  // Unblock IP handler
  const handleUnblockIp = async (ip: string) => {
    if (
      !confirm(
        t(
          `আপনি কি নিশ্চিত যে এই আইপি আনব্লক করতে চান: ${ip}?`,
          `Are you sure you want to unblock IP: ${ip}?`
        )
      )
    )
      return;
    try {
      await api.delete(`/traffic/ips/block/${encodeURIComponent(ip)}`);
      fetchCurrentTabData();
      if (drawerIdentifier === ip) {
        openDrawer(ip);
      }
    } catch (err: any) {
      alert(err.message || t('আইপি আনব্লক করতে ব্যর্থ হয়েছে', 'Failed to unblock IP'));
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
        t(
          `সফলভাবে টেলিগ্রামে পাঠানো হয়েছে! (মোট প্রাপক: ${data?.sentTo || 1})`,
          `Successfully sent to Telegram! (Recipients: ${data?.sentTo || 1})`
        )
      );
    } catch (err: any) {
      setTelegramStatus(
        t(`ত্রুটি: ${err.message || 'পাঠানো যায়নি'}`, `Error: ${err.message || 'Failed to send'}`)
      );
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
    const tp = (type || '').toUpperCase();
    if (tp.includes('DESK')) return <Monitor className="w-4 h-4 text-blue-500 shrink-0" />;
    if (tp.includes('TAB')) return <Tablet className="w-4 h-4 text-purple-500 shrink-0" />;
    return <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />;
  };

  const dateRangeLabel =
    dateRange === 'today'
      ? t('আজকের ট্রাফিক', "Today's Traffic")
      : dateRange === 'yesterday'
      ? t('গতকালের ট্রাফিক', "Yesterday's Traffic")
      : dateRange === '7d'
      ? t('গত ৭ দিনের ট্রাফিক', 'Last 7 Days Traffic')
      : t('গত ৩০ দিনের ট্রাফিক', 'Last 30 Days Traffic');

  const navigationTabs = [
    {
      id: 'radar',
      label: t('🔴 লাইভ রাডার', '🔴 Live Radar'),
      sub: t('সক্রিয় ভিজিটর', 'Active Now'),
      badge: radarData?.activeCount ?? 0,
      icon: Activity,
    },
    {
      id: 'new_vs_repeat',
      label: t('👥 নতুন বনাম রিপিট', '👥 New vs Repeat'),
      sub: t('ভিজিটর রিটেনশন', 'Visitor Retention'),
      icon: Users,
    },
    {
      id: 'ips',
      label: t('🌐 আইপি ও সিকিউরিটি', '🌐 IP & Security'),
      sub: t('ফ্রড ও মাল্টি-একাউন্ট', 'Fraud & Multi-ID'),
      badge: ipData?.multiAccountIpsCount || undefined,
      icon: ShieldAlert,
    },
    {
      id: 'engagement',
      label: t('⏱️ এনগেজমেন্ট', '⏱️ Engagement'),
      sub: t('অবস্থানকাল ও বাউন্স', 'Dwell & Bounce'),
      icon: Clock,
    },
    {
      id: 'sources',
      label: t('📣 ট্রাফিক সোর্স', '📣 Traffic Sources'),
      sub: t('চ্যানেল ও UTM', 'Channels & UTM'),
      icon: Megaphone,
    },
    {
      id: 'funnel',
      label: t('🎯 কনভার্শন ফানেল', '🎯 Funnel'),
      sub: t('ইউজার জার্নি', 'User Journey'),
      icon: TrendingUp,
    },
    {
      id: 'reports',
      label: t('📊 রিপোর্ট ও টেলিগ্রাম', '📊 Reports'),
      sub: t('এক্সপোর্ট ও ডাইজেস্ট', 'Export & Digest'),
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="space-y-5 pb-10 text-slate-900 dark:text-slate-100">
      {/* 1. Header, Master Switch & Live Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-800/90 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t('ট্রাফিক ও ভিজিটর ইন্টেলিজেন্স', 'Traffic & Visitor Intelligence')}
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                {t('রিয়েল-টাইম ইঞ্জিন', 'Real-Time Engine')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t(
                'লাইভ ভিজিটর রাডার, অবস্থানকাল (Dwell Time), আইপি অডিট, ট্রাফিক উৎস এবং কনভার্শন ফানেল',
                'Live visitor radar, dwell time analytics, IP fraud audit, acquisition sources & conversion funnel'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls & Master Traffic Tracking Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Master Traffic Tracking ON/OFF Toggle */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <Power
                className={`w-4 h-4 ${
                  trackingEnabled ? 'text-emerald-500' : 'text-rose-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t('ট্রাফিক ট্র্যাকিং:', 'Traffic Tracking:')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleTrafficTracking}
              disabled={togglingTracking}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                trackingEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title={t(
                'ট্রাফিক ট্র্যাকিং চালু বা বন্ধ করুন',
                'Toggle Website Traffic Tracking ON or OFF'
              )}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  trackingEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                trackingEnabled
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {togglingTracking
                ? '...'
                : trackingEnabled
                ? t('চালু (ON)', 'ON')
                : t('বন্ধ (OFF)', 'OFF')}
            </span>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['today', 'yesterday', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateRange === r
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r === 'today'
                  ? t('আজ', 'Today')
                  : r === 'yesterday'
                  ? t('গতকাল', 'Yesterday')
                  : r === '7d'
                  ? t('৭ দিন', '7 Days')
                  : t('৩০ দিন', '30 Days')}
              </button>
            ))}
          </div>

          {/* Auto Refresh Toggle */}
          {activeTab === 'radar' && (
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                }`}
              />
              {autoRefresh ? t('অটো লাইভ (১০ সে.)', 'Auto Live (10s)') : t('পজড', 'Paused')}
            </button>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchCurrentTabData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-600 disabled:opacity-50"
            title={t('ডাটা রিফ্রেশ করুন', 'Refresh Data')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
            <span className="hidden sm:inline">{t('রিফ্রেশ', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Toast or Disabled Banner */}
      {trackingToast && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{trackingToast}</span>
          </div>
          <button onClick={() => setTrackingToast(null)} className="text-xs opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!trackingEnabled && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {t(
                'সতর্কতা: ট্রাফিক ট্র্যাকিং বর্তমানে বন্ধ (OFF) আছে। নতুন ভিজিটর সেশন রেকর্ড করতে উপরের সুইচটি চালু (ON) করুন।',
                'Note: Traffic Tracking is currently turned OFF. Turn the switch ON in the header to resume recording live visitor sessions.'
              )}
            </span>
          </div>
          <button
            onClick={handleToggleTrafficTracking}
            disabled={togglingTracking}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 transition"
          >
            {t('এখনই চালু করুন', 'Turn ON Now')}
          </button>
        </div>
      )}

      {/* 2. Top Prominent Traffic Sources Highlight Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-sky-500" />
            <span>
              {t(
                'শীর্ষ ট্রাফিক উৎস এক নজরে (Traffic Acquisition Channels)',
                'Top Traffic Acquisition Channels at a Glance'
              )}
            </span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {dateRangeLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Facebook */}
          <div
            onClick={() => setActiveTab('sources')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 border border-blue-200 dark:border-blue-500/30 hover:border-blue-500 p-4 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-base group-hover:bg-blue-600 group-hover:text-white transition">
                f
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                {fbMetric.percentage}%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Facebook</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {fbMetric.count}{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {t('জন', 'visits')}
              </span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 truncate font-medium">
              <Clock className="w-3 h-3" /> {formatSeconds(fbMetric.avgDwellSeconds)}
            </div>
          </div>

          {/* 2. Direct */}
          <div
            onClick={() => setActiveTab('sources')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 border border-sky-200 dark:border-sky-500/30 hover:border-sky-500 p-4 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold group-hover:bg-sky-600 group-hover:text-white transition">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300">
                {directMetric.percentage}%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('ডিরেক্ট ভিজিট', 'Direct Visit')}
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {directMetric.count}{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {t('জন', 'visits')}
              </span>
            </div>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1 truncate font-medium">
              <Clock className="w-3 h-3" /> {formatSeconds(directMetric.avgDwellSeconds)}
            </div>
          </div>

          {/* 3. Telegram */}
          <div
            onClick={() => setActiveTab('sources')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 border border-cyan-200 dark:border-cyan-500/30 hover:border-cyan-500 p-4 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold group-hover:bg-cyan-600 group-hover:text-white transition">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
                {tgMetric.percentage}%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Telegram</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {tgMetric.count}{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {t('জন', 'visits')}
              </span>
            </div>
            <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-1 truncate font-medium">
              <Clock className="w-3 h-3" /> {formatSeconds(tgMetric.avgDwellSeconds)}
            </div>
          </div>

          {/* 4. WhatsApp */}
          <div
            onClick={() => setActiveTab('sources')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-500 p-4 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                {waMetric.percentage}%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">WhatsApp</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {waMetric.count}{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {t('জন', 'visits')}
              </span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 truncate font-medium">
              <Clock className="w-3 h-3" /> {formatSeconds(waMetric.avgDwellSeconds)}
            </div>
          </div>

          {/* 5. Google Search */}
          <div
            onClick={() => setActiveTab('sources')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 border border-amber-200 dark:border-amber-500/30 hover:border-amber-500 p-4 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">
                {googleMetric.percentage}%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Google Search</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {googleMetric.count}{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {t('জন', 'visits')}
              </span>
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 truncate font-medium">
              <Clock className="w-3 h-3" /> {formatSeconds(googleMetric.avgDwellSeconds)}
            </div>
          </div>

          {/* 6. Affiliate / Referrals */}
          <div
            onClick={() => setActiveTab('sources')}
            className="cursor-pointer bg-white dark:bg-slate-800/90 border border-purple-200 dark:border-purple-500/30 hover:border-purple-500 p-4 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                {affiliateMetric.percentage}%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {t('রেফারেল / অন্যান্য', 'Referrals / Other')}
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {affiliateMetric.count}{' '}
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                {t('জন', 'visits')}
              </span>
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1 truncate font-medium">
              <Clock className="w-3 h-3" /> {formatSeconds(affiliateMetric.avgDwellSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Desktop-Friendly 7-Tab Responsive Grid Bar (All 7 visible at once on Desktop without scroll arrows) */}
      <div className="bg-white dark:bg-slate-800/90 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20 border-sky-500'
                    : 'bg-slate-50/80 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">{tab.label}</div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? 'text-sky-100' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {tab.sub}
                  </div>
                </div>
                {tab.badge !== undefined ? (
                  <span
                    className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : (
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* ============================================================== */}
      {/* TAB 1: 🔴 Live Radar */}
      {/* ============================================================== */}
      {activeTab === 'radar' && (
        <div className="space-y-5">
          {/* Live Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-800/90 dark:to-slate-800/90 border border-emerald-500/30 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  {t('বর্তমানে লাইভ সক্রিয়', 'Active Right Now')}
                </span>
                <Users className="w-5 h-5 text-emerald-500 opacity-80" />
              </div>
              <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {radarData?.activeCount ?? 0}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
                  {t('জন ভিজিটর', 'active visitors')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t('গত ৩ মিনিটে ওয়েবসাইটে সক্রিয় আছেন', 'Browsing within the last 3 minutes')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {t('শীর্ষ সক্রিয় পেজ', 'Top Active Page')}
              </span>
              <div className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white truncate font-mono">
                {radarData?.pageDistribution?.[0]?.path || t('হোমপেজ (/)', 'Homepage (/)')}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {radarData?.pageDistribution?.[0]?.count || 0}{' '}
                {t('জন বর্তমানে এই পেজে আছেন', 'visitors viewing this page')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                {t('মোবাইল ইউজার অনুপাত', 'Mobile Traffic Share')}
              </span>
              <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                {radarData?.activeSessions && radarData.activeSessions.length > 0
                  ? Math.round(
                      (radarData.activeSessions.filter((s: any) => s.deviceType === 'MOBILE')
                        .length /
                        radarData.activeSessions.length) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t('স্মার্টফোন দিয়ে ব্রাউজ করছেন', 'Browsing from mobile devices')}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                {t('রিটার্নিং ও লগইন ভিজিটর', 'Returning & Logged-In')}
              </span>
              <div className="mt-3 flex items-baseline gap-3">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {radarData?.activeSessions
                    ? radarData.activeSessions.filter((s: any) => s.isRepeat).length
                    : 0}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                    {t('রিপিট', 'repeat')}
                  </span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {radarData?.activeSessions
                    ? radarData.activeSessions.filter((s: any) => Boolean(s.user)).length
                    : 0}{' '}
                  {t('লগইন', 'logged-in')}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t('পূর্বে ভিজিট করেছেন বা একাউন্টে আছেন', 'Returning visitors & authenticated users')}
              </p>
            </div>
          </div>

          {/* Active Page Distribution Pills */}
          {radarData?.pageDistribution && radarData.pageDistribution.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5">
                {t(
                  'রিয়েল-টাইম পেজ অনুযায়ী সক্রিয় ভিজিটর:',
                  'Real-Time Active Visitors by Page:'
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {radarData.pageDistribution.map((p: any) => (
                  <button
                    key={p.path}
                    onClick={() =>
                      setRadarSearch((prev) => (prev === p.path ? '' : p.path))
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                      radarSearch === p.path
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                    }`}
                  >
                    <span className="font-mono font-semibold">{p.path}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-bold ${
                        radarSearch === p.path
                          ? 'bg-white/20 text-white'
                          : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                      }`}
                    >
                      {p.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Search & Filter Bar for Live Radar */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={radarSearch}
                onChange={(e) => setRadarSearch(e.target.value)}
                placeholder={t(
                  'পেজ ইউআরএল, আইপি, নাম, ইউজার আইডি বা শহর লিখে খুঁজুন...',
                  'Filter live visitors by page URL, IP, user name, ID or city...'
                )}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
              {radarSearch && (
                <button
                  onClick={() => setRadarSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills & CSV Export */}
            <div className="flex flex-wrap items-center gap-2">
              {/* User Type Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: 'ALL', label: t('সকল', 'All') },
                    { id: 'LOGGED_IN', label: t('লগইন ইউজার', 'Logged-In') },
                    { id: 'GUEST', label: t('গেস্ট', 'Guests') },
                    { id: 'REPEAT', label: t('রিপিট', 'Repeat') },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setRadarUserFilter(f.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      radarUserFilter === f.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Device Filter Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: 'ALL', label: t('সব ডিভাইস', 'All Devices') },
                    { id: 'MOBILE', label: t('📱 মোবাইল', '📱 Mobile') },
                    { id: 'DESKTOP', label: t('💻 ডেক্সটপ', '💻 Desktop') },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setRadarDeviceFilter(d.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      radarDeviceFilter === d.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* 1-Click CSV Export */}
              <button
                onClick={handleExportRadarCsv}
                disabled={filteredRadarSessions.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('CSV এক্সপোর্ট', 'Export CSV')}</span>
              </button>
            </div>
          </div>

          {/* Live Visitor Stream Table */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {t(
                  'লাইভ ভিজিটর স্ট্রিম (Real-Time Active Visitors)',
                  'Live Visitor Stream (Real-Time Active Visitors)'
                )}
              </h2>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {filteredRadarSessions.length}{' '}
                {t('জন প্রদর্শিত হচ্ছে', 'shown')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    <th className="p-3.5">{t('ভিজিটর / একাউন্ট', 'Visitor / Account')}</th>
                    <th className="p-3.5">{t('আইপি ও নেটওয়ার্ক (ISP)', 'IP & Network (ISP)')}</th>
                    <th className="p-3.5">{t('ডিভাইস ও ব্রাউজার', 'Device & Browser')}</th>
                    <th className="p-3.5">{t('বর্তমান পেজ', 'Current Page')}</th>
                    <th className="p-3.5">{t('অবস্থানকাল (Dwell)', 'Dwell Time')}</th>
                    <th className="p-3.5">{t('উৎস (Source)', 'Traffic Source')}</th>
                    <th className="p-3.5 text-right">{t('অ্যাকশন', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/40">
                  {filteredRadarSessions.length > 0 ? (
                    filteredRadarSessions.map((s: any) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-700/25 transition-colors"
                      >
                        {/* Visitor / User */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {s.user ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {s.user.firstName} ({s.user.uniqueUserId})
                                </span>
                                {s.user.isVerified && <VerifiedBadge size="xs" />}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-600 dark:text-slate-300 font-mono">
                                  {(s.visitorId || 'guest').substring(0, 10)}...
                                </span>
                                {s.isRepeat ? (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                    🔁 #{s.sessionNumber}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                    🆕 {t('নতুন', 'New')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* IP & ISP */}
                        <td className="p-3.5">
                          <button
                            onClick={() => openDrawer(s.ipAddress)}
                            className="font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            {s.ipAddress}
                          </button>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {s.isp} • {s.city}
                          </div>
                        </td>

                        {/* Device & Browser */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
                            {getDeviceIcon(s.deviceType)}
                            <span>{s.browser || 'Browser'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {s.os}
                          </div>
                        </td>

                        {/* Current Path */}
                        <td className="p-3.5">
                          <span className="font-mono text-sky-700 dark:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 font-semibold">
                            {s.currentPath}
                          </span>
                        </td>

                        {/* Dwell Time / Live Stopwatch */}
                        <td className="p-3.5">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatSeconds(s.durationSeconds)}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {t('সক্রিয়:', 'Active:')} {formatSeconds(s.activeSeconds)}
                          </div>
                        </td>

                        {/* Traffic Source */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-200 font-mono text-[10px] font-bold">
                            {s.trafficSource}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => openDrawer(s.ipAddress)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-all shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('৩৬০° ভিউ', '360° View')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setBlockingIp(s.ipAddress);
                              setBlockReason('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg border border-rose-500/30 transition-all"
                            title={t('এই আইপি ব্লক করুন', 'Block this IP')}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">{t('ব্লক', 'Block')}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500 dark:text-slate-400">
                        {radarSearch || radarUserFilter !== 'ALL' || radarDeviceFilter !== 'ALL'
                          ? t(
                              'আপনার ফিল্টারের সাথে মিলে এমন কোনো সক্রিয় ভিজিটর পাওয়া যায়নি।',
                              'No active visitors match your current search or filter criteria.'
                            )
                          : t(
                              'বর্তমানে কোনো সক্রিয় ভিজিটর নেই অথবা ডাটা রিফ্রেশ হচ্ছে...',
                              'No active visitors right now or refreshing live radar...'
                            )}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* New Visitors Card */}
            <div className="bg-white dark:bg-slate-800/90 border border-emerald-500/30 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  {t('নতুন ভিজিটর (New Visitors)', 'New Visitors (First-Time)')}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-mono font-bold">
                  {newVsRepeatData?.newRatio ?? 0}%
                </span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                {newVsRepeatData?.newSessions ?? 0}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                  {t('টি সেশন', 'sessions')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t('গড় অবস্থানকাল:', 'Avg Dwell Time:')}{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatSeconds(newVsRepeatData?.avgNewDwellSeconds)}
                </strong>
              </p>
            </div>

            {/* Repeat Visitors Card */}
            <div className="bg-white dark:bg-slate-800/90 border border-purple-500/30 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  {t('রিপিট ভিজিটর (Repeat Visitors)', 'Repeat Visitors (Returning)')}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono font-bold">
                  {newVsRepeatData?.repeatRatio ?? 0}%
                </span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                {newVsRepeatData?.repeatSessions ?? 0}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                  {t('টি সেশন', 'sessions')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t('গড় অবস্থানকাল:', 'Avg Dwell Time:')}{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatSeconds(newVsRepeatData?.avgRepeatDwellSeconds)}
                </strong>
              </p>
            </div>

            {/* Total Aggregate */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {t('মোট সেশন ও তুলনা', 'Total Sessions & Comparison')}
              </h3>
              <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                {newVsRepeatData?.totalSessions ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t(
                  'রিটার্নিং ইউজাররা নতুনদের তুলনায় গড়ে ',
                  'Returning visitors stay on average '
                )}
                <strong className="text-sky-600 dark:text-sky-400">
                  {newVsRepeatData?.avgRepeatDwellSeconds && newVsRepeatData?.avgNewDwellSeconds
                    ? Math.round(
                        (newVsRepeatData.avgRepeatDwellSeconds /
                          (newVsRepeatData.avgNewDwellSeconds || 1)) *
                          10
                      ) / 10
                    : 1}
                  x
                </strong>{' '}
                {t('বেশি সময় ওয়েবসাইটে থাকেন।', 'longer than first-time visitors.')}
              </p>
            </div>
          </div>

          {/* Frequency Breakdown */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-6 rounded-2xl shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
              {t(
                'ভিজিটরের আগমনের ফ্রিকোয়েন্সি (Visitor Return Frequency)',
                'Visitor Return Frequency Breakdown'
              )}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('১ বার ভিজিট করেছে', 'Visited Once (1x)')}
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.once ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {t('প্রথমবারের ভিজিটর', 'First-time visitors')}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('২ থেকে ৫ বার', '2 to 5 Visits')}
                </div>
                <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.twoToFive ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {t('আগ্রহী রিটার্নিং ট্রাফিক', 'Warm returning traffic')}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('৬ থেকে ১০ বার', '6 to 10 Visits')}
                </div>
                <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.sixToTen ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {t('সক্রিয় নিয়মিত গ্রাহক', 'Active regular users')}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('১১+ বার ভিজিট', '11+ Visits')}
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {newVsRepeatData?.frequencyBreakdown?.elevenPlus ?? 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {t('লয়াল পাওয়ার ইউজার', 'Loyal power users')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: 🌐 IP Intelligence & Fraud Audit */}
      {/* ============================================================== */}
      {activeTab === 'ips' && (
        <div className="space-y-5">
          {/* IP Stats Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('মোট ইউনিক আইপি (Unique IPs)', 'Total Unique IPs')}
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {ipData?.totalUniqueIps ?? 0}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/90 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {t('মাল্টি-অ্যাকাউন্ট আইপি (Multi-Account)', 'Multi-Account IPs')}
                </div>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {ipData?.multiAccountIpsCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-amber-200/70">
                  {t('একই আইপি থেকে ২+ একাউন্ট লগইন', '2+ accounts accessed from same IP')}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/90 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  {t('ব্লকড আইপি (Blocked Blacklist)', 'Blocked IPs (Blacklist)')}
                </div>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  {ipData?.blockedIpsCount ?? 0}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-rose-200/70">
                  {t('সাইট এক্সেস নিষিদ্ধ করা হয়েছে', 'Banned from accessing the platform')}
                </div>
              </div>
            </div>
          </div>

          {/* Search, Quick Filter Pills & CSV Export */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ipSearch}
                onChange={(e) => setIpSearch(e.target.value)}
                placeholder={t(
                  'আইপি অ্যাড্রেস, ISP বা শহর লিখে সার্চ করুন (যেমনঃ 103.204..., Grameenphone, Dhaka)...',
                  'Search by IP address, ISP or city (e.g., 103.204..., Grameenphone, Dhaka)...'
                )}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
              {ipSearch && (
                <button
                  onClick={() => setIpSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: 'ALL', label: t('সকল আইপি', 'All IPs') },
                    { id: 'MULTI', label: t('⚠️ মাল্টি-অ্যাকাউন্ট', '⚠️ Multi-Account') },
                    { id: 'LINKED', label: t('👤 ইউজার সংযুক্ত', '👤 Linked Users') },
                    { id: 'BLOCKED', label: t('⛔ ব্লকড', '⛔ Blocked') },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setIpStatusFilter(f.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      ipStatusFilter === f.id
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportIpsCsv}
                disabled={filteredIpItems.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('CSV এক্সপোর্ট', 'Export CSV')}</span>
              </button>
            </div>
          </div>

          {/* IP Intelligence Table */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    <th className="p-3.5">{t('আইপি অ্যাড্রেস', 'IP Address')}</th>
                    <th className="p-3.5">{t('অপারেটর / ISP ও শহর', 'Operator / ISP & City')}</th>
                    <th className="p-3.5">{t('মোট সেশন', 'Total Sessions')}</th>
                    <th className="p-3.5">{t('মোট অবস্থানকাল', 'Lifetime Dwell')}</th>
                    <th className="p-3.5">{t('গড় সেশন সময়', 'Avg Session')}</th>
                    <th className="p-3.5">{t('লিংকড ইউজার একাউন্ট', 'Linked User Accounts')}</th>
                    <th className="p-3.5">{t('স্ট্যাটাস', 'Status')}</th>
                    <th className="p-3.5 text-right">{t('অ্যাকশন', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/40">
                  {filteredIpItems.length > 0 ? (
                    filteredIpItems.map((item: any) => (
                      <tr
                        key={item.ipAddress}
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-700/25 transition-colors"
                      >
                        {/* IP */}
                        <td className="p-3.5">
                          <button
                            onClick={() => openDrawer(item.ipAddress)}
                            className="font-mono text-sky-600 dark:text-sky-400 hover:underline font-bold"
                          >
                            {item.ipAddress}
                          </button>
                        </td>

                        {/* ISP & City */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.isp}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.city}, {item.country}
                          </div>
                        </td>

                        {/* Sessions */}
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                          {item.sessionCount} {t('বার', 'visits')}
                        </td>

                        {/* Total Duration */}
                        <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatSeconds(item.totalDurationSeconds)}
                        </td>

                        {/* Avg Duration */}
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                          {formatSeconds(item.avgDurationSeconds)}
                        </td>

                        {/* Linked Accounts / Multi-Account Flag */}
                        <td className="p-3.5">
                          {item.linkedUsers && item.linkedUsers.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {item.linkedUsers.map((u: any) => (
                                <span
                                  key={u.id}
                                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700 font-semibold"
                                >
                                  @{u.uniqueUserId}
                                </span>
                              ))}
                              {item.isMultiAccount && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                  ⚠️ {t('মাল্টি-অ্যাকাউন্ট!', 'Multi-Account!')}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">
                              {t('গেস্ট (লগইন করেনি)', 'Guest (Not logged in)')}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          {item.isBlocked ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] font-extrabold">
                              ⛔ {t('ব্লকড', 'BLOCKED')}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              {t('সক্রিয়', 'Active')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => openDrawer(item.ipAddress)}
                            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all"
                          >
                            {t('৩৬০° ভিউ', '360° View')}
                          </button>
                          {item.isBlocked ? (
                            <button
                              onClick={() => handleUnblockIp(item.ipAddress)}
                              className="px-2.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all font-bold"
                            >
                              {t('আনব্লক', 'Unblock')}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setBlockingIp(item.ipAddress);
                                setBlockReason('');
                              }}
                              className="px-2.5 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all font-bold"
                            >
                              {t('ব্লক করুন', 'Block IP')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-500 dark:text-slate-400">
                        {t('কোনো আইপি রেকর্ড পাওয়া যায়নি...', 'No IP records found...')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {t('পৃষ্ঠা', 'Page')} <strong>{ipPage}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIpPage((p) => Math.max(1, p - 1))}
                  disabled={ipPage <= 1 || loading}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-40 transition"
                >
                  {t('পূর্ববর্তী', 'Previous')}
                </button>
                <button
                  onClick={() => setIpPage((p) => p + 1)}
                  disabled={(ipData?.items?.length || 0) < 30 || loading}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-40 transition"
                >
                  {t('পরবর্তী', 'Next')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ⏱️ Dwell Time & Engagement */}
      {/* ============================================================== */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-6 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('গড় অবস্থানকাল (Average Dwell Time)', 'Average Dwell Time')}
              </span>
              <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatSeconds(engagementData?.avgDurationSeconds)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t('প্রকৃত সক্রিয় সময়:', 'Active Engagement Time:')}{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {formatSeconds(engagementData?.avgActiveSeconds)}
                </strong>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-6 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('বাউন্স রেট (Bounce Rate)', 'Bounce Rate')}
              </span>
              <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {engagementData?.bounceRate ?? 0}%
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t(
                  'মাত্র ১ পেজ দেখে দ্রুত বের হয়ে গেছে এমন ভিজিটর',
                  'Single-page sessions with quick exit'
                )}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 p-6 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                {t('ডিভাইস ভাগাভাগি (Device Matrix)', 'Device Breakdown')}
              </span>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{t('📱 মোবাইল (Mobile):', '📱 Mobile:')}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {engagementData?.deviceBreakdown?.MOBILE ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{t('💻 ডেক্সটপ (Desktop):', '💻 Desktop:')}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {engagementData?.deviceBreakdown?.DESKTOP ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>{t('📟 ট্যাবলেট (Tablet):', '📟 Tablet:')}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {engagementData?.deviceBreakdown?.TABLET ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Read / Visited Pages Table */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
              {t(
                'শীর্ষ পঠিত পেজ ও অবস্থানকাল (Top Pages by Dwell Time)',
                'Top Visited Pages & Average Dwell Time'
              )}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    <th className="p-3">{t('র‍্যাংক', 'Rank')}</th>
                    <th className="p-3">{t('পেজ ইউআরএল (Page Path)', 'Page Path')}</th>
                    <th className="p-3">{t('মোট ভিউ', 'Total Views')}</th>
                    <th className="p-3">{t('গড় সময় (Avg Time Spent)', 'Avg Time Spent')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/40">
                  {engagementData?.topPages && engagementData.topPages.length > 0 ? (
                    engagementData.topPages.map((page: any, idx: number) => (
                      <tr
                        key={page.path}
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-700/25"
                      >
                        <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="p-3 font-mono font-semibold text-sky-600 dark:text-sky-400">
                          {page.path}
                        </td>
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                          {page.views} {t('ভিউ', 'views')}
                        </td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatSeconds(page.avgDwellSeconds)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        {t('কোনো পেজ ভিউ ডাটা পাওয়া যায়নি...', 'No page view data available...')}
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
      {/* TAB 5: 📣 Traffic Sources & UTM Campaigns */}
      {/* ============================================================== */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
              {t(
                'ট্রাফিক চ্যানেল অনুযায়ী উৎস (Traffic Acquisition Channels)',
                'Traffic Acquisition Channels Breakdown'
              )}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    <th className="p-3">{t('চ্যানেল / উৎস', 'Channel / Source')}</th>
                    <th className="p-3">{t('ভিজিটর সেশন', 'Visitor Sessions')}</th>
                    <th className="p-3">{t('শতাংশ (%)', 'Share (%)')}</th>
                    <th className="p-3">{t('গড় অবস্থানকাল', 'Avg Dwell Time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/40">
                  {sourcesData?.sourceBreakdown && sourcesData.sourceBreakdown.length > 0 ? (
                    sourcesData.sourceBreakdown.map((s: any) => (
                      <tr
                        key={s.source}
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-700/25"
                      >
                        <td className="p-3 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5 text-sky-500" />
                          {s.source}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-200">
                          {s.count}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-28 bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-sky-500 h-full rounded-full"
                                style={{ width: `${s.percentage}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {s.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatSeconds(s.avgDwellSeconds)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        {t(
                          'কোনো ট্রাফিক সোর্স ডাটা পাওয়া যায়নি...',
                          'No traffic source data found...'
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* UTM Campaigns Table */}
          {sourcesData?.utmCampaigns && sourcesData.utmCampaigns.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
                {t(
                  'বিজ্ঞাপন ও ক্যাম্পেইন ট্র্যাকিং (UTM Campaigns)',
                  'Marketing & Ad Campaigns (UTM)'
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sourcesData.utmCampaigns.map((c: any) => (
                  <div
                    key={c.campaign}
                    className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                  >
                    <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 text-xs truncate max-w-[200px]">
                      {c.campaign}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {c.count} {t('ভিজিট', 'visits')}
                    </span>
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
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5">
              {t(
                '৫-স্টেপ কনভার্শন ফানেল (5-Step User Journey Pipeline)',
                '5-Step Conversion Funnel & User Journey'
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {t(
                'ভিজিটরের প্রথম আগমন থেকে শুরু করে একাউন্ট তৈরি ও কাজ সম্পন্ন করা পর্যন্ত প্রতিটি ধাপের ড্রপ-অফ ও সাফল্য হার',
                'Step-by-step conversion rate from initial landing to registration and transaction completion'
              )}
            </p>

            <div className="space-y-4">
              {funnelData?.funnel && funnelData.funnel.length > 0 ? (
                funnelData.funnel.map((step: any) => (
                  <div
                    key={step.step}
                    className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {step.name}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 font-mono mr-2">
                          {step.count} {t('জন', 'users')}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-300 font-bold">
                          {step.rate}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, step.rate)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {t('ফানেল ডাটা লোড হচ্ছে...', 'Loading funnel analytics...')}
                </div>
              )}
            </div>
          </div>

          {/* CTA Heatmap */}
          {funnelData?.ctaClicks && funnelData.ctaClicks.length > 0 && (
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
                {t(
                  'জনপ্রিয় বাটন ও অ্যাকশন ক্লিক (CTA Heatmap Clicks)',
                  'Popular Button & Action Clicks (CTA Heatmap)'
                )}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {funnelData.ctaClicks.map((c: any) => (
                  <div
                    key={c.eventName}
                    className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {c.eventName}
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {c.clicks} {t('ক্লিক', 'clicks')}
                    </div>
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
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t(
                  'অটোমেটেড টেলিগ্রাম ট্রাফিক ডাইজেস্ট',
                  'Automated Telegram Traffic Digest'
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t(
                  'প্রতিদিন রাত ১২:০০ টায় স্বয়ংক্রিয়ভাবে সুপার অ্যাডমিনের টেলিগ্রামে আজকের ট্রাফিকের সম্পূর্ণ সামারি মেসেজ চলে যায়। আপনি এখনই তাৎক্ষণিক টেস্ট রিপোর্ট পাঠাতে পারেন।',
                  'Every midnight at 12:00 AM, a complete daily traffic summary is automatically sent to the Super Admin Telegram. You can also trigger an instant digest below.'
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={handleSendTelegramDigest}
                disabled={telegramLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {telegramLoading
                  ? t('রিপোর্ট পাঠানো হচ্ছে...', 'Sending Digest...')
                  : t('টেলিগ্রামে এখনই রিপোর্ট পাঠান', 'Send Instant Digest to Telegram')}
              </button>

              {telegramStatus && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/30">
                  {telegramStatus}
                </span>
              )}
            </div>

            <hr className="border-slate-200 dark:border-slate-700/60" />

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t('ডাটা এক্সপোর্ট (Export Traffic Logs)', 'Export Traffic & Security Logs')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t(
                  'আইপি লগ, লাইভ সেশন হিস্ট্রি এবং অবস্থানকালের সমস্ত ডাটা এক্সেল (CSV) বা JSON ফরম্যাটে ডাউনলোড করুন।',
                  'Download IP intelligence logs, active visitor sessions, or full JSON snapshots for external analysis.'
                )}
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handleExportRadarCsv}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  {t('লাইভ ভিজিটর CSV ডাউনলোড', 'Download Live Visitors CSV')}
                </button>

                <button
                  onClick={handleExportIpsCsv}
                  className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  {t('আইপি অডিট CSV ডাউনলোড', 'Download IP Audit CSV')}
                </button>

                <button
                  onClick={() => {
                    const jsonStr = JSON.stringify(
                      {
                        exportedAt: new Date().toISOString(),
                        dateRange,
                        radar: radarData,
                        sources: sourcesData,
                        engagement: engagementData,
                        ips: ipData,
                      },
                      null,
                      2
                    );
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `safnex-traffic-${dateRange}.json`;
                    a.click();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-600"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  {t('JSON ডাটা ডাম্প ডাউনলোড', 'Download Full JSON Dump')}
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
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto shadow-2xl p-6 space-y-6 text-slate-900 dark:text-slate-100">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  {t('৩৬০° ভিজিটর ও আইপি ইন্টেলিজেন্স', '360° Visitor & IP Intelligence')}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {drawerIdentifier}
                </h2>
              </div>
              <button
                onClick={() => setDrawerIdentifier(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drawerLoading ? (
              <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-500 mb-2" />
                {t('ভিজিটর ডাটা লোড হচ্ছে...', 'Loading visitor profile...')}
              </div>
            ) : drawerProfile ? (
              <div className="space-y-6 text-xs">
                {/* Network & Device Info Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('অপারেটর / ISP:', 'Operator / ISP:')}
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {drawerProfile.isp}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('অবস্থান (Location):', 'Location:')}
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {drawerProfile.city}, {drawerProfile.country}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('ডিভাইস ও ওএস:', 'Device & OS:')}
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {drawerProfile.deviceType} • {drawerProfile.os}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">
                      {t('ব্রাউজার:', 'Browser:')}
                    </span>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {drawerProfile.browser}
                    </div>
                  </div>
                </div>

                {/* Lifetime Time & Visits */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/40 text-center">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                      {t('মোট আগমন', 'Total Visits')}
                    </span>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {drawerProfile.totalVisits} {t('বার', 'x')}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/40 text-center">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                      {t('মোট কাটানো সময়', 'Total Dwell Time')}
                    </span>
                    <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatSeconds(drawerProfile.totalDurationSeconds)}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/40 text-center">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                      {t('ভিজিটর ধরন', 'Visitor Type')}
                    </span>
                    <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                      {drawerProfile.isRepeat
                        ? t('🔁 রিপিট', '🔁 Repeat')
                        : t('🆕 নতুন', '🆕 New')}
                    </div>
                  </div>
                </div>

                {/* Linked Accounts */}
                {drawerProfile.linkedUsers && drawerProfile.linkedUsers.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        {t('সংযুক্ত ইউজার অ্যাকাউন্ট', 'Linked User Accounts')} (
                        {drawerProfile.linkedUsers.length})
                      </span>
                      {drawerProfile.isMultiAccount && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          ⚠️ {t('মাল্টি-অ্যাকাউন্ট ঝুঁকি', 'Multi-Account Risk')}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 mt-2">
                      {drawerProfile.linkedUsers.map((u: any) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between bg-white dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {u.firstName} {u.lastName}
                            </span>
                            <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
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
                <div className="pt-1">
                  {drawerProfile.isBlocked ? (
                    <button
                      onClick={() => handleUnblockIp(drawerProfile.ipAddress)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow"
                    >
                      {t('এই আইপি আনব্লক করুন (Unblock IP)', 'Unblock This IP')}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setBlockingIp(drawerProfile.ipAddress);
                        setBlockReason('');
                      }}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow"
                    >
                      ⛔ {t('এই আইপি ব্লক করুন (Block IP)', 'Block This IP Address')}
                    </button>
                  )}
                </div>

                {/* Sessions & Journey Timeline */}
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mb-3">
                    {t('ভিজিট সেশন ও জার্নি হিস্ট্রি', 'Visit Sessions & Page Journey')}
                  </h4>
                  <div className="space-y-3">
                    {drawerProfile.sessions &&
                      drawerProfile.sessions.map((sess: any, idx: number) => (
                        <div
                          key={sess.id}
                          className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">
                              {t('সেশন', 'Session')} #{drawerProfile.sessions.length - idx} •{' '}
                              {new Date(sess.createdAt).toLocaleString()}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              ⏱️ {formatSeconds(sess.durationSeconds)}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-300">
                            {t('উৎস:', 'Source:')}{' '}
                            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                              {sess.trafficSource}
                            </span>
                          </div>

                          {/* Page Views in this session */}
                          {sess.pageViews && sess.pageViews.length > 0 && (
                            <div className="mt-2 pl-2.5 border-l-2 border-slate-300 dark:border-slate-700 space-y-1">
                              {sess.pageViews.map((pv: any) => (
                                <div
                                  key={pv.id}
                                  className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300"
                                >
                                  <span className="font-mono text-slate-800 dark:text-slate-200">
                                    {pv.pagePath}
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400 font-mono">
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
              <div className="py-20 text-center text-slate-500 dark:text-slate-400">
                {t('কোনো তথ্য পাওয়া যায়নি...', 'No profile data found...')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BLOCK IP CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {blockingIp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t('আইপি ব্লক নিশ্চিতকরণ', 'Confirm IP Address Block')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {blockingIp}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-bold block mb-1.5">
                {t('ব্লক করার কারণ (Reason):', 'Block Reason:')}
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder={t(
                  'যেমনঃ মাল্টি-অ্যাকাউন্ট রেফারেল স্প্যাম বা সন্দেহজনক বট...',
                  'e.g., Multi-account referral abuse or suspicious bot traffic...'
                )}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBlockingIp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {t('বাতিল', 'Cancel')}
              </button>
              <button
                onClick={handleBlockIp}
                disabled={blockSubmitting}
                className="px-5 py-2 text-xs font-bold text-white rounded-xl bg-rose-600 hover:bg-rose-500 transition-all disabled:opacity-50"
              >
                {blockSubmitting
                  ? t('ব্লক হচ্ছে...', 'Blocking...')
                  : t('হ্যাঁ, ব্লক করুন', 'Yes, Block IP')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
