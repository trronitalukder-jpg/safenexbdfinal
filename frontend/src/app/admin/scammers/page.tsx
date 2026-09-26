'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  PlusCircle,
  Search,
  ExternalLink,
  Power,
  Clock,
  AlertTriangle,
  Eye,
  X,
  Save,
  Check,
  RotateCcw,
  Sparkles,
  Phone,
  User,
  Activity,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { api } from '@/lib/api';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface ScammerItem {
  id: string;
  phone: string | null;
  facebookLink: string | null;
  facebookUid: string | null;
  scammerName: string | null;
  scammerPhotoUrl: string | null;
  category: string;
  description: string;
  amountLost: number | null;
  proofImages: string[];
  severity: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  rejectionReason: string | null;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  reporterIp: string | null;
  searchHitCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminScammersPage() {
  const { lang } = useLanguage();
  const { settings, refreshSettings } = useSettings();
  const isBn = lang === 'bn';

  // Active Tab: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DIRECT_ADD' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'DIRECT_ADD' | 'SETTINGS'>('PENDING');

  // Master Switch state
  const [isCheckerEnabled, setIsCheckerEnabled] = useState(
    settings?.system?.scammerCheckerEnabled !== false,
  );
  const [togglingMaster, setTogglingMaster] = useState(false);

  // Queue state
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScammerItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAll: 0,
  });

  // Action states
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Modals
  const [activeProofZoom, setActiveProofZoom] = useState<string | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<ScammerItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ScammerItem | null>(null);

  // Direct Add Form State
  const [directPhone, setDirectPhone] = useState('');
  const [directFacebook, setDirectFacebook] = useState('');
  const [directName, setDirectName] = useState('');
  const [directCategory, setDirectCategory] = useState('TRANSACTION_FRAUD');
  const [directAmount, setDirectAmount] = useState('');
  const [directDescription, setDirectDescription] = useState('');
  const [directProofUrl, setDirectProofUrl] = useState('');
  const [directProofList, setDirectProofList] = useState<string[]>([]);
  const [directAdminNotes, setDirectAdminNotes] = useState('');
  const [directSubmitting, setDirectSubmitting] = useState(false);

  // Social Proof Settings State
  const [socialProofEnabled, setSocialProofEnabled] = useState(
    settings?.system?.socialProofEnabled !== false,
  );
  const [socialInitialDelay, setSocialInitialDelay] = useState(
    settings?.system?.socialProofInitialDelaySeconds ?? 5,
  );
  const [socialInterval, setSocialInterval] = useState(
    settings?.system?.socialProofIntervalSeconds ?? 25,
  );
  const [socialDuration, setSocialDuration] = useState(
    settings?.system?.socialProofDurationSeconds ?? 8,
  );
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch Queue Data
  const fetchQueue = async () => {
    setLoading(true);
    setActionErrorMsg('');
    try {
      const statusParam =
        activeTab === 'PENDING'
          ? 'PENDING'
          : activeTab === 'APPROVED'
          ? 'APPROVED'
          : activeTab === 'REJECTED'
          ? 'REJECTED'
          : '';

      const res: any = await api.get('/scammer-reports/admin/queue', {
        params: {
          status: statusParam || undefined,
          search: searchFilter.trim() || undefined,
          limit: 50,
        },
      });

      const data = res?.data !== undefined ? res.data : res;
      setItems(data.items || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || err?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'DIRECT_ADD' && activeTab !== 'SETTINGS') {
      fetchQueue();
    }
  }, [activeTab]);

  // Master Switch Toggle
  const handleToggleMaster = async () => {
    const nextState = !isCheckerEnabled;
    setTogglingMaster(true);
    try {
      await api.post('/scammer-reports/admin/toggle-master', { enabled: nextState });
      setIsCheckerEnabled(nextState);
      refreshSettings();
      setActionSuccessMsg(
        nextState
          ? (isBn ? 'স্ক্যামার চেকার সিস্টেম সফলভাবে চালু করা হয়েছে।' : 'Checker system enabled.')
          : (isBn ? 'স্ক্যামার চেকার সিস্টেম সাময়িকভাবে বন্ধ করা হয়েছে।' : 'Checker system disabled.'),
      );
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Toggle failed');
    } finally {
      setTogglingMaster(false);
    }
  };

  // Status update: Approve
  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/scammer-reports/admin/${id}/status`, {
        status: 'APPROVED',
      });
      setActionSuccessMsg(isBn ? 'রিপোর্টটি সফলভাবে অনুমোদিত হয়েছে এবং পাবলিক সার্চে লাইভ করা হয়েছে!' : 'Report approved and live!');
      fetchQueue();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Failed to approve');
    }
  };

  // Status update: Reject
  const handleRejectSubmit = async () => {
    if (!rejectModalItem) return;
    try {
      await api.patch(`/scammer-reports/admin/${rejectModalItem.id}/status`, {
        status: 'REJECTED',
        rejectionReason: rejectionReasonInput.trim() || (isBn ? 'যথাযথ প্রমাণের অভাব' : 'Insufficient proof'),
      });
      setRejectModalItem(null);
      setRejectionReasonInput('');
      setActionSuccessMsg(isBn ? 'রিপোর্টটি বাতিল করা হয়েছে।' : 'Report rejected.');
      fetchQueue();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Failed to reject');
    }
  };

  // Permanent Delete
  const handleDeletePermanent = async (id: string) => {
    try {
      await api.delete(`/scammer-reports/admin/${id}`);
      setDeleteConfirmId(null);
      setActionSuccessMsg(isBn ? 'রেকর্ডটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে।' : 'Record permanently deleted.');
      fetchQueue();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Failed to delete');
    }
  };

  // Edit Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      await api.patch(`/scammer-reports/admin/${editItem.id}`, {
        phone: editItem.phone,
        facebookLink: editItem.facebookLink,
        scammerName: editItem.scammerName,
        category: editItem.category,
        description: editItem.description,
        amountLost: editItem.amountLost ? Number(editItem.amountLost) : undefined,
        severity: editItem.severity,
        adminNotes: editItem.adminNotes,
      });
      setEditItem(null);
      setActionSuccessMsg(isBn ? 'তথ্য সফলভাবে আপডেট করা হয়েছে।' : 'Record updated successfully.');
      fetchQueue();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Failed to update record');
    }
  };

  // Direct Scammer Add Submission
  const handleDirectAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone.trim() && !directFacebook.trim()) {
      setActionErrorMsg(isBn ? 'মোবাইল নম্বর অথবা ফেসবুক লিংক যেকোনো একটি অবশ্যই দিতে হবে।' : 'Phone or Facebook link required.');
      return;
    }
    if (!directName.trim()) {
      setActionErrorMsg(isBn ? 'স্ক্যামারের নাম লিখুন।' : 'Scammer name required.');
      return;
    }
    if (!directDescription.trim()) {
      setActionErrorMsg(isBn ? 'বিবরণ লিখুন।' : 'Description required.');
      return;
    }

    setDirectSubmitting(true);
    setActionErrorMsg('');

    try {
      await api.post('/scammer-reports/admin/direct', {
        phone: directPhone.trim() || undefined,
        facebookLink: directFacebook.trim() || undefined,
        scammerName: directName.trim(),
        category: directCategory,
        amountLost: directAmount ? parseFloat(directAmount) : undefined,
        description: directDescription.trim(),
        proofImages: directProofList,
        adminNotes: directAdminNotes.trim() || undefined,
      });

      setActionSuccessMsg(isBn ? 'স্ক্যামার রেকর্ডটি সফলভাবে তৈরি করা হয়েছে এবং লাইভ ডাটাবেজে যুক্ত হয়েছে!' : 'Scammer record created & live!');
      // Reset form
      setDirectPhone('');
      setDirectFacebook('');
      setDirectName('');
      setDirectAmount('');
      setDirectDescription('');
      setDirectProofList([]);
      setDirectAdminNotes('');
      setActiveTab('APPROVED');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || err?.message || 'Failed to create record');
    } finally {
      setDirectSubmitting(false);
    }
  };

  // Save Social Proof & Timers
  const handleSaveSocialProofSettings = async () => {
    setSavingSettings(true);
    try {
      await api.post('/settings', {
        category: 'system',
        data: {
          ...settings?.system,
          socialProofEnabled,
          socialProofInitialDelaySeconds: Number(socialInitialDelay),
          socialProofIntervalSeconds: Number(socialInterval),
          socialProofDurationSeconds: Number(socialDuration),
        },
      });
      refreshSettings();
      setActionSuccessMsg(isBn ? 'সোশ্যাল প্রুফ ও টাইমার সেটিংস সংরক্ষিত হয়েছে!' : 'Social proof settings saved!');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setActionErrorMsg(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const categoryLabelsBn: Record<string, string> = {
    TRANSACTION_FRAUD: 'লেনদেন সংক্রান্ত প্রতারণা',
    FAKE_PRODUCT: 'পণ্য না দিয়ে যোগাযোগ বিচ্ছিন্ন',
    ACCOUNT_THEFT: 'ফেসবুক পেজ / আইডি চুরি',
    FAKE_SERVICE: 'ভুয়া সার্ভিস',
    OTHER: 'অন্যান্য প্রতারণা',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert Messages */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 font-semibold text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg('')} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Master Kill-Switch Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{isBn ? 'অ্যাডমিন প্রতারক ও ট্রাস্ট কনসোল' : 'Admin Scammer & Trust Console'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isBn ? 'স্ক্যামার ও ট্রাস্ট চেকার ম্যানেজমেন্ট' : 'Scammer & Trust Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {isBn
              ? 'ইউজারদের দাখিলকৃত রিপোর্ট যাচাই করুন, সরাসরি এন্ট্রি দিন এবং প্রয়োজন অনুযায়ী যেকোনো রেকর্ড স্থায়ীভাবে মুছুন।'
              : 'Audit user scam reports, approve records, add direct entries, and manage system status.'}
          </p>
        </div>

        {/* Master ON/OFF Switch Button */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
          <div className="text-right">
            <span className="text-xs font-medium text-slate-400 block">{isBn ? 'সিস্টেম স্ট্যাটাস:' : 'Checker System:'}</span>
            <span className={`text-sm font-bold ${isCheckerEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
              {isCheckerEnabled ? (isBn ? 'সক্রিয় (ON)' : 'ACTIVE (ON)') : (isBn ? 'নিষ্ক্রিয় (OFF)' : 'DISABLED (OFF)')}
            </span>
          </div>

          <button
            onClick={handleToggleMaster}
            disabled={togglingMaster}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isCheckerEnabled ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isCheckerEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('PENDING')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'PENDING'
              ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
            <span>{isBn ? 'পেন্ডিং রিভিউ' : 'Pending Review'}</span>
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">{stats.pending}</span>
        </div>

        <div
          onClick={() => setActiveTab('APPROVED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'APPROVED'
              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
            <span>{isBn ? 'অনুমোদিত ও লাইভ' : 'Approved & Live'}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">{stats.approved}</span>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'REJECTED'
              ? 'bg-red-500/10 border-red-500/50 shadow-md shadow-red-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-red-400 font-semibold mb-1">
            <span>{isBn ? 'বাতিলকৃত তালিকা' : 'Rejected Reports'}</span>
            <XCircle className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">{stats.rejected}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-sky-400 font-semibold mb-1">
            <span>{isBn ? 'সর্বমোট রেকর্ড' : 'Total Records'}</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalAll}</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {isBn ? `পেন্ডিং রিপোর্ট (${stats.pending})` : `Pending (${stats.pending})`}
          </button>

          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {isBn ? `অনুমোদিত ডাটাবেজ (${stats.approved})` : `Approved (${stats.approved})`}
          </button>

          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'REJECTED'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {isBn ? `বাতিলকৃত (${stats.rejected})` : `Rejected (${stats.rejected})`}
          </button>

          <button
            onClick={() => setActiveTab('DIRECT_ADD')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'DIRECT_ADD'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isBn ? 'সরাসরি এন্ট্রি' : 'Direct Add'}</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === 'SETTINGS'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isBn ? 'সোশ্যাল প্রুফ ও টাইমার' : 'Social Proof'}</span>
          </button>
        </div>

        {/* Filter Input (For queue views) */}
        {activeTab !== 'DIRECT_ADD' && activeTab !== 'SETTINGS' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchQueue()}
                placeholder={isBn ? 'নম্বর বা নাম দিয়ে খুঁজুন...' : 'Search phone or name...'}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-400"
              />
            </div>
            <button
              onClick={fetchQueue}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {isBn ? 'ফিল্টার' : 'Filter'}
            </button>
          </div>
        )}
      </div>

      {/* TAB CONTENT 1, 2, 3: RECORD QUEUE (PENDING, APPROVED, REJECTED) */}
      {activeTab !== 'DIRECT_ADD' && activeTab !== 'SETTINGS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">{isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading records...'}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">
                {isBn ? 'এই ক্যাটাগরিতে কোনো রেকর্ড পাওয়া যায়নি।' : 'No records found in this view.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-4 transition-all"
                >
                  {/* Top Bar: Reporter Info (CONFIDENTIAL AUDIT) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-400 font-semibold">{isBn ? 'অভিযোগকারী (গোপন অডিট):' : 'Reporter Audit:'}</span>
                      <span className="font-bold text-white">{item.reporterName}</span>
                      <span className="font-mono text-amber-300">({item.reporterPhone})</span>
                      {item.reporterIp && (
                        <span className="text-slate-500 font-mono">IP: {item.reporterIp}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-amber-400">
                        {isBn ? `সার্চ হিট: ${item.searchHitCount} বার` : `Hits: ${item.searchHitCount}`}
                      </span>
                    </div>
                  </div>

                  {/* Target Scammer Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-xs">{isBn ? 'প্রতারকের নাম / ডাকনাম:' : 'Scammer Name:'}</span>
                      <p className="font-bold text-base text-white">{item.scammerName || (isBn ? 'নামহীন' : 'N/A')}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 text-xs">{isBn ? 'মোবাইল / বিকাশ নম্বর:' : 'Target Phone:'}</span>
                      <p className="font-mono text-base font-bold text-amber-400">{item.phone || (isBn ? 'নেই' : 'N/A')}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 text-xs">{isBn ? 'ক্যাটাগরি ও ক্ষতি:' : 'Category & Loss:'}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-300 font-semibold text-xs">
                          {isBn ? categoryLabelsBn[item.category] || item.category : item.category}
                        </span>
                        {item.amountLost && (
                          <span className="font-bold text-red-400">৳{item.amountLost.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {item.facebookLink && (
                      <div className="md:col-span-3 space-y-1">
                        <span className="text-slate-500 text-xs">{isBn ? 'টার্গেট ফেসবুক প্রোফাইল / পেজ লিংক:' : 'Facebook Link:'}</span>
                        <a
                          href={item.facebookLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sky-400 hover:underline break-all font-mono text-xs"
                        >
                          <FacebookIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.facebookLink}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Description Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300">
                    <span className="text-slate-500 font-bold block mb-1">{isBn ? 'প্রতারণার বিস্তারিত বিবরণ:' : 'Incident Description:'}</span>
                    <p className="whitespace-pre-line leading-relaxed">{item.description}</p>
                  </div>

                  {/* Proof Screenshots Gallery */}
                  {item.proofImages && item.proofImages.length > 0 && (
                    <div>
                      <span className="text-slate-500 text-xs font-semibold block mb-2">
                        {isBn ? 'দাখিলকৃত প্রমাণ ও স্ক্রিনশটসমূহ (ক্লিক করে জুম করুন):' : 'Proof Screenshots (Click to zoom):'}
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {item.proofImages.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => setActiveProofZoom(imgUrl)}
                            className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 hover:border-amber-400 transition-all group shrink-0"
                          >
                            <img src={imgUrl} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes & Rejection Reason if any */}
                  {item.adminNotes && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300">
                      <span className="font-bold">{isBn ? 'অ্যাডমিন নোট:' : 'Admin Notes:'}</span> {item.adminNotes}
                    </div>
                  )}

                  {item.rejectionReason && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                      <span className="font-bold">{isBn ? 'বাতিলের কারণ:' : 'Rejection Reason:'}</span> {item.rejectionReason}
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Approve button (if pending or rejected) */}
                      {item.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isBn ? 'অনুমোদন করুন (Approve & Live)' : 'Approve & Live'}</span>
                        </button>
                      )}

                      {/* Reject button (if pending) */}
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => setRejectModalItem(item)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs active:scale-95 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{isBn ? 'বাতিল করুন (Reject)' : 'Reject'}</span>
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'এডিট' : 'Edit'}</span>
                      </button>
                    </div>

                    {/* Permanent Delete Button */}
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-colors ml-auto"
                      title={isBn ? 'স্থায়ীভাবে ডিলিট' : 'Permanent Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'স্থায়ীভাবে ডিলিট' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: DIRECT SCAMMER ENTRY FORM */}
      {activeTab === 'DIRECT_ADD' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isBn ? 'সরাসরি স্ক্যামার ডাটা এন্ট্রি' : 'Direct Scammer Entry'}
              </h2>
              <p className="text-xs text-slate-400">
                {isBn
                  ? 'অ্যাডমিন নিজে কোনো প্রতারককে সরাসরি ডাটাবেজে যুক্ত করতে পারবেন (তাৎক্ষণিক লাইভ হবে)।'
                  : 'Add verified fraudster records directly to the public registry.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleDirectAddSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {isBn ? 'প্রতারকের মোবাইল / বিকাশ নম্বর' : 'Phone / bKash / Nagad Number'}
              </label>
              <input
                type="text"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                placeholder="e.g. 01712345678"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {isBn ? 'প্রতারকের ফেসবুক প্রোফাইল বা পেজ লিংক' : 'Facebook Profile or Page URL'}
              </label>
              <input
                type="text"
                value={directFacebook}
                onChange={(e) => setDirectFacebook(e.target.value)}
                placeholder="e.g. https://facebook.com/scammer.official"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {isBn ? 'প্রতারকের নাম / ডাকনাম' : 'Scammer Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="e.g. Rahim Scam"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {isBn ? 'টাকার পরিমাণ (যদি থাকে)' : 'Amount Lost (BDT)'}
                </label>
                <input
                  type="number"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {isBn ? 'প্রতারণার ধরন' : 'Category'}
              </label>
              <select
                value={directCategory}
                onChange={(e) => setDirectCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 outline-none"
              >
                <option value="TRANSACTION_FRAUD">{isBn ? 'লেনদেন সংক্রান্ত প্রতারণা (টাকা নিয়ে ব্লক)' : 'Transaction Fraud'}</option>
                <option value="FAKE_PRODUCT">{isBn ? 'নকল বা পণ্য না দিয়ে যোগাযোগ বিচ্ছিন্ন' : 'Fake Product'}</option>
                <option value="ACCOUNT_THEFT">{isBn ? 'ফেসবুক পেজ / আইডি চুরি' : 'Account Theft'}</option>
                <option value="FAKE_SERVICE">{isBn ? 'ভুয়া সেবা / প্রতিশ্রুতি ভঙ্গ' : 'Fake Service'}</option>
                <option value="OTHER">{isBn ? 'অন্যান্য প্রতারণা' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {isBn ? 'প্রতারণার বিস্তারিত বিবরণ' : 'Description'} *
              </label>
              <textarea
                rows={3}
                required
                value={directDescription}
                onChange={(e) => setDirectDescription(e.target.value)}
                placeholder={isBn ? 'প্রতারণার বিবরণ বিস্তারিত লিখুন...' : 'Enter details...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {isBn ? 'অ্যাডমিন ইন্টারনাল নোট (ঐচ্ছিক)' : 'Admin Internal Notes'}
              </label>
              <input
                type="text"
                value={directAdminNotes}
                onChange={(e) => setDirectAdminNotes(e.target.value)}
                placeholder="e.g. Verified via WhatsApp screenshot"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={directSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {directSubmitting ? (isBn ? 'যুক্ত হচ্ছে...' : 'Adding...') : (isBn ? 'লাইভ ডাটাবেজে যুক্ত করুন' : 'Add to Live Database')}
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT 5: SOCIAL PROOF SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isBn ? 'সোশ্যাল প্রুফ ও টাইমার সেটিংস' : 'Social Proof & Timer Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                {isBn
                  ? 'লাইভ অ্যাক্টিভিটি পপআপ অন/অফ এবং কত সেকেন্ড পর পর উঠবে তা নিয়ন্ত্রণ করুন।'
                  : 'Configure floating notification timings and master switch.'}
              </p>
            </div>
          </div>

          <div className="space-y-5 text-xs sm:text-sm">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <span className="font-bold text-white block">
                  {isBn ? 'সোশ্যাল প্রুফ পপআপ চালু রাখুন' : 'Enable Social Proof Popup'}
                </span>
                <span className="text-xs text-slate-400">
                  {isBn ? 'স্ক্রিনের কোণায় লাইভ ট্রানজেকশন নোটিফিকেশন প্রদর্শন করবে।' : 'Show live dynamic cashout & escrow popups.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSocialProofEnabled(!socialProofEnabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  socialProofEnabled ? 'bg-purple-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    socialProofEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Timers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">
                  {isBn ? 'শুরুর সময় (Initial Delay)' : 'Initial Delay (Sec)'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={socialInitialDelay}
                  onChange={(e) => setSocialInitialDelay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-purple-400"
                />
                <span className="text-[10px] text-slate-500">{isBn ? 'পেজ লোডের পর প্রথম পপআপ' : 'Delay before 1st popup'}</span>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">
                  {isBn ? 'ইন্টারভাল (Interval)' : 'Interval (Sec)'}
                </label>
                <input
                  type="number"
                  min={5}
                  value={socialInterval}
                  onChange={(e) => setSocialInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-purple-400"
                />
                <span className="text-[10px] text-slate-500">{isBn ? 'প্রতিটি পপআপের মধ্যবর্তী বিরতি' : 'Gap between popups'}</span>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">
                  {isBn ? 'স্থায়িত্ব (Duration)' : 'Duration (Sec)'}
                </label>
                <input
                  type="number"
                  min={3}
                  value={socialDuration}
                  onChange={(e) => setSocialDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono outline-none focus:border-purple-400"
                />
                <span className="text-[10px] text-slate-500">{isBn ? 'স্ক্রিনে কত সেকেন্ড ভাসবে' : 'Display duration'}</span>
              </div>
            </div>

            <button
              onClick={handleSaveSocialProofSettings}
              disabled={savingSettings}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Settings')}</span>
            </button>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {isBn ? 'রিপোর্টটি বাতিল করার কারণ লিখুন' : 'Reject Scammer Report'}
            </h3>
            <p className="text-xs text-slate-400">
              {isBn ? 'এই কারণটি ব্যবহারকারী তার ড্যাশবোর্ডে দেখতে পারবে।' : 'This reason will be visible to the reporter.'}
            </p>
            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder={isBn ? 'যেমন: যথাযথ প্রমাণের অভাব বা অসত্য তথ্য...' : 'e.g. Insufficient chat evidence...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm outline-none focus:border-red-400"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                {isBn ? 'রিজেক্ট নিশ্চিত করুন' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/50 rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {isBn ? 'স্থায়ীভাবে ডিলিট করতে চান?' : 'Permanent Deletion'}
              </h3>
              <p className="text-xs text-slate-400">
                {isBn
                  ? 'এই রেকর্ডটি ডাটাবেজ থেকে চিরতরে মুছে যাবে এবং পাবলিক সার্চেও আর পাওয়া যাবে না। এটি পুনরুদ্ধার করা সম্ভব নয়।'
                  : 'This record will be permanently purged from the database.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {isBn ? 'না, রাখুন' : 'Keep'}
              </button>
              <button
                onClick={() => handleDeletePermanent(deleteConfirmId)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
              >
                {isBn ? 'হ্যাঁ, ডিলিট করুন' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">{isBn ? 'রেকর্ড এডিট করুন' : 'Edit Scammer Record'}</h3>
              <button onClick={() => setEditItem(null)} className="p-1 rounded-full text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">{isBn ? 'মোবাইল নম্বর:' : 'Phone:'}</label>
                <input
                  type="text"
                  value={editItem.phone || ''}
                  onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{isBn ? 'ফেসবুক লিংক:' : 'Facebook Link:'}</label>
                <input
                  type="text"
                  value={editItem.facebookLink || ''}
                  onChange={(e) => setEditItem({ ...editItem, facebookLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{isBn ? 'প্রতারকের নাম:' : 'Name:'}</label>
                <input
                  type="text"
                  value={editItem.scammerName || ''}
                  onChange={(e) => setEditItem({ ...editItem, scammerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{isBn ? 'ক্ষতির পরিমাণ:' : 'Amount:'}</label>
                <input
                  type="number"
                  value={editItem.amountLost || ''}
                  onChange={(e) => setEditItem({ ...editItem, amountLost: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{isBn ? 'বিবরণ:' : 'Description:'}</label>
                <textarea
                  rows={3}
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">{isBn ? 'অ্যাডমিন নোট:' : 'Admin Notes:'}</label>
                <input
                  type="text"
                  value={editItem.adminNotes || ''}
                  onChange={(e) => setEditItem({ ...editItem, adminNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN PROOF IMAGE ZOOM MODAL */}
      {activeProofZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setActiveProofZoom(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={activeProofZoom} alt="Proof Fullscreen" className="max-w-full max-h-[85vh] rounded-xl object-contain border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}
