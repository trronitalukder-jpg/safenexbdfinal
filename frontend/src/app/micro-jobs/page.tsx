'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  Flame,
  Check,
  ShieldCheck,
} from 'lucide-react';

export default function MicroJobsPublicPage() {
  const { lang, t } = useLanguage();
  const { settings } = useSettings();
  const { user } = useAuthStore();

  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'reward_high' | 'reward_low'>('newest');

  const isEnabled = settings.microJob?.enabled !== false;

  useEffect(() => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }

    // Fetch categories
    api
      .get('/micro-jobs/categories')
      .then((res: any) => {
        const data = res?.data || res;
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});

    fetchJobs();
  }, [isEnabled, selectedCat, sortBy]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCat) params.append('categoryId', selectedCat);
      if (search.trim()) params.append('search', search.trim());
      if (sortBy) params.append('sort', sortBy);

      const res: any = await api.get(`/micro-jobs?${params.toString()}`);
      const data = res?.data || res;
      if (data?.items) {
        setJobs(data.items);
      }
    } catch (err) {
      console.error('Failed to load micro jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  // If feature is disabled by Super Admin
  if (!isEnabled) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          {lang === 'bn'
            ? 'মাইক্রো জব সার্ভিসটি বর্তমানে সাময়িকভাবে বন্ধ আছে'
            : 'Micro Job Service is Currently Unavailable'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {lang === 'bn'
            ? 'সিস্টেম মেইনটেন্যান্স বা এডমিন আপডেটের কারণে এই ফিচারটি সাময়িকভাবে নিষ্ক্রিয় রাখা হয়েছে। দয়া করে পরবর্তীতে আবার চেষ্টা করুন।'
            : 'This feature has been temporarily disabled by administrator for updates. Please check back later.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition"
        >
          {lang === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-500/10 via-sky-500/5 to-indigo-500/10 border border-amber-500/20 dark:border-amber-500/10 p-6 sm:p-10 overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{lang === 'bn' ? 'টাস্ক মার্কেটপ্লেস ও মাইক্রো ইনকাম' : 'Micro Task & Instant Earn Marketplace'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? (
              <>
                ছোট ছোট কাজ সম্পন্ন করে আয় করুন অথবা <br className="hidden sm:inline" />
                <span className="text-amber-600 dark:text-amber-400">নিজে কাজ দিয়ে দ্রুত ফলাফল নিন</span>
              </>
            ) : (
              <>
                Complete small tasks to earn money or <br className="hidden sm:inline" />
                <span className="text-amber-600 dark:text-amber-400">Post jobs and get fast results</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {lang === 'bn'
              ? 'ইউটিউব, ফেসবুক, টেলিগ্রাম, অ্যাপ রিভিউ সহ শত শত নিরাপদ টাস্ক। কাজ শেষে প্রমাণ জমা দিলেই সরাসরি আপনার SafnexBD ওয়ালেটে টাকা যুক্ত হবে।'
              : 'YouTube, Facebook, Telegram, App reviews and hundreds of verified tasks. Submit proof and get paid directly to your SafnexBD wallet.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/dashboard/micro-jobs?tab=create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নতুন কাজ পোস্ট করুন' : 'Post a Micro Job'}</span>
            </Link>
            {user && (
              <Link
                href="/dashboard/micro-jobs?tab=my_tasks"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-500 font-bold text-xs shadow-xs transition"
              >
                <span>{lang === 'bn' ? 'আমার করা কাজ ও আয়' : 'My Tasks & Earnings'}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Decorative corner icon */}
        <div className="absolute right-6 -bottom-6 opacity-10 dark:opacity-5 pointer-events-none hidden md:block">
          <Briefcase className="w-64 h-64 text-amber-600" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'কাজের নাম বা বিবরণ খুঁজুন...' : 'Search tasks by title...'}
            className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1 top-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg transition"
          >
            {lang === 'bn' ? 'খুঁজুন' : 'Search'}
          </button>
        </form>

        {/* Sort & Quick Filter */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-400 font-medium">
              {lang === 'bn' ? 'সাজান:' : 'Sort:'}
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">{lang === 'bn' ? 'সর্বশেষ কাজ' : 'Newest First'}</option>
              <option value="reward_high">{lang === 'bn' ? 'বেশি টাকা' : 'Highest Reward'}</option>
              <option value="reward_low">{lang === 'bn' ? 'কম টাকা' : 'Lowest Reward'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCat('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 border ${
              selectedCat === ''
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            {lang === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCat(c.id === selectedCat ? '' : c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 border ${
                selectedCat === c.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {lang === 'bn' ? 'বর্তমানে কোনো কাজ পাওয়া যায়নি' : 'No micro jobs found right now'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {lang === 'bn'
              ? 'আপনি কি নিজের ইউটিউব, ফেসবুক বা অ্যাপের জন্য কাজ করাতে চান? এখনই কাজ পোস্ট করুন!'
              : 'Looking to get tasks completed? Post your micro job now and reach thousands of workers!'}
          </p>
          <Link
            href="/dashboard/micro-jobs?tab=create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'bn' ? 'প্রথম কাজটি পোস্ট করুন' : 'Post the First Task'}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {jobs.map((job) => {
            const completed = Number(job.approvedCount || 0);
            const total = Number(job.totalWorkersNeeded || 1);
            const percent = Math.min(100, Math.round((completed / total) * 100));

            return (
              <div
                key={job.id}
                className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 p-4 transition-all duration-200 shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 truncate">
                      {job.category?.name || 'General'}
                    </span>
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex-shrink-0">
                      ৳ {Number(job.rewardPerWorker).toFixed(2)}
                    </span>
                  </div>

                  {/* Job Title */}
                  <Link href={`/micro-jobs/${job.id}`}>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {job.title}
                    </h3>
                  </Link>

                  {/* Employer */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                      {job.employer?.firstName?.[0] || 'U'}
                    </div>
                    <span className="truncate">{job.employer?.firstName} {job.employer?.lastName}</span>
                    {job.employer?.isVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Progress & Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-3 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{completed} / {total} জন সম্পন্ন</span>
                      </span>
                      <span>{percent}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/micro-jobs/${job.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 font-bold text-xs transition shadow-2xs group-hover:bg-amber-500 group-hover:text-slate-950"
                  >
                    <span>{lang === 'bn' ? 'কাজটি দেখুন' : 'View Task'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
