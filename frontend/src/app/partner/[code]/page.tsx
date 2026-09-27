'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Eye,
  Coins,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Download,
  Clock,
  Sparkles,
  ExternalLink,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function PromoterPortalPage({ params }: PageProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const resolvedParams = use(params);
  const code = resolvedParams.code;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!code || !token) {
      setError('প্রমোটার সিক্রেট ভিউ টোকেন পাওয়া যায়নি');
      setLoading(false);
      return;
    }

    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const res: any = await api.get(`/promotions/portal/${encodeURIComponent(code)}?token=${encodeURIComponent(token)}`);
        const data = res?.data !== undefined ? res.data : res;
        setPortalData(data);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'পোর্টাল লোড করা সম্ভব হয়নি');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [code, token]);

  const shareableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${code}`
    : `https://safnexbd.com/r/${code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
        <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-white">প্রমোটার ড্যাশবোর্ড লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white mb-2">পোর্টাল অ্যাক্সেস অস্বীকৃত</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          {error || 'প্রমোশন লিংকটি অবৈধ বা সিকিউরিটি টোকেন সঠিক নয়। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।'}
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-500 transition shadow-md"
        >
          হোম পেজে যান
        </Link>
      </div>
    );
  }

  const { campaign, stats, recentSignups } = portalData;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {campaign.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ভেরিফাইড পার্টনার
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                প্রোমোটার: <span className="text-slate-200 font-semibold">{campaign.promoterName || 'পার্টনার'}</span>
                {campaign.promoterChannel && (
                  <span className="ml-2 text-sky-400">({campaign.promoterChannel})</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'লিংক কপি হয়েছে!' : 'প্রমোশন লিংক কপি করুন'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="QR কোড ডাউনলোড"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shareable Link Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 border border-sky-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <span className="px-2 py-1 rounded-md bg-sky-500/20 text-sky-400 font-bold uppercase text-[10px] shrink-0">
              আপনার লিংক
            </span>
            <span className="text-slate-300 font-mono font-semibold truncate select-all">
              {shareableUrl}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] shrink-0">
            📌 এই লিংকের মাধ্যমে যেকেউ যুক্ত হলে স্বয়ংক্রিয়ভাবে আপনার হিসেবে যোগ হবে
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Visitors */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>মোট ভিজিটর</span>
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stats.clicksCount}
              </span>
              <span className="text-[11px] text-slate-400">
                ({stats.uniqueVisitorsCount} ইউনিক)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">লিংক ক্লিক করেছেন</p>
          </div>

          {/* Total Signups */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>রেজিস্ট্রেশন সংখ্যা</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {stats.signupsCount}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                জন ইউজার
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">সফলভাবে একাউন্ট খুলেছেন</p>
          </div>

          {/* Audience Transactions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>লেনদেনের পরিমাণ</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                ৳{stats.totalTxnVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              সম্পন্ন ডিল: {stats.completedTxnCount} টি
            </p>
          </div>

          {/* Earnings / Commission */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/30 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold">
              <span>আপনার পাওনা কমিশন</span>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white">
                ৳{stats.pendingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              পরিশোধিত: ৳{stats.paidAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Recent Registrations Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                আপনার মাধ্যমে যুক্ত হওয়া সাম্প্রতিক ইউজারবৃন্দ
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                সর্বমোট {stats.signupsCount} জন ইউজার একাউন্ট তৈরি করেছেন
              </p>
            </div>
          </div>

          {recentSignups && recentSignups.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">ইউজার আইডি</th>
                    <th className="py-2.5 px-3">নাম</th>
                    <th className="py-2.5 px-3">রেজিস্ট্রেশনের তারিখ</th>
                    <th className="py-2.5 px-3 text-right">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentSignups.map((u: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono font-bold text-sky-400">
                        {u.uniqueUserId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {u.firstName}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.isVerified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ভেরিফাইড
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                            অ্যাক্টিভ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              এখনো কোনো ইউজার এই লিংকের মাধ্যমে যুক্ত হননি। আপনার প্রমোশন লিংকটি শেয়ার করুন!
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 py-4">
          SafnexBD Partner Intelligence & Escrow Protection Platform
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">প্রমোশন QR কোড</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার ফেসবুক পোস্ট, ব্যানার বা ভিডিওতে এই QR কোডটি ব্যবহার করুন
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  shareableUrl
                )}`}
                alt="Promotion QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>

            <div className="w-full flex items-center gap-2 pt-2">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                  shareableUrl
                )}`}
                target="_blank"
                rel="noreferrer"
                download={`safnex-qr-${code}.png`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>QR ছবি ডাউনলোড</span>
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
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
