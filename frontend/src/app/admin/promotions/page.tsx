'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Search,
  Eye,
  Copy,
  Check,
  QrCode,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  Users,
  Coins,
  TrendingUp,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  Percent,
  Sliders,
  Power,
  Share2,
  Calendar,
  Phone,
  Globe,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

interface CampaignItem {
  id: string;
  name: string;
  code: string;
  promoterName?: string;
  promoterPhone?: string;
  promoterChannel?: string;
  commissionType: 'TRACKING_ONLY' | 'FIXED_PER_REGISTRATION' | 'COMMISSION_PERCENTAGE' | 'FLAT_BUDGET';
  commissionRate: number;
  flatBudget: number;
  paidAmount: number;
  earnedCommission: number;
  pendingPayable: number;
  commissionNote?: string;
  targetUrl: string;
  viewToken: string;
  isActive: boolean;
  clicksCount: number;
  uniqueVisitorsCount: number;
  signupsCount: number;
  completedTxnCount: number;
  totalTxnVolume: number;
  totalRechargesVolume: number;
  conversionRate: number;
  createdAt: string;
}

export default function AdminPromotionsPage() {
  const { lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'users' | 'transactions' | 'clicks'>('users');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutTarget, setPayoutTarget] = useState<CampaignItem | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutNote, setPayoutNote] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTarget, setQrTarget] = useState<CampaignItem | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    promoterName: '',
    promoterPhone: '',
    promoterChannel: '',
    commissionType: 'TRACKING_ONLY' as CampaignItem['commissionType'],
    commissionRate: 0,
    flatBudget: 0,
    commissionNote: '',
    targetUrl: '/',
    isActive: true,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch all campaigns and summary
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/promotions');
      const responseData = res?.data !== undefined ? res.data : res;
      setData(responseData);
    } catch (err: any) {
      console.error('Failed to load promotion campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Toggle Global Master ON/OFF Switch
  const handleToggleGlobalSwitch = async () => {
    if (!data?.settings) return;
    const newStatus = !data.settings.isEnabled;
    try {
      await api.put('/admin/promotions/settings', { isEnabled: newStatus });
      setData((prev: any) => ({
        ...prev,
        settings: { ...prev.settings, isEnabled: newStatus },
      }));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'মাস্টার সুইচ পরিবর্তন করা সম্ভব হয়নি');
    }
  };

  // Toggle Individual Campaign Active/Paused
  const handleToggleCampaignStatus = async (campaign: CampaignItem) => {
    try {
      const newStatus = !campaign.isActive;
      await api.put(`/admin/promotions/${campaign.id}`, { isActive: newStatus });
      setData((prev: any) => ({
        ...prev,
        campaigns: prev.campaigns.map((c: CampaignItem) =>
          c.id === campaign.id ? { ...c, isActive: newStatus } : c
        ),
      }));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি');
    }
  };

  // Copy Link Helper
  const handleCopyLink = (code: string, id: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safnexbd.com';
    const url = `${origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open Details Modal
  const handleOpenDetails = async (campaign: CampaignItem) => {
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setDetailsTab('users');
    try {
      const res: any = await api.get(`/admin/promotions/${campaign.id}`);
      const d = res?.data !== undefined ? res.data : res;
      setSelectedDetails(d);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'ডিটেইলস লোড করা সম্ভব হয়নি');
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      code: '',
      promoterName: '',
      promoterPhone: '',
      promoterChannel: '',
      commissionType: 'TRACKING_ONLY',
      commissionRate: 0,
      flatBudget: 0,
      commissionNote: '',
      targetUrl: '/',
      isActive: true,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (campaign: CampaignItem) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      code: campaign.code,
      promoterName: campaign.promoterName || '',
      promoterPhone: campaign.promoterPhone || '',
      promoterChannel: campaign.promoterChannel || '',
      commissionType: campaign.commissionType,
      commissionRate: campaign.commissionRate,
      flatBudget: campaign.flatBudget,
      commissionNote: campaign.commissionNote || '',
      targetUrl: campaign.targetUrl || '/',
      isActive: campaign.isActive,
    });
    setFormError('');
    setShowCreateModal(true);
  };

  // Submit Create or Edit Form
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingCampaign) {
        await api.put(`/admin/promotions/${editingCampaign.id}`, formData);
      } else {
        await api.post('/admin/promotions', formData);
      }
      setShowCreateModal(false);
      await fetchCampaigns();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async (campaign: CampaignItem) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${campaign.name}" ক্যাম্পেইনটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await api.delete(`/admin/promotions/${campaign.id}`);
      await fetchCampaigns();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'ক্যাম্পেইন মোছা সম্ভব হয়নি');
    }
  };

  // Record Payout
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutTarget || payoutAmount <= 0) return;
    try {
      await api.post(`/admin/promotions/${payoutTarget.id}/payout`, {
        amount: Number(payoutAmount),
        note: payoutNote,
      });
      setShowPayoutModal(false);
      setPayoutTarget(null);
      setPayoutAmount(0);
      setPayoutNote('');
      await fetchCampaigns();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'পেআউট সংরক্ষণ সম্ভব হয়নি');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!data?.campaigns || data.campaigns.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো ডাটা নেই');
      return;
    }
    const headers = [
      'Campaign Name',
      'Code',
      'Promoter Name',
      'Phone',
      'Channel',
      'Status',
      'Total Visitors',
      'Unique Visitors',
      'Total Signups',
      'Transactions Count',
      'Transaction Volume (BDT)',
      'Commission Type',
      'Commission Rate',
      'Earned Commission (BDT)',
      'Paid Amount (BDT)',
      'Pending Payable (BDT)',
      'Conversion Rate (%)',
      'Created At',
    ];

    const rows = data.campaigns.map((c: CampaignItem) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.code,
      `"${(c.promoterName || '').replace(/"/g, '""')}"`,
      `"${c.promoterPhone || ''}"`,
      `"${(c.promoterChannel || '').replace(/"/g, '""')}"`,
      c.isActive ? 'ACTIVE' : 'PAUSED',
      c.clicksCount,
      c.uniqueVisitorsCount,
      c.signupsCount,
      c.completedTxnCount,
      c.totalTxnVolume.toFixed(2),
      c.commissionType,
      c.commissionRate,
      c.earnedCommission.toFixed(2),
      c.paidAmount.toFixed(2),
      c.pendingPayable.toFixed(2),
      c.conversionRate,
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `safnex_promotions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (!data?.campaigns) return [];
    return data.campaigns.filter((c: CampaignItem) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.promoterName && c.promoterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.promoterPhone && c.promoterPhone.includes(searchQuery));

      if (statusFilter === 'ACTIVE') return matchSearch && c.isActive;
      if (statusFilter === 'PAUSED') return matchSearch && !c.isActive;
      return matchSearch;
    });
  }, [data, searchQuery, statusFilter]);

  const summary = data?.summary || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalClicks: 0,
    totalUniqueVisitors: 0,
    totalSignups: 0,
    totalPlatformVolume: 0,
    totalPayableCommission: 0,
  };

  const isGlobalEnabled = data?.settings?.isEnabled !== false;

  return (
    <div className="space-y-6">
      {/* 1. Top Header & Master ON/OFF Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'bn' ? 'প্রমোশন ও ইনফ্লুয়েন্সার ট্র্যাকার' : 'Promotions & Influencer Tracker'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                  isGlobalEnabled
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isGlobalEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isGlobalEnabled ? (lang === 'bn' ? 'সিস্টেম চালু' : 'System ON') : (lang === 'bn' ? 'সিস্টেম বন্ধ' : 'System OFF')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'ইউটিউবার, পার্টনার ও প্রমোটারদের জন্য লিংক তৈরি, ভিজিটর, সাইন-আপ ও মোট লেনদেনের রিয়েল-টাইম হিসাব'
                : 'Create customized promo links, track visitor clicks, user signups and transaction volume'}
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch Button + Create Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleGlobalSwitch}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
              isGlobalEnabled
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-400 dark:border-rose-800'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
            }`}
            title="Toggle global promotion system on/off"
          >
            <Power className="w-3.5 h-3.5" />
            <span>
              {isGlobalEnabled
                ? (lang === 'bn' ? 'মাস্টার সুইচ বন্ধ করুন (Turn OFF)' : 'Turn OFF System')
                : (lang === 'bn' ? 'মাস্টার সুইচ চালু করুন (Turn ON)' : 'Turn ON System')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'সিএসভি রিপোর্ট' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-sky-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন প্রমোশন লিংক' : 'New Promo Link'}</span>
          </button>
        </div>
      </div>

      {/* 2. Global Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Campaigns */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{lang === 'bn' ? 'মোট ক্যাম্পেইন' : 'Total Campaigns'}</span>
            <Megaphone className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.totalCampaigns}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">
              ({summary.activeCampaigns} {lang === 'bn' ? 'চালু' : 'active'})
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'bn' ? 'প্রোমোটার তালিকা' : 'Active promoters'}</p>
        </div>

        {/* Total Clicks & Visitors */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{lang === 'bn' ? 'মোট ভিজিটর' : 'Total Visitors'}</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.totalClicks}
            </span>
            <span className="text-[11px] text-slate-400">
              ({summary.totalUniqueVisitors} ইউনিক)
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'bn' ? 'লিংক ভিজিট করেছেন' : 'Clicks recorded'}</p>
        </div>

        {/* Total Signups */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{lang === 'bn' ? 'মোট সাইন-আপ' : 'Total Signups'}</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.totalSignups}
            </span>
            <span className="text-[11px] text-slate-400">{lang === 'bn' ? 'ইউজার' : 'users'}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'bn' ? 'নতুন একাউন্ট করেছেন' : 'Registered members'}</p>
        </div>

        {/* Total Transaction Volume */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{lang === 'bn' ? 'লেনদেনের পরিমাণ' : 'Volume Generated'}</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              ৳{summary.totalPlatformVolume.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'bn' ? 'রেফার্ড ইউজারদের ডিল' : 'Escrow deal volume'}</p>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{lang === 'bn' ? 'কনভার্সন রেট' : 'Conversion Rate'}</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
              {summary.totalClicks > 0
                ? ((summary.totalSignups / summary.totalClicks) * 100).toFixed(1)
                : '0.0'}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'bn' ? 'ক্লিক ➔ রেজিস্ট্রেশন' : 'Clicks to signups'}</p>
        </div>

        {/* Pending Commission */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{lang === 'bn' ? 'প্রদেয় কমিশন' : 'Pending Payable'}</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">
              ৳{summary.totalPayableCommission.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{lang === 'bn' ? 'বকেয়া পাওনা' : 'Unpaid commissions'}</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'ক্যাম্পেইন নাম, কোড বা ফোন দিয়ে খুঁজুন...' : 'Search by name, code or phone...'}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {filter === 'ALL'
                ? lang === 'bn'
                  ? 'সকল ক্যাম্পেইন'
                  : 'All'
                : filter === 'ACTIVE'
                ? lang === 'bn'
                  ? 'চালু (Active)'
                  : 'Active'
                : lang === 'bn'
                ? 'বন্ধ (Paused)'
                : 'Paused'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Campaigns Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'ক্যাম্পেইন ও প্রোমোটার' : 'Campaign & Promoter'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'প্রমোশন লিংক' : 'Promo Link'}</th>
                <th className="py-3 px-4 text-center">{lang === 'bn' ? 'ভিজিটর' : 'Visitors'}</th>
                <th className="py-3 px-4 text-center">{lang === 'bn' ? 'সাইন-আপ' : 'Signups'}</th>
                <th className="py-3 px-4 text-center">{lang === 'bn' ? 'কনভার্সন' : 'Conv %'}</th>
                <th className="py-3 px-4 text-right">{lang === 'bn' ? 'লেনদেনের পরিমাণ' : 'Volume (BDT)'}</th>
                <th className="py-3 px-4 text-right">{lang === 'bn' ? 'কমিশন / পাওনা' : 'Commission'}</th>
                <th className="py-3 px-4 text-center">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                    <span>{lang === 'bn' ? 'ডাটা লোড হচ্ছে...' : 'Loading campaigns...'}</span>
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 space-y-3">
                    <Megaphone className="w-10 h-10 text-slate-400 mx-auto opacity-40" />
                    <p className="text-sm font-semibold">
                      {lang === 'bn' ? 'কোনো প্রমোশন ক্যাম্পেইন পাওয়া যায়নি' : 'No promotion campaigns found'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-xs hover:bg-sky-500 transition cursor-pointer"
                    >
                      {lang === 'bn' ? '+ নতুন ক্যাম্পেইন তৈরি করুন' : '+ Create First Campaign'}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c: CampaignItem) => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://safnexbd.com';
                  const shortUrl = `${origin}/r/${c.code}`;
                  const portalUrl = `${origin}/partner/${c.code}?token=${c.viewToken}`;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                    >
                      {/* ON/OFF Switch */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleCampaignStatus(c)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            c.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          title={c.isActive ? 'ক্যাম্পেইন চালু (ক্লিক করে বন্ধ করুন)' : 'ক্যাম্পেইন বন্ধ (ক্লিক করে চালু করুন)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              c.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Name & Promoter Info */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-extrabold text-slate-900 dark:text-white truncate">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{c.promoterName || 'পার্টনার'}</span>
                          {c.promoterPhone && (
                            <span className="font-mono text-slate-400">({c.promoterPhone})</span>
                          )}
                        </div>
                        {c.promoterChannel && (
                          <a
                            href={c.promoterChannel}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-sky-500 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[140px]">{c.promoterChannel}</span>
                          </a>
                        )}
                      </td>

                      {/* Link & Copy Button */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                            /r/{c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(c.code, c.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title={lang === 'bn' ? 'লিংক কপি করুন' : 'Copy link'}
                          >
                            {copiedId === c.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Visitors / Clicks */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {c.clicksCount}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {c.uniqueVisitorsCount} ইউনিক
                        </div>
                      </td>

                      {/* Signups */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80">
                          {c.signupsCount}
                        </span>
                      </td>

                      {/* Conversion Rate */}
                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {c.conversionRate}%
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-extrabold text-amber-600 dark:text-amber-400">
                          ৳{c.totalTxnVolume.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.completedTxnCount} টি সম্পন্ন ডিল
                        </div>
                      </td>

                      {/* Commission & Payable */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          পাওনা: ৳{c.pendingPayable.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          পরিশোধ: ৳{c.paidAmount.toFixed(2)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Details Modal */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(c)}
                            className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition cursor-pointer"
                            title={lang === 'bn' ? 'বিস্তারিত ড্রিল-ডাউন রিপোর্ট' : 'View full report'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* QR Code */}
                          <button
                            type="button"
                            onClick={() => {
                              setQrTarget(c);
                              setShowQrModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                            title={lang === 'bn' ? 'QR কোড জেনারেটর' : 'QR Code'}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* Promoter View Link */}
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                            title={lang === 'bn' ? 'প্রমোটারের নিজস্ব লাইভ ভিউ লিংক' : 'Promoter Portal Link'}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </a>

                          {/* Payout */}
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutTarget(c);
                              setPayoutAmount(c.pendingPayable > 0 ? c.pendingPayable : 0);
                              setShowPayoutModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition cursor-pointer"
                            title={lang === 'bn' ? 'পেআউট রেকর্ড করুন' : 'Record Payout'}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                            title={lang === 'bn' ? 'এডিট করুন' : 'Edit'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(c)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
                            title={lang === 'bn' ? 'ডিলিট করুন' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create / Edit Campaign Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingCampaign
                    ? (lang === 'bn' ? 'ক্যাম্পেইন এডিট করুন' : 'Edit Campaign')
                    : (lang === 'bn' ? 'নতুন প্রমোশন লিংক তৈরি করুন' : 'Create New Promotion Link')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
              {/* Campaign / Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ক্যাম্পেইনের নাম *' : 'Campaign Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="যেমন: তানভীর টেক রিভিউ বা TechBD FB Group"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 font-semibold"
                />
              </div>

              {/* Referral Code / Slug */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ইউনিক রেফারেল কোড বা স্ল্যাগ *' : 'Unique Referral Code / Slug *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400">
                    /r/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                      })
                    }
                    placeholder="যেমন: tanvir26 বা techbd"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sky-600 dark:text-sky-400 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/30 uppercase placeholder:normal-case"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  শেয়ারেবল লিংক হবে: <span className="font-mono text-sky-500">https://safnexbd.com/r/{formData.code || 'code'}</span>
                </p>
              </div>

              {/* Influencer / Promoter Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'প্রোমোটার / ব্যক্তির নাম' : 'Promoter Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.promoterName}
                    onChange={(e) => setFormData({ ...formData, promoterName: e.target.value })}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মোবাইল / হোয়াটসঅ্যাপ' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={formData.promoterPhone}
                    onChange={(e) => setFormData({ ...formData, promoterPhone: e.target.value })}
                    placeholder="যেমন: 01700000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Channel / Social Link */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ইউটিউব চ্যানেল বা ফেসবুক গ্রুপ লিংক' : 'Channel / Page Link'}
                </label>
                <input
                  type="url"
                  value={formData.promoterChannel}
                  onChange={(e) => setFormData({ ...formData, promoterChannel: e.target.value })}
                  placeholder="https://youtube.com/@channel বা FB গ্রুপ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Commission Model Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <label className="block font-extrabold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'কমিশন / চুক্তি মডেল (সম্পূর্ণ কাস্টমাইজেবল)' : 'Commission / Payout Model'}
                </label>
                <select
                  value={formData.commissionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commissionType: e.target.value as CampaignItem['commissionType'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="TRACKING_ONLY">
                    {lang === 'bn' ? '১. শুধুমাত্র ট্র্যাকিং (কোনো কমিশন গণনা হবে না)' : '1. Tracking Only (No Commission)'}
                  </option>
                  <option value="FIXED_PER_REGISTRATION">
                    {lang === 'bn' ? '২. প্রতি রেজিস্ট্রেশনে ফিক্সড টাকা (যেমন: ৳১০/রেজি)' : '2. Fixed BDT per User Registration'}
                  </option>
                  <option value="COMMISSION_PERCENTAGE">
                    {lang === 'bn' ? '৩. ট্রেড ফি কমিশন শেয়ার % (যেমন: ১০% ফি শেয়ার)' : '3. Percentage Share of Trade Fees'}
                  </option>
                  <option value="FLAT_BUDGET">
                    {lang === 'bn' ? '৪. এককালীন ফিক্সড বাজেট (যেমন: চুক্তিভিত্তিক ৳৫,০০০)' : '4. Flat Contractual Budget (e.g. ৳5,000)'}
                  </option>
                </select>

                {/* Conditional rate input */}
                {formData.commissionType === 'FIXED_PER_REGISTRATION' && (
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                      প্রতি রেজিস্ট্রেশনে কত টাকা (৳) পাবে?
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                      placeholder="10.00"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                )}

                {formData.commissionType === 'COMMISSION_PERCENTAGE' && (
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                      ট্রেড ফি থেকে কত শতাংশ (%) শেয়ার পাবে?
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                      placeholder="10%"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                )}

                {formData.commissionType === 'FLAT_BUDGET' && (
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                      মোট চুক্তিভিত্তিক বাজেট কত টাকা (৳)?
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={formData.flatBudget}
                      onChange={(e) => setFormData({ ...formData, flatBudget: Number(e.target.value) })}
                      placeholder="5000.00"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Target Landing URL */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ল্যান্ডিং পেজ বা রিডাইরেক্ট ডেস্টিনেশন' : 'Target Destination URL'}
                </label>
                <input
                  type="text"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  placeholder="/ অথবা /register অথবা /shop"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'চুক্তির শর্ত বা অ্যাডমিন নোট' : 'Deal Terms & Agreement Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.commissionNote}
                  onChange={(e) => setFormData({ ...formData, commissionNote: e.target.value })}
                  placeholder="যেমন: ৩টি ইউটিউব ভিডিও ও ফেসবুক পেজে পোস্ট দেওয়ার চুক্তি..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'ক্যাম্পেইনটি এখনই সক্রিয় রাখতে চান?' : 'Keep campaign active?'}
                </span>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCampaign ? (lang === 'bn' ? 'আপডেট করুন' : 'Update') : (lang === 'bn' ? 'তৈরি করুন' : 'Create')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Detailed Drill-Down Report Modal */}
      {showDetailsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedDetails?.campaign?.name || 'ক্যাম্পেইন বিস্তারিত'}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                      /r/{selectedDetails?.campaign?.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    প্রোমোটার: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedDetails?.campaign?.promoterName || 'পার্টনার'}</span>
                    {selectedDetails?.campaign?.promoterPhone && (
                      <span className="ml-2 font-mono">({selectedDetails.campaign.promoterPhone})</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-500" />
                <span>রিপোর্ট লোড হচ্ছে...</span>
              </div>
            ) : selectedDetails ? (
              <>
                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-slate-400 text-[11px] block">ভিজিটর / ক্লিক</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedDetails.campaign.clicksCount}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        ({selectedDetails.campaign.uniqueVisitorsCount} ইউনিক)
                      </span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-slate-400 text-[11px] block">মোট সাইন-আপ</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {selectedDetails.stats.signupsCount} জন
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-slate-400 text-[11px] block">মোট লেনদেন ভলিউম</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      ৳{selectedDetails.stats.totalTxnVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <span className="text-slate-400 text-[11px] block">বকেয়া পাওনা কমিশন</span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                      ৳{selectedDetails.campaign.pendingPayable.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setDetailsTab('users')}
                    className={`py-2 px-3 font-bold border-b-2 transition ${
                      detailsTab === 'users'
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    👥 রেজিস্ট্রার্ড ইউজারবৃন্দ ({selectedDetails.registeredUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsTab('transactions')}
                    className={`py-2 px-3 font-bold border-b-2 transition ${
                      detailsTab === 'transactions'
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    💸 লেনদেন হিস্ট্রি ({selectedDetails.transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsTab('clicks')}
                    className={`py-2 px-3 font-bold border-b-2 transition ${
                      detailsTab === 'clicks'
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🌐 সাম্প্রতিক ক্লিক লগ ({selectedDetails.recentClicks.length})
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto custom-scrollbar text-xs">
                  {detailsTab === 'users' && (
                    <div>
                      {selectedDetails.registeredUsers.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          এখনো কোনো ইউজার এই লিংকের মাধ্যমে একাউন্ট খোলেননি।
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                              <th className="py-2.5 px-3">ইউজার আইডি</th>
                              <th className="py-2.5 px-3">নাম</th>
                              <th className="py-2.5 px-3">মোবাইল / ইমেইল</th>
                              <th className="py-2.5 px-3">রেজিস্ট্রেশনের তারিখ</th>
                              <th className="py-2.5 px-3 text-right">ওয়ালেট ব্যালেন্স</th>
                              <th className="py-2.5 px-3 text-right">স্ট্যাটাস</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {selectedDetails.registeredUsers.map((u: any) => (
                              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                                  {u.uniqueUserId}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                  {u.name}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono">
                                  {u.phone}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                                  ৳{u.availableBalance.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {u.isVerified ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                      ভেরিফাইড
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                      সাধারণ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {detailsTab === 'transactions' && (
                    <div>
                      {selectedDetails.transactions.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          এই ক্যাম্পেইনের ইউজাররা এখনো কোনো এসক্রো লেনদেন করেননি।
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                              <th className="py-2.5 px-3">ট্র্যাকিং নম্বর</th>
                              <th className="py-2.5 px-3">ক্রেতা (Payer)</th>
                              <th className="py-2.5 px-3">বিক্রেতা (Seller)</th>
                              <th className="py-2.5 px-3 text-right">পরিমাণ (৳)</th>
                              <th className="py-2.5 px-3 text-right">কমিশন (৳)</th>
                              <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                              <th className="py-2.5 px-3 text-right">তারিখ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {selectedDetails.transactions.map((t: any) => (
                              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 font-mono font-bold text-sky-600 dark:text-sky-400">
                                  {t.trackingNumber}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                  {t.sender?.firstName || 'User'}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                  {t.receiver?.firstName || 'User'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-amber-600">
                                  ৳{t.amount.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-500">
                                  ৳{t.commissionAmount.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.status === 'RELEASED'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {t.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-400">
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {detailsTab === 'clicks' && (
                    <div>
                      {selectedDetails.recentClicks.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          এখনো কোনো ক্লিক হিস্ট্রি জমা হয়নি।
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px]">
                              <th className="py-2.5 px-3">সময়</th>
                              <th className="py-2.5 px-3">ডিভাইস</th>
                              <th className="py-2.5 px-3">আইপি অ্যাড্রেস</th>
                              <th className="py-2.5 px-3">রেফারার লিংক</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {selectedDetails.recentClicks.map((c: any) => (
                              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 text-slate-400 font-sans">
                                  {new Date(c.createdAt).toLocaleString()}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans font-bold">
                                  {c.device || 'Desktop'}
                                </td>
                                <td className="py-2.5 px-3 text-sky-600 dark:text-sky-400">
                                  {c.ipAddress || '—'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">
                                  {c.referrer || 'সরাসরি লিংক'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 7. Record Payout Modal */}
      {showPayoutModal && payoutTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowPayoutModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>পেআউট রেকর্ড করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">প্রোমোটার:</span>
                <span className="font-bold text-slate-900 dark:text-white">{payoutTarget.promoterName || payoutTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">অর্জিত কমিশন:</span>
                <span className="font-bold text-slate-900 dark:text-white">৳{payoutTarget.earnedCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">পূর্বের পরিশোধ:</span>
                <span className="font-bold text-slate-900 dark:text-white">৳{payoutTarget.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-rose-600 font-bold">
                <span>বর্তমান বকেয়া পাওনা:</span>
                <span>৳{payoutTarget.pendingPayable.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleSavePayout} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পরিশোধকৃত টাকার পরিমাণ (৳) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.5"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-base text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নোট বা ট্রানজেকশন আইডি (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="যেমন: বিকাশ মারফত পরিশোধ #TXN123"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md cursor-pointer"
                >
                  পরিশোধ কনফার্ম করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. QR Code Generator Modal */}
      {showQrModal && qrTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 text-sky-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {qrTarget.name} - QR কোড
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                স্ক্যান করলেই সরাসরি এই প্রোমোটারের রেফারেল লিংকে প্রবেশ করবে
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `${typeof window !== 'undefined' ? window.location.origin : 'https://safnexbd.com'}/r/${qrTarget.code}`
                )}`}
                alt="Promotion QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>

            <div className="w-full flex items-center gap-2 pt-2">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                  `${typeof window !== 'undefined' ? window.location.origin : 'https://safnexbd.com'}/r/${qrTarget.code}`
                )}`}
                target="_blank"
                rel="noreferrer"
                download={`safnex-qr-${qrTarget.code}.png`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>QR ডাউনলোড</span>
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
