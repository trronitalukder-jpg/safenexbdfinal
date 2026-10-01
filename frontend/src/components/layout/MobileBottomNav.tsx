'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Home,
  Briefcase,
  ShoppingBag,
  Trophy,
  LayoutDashboard,
  Wallet,
  ShieldAlert,
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { lang } = useLanguage();

  // If disabled by Admin in Settings, hide completely
  if (settings?.system?.mobileBottomNavEnabled === false) {
    return null;
  }

  // Do not show inside admin area or full-screen chat rooms to avoid blocking message input controls
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard/chat') ||
    pathname.startsWith('/dashboard/admin-chat')
  ) {
    return null;
  }

  const navItems = [
    {
      href: '/',
      labelBn: 'হোম',
      labelEn: 'Home',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      href: '/check',
      labelBn: 'চেকার',
      labelEn: 'Checker',
      icon: ShieldAlert,
      badge: 'নতুন',
      isActive: pathname.startsWith('/check'),
    },
    {
      href: '/micro-jobs',
      labelBn: 'মাইক্রো জব',
      labelEn: 'Jobs',
      icon: Briefcase,
      badge: 'হট',
      isActive: pathname.startsWith('/micro-jobs'),
    },
    {
      href: '/shop',
      labelBn: 'শপ',
      labelEn: 'Shop',
      icon: ShoppingBag,
      isActive: pathname.startsWith('/shop') || pathname.startsWith('/products'),
    },
    {
      href: '/dashboard',
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname.startsWith('/dashboard'),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/80 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_25px_rgba(0,0,0,0.45)] safe-area-bottom transition-colors">
      <div className="flex items-center justify-around px-1.5 py-1.5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          const label = lang === 'bn' ? item.labelBn : item.labelEn;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 select-none active:scale-95 ${
                active
                  ? 'text-sky-600 dark:text-amber-400 font-bold bg-sky-50/80 dark:bg-amber-500/10'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {active && (
                <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-sky-600 dark:bg-amber-400 shadow-xs" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? 'stroke-[2.4] -translate-y-0.5' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge && !active && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[8px] font-extrabold rounded-full bg-amber-500 text-slate-950 leading-tight shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Text label */}
              <span
                className={`text-[10px] mt-0.5 tracking-tight truncate max-w-[64px] text-center ${
                  active ? 'text-sky-600 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-zinc-400 font-medium'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
