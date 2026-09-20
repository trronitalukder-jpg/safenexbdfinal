'use client';

import React from 'react';
import { Bell, X, Check, ShieldCheck, Zap } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';

export const NotificationPromptBanner: React.FC = () => {
  const { user } = useAuthStore();
  const { permission, requestPermission, isBannerDismissed, dismissBanner } = useNotification();
  const { lang } = useLanguage();

  // Only prompt logged-in users whose browser permission has not been decided yet
  if (!user || permission !== 'default' || isBannerDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99990] max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-sky-500/30 dark:border-sky-500/20 shadow-2xl p-4 sm:p-5 text-xs text-slate-900 dark:text-white space-y-3 relative overflow-hidden backdrop-blur-md">
        {/* Glow background accent */}
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-sky-500/10 blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                {lang === 'bn' ? 'ব্রাউজার নোটিফিকেশন অন করুন' : 'Enable Live Notifications'}
              </div>
              <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                {lang === 'bn' ? 'মেসেজ ও উইথড্র অ্যালার্ট সাথে সাথে পান' : 'Instant chat & withdrawal updates'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissBanner}
            title={lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          {lang === 'bn'
            ? 'ট্যাব বন্ধ থাকলেও নতুন কোনো চ্যাট মেসেজ এলে এবং টাকা উত্তোলন সফল হলে আপনার ফোন বা কম্পিউটারে সাথে সাথে নোটিফিকেশন চলে যাবে।'
            : 'Get instant phone and desktop notifications whenever a buyer messages you or your withdrawal is processed.'}
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={requestPermission}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নোটিফিকেশন অন করুন' : 'Enable Notifications'}</span>
          </button>

          <button
            type="button"
            onClick={dismissBanner}
            className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
          >
            {lang === 'bn' ? 'পরে করব' : 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
};

