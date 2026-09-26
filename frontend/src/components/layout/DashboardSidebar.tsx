'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Search,
  MessageSquare,
  Package,
  PlusCircle,
  ArrowLeftRight,
  Wallet,
  Coins,
  ShieldAlert,
  Settings,
  CreditCard,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  ExternalLink,
  BookOpen,
  Home,
  Smartphone,
  Download,
  Bell,
  Gift,
  Briefcase,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { usePwa } from '@/context/PwaContext';
import { useNotification } from '@/context/NotificationContext';

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { lang, toggleLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { installApp, isInstalled } = usePwa();
  const { unreadCount } = useNotification();
  const { settings } = useSettings();
  const isMicroJobEnabled = settings.microJob?.enabled !== false;

  const links = [
    { href: '/dashboard', label: lang === 'bn' ? 'ওভারভিউ' : 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/wallet', label: lang === 'bn' ? 'ওয়ালেট ও লেজার' : 'Wallet & Ledger', icon: Wallet },
    { href: '/dashboard/chat', label: lang === 'bn' ? 'মেসেজ ও লাইভ চ্যাট' : 'Live Chat & Deals', icon: MessageSquare },
    { href: '/dashboard/notifications', label: lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications', icon: Bell },
    { href: '/dashboard/affiliate', label: lang === 'bn' ? '🎁 রেফার ও আয়' : '🎁 Refer & Earn', icon: Gift },
    ...(isMicroJobEnabled
      ? [
          {
            href: '/dashboard/micro-jobs',
            label: lang === 'bn' ? '💼 মাইক্রো জবস' : '💼 Micro Jobs',
            icon: Briefcase,
          },
        ]
      : []),
    { href: '/dashboard/transactions', label: lang === 'bn' ? 'লেনদেন ইতিহাস' : 'My Transactions', icon: ArrowLeftRight },
    { href: '/dashboard/products', label: lang === 'bn' ? 'আমার প্রোডাক্টসমূহ' : 'My Products', icon: Package },
    { href: '/dashboard/products/new', label: lang === 'bn' ? 'প্রোডাক্ট আপলোড' : 'Upload Product', icon: PlusCircle },
    { href: '/dashboard/bids', label: lang === 'bn' ? 'আমার বিডসমূহ' : 'My Bids', icon: Coins },
    { href: '/dashboard/disputes', label: lang === 'bn' ? 'ডিসপ্যুট / কল অ্যাডমিন' : 'Disputes', icon: ShieldAlert },
    ...(settings?.system?.scammerCheckerEnabled !== false
      ? [
          {
            href: '/dashboard/scammer-reports',
            label: lang === 'bn' ? '🛡️ স্ক্যামার চেকার ও রিপোর্ট' : '🛡️ Scammer Checker & Reports',
            icon: ShieldCheck,
          },
        ]
      : []),
    { href: '/guides', label: lang === 'bn' ? 'গাইডস ও টিউটোরিয়াল' : 'Guides & Tutorials', icon: BookOpen },
    { href: '/users', label: lang === 'bn' ? 'ইউজার খুঁজুন' : 'Search Users', icon: Search },
    { href: '/dashboard/settings', label: lang === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Scrollable Navigation Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Brand Logo */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-base font-black text-slate-900 dark:text-white">
              Safnex<span className="text-sky-500">BD</span>
            </span>
          </Link>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
            DASHBOARD
          </span>
        </div>

        {/* Back to Home Page Action */}
        <Link
          href="/"
          className="w-full mb-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-sm font-semibold transition group"
        >
          <div className="flex items-center gap-2.5">
            <Home className="w-4 h-4 text-sky-500 group-hover:scale-110 transition shrink-0" />
            <span>{lang === 'bn' ? 'হোম পেজে যান' : 'Go to Home'}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </Link>

        {/* Back to Public Marketplace Action */}
        <Link
          href="/shop"
          className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-between text-sm font-semibold transition group"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-sky-500 group-hover:scale-110 transition shrink-0" />
            <span>{lang === 'bn' ? 'শপ পেজে যান (SHOP)' : 'Visit SHOP'}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{link.label}</span>
                </div>
                {link.href === '/dashboard/notifications' && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* App Install Button in Dashboard Sidebar */}
        <div className="pt-3">
          <button
            type="button"
            onClick={installApp}
            className="w-full p-2 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 hover:from-sky-500/20 hover:to-indigo-500/20 border border-sky-500/25 flex items-center justify-between text-left transition group shadow-xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center group-hover:scale-105 transition shadow-xs">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                  {isInstalled ? (lang === 'bn' ? '✓ অ্যাপ ইনস্টলড' : '✓ App Installed') : (lang === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App')}
                </div>
                <div className="text-[9px] text-slate-400">
                  {isInstalled ? (lang === 'bn' ? 'অফিসিয়াল PWA' : 'Official PWA') : (lang === 'bn' ? '১-ট্যাপে ব্যবহারের জন্য' : 'For 1-tap access')}
                </div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-sky-500 group-hover:translate-y-0.5 transition shrink-0" />
          </button>
        </div>
      </div>

      {/* Fixed Bottom Footer Controls: Language, Theme & Logout (ALWAYS VISIBLE) */}
      <div className="flex-shrink-0 p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur space-y-2">
        <div className="flex items-center justify-between px-1">
          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        {/* Prominent Logout button */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 transition cursor-pointer group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-rose-500 transition-transform group-hover:scale-110" />
            <span>{lang === 'bn' ? 'লগআউট করুন' : 'Logout'}</span>
          </div>
          <span className="text-xs text-rose-400 opacity-60">ESC</span>
        </button>
      </div>
    </aside>
  );
};
