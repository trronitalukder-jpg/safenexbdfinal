'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { getImageUrl } from '@/lib/imageUtils';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ExternalLink,
  Ban,
  Maximize2,
  DollarSign,
  Users,
  Settings,
  Plus,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Tag,
  ToggleLeft,
  ToggleRight,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';
import ImageLightbox from '@/components/common/ImageLightbox';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function AdminMicroJobsPage() {
  const { lang, t } = useLanguage();
  const { settings, refreshSettings } = useSettings();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'jobs' | 'queue' | 'categories'>('jobs');

  // Stats
  const [stats, setStats] = useState<any>({
    totalJobs: 0,
    pendingJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    rejectedJobs: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Tab 1: All Jobs
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
  const [jobSearch, setJobSearch] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const [jobTotalPages, setJobTotalPages] = useState(1);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [reviewingJobId, setReviewingJobId] = useState<string | null>(null);
  const [rejectModalJob, setRejectModalJob] = useState<any | null>(null);
  const [jobRejectReason, setJobRejectReason] = useState('');

  // Tab 2: Submissions Queue
  const [queueSubmissions, setQueueSubmissions] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueStatusFilter, setQueueStatusFilter] = useState('SUBMITTED');
  const [queuePage, setQueuePage] = useState(1);
  const [queueTotalPages, setQueueTotalPages] = useState(1);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectModalSub, setRejectModalSub] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Tab 3: Categories
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: '', slug: '', icon: 'briefcase', minReward: 1.5 });
  const [creatingCat, setCreatingCat] = useState(false);

  // Job Details / Submissions Modal
  const [selectedJobModal, setSelectedJobModal] = useState<any | null>(null);
  const [jobModalSubmissions, setJobModalSubmissions] = useState<any[]>([]);
  const [loadingModalSubmissions, setLoadingModalSubmissions] = useState(false);

  // Zoom Lightbox
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Auto approve action & Advanced Features state
  const [triggeringCron, setTriggeringCron] = useState(false);
  const [togglingMaster, setTogglingMaster] = useState(false);
  const [savingAutoApprove, setSavingAutoApprove] = useState(false);
  const [adminAdvFeatures, setAdminAdvFeatures] = useState<any>({
    microJobAutoApproval: { enabled: true, autoApproveHours: 48 },
    quickRejectTemplates: {
      enabled: true,
      reasons: [
        'স্ক্রিনশট অস্পষ্ট বা ফেক (Invalid Screenshot)',
        'কাজের নির্দেশনা সঠিকভাবে অনুসরণ করা হয়নি',
        'সাবস্ক্রাইব / ফলো আনডু করা হয়েছে',
        'ভুল ট্রানজেকশন আইডি (Invalid TrxID)',
        'ডুপ্লিকেট বা পূর্বে ব্যবহৃত প্রুফ জমা দেওয়া হয়েছে',
      ],
    },
  });

  const fetchAdminAdvSettings = async () => {
    try {
      const res = await api.get('/settings/admin');
      const data = unwrap(res);
      if (data?.advancedFeatures) {
        setAdminAdvFeatures((prev: any) => ({
          ...prev,
          ...data.advancedFeatures,
          microJobAutoApproval: {
            ...prev.microJobAutoApproval,
            ...(data.advancedFeatures.microJobAutoApproval || {}),
          },
          quickRejectTemplates: {
            ...prev.quickRejectTemplates,
            ...(data.advancedFeatures.quickRejectTemplates || {}),
            reasons: Array.isArray(data.advancedFeatures.quickRejectTemplates?.reasons)
              ? data.advancedFeatures.quickRejectTemplates.reasons
              : prev.quickRejectTemplates.reasons,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch admin settings:', err);
    }
  };

  const handleSaveAutoApproveConfig = async (nextEnabled: boolean, nextHours: number) => {
    const validHours = Math.max(1, Number(nextHours) || 48);
    setSavingAutoApprove(true);
    try {
      const fullRes = await api.get('/settings/admin');
      const fullSettings = unwrap(fullRes) || {};
      const updatedAdv = {
        ...(fullSettings.advancedFeatures || {}),
        microJobAutoApproval: {
          enabled: nextEnabled,
          autoApproveHours: validHours,
        },
      };
      const updatedMicroJob = {
        ...(fullSettings.microJob || {}),
        autoApproveHours: validHours,
      };
      await api.post('/settings/admin', {
        ...fullSettings,
        microJob: updatedMicroJob,
        advancedFeatures: updatedAdv,
      });
      setAdminAdvFeatures((prev: any) => ({
        ...prev,
        microJobAutoApproval: { enabled: nextEnabled, autoApproveHours: validHours },
      }));
      if (refreshSettings) await refreshSettings();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'অটো-অ্যাপ্রুভাল সেটিংস সেভ করা যায়নি');
    } finally {
      setSavingAutoApprove(false);
    }
  };

  const notifySidebarRefresh = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('admin-sidebar-counts-refresh'));
    }
  };

  // Load Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/micro-jobs/stats');
      const data = unwrap(res);
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load Jobs
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const query = new URLSearchParams();
      if (jobStatusFilter !== 'ALL') query.set('status', jobStatusFilter);
      if (jobSearch.trim()) query.set('search', jobSearch.trim());
      query.set('page', String(jobPage));
      query.set('limit', '15');

      const res = await api.get(`/admin/micro-jobs?${query.toString()}`);
      const data = unwrap(res);
      if (data) {
        setJobs(data.items || []);
        setJobTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Load Queue Submissions
  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const query = new URLSearchParams();
      if (queueStatusFilter !== 'ALL') query.set('status', queueStatusFilter);
      query.set('page', String(queuePage));
      query.set('limit', '15');

      const res = await api.get(`/admin/micro-jobs/submissions/queue?${query.toString()}`);
      const data = unwrap(res);
      if (data) {
        setQueueSubmissions(data.items || []);
        setQueueTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch submissions queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  // Load Categories
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.get('/admin/micro-jobs/categories/all');
      const data = unwrap(res);
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchAdminAdvSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') fetchJobs();
    else if (activeTab === 'queue') fetchQueue();
    else if (activeTab === 'categories') fetchCategories();
  }, [activeTab, jobStatusFilter, jobPage, queueStatusFilter, queuePage]);

  // Master Switch Toggle
  const handleToggleMasterSwitch = async () => {
    const currentEnabled = settings.microJob?.enabled !== false;
    const newStatus = !currentEnabled;
    const confirmMsg = newStatus
      ? 'আপনি কি নিশ্চিত যে মাইক্রো জব সার্ভিসটি সক্রিয় (ON) করতে চান?'
      : 'আপনি কি নিশ্চিত যে মাইক্রো জব সার্ভিসটি নিষ্ক্রিয় (OFF) করতে চান? এর ফলে ইউজাররা কাজ দেখতে ও করতে পারবে না।';

    if (!confirm(confirmMsg)) return;

    setTogglingMaster(true);
    try {
      // Fetch full settings first
      const fullSettingsRes = await api.get('/settings/admin');
      const fullSettings = unwrap(fullSettingsRes) || {};

      const updatedMicroJob = {
        ...(fullSettings.microJob || {}),
        enabled: newStatus,
      };

      await api.post('/settings/admin', {
        ...fullSettings,
        microJob: updatedMicroJob,
      });

      if (refreshSettings) await refreshSettings();
      alert(`মাইক্রো জব সার্ভিস সফলভাবে ${newStatus ? 'চালু (ON)' : 'বন্ধ (OFF)'} করা হয়েছে!`);
    } catch (err: any) {
      console.error('Failed to toggle master switch:', err);
      alert(err?.response?.data?.message || 'সেটিংস আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setTogglingMaster(false);
    }
  };

  // Trigger auto-approve cron
  const handleTriggerAutoApprove = async () => {
    setTriggeringCron(true);
    try {
      const res = await api.post('/admin/micro-jobs/trigger-auto-approve', {});
      const data = unwrap(res);
      alert(`অটো-অ্যাপ্রুভাল সম্পন্ন হয়েছে! মোট ${data?.processedCount || 0} টি কাজ অটো-অ্যাপ্রুভ করা হয়েছে।`);
      fetchStats();
      notifySidebarRefresh();
      if (activeTab === 'queue') fetchQueue();
      if (activeTab === 'jobs') fetchJobs();
    } catch (err: any) {
      console.error('Auto approve trigger failed:', err);
      alert('অটো-অ্যাপ্রুভ চালানো যায়নি');
    } finally {
      setTriggeringCron(false);
    }
  };

  // Open Submissions Modal for a specific job
  const handleOpenJobSubmissions = async (job: any) => {
    setSelectedJobModal(job);
    setLoadingModalSubmissions(true);
    try {
      const res = await api.get(`/admin/micro-jobs/${job.id}/submissions`);
      const data = unwrap(res);
      if (data) {
        setJobModalSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to fetch job submissions:', err);
    } finally {
      setLoadingModalSubmissions(false);
    }
  };

  // Admin Review Job Post (Approve / Reject with reason)
  const handleAdminReviewJob = async (jobId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setReviewingJobId(jobId);
    try {
      await api.post(`/admin/micro-jobs/${jobId}/review`, {
        action,
        rejectReason: reason,
      });
      setRejectModalJob(null);
      setJobRejectReason('');
      await Promise.all([fetchJobs(), fetchStats()]);
      notifySidebarRefresh();
      alert(
        action === 'APPROVE'
          ? 'মাইক্রো জব পোস্টটি সফলভাবে অনুমোদন (Approve) করা হয়েছে এবং এখন লাইভ আছে!'
          : 'মাইক্রো জব পোস্টটি কারণসহ ডিক্লাইন (Reject) করা হয়েছে। ইউজার তার প্যানেল থেকে এডিট করে পুনরায় সাবমিট করতে পারবেন।',
      );
    } catch (err: any) {
      console.error('Job review failed:', err);
      alert(err?.response?.data?.message || 'জব রিভিউ সম্পন্ন করা যায়নি');
    } finally {
      setReviewingJobId(null);
    }
  };

  // Admin Review Submission (Approve / Reject)
  const handleAdminReview = async (submissionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setReviewingId(submissionId);
    try {
      await api.post(`/admin/micro-jobs/submissions/${submissionId}/review`, {
        action,
        rejectReason: reason,
      });

      // Update state locally
      const updateList = (list: any[]) =>
        list.map((s) => (s.id === submissionId ? { ...s, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', rejectReason: reason } : s));

      setQueueSubmissions((prev) => updateList(prev));
      setJobModalSubmissions((prev) => updateList(prev));
      setRejectModalSub(null);
      setRejectReason('');
      fetchStats();
      notifySidebarRefresh();
      alert(action === 'APPROVE' ? 'সাবমিশনটি অনুমোদন করা হয়েছে এবং কর্মীর ওয়ালেটে টাকা যোগ হয়েছে!' : 'সাবমিশনটি বাতিল করা হয়েছে!');
    } catch (err: any) {
      console.error('Review failed:', err);
      alert(err?.response?.data?.message || 'রিভিউ সম্পন্ন করা যায়নি');
    } finally {
      setReviewingId(null);
    }
  };

  // Admin Cancel Job & Refund
  const handleAdminCancelJob = async (jobId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই কাজটি বাতিল করতে চান? অবশিষ্ট বাজেট স্বয়ংক্রিয়ভাবে নিয়োগকর্তার ওয়ালেটে রিফান্ড করা হবে।')) {
      return;
    }

    setCancellingJobId(jobId);
    try {
      const res = await api.post(`/admin/micro-jobs/${jobId}/cancel`, {});
      const data = unwrap(res);
      alert(`কাজটি বাতিল করা হয়েছে! নিয়োগকর্তাকে ৳${Number(data?.refundAmount || 0).toFixed(2)} টাকা ফেরত দেওয়া হয়েছে।`);
      fetchJobs();
      fetchStats();
      notifySidebarRefresh();
    } catch (err: any) {
      console.error('Cancel job failed:', err);
      alert(err?.response?.data?.message || 'কাজ বাতিল করা যায়নি');
    } finally {
      setCancellingJobId(null);
    }
  };

  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  // Admin Toggle Active / Paused
  const handleAdminToggleStatus = async (jobId: string) => {
    setTogglingJobId(jobId);
    try {
      const res = await api.patch(`/admin/micro-jobs/${jobId}/toggle-status`, {});
      const data = unwrap(res);
      alert(data?.message || 'জবের স্ট্যাটাস পরিবর্তন করা হয়েছে');
      fetchJobs();
      fetchStats();
    } catch (err: any) {
      console.error('Toggle status failed:', err);
      alert(err?.response?.data?.message || 'স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি');
    } finally {
      setTogglingJobId(null);
    }
  };

  // Admin Delete Job Permanently
  const handleAdminDeleteJob = async (jobId: string) => {
    if (
      !confirm(
        'আপনি কি নিশ্চিত যে এই কাজটি স্থায়ীভাবে ডিলিট করতে চান? যদি কাজটি অ্যাক্টিভ বা পজ থাকে, তবে অবশিষ্ট বাজেট স্বয়ংক্রিয়ভাবে নিয়োগকর্তার ওয়ালেটে রিফান্ড করা হবে।',
      )
    ) {
      return;
    }

    setDeletingJobId(jobId);
    try {
      const res = await api.delete(`/admin/micro-jobs/${jobId}`);
      const data = unwrap(res);
      alert(data?.message || 'কাজটি সফলভাবে ডিলিট করা হয়েছে');
      fetchJobs();
      fetchStats();
    } catch (err: any) {
      console.error('Delete job failed:', err);
      alert(err?.response?.data?.message || 'কাজটি ডিলিট করা সম্ভব হয়নি');
    } finally {
      setDeletingJobId(null);
    }
  };

  // Category Toggle
  const handleToggleCategory = async (cat: any) => {
    try {
      await api.patch(`/admin/micro-jobs/categories/${cat.id}`, {
        isActive: !cat.isActive,
      });
      fetchCategories();
    } catch (err) {
      console.error('Toggle category failed:', err);
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatForm.name.trim() || !newCatForm.slug.trim()) return;

    setCreatingCat(true);
    try {
      await api.post('/admin/micro-jobs/categories', newCatForm);
      setNewCatModal(false);
      setNewCatForm({ name: '', slug: '', icon: 'briefcase', minReward: 1.5 });
      fetchCategories();
    } catch (err: any) {
      console.error('Create category failed:', err);
      alert(err?.response?.data?.message || 'ক্যাটাগরি তৈরি করা সম্ভব হয়নি');
    } finally {
      setCreatingCat(false);
    }
  };

  const isMasterEnabled = settings.microJob?.enabled !== false;

  return (
    <div className="space-y-6 pb-20">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {lang === 'bn' ? 'মাইক্রো জব কন্ট্রোল ও ম্যানেজমেন্ট' : 'Micro Jobs Control & Management'}
              </h1>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isMasterEnabled
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}
              >
                {isMasterEnabled ? 'LIVE / ON' : 'DISABLED / OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'সকল পোস্ট করা কাজ, কর্মীদের প্রমাণ রিভিউ, এসক্রো অনুমোদন এবং সিস্টেম সেটিংস নিয়ন্ত্রণ করুন।'
                : 'Manage posted tasks, inspect submitted proofs, approve worker payouts & control system rules.'}
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerAutoApprove}
            disabled={triggeringCron}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
            title="সময়সীমা পার হওয়া পেন্ডিং সাবমিশনগুলো অটো-অ্যাপ্রুভ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggeringCron ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'অটো-অ্যাপ্রুভ রান করুন' : 'Run Auto-Approve'}</span>
          </button>

          <Link
            href="/micro-jobs"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'bn' ? 'পাবলিক মার্কেট দেখুন' : 'Public Marketplace'}</span>
          </Link>

          <Link
            href="/admin/settings?tab=micro_job"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ফি ও টাইমার কনফিগ' : 'Fee & Rules'}</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MASTER SWITCH QUICK BAR                                                */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span>{lang === 'bn' ? 'মাইক্রো জব মাস্টার সুইচ (Master Switch)' : 'Micro Jobs Master Switch'}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isMasterEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {isMasterEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isMasterEnabled
                ? 'মাইক্রো জব সার্ভিস সক্রিয় আছে। নেভিগেশন, ড্যাশবোর্ড ও মার্কেটপ্লেস সম্পূর্ণ লাইভ।'
                : 'মাইক্রো জব সার্ভিসটি বর্তমানে বন্ধ। সাধারণ ব্যবহারকারীরা কাজ দেখতে বা পোস্ট করতে পারবে না।'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-slate-400 block font-semibold">প্ল্যাটফর্ম ফি: {settings.microJob?.platformFeePercent ?? 5}%</span>
            <span className="text-[10px] text-slate-400 block font-semibold">অটো অ্যাপ্রুভাল: {settings.microJob?.autoApproveHours ?? 48} ঘণ্টা</span>
          </div>

          <button
            type="button"
            onClick={handleToggleMasterSwitch}
            disabled={togglingMaster}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-sm ${
              isMasterEnabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {togglingMaster ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isMasterEnabled ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            <span>
              {togglingMaster
                ? 'পরিবর্তন হচ্ছে...'
                : isMasterEnabled
                ? 'সার্ভিস বন্ধ করুন (Turn OFF)'
                : 'সার্ভিস চালু করুন (Turn ON)'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2B. AUTO-APPROVAL CONTROL BAR                                             */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`p-3 rounded-2xl shrink-0 ${
              adminAdvFeatures.microJobAutoApproval?.enabled
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                ⏱️ অটো-অ্যাপ্রুভাল টাইমার কন্ট্রোল (Micro-Job Auto-Approval)
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  adminAdvFeatures.microJobAutoApproval?.enabled
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {adminAdvFeatures.microJobAutoApproval?.enabled
                  ? `ON (${adminAdvFeatures.microJobAutoApproval?.autoApproveHours || 48}h)`
                  : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              নির্দিষ্ট ঘণ্টার মধ্যে বায়ার বা অ্যাডমিন প্রুফ রিভিউ না করলে সিস্টেম স্বয়ংক্রিয়ভাবে প্রুফ অ্যাপ্রুভ করে ওয়ার্কারকে পেমেন্ট রিলিজ করবে।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">অটো-অ্যাপ্রুভ সময় (ঘণ্টা):</span>
            <input
              type="number"
              min={1}
              max={720}
              value={adminAdvFeatures.microJobAutoApproval?.autoApproveHours ?? 48}
              onChange={(e) => {
                const val = Math.max(1, Number(e.target.value) || 48);
                setAdminAdvFeatures((prev: any) => ({
                  ...prev,
                  microJobAutoApproval: {
                    ...prev.microJobAutoApproval,
                    autoApproveHours: val,
                  },
                }));
              }}
              className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              disabled={savingAutoApprove}
              onClick={() =>
                handleSaveAutoApproveConfig(
                  !!adminAdvFeatures.microJobAutoApproval?.enabled,
                  Number(adminAdvFeatures.microJobAutoApproval?.autoApproveHours) || 48,
                )
              }
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition disabled:opacity-50"
            >
              সেভ
            </button>
          </div>

          <button
            type="button"
            disabled={savingAutoApprove}
            onClick={() =>
              handleSaveAutoApproveConfig(
                !adminAdvFeatures.microJobAutoApproval?.enabled,
                Number(adminAdvFeatures.microJobAutoApproval?.autoApproveHours) || 48,
              )
            }
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs ${
              adminAdvFeatures.microJobAutoApproval?.enabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            } disabled:opacity-50`}
          >
            {adminAdvFeatures.microJobAutoApproval?.enabled ? (
              <>
                <ToggleRight className="w-4 h-4" />
                <span>অটো-অ্যাপ্রুভ বন্ধ করুন (OFF)</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                <span>অটো-অ্যাপ্রুভ চালু করুন (ON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SUMMARY METRICS CARDS                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Jobs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট কাজ (Total Jobs)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalJobs}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats.activeJobs} টি চলমান • {stats.completedJobs} টি সমাপ্ত
          </span>
        </div>

        {/* Pending Job Post Approval */}
        <div
          onClick={() => {
            setActiveTab('jobs');
            setJobStatusFilter('PENDING');
            setJobPage(1);
          }}
          className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-rose-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">পেন্ডিং জব অনুমোদন</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 relative">
              <Briefcase className="w-4 h-4" />
              {stats.pendingJobs > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats.pendingJobs || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            জব অ্যাপ্রুভ করতে ক্লিক করুন →
          </span>
        </div>

        {/* Pending Submissions Queue */}
        <div
          onClick={() => setActiveTab('queue')}
          className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">পেন্ডিং প্রুফ রিভিউ</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 relative">
              <Clock className="w-4 h-4" />
              {stats.pendingSubmissions > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.pendingSubmissions}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            রিভিউ করতে ক্লিক করুন →
          </span>
        </div>

        {/* Total Submissions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট প্রুফ জমা</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalSubmissions}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats.approvedSubmissions} অনুমোদিত • {stats.rejectedSubmissions} বাতিল
          </span>
        </div>

        {/* Completed Jobs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">সফল কাজ (Completed)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.completedJobs}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ১০০% কর্মী কোটা পূরণ
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. NAVIGATION TABS                                                        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            activeTab === 'jobs'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>সকল মাইক্রো জব ({stats.totalJobs})</span>
          {stats.pendingJobs > 0 && (
            <span className="px-1.5 py-0.2 rounded-full font-black text-[10px] bg-rose-500 text-white animate-pulse">
              {stats.pendingJobs} পেন্ডিং
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            activeTab === 'queue'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>প্রুফ রিভিউ কিউ</span>
          {stats.pendingSubmissions > 0 && (
            <span className="px-1.5 py-0.2 rounded-full font-black text-[10px] bg-amber-500 text-white">
              {stats.pendingSubmissions}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>ক্যাটাগরি ম্যানেজমেন্ট</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL JOBS TABLE                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'jobs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'PAUSED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setJobStatusFilter(st);
                    setJobPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                    jobStatusFilter === st
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span>
                    {st === 'ALL'
                      ? 'সব জব'
                      : st === 'PENDING'
                      ? 'পেন্ডিং অনুমোদন'
                      : st === 'ACTIVE'
                      ? 'চলমান (Active)'
                      : st === 'REJECTED'
                      ? 'রিজেক্টেড'
                      : st === 'PAUSED'
                      ? 'নিষ্ক্রিয় (Paused)'
                      : st === 'COMPLETED'
                      ? 'সম্পন্ন'
                      : 'বাতিল'}
                  </span>
                  {st === 'PENDING' && stats.pendingJobs > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                      {stats.pendingJobs}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={jobSearch}
                onChange={(e) => {
                  setJobSearch(e.target.value);
                  setJobPage(1);
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                placeholder="টাইটেল বা ইউজার আইডি খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Table */}
          {loadingJobs ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-slate-400 text-xs">
              <Briefcase className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>কোনো মাইক্রো জব খুঁজে পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-3">কাজের বিবরণ</th>
                    <th className="py-3 px-3">নিয়োগকর্তা (Employer)</th>
                    <th className="py-3 px-3">বাজেট ও রেট</th>
                    <th className="py-3 px-3">কর্মী অগ্রগতি</th>
                    <th className="py-3 px-3">স্ট্যাটাস</th>
                    <th className="py-3 px-3">তারিখ</th>
                    <th className="py-3 px-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {jobs.map((job) => {
                    const approved = Number(job.approvedCount || 0);
                    const total = Number(job.totalWorkersNeeded || 1);
                    const pending = Number(job.pendingCount || 0);
                    const percent = Math.min(100, Math.round((approved / total) * 100));

                    return (
                      <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-3 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {job.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                              {job.category?.name || 'General'}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-[10px]">{job.id.slice(-6)}</span>
                          </div>
                          {job.rejectReason && job.status === 'REJECTED' && (
                            <div className="mt-1.5 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-500">
                              <span className="font-bold">রিজেক্টের কারণ:</span> {job.rejectReason}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            {job.employer?.avatarUrl ? (
                              <img
                                src={getImageUrl(job.employer.avatarUrl)}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {job.employer?.firstName?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {job.employer?.firstName} {job.employer?.lastName}
                              </div>
                              <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                                @{job.employer?.uniqueUserId}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-black text-emerald-600 dark:text-emerald-400">
                            ৳ {Number(job.rewardPerWorker).toFixed(2)}
                            <span className="text-[10px] font-normal text-slate-400"> / কর্মী</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            মোট: ৳{(Number(job.totalBudget) + Number(job.platformFee)).toFixed(2)} (ফি: ৳{Number(job.platformFee).toFixed(2)})
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            <span>
                              {approved} / {total}
                            </span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          {pending > 0 && (
                            <span className="text-[10px] text-amber-500 font-bold block mt-1">
                              {pending} টি পেন্ডিং প্রুফ
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              job.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : job.status === 'PENDING'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                                : job.status === 'REJECTED'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : job.status === 'PAUSED'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : job.status === 'COMPLETED'
                                ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}
                          >
                            {job.status === 'ACTIVE'
                              ? 'চলমান'
                              : job.status === 'PENDING'
                              ? 'পেন্ডিং অনুমোদন'
                              : job.status === 'REJECTED'
                              ? 'রিজেক্টেড'
                              : job.status === 'PAUSED'
                              ? 'নিষ্ক্রিয়'
                              : job.status === 'COMPLETED'
                              ? 'সম্পন্ন'
                              : 'বাতিল'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Approve Job Button (For PENDING or REJECTED jobs) */}
                            {(job.status === 'PENDING' || job.status === 'REJECTED') && (
                              <button
                                type="button"
                                onClick={() => handleAdminReviewJob(job.id, 'APPROVE')}
                                disabled={reviewingJobId === job.id}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-2xs"
                                title="জব অনুমোদন করুন (Approve Job)"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Reject Job with Reason Button (For PENDING or ACTIVE jobs) */}
                            {(job.status === 'PENDING' || job.status === 'ACTIVE') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalJob(job);
                                  setJobRejectReason(job.rejectReason || '');
                                }}
                                disabled={reviewingJobId === job.id}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-500/20 font-bold text-[11px] flex items-center gap-1 transition"
                                title="কারণসহ জব রিজেক্ট করুন (Decline with Reason)"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            )}

                            {/* View Submissions */}
                            <button
                              type="button"
                              onClick={() => handleOpenJobSubmissions(job)}
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition font-bold text-xs flex items-center gap-1"
                              title="প্রমাণসমূহ দেখুন ও রিভিউ করুন"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>প্রমাণ ({job._count?.submissions || 0})</span>
                            </button>

                            {/* View Live */}
                            <Link
                              href={`/micro-jobs/${job.id}`}
                              target="_blank"
                              title="পাবলিক ভিউ"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* Admin Pause / Resume Toggle */}
                            {(job.status === 'ACTIVE' || job.status === 'PAUSED') && (
                              <button
                                type="button"
                                onClick={() => handleAdminToggleStatus(job.id)}
                                disabled={togglingJobId === job.id}
                                title={job.status === 'ACTIVE' ? 'পজ / নিষ্ক্রিয় করুন' : 'সক্রিয় / চালু করুন'}
                                className={`p-1.5 rounded-lg border transition ${
                                  job.status === 'ACTIVE'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 border-amber-200 dark:border-amber-900/50'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border-emerald-200 dark:border-emerald-900/50'
                                }`}
                              >
                                {job.status === 'ACTIVE' ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Admin Force Cancel & Refund */}
                            {job.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => handleAdminCancelJob(job.id)}
                                disabled={cancellingJobId === job.id}
                                title="কাজ বাতিল ও নিয়োগকর্তাকে রিফান্ড দিন"
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Admin Permanent Delete */}
                            <button
                              type="button"
                              onClick={() => handleAdminDeleteJob(job.id)}
                              disabled={deletingJobId === job.id}
                              title="স্থায়ীভাবে ডিলিট করুন (বাকি থাকলে রিফান্ড হবে)"
                              className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-200 border border-red-200 dark:border-red-900/50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {jobTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-xs text-slate-400">
                পৃষ্ঠা {jobPage} / {jobTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={jobPage <= 1}
                  onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-50"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="button"
                  disabled={jobPage >= jobTotalPages}
                  onClick={() => setJobPage((p) => Math.min(jobTotalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-50"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENDING REVIEW QUEUE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              {['SUBMITTED', 'ALL', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setQueueStatusFilter(st);
                    setQueuePage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                    queueStatusFilter === st
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {st === 'SUBMITTED' ? 'পেন্ডিং কিউ (Pending)' : st === 'ALL' ? 'সব প্রমাণ' : st === 'APPROVED' ? 'অনুমোদিত' : 'বাতিলকৃত'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {loadingQueue ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            </div>
          ) : queueSubmissions.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p>কোনো পেন্ডিং সাবমিশন নেই! সব প্রুফ ইতোমধ্যে যাচাই করা হয়েছে।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queueSubmissions.map((sub) => {
                const subImages = Array.isArray(sub.proofScreenshots)
                  ? sub.proofScreenshots
                  : Array.isArray(sub.screenshots)
                  ? sub.screenshots
                  : [];

                return (
                  <div
                    key={sub.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                      <div className="flex items-center gap-3">
                        {sub.worker?.avatarUrl ? (
                          <img
                            src={getImageUrl(sub.worker.avatarUrl)}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-amber-500/30"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 font-black text-xs flex items-center justify-center">
                            {sub.worker?.firstName?.charAt(0) || 'W'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{sub.worker?.firstName} {sub.worker?.lastName}</span>
                            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">@{sub.worker?.uniqueUserId}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            সাবমিট করেছে: {new Date(sub.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">কাজের পারিশ্রমিক</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            ৳ {Number(sub.job?.rewardPerWorker || 0).toFixed(2)}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            sub.status === 'SUBMITTED'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : sub.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}
                        >
                          {sub.status === 'SUBMITTED' ? 'পেন্ডিং রিভিউ' : sub.status === 'APPROVED' ? 'অনুমোদিত' : 'বাতিল'}
                        </span>
                      </div>
                    </div>

                    {/* Task details */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        কাজের শিরোনাম ও আইডি
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {sub.job?.title}
                        </h4>
                        <Link
                          href={`/micro-jobs/${sub.job?.id}`}
                          target="_blank"
                          className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                        >
                          <span>কাজটি দেখুন</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Proof Text */}
                    {sub.proofText && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          কর্মীর দাখিলকৃত প্রমাণ / নোট:
                        </span>
                        <p className="whitespace-pre-wrap">{sub.proofText}</p>
                      </div>
                    )}

                    {/* Reject Reason if Rejected */}
                    {sub.rejectReason && sub.status === 'REJECTED' && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                        <span className="font-bold">বাতিলের কারণ:</span> {sub.rejectReason}
                      </div>
                    )}

                    {/* Screenshots gallery */}
                    {subImages.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          স্ক্রিনশট প্রমাণসমূহ (জুম করতে ক্লিক করুন):
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {subImages.map((imgUrl: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setZoomedImage(getImageUrl(imgUrl))}
                              className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs hover:border-amber-400 transition"
                            >
                              <img
                                src={getImageUrl(imgUrl)}
                                alt="Proof screenshot"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons for Pending */}
                    {sub.status === 'SUBMITTED' && (
                      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectModalSub(sub);
                            setRejectReason('');
                          }}
                          disabled={reviewingId === sub.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 text-xs font-bold transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>বাতিল করুন (Decline)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAdminReview(sub.id, 'APPROVE')}
                          disabled={reviewingId === sub.id}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                        >
                          {reviewingId === sub.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>অনুমোদন ও টাকা রিলিজ (Approve)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Queue Pagination */}
          {queueTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-xs text-slate-400">
                পৃষ্ঠা {queuePage} / {queueTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={queuePage <= 1}
                  onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-50"
                >
                  পূর্ববর্তী
                </button>
                <button
                  type="button"
                  disabled={queuePage >= queueTotalPages}
                  onClick={() => setQueuePage((p) => Math.min(queueTotalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-50"
                >
                  পরবর্তী
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CATEGORIES MANAGEMENT                                              */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                মাইক্রো জব ক্যাটাগরি কনফিগারেশন
              </h3>
              <p className="text-xs text-slate-400">
                কাজের ক্যাটাগরি তৈরি, সক্রিয়/নিষ্ক্রিয় এবং সর্বনিম্ন বাজেট রেট নির্ধারণ করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewCatModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাটাগরি</span>
            </button>
          </div>

          {loadingCategories ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      স্লাগ: {cat.slug} • সর্বনিম্ন রেট: ৳{Number(cat.minReward || 1).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
                      মোট কাজ: {cat._count?.jobs || 0} টি
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      cat.isActive
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: JOB PROOFS / SUBMISSIONS                                           */}
      {/* ========================================================================= */}
      {selectedJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  কাজের প্রমাণসমূহ ও অ্যাডমিন রিভিউ
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {selectedJobModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobModal(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {loadingModalSubmissions ? (
                <div className="py-20 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                </div>
              ) : jobModalSubmissions.length === 0 ? (
                <div className="py-16 text-center space-y-2 text-slate-400 text-xs">
                  <Clock className="w-8 h-8 mx-auto" />
                  <p>এই কাজের জন্য এখনো কোনো প্রমাণ জমা পড়েনি।</p>
                </div>
              ) : (
                jobModalSubmissions.map((sub) => {
                  const subModalImages = Array.isArray(sub.proofScreenshots)
                    ? sub.proofScreenshots
                    : Array.isArray(sub.screenshots)
                    ? sub.screenshots
                    : [];

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {sub.worker?.avatarUrl ? (
                            <img
                              src={getImageUrl(sub.worker.avatarUrl)}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-bold flex items-center justify-center">
                              {sub.worker?.firstName?.charAt(0) || 'W'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {sub.worker?.firstName} {sub.worker?.lastName}
                            </div>
                            <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                              @{sub.worker?.uniqueUserId}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            sub.status === 'SUBMITTED'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : sub.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}
                        >
                          {sub.status === 'SUBMITTED' ? 'পেন্ডিং' : sub.status === 'APPROVED' ? 'অনুমোদিত' : 'বাতিল'}
                        </span>
                      </div>

                      {sub.proofText && (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">প্রমাণ বিবরণ:</span>
                          <p className="whitespace-pre-wrap">{sub.proofText}</p>
                        </div>
                      )}

                      {subModalImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {subModalImages.map((img: string, i: number) => (
                            <div
                              key={i}
                              onClick={() => setZoomedImage(getImageUrl(img))}
                              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {sub.status === 'SUBMITTED' && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalSub(sub);
                              setRejectReason('');
                            }}
                            disabled={reviewingId === sub.id}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 text-xs font-bold"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminReview(sub.id, 'APPROVE')}
                            disabled={reviewingId === sub.id}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                          >
                            অনুমোদন
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT SUBMISSION REASON                                           */}
      {/* ========================================================================= */}
      {rejectModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                কাজের প্রুফ বাতিলের কারণ লিখুন (Decline Reason)
              </h3>
              <button onClick={() => setRejectModalSub(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              কেন এই প্রুফটি বাতিল করা হলো তা লিখুন। ইউজার তার প্যানেল থেকে কারণটি দেখতে পারবে এবং সংশোধন করে পুনরায় সাবমিট করতে পারবে।
            </p>
            {adminAdvFeatures.quickRejectTemplates?.enabled !== false &&
              Array.isArray(adminAdvFeatures.quickRejectTemplates?.reasons) &&
              adminAdvFeatures.quickRejectTemplates.reasons.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    ⚡ কুইক রিজেক্ট টেমপ্লেট (ক্লিক করে সিলেক্ট করুন):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {adminAdvFeatures.quickRejectTemplates.reasons.map((r: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectReason(r)}
                        className={`text-left px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          rejectReason === r
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="যেমন: সঠিক স্ক্রিনশট দেননি বা চ্যানেল সাবস্ক্রাইব করেননি..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalSub(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => handleAdminReview(rejectModalSub.id, 'REJECT', rejectReason)}
                disabled={reviewingId === rejectModalSub.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                প্রুফ বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT JOB POST REASON                                             */}
      {/* ========================================================================= */}
      {rejectModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                মাইক্রো জব রিজেক্ট করার কারণ লিখুন
              </h3>
              <button onClick={() => setRejectModalJob(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              জব: <span className="font-bold text-slate-800 dark:text-slate-200">{rejectModalJob.title}</span>। কেন রিজেক্ট করা হলো তা লিখে দিন, যাতে ইউজার এডিট করে পুনরায় সাবমিট করতে পারে।
            </p>
            {adminAdvFeatures.quickRejectTemplates?.enabled !== false &&
              Array.isArray(adminAdvFeatures.quickRejectTemplates?.reasons) &&
              adminAdvFeatures.quickRejectTemplates.reasons.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    ⚡ কুইক রিজেক্ট টেমপ্লেট (ক্লিক করে সিলেক্ট করুন):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {adminAdvFeatures.quickRejectTemplates.reasons.map((r: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setJobRejectReason(r)}
                        className={`text-left px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          jobRejectReason === r
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            <textarea
              rows={3}
              value={jobRejectReason}
              onChange={(e) => setJobRejectReason(e.target.value)}
              placeholder="যেমন: কাজের নির্দেশনা স্পষ্ট নয় অথবা লিংক কাজ করছে না..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalJob(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => handleAdminReviewJob(rejectModalJob.id, 'REJECT', jobRejectReason)}
                disabled={reviewingJobId === rejectModalJob.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                জব রিজেক্ট নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CATEGORY                                                    */}
      {/* ========================================================================= */}
      {newCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                নতুন ক্যাটাগরি তৈরি করুন
              </h3>
              <button type="button" onClick={() => setNewCatModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ক্যাটাগরির নাম *
                </label>
                <input
                  type="text"
                  required
                  value={newCatForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setNewCatForm((prev) => ({ ...prev, name, slug }));
                  }}
                  placeholder="যেমন: Facebook & Instagram"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  স্লাগ (URL Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={newCatForm.slug}
                  onChange={(e) => setNewCatForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="facebook-instagram"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  সর্বনিম্ন পারিশ্রমিক (টাকা)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newCatForm.minReward}
                  onChange={(e) => setNewCatForm((prev) => ({ ...prev, minReward: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewCatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={creatingCat}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs"
              >
                {creatingCat ? 'তৈরি হচ্ছে...' : 'ক্যাটাগরি যুক্ত করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN LIGHTBOX ZOOM                                                  */}
      {/* ========================================================================= */}
      <ImageLightbox
        images={zoomedImage ? [zoomedImage] : []}
        isOpen={Boolean(zoomedImage)}
        onClose={() => setZoomedImage(null)}
        title="এডমিন প্রুফ ভেরিফিকেশন (Admin Proof Inspector)"
      />
    </div>
  );
}
