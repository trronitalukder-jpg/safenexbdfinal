'use client';

import React from 'react';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Bell,
  X,
  Share2,
  PlusSquare,
  CheckCircle2,
} from 'lucide-react';
import { usePwa } from '@/context/PwaContext';
import { useLanguage } from '@/context/LanguageContext';

export const InstallPromptModal: React.FC = () => {
  const { isInstallModalOpen, isIos, closeInstallModal, installApp, isInstalled } = usePwa();
  const { lang } = useLanguage();

  if (!isInstallModalOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Decorative Banner */}
        <div className="h-28 bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 relative overflow-hidden flex items-center justify-center">
          {/* Subtle geometric circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-sm pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-black/10 blur-sm pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={() => closeInstallModal(true)}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Floating App Icon Badge */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-xl border-2 border-white dark:border-slate-800">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md relative overflow-hidden">
                <ShieldCheck className="w-9 h-9" />
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-11 p-6 text-center space-y-4 text-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-extrabold text-[10px] tracking-wide mb-1.5 border border-sky-500/20">
              <Smartphone className="w-3 h-3" />
              <span>OFFICIAL PWA APP</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'SafnexBD অ্যাপ ইনস্টল করুন' : 'Install SafnexBD App'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              {lang === 'bn'
                ? 'ব্রাউজারে বারবার ওয়েবসাইট না লিখে হোম স্ক্রিন থেকে ১-ট্যাপে সরাসরি ব্যবহার করুন।'
                : 'Enjoy faster access, instant alerts, and smooth escrow trading directly from your home screen.'}
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="space-y-2 text-left bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                  {lang === 'bn' ? 'দ্রুত ও মসৃণ অভিজ্ঞতা' : 'Lightning Fast Access'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  {lang === 'bn' ? 'ব্রাউজার ছাড়াই ইনস্ট্যান্ট লোড হবে ও ব্যাটারি বাঁচাবে।' : 'Launches instantly without browser address bars.'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                  {lang === 'bn' ? 'লাইভ চ্যাট ও অর্ডার অ্যালার্ট' : 'Instant Trade Notifications'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  {lang === 'bn' ? 'ট্রেডার ও বায়ারের মেসেজের সাথে সাথে পুশ নোটিফিকেশন।' : 'Never miss an escrow payment or buyer message.'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                  {lang === 'bn' ? '১০০% নিরাপদ ও সুরক্ষিত' : 'Secure & Encrypted'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  {lang === 'bn' ? 'ফুল-স্ক্রিন অ্যাপ মোডে সুরক্ষিত এসক্রো ট্রানজ্যাকশন।' : 'Encrypted sandbox storage for maximum account security.'}
                </div>
              </div>
            </div>
          </div>

          {/* iOS Safari Instructions vs Native Install Button */}
          {isIos ? (
            <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-left space-y-2">
              <div className="font-bold text-sky-900 dark:text-sky-300 text-[11px] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>{lang === 'bn' ? 'আইফোন / আইপ্যাডে ইনস্টল করার নিয়ম:' : 'How to install on iOS Safari:'}</span>
              </div>
              <ol className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">1</span>
                  <span>
                    Safari ব্রাউজারের নিচে <strong>Share</strong> বোতাম (
                    <Share2 className="w-3 h-3 inline text-sky-600 mx-0.5" />
                    ) ট্যাপ করুন।
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">2</span>
                  <span>
                    তালিকায় স্ক্রল করে <strong>Add to Home Screen</strong> (
                    <PlusSquare className="w-3 h-3 inline text-sky-600 mx-0.5" />
                    ) সিলেক্ট করুন।
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => closeInstallModal(true)}
                className="w-full mt-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition"
              >
                {lang === 'bn' ? 'বুঝেছি (Close)' : 'Got it!'}
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={installApp}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'bn' ? 'অ্যাপ ইনস্টল করুন (Install Now)' : 'Install App Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => closeInstallModal(true)}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold text-[11px] transition"
              >
                {lang === 'bn' ? 'এখনই নয়, পরে করব' : 'Maybe Later'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

