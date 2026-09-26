'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Briefcase,
  PlusCircle,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Eye,
  RefreshCw,
  Trash2,
  AlertCircle,
  Users,
  DollarSign,
  Wallet,
  ShieldCheck,
  Percent,
  Check,
  Maximize2,
  Ban,
  ArrowRight,
  ExternalLink,
  Pause,
  Play,
} from 'lucide-react';

export default function MicroJobsDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { settings } = useSettings();
  const { user, refreshMe } = useAuthStore();

  const isEnabled = settings.microJob?.enabled !== false;

  // Active Tab
  const initialTab = (searchParams.get('tab') as 'my_jobs' | 'create' | 'my_tasks') || 'my_jobs';
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'create' | 'my_tasks'>(initialTab);

  // Categories
  const [categories, setCategories] = useState<any[]>([]);

  // My Posted Jobs State
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // My Submitted Tasks State
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState<any>({ totalEarned: 0, totalTasks: 0, approvedCount: 0, pendingCount: 0, rejectedCount: 0 });
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Proof Review Modal State
  const [selectedJobForSubmissions, setSelectedJobForSubmissions] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectModalSub, setRejectModalSub] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Screenshot Zoom Modal (Lightbox)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Job Creation Form State
  const [createForm, setCreateForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    steps: [''],
    proofRequirements: [''],
    rewardPerWorker: settings.microJob?.minJobReward || 2,
    totalWorkersNeeded: 10,
    minKycRequired: false,
  });
  const [creatingJob, setCreatingJob] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdJobModal, setCreatedJobModal] = useState<any | null>(null);

  // Cancel Job State
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['my_jobs', 'create', 'my_tasks'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isEnabled) return;

    // Load categories
    api
      .get('/micro-jobs/categories')
      .then((res: any) => {
        const data = res?.data || res;
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0 && !createForm.categoryId) {
            setCreateForm((prev) => ({ ...prev, categoryId: data[0].id }));
          }
        }
      })
      .catch(() => {});
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    if (activeTab === 'my_jobs') {
      fetchMyPostedJobs();
    } else if (activeTab === 'my_tasks') {
      fetchMyTasks();
    }
  }, [activeTab, isEnabled]);

  const fetchMyPostedJobs = async () => {
    setLoadingJobs(true);
    try {
      const res: any = await api.get('/micro-jobs/my/posted');
      const data = res?.data || res;
      if (Array.isArray(data)) setMyJobs(data);
    } catch (err) {
      console.error('Failed to load my posted jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchMyTasks = async () => {
    setLoadingTasks(true);
    try {
      const res: any = await api.get('/micro-jobs/my/tasks');
      const data = res?.data || res;
      if (data?.submissions) setMyTasks(data.submissions);
      if (data?.stats) setTaskStats(data.stats);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleOpenSubmissions = async (job: any) => {
    setSelectedJobForSubmissions(job);
    setLoadingSubmissions(true);
    try {
      const res: any = await api.get(`/micro-jobs/${job.id}/submissions`);
      const data = res?.data || res;
      if (Array.isArray(data)) setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleReviewSubmission = async (submissionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setReviewingId(submissionId);
    try {
      await api.patch(`/micro-jobs/submissions/${submissionId}/review`, {
        action,
        rejectReason: reason,
      });

      // Update state locally
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', rejectReason: reason }
            : s,
        ),
      );

      // Refresh job counts
      fetchMyPostedJobs();
      if (rejectModalSub?.id === submissionId) {
        setRejectModalSub(null);
        setRejectReason('');
      }
    } catch (err: any) {
      console.error('Review failed:', err);
      alert(err?.response?.data?.message || 'রিভিউ সম্পন্ন করা যায়নি');
    } finally {
      setReviewingId(null);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই কাজটি বাতিল করতে চান? বাকি স্লটের টাকা আপনার ওয়ালেটে ফেরত দেওয়া হবে।' : 'Are you sure you want to cancel this job? Unused budget will be refunded to your wallet.')) {
      return;
    }

    setCancelling(true);
    try {
      const res: any = await api.patch(`/micro-jobs/${jobId}/cancel`, {});
      const data = res?.data || res;
      alert(
        lang === 'bn'
          ? `কাজটি বাতিল করা হয়েছে। আপনার ওয়ালেটে ৳${Number(data.refundAmount || 0).toFixed(2)} টাকা ফেরত দেওয়া হয়েছে!`
          : `Job cancelled. ৳${Number(data.refundAmount || 0).toFixed(2)} has been refunded to your wallet!`,
      );
      if (refreshMe) refreshMe();
      fetchMyPostedJobs();
    } catch (err: any) {
      console.error('Cancel job failed:', err);
      alert(err?.response?.data?.message || 'কাজটি বাতিল করা যায়নি');
    } finally {
      setCancelling(false);
      setCancellingJobId(null);
    }
  };

  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const handleToggleJobStatus = async (jobId: string) => {
    setTogglingJobId(jobId);
    try {
      const res: any = await api.patch(`/micro-jobs/${jobId}/toggle-status`, {});
      const data = res?.data || res;
      alert(data?.message || (lang === 'bn' ? 'স্ট্যাটাস আপডেট করা হয়েছে' : 'Status updated successfully'));
      fetchMyPostedJobs();
    } catch (err: any) {
      console.error('Toggle status failed:', err);
      alert(err?.response?.data?.message || (lang === 'bn' ? 'স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি' : 'Failed to change status'));
    } finally {
      setTogglingJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (
      !confirm(
        lang === 'bn'
          ? 'আপনি কি নিশ্চিত যে এই কাজটি সম্পূর্ণরূপে ডিলিট করতে চান? যদি কাজটি চলমান বা পজ করা থাকে, তবে বাকি স্লটের টাকা আপনার ওয়ালেটে রিফান্ড করা হবে।'
          : 'Are you sure you want to delete this job? Any unfulfilled budget will be refunded to your wallet.',
      )
    ) {
      return;
    }

    setDeletingJobId(jobId);
    try {
      const res: any = await api.delete(`/micro-jobs/${jobId}`);
      const data = res?.data || res;
      alert(data?.message || (lang === 'bn' ? 'কাজটি সফলভাবে ডিলিট করা হয়েছে' : 'Job deleted successfully'));
      if (refreshMe) refreshMe();
      fetchMyPostedJobs();
    } catch (err: any) {
      console.error('Delete job failed:', err);
      alert(err?.response?.data?.message || (lang === 'bn' ? 'কাজটি ডিলিট করা সম্ভব হয়নি' : 'Failed to delete job'));
    } finally {
      setDeletingJobId(null);
    }
  };

  // Job Creation Steps management
  const addStep = () => setCreateForm((prev) => ({ ...prev, steps: [...prev.steps, ''] }));
  const removeStep = (index: number) =>
    setCreateForm((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
  const updateStep = (index: number, val: string) =>
    setCreateForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? val : s)),
    }));

  // Job Creation Proof management
  const addProof = () => setCreateForm((prev) => ({ ...prev, proofRequirements: [...prev.proofRequirements, ''] }));
  const removeProof = (index: number) =>
    setCreateForm((prev) => ({ ...prev, proofRequirements: prev.proofRequirements.filter((_, i) => i !== index) }));
  const updateProof = (index: number, val: string) =>
    setCreateForm((prev) => ({
      ...prev,
      proofRequirements: prev.proofRequirements.map((p, i) => (i === index ? val : p)),
    }));

  // Budget Calculation
  const workerReward = Math.max(0, Number(createForm.rewardPerWorker || 0));
  const workersCount = Math.max(1, Number(createForm.totalWorkersNeeded || 1));
  const workerBudget = workerReward * workersCount;
  const platformFeePercent = Number(settings.microJob?.platformFeePercent ?? 5);
  const platformFee = (workerBudget * platformFeePercent) / 100;
  const totalCost = workerBudget + platformFee;
  const userBalance = Number(user?.wallet?.availableBalance || 0);
  const isBalanceSufficient = userBalance >= totalCost;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      setCreateError(lang === 'bn' ? 'কাজের শিরোনাম দিন' : 'Enter job title');
      return;
    }
    if (!createForm.categoryId) {
      setCreateError(lang === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select a category');
      return;
    }
    if (!isBalanceSufficient) {
      setCreateError(lang === 'bn' ? 'আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। রিচার্জ করুন।' : 'Insufficient wallet balance. Please recharge.');
      return;
    }

    setCreatingJob(true);
    setCreateError('');
    try {
      const res: any = await api.post('/micro-jobs', {
        categoryId: createForm.categoryId,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        steps: createForm.steps.filter((s) => s.trim() !== ''),
        proofRequirements: createForm.proofRequirements.filter((p) => p.trim() !== ''),
        rewardPerWorker: workerReward,
        totalWorkersNeeded: workersCount,
        minKycRequired: createForm.minKycRequired,
      });

      const newJob = res?.data || res;
      setCreatedJobModal(newJob);
      setCreateSuccess(true);
      if (refreshMe) refreshMe();
      fetchMyPostedJobs();

      // Reset create form
      setCreateForm({
        categoryId: '',
        title: '',
        description: '',
        steps: [''],
        proofRequirements: [''],
        rewardPerWorker: settings.microJob?.minJobReward || 2,
        totalWorkersNeeded: 10,
        minKycRequired: false,
      });
    } catch (err: any) {
      console.error('Job creation failed:', err);
      setCreateError(err?.response?.data?.message || 'কাজ পোস্ট করা সম্ভব হয়নি');
    } finally {
      setCreatingJob(false);
    }
  };

  // If disabled by Admin
  if (!isEnabled) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-10">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {lang === 'bn' ? 'মাইক্রো জব সার্ভিসটি বর্তমানে বন্ধ আছে' : 'Micro Job service is currently disabled'}
        </h2>
        <p className="text-xs text-slate-500">
          {lang === 'bn'
            ? 'এডমিনিস্ট্রেটর কর্তৃক এই সার্ভিসটি সাময়িকভাবে নিষ্ক্রিয় রাখা হয়েছে।'
            : 'This feature is temporarily disabled by administrator.'}
        </p>
        <Link href="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs">
          {lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{lang === 'bn' ? 'মাইক্রো জব ড্যাশবোর্ড' : 'Micro Jobs Hub'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'কাজ দিন, কর্মীদের প্রুফ যাচাই করে এক ক্লিকে পেমেন্ট করুন অথবা নিজে কাজ করে টাকা আয় করুন।'
                : 'Post tasks, review worker proofs & release escrow, or work and earn.'}
            </p>
          </div>
        </div>

        {/* Action Button & Balance */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">{lang === 'bn' ? 'ওয়ালেট ব্যালেন্স' : 'Available Balance'}</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              ৳ {userBalance.toFixed(2)}
            </span>
          </div>

          <Link
            href="/micro-jobs"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            <span>{lang === 'bn' ? 'কাজের বাজার ব্রাউজ' : 'Browse All Jobs'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('my_jobs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition flex-shrink-0 whitespace-nowrap ${
            activeTab === 'my_jobs'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>{lang === 'bn' ? 'আমার পোস্ট করা কাজ' : 'My Posted Tasks'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition flex-shrink-0 whitespace-nowrap ${
            activeTab === 'create'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন কাজ দিন' : 'Create Task'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_tasks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition flex-shrink-0 whitespace-nowrap ${
            activeTab === 'my_tasks'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{lang === 'bn' ? 'আমার কাজ ও আয়' : 'My Submissions & Earnings'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY POSTED JOBS                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'my_jobs' && (
        <div className="space-y-4">
          {loadingJobs ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            </div>
          ) : myJobs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {lang === 'bn' ? 'আপনি এখনো কোনো কাজ পোস্ট করেননি' : 'You haven’t posted any tasks yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === 'bn'
                  ? 'আপনার ইউটিউব চ্যানেল, ফেসবুক পেজ বা অ্যাপ প্রচারের জন্য কয়েক মিনিটেই কাজ পোস্ট করতে পারেন।'
                  : 'Get thousands of real users to complete actions for your website, app, or channel.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
              >
                {lang === 'bn' ? 'এখনই কাজ পোস্ট করুন' : 'Post a Job Now'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myJobs.map((job) => {
                const approved = Number(job.approvedCount || 0);
                const total = Number(job.totalWorkersNeeded || 1);
                const pending = Number(job.pendingCount || 0);
                const percent = Math.min(100, Math.round((approved / total) * 100));

                return (
                  <div
                    key={job.id}
                    className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {job.category?.name}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            job.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : job.status === 'PAUSED'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : job.status === 'COMPLETED'
                              ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}
                        >
                          {job.status === 'ACTIVE'
                            ? (lang === 'bn' ? 'সক্রিয়' : 'ACTIVE')
                            : job.status === 'PAUSED'
                            ? (lang === 'bn' ? 'নিষ্ক্রিয় (পজ)' : 'PAUSED')
                            : job.status === 'COMPLETED'
                            ? (lang === 'bn' ? 'সম্পন্ন' : 'COMPLETED')
                            : (lang === 'bn' ? 'বাতিল' : 'CANCELLED')}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {job.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>প্রতি কর্মীর রেট: ৳{Number(job.rewardPerWorker).toFixed(2)}</span>
                        <span>মোট খরচ: ৳{(Number(job.totalBudget) + Number(job.platformFee)).toFixed(2)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <span>
                            {approved} / {total} জন সম্পন্ন
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSubmissions(job)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>প্রমাণ দেখুন {pending > 0 && `(${pending})`}</span>
                      </button>

                      <Link
                        href={`/micro-jobs/${job.id}`}
                        target="_blank"
                        title={lang === 'bn' ? 'মার্কেটে লাইভ কাজটি দেখুন' : 'View live job in marketplace'}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {/* Active / Inactive (Pause/Play) Toggle */}
                      {(job.status === 'ACTIVE' || job.status === 'PAUSED') && (
                        <button
                          type="button"
                          onClick={() => handleToggleJobStatus(job.id)}
                          disabled={togglingJobId === job.id}
                          title={
                            job.status === 'ACTIVE'
                              ? (lang === 'bn' ? 'কাজটি সাময়িকভাবে বন্ধ রাখুন (Inactive)' : 'Pause Job')
                              : (lang === 'bn' ? 'কাজটি পুনরায় চালু করুন (Active)' : 'Resume Job')
                          }
                          className={`p-2 rounded-xl border transition text-xs font-bold ${
                            job.status === 'ACTIVE'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 border-amber-200 dark:border-amber-900/50'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border-emerald-200 dark:border-emerald-900/50'
                          }`}
                        >
                          {job.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Delete Job Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        disabled={deletingJobId === job.id}
                        title={lang === 'bn' ? 'কাজটি ডিলিট করুন (বাকি স্লটের টাকা ওয়ালেটে ফেরত আসবে)' : 'Delete Job (Refund unused slots)'}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 transition text-xs font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREATE MICRO JOB FORM                                              */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'নতুন মাইক্রো জব তৈরি করুন' : 'Create a Micro Task'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'bn'
                ? 'নির্দেশাবলী ও প্রুফ সেট করুন। পাবলিশ করার সাথে সাথে বাজেট আপনার ওয়ালেট থেকে এসক্রো লকে থাকবে।'
                : 'Specify steps and required proof. Total budget will be locked in escrow upon publishing.'}
            </p>
          </div>

          {createError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{lang === 'bn' ? 'কাজটি সফলভাবে পোস্ট হয়েছে!' : 'Job posted successfully!'}</span>
            </div>
          )}

          {/* Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন *' : 'Category *'}
              </label>
              <select
                value={createForm.categoryId}
                onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'কাজের শিরোনাম (Title) *' : 'Task Title *'}
              </label>
              <input
                type="text"
                placeholder={lang === 'bn' ? 'যেমন: YouTube Video Watch & Subscribe' : 'e.g. YouTube Video Watch & Subscribe'}
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {lang === 'bn' ? 'কাজের বিবরণ (Description) *' : 'Task Description *'}
            </label>
            <textarea
              rows={3}
              placeholder={lang === 'bn' ? 'কাজের বিস্তারিত বিবরণ লিখুন...' : 'Describe what the worker needs to know...'}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'ধাপভিত্তিক কাজের নিয়ম (Steps to Complete)' : 'Step-by-Step Instructions'}
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ ধাপ যোগ করুন' : '+ Add Step'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {createForm.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateStep(idx, e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? `ধাপ ${idx + 1}: যেমন: প্রথমে সার্চ বক্সে "SafnexBD" লিখে সার্চ করুন...`
                        : `Step ${idx + 1}: e.g. Search for the channel...`
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {createForm.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Proof Requirements */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'প্রমাণের জন্য যা যা দিতে হবে (Required Proofs)' : 'Required Proofs from Worker'}
              </label>
              <button
                type="button"
                onClick={addProof}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ প্রুফ যোগ করুন' : '+ Add Proof'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {createForm.proofRequirements.map((proof, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs text-slate-400 font-bold">•</span>
                  <input
                    type="text"
                    value={proof}
                    onChange={(e) => updateProof(idx, e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? `প্রমাণ ${idx + 1}: যেমন: আপনার ইউটিউব চ্যানেলের নাম লিখুন ও সাবস্ক্রাইবের স্ক্রিনশট দিন...`
                        : `Proof ${idx + 1}: e.g. Screenshot of subscription...`
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {createForm.proofRequirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProof(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Workers Count & Reward Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'কর্মী সংখ্যা (Workers Needed) *' : 'Number of Workers *'}
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={createForm.totalWorkersNeeded}
                onChange={(e) =>
                  setCreateForm({ ...createForm, totalWorkersNeeded: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'প্রতি কর্মীর পারিশ্রমিক (BDT) *' : 'Reward Per Worker (BDT) *'}
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={createForm.rewardPerWorker}
                onChange={(e) =>
                  setCreateForm({ ...createForm, rewardPerWorker: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Live Cost & Balance Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              {lang === 'bn' ? 'খরচের হিসাব ও ওয়ালেট স্ট্যাটাস' : 'Cost Breakdown & Escrow'}
            </h4>

            <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>
                  কর্মী বাজেট ({workersCount} জন × ৳{workerReward.toFixed(2)}):
                </span>
                <span className="font-bold">৳ {workerBudget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>প্ল্যাটফর্ম সার্ভিস ফি ({platformFeePercent}%):</span>
                <span>৳ {platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-amber-500/20 text-sm font-black text-slate-900 dark:text-white">
                <span>সর্বমোট খরচ (Total Payable):</span>
                <span className="text-amber-600 dark:text-amber-400">৳ {totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-500/20 text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                আপনার বর্তমান ওয়ালেট ব্যালেন্স: <strong className="text-slate-900 dark:text-white">৳ {userBalance.toFixed(2)}</strong>
              </span>
              {!isBalanceSufficient && (
                <Link
                  href="/dashboard/wallet"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ওয়ালেট রিচার্জ করুন' : 'Recharge Wallet'}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={creatingJob || !isBalanceSufficient}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2"
            >
              {creatingJob && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{lang === 'bn' ? 'পাবলিশ করুন ও বাজেট লক করুন' : 'Publish Job & Lock Escrow'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY SUBMISSIONS & EARNINGS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'my_tasks' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">{lang === 'bn' ? 'মোট উপার্জন' : 'Total Earned'}</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ৳ {Number(taskStats.totalEarned || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">{lang === 'bn' ? 'অনুমোদিত কাজ' : 'Approved Tasks'}</span>
              <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
                {taskStats.approvedCount || 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">{lang === 'bn' ? 'রিভিউ পেন্ডিং' : 'Pending Review'}</span>
              <span className="text-xl sm:text-2xl font-black text-amber-500">
                {taskStats.pendingCount || 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] text-slate-400 font-semibold block">{lang === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}</span>
              <span className="text-xl sm:text-2xl font-black text-rose-500">
                {taskStats.rejectedCount || 0}
              </span>
            </div>
          </div>

          {/* Tasks Table/List */}
          {loadingTasks ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            </div>
          ) : myTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {lang === 'bn' ? 'আপনি এখনো কোনো কাজ জমা দেননি' : 'You haven’t submitted any tasks yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === 'bn' ? 'কাজের বাজারে যান এবং ছোট ছোট টাস্ক করে আজই টাকা আয় শুরু করুন।' : 'Browse tasks and complete simple actions to start earning today.'}
              </p>
              <Link
                href="/micro-jobs"
                className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
              >
                {lang === 'bn' ? 'কাজের তালিকা দেখুন' : 'Browse Available Tasks'}
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">কাজের নাম</th>
                      <th className="py-3.5 px-4 font-bold">পারিশ্রমিক</th>
                      <th className="py-3.5 px-4 font-bold">জমা দেওয়ার সময়</th>
                      <th className="py-3.5 px-4 font-bold">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {myTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4">
                          <Link href={`/micro-jobs/${t.jobId}`} className="font-bold text-slate-900 dark:text-white hover:text-amber-500 transition">
                            {t.job?.title}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                          ৳ {Number(t.job?.rewardPerWorker || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              t.status === 'APPROVED'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : t.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}
                          >
                            {t.status === 'APPROVED'
                              ? 'অনুমোদিত'
                              : t.status === 'REJECTED'
                              ? 'প্রত্যাখ্যাত'
                              : 'পেন্ডিং'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROOF REVIEW MODAL (EMPLOYER VIEW)                                       */}
      {/* ========================================================================= */}
      {selectedJobForSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  <span>জমা পড়া প্রুফ ও কাজের প্রমাণ</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                  {selectedJobForSubmissions.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForSubmissions(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submissions List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingSubmissions ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  এখনো কোনো কর্মী এই কাজের প্রমাণ জমা দেয়নি।
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    {/* Worker Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                          {sub.worker?.firstName?.[0] || 'W'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {sub.worker?.firstName} {sub.worker?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">@{sub.worker?.uniqueUserId}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : sub.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {sub.status === 'APPROVED'
                          ? 'অনুমোদিত'
                          : sub.status === 'REJECTED'
                          ? 'বাতিল'
                          : 'অপেক্ষমাণ (পেন্ডিং)'}
                      </span>
                    </div>

                    {/* Text Proof */}
                    {sub.proofText && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-400 block mb-1">লিখিত বিবরণ:</span>
                        {sub.proofText}
                      </div>
                    )}

                    {/* Screenshot Thumbnails (Click for Fullscreen Zoom!) */}
                    {Array.isArray(sub.proofScreenshots) && sub.proofScreenshots.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400">স্ক্রিনশট (বড় করে দেখতে ক্লিক করুন):</span>
                        <div className="flex flex-wrap gap-2.5">
                          {sub.proofScreenshots.map((url: string, idx: number) => (
                            <div
                              key={idx}
                              onClick={() => setZoomedImage(url)}
                              className="relative w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-zoom-in group"
                            >
                              <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons if SUBMITTED */}
                    {sub.status === 'SUBMITTED' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setRejectModalSub(sub)}
                          disabled={reviewingId === sub.id}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition"
                        >
                          ❌ বাতিল করুন
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewSubmission(sub.id, 'APPROVE')}
                          disabled={reviewingId === sub.id}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
                        >
                          {reviewingId === sub.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>✅ অনুমোদন করুন (টাকা রিলিজ)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT REASON MODAL                                                       */}
      {/* ========================================================================= */}
      {rejectModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              বাতিলের কারণ উল্লেখ করুন
            </h3>
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
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleReviewSubmission(rejectModalSub.id, 'REJECT', rejectReason)}
                disabled={reviewingId === rejectModalSub.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                বাতিল নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN LIGHTBOX / ZOOM MODAL                                          */}
      {/* ========================================================================= */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl">
            <img src={zoomedImage} alt="Zoomed proof" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* JOB CREATION SUCCESS MODAL                                                */}
      {/* ========================================================================= */}
      {createdJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {lang === 'bn' ? '🎉 অভিনন্দন! কাজটি সফলভাবে পোস্ট হয়েছে!' : '🎉 Success! Job Posted Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'আপনার কাজটি এখন পাবলিক মাইক্রো জব মার্কেটপ্লেসে সরাসরি লাইভ রয়েছে। কর্মীরা কাজ সম্পন্ন করে প্রুফ জমা দিলে আপনি এখানে দেখতে ও রিভিউ করতে পারবেন।'
                  : 'Your job is now live on the public marketplace. You can review worker submissions right here.'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-left space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {lang === 'bn' ? 'কাজের শিরোনাম' : 'Job Title'}
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {createdJobModal.title}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <Link
                href={`/micro-jobs/${createdJobModal.id}`}
                target="_blank"
                onClick={() => {
                  setCreatedJobModal(null);
                  setActiveTab('my_jobs');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{lang === 'bn' ? '🌐 সরাসরি কাজটি দেখুন' : 'View Live Job'}</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCreatedJobModal(null);
                  setActiveTab('my_jobs');
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
              >
                {lang === 'bn' ? '📋 আমার কাজের তালিকায় যান' : 'Go to My Posted Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
