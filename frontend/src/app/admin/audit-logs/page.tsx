'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileText,
  Search,
  RefreshCw,
  ShieldCheck,
  Eye,
  AlertTriangle,
  User,
  Database,
  Calendar,
  Download,
  Copy,
  Check,
  Filter,
  Wallet,
  Cpu,
  Shield,
  Layers,
  CheckCircle2,
  XCircle,
  Sliders,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface AuditRecord {
  id: string;
  actorId: string;
  actorType: 'USER' | 'ADMIN' | 'SYSTEM' | string;
  action: string;
  targetEntity: string;
  targetId: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  actor?: {
    id: string;
    uniqueUserId: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    roles?: string[];
  };
}

interface AuditStats {
  totalEvents: number;
  adminActions: number;
  financialActions: number;
  systemActions: number;
}

export default function AdminAuditLogsPage() {
  const { lang } = useLanguage();
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    adminActions: 0,
    financialActions: 0,
    systemActions: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actorTypeFilter, setActorTypeFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');

  // Modal inspection
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'diff' | 'raw'>('diff');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (actorTypeFilter !== 'ALL') params.append('actorType', actorTypeFilter);
      if (entityFilter !== 'ALL') params.append('targetEntity', entityFilter);
      if (actionFilter !== 'ALL') params.append('action', actionFilter);

      if (dateRange !== 'ALL') {
        const now = new Date();
        if (dateRange === 'TODAY') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          params.append('startDate', today.toISOString());
        } else if (dateRange === '7D') {
          const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          params.append('startDate', last7.toISOString());
        } else if (dateRange === '30D') {
          const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          params.append('startDate', last30.toISOString());
        }
      }

      const res: any = await api.get(`/admin/audit-logs?${params.toString()}`);
      
      // Defensively unwrap whether interceptor unwrapped data.data or not
      const payload = res?.data !== undefined ? res.data : res;
      const items: AuditRecord[] = Array.isArray(payload)
        ? payload
        : payload?.items || res?.items || [];
      const meta = payload?.meta || res?.meta || {
        total: items.length,
        page,
        limit,
        totalPages: 1,
      };

      setLogs(items);
      setTotalPages(meta.totalPages || 1);
      setTotalCount(meta.total || items.length);

      if (payload?.stats) {
        setStats(payload.stats);
      } else if (res?.stats) {
        setStats(res.stats);
      } else {
        // Fallback compute
        setStats({
          totalEvents: meta.total || items.length,
          adminActions: items.filter((i) => i.actorType === 'ADMIN').length,
          financialActions: items.filter((i) =>
            ['Wallet', 'WithdrawalRequest', 'RechargeRequest'].includes(i.targetEntity),
          ).length,
          systemActions: items.filter((i) => i.actorType === 'SYSTEM').length,
        });
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, limit, actorTypeFilter, entityFilter, actionFilter, dateRange]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAuditLogs();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToCSV = () => {
    if (!logs.length) return;
    const headers = [
      'ID',
      'Timestamp',
      'Action',
      'Actor Type',
      'Actor ID',
      'Actor Name',
      'Target Entity',
      'Target ID',
      'IP Address',
      'Reason',
    ];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.action,
      l.actorType,
      l.actor?.uniqueUserId || l.actorId,
      `"${l.actor?.fullName || l.actor?.firstName || ''}"`,
      l.targetEntity,
      l.targetId,
      l.ipAddress || 'Internal',
      `"${(l.reason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('APPROVE') || action.includes('RELEASE') || action.includes('RESTORE')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('REJECT') || action.includes('CANCEL') || action.includes('DELETE')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    if (action.includes('WALLET_ADJUST') || action.includes('PAYMENT')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    if (action.includes('COMMISSION') || action.includes('BID')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  };

  const getActorBadgeColor = (type: string) => {
    switch (type) {
      case 'ADMIN':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'SYSTEM':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const renderStateDiff = (before: any, after: any) => {
    if (!before && !after) {
      return (
        <div className="text-center py-6 text-slate-400 italic">
          No state modifications recorded for this event.
        </div>
      );
    }

    const allKeys = Array.from(
      new Set([...Object.keys(before || {}), ...Object.keys(after || {})]),
    );

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-800">
          <div className="col-span-4">Property</div>
          <div className="col-span-4 text-rose-500">Before Mutation</div>
          <div className="col-span-4 text-emerald-500">After Mutation</div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto pr-1">
          {allKeys.map((key) => {
            const valBefore = before ? before[key] : undefined;
            const valAfter = after ? after[key] : undefined;
            const isChanged = JSON.stringify(valBefore) !== JSON.stringify(valAfter);

            return (
              <div
                key={key}
                className={`grid grid-cols-12 gap-2 py-2 text-xs font-mono transition-colors ${
                  isChanged
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 rounded-lg px-1 font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="col-span-4 truncate text-slate-700 dark:text-slate-300 font-sans font-medium flex items-center gap-1.5">
                  {isChanged && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  <span>{key}</span>
                </div>
                <div className="col-span-4 truncate text-rose-600 dark:text-rose-400 bg-rose-500/5 dark:bg-rose-950/20 p-1 rounded">
                  {valBefore !== undefined ? JSON.stringify(valBefore) : <span className="text-slate-400 italic text-[10px]">empty</span>}
                </div>
                <div className="col-span-4 truncate text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-950/20 p-1 rounded">
                  {valAfter !== undefined ? JSON.stringify(valAfter) : <span className="text-slate-400 italic text-[10px]">empty</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <span>{lang === 'bn' ? 'সিকিউরিটি ও ফিনান্সিয়াল অডিট ট্রেইল' : 'Security & Financial Audit Trail'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? `অ্যাডমিন ও সিস্টেমের প্রতিটি অপরিবর্তনযোগ্য স্টেট পরিবর্তনের প্রমাণ্য রেকর্ড (${totalCount} টি রেকর্ড উপলব্ধ)`
              : `Immutable, tamper-evident action logs tracking all state mutations, financial movements, and policy edits (${totalCount} records)`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{lang === 'bn' ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
          </button>

          <button
            onClick={fetchAuditLogs}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm shadow-amber-500/20 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'সর্বমোট অডিট রেকর্ড' : 'Total Audit Logs'}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalEvents.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'অ্যাডমিন কার্যক্রম' : 'Admin Operations'}
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.adminActions.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'আর্থিক লেনদেন ও ওয়ালেট' : 'Financial Mutations'}
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {stats.financialActions.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'সিস্টেম অটোমেশন' : 'System Automation'}
            </p>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {stats.systemActions.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl border border-sky-500/20">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'অ্যাকশন, অ্যাডমিন আইডি, মোবাইল, টার্গেট এনটিটি বা কারণ দিয়ে সার্চ করুন...'
                  : 'Search by action, admin user ID, phone, target entity, or reason...'
              }
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Actor Filter */}
            <select
              value={actorTypeFilter}
              onChange={(e) => {
                setActorTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Actors</option>
              <option value="ADMIN">ADMIN Only</option>
              <option value="SYSTEM">SYSTEM Only</option>
              <option value="USER">USER Only</option>
            </select>

            {/* Target Entity Filter */}
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Entities</option>
              <option value="Wallet">Wallet</option>
              <option value="WithdrawalRequest">Withdrawals</option>
              <option value="RechargeRequest">Recharges</option>
              <option value="User">Users</option>
              <option value="Dispute">Disputes</option>
              <option value="CommissionRule">Commission Rules</option>
              <option value="SystemSetting">System Settings</option>
              <option value="Bid">Bids</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </select>

            {/* Clear All Filters */}
            {(searchQuery || actorTypeFilter !== 'ALL' || entityFilter !== 'ALL' || actionFilter !== 'ALL' || dateRange !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActorTypeFilter('ALL');
                  setEntityFilter('ALL');
                  setActionFilter('ALL');
                  setDateRange('ALL');
                  setPage(1);
                }}
                className="px-3 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-semibold transition"
              >
                {lang === 'bn' ? 'রিসেট' : 'Reset'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Target Entity & Ref</th>
                <th className="px-4 py-3.5">Mandatory Reason</th>
                <th className="px-4 py-3.5">Network & Device</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-500" />
                    <span className="font-medium text-sm">
                      {lang === 'bn' ? 'অডিট ট্রেইল লোড হচ্ছে...' : 'Loading audit trail logs...'}
                    </span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                      {lang === 'bn' ? 'কোনো অডিট রেকর্ড পাওয়া যায়নি' : 'No audit records match your query.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {lang === 'bn'
                        ? 'আপনার ফিল্টার অথবা সার্চ কিউয়ারি পরিবর্তন করে আবার চেষ্টা করুন।'
                        : 'Try adjusting your search criteria or resetting filters to see all events.'}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actorDisplay =
                    log.actor?.uniqueUserId ||
                    log.actor?.fullName ||
                    (log.actorType === 'SYSTEM' ? 'SYSTEM CRON' : log.actorId.substring(0, 8));

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Action */}
                      <td className="px-4 py-3.5 font-medium">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold ${getActionBadgeColor(
                            log.action,
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                            {log.actorType === 'SYSTEM' ? (
                              <Cpu className="w-3.5 h-3.5 text-sky-500" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{actorDisplay}</span>
                              {log.actor?.roles?.includes('SUPER_ADMIN') && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                                  SUPER
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span
                                className={`px-1.5 py-0.5 rounded border ${getActorBadgeColor(
                                  log.actorType,
                                )}`}
                              >
                                {log.actorType}
                              </span>
                              {log.actor?.email && (
                                <span className="truncate max-w-[120px]">{log.actor.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target Entity & ID */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.targetEntity}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-0.5">
                          <span className="truncate max-w-[110px]" title={log.targetId}>
                            {log.targetId}
                          </span>
                          <button
                            onClick={() => copyToClipboard(log.targetId, log.id)}
                            title="Copy target ID"
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 transition"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p
                          className="truncate text-slate-600 dark:text-slate-300 italic"
                          title={log.reason}
                        >
                          "{log.reason || '-'}"
                        </p>
                      </td>

                      {/* IP Address & Network */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {log.ipAddress || 'Internal'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
                          {log.userAgent ? 'Desktop Client' : 'Direct API'}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(log.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Details View */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-600 dark:text-slate-300 text-xs font-medium transition flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              {lang === 'bn'
                ? `পৃষ্ঠা ${page} এর মধ্যে ${totalPages} (মোট ${totalCount} টি ফলাফল)`
                : `Showing page ${page} of ${totalPages} (${totalCount} total events)`}
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="ml-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="15">15 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition disabled:opacity-40"
            >
              {lang === 'bn' ? 'আগেরটি' : 'Previous'}
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition disabled:opacity-40"
            >
              {lang === 'bn' ? 'পরবর্তী' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Details & State Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Audit Trail Inspection</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${getActionBadgeColor(
                        selectedLog.action,
                      )}`}
                    >
                      {selectedLog.action}
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center text-sm font-semibold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Actor</span>
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                    {selectedLog.actor?.uniqueUserId || selectedLog.actorId.slice(0, 10)}
                  </div>
                  <div className="text-[10px] text-slate-400">{selectedLog.actorType}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Entity</span>
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                    {selectedLog.targetEntity}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {selectedLog.targetId}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Network IP</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                    {selectedLog.ipAddress || 'Internal'}
                  </div>
                  <div className="text-[10px] text-slate-400">Verified Origin</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Executed At</span>
                  <div className="font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(selectedLog.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Actor Details If Available */}
              {selectedLog.actor && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white">
                        {selectedLog.actor.fullName || `${selectedLog.actor.firstName} ${selectedLog.actor.lastName}`}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        ID: {selectedLog.actor.uniqueUserId} • {selectedLog.actor.email}
                      </div>
                    </div>
                  </div>
                  {selectedLog.actor.phone && (
                    <div className="font-mono text-xs text-slate-600 dark:text-slate-300">
                      {selectedLog.actor.phone}
                    </div>
                  )}
                </div>
              )}

              {/* Mandatory Reason Box */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Mandatory Administrative Audit Reason</span>
                </div>
                <p className="text-amber-900 dark:text-amber-200 text-xs italic pl-5">
                  "{selectedLog.reason || 'Standard administrative operation completed.'}"
                </p>
              </div>

              {/* State Comparison Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    State Mutation Inspection
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                    <button
                      onClick={() => setModalTab('diff')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        modalTab === 'diff'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Field Diff
                    </button>
                    <button
                      onClick={() => setModalTab('raw')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${
                        modalTab === 'raw'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Raw JSON
                    </button>
                  </div>
                </div>

                {modalTab === 'diff' ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {renderStateDiff(selectedLog.beforeState, selectedLog.afterState)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="font-bold text-rose-500 flex items-center gap-1">
                        <span>Before State</span>
                      </span>
                      <pre className="p-3 bg-slate-950 text-rose-300 rounded-2xl font-mono text-[10px] overflow-x-auto max-h-52 border border-slate-800">
                        {JSON.stringify(selectedLog.beforeState || {}, null, 2)}
                      </pre>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-emerald-500 flex items-center gap-1">
                        <span>After State</span>
                      </span>
                      <pre className="p-3 bg-slate-950 text-emerald-300 rounded-2xl font-mono text-[10px] overflow-x-auto max-h-52 border border-slate-800">
                        {JSON.stringify(selectedLog.afterState || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <span className="text-[11px] text-slate-400">
                Tamper-resistant cryptographic audit sequence
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
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
