'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  Gift,
  Coins,
  ShieldCheck,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { LuckyWheelModal } from '@/components/lucky-wheel/LuckyWheelModal';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardLuckyWheelPage() {
  const { lang } = useLanguage();
  const { refreshMe } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'bn' ? 'দৈনিক রিওয়ার্ড গেম' : 'Daily Reward Game'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            {lang === 'bn' ? '🎡 লাকি হুইল স্পিন অ্যান্ড উইন' : '🎡 Lucky Wheel: Spin & Win'}
          </h1>
          <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
            {lang === 'bn'
              ? 'প্রতিদিন একটি করে নিশ্চিত ফ্রি স্পিন! হুইল ঘুরিয়ে জিতে নিন তাৎক্ষণিক নগদ ক্যাশ পুরস্কার, যা সরাসরি যুক্ত হবে আপনার ওয়ালেট ব্যালেন্সে।'
              : 'Get 1 free spin every day! Spin the wheel to win instant cash prizes credited directly to your wallet.'}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-sm shadow-lg hover:bg-amber-100 transition active:scale-95 cursor-pointer"
            >
              <span className="text-lg">🎡</span>
              <span>{lang === 'bn' ? 'স্পিন হুইল খুলুন' : 'Open Spin Wheel'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Highlights / Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            {lang === 'bn' ? '২৪ ঘণ্টায় ১টি ফ্রি স্পিন' : '1 Free Spin Every 24 Hours'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'প্রত্যেক ইউজার প্রতিদিন একবার সম্পূর্ণ বিনামূল্যে স্পিন করার সুযোগ পাবেন।'
              : 'Every user gets 1 guaranteed free spin every 24 hours without any recharge.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            {lang === 'bn' ? 'তাৎক্ষণিক ওয়ালেট ক্রেডিট' : 'Instant Wallet Credit'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'ক্যাশ রিওয়ার্ড জিতলে কোনো অপেক্ষা ছাড়াই মুহূর্তে আপনার মূল ওয়ালেট ব্যালেন্সে যোগ হবে।'
              : 'Any won cash is instantly credited to your platform ledger and available balance.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            {lang === 'bn' ? '১০০% স্বচ্ছ ও ফেয়ার' : '100% Fair & Transparent'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'সম্পূর্ণ নিরাপদ ক্রিপ্টোগ্রাফিক অ্যালগরিদমে দৈবচয়নের মাধ্যমে রিওয়ার্ড নির্ধারিত হয়।'
              : 'Every spin is securely generated with tamper-proof random probability rules.'}
          </p>
        </div>
      </div>

      {/* Rules & FAQ Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            {lang === 'bn' ? 'লাকি হুইলের নিয়মাবলী' : 'Rules & Guidelines'}
          </h3>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 list-disc pl-5">
          <li>
            {lang === 'bn'
              ? 'প্রতিদিন বাংলাদেশ সময় রাত ১২টার পর দৈনিক ফ্রি স্পিন নবায়ন করা হয়।'
              : 'Daily free spin resets every day after 12:00 AM.'}
          </li>
          <li>
            {lang === 'bn'
              ? 'নতুন নিবন্ধিত ইউজাররা তাদের প্রথম স্পিনে বিশেষ স্বাগতম রিওয়ার্ড পাওয়ার সুযোগ পাবেন।'
              : 'Newly registered users may receive exclusive welcome bonuses on their initial spins.'}
          </li>
          <li>
            {lang === 'bn'
              ? 'একজন ইউজার প্রতি মাসে এডমিন কর্তৃক নির্ধারিত মাসিক সর্বোচ্চ সীমা পর্যন্ত ক্যাশ রিওয়ার্ড জিততে পারবেন।'
              : 'Each user can win cash rewards up to the monthly winning cap set by the administration.'}
          </li>
          <li>
            {lang === 'bn'
              ? 'কোনো কারণে ফাঁকা বা "আবার চেষ্টা করুন" আসলে পরের দিন পুনরায় চেষ্টা করতে হবে।'
              : 'If you land on "Try Again", feel free to return tomorrow for another exciting spin.'}
          </li>
        </ul>
      </div>

      {/* Lucky Wheel Modal */}
      <LuckyWheelModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSpinSuccess={() => {
          refreshMe();
        }}
      />
    </div>
  );
}
