'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  UploadCloud,
  X,
  Lock,
  ArrowRight,
  UserCheck,
  FileText,
  DollarSign,
  AlertCircle,
  Eye,
  Sparkles,
  Phone,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface ScammerMatch {
  id: string;
  scammerName: string | null;
  phone: string | null;
  facebookLink: string | null;
  category: string;
  description: string;
  amountLost: number | null;
  proofImages: string[];
  scammerPhotoUrl: string | null;
  severity: string;
  searchHitCount: number;
  createdAt: string;
}

interface SearchResponse {
  enabled: boolean;
  found: boolean;
  count?: number;
  query?: string;
  message?: string;
  messageBn?: string;
  messageEn?: string;
  advisoryNoticeBn?: string;
  advisoryNoticeEn?: string;
  cautionMessageBn?: string;
  cautionMessageEn?: string;
  records?: ScammerMatch[];
}

export default function ScammerCheckerPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user } = useAuthStore();
  const isBn = lang === 'bn';

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [searchError, setSearchError] = useState('');

  // Modals
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeProofImage, setActiveProofImage] = useState<string | null>(null);

  // Report Form State
  const [targetPhone, setTargetPhone] = useState('');
  const [targetFacebook, setTargetFacebook] = useState('');
  const [targetName, setTargetName] = useState('');
  const [category, setCategory] = useState('TRANSACTION_FRAUD');
  const [amountLost, setAmountLost] = useState('');
  const [description, setDescription] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Handle Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError(isBn ? 'অনুগ্রহ করে একটি মোবাইল নম্বর বা ফেসবুক লিংক লিখুন।' : 'Please enter a phone number or Facebook link.');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res: any = await api.get(`/scammer-reports/search?q=${encodeURIComponent(query)}`);
      const data = res?.data !== undefined ? res.data : res;
      setSearchResult(data);
    } catch (err: any) {
      setSearchError(err?.response?.data?.message || err?.message || (isBn ? 'সার্চ সম্পন্ন করা সম্ভব হয়নি।' : 'Search failed.'));
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Report Button Click (Enforce Registration)
  const handleOpenReport = () => {
    if (!user) {
      setAuthPromptOpen(true);
    } else {
      setReportModalOpen(true);
    }
  };

  // Proof image upload via Base64 to /uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (proofImages.length >= 5) {
      setFormError(isBn ? 'সর্বোচ্চ ৫টি প্রমাণ স্ক্রিনশট আপলোড করা যাবে।' : 'Maximum 5 proof screenshots allowed.');
      return;
    }

    setIsUploading(true);
    setFormError('');

    try {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(isBn ? 'ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।' : 'Image size must be under 5MB.');
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          const res: any = await api.post('/uploads', {
            base64Data,
            fileName: file.name,
            folder: 'scammer-proof',
          });
          const data = res?.data !== undefined ? res.data : res;
          if (data?.url) {
            setProofImages((prev) => [...prev, data.url]);
          }
        } catch (uploadErr: any) {
          setFormError(uploadErr?.response?.data?.message || uploadErr?.message || 'Upload failed');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setFormError(err.message || 'File upload error');
      setIsUploading(false);
    }
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPhone.trim() && !targetFacebook.trim()) {
      setFormError(isBn ? 'প্রতারকের মোবাইল নম্বর অথবা ফেসবুক লিংক যেকোনো একটি অবশ্যই দিতে হবে।' : 'Either phone number or Facebook link is required.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setFormError(isBn ? 'প্রতারণার ঘটনার বিস্তারিত বিবরণ লিখুন (কমপক্ষে ১৫ অক্ষর)।' : 'Please provide detailed incident description (min 15 chars).');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await api.post('/scammer-reports', {
        phone: targetPhone.trim() || undefined,
        facebookLink: targetFacebook.trim() || undefined,
        scammerName: targetName.trim() || undefined,
        category,
        amountLost: amountLost ? parseFloat(amountLost) : undefined,
        description: description.trim(),
        proofImages,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setReportModalOpen(false);
        // Reset form
        setTargetPhone('');
        setTargetFacebook('');
        setTargetName('');
        setAmountLost('');
        setDescription('');
        setProofImages([]);
      }, 3000);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || (isBn ? 'রিপোর্ট সাবমিট করা যায়নি।' : 'Failed to submit report.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryLabelsBn: Record<string, string> = {
    TRANSACTION_FRAUD: 'লেনদেন সংক্রান্ত প্রতারণা (টাকা নিয়ে ব্লক)',
    FAKE_PRODUCT: 'নকল বা পণ্য না দিয়ে যোগাযোগ বিচ্ছিন্ন',
    ACCOUNT_THEFT: 'ফেসবুক পেজ / আইডি চুরি বা হ্যাকিং',
    FAKE_SERVICE: 'ভুয়া সার্ভিস / প্রতিশ্রুতি ভঙ্গ',
    OTHER: 'অন্যান্য প্রতারণা',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-black">
      {/* Top Ambient Glow */}
      <div className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isBn ? '১০০% উন্মুক্ত ও সুরক্ষিত পাবলিক ভেরিফিকেশন ডাটাবেজ' : 'Public Scammer & Trust Verification Database'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {isBn ? (
              <>
                অনলাইন প্রতারক ও <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">স্ক্যামার যাচাই করুন</span>
              </>
            ) : (
              <>
                Verify Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Scammers & Fraud</span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isBn
              ? 'যেকোনো আর্থিক লেনদেনের পূর্বে মোবাইল বা বিকাশ নম্বর এবং ফেসবুক আইডি লিংক দিয়ে চেক করে প্রতারণা থেকে নিরাপদ থাকুন।'
              : 'Check phone numbers, bKash numbers, or Facebook links before making any payment to avoid fraud.'}
          </p>

          {/* Universal Search Form */}
          <form onSubmit={handleSearch} className="pt-4 max-w-2xl mx-auto">
            <div className="relative flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
              <div className="flex items-center gap-2 px-3 w-full">
                <Search className="w-5 h-5 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError('');
                  }}
                  placeholder={
                    isBn
                      ? 'মোবাইল নম্বর (০১৭...) অথবা ফেসবুক লিংক লিখুন...'
                      : 'Enter Mobile Number (017...) or Facebook URL...'
                  }
                  className="w-full py-2.5 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResult(null);
                    }}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{isBn ? 'যাচাই করুন' : 'Search Now'}</span>
                  </>
                )}
              </button>
            </div>

            {searchError && (
              <p className="mt-2 text-xs sm:text-sm text-red-400 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </p>
            )}

            {/* Quick Helper Chips */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="text-slate-500">{isBn ? 'উদাহরণ:' : 'Format:'}</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-slate-300">017XXXXXXXX</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-slate-300">+88019XXXXXXXX</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-slate-300">facebook.com/username</span>
            </div>
          </form>

          {/* Action Trigger for Victim Reporting */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleOpenReport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{isBn ? '🚨 আপনি কি প্রতারিত হয়েছেন? রিপোর্ট করুন' : 'Report a Scammer / Fraud'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content & Results Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* CASE 1: SEARCH RESULT FOUND SCAMMER (RED ALERT) */}
        {searchResult?.found && searchResult?.records && searchResult.records.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-red-950/40 border-2 border-red-500/80 p-6 sm:p-8 shadow-[0_12px_50px_rgba(239,68,68,0.25)]">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30 animate-pulse">
                  <ShieldAlert className="w-8 h-8 text-red-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isBn ? 'রেড অ্যালার্ট • প্রতারক প্রমাণিত' : 'RED ALERT • VERIFIED FRAUD'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-red-200">
                    {isBn ? '⚠️ সাবধান! এই নম্বর/আইডির বিরুদ্ধে প্রতারণার অভিযোগ রয়েছে!' : '⚠️ WARNING! Verified Scam Complaints Found!'}
                  </h2>
                  <p className="text-sm sm:text-base text-red-300 leading-relaxed font-medium">
                    {isBn
                      ? searchResult.cautionMessageBn ||
                        'এই ব্যক্তির বিরুদ্ধে আর্থিক লেনদেন সংক্রান্ত প্রতারণার রেকর্ড আছে, তাই যেকোনো আর্থিক লেনদেন থেকে বিরত থাকুন বা সর্বোচ্চ সাবধানতা অবলম্বন করুন।'
                      : searchResult.cautionMessageEn ||
                        'Caution: Fraud complaints have been verified for this contact. Avoid direct payments or financial transactions.'}
                  </p>
                </div>
              </div>

              {/* Records List */}
              <div className="mt-8 space-y-4">
                {searchResult.records.map((record, idx) => (
                  <div
                    key={record.id}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-red-500/30 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-300 font-semibold text-xs">
                          {isBn ? categoryLabelsBn[record.category] || record.category : record.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(record.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {isBn ? `সার্চ কাউন্ট: ${record.searchHitCount} বার` : `Hits: ${record.searchHitCount}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {record.scammerName && (
                        <div>
                          <span className="text-slate-400 text-xs">{isBn ? 'প্রতারকের নাম / ডাকনাম:' : 'Name / Alias:'}</span>
                          <p className="font-semibold text-slate-200">{record.scammerName}</p>
                        </div>
                      )}
                      {record.phone && (
                        <div>
                          <span className="text-slate-400 text-xs">{isBn ? 'মোবাইল নম্বর:' : 'Phone Number:'}</span>
                          <p className="font-semibold font-mono text-amber-300">{record.phone}</p>
                        </div>
                      )}
                      {record.facebookLink && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 text-xs">{isBn ? 'ফেসবুক লিংক:' : 'Facebook Link:'}</span>
                          <a
                            href={record.facebookLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sky-400 hover:underline break-all text-xs font-medium"
                          >
                            <FacebookIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{record.facebookLink}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}
                      {record.amountLost && (
                        <div>
                          <span className="text-slate-400 text-xs">{isBn ? 'ক্ষতির পরিমাণ:' : 'Amount Lost:'}</span>
                          <p className="font-bold text-red-400">৳{record.amountLost.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 text-xs">{isBn ? 'প্রতারণার বিবরণ:' : 'Details:'}</span>
                      <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line mt-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        {record.description}
                      </p>
                    </div>

                    {/* Proof Images Gallery */}
                    {record.proofImages && record.proofImages.length > 0 && (
                      <div className="pt-2">
                        <span className="text-slate-400 text-xs mb-2 block">{isBn ? 'অনুমোদিত প্রমাণ ও স্ক্রিনশট:' : 'Approved Proof Screenshots:'}</span>
                        <div className="flex flex-wrap gap-2">
                          {record.proofImages.map((imgUrl, imgIdx) => (
                            <button
                              key={imgIdx}
                              onClick={() => setActiveProofImage(imgUrl)}
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-700 hover:border-amber-400 transition-all group shrink-0"
                            >
                              <img src={imgUrl} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: SEARCH RESULT NOT FOUND (CLEAN RECORD - SAFE STATE) */}
        {searchResult && !searchResult.found && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-emerald-500/40 p-6 sm:p-8 shadow-[0_12px_40px_rgba(16,185,129,0.12)]">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isBn ? 'রেকর্ড পরিচ্ছন্ন' : 'NO RECORD FOUND'}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {isBn ? 'এই নম্বরের/আইডির অতীতে কোনো প্রতারণার রেকর্ড আমাদের ডাটাবেজে নেই।' : 'No fraudulent record found in our database for this query.'}
                  </h2>

                  {/* Search Query Pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                    <span>{isBn ? 'অনুসন্ধান:' : 'Query:'}</span>
                    <span className="text-amber-400 font-bold">{searchResult.query}</span>
                  </div>

                  {/* Crucial Advisory Warning */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-200/90 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{isBn ? 'বিশেষ সতর্কতা নির্দেশনা:' : 'Important Safety Note:'}</span>
                    </div>
                    <p>
                      {isBn
                        ? searchResult.advisoryNoticeBn ||
                          'আমাদের ডাটাবেজে নাম না থাকার অর্থ এই ব্যক্তি ১০০% সৎ তা নিশ্চিত করে না। নতুন বা অপরিচিত কাউকে সরাসরি বিকাশ/নগদে টাকা পাঠাবেন না। যেকোনো লেনদেন ১০০% সুরক্ষিত রাখতে সবসময় SafnexBD এসক্রো ব্যবহার করুন।'
                        : searchResult.advisoryNoticeEn ||
                          'A clean search does not guarantee complete trustworthiness. Never send money in advance to unverified contacts. Always use SafnexBD Escrow.'}
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      href={user ? '/dashboard' : '/register'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isBn ? 'SafnexBD এসক্রো দিয়ে নিরাপদ লেনদেন করুন' : 'Start Safe Escrow Deal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={handleOpenReport}
                      className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 font-medium"
                    >
                      {isBn ? 'তবুও এই নম্বরের বিরুদ্ধে রিপোর্ট করতে চান?' : 'Want to report this contact anyway?'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEFAULT STATE: Informative Cards when no search performed yet */}
        {!searchResult && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white">{isBn ? 'দ্রুত নম্বর ও লিংক যাচাই' : 'Instant Search'}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isBn
                    ? 'যেকোনো মোবাইল নম্বর বা ফেসবুক পেজ লিংক লিখলেই অতীতে কোনো রিপোর্ট ছিল কিনা তা চোখের পলকে দেখতে পাবেন।'
                    : 'Check any mobile number or Facebook link instantly against our verified fraud registry.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">{isBn ? 'অ্যাডমিন ভেরিফাইড প্রুফ' : 'Admin Verified'}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isBn
                    ? 'কোনো নিরপরাধ মানুষ যেন হেনস্তা না হয়, তাই প্রতিটি রিপোর্ট অ্যাডমিন নিজ হাতে স্ক্রিনশট ও প্রমাণ দেখে অনুমোদন করেন।'
                    : 'Zero false defamation: Every allegation is manually checked by administrators before public listing.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-base font-bold text-white">{isBn ? 'রিপোর্টারের পরিচয় গোপন' : '100% Confidential'}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isBn
                    ? 'আপনি কার বিরুদ্ধে রিপোর্ট করেছেন তা সাধারণ মানুষের কাছে কখনোই প্রকাশ করা হবে না (শুধু অ্যাডমিন জানবে)।'
                    : 'Reporter identity is strictly confidential and never displayed to public search visitors.'}
                </p>
              </div>
            </div>

            {/* Golden Safety Rules Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>{isBn ? 'অনলাইনে কেনাবেচায় নিরাপদ থাকার ৫টি সোনালী নিয়ম' : '5 Golden Rules for Online Safety'}</span>
              </h3>
              <ul className="text-xs sm:text-sm text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                <li>{isBn ? 'অচেনা কাউকে কখনো বিকাশ বা নগদে পুরো টাকা অগ্রিম পাঠাবেন না।' : 'Never send full payment in advance to strangers.'}</li>
                <li>{isBn ? 'অতিরিক্ত কম দামে প্রলোভন দেখালে আগে সতর্ক হোন (যেমন: অর্ধেক দামে আইফোন বা আইডি)।' : 'Be cautious of deals that seem too good to be true.'}</li>
                <li>{isBn ? 'লেনদেনের আগে সেলারের মোবাইল নম্বর ও ফেসবুক লিংক আমাদের চেকারে যাচাই করে নিন।' : 'Always verify seller phone and Facebook links before payment.'}</li>
                <li>{isBn ? 'সবচেয়ে নিরাপদ থাকতে সবসময় SafnexBD এসক্রো ডিল ব্যবহার করুন (পণ্য না পাওয়া পর্যন্ত সেলার টাকা পাবে না)।' : 'Use SafnexBD Escrow for 100% buyer-seller guarantee.'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: AUTHENTICATION PROMPT (FOR NON-LOGGED-IN VISITORS) */}
      {authPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setAuthPromptOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {isBn ? 'রিপোর্ট করতে লগইন বা রেজিস্ট্রেশন আবশ্যক' : 'Registration Required to Report'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isBn
                  ? 'শত্রুতা, ভুয়া অভিযোগ বা নিরপরাধ মানুষের মানহানি রোধ করতে SafnexBD-তে রিপোর্ট করতে অ্যাকাউন্ট থাকা বাধ্যতামূলক। তবে আপনার পরিচয় সাধারণ মানুষের কাছে ১০০% গোপন থাকবে।'
                  : 'To prevent false allegations and defamation, registration is mandatory. Your personal identity remains strictly confidential.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/register"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isBn ? '🚀 ফ্রি একাউন্ট খুলুন (রেজিস্ট্রেশন)' : 'Create Free Account'}</span>
              </Link>

              <Link
                href="/login"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
              >
                <span>{isBn ? '🔑 আগের একাউন্টে লগইন করুন' : 'Log In to Existing Account'}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REPORT SUBMISSION FORM (LOGGED-IN USERS) */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isBn ? 'প্রতারকের বিরুদ্ধে রিপোর্ট দাখিল করুন' : 'Submit Fraud Complaint'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn ? 'আপনার পরিচয় গোপন থাকবে (শুধুমাত্র অ্যাডমিন দেখতে পাবে)' : 'Reporter identity is confidential'}
                </p>
              </div>
            </div>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-emerald-300">{isBn ? 'রিপোর্টটি সফলভাবে জমা হয়েছে!' : 'Report Submitted Successfully!'}</h4>
                <p className="text-xs text-slate-300">
                  {isBn
                    ? 'অ্যাডমিন প্যানেল থেকে প্রমাণের সত্যতা যাচাই করে দ্রুত ডাটাবেজে অন্তর্ভুক্ত করা হবে। ধন্যবাদ।'
                    : 'Administrators will verify the proof and list the scammer upon review.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs sm:text-sm">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {isBn ? 'প্রতারকের মোবাইল / বিকাশ / নগদ নম্বর' : 'Scammer Mobile / bKash / Nagad Number'}
                  </label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="e.g. 01712345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {isBn ? 'প্রতারকের ফেসবুক প্রোফাইল বা পেজ লিংক' : 'Scammer Facebook Profile or Page URL'}
                  </label>
                  <input
                    type="text"
                    value={targetFacebook}
                    onChange={(e) => setTargetFacebook(e.target.value)}
                    placeholder="e.g. https://facebook.com/scammer.profile"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      {isBn ? 'প্রতারকের নাম / ডাকনাম (ঐচ্ছিক)' : 'Scammer Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      placeholder="e.g. Rahim / Fake Shop"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      {isBn ? 'টাকার পরিমাণ (যদি প্রযোজ্য)' : 'Amount Lost (BDT)'}
                    </label>
                    <input
                      type="number"
                      value={amountLost}
                      onChange={(e) => setAmountLost(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {isBn ? 'প্রতারণার ধরন' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-amber-400 outline-none"
                  >
                    <option value="TRANSACTION_FRAUD">{isBn ? 'লেনদেন সংক্রান্ত প্রতারণা (টাকা নিয়ে ব্লক)' : 'Transaction Fraud (Money taken & blocked)'}</option>
                    <option value="FAKE_PRODUCT">{isBn ? 'নকল বা পণ্য না দিয়ে যোগাযোগ বিচ্ছিন্ন' : 'Fake Product / Non-delivery'}</option>
                    <option value="ACCOUNT_THEFT">{isBn ? 'ফেসবুক পেজ / আইডি চুরি বা হ্যাকিং' : 'Account Theft / Page Hijack'}</option>
                    <option value="FAKE_SERVICE">{isBn ? 'ভুয়া সেবা / প্রতিশ্রুতি ভঙ্গ' : 'Fake Service'}</option>
                    <option value="OTHER">{isBn ? 'অন্যান্য প্রতারণা' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {isBn ? 'প্রতারণার বিস্তারিত বিবরণ (কী ঘটেছে)' : 'Incident Description'} *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isBn
                        ? 'কীভাবে প্রতারণা ঘটেছে, কী প্রতিশ্রুতি দিয়ে টাকা নিয়েছে এবং কখন ব্লক করেছে বিস্তারিত লিখুন...'
                        : 'Describe what happened, how money was taken, and when they blocked you...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-amber-400 outline-none"
                    required
                  />
                </div>

                {/* Proof Screenshots Upload */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {isBn ? 'প্রমাণের স্ক্রিনশট (চ্যাট হিস্ট্রি / পেমেন্ট স্লিপ - সর্বোচ্চ ৫টি)' : 'Proof Screenshots (Max 5)'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {proofImages.map((url, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700">
                        <img src={url} alt="Proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProofImages(proofImages.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-600 text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {proofImages.length < 5 && (
                      <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-700 hover:border-amber-400 flex flex-col items-center justify-center text-slate-400 hover:text-amber-400 cursor-pointer transition-colors">
                        <UploadCloud className="w-5 h-5" />
                        <span className="text-[9px] mt-0.5">{isUploading ? '...' : '+ ছবি'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Confidentiality Notice */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isBn
                      ? 'আপনার নাম ও যোগাযোগের তথ্য সাধারণ পাবলিক দেখতে পাবে না। এটি শুধুমাত্র অ্যাডমিনের কাছে সংরক্ষিত থাকবে।'
                      : 'Your name and contact details are kept strictly private from public search.'}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'রিপোর্ট দাখিল করুন' : 'Submit Report')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: FULLSCREEN IMAGE LIGHTBOX */}
      {activeProofImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setActiveProofImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={activeProofImage} alt="Proof Fullscreen" className="max-w-full max-h-[85vh] rounded-xl object-contain border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}
