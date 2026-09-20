'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
  BookOpen,
  Code2,
  KeyRound,
  ShieldCheck,
  Globe,
  Server,
  Layers,
  Zap,
  Activity,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sliders,
  Settings,
  Users,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  PhoneCall,
  RefreshCw,
  Terminal,
  Cpu,
  FileCode,
  Sparkles,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

function AdminDocsContent() {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  // Primary tab: 'api' or 'workload'
  const initialTab = searchParams.get('tab') === 'workload' ? 'workload' : 'api';
  const [activeMainTab, setActiveMainTab] = useState<'api' | 'workload'>(initialTab);

  // Sub-tabs for API Guide
  const [apiPlatformTab, setApiPlatformTab] = useState<'nextjs' | 'nestjs' | 'wordpress' | 'react' | 'curl'>('nextjs');

  // Sub-tabs for Workload Guide
  const [workloadRoleTab, setWorkloadRoleTab] = useState<'admin' | 'staff' | 'algorithms' | 'faq'>('admin');

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'workload' || tabParam === 'api') {
      setActiveMainTab(tabParam);
    }
  }, [searchParams]);

  const copyToClipboard = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>অ্যাডমিন ও ডেভেলপার নলেজবেজ (System Documentation)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            ইনস্ট্রাকশন ও ইন্টিগ্রেশন ম্যানুয়াল
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            মার্চেন্ট এপিআই (API) সেটআপ ও পার্টনার ইন্টিগ্রেশন এবং মাল্টি-স্টাফ ওয়ার্কলোড ব্যালান্সিং ইঞ্জিনের সম্পূর্ণ A to Z নির্দেশিকা।
          </p>
        </div>

        {/* Quick Jump Tab Switcher */}
        <div className="relative z-10 mt-6 flex flex-wrap gap-3 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveMainTab('api')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm ${
              activeMainTab === 'api'
                ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-400/50'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>১. পার্টনার এপিআই ইন্টিগ্রেশন ম্যানুয়াল (Partner API Setup)</span>
          </button>
          <button
            onClick={() => setActiveMainTab('workload')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm ${
              activeMainTab === 'workload'
                ? 'bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>২. মাল্টি-স্টাফ ও ওয়ার্কলোড ব্যালান্সিং গাইড (Operations Engine)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PARTNER API SETUP & INTEGRATION MANUAL                         */}
      {/* ========================================================================= */}
      {activeMainTab === 'api' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Context & Nav Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-500" />
                মার্চেন্ট ও পার্টনার এপিআই আর্কিটেকচার
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                পার্টনার বা মার্চেন্ট ওয়েবসাইটে SafnexBD ওয়ালেট ও এসক্রো পেমেন্ট গেটওয়ে যুক্ত করার প্রসেস।
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/partners"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition"
              >
                <span>মার্চেন্ট অ্যাপ পেজ খুলুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Super Admin & Partner Workflow Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Super Admin Responsibilities */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    সুপার অ্যাডমিন কী করবে? (Super Admin Steps)
                  </h3>
                  <p className="text-xs text-slate-500">অ্যাডমিন প্যানেল থেকে পার্টনার অ্যাপ তৈরি ও ক্রেডেনশিয়াল প্রদান</p>
                </div>
              </div>

              <ol className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold shrink-0 text-[11px]">
                    ১
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">নতুন পার্টনার অ্যাপ তৈরি করুন:</strong>{' '}
                    অ্যাডমিন প্যানেলের <Link href="/admin/partners" className="text-sky-500 underline">Partners</Link> পেজে যান এবং <strong>&quot;নতুন পার্টনার অ্যাপ যুক্ত করুন&quot;</strong> বাটনে ক্লিক করুন। অ্যাপের নাম ও বর্ণনা দিন।
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold shrink-0 text-[11px]">
                    ২
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Allowed Domains (CORS ডোমেন) দিন:</strong>{' '}
                    মার্চেন্টের আসল ডোমেইন দিন (যেমন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sky-600">https://store.com, https://app.store.com</code>)। এটি অন্য কোনো ওয়েবসাইট থেকে ভুয়া রিকোয়েস্ট ব্লক করে।
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold shrink-0 text-[11px]">
                    ৩
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">API Key ও Secret Key মার্চেন্টকে দিন:</strong>{' '}
                    অ্যাপ তৈরি হলে <code className="text-purple-600 font-mono">App ID</code>, <code className="text-purple-600 font-mono">API Key</code>, এবং <code className="text-purple-600 font-mono">API Secret</code> জেনারেট হবে। <strong>Secret Key অত্যন্ত নিরাপদ রাখতে হবে</strong>, এটি কখনোই কোনো ব্রাউজার সাইড JS-এ প্রকাশ করা যাবে না।
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold shrink-0 text-[11px]">
                    ৪
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Webhook URL টেস্ট করুন:</strong>{' '}
                    মার্চেন্টের ব্যাকএন্ড ওয়েব হুক ইউআরএল (যেমন: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">https://store.com/api/safnex/webhook</code>) দেওয়ার পর <strong>&quot;টেস্ট পিং&quot;</strong> বাটনে ক্লিক করে কানেক্টিভিটি নিশ্চিত করুন।
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold shrink-0 text-[11px]">
                    ৫
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Live vs Sandbox মোড:</strong>{' '}
                    টেস্টিং শেষ হলে টগল দিয়ে <strong>LIVE</strong> মোড চালু করে দিন। প্রয়োজন হলে যেকোনো সময় <strong>&quot;Regenerate Secret&quot;</strong> বাটনে ক্লিক করে সিক্রেট কি রিসেট করা যাবে।
                  </div>
                </li>
              </ol>
            </div>

            {/* Partner / Merchant Responsibilities */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    মার্চেন্ট / পার্টনার কী করবে? (Partner Integration Flow)
                  </h3>
                  <p className="text-xs text-slate-500">পার্টনার সাইট থেকে এপিআই কল ও ওয়েব হুক ভেরিফিকেশন</p>
                </div>
              </div>

              <ol className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold shrink-0 text-[11px]">
                    ১
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">সার্ভার এনভায়রনমেন্ট কনফিগারেশন:</strong>{' '}
                    সুপার অ্যাডমিনের থেকে প্রাপ্ত কিগুলো মার্চেন্ট তাদের সার্ভার <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-amber-600">.env</code> ফাইলে সংরক্ষণ করবে:
                    <div className="mt-1.5 p-2 bg-slate-950 text-slate-300 font-mono text-[11px] rounded-lg">
                      SAFNEX_BASE_URL=https://safnexbd.com/api/v1<br />
                      SAFNEX_APP_ID=app_xxxxxxxx<br />
                      SAFNEX_API_KEY=key_xxxxxxxx<br />
                      SAFNEX_API_SECRET=sec_xxxxxxxx
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold shrink-0 text-[11px]">
                    ২
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">ইউজার সেশন তৈরি (Session Token):</strong>{' '}
                    মার্চেন্টের লগইন করা ইউজারের জন্য মার্চেন্ট ব্যাকএন্ড থেকে <code className="text-sky-600 font-mono">POST /partner/auth/session</code> অ্যান্ডপয়েন্টে কল করে ওয়ান-টাইম সেশন টোকেন গ্রহণ করতে হবে।
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold shrink-0 text-[11px]">
                    ৩
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">উইজেট ইনিশিয়ালাইজ অথবা রিডাইরেক্ট:</strong>{' '}
                    টোকেনটি ফ্রন্টএন্ডে পাঠিয়ে SafnexBD SDK ইনিশিয়ালাইজ করতে পারে অথবা চেকআউটের জন্য সরাসরি SafnexBD পেমেন্ট গেটওয়েতে রিডাইরেক্ট করতে পারে।
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold shrink-0 text-[11px]">
                    ৪
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Webhook সিগনেচার ভেরিফিকেশন:</strong>{' '}
                    পেমেন্ট সফল বা ব্যর্থ হলে SafnexBD মার্চেন্টের ওয়েব হুক ইউআরএলে কল করবে। মার্চেন্ট <code className="text-amber-500 font-mono">x-safnex-signature</code> যাচাই করে ডাটাবেজে অর্ডার স্ট্যাটাস পেইড মার্ক করবে।
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Technology-Specific Code Implementations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <FileCode className="w-6 h-6 text-indigo-500" />
                  প্ল্যাটফর্ম অনুযায়ী সম্পূর্ণ ইন্টিগ্রেশন কোড (Framework Implementation)
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  মার্চেন্টের টেকনোলজি অনুযায়ী নিচের ট্যাব থেকে রেডিমেড কোড কপি করে প্রজেক্টে বসিয়ে দিন।
                </p>
              </div>

              {/* Platform Selector Buttons */}
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                {[
                  { id: 'nextjs', label: 'Next.js (App Router)' },
                  { id: 'nestjs', label: 'NestJS / Node.js' },
                  { id: 'wordpress', label: 'WordPress / WooCommerce' },
                  { id: 'react', label: 'React.js (SPA)' },
                  { id: 'curl', label: 'cURL & REST API' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setApiPlatformTab(item.id as any)}
                    className={`px-3 py-2 rounded-xl transition ${
                      apiPlatformTab === item.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: NEXT.JS */}
            {apiPlatformTab === 'nextjs' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    Next.js 13/14/15 App Router সাপোর্টেড: এটি সম্পূর্ণ সিকিউর Server Route Handler ও Client Component কোড।
                  </span>
                </div>

                {/* 1. Server Route */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">১. ব্যাকএন্ড সেশন রুট: app/api/safnex/session/route.ts</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { partnerUserId, name, email, phone } = await request.json();

    const response = await fetch('https://safnexbd.com/api/v1/partner/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Safnex-App-Id': process.env.SAFNEX_APP_ID!,
        'X-Safnex-Api-Key': process.env.SAFNEX_API_KEY!,
        'Authorization': \`Bearer \${process.env.SAFNEX_API_SECRET}\`,
      },
      body: JSON.stringify({ partnerUserId, name, email, phone }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed' }, { status: response.status });
    }

    return NextResponse.json({ sessionToken: data.sessionToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`,
                          'nextjs-server'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition"
                    >
                      {copiedId === 'nextjs-server' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'nextjs-server' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { partnerUserId, name, email, phone } = await request.json();

    // SafnexBD ব্যাকএন্ডে রিকোয়েস্ট পাঠাবে (API Secret ব্রাউজারে সুরক্ষিত থাকবে)
    const response = await fetch('https://safnexbd.com/api/v1/partner/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Safnex-App-Id': process.env.SAFNEX_APP_ID!,
        'X-Safnex-Api-Key': process.env.SAFNEX_API_KEY!,
        'Authorization': \`Bearer \${process.env.SAFNEX_API_SECRET}\`,
      },
      body: JSON.stringify({ partnerUserId, name, email, phone }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed' }, { status: response.status });
    }

    return NextResponse.json({ sessionToken: data.sessionToken });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`}
                  </pre>
                </div>

                {/* 2. Client Component */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">২. ফ্রন্টএন্ড বাটন/উইজেট কম্পোনেন্ট: components/SafnexPaymentWidget.tsx</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `'use client';

import { useState } from 'react';

export default function SafnexPaymentWidget({ userId, name, email }: { userId: string; name: string; email: string }) {
  const [loading, setLoading] = useState(false);

  const handleOpenSafnex = async () => {
    setLoading(true);
    try {
      // ১. নিজস্ব Next.js API রুট থেকে সিকিউর সেশন নিন
      const res = await fetch('/api/safnex/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerUserId: userId, name, email }),
      });
      const { sessionToken } = await res.json();

      // ২. সেফনেক্সবিডি পেমেন্ট উইন্ডো বা উইজেট ট্রিগার করুন
      const paymentUrl = \`https://safnexbd.com/partner/gateway?sessionToken=\${sessionToken}&appId=\${process.env.NEXT_PUBLIC_SAFNEX_APP_ID}\`;
      window.location.href = paymentUrl; // অথবা iframe / modal এ ওপেন করুন
    } catch (err) {
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpenSafnex}
      disabled={loading}
      className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition"
    >
      {loading ? 'প্রসেসিং হচ্ছে...' : 'SafnexBD দিয়ে পে করুন'}
    </button>
  );
}`,
                          'nextjs-client'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition"
                    >
                      {copiedId === 'nextjs-client' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'nextjs-client' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`'use client';

import { useState } from 'react';

export default function SafnexPaymentWidget({ userId, name, email }: { userId: string; name: string; email: string }) {
  const [loading, setLoading] = useState(false);

  const handleOpenSafnex = async () => {
    setLoading(true);
    try {
      // ১. নিজস্ব Next.js API রুট থেকে সিকিউর সেশন নিন
      const res = await fetch('/api/safnex/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerUserId: userId, name, email }),
      });
      const { sessionToken } = await res.json();

      // ২. সেফনেক্সবিডি পেমেন্ট উইন্ডো বা উইজেট ট্রিগার করুন
      const paymentUrl = \`https://safnexbd.com/partner/gateway?sessionToken=\${sessionToken}&appId=\${process.env.NEXT_PUBLIC_SAFNEX_APP_ID}\`;
      window.location.href = paymentUrl; // অথবা iframe / modal এ ওপেন করুন
    } catch (err) {
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpenSafnex}
      disabled={loading}
      className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition"
    >
      {loading ? 'প্রসেসিং হচ্ছে...' : 'SafnexBD দিয়ে পে করুন'}
    </button>
  );
}`}
                  </pre>
                </div>

                {/* 3. Webhook Route */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">৩. ওয়েব হুক ও সিগনেচার ভেরিফাই: app/api/safnex/webhook/route.ts</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-safnex-signature');
    const webhookSecret = process.env.SAFNEX_WEBHOOK_SECRET || process.env.SAFNEX_API_SECRET!;

    // HMAC SHA-256 দিয়ে সিগনেচার যাচাই
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid HMAC Signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { eventType, transactionId, amount, status, partnerUserId } = event;

    if (eventType === 'PAYMENT_COMPLETED' && status === 'PAID') {
      // TODO: আপনার ডাটাবেজে ইউজার ওয়ালেট আপডেট করুন বা অর্ডার কনফার্ম করুন
      console.log(\`Payment of \${amount} BDT confirmed for user \${partnerUserId}\`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`,
                          'nextjs-webhook'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition"
                    >
                      {copiedId === 'nextjs-webhook' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'nextjs-webhook' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-safnex-signature');
    const webhookSecret = process.env.SAFNEX_WEBHOOK_SECRET || process.env.SAFNEX_API_SECRET!;

    // HMAC SHA-256 দিয়ে সিগনেচার যাচাই
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid HMAC Signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { eventType, transactionId, amount, status, partnerUserId } = event;

    if (eventType === 'PAYMENT_COMPLETED' && status === 'PAID') {
      // TODO: আপনার ডাটাবেজে ইউজার ওয়ালেট আপডেট করুন বা অর্ডার কনফার্ম করুন
      console.log(\`Payment of \${amount} BDT confirmed for user \${partnerUserId}\`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT: NESTJS */}
            {apiPlatformTab === 'nestjs' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                  <Server className="w-4 h-4 shrink-0" />
                  <span>
                    NestJS TypeScript Backend: একটি সার্ভিস এবং ওয়েব হুক কন্ট্রোলার ক্লাস যা স্বয়ংক্রিয়ভাবে সিগনেচার ভ্যালিডেশন করে।
                  </span>
                </div>

                {/* 1. NestJS Service */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">১. NestJS সার্ভিস: safnex.service.ts</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SafnexService {
  private readonly baseUrl = process.env.SAFNEX_BASE_URL || 'https://safnexbd.com/api/v1';
  private readonly appId = process.env.SAFNEX_APP_ID;
  private readonly apiKey = process.env.SAFNEX_API_KEY;
  private readonly apiSecret = process.env.SAFNEX_API_SECRET;

  /**
   * পার্টনার ইউজারের জন্য সেশন টোকেন গ্রহণ করুন
   */
  async createSession(partnerUserId: string, name: string, email: string) {
    try {
      const response = await axios.post(
        \`\${this.baseUrl}/partner/auth/session\`,
        { partnerUserId, name, email },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Safnex-App-Id': this.appId,
            'X-Safnex-Api-Key': this.apiKey,
            'Authorization': \`Bearer \${this.apiSecret}\`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'SafnexBD API session creation failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * পেমেন্ট অর্ডার ক্রিয়েট করুন
   */
  async createPayment(orderId: string, amount: number, customer: { name: string; phone: string }) {
    try {
      const response = await axios.post(
        \`\${this.baseUrl}/partner/payments/create\`,
        { orderId, amount, customer },
        {
          headers: {
            'X-Safnex-App-Id': this.appId,
            'Authorization': \`Bearer \${this.apiSecret}\`,
          },
        }
      );
      return response.data; // returns { paymentUrl, transactionId }
    } catch (error: any) {
      throw new HttpException(error.response?.data?.message || 'Payment error', HttpStatus.BAD_REQUEST);
    }
  }
}`,
                          'nestjs-service'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition"
                    >
                      {copiedId === 'nestjs-service' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'nestjs-service' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SafnexService {
  private readonly baseUrl = process.env.SAFNEX_BASE_URL || 'https://safnexbd.com/api/v1';
  private readonly appId = process.env.SAFNEX_APP_ID;
  private readonly apiKey = process.env.SAFNEX_API_KEY;
  private readonly apiSecret = process.env.SAFNEX_API_SECRET;

  /**
   * পার্টনার ইউজারের জন্য সেশন টোকেন গ্রহণ করুন
   */
  async createSession(partnerUserId: string, name: string, email: string) {
    try {
      const response = await axios.post(
        \`\${this.baseUrl}/partner/auth/session\`,
        { partnerUserId, name, email },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Safnex-App-Id': this.appId,
            'X-Safnex-Api-Key': this.apiKey,
            'Authorization': \`Bearer \${this.apiSecret}\`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'SafnexBD API session creation failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * পেমেন্ট অর্ডার ক্রিয়েট করুন
   */
  async createPayment(orderId: string, amount: number, customer: { name: string; phone: string }) {
    try {
      const response = await axios.post(
        \`\${this.baseUrl}/partner/payments/create\`,
        { orderId, amount, customer },
        {
          headers: {
            'X-Safnex-App-Id': this.appId,
            'Authorization': \`Bearer \${this.apiSecret}\`,
          },
        }
      );
      return response.data; // returns { paymentUrl, transactionId }
    } catch (error: any) {
      throw new HttpException(error.response?.data?.message || 'Payment error', HttpStatus.BAD_REQUEST);
    }
  }
}`}
                  </pre>
                </div>

                {/* 2. NestJS Webhook Controller */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">২. NestJS ওয়েব হুক কন্ট্রোলার: safnex-webhook.controller.ts</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { Controller, Post, Headers, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

@Controller('safnex/webhook')
export class SafnexWebhookController {
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-safnex-signature') signature: string,
    @Body() payload: any,
  ) {
    const secret = process.env.SAFNEX_WEBHOOK_SECRET || process.env.SAFNEX_API_SECRET;
    
    // সিগনেচার যাচাই
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expected) {
      throw new UnauthorizedException('Invalid Webhook HMAC Signature');
    }

    // বিজনেস লজিক হ্যান্ডল করুন
    if (payload.status === 'PAID') {
      console.log('Order Paid successfully:', payload.orderId);
    }

    return { received: true };
  }
}`,
                          'nestjs-webhook'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition"
                    >
                      {copiedId === 'nestjs-webhook' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'nestjs-webhook' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`import { Controller, Post, Headers, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

@Controller('safnex/webhook')
export class SafnexWebhookController {
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-safnex-signature') signature: string,
    @Body() payload: any,
  ) {
    const secret = process.env.SAFNEX_WEBHOOK_SECRET || process.env.SAFNEX_API_SECRET;
    
    // সিগনেচার যাচাই
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expected) {
      throw new UnauthorizedException('Invalid Webhook HMAC Signature');
    }

    // বিজনেস লজিক হ্যান্ডল করুন
    if (payload.status === 'PAID') {
      console.log('Order Paid successfully:', payload.orderId);
    }

    return { received: true };
  }
}`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT: WORDPRESS & WOOCOMMERCE */}
            {apiPlatformTab === 'wordpress' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>
                    WordPress ও WooCommerce: functions.php কোড স্নিপেট অথবা ডেডিকেটেড WooCommerce Payment Gateway প্লাগিন।
                  </span>
                </div>

                {/* Option 1: functions.php */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">অপশন ১: থিমের functions.php এ বসিয়ে ইউজার সেশন কানেক্ট করা</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `// আপনার WordPress চাইল্ড থিমের functions.php ফাইলে নিচের কোডটি যুক্ত করুন
add_action('wp_footer', function() {
    if (!is_user_logged_in()) return;
    $current_user = wp_get_current_user();

    // SafnexBD API কনফিগারেশন
    $app_id     = 'app_YOUR_APP_ID';
    $api_secret = 'sec_YOUR_API_SECRET';

    // ১. সার্ভার-টু-সার্ভার সেশন কল
    $response = wp_remote_post('https://safnexbd.com/api/v1/partner/auth/session', [
        'headers' => [
            'Content-Type'      => 'application/json',
            'X-Safnex-App-Id'  => $app_id,
            'Authorization'     => 'Bearer ' . $api_secret,
        ],
        'body'    => wp_json_encode([
            'partnerUserId' => (string) $current_user->ID,
            'name'          => $current_user->display_name,
            'email'         => $current_user->user_email,
        ]),
        'timeout' => 15,
    ]);

    if (is_wp_error($response)) return;
    $data = json_decode(wp_remote_retrieve_body($response), true);
    $session_token = $data['sessionToken'] ?? '';
    if (!$session_token) return;
    ?>
    <!-- SafnexBD Web SDK -->
    <script src="https://safnexbd.com/sdk/safnexbd-sdk.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (window.SafnexBD) {
          window.SafnexBD.init({
            appId: '<?php echo esc_js($app_id); ?>',
            sessionToken: '<?php echo esc_js($session_token); ?>',
            position: 'bottom-right'
          });
        }
      });
    </script>
    <?php
});`,
                          'wp-functions'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition"
                    >
                      {copiedId === 'wp-functions' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'wp-functions' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`// আপনার WordPress চাইল্ড থিমের functions.php ফাইলে নিচের কোডটি যুক্ত করুন
add_action('wp_footer', function() {
    if (!is_user_logged_in()) return;
    $current_user = wp_get_current_user();

    // SafnexBD API কনফিগারেশন
    $app_id     = 'app_YOUR_APP_ID';
    $api_secret = 'sec_YOUR_API_SECRET';

    // ১. সার্ভার-টু-সার্ভার সেশন কল
    $response = wp_remote_post('https://safnexbd.com/api/v1/partner/auth/session', [
        'headers' => [
            'Content-Type'      => 'application/json',
            'X-Safnex-App-Id'  => $app_id,
            'Authorization'     => 'Bearer ' . $api_secret,
        ],
        'body'    => wp_json_encode([
            'partnerUserId' => (string) $current_user->ID,
            'name'          => $current_user->display_name,
            'email'         => $current_user->user_email,
        ]),
        'timeout' => 15,
    ]);

    if (is_wp_error($response)) return;
    $data = json_decode(wp_remote_retrieve_body($response), true);
    $session_token = $data['sessionToken'] ?? '';
    if (!$session_token) return;
    ?>
    <!-- SafnexBD Web SDK -->
    <script src="https://safnexbd.com/sdk/safnexbd-sdk.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (window.SafnexBD) {
          window.SafnexBD.init({
            appId: '<?php echo esc_js($app_id); ?>',
            sessionToken: '<?php echo esc_js($session_token); ?>',
            position: 'bottom-right'
          });
        }
      });
    </script>
    <?php
});`}
                  </pre>
                </div>

                {/* Option 2: WooCommerce Payment Gateway Snippet */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="font-mono">অপশন ২: WooCommerce পেমেন্ট গেটওয়ে হিসেবে ইন্টিগ্রেশন (Checkout Hook)</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `// WooCommerce পেমেন্ট মেথড রেজিস্টার করার কোড
add_filter('woocommerce_payment_gateways', function($gateways) {
    $gateways[] = 'WC_Gateway_SafnexBD';
    return $gateways;
});

add_action('plugins_loaded', function() {
    class WC_Gateway_SafnexBD extends WC_Payment_Gateway {
        public function __construct() {
            $this->id                 = 'safnexbd';
            $this->icon               = 'https://safnexbd.com/logo.png';
            $this->has_fields         = false;
            $this->method_title       = 'SafnexBD Escrow & Wallet';
            $this->method_description = 'Pay securely with SafnexBD Escrow & Mobile Banking';

            $this->init_form_fields();
            $this->init_settings();

            $this->title       = $this->get_option('title', 'SafnexBD Pay');
            $this->description = $this->get_option('description', 'Pay via bKash, Nagad or SafnexBD Wallet.');

            add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
            add_action('woocommerce_api_safnex_webhook', [$this, 'check_webhook_response']);
        }

        public function init_form_fields() {
            $this->form_fields = [
                'enabled' => ['title' => 'Enable/Disable', 'type' => 'checkbox', 'default' => 'yes'],
                'app_id'  => ['title' => 'App ID', 'type' => 'text'],
                'secret'  => ['title' => 'API Secret', 'type' => 'password'],
            ];
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            $app_id = $this->get_option('app_id');
            $secret = $this->get_option('secret');

            // SafnexBD পেমেন্ট অ্যান্ডপয়েন্টে কল করুন
            $response = wp_remote_post('https://safnexbd.com/api/v1/partner/payments/create', [
                'headers' => [
                    'Content-Type'     => 'application/json',
                    'X-Safnex-App-Id' => $app_id,
                    'Authorization'    => 'Bearer ' . $secret,
                ],
                'body' => wp_json_encode([
                    'orderId'   => (string) $order_id,
                    'amount'    => (float) $order->get_total(),
                    'customer'  => [
                        'name'  => $order->get_formatted_billing_full_name(),
                        'phone' => $order->get_billing_phone(),
                    ],
                    'returnUrl' => $this->get_return_url($order),
                ]),
            ]);

            $data = json_decode(wp_remote_retrieve_body($response), true);
            return [
                'result'   => 'success',
                'redirect' => $data['paymentUrl'] ?? $this->get_return_url($order),
            ];
        }
    }
});`,
                          'woo-gateway'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition"
                    >
                      {copiedId === 'woo-gateway' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'woo-gateway' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`// WooCommerce পেমেন্ট মেথড রেজিস্টার করার কোড
add_filter('woocommerce_payment_gateways', function($gateways) {
    $gateways[] = 'WC_Gateway_SafnexBD';
    return $gateways;
});

add_action('plugins_loaded', function() {
    class WC_Gateway_SafnexBD extends WC_Payment_Gateway {
        public function __construct() {
            $this->id                 = 'safnexbd';
            $this->icon               = 'https://safnexbd.com/logo.png';
            $this->has_fields         = false;
            $this->method_title       = 'SafnexBD Escrow & Wallet';
            $this->method_description = 'Pay securely with SafnexBD Escrow & Mobile Banking';

            $this->init_form_fields();
            $this->init_settings();

            $this->title       = $this->get_option('title', 'SafnexBD Pay');
            $this->description = $this->get_option('description', 'Pay via bKash, Nagad or SafnexBD Wallet.');

            add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
            add_action('woocommerce_api_safnex_webhook', [$this, 'check_webhook_response']);
        }

        public function process_payment($order_id) {
            $order = wc_get_order($order_id);
            $app_id = $this->get_option('app_id');
            $secret = $this->get_option('secret');

            // SafnexBD পেমেন্ট অ্যান্ডপয়েন্টে কল করুন
            $response = wp_remote_post('https://safnexbd.com/api/v1/partner/payments/create', [
                'headers' => [
                    'Content-Type'     => 'application/json',
                    'X-Safnex-App-Id' => $app_id,
                    'Authorization'    => 'Bearer ' . $secret,
                ],
                'body' => wp_json_encode([
                    'orderId'   => (string) $order_id,
                    'amount'    => (float) $order->get_total(),
                    'customer'  => [
                        'name'  => $order->get_formatted_billing_full_name(),
                        'phone' => $order->get_billing_phone(),
                    ],
                    'returnUrl' => $this->get_return_url($order),
                ]),
            ]);

            $data = json_decode(wp_remote_retrieve_body($response), true);
            return [
                'result'   => 'success',
                'redirect' => $data['paymentUrl'] ?? $this->get_return_url($order),
            ];
        }
    }
});`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT: REACT SPA */}
            {apiPlatformTab === 'react' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800">
                  <Code2 className="w-4 h-4 shrink-0" />
                  <span>React.js (Vite / CRA): ফ্রন্টএন্ড উইজেট বাটন ও কাস্টম SDK স্ক্রিপ্ট লোডার।</span>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`import React, { useEffect } from 'react';

interface SafnexProps {
  appId: string;
  sessionToken: string;
}

export const SafnexWidget: React.FC<SafnexProps> = ({ appId, sessionToken }) => {
  useEffect(() => {
    if (!sessionToken) return;

    // SafnexBD Web SDK লোড করুন
    const script = document.createElement('script');
    script.src = 'https://safnexbd.com/sdk/safnexbd-sdk.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).SafnexBD) {
        (window as any).SafnexBD.init({
          appId,
          sessionToken,
          position: 'bottom-right',
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [appId, sessionToken]);

  return null;
};`}
                </pre>
              </div>
            )}

            {/* TAB CONTENT: CURL & REST API */}
            {apiPlatformTab === 'curl' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Terminal className="w-4 h-4 shrink-0" />
                  <span>cURL / Postman / Raw HTTP অ্যান্ডপয়েন্ট টেস্ট রেফারেন্স।</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">১. সেশন টোকেন তৈরি রিকোয়েস্ট:</span>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
{`curl -X POST https://safnexbd.com/api/v1/partner/auth/session \\
  -H "Content-Type: application/json" \\
  -H "X-Safnex-App-Id: app_6df82a90" \\
  -H "X-Safnex-Api-Key: key_19283746" \\
  -H "Authorization: Bearer sec_998877665544" \\
  -d '{
    "partnerUserId": "CUST_99182",
    "name": "Rony Ahmed",
    "email": "rony@example.com",
    "phone": "01755999182"
  }'`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">২. সফল রেসপন্স স্যাম্পল:</span>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
{`{
  "success": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "partnerUserId": "CUST_99182",
    "safnexUserId": "usr_a98250fb"
  }
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: WORKLOAD BALANCING & MULTI-STAFF OPERATIONS MANUAL             */}
      {/* ========================================================================= */}
      {activeMainTab === 'workload' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Quick Context & Nav Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Activity className="w-3.5 h-3.5" />
                <span>Enterprise Multi-Staff Workload Engine &amp; Concurrency Lock</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                মাল্টি-স্টাফ ও ওয়ার্কলোড সমবণ্টন ইঞ্জিন নির্দেশিকা
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                প্রতিদিন প্ল্যাটফর্মে হাজার হাজার উইথড্র (Withdrawal), রিচার্জ (Recharge) এবং ডিসপুট (Dispute/Calling) রিকোয়েস্ট একাধিক স্টাফদের মাঝে সমন্বয় ও সমবণ্টনের জন্য সম্পূর্ণ আর্কিটেকচার।
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Sliders className="w-4 h-4" />
                <span>Operations Settings</span>
              </Link>
              <Link
                href="/admin/operations"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition"
              >
                <Activity className="w-4 h-4" />
                <span>Live Operations Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Visual Architecture Flowchart Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span>End-to-End Task Lifecycle Architecture</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Zero Race Conditions &bull; Guaranteed Single Payout</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <div className="text-sky-400 font-bold flex items-center gap-1.5">
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>1. Incoming Request</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  ইউজার Withdrawal, Recharge বা Dispute রিকোয়েস্ট সাবমিট করলে সেন্ট্রাল কিউতে জমা হয়।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <div className="text-purple-400 font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>2. Concurrency Lock</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  অন-ডিউটি স্টাফ ক্লেইম করলে ১০ মিনিটের জন্য লক হয়। অন্য কোনো স্টাফ ঐ কাজে ঢুকতে পারে না।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>3. Action / Execution</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  স্টাফ পেমেন্ট ভেরিফাই করে Approve বা Reject করবে।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>4. Handoff / Escalate</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  অপারগ হলে Peer Handoff দিয়ে সহকর্মীকে বা Fraud হলে Super Admin-কে Escalate করবে।
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tabs for Workload Roles */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs font-bold">
            {[
              { id: 'admin', label: '১. সুপার অ্যাডমিন কনফিগারেশন (Super Admin Master Controls)' },
              { id: 'staff', label: '২. স্টাফদের স্ট্যান্ডার্ড অপারেটিং প্রসিডিউর (Staff SOP)' },
              { id: 'algorithms', label: '৩. অ্যালগরিদম ও কনকারেন্সি লক (Technical Architecture)' },
              { id: 'faq', label: '৪. সমস্যা ও বাস্তব সমাধান (Troubleshooting & Real Scenarios)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setWorkloadRoleTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl transition border text-xs font-bold ${
                  workloadRoleTab === tab.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SUB-TAB 1: SUPER ADMIN CONFIGURATION */}
          {workloadRoleTab === 'admin' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        মাস্টার সেটিংস কনফিগারেশন (Master Parameters)
                      </h3>
                      <p className="text-xs text-slate-500">Settings &gt; অপারেশন ও ওয়ার্কলোড ট্যাব থেকে কনফিগার করুন</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Master Workload Engine Switch:</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          ON / OFF
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        <strong>OFF (Default):</strong> সাধারণ উন্মুক্ত মোড (Open Pool)। যেকোনো অ্যাডমিন যেকোনো রিকোয়েস্টে সরাসরি অ্যাক্সেস করতে পারে।<br />
                        <strong>ON (High Volume):</strong> কাজের চাপ বাড়লে এটি সক্রিয় করবেন। এটি স্বয়ংক্রিয় কিউ, কনকারেন্সি লক এবং কর্মীবণ্টন চালু করে।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Distribution Strategy (ডিস্ট্রিবিউশন স্ট্র্যাটেজি):</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400">
                          3 ALGORITHMS
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        • <code>CLAIM_POOL</code> (Recommended): প্রথম আসা রিকোয়েস্ট আগে ক্লেইম (FIFO Queue)।<br />
                        • <code>AUTO_LEAST_LOADED</code>: অন-ডিউটি থাকা কর্মীদের মধ্যে যার হাতে কাজ কম, অটোমেটিক তাকে দেয়।<br />
                        • <code>ROUND_ROBIN</code>: সমানভাবে চক্রাকারে প্রতিটি কর্মীকে ভাগ করে দেয়।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Max Concurrent Tasks per Staff:</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          DEFAULT: 5
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        একজন স্টাফ একসাথে কতটি কাজ হোল্ড করে রাখতে পারবে। এটি কোনো একক কর্মী অতিরিক্ত কাজ জমিয়ে রেখে কিউ আটকে রাখা প্রতিরোধ করে।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                    <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        লক ও নিরাপত্তা কনফিগারেশন (Concurrency &amp; Safety)
                      </h3>
                      <p className="text-xs text-slate-500">ডুপ্লিকেট ক্যাশআউট ও ডেডলক সম্পূর্ণ নির্মূল করার মেকানিজম</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Concurrency Lock Duration (লক স্থায়িত্ব):</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400">
                          DEFAULT: 10 MIN
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        একজন স্টাফ একটি কাজ ওপেন বা ক্লেইম করলে ১০ মিনিটের জন্য ডাটাবেজে <code>lockedUntil</code> টাইমস্ট্যাম্প সেট হয়। এই সময়ের মধ্যে অন্য কোনো কর্মী ঐ কাজের অনুমোদন বাটনে ক্লিক করতে পারবে না। ফলে <strong>ডাবল পেমেন্টের ঝুঁকি শূন্য</strong>।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Staff Inactivity Auto-Release:</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                          DEFAULT: 15 MIN
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        কোনো কর্মী কাজ ক্লেইম করে নিষ্ক্রিয় থাকলে বা সংযোগ বিচ্ছিন্ন হলে ১৫ মিনিট পর স্বয়ংক্রিয়ভাবে কাজটি রিলিজ হয়ে পুনরায় উন্মুক্ত কিউতে ফেরত চলে আসবে।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                        <span>Peer Handoff &amp; Senior Escalation:</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        কর্মী নিজে অক্ষম হলে হ্যান্ডওভার নোটসহ অন্য সহকর্মীকে কাজ দিতে পারে এবং কোনো সন্দেহজনক বা ফ্রড ট্রানজ্যাকশন দেখলে এক ক্লিকে সুপার অ্যাডমিনের কাছে পাঠাতে পারে।
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Control Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>লাইভ অপারেশনস ড্যাশবোর্ড ও কিউ রিব্যালান্সিং (/admin/operations)</span>
                  </h4>
                  <Link
                    href="/admin/operations"
                    className="text-xs text-sky-500 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>ড্যাশবোর্ড খুলুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
                    <strong className="text-slate-900 dark:text-white font-bold block text-sm">
                      1. SLA Telemetry &amp; Alerts
                    </strong>
                    <p className="text-slate-500 leading-relaxed">
                      উইথড্র বা রিচার্জ যদি ১৫ মিনিটের বেশি অপেক্ষমাণ থাকে তবে <strong>Yellow Warning</strong> এবং ৩০ মিনিট পার হলে <strong>Red Breach Alert</strong> দেখায়।
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
                    <strong className="text-slate-900 dark:text-white font-bold block text-sm">
                      2. Real-time Staff Capacity Matrix
                    </strong>
                    <p className="text-slate-500 leading-relaxed">
                      অন-ডিউটি থাকা প্রতিটি স্টাফের বর্তমান কাজের প্রগ্রেস বার (যেমন: ৩/৫টি কাজ) এবং তাদের ডিউটি স্ট্যাটাস লাইভ দেখা যায়।
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
                    <strong className="text-slate-900 dark:text-white font-bold block text-sm">
                      3. 1-Click Queue Rebalance
                    </strong>
                    <p className="text-slate-500 leading-relaxed">
                      হঠাৎ কোনো স্টাফের কম্পিউটার নষ্ট হলে বা নেট চলে গেলে <strong>&quot;Rebalance Queue&quot;</strong> বাটনে এক ক্লিকেই সব আটকে থাকা কাজ সচল কর্মীদের মাঝে সমবণ্টন করা যায়।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: STAFF SOP */}
          {workloadRoleTab === 'staff' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-500" />
                  <span>স্টাফদের স্ট্যান্ডার্ড অপারেটিং প্রসিডিউর (Staff Standard Operating Procedure - SOP)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  দায়িত্ব পালনের সময় প্রতিটি স্টাফ সদস্যকে নিচের ক্রমানুসারে কাজ পরিচালনা করতে হবে:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1 */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center text-xs font-black">
                      ১
                    </span>
                    <span>Duty Status নির্বাচন (Duty Lifecycle &amp; Presence)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    প্রতিদিন অ্যাডমিন প্যানেলে লগইন করার সাথে সাথে হেডার বারের ডিউটি ড্রপডাউন থেকে সঠিক স্ট্যাটাস নির্বাচন করুন:
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <div>
                        <strong className="text-emerald-600 dark:text-emerald-400">ON_DUTY (সক্রিয়):</strong> আপনি কাজ নেওয়ার জন্য সম্পূর্ণ প্রস্তুত।
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <div>
                        <strong className="text-amber-600 dark:text-amber-400">ON_BREAK (বিরতি/পজ):</strong> নামাজ, খাবার বা বিশ্রামের সময় (নতুন কোনো কাজ আসবে না)।
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <strong className="text-rose-600 dark:text-rose-400">OFF_DUTY (অফলাইন):</strong> দিনের শিফট শেষ।
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-xs font-black">
                      ২
                    </span>
                    <span>কাজ গ্রহণ (Task Claiming via FIFO Queue)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    উইথড্রল পেজ (<Link href="/admin/withdrawals" className="text-sky-500 underline font-semibold">Withdrawals</Link>) বা রিচার্জ পেজে যান। পেজের শীর্ষে থাকা <strong>&quot;পরবর্তী কাজ নিন (Claim Next)&quot;</strong> বাটনে ক্লিক করুন।
                  </p>
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-[11px] text-purple-800 dark:text-purple-300 font-medium space-y-1">
                    <div>✓ সেন্ট্রাল কিউ থেকে সবচেয়ে পুরোনো অপেক্ষমাণ কাজটি আপনার নামে লক হবে।</div>
                    <div>✓ স্ক্রিনে ১০ মিনিটের একটি কাউন্টডাউন টাইমার চলবে।</div>
                    <div>✓ অন্য কোনো সহকর্মী ঐ সময়ে কাজটি মডিফাই করতে পারবে না।</div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-xs font-black">
                      ৩
                    </span>
                    <span>যাচাই ও অনুমোদন (Verification &amp; Payout Execution)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    ১০ মিনিট লক টাইমআউট শেষ হওয়ার আগেই ইউজারের ওয়ালেট নম্বর, ক্যাশআউট মেথড (bKash/Nagad/Rocket) এবং ব্যালেন্স হিস্ট্রি ভালোভাবে মিলিয়ে দেখুন:
                  </p>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pl-4 list-disc">
                    <li>টাকা পাঠানো নিশ্চিত হলে <strong>&quot;অনুমোদন (Approve)&quot;</strong> বাটনে ক্লিক করুন।</li>
                    <li>তথ্য ভুল বা ভুয়া রিকোয়েস্ট হলে কারণ উল্লেখ করে <strong>&quot;বাতিল (Reject)&quot;</strong> করুন।</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-xs font-black">
                      ৪
                    </span>
                    <span>সহকর্মীকে বদল অথবা এস্কেলেট (Peer Handoff vs Senior Escalation)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    কোনো রিকোয়েস্ট একা সমাধান করতে না পারলে বা সন্দেহজনক মনে হলে:
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong className="text-sky-600 dark:text-sky-400">Peer Handoff (হস্তান্তর):</strong> যদি আপনি কোনো কারণে পেমেন্ট সম্পন্ন করতে না পারেন, &quot;হস্তান্তর&quot; বাটনে ক্লিক করে অন-ডিউটি থাকা অন্য সহকর্মীকে নোটসহ পাঠিয়ে দিন।
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong className="text-rose-600 dark:text-rose-400">Senior Escalation (এস্কেলেট):</strong> বড় ধরনের জালিয়াতি, ফেক স্ক্রিনশট বা জটিল ডিসপুট হলে &quot;এস্কেলেট&quot; চাপুন। এটি সরাসরি সুপার অ্যাডমিনের প্রায়োরিটি কিউতে চলে যাবে।
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: ALGORITHMS & ARCHITECTURE */}
          {workloadRoleTab === 'algorithms' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
                  <div className="inline-flex px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs">
                    CLAIM_POOL (FIFO Queue)
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    ফার্স্ট-ইন-ফার্স্ট-আউট ক্লেইম কিউ
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    সব রিকোয়েস্ট একটি সেন্ট্রাল পুল-এ টাইমস্ট্যাম্প অনুসারে জমা থাকে। স্টাফরা কাজের গতি অনুযায়ী &quot;পরবর্তী কাজ নিন&quot; বাটন চেপে কাজ ক্লেইম করে।
                  </p>
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    ✓ <strong>সুবিধা:</strong> কোনো স্টাফ অলস বসে থাকলেও কিউ জ্যাম হয় না; দক্ষ কর্মীরা বেশি কাজ দ্রুত প্রসেস করতে পারে।
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
                  <div className="inline-flex px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs">
                    AUTO_LEAST_LOADED
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    রিয়েল-টাইম ক্যাপাসিটি ব্যালান্সার
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    নতুন রিকোয়েস্ট আসার সাথে সাথে ইঞ্জিন চেক করে কোন কর্মী <code>ON_DUTY</code> আছে এবং কার হাতে সবচেয়ে কম অ্যাক্টিভ কাজ পেন্ডিং। সাথে সাথে তার অ্যাকাউন্টে কাজ পুশ করে দেওয়া হয়।
                  </p>
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    ✓ <strong>সুবিধা:</strong> কর্মীদের মাঝে কাজের চাপ শতভাগ সমান থাকে, কাউকে ম্যানুয়ালি বাটন চাপতে হয় না।
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
                  <div className="inline-flex px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    ROUND_ROBIN
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    চক্রাকারে সুষম ডিস্ট্রিবিউশন
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    ১ম রিকোয়েস্ট কর্মী A, ২য় রিকোয়েস্ট কর্মী B, ৩য় রিকোয়েস্ট কর্মী C—এভাবে রোটেশনাল ক্রমানুসারে কাজ বণ্টন হয়।
                  </p>
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    ✓ <strong>সুবিধা:</strong> শিফটে থাকা কর্মীদের মাঝে সমান সমান কাজের সংখ্যা নিশ্চিত করে।
                  </div>
                </div>
              </div>

              {/* Technical Concurrency Lock Deep Dive Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-500" />
                  <span>কনকারেন্সি লক মেকানিজম কীভাবে ডুপ্লিকেট পেমেন্ট শূন্য করে? (Anti-Double Spending)</span>
                </h4>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    যখন প্ল্যাটফর্মে লাখ লাখ টাকা ক্যাশআউট হয়, তখন একই সাথে ২ জন কর্মী একটি রিকোয়েস্টে ক্লিক করলে দুটি আলাদা পেমেন্ট চলে যাওয়ার ঝুঁকি থাকে। এই ঝুঁকি নির্মূল করতে আমাদের সিস্টেম <strong>Database Row-level Optimistic Locking</strong> ব্যবহার করে:
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`// Prisma Transaction with Concurrency Lock check:
const claim = await prisma.$transaction(async (tx) => {
  const task = await tx.withdrawalRequest.findFirst({
    where: {
      status: 'PENDING',
      OR: [
        { lockedUntil: null },
        { lockedUntil: { lt: new Date() } } // Expired locks can be claimed
      ]
    }
  });

  if (!task) throw new NotFoundException('No pending tasks available');

  // Immediately lock to current staff
  return tx.withdrawalRequest.update({
    where: { id: task.id },
    data: {
      assignedToId: staffId,
      assignedAt: new Date(),
      lockedUntil: new Date(Date.now() + 10 * 60 * 1000) // 10 Min Concurrency Lock
    }
  });
});`}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    এর ফলে ডাটাবেজে লক নিশ্চিত হওয়ার পরই শুধুমাত্র নির্দিষ্ট কর্মীর স্ক্রিনে অনুমোদন বাটন দৃশ্যমান হয়; অন্য কারো পক্ষে একই কাজে টাকা পাঠানোর কোনো প্রযুক্তিগত সুযোগ থাকে না।
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 4: REAL SCENARIOS & FAQ */}
          {workloadRoleTab === 'faq' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  <span>বাস্তব পরিস্থিতি, সমস্যা ও সমাধান (Real-World Operational Scenarios &amp; FAQ)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  প্রতিদিনের অপারেশনে যে যে পরিস্থিতি তৈরি হতে পারে এবং সিস্টেম কীভাবে তা ট্যাকল করে:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    দৃশ্যপট ১: ১ দিনে ১০,০০০ উইথড্র রিকোয়েস্ট আসলে কিউ কি আটকে যাবে?
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>উত্তর:</strong> না। সিস্টেমটি হাইপারফরম্যান্স ইনডেক্সিং এবং FIFO কিউ আর্কিটেকচারে ডিজাইন করা হয়েছে। যদি ৫ জন স্টাফ অন-ডিউটিতে থাকে, প্রত্যেকে তাদের নিজ নিজ কাজের গতি অনুযায়ী ক্লেইম করবে। একজনের কাজের চাপ অন্যজনের ওপর প্রভাব ফেলে না এবং ডাটাবেজ মিলিসেকেন্ডে কিউ ম্যানেজ করে।
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    দৃশ্যপট ২: একজন কর্মী কাজ ক্লেইম করে কম্পিউটার বন্ধ করে চলে গেলে কী হবে?
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>উত্তর:</strong> সিস্টেমে <code>autoReleaseInactiveMinutes</code> (১৫ মিনিট) কনফিগার করা আছে। ১৫ মিনিট অতিবাহিত হওয়ার সাথে সাথে সিস্টেম অটোমেটিক লকটি রিসেট করে কাজটি সেন্ট্রাল কিউতে ফিরিয়ে দেবে যাতে অন্য সচল সহকর্মীরা তা সম্পন্ন করতে পারে। এছাড়াও সুপার অ্যাডমিন চাইলে এক ক্লিকে <strong>&quot;Rebalance Queue&quot;</strong> চাপতে পারেন।
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    দৃশ্যপট ৩: একজন কর্মী একটি জটিল ডিসপুট হ্যান্ডেল করতে পারছে না, তখন সে কী করবে?
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>উত্তর:</strong> ঐ কর্মী তার স্ক্রিনে থাকা <strong>&quot;হস্তান্তর (Handoff)&quot;</strong> বাটনে ক্লিক করবে। ড্রপডাউন থেকে অন-ডিউটি থাকা অন্য যেকোনো সহকর্মীকে সিলেক্ট করে হ্যান্ডওভার নোট লিখে সাবমিট করবে। সাথে সাথে টাস্কটি অন্য সহকর্মীর স্ক্রিনে নোটিফিকেশনসহ ট্রান্সফার হয়ে যাবে।
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    দৃশ্যপট ৪: জাল স্ক্রিনশট বা বড় প্রতারণার সন্দেহ হলে স্টাফের কী করণীয়?
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong>উত্তর:</strong> কর্মী অবিলম্বে <strong>&quot;এস্কেলেট (Escalate)&quot;</strong> বাটনে চাপবে এবং ফ্রডের বিস্তারিত লিখবে। এটি সাধারণ কিউ থেকে সরাসরি সুপার অ্যাডমিনের হাই-প্রায়োরিটি এসকেপ কিউতে চলে যাবে এবং ইউজারকে সাময়িক ফ্ল্যাগ করে রাখা হবে।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDocsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">লোড হচ্ছে...</div>}>
      <AdminDocsContent />
    </Suspense>
  );
}

