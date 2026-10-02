import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Phone,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  Eye,
  Calendar,
  Share2,
  CheckCircle2,
  FileText,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://safnexbd.com/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://safnexbd.com';

const categoryLabelsBn: Record<string, string> = {
  TRANSACTION_FRAUD: 'লেনদেন সংক্রান্ত প্রতারণা (টাকা নিয়ে ব্লক)',
  FAKE_PRODUCT: 'নকল বা পণ্য না দিয়ে যোগাযোগ বিচ্ছিন্ন',
  ACCOUNT_THEFT: 'ফেসবুক পেজ / আইডি চুরি বা হ্যাকিং',
  FAKE_SERVICE: 'ভুয়া সার্ভিস / প্রতিশ্রুতি ভঙ্গ',
  OTHER: 'অন্যান্য অনলাইন প্রতারণা',
};

async function fetchScammerProfile(identifier: string) {
  try {
    const res = await fetch(
      `${API_BASE}/scammer-reports/public/${encodeURIComponent(identifier)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const raw = await res.json();
    return raw?.data || raw;
  } catch {
    return null;
  }
}

function resolveImg(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ identifier: string }>;
}): Promise<Metadata> {
  const { identifier } = await params;
  const data = await fetchScammerProfile(identifier);

  if (!data || !data.primary) {
    return {
      title: `স্ক্যামার ও প্রতারক যাচাই (${decodeURIComponent(identifier)}) | SafnexBD Scammer Checker`,
      description:
        'যেকোনো মোবাইল নম্বর, নাম বা ফেসবুক আইডি লিখে অনলাইন প্রতারক ও স্ক্যামার যাচাই করুন SafnexBD Scammer Database-এ।',
    };
  }

  const p = data.primary;
  const namePart = p.scammerName ? `${p.scammerName}` : 'অজ্ঞাত প্রতারক (Reported Scammer)';
  const phonePart = p.phone ? `${p.phone}` : '';
  const displayHeadline = phonePart ? `${phonePart} - ${namePart}` : namePart;
  const categoryText = categoryLabelsBn[p.category] || p.category;
  const shortDesc = (p.description || '').slice(0, 150);

  const title = `⚠️ সতর্কবার্তা: ${displayHeadline} | ভেরিফায়েড প্রতারক ও স্ক্যামার রিপোর্ট (Scammer Alert BD) | SafnexBD`;
  const description = `${displayHeadline}-এর বিরুদ্ধে "${categoryText}" সংক্রান্ত ভেরিফায়েড প্রতারণার অভিযোগ ও স্ক্রিনশট প্রমাণ পাওয়া গেছে। বিবরণ: ${shortDesc}... আর্থিক লেনদেন থেকে বিরত থাকুন।`;

  const ogImage =
    resolveImg(p.scammerPhotoUrl) ||
    (Array.isArray(p.proofImages) && p.proofImages.length > 0
      ? resolveImg(p.proofImages[0])
      : `${SITE_URL}/logo.png`);

  const canonicalIdentifier = encodeURIComponent(p.phone || p.id);

  return {
    title,
    description,
    keywords: [
      p.phone || '',
      p.scammerName || '',
      `${p.phone || ''} scammer`,
      `${p.phone || ''} প্রতারক`,
      `${p.scammerName || ''} scammer bd`,
      `${p.scammerName || ''} প্রতারক`,
      'bKash scammer number check',
      'SafnexBD Scammer Database',
    ].filter(Boolean),
    alternates: {
      canonical: `${SITE_URL}/check/${canonicalIdentifier}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/check/${canonicalIdentifier}`,
      siteName: 'SafnexBD Scammer Database',
      type: 'article',
      images: ogImage ? [{ url: ogImage, alt: displayHeadline }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ScammerPublicProfilePage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  const data = await fetchScammerProfile(identifier);

  if (!data || !data.primary) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4">
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">
            এই নম্বর বা নামের কোনো প্রতারণার রেকর্ড পাওয়া যায়নি
          </h1>
          <p className="text-sm text-slate-400">
            অনুসন্ধানকৃত তথ্য: <span className="font-mono text-amber-400">{decodeURIComponent(identifier)}</span>
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/check"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
            >
              অন্য নম্বর বা নাম সার্চ করুন
            </Link>
            <Link
              href="/dashboard/chat"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
            >
              নিরাপদ এসক্রো লেনদেন করুন
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primary = data.primary;
  const allReports: any[] = data.allReports || [primary];
  const nameDisplay = primary.scammerName || 'অজ্ঞাত নাম (নাম উল্লেখ নেই)';
  const phoneDisplay = primary.phone || 'নম্বর উল্লেখ নেই';
  const canonicalUrl = `${SITE_URL}/check/${encodeURIComponent(primary.phone || primary.id)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;

  // Rich FAQ + Report JSON-LD Schema for #1 Google Search Ranking on Phone Number & Scammer Name
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${phoneDisplay} (${nameDisplay}) নম্বর বা ব্যক্তির বিরুদ্ধে কি অনলাইন প্রতারণার অভিযোগ আছে?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `হ্যাঁ, SafnexBD Scammer Database-এ ${nameDisplay} (মোবাইল নম্বর: ${phoneDisplay})-এর বিরুদ্ধে মোট ${allReports.length}টি ভেরিফায়েড প্রতারণার রিপোর্ট রয়েছে। অভিযোগের ধরন: ${categoryLabelsBn[primary.category] || primary.category}। বিবরণ: ${primary.description}`,
        },
      },
      {
        '@type': 'Question',
        name: `${nameDisplay} (${phoneDisplay})-এর সাথে কীভাবে প্রতারণা থেকে নিরাপদ থাকবেন?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${phoneDisplay} নম্বরে বা ${nameDisplay}-কে কখনোই সরাসরি বিকাশ, নগদ বা রকেটে অগ্রিম টাকা পাঠাবেন না। যেকোনো অনলাইন কেনাবেচায় ১০০% সুরক্ষিত থাকতে SafnexBD Escrow Service ব্যবহার করুন।`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Back Navigation & Share Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/check"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-amber-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>স্ক্যামার চেকার সার্চ পেজে ফিরে যান</span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={fbShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold shadow-lg transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>ফেসবুকে সতর্কবার্তা শেয়ার করুন (Share on Facebook)</span>
            </a>
          </div>
        </div>

        {/* Main High-Alert Scammer Profile Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-500/50 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold mb-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  <span>VERIFIED SCAMMER REPORT • প্রতারক সতর্কবার্তা</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {nameDisplay}
                </h1>
                {primary.phone && (
                  <p className="text-lg sm:text-xl font-mono font-extrabold text-amber-400 mt-1 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>{primary.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 text-xs text-slate-300">
              <span className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 font-bold text-rose-400">
                মোট অভিযোগ: {allReports.length}টি
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Eye className="w-3.5 h-3.5" />
                <span>সার্চ ও ভিউ: {primary.searchHitCount || 1} বার</span>
              </span>
            </div>
          </div>

          {/* Caution Box */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm leading-relaxed">
            <strong>⚠️ বিশেষ সতর্কতা:</strong> এই ব্যক্তি/নম্বরের ({phoneDisplay} — {nameDisplay}) বিরুদ্ধে আর্থিক প্রতারণার প্রমাণিত রেকর্ড রয়েছে। এই নম্বরে সরাসরি বিকাশ, নগদ বা রকেটে কোনো প্রকার অগ্রিম টাকা পাঠাবেন না।
          </div>

          {/* All Reports List for this Scammer */}
          <div className="space-y-5">
            {allReports.map((rep, idx) => (
              <div
                key={rep.id}
                className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    {categoryLabelsBn[rep.category] || rep.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {rep.amountLost ? (
                      <span className="font-bold text-rose-400">
                        ক্ষতির পরিমাণ: ৳{Number(rep.amountLost).toLocaleString()}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(rep.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                </div>

                {/* Key Identifiers Table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block">প্রতারকের নাম:</span>
                    <strong className="text-white text-sm">{rep.scammerName || 'উল্লেখ নেই'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">মোবাইল নম্বর (বিকাশ/নগদ):</span>
                    <strong className="text-amber-400 font-mono text-sm">{rep.phone || 'উল্লেখ নেই'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ফেসবুক আইডি / পেজ:</span>
                    {rep.facebookLink ? (
                      <a
                        href={rep.facebookLink.startsWith('http') ? rep.facebookLink : `https://${rep.facebookLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline font-medium inline-flex items-center gap-1 break-all"
                      >
                        <span>ফেসবুক লিংক দেখুন</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-500">উল্লেখ নেই</span>
                    )}
                  </div>
                </div>

                {/* Incident Description */}
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>প্রতারণার ঘটনার বিস্তারিত বিবরণ (Report #{idx + 1}):</span>
                  </h2>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/50 p-4 rounded-xl border border-slate-800/60">
                    {rep.description}
                  </p>
                </div>

                {/* Proof Screenshots */}
                {Array.isArray(rep.proofImages) && rep.proofImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400">
                      📸 সংযুক্ত প্রমাণ ও স্ক্রিনশট ({rep.proofImages.length}টি):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {rep.proofImages.map((img: string, i: number) => (
                        <a
                          key={i}
                          href={resolveImg(img)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-900 block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveImg(img)}
                            alt={`${nameDisplay} ${phoneDisplay} প্রতারণার প্রমাণ স্ক্রিনশট ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Safe Escrow Call to Action */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-sky-950/80 border border-emerald-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>১০০% প্রতারণামুক্ত লেনদেনের সমাধান</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              অপরিচিত মানুষের সাথে লেনদেনে সবসময় SafnexBD Escrow ব্যবহার করুন!
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              সরাসরি বিকাশ বা নগদে অগ্রিম টাকা না পাঠিয়ে SafnexBD চ্যাটে পেমেন্ট হোল্ড রাখুন। কাজ বা পণ্য বুঝে পাওয়ার পর টাকা রিলিজ দিন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/chat"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition"
            >
              নিরাপদ এসক্রো ডিল শুরু করুন
            </Link>
            <Link
              href="/check"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
            >
              নতুন রিপোর্ট জমা দিন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
