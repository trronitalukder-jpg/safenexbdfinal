'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  X,
  ShieldCheck,
  CheckCircle2,
  Gift,
  ArrowRight,
  TrendingUp,
  Coins,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

interface SocialProofEvent {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  type: string;
  avatarText: string;
  timeAgoBn: string;
  timeAgoEn: string;
}

export const SocialProofPopup: React.FC = () => {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { settings } = useSettings();
  const { user } = useAuthStore();

  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<SocialProofEvent | null>(null);
  const [events, setEvents] = useState<SocialProofEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Settings from admin
  const isEnabled = settings?.system?.socialProofEnabled !== false;
  const initialDelay = (settings?.system?.socialProofInitialDelaySeconds ?? 5) * 1000;
  const intervalDelay = (settings?.system?.socialProofIntervalSeconds ?? 25) * 1000;
  const duration = (settings?.system?.socialProofDurationSeconds ?? 8) * 1000;

  // Don't show inside admin, register, or login pages
  const shouldSkipRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/login');

  useEffect(() => {
    if (!isEnabled || shouldSkipRoute) return;

    let isMounted = true;

    // Fetch dynamic events from backend
    const fetchEvents = async () => {
      try {
        const res: any = await api.get('/scammer-reports/social-proof');
        const data = res?.data !== undefined ? res.data : res;
        if (data?.enabled && Array.isArray(data?.events) && data.events.length > 0) {
          if (isMounted) setEvents(data.events);
        }
      } catch {
        // Fallback default events (concise, clear Bangla proofs)
        if (isMounted) {
          setEvents([
            {
              id: '1',
              titleBn: 'ক্যাশআউট সম্পন্ন',
              titleEn: 'Cashout Completed',
              descBn: 'তানভীর আহমেদ (ঢাকা) • ১,৫০০৳ ক্যাশআউট পেয়েছেন (বিকাশ) 🎉',
              descEn: 'Tanvir Ahmed (Dhaka) • Received 1,500৳ via bKash 🎉',
              type: 'CASHOUT',
              avatarText: 'TA',
              timeAgoBn: '২ মিনিট আগে',
              timeAgoEn: '2m ago',
            },
            {
              id: '2',
              titleBn: 'এসক্রো ডিল সম্পন্ন',
              titleEn: 'Escrow Completed',
              descBn: 'রাকিবুল হাসান ও সাইদ • পেজ এসক্রো ডিল সম্পন্ন (৫,০০০৳) 🛡️',
              descEn: 'Rakibul & Sayed • Page escrow completed (5,000৳) 🛡️',
              type: 'ESCROW',
              avatarText: 'RH',
              timeAgoBn: '৪ মিনিট আগে',
              timeAgoEn: '4m ago',
            },
            {
              id: '3',
              titleBn: 'রেফার বোনাস জমা',
              titleEn: 'Referral Bonus',
              descBn: 'নতুন মেম্বার একাউন্ট খুলে ২৫৳ বোনাস পেয়েছেন 🎁',
              descEn: 'New user joined and received 25৳ bonus 🎁',
              type: 'BONUS',
              avatarText: 'NU',
              timeAgoBn: '৭ মিনিট আগে',
              timeAgoEn: '7m ago',
            },
            {
              id: '4',
              titleBn: 'মাইক্রো-জব পেমেন্ট',
              titleEn: 'Micro Job Payout',
              descBn: 'সাদিয়া আক্তার • মাইক্রো জব উইথড্র পেয়েছেন (নগদ) ⚡',
              descEn: 'Sadia Akter • Received micro job payout via Nagad ⚡',
              type: 'JOB',
              avatarText: 'SA',
              timeAgoBn: '১১ মিনিট আগে',
              timeAgoEn: '11m ago',
            },
            {
              id: '5',
              titleBn: 'ডিজিটাল প্রোডাক্ট ডেলিভারি',
              titleEn: 'Digital Product Delivered',
              descBn: 'ফরহাদ হোসেন • গুগল প্লে কোড সফলভাবে পেয়েছেন 🎮',
              descEn: 'Farhad Hossain • Google Play code delivered 🎮',
              type: 'PRODUCT',
              avatarText: 'FH',
              timeAgoBn: '১৫ মিনিট আগে',
              timeAgoEn: '15m ago',
            },
          ]);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [isEnabled, shouldSkipRoute]);

  // Display lifecycle loop
  useEffect(() => {
    if (!isEnabled || shouldSkipRoute || events.length === 0) {
      setVisible(false);
      return;
    }

    const showNext = () => {
      setCurrentEvent((prev) => {
        const nextIdx = (currentIndex + 1) % events.length;
        setCurrentIndex(nextIdx);
        return events[nextIdx];
      });
      setVisible(true);

      // Auto-hide after duration
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, duration);
    };

    // First appearance
    initialTimerRef.current = setTimeout(() => {
      showNext();

      // Recurring appearance
      cycleTimerRef.current = setInterval(() => {
        showNext();
      }, intervalDelay + duration);
    }, initialDelay);

    return () => {
      if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isEnabled, shouldSkipRoute, events, initialDelay, intervalDelay, duration]);

  const handleDismiss = () => {
    setVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  if (!visible || !currentEvent || shouldSkipRoute || !isEnabled) {
    return null;
  }

  const isBn = lang !== 'en'; // Default to Bangla unless explicitly switched to English
  const title = isBn ? currentEvent.titleBn || currentEvent.titleEn : currentEvent.titleEn || currentEvent.titleBn;
  const desc = isBn ? currentEvent.descBn || currentEvent.descEn : currentEvent.descEn || currentEvent.descBn;
  const timeAgo = isBn ? currentEvent.timeAgoBn || currentEvent.timeAgoEn : currentEvent.timeAgoEn || currentEvent.timeAgoBn;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 md:left-6 z-50 max-w-[340px] sm:max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950/95 dark:bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 dark:border-amber-500/20 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.55)] shadow-amber-500/5 group hover:border-amber-500/50 transition-all">
        {/* Subtle ambient gradient */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors z-10"
          title={isBn ? 'বন্ধ করুন' : 'Close'}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3">
          {/* Avatar Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
            {currentEvent.type === 'CASHOUT' ? (
              <Coins className="w-5 h-5 text-amber-400" />
            ) : currentEvent.type === 'ESCROW' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : currentEvent.type === 'BONUS' ? (
              <Gift className="w-5 h-5 text-purple-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-400" />
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 pr-5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                {title}
              </span>
              <span className="text-[10px] text-zinc-500">• {timeAgo}</span>
            </div>

            <p className="text-xs font-medium text-zinc-200 line-clamp-2 leading-relaxed">
              {desc}
            </p>

            {/* Action Bar */}
            <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
              {!user ? (
                <Link
                  href="/register"
                  onClick={handleDismiss}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-[10px] shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Sparkles className="w-3 h-3" />
                  {isBn ? 'রেজিস্ট্রেশন (ফ্রি)' : 'Register Free'}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <Link
                  href="/check"
                  onClick={handleDismiss}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold text-[10px] transition-colors"
                >
                  <ShieldCheck className="w-3 h-3" />
                  {isBn ? 'ট্রাস্ট চেকার' : 'Trust Check'}
                </Link>
              )}

              <span className="text-[10px] text-emerald-500/80 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isBn ? 'ভেরিফাইড লেনদেন' : 'Verified Deal'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
