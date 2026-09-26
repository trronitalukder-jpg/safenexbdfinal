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

  // Do not show inside admin area to avoid blocking admin controls
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isCheckerEnabled = settings?.system?.scammerCheckerEnabled !== false;
  const isMicroJobsEnabled = settings?.microJob?.enabled !== false;

  const navItems = [
    {
      href: '/',
      labelBn: 'হোম',
      labelEn: 'Home',
      icon: Home,
      isActive: pathname === '/',
    },
    ...(isCheckerEnabled
      ? [
          {
            href: '/check',
            labelBn: 'চেকার',
            labelEn: 'Checker',
            icon: ShieldAlert,
            badge: 'নতুন',
            isActive: pathname.startsWith('/check'),
          },
        ]
      : []),
    ...(isMicroJobsEnabled
      ? [
          {
            href: '/micro-jobs',
            labelBn: 'মাইক্রো জব',
            labelEn: 'Jobs',
            icon: Briefcase,
            badge: 'হট',
            isActive: pathname.startsWith('/micro-jobs'),
          },
        ]
      : []),
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-8px_20px_rgba(0,0,0,0.45)] safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1.5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          const label = lang === 'bn' ? item.labelBn : item.labelEn;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 select-none ${
                active
                  ? 'text-amber-400 font-semibold scale-105'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {active && (
                <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? 'stroke-[2.4] -translate-y-0.5' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge && !active && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 text-[8px] font-extrabold rounded-full bg-amber-500 text-zinc-950 leading-tight shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Text label */}
              <span
                className={`text-[10px] mt-1 tracking-tight truncate max-w-[56px] text-center ${
                  active ? 'text-amber-400' : 'text-zinc-400'
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
