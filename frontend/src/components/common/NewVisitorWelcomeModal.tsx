'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  X,
  Sparkles,
  Gift,
  ShieldCheck,
  Zap,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStore } from '@/store/useAuthStore';

export default function NewVisitorWelcomeModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();
  const { user } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If user is already logged in or on register/login page, don't show
    if (user || pathname?.startsWith('/register') || pathname?.startsWith('/login') || pathname?.startsWith('/admin')) {
      return;
    }

    const popupEnabled = settings?.system?.newVisitorPopupEnabled !== false;
    if (!popupEnabled) return;

    // Check if dismissed in this session
    if (typeof window !== 'undefined') {
      const isDismissed = sessionStorage.getItem('safnex_welcome_modal_dismissed');
      if (isDismissed) return;

      const delaySec = Math.max(0, settings?.system?.newVisitorPopupDelaySeconds ?? 3);
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delaySec * 1000);

      // Auto-close timer if configured > 0
      const autoCloseSec = settings?.system?.newVisitorPopupAutoCloseSeconds ?? 0;
      let closeTimer: NodeJS.Timeout | null = null;
      if (autoCloseSec > 0) {
        closeTimer = setTimeout(() => {
          setIsOpen(false);
          sessionStorage.setItem('safnex_welcome_modal_dismissed', 'true');
        }, (delaySec + autoCloseSec) * 1000);
      }

      return () => {
        clearTimeout(timer);
        if (closeTimer) clearTimeout(closeTimer);
      };
    }
  }, [user, pathname, settings?.system]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('safnex_welcome_modal_dismissed', 'true');
    }
  };

  const handleRegisterClick = () => {
    handleDismiss();
    const targetUrl = settings?.system?.newVisitorPopupCtaUrl || '/register';
    router.push(targetUrl);
  };

  if (!isOpen) return null;

  const title =
    settings?.system?.newVisitorPopupTitle || 'ফ্রি রেজিস্ট্রেশন করে আজই আয় শুরু করুন!';
  const message =
    settings?.system?.newVisitorPopupMessage ||
    'নিরাপদ ট্রানজেকশনে প্রোডাক্ট কেনাবেচা করুন এবং সহজ মাইক্রো-টাস্ক সম্পন্ন করে বিকাশ/নগদে ঘরে বসেই আয় করুন।';
  const ctaText =
    settings?.system?.newVisitorPopupCtaText || '🚀 এখনই ফ্রি রেজিস্ট্রেশন করুন';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-sky-500/40 shadow-2xl shadow-sky-500/20 overflow-hidden animate-in zoom-in-95 duration-300 text-slate-100">
        {/* Glow Radial Highlights */}
        <div className="absolute -top-24 -left-24 w-56 h-56 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Header Banner */}
        <div className="relative p-6 pt-7 text-center border-b border-slate-800/80 bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-purple-950/40">
          {/* Dismiss Cross Button */}
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700/60 shadow"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-sky-500/30 border-2 border-white/20 mb-3 relative animate-bounce duration-1000">
            <Gift className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center text-[10px] font-bold text-slate-950">
              ✓
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-sky-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>বিশেষ স্বাগতম অফার • ১০০% ফ্রি জয়েনিং</span>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
            {title}
          </h2>
          <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {/* Body Value Propositions */}
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1.5 font-bold">
                ৳
              </div>
              <span className="font-bold text-white text-[11px]">দৈনিক আয়</span>
              <span className="text-[10px] text-slate-400 mt-0.5">মাইক্রো-জব ও টাস্ক</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-1.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-[11px]">১০০% নিরাপদ</span>
              <span className="text-[10px] text-slate-400 mt-0.5">অটোমেটেড এসক্রো</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-1.5">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-[11px]">ইনস্ট্যান্ট উইথড্র</span>
              <span className="text-[10px] text-slate-400 mt-0.5">বিকাশ, নগদ ও রকেট</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={handleRegisterClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-white transition-colors"
            >
              এখন নয়, পরে দেখব
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
