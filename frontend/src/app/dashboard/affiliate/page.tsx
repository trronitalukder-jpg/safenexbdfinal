'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  TrendingUp,
  Award,
  Sparkles,
  HelpCircle,
  MessageCircle,
  Send,
  Globe,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Calculator,
  Download,
  QrCode,
  Image as ImageIcon,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function AffiliateDashboardPage() {
  const { lang } = useLanguage();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTemplateIdx, setCopiedTemplateIdx] = useState<number | null>(null);

  const [affiliateData, setAffiliateData] = useState<{
    referralCode: string;
    totalReferrals: number;
    totalEarned: number;
    referrals: Array<{ id: string; uniqueUserId: string; name: string; joinedAt: string }>;
    recentRewards: Array<{ id: string; sourceType: string; amount: number; fromUser: string; createdAt: string }>;
  }>({
    referralCode: '',
    totalReferrals: 0,
    totalEarned: 0,
    referrals: [],
    recentRewards: [],
  });

  const [calcReferrals, setCalcReferrals] = useState(20);
  const [calcAvgFee, setCalcAvgFee] = useState(150);

  // Fetch Affiliate Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res: any = await api.get('/affiliate/my-stats');
        const data = res?.data !== undefined ? res.data : res;
        if (data) {
          setAffiliateData(data);
        }
      } catch (err) {
        console.error('Failed to load affiliate stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const referralCode = affiliateData.referralCode || user?.uniqueUserId || user?.id || '';
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://safnexbd.com';
  const referralLink = `${siteUrl}/register?ref=${referralCode}`;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [posterLoaded, setPosterLoaded] = useState(false);

  const shareUrls = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`🔥 ঘরে বসেই কাজ করে প্রতিদিন আয় করুন SafnexBD-তে! নিরাপদ এসক্রো ও মাইক্রো জব প্ল্যাটফর্ম।\n\nআমার রেফারেল লিংক: ${referralLink}\nরেফারেল কোড: ${referralCode}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`🔥 ঘরে বসেই কাজ করে প্রতিদিন আয় করুন SafnexBD-তে! রেফারেল কোড: ${referralCode}`)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`🔥 ঘরে বসেই কাজ করে প্রতিদিন আয় করুন SafnexBD-তে! রেফারেল কোড: ${referralCode}`)}`,
  };

  const generatePoster = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1000;

    // Background Gradient (Deep rich dark theme with subtle navy)
    const bg = ctx.createLinearGradient(0, 0, 800, 1000);
    bg.addColorStop(0, '#090d16');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 1000);

    // Decorative Glowing Orbs
    const glow1 = ctx.createRadialGradient(680, 120, 10, 680, 120, 280);
    glow1.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 800, 500);

    const glow2 = ctx.createRadialGradient(120, 880, 10, 120, 880, 280);
    glow2.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 500, 800, 500);

    // Border Frame
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 3;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(25, 25, 750, 950, 24);
      ctx.stroke();
    } else {
      ctx.strokeRect(25, 25, 750, 950);
    }

    // Brand Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText('⚡ SAFNEX BD', 400, 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 15px "Segoe UI", sans-serif';
    ctx.fillText('Bangladesh Trusted P2P Escrow & Micro-Job Marketplace', 400, 138);

    // Main Catchy Heading
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText('ঘরে বসেই কাজ করে আয় করুন!', 400, 225);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText('১০০% নিরাপদ কেনাবেচা ও ইনস্ট্যান্ট পেমেন্ট', 400, 268);

    // Feature highlights box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(75, 310, 650, 200, 20);
      ctx.fill();
    } else {
      ctx.fillRect(75, 310, 650, 200);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 19px "Segoe UI", sans-serif';
    ctx.fillText('✔ প্রতিদিন সহজ সহজ মাইক্রো টাস্ক সম্পন্ন করে আয়', 115, 360);
    ctx.fillText('✔ ফেসবুক, ইউটিউব, অ্যাপ ডাউনলোড ও রিভিউ কাজ', 115, 410);
    ctx.fillText('✔ বিকাশ, নগদ ও রকেটে দ্রুত টাকা উইথড্র সুবিধা', 115, 460);

    // Big Referral Code Card
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(130, 545, 540, 105, 20);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillRect(130, 545, 540, 105);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 15px "Segoe UI", sans-serif';
    ctx.fillText('রেফারেল কোড ব্যবহার করে ফ্রি বোনাস নিন:', 400, 578);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Segoe UI", monospace';
    ctx.fillText(referralCode || 'SAFNEXBD', 400, 626);

    // QR Code Image
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(referralLink)}`;
    qrImg.onload = () => {
      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(310, 680, 180, 180, 16);
        ctx.fill();
      } else {
        ctx.fillRect(310, 680, 180, 180);
      }
      ctx.drawImage(qrImg, 310, 680, 180, 180);

      // Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('মোবাইল ক্যামেরা দিয়ে স্ক্যান করে এখনই যুক্ত হোন', 400, 895);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('safnexbd.com', 400, 925);

      setPosterLoaded(true);
    };
    qrImg.src = qrSrc;
  }, [referralCode, referralLink]);

  useEffect(() => {
    if (!loading && referralCode) {
      generatePoster();
    }
  }, [loading, referralCode, generatePoster]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `safnexbd-referral-${referralCode || 'invite'}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyTemplate = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplateIdx(idx);
    setTimeout(() => setCopiedTemplateIdx(null), 2500);
  };

  // Ready-made marketing message templates for user to copy/share
  const promoTemplates = [
    {
      title: lang === 'bn' ? '🚀 সোশ্যাল মিডিয়া পোস্ট (Facebook / Group)' : '🚀 Social Media Post (Facebook / Group)',
      text: lang === 'bn'
        ? `বাংলাদেশে যেকোনো ডিজিটাল ও ফিজিক্যাল প্রোডাক্ট বা ডলার-টাকা লেনদেনের সবচেয়ে নিরাপদ মাধ্যম SafnexBD Escrow! 🛡️ প্রতারণামুক্ত ডিল করুন সম্পূর্ণ নিরাপদে। এখনই আমার রেফারে জয়েন করে ফ্রি একাউন্ট খুলুন:\n👉 ${referralLink}`
        : `Looking for a 100% safe escrow marketplace in Bangladesh? Join SafnexBD for safe buyer-seller transactions with zero scam risk! Register now:\n👉 ${referralLink}`,
    },
    {
      title: lang === 'bn' ? '💬 হোয়াটসঅ্যাপ ও মেসেঞ্জার ইনবক্স মেসেজ' : '💬 WhatsApp & Messenger Direct Message',
      text: lang === 'bn'
        ? `দোস্ত, অনলাইনে ডিজিটাল প্রোডাক্ট, সার্ভিস বা লেনদেন করার সময় প্রতারণা থেকে বাঁচতে SafnexBD এসক্রো ব্যবহার করো। কাজ বা প্রোডাক্ট হাতে পাওয়ার পর টাকা রিলিজ হয়। সাইন আপ লিংক:\n👉 ${referralLink}`
        : `Hey! Check out SafnexBD for safe escrow transactions in BD. Your money stays 100% protected until satisfaction. Sign up here:\n👉 ${referralLink}`,
    },
  ];

  // Estimated passive earning calculation
  const estimatedEarning = Math.round(calcReferrals * (calcAvgFee * 0.2) * 2); // 2 transactions per referral * 20% of fee

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Motivational Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-rose-600 p-6 sm:p-10 text-white shadow-xl shadow-amber-500/10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>{lang === 'bn' ? 'লাইফটাইম রেফারেল প্রোগ্রাম' : 'Lifetime Referral Program'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black leading-tight">
            {lang === 'bn'
              ? 'বন্ধুদের রেফার করুন, প্রতি লেনদেনে ঘরে বসেই আয় করুন!'
              : 'Refer Friends & Earn Passive Income on Every Deal!'}
          </h1>

          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
            {lang === 'bn'
              ? 'আপনার রেফারেল লিংক দিয়ে যে কেউ একাউন্ট খুলে লেনদেন বা রিচার্জ করলেই আপনি পাবেন নিশ্চিত কমিশন। যত বেশি রেফার করবেন, তত বেশি আজীবন প্যাসিভ ইনকাম!'
              : 'Whenever your referred friends trade or deposit on SafnexBD, you earn a handsome commission automatically credited to your wallet balance.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-5 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-900 font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? (lang === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!') : (lang === 'bn' ? 'রেফারেল লিংক কপি করুন' : 'Copy Referral Link')}</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`SafnexBD নিরাপদ এসক্রো মার্কেটপ্লেসে যুক্ত হোন: ${referralLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('SafnexBD নিরাপদ এসক্রো মার্কেটপ্লেসে যুক্ত হোন')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-12 bottom-0 w-64 h-64 rounded-full bg-rose-400/20 blur-xl pointer-events-none" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Referrals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : affiliateData.totalReferrals}
          </div>
          <div className="text-xs font-bold text-slate-500">
            {lang === 'bn' ? 'মোট রেফারেল সংখ্যা' : 'Total Referred Users'}
          </div>
        </div>

        {/* Total Earned */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            ৳ {loading ? '...' : affiliateData.totalEarned.toLocaleString()}
          </div>
          <div className="text-xs font-bold text-slate-500">
            {lang === 'bn' ? 'মোট উপার্জিত কমিশন' : 'Total Commission Earned'}
          </div>
        </div>

        {/* Wallet Status */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>ইনস্ট্যান্ট</span>
            <span className="text-xs font-normal text-slate-400">ক্রেডিট</span>
          </div>
          <div className="text-xs font-bold text-slate-500">
            {lang === 'bn' ? 'সরাসরি ওয়ালেট ব্যালেন্সে যোগ হয়' : 'Directly added to Main Wallet'}
          </div>
        </div>
      </div>

      {/* Share Box & Referral Code Details */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-amber-500" />
          <span>{lang === 'bn' ? 'আপনার ব্যক্তিগত রেফারেল লিংক ও কোড' : 'Your Personal Referral Link & Code'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Link Box */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {lang === 'bn' ? 'রেফারেল লিংক (বন্ধুদের এই লিংক দিন)' : 'Referral Link (Share this with friends)'}
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Referral Code Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {lang === 'bn' ? 'রেফারেল কোড' : 'Referral Code'}
            </label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="flex-1 text-center font-mono font-black text-sm text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                {referralCode || '...'}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click Social Media Share Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2.5">
            {lang === 'bn' ? '⚡ ১-ক্লিকে সোশ্যাল মিডিয়ায় বন্ধুদের সাথে শেয়ার করুন:' : '⚡ 1-Click Share on Social Media:'}
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
            >
              <span>💬 WhatsApp</span>
            </a>
            <a
              href={shareUrls.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition"
            >
              <span>🌐 Facebook</span>
            </a>
            <a
              href={shareUrls.telegram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-xs transition"
            >
              <span>✈️ Telegram</span>
            </a>
            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shadow-xs transition"
            >
              <span>✖️ X (Twitter)</span>
            </a>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-500/30 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? (lang === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!') : (lang === 'bn' ? 'কপি লিংক' : 'Copy Link')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🎨 Visual Referral Poster Generator (HTML5 Canvas) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900/10 border border-amber-500/20 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              <span>{lang === 'bn' ? '🎨 আকর্ষণীয় প্রমোশনাল পোস্টার কিট (HD Referral Poster)' : '🎨 HD Referral Marketing Poster Kit'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'আপনার নিজস্ব রেফারেল কিউআর কোডসহ হাই-রেজোলিউশন পোস্টার তৈরি হয়েছে। ডাউনলোড করে ফেসবুক বা ইনস্টাগ্রামে পোস্ট করুন!'
                : 'High-resolution promotional banner generated with your personal referral QR code. Download and share!'}
            </p>
          </div>

          <button
            onClick={handleDownloadPoster}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'bn' ? 'পোস্টার ডাউনলোড করুন (PNG)' : 'Download Poster (PNG)'}</span>
          </button>
        </div>

        {/* Poster Canvas Preview Card */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          <div className="relative max-w-xs w-full rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20">
            <canvas ref={canvasRef} className="w-full h-auto block" />
            {!posterLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-white text-xs font-semibold">
                পোস্টার তৈরি হচ্ছে...
              </div>
            )}
          </div>

          <div className="space-y-3 max-w-sm text-xs">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-300 space-y-1.5">
              <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>অটোমেটিক কিউআর কোড স্ক্যানার</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                যে কেউ এই পোস্টারের কিউআর কোড মোবাইল দিয়ে স্ক্যান করলে সাথে সাথে আপনার রেফারেল লিংকে পৌঁছে যাবে।
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">কোথায় শেয়ার করবেন?</p>
              <ul className="list-disc list-inside text-[11px] space-y-1">
                <li>ফেসবুক আর্নিং গ্রুপ ও পেজ</li>
                <li>টেলিগ্রাম আর্নিং চ্যানেল ও গ্রুপ</li>
                <li>হোয়াটসঅ্যাপ স্টোরি ও ফ্রেন্ড সার্কেল</li>
              </ul>
            </div>

            <button
              onClick={handleDownloadPoster}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs transition border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ডাউনলোড করে শেয়ার করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inspirational Earning Calculator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2 text-amber-400">
              <Calculator className="w-5 h-5" />
              <span>{lang === 'bn' ? '💡 সম্ভাব্য প্যাসিভ ইনকাম ক্যালকুলেটর' : '💡 Passive Income Potential Calculator'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'দেখুন অল্প কিছু নিয়মিত ইউজার রেফার করলেই আপনার প্রতি মাসে কেমন আয় হতে পারে!'
                : 'See how much monthly passive income you can generate by referring active traders!'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-right sm:min-w-[200px]">
            <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
              {lang === 'bn' ? 'আনুমানিক মাসিক ইনকাম' : 'Estimated Monthly Income'}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              ৳ {estimatedEarning.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Slider 1: Active Referrals */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">{lang === 'bn' ? 'সক্রিয় রেফারেল সংখ্যা:' : 'Active Referrals:'}</span>
              <span className="text-amber-400 font-mono text-sm">{calcReferrals} জন</span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={calcReferrals}
              onChange={(e) => setCalcReferrals(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>৫ জন</span>
              <span>১০০ জন</span>
              <span>২০০ জন</span>
            </div>
          </div>

          {/* Slider 2: Average Fee per Deal */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">{lang === 'bn' ? 'গড় লেনদেনের ফি:' : 'Avg Platform Fee:'}</span>
              <span className="text-amber-400 font-mono text-sm">৳ {calcAvgFee}</span>
            </div>
            <input
              type="range"
              min={50}
              max={1000}
              step={50}
              value={calcAvgFee}
              onChange={(e) => setCalcAvgFee(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>৳ ৫০</span>
              <span>৳ ৫০০</span>
              <span>৳ ১,০০০</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ready-to-use Marketing Message Templates */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-sky-500" />
            <span>{lang === 'bn' ? '📋 প্রস্তুত করা প্রমোশন মেসেজ (এক ক্লিকে কপি করুন)' : '📋 Ready-made Promo Messages (Click to Copy)'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'bn'
              ? 'আপনাকে নিজে কিছু লিখতে হবে না। নিচের যেকোনো লেখা কপি করে ফেসবুক গ্রুপ, পেজ বা বন্ধুদের মেসেঞ্জারে শেয়ার করুন।'
              : 'You do not need to write anything yourself. Just copy these ready messages and share on Facebook or messaging apps.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {promoTemplates.map((tpl, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {tpl.title}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {tpl.text}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyTemplate(tpl.text, idx)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition hover:opacity-90 cursor-pointer"
              >
                {copiedTemplateIdx === idx ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'bn' ? 'মেসেজ কপি হয়েছে!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'মেসেজ কপি করুন' : 'Copy Message'}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History & Earnings Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Referrals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500" />
            <span>{lang === 'bn' ? 'আপনার রেফার করা ব্যবহারকারী' : 'Your Referred Users'}</span>
            <span className="text-xs font-normal text-slate-400">({affiliateData.referrals.length})</span>
          </h3>

          {affiliateData.referrals.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Gift className="w-8 h-8 text-slate-300 mx-auto" />
              <p>{lang === 'bn' ? 'এখনো কোনো রেফারেল নেই। আপনার লিংক শেয়ার করে শুরু করুন!' : 'No referrals yet. Share your link to start earning!'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {affiliateData.referrals.map((ref) => (
                <div key={ref.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {ref.name || 'User'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      @{ref.uniqueUserId}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(ref.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Commissions Log */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'bn' ? 'অর্জিত কমিশন হিস্ট্রি' : 'Earned Commission Log'}</span>
            <span className="text-xs font-normal text-slate-400">({affiliateData.recentRewards.length})</span>
          </h3>

          {affiliateData.recentRewards.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Coins className="w-8 h-8 text-slate-300 mx-auto" />
              <p>{lang === 'bn' ? 'আপনার রেফারেলরা লেনদেন সম্পন্ন করলেই এখানে কমিশন দেখতে পাবেন।' : 'Commissions will appear here when your referrals complete deals.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {affiliateData.recentRewards.map((rw) => (
                <div key={rw.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="text-emerald-500">+৳ {rw.amount}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        rw.sourceType === 'MICRO_JOB'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          : rw.sourceType === 'RECHARGE'
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {rw.sourceType === 'MICRO_JOB'
                          ? (lang === 'bn' ? 'মাইক্রো জব' : 'Micro Job')
                          : rw.sourceType === 'RECHARGE'
                          ? (lang === 'bn' ? 'রিচার্জ' : 'Recharge')
                          : (lang === 'bn' ? 'লেনদেন' : 'Transaction')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      User: @{rw.fromUser}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(rw.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

