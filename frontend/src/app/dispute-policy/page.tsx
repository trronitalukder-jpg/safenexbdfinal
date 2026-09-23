'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FileText, ArrowLeft, Calendar, ShieldCheck, RefreshCw, AlertCircle, Scale, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function DisputePolicyPage() {
  const router = useRouter();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cms/pages/dispute-policy')
      .then((res) => {
        const data = unwrap(res);
        if (data && data.title) {
          setPage(data);
        }
      })
      .catch((err) => {
        console.warn('Dispute policy not in CMS yet, using fallback default content:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-medium">Loading Dispute Policy...</p>
      </div>
    );
  }

  // Fallback default dispute policy if not yet saved in DB
  const displayTitle = page?.title || 'SafnexBD Dispute Policy (বিরোধ নিষ্পত্তি নীতিমালা)';
  const displayContent = page?.contentHtml || `
    <h2>SafnexBD এসক্রো বিরোধ নিষ্পত্তি নীতিমালা (Dispute Policy)</h2>
    <p>SafnexBD-তে যেকোনো লেনদেনে ক্রেতা ও বিক্রেতার শতভাগ আর্থিক নিরাপত্তা নিশ্চিত করতে আমাদের নিজস্ব এসক্রো প্রটোকল এবং নিরপেক্ষ বিরোধ নিষ্পত্তি টিম কাজ করে।</p>
    
    <h3>১. কখন বিরোধ (Dispute) দায়ের করা যাবে?</h3>
    <ul>
      <li><strong>অর্ডার অমিল বা ভুল পণ্য:</strong> বিক্রেতা প্রতিশ্রুত পণ্যের বিবরণ অনুযায়ী সঠিক ডেলিভারি না দিলে।</li>
      <li><strong>এক্সেস বা লগইন ত্রুটি:</strong> ডিজিটাল অ্যাকাউন্টের ক্ষেত্রে পাসওয়ার্ড বা ক্রেডেনশিয়াল কাজ না করলে বা ভুল প্রমাণিত হলে।</li>
      <li><strong>নির্ধারিত সময়ে ডেলিভারি না হওয়া:</strong> বিক্রেতা চুক্তিবদ্ধ সময়ের মধ্যে পণ্য/সেবা প্রদান করতে ব্যর্থ হলে।</li>
      <li><strong>বিক্রেতার অস্বীকৃতি বা প্রতারণা:</strong> পেমেন্ট প্রাপ্তির পর যোগাযোগ বন্ধ করে দিলে।</li>
    </ul>

    <h3>২. বিরোধ দায়েরের সময়সীমা (Dispute Window)</h3>
    <p>পণ্য ডেলিভারির নোটিফিকেশন পাওয়ার পর ক্রেতার কাছে <strong>সর্বোচ্চ ২৪ ঘণ্টা</strong> সময় থাকবে পণ্য পরীক্ষা করে দেখার জন্য। এই ২৪ ঘণ্টার মধ্যে কোনো ত্রুটি দেখা দিলে সরাসরি ট্রানজ্যাকশন পেজ থেকে <em>"Raise Dispute"</em> বাটনে ক্লিক করে বিরোধ ফাইল করতে হবে। ২৪ ঘণ্টার পর স্বয়ংক্রিয়ভাবে বিক্রেতার কাছে অর্থ ছাড় হয়ে যেতে পারে।</p>

    <h3>৩. প্রয়োজনীয় প্রমাণাদি (Evidence Requirements)</h3>
    <p>বিরোধ দাখিলের সময় উভয় পক্ষকেই স্বচ্ছ প্রমাণ উপস্থাপন করতে হবে:</p>
    <ul>
      <li>লগইন করার চেষ্টা বা ত্রুটির অপরিবর্তিত স্ক্রিনশট বা স্ক্রিন রেকর্ডিং ভিডিও।</li>
      <li>SafnexBD প্ল্যাটফর্মের ভেতরের চ্যাট হিস্ট্রি।</li>
      <li>ডিজিটাল কোড বা ইনভয়েস নম্বর।</li>
    </ul>

    <h3>৪. অ্যাডমিন টিমের সিদ্ধান্ত ও আপোষ</h3>
    <p>আমাদের ডেডিকেটেড ডিসপ্যুট অ্যাডমিন টিম (Dispute Admin) ২৪ থেকে ৪৮ ঘণ্টার মধ্যে উভয় পক্ষের প্রমাণ পর্যালোচনা করে চূড়ান্ত রায় দেবে। রায় অনুযায়ী অর্থ ক্রেতাকে রিফান্ড (Refund) করা হবে অথবা বিক্রেতাকে রিলিজ (Release) করা হবে। অ্যাডমিনের সিদ্ধান্তই চূড়ান্ত বলে গণ্য হবে।</p>
  `;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition font-medium">Home</Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold">{displayTitle}</span>
      </div>

      {/* Page Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Official Trust & Escrow Protection Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {displayTitle}
        </h1>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span suppressHydrationWarning>Updated: {page?.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : 'Live Platform Standard'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Escrow Terms</span>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-lg dark:shadow-2xl">
        <div
          className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{
            __html: typeof window !== 'undefined' ? DOMPurify.sanitize(displayContent || '') : (displayContent || ''),
          }}
        />
      </div>

      {/* Help & Escrow Protection Box */}
      <div className="p-6 rounded-3xl bg-sky-50/80 dark:bg-slate-900/90 border border-sky-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">লেনদেনে কোনো সমস্যা হচ্ছে?</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">আমাদের ২৪/৭ সাপোর্ট টিম ও অ্যাডমিন কলিং সার্ভিস আপনার সহযোগিতায় নিয়োজিত।</div>
          </div>
        </div>
        <Link
          href="/dashboard/chat"
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-sky-500/20 whitespace-nowrap"
        >
          সাপোর্ট টিমের সাথে চ্যাট করুন
        </Link>
      </div>

      {/* Trust Footer */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="font-medium">SafnexBD Escrow & Verified Trading Platform</span>
        </div>
        <button
          onClick={() => router.back()}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>
    </main>
  );
}

