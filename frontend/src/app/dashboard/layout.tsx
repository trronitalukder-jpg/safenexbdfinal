'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  MessageSquare,
  ArrowLeftRight,
  Package,
  PlusCircle,
  Coins,
  ShieldAlert,
  Settings,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  Sun,
  Moon,
  Globe,
  LogOut,
  BookOpen,
  Smartphone,
  Download,
  Bell,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { usePwa } from '@/context/PwaContext';
import { useNotification } from '@/context/NotificationContext';
import { getImageUrl } from '@/lib/imageUtils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout, refreshMe } = useAuthStore();
  const { lang, toggleLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { installApp, isInstalled } = usePwa();
  const { permission: notifPermission, requestPermission } = useNotification();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    refreshMe();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading]);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/dashboard', label: lang === 'bn' ? 'ওভারভিউ' : 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/wallet', label: lang === 'bn' ? 'ওয়ালেট ও লেজার' : 'Wallet & Ledger', icon: Wallet },
    { href: '/dashboard/chat', label: lang === 'bn' ? 'মেসেজ ও লাইভ চ্যাট' : 'Live Chat & Deals', icon: MessageSquare },
    { href: '/dashboard/transactions', label: lang === 'bn' ? 'লেনদেন ইতিহাস' : 'My Transactions', icon: ArrowLeftRight },
    { href: '/dashboard/products', label: lang === 'bn' ? 'আমার প্রোডাক্টসমূহ' : 'My Products', icon: Package },
    { href: '/dashboard/products/new', label: lang === 'bn' ? 'প্রোডাক্ট আপলোড' : 'Upload Product', icon: PlusCircle },
    { href: '/dashboard/bids', label: lang === 'bn' ? 'আমার বিডসমূহ' : 'My Bids', icon: Coins },
    { href: '/dashboard/disputes', label: lang === 'bn' ? 'ডিসপ্যুট / কল অ্যাডমিন' : 'Disputes', icon: ShieldAlert },
    { href: '/guides', label: lang === 'bn' ? 'গাইডস ও টিউটোরিয়াল' : 'Guides & Tutorials', icon: BookOpen },
    { href: '/dashboard/settings', label: lang === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings', icon: Settings },
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-xs text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span>Authenticating Dashboard Session...</span>
      </div>
    );
  }

  const available = Number(user?.wallet?.availableBalance || 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Desktop Fixed Left Sidebar */}
      <div className={`flex-shrink-0 h-screen ${pathname === '/dashboard/chat' ? 'hidden xl:block' : 'hidden md:block'}`}>
        <DashboardSidebar />
      </div>

      {/* 2. Mobile Drawer Navigation Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/70 backdrop-blur-xs flex">
          <div className="w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between p-4 animate-in slide-in-from-left">
            <div>
              {/* Brand Logo & Close */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white font-black">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Safnex<span className="text-sky-500">BD</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Browse Marketplace link on mobile */}
              <Link
                href="/products"
                onClick={() => setMobileDrawerOpen(false)}
                className="my-3 px-3 py-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-between text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'মার্কেটপ্লেস ব্রাউজ' : 'Marketplace'}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {navLinks.map((l) => {
                  const Icon = l.icon;
                  const isActive = pathname === l.href;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{l.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {/* App Install in Mobile Drawer */}
              <button
                type="button"
                onClick={installApp}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/25 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-500" />
                  <span>
                    {isInstalled
                      ? lang === 'bn'
                        ? '✓ অ্যাপ ইনস্টলড'
                        : '✓ App Installed'
                      : lang === 'bn'
                      ? 'অ্যাপ ইনস্টল করুন'
                      : 'Install App'}
                  </span>
                </div>
                <Download className="w-3.5 h-3.5 text-sky-500" />
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                </button>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* 3. Main Body Column */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Dedicated Clean Dashboard Header Bar */}
        <header className="h-16 flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between z-10">
          {/* Left: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {/* On desktop/tablet (sm+): show Workspace / ড্যাশবোর্ড */}
              <span className="hidden sm:inline-block font-extrabold text-xs sm:text-base text-slate-900 dark:text-white truncate">
                {lang === 'bn' ? 'ড্যাশবোর্ড' : 'Workspace'}
              </span>
              {/* On phone (< sm): show user's name */}
              <span className="sm:hidden font-extrabold text-sm text-slate-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                Safe Escrow
              </span>
            </div>
          </div>

          {/* Right: Balance Pill, Browse Marketplace, and User Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Available Balance Pill (hidden on phone view < sm, visible on sm+) */}
            <Link
              href="/dashboard/wallet"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition shadow-xs"
              title={lang === 'bn' ? 'ওয়ালেট ব্যালেন্স' : 'Available Balance'}
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <div className="text-xs font-bold whitespace-nowrap">
                <span>৳ {available.toLocaleString()}</span>
              </div>
            </Link>

            {/* Direct Marketplace Link */}
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
              <span>{lang === 'bn' ? 'মার্কেটপ্লেস' : 'Marketplace'}</span>
            </Link>

            {/* Guides Link Button (visible on md+) */}
            <Link
              href="/guides"
              title={lang === 'bn' ? 'ব্যবহারবিধি ও ভিডিও নির্দেশিকা' : 'Guides & Video Instructions'}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 transition shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'গাইডস' : 'Guides'}</span>
            </Link>

            {/* Language Switch */}
            <button
              type="button"
              onClick={toggleLang}
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition"
            >
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? (lang === 'bn' ? 'লাইট মোড' : 'Light Mode') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>

            {/* Real-time Notification Bell / Status Button */}
            <button
              type="button"
              onClick={async () => {
                if (notifPermission !== 'granted') {
                  await requestPermission();
                } else {
                  router.push('/dashboard/settings?tab=preferences');
                }
              }}
              title={
                notifPermission === 'granted'
                  ? (lang === 'bn' ? 'ব্রাউজার নোটিফিকেশন চালু আছে (সেটিংস)' : 'Notifications Active (Click for Settings)')
                  : notifPermission === 'denied'
                  ? (lang === 'bn' ? 'নোটিফিকেশন ব্লক করা আছে' : 'Notifications Blocked in Browser')
                  : (lang === 'bn' ? 'ব্রাউজার নোটিফিকেশন অন করুন' : 'Enable Push Notifications')
              }
              className={`relative p-1.5 sm:p-2 rounded-xl border transition ${
                notifPermission === 'granted'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : notifPermission === 'denied'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-200 dark:border-rose-900/60'
                  : 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 animate-pulse'
              }`}
            >
              <Bell className="w-4 h-4" />
              {notifPermission === 'granted' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              )}
              {notifPermission === 'default' && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
              )}
              {notifPermission === 'denied' && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Quick Profile Link */}
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 p-0.5 sm:p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Profile Settings"
            >
              {user.avatarUrl ? (
                <img
                  src={getImageUrl(user.avatarUrl)}
                  alt={user.firstName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-sky-500/40"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.firstName.charAt(0)}
                </div>
              )}
              <span className="hidden lg:inline-block text-xs font-bold text-slate-900 dark:text-white">
                {user.firstName}
              </span>
            </Link>
          </div>
        </header>

        {/* Workspace Body Area */}
        {pathname === '/dashboard/chat' ? (
          <main className="flex-1 h-[calc(100vh-64px)] overflow-hidden p-0 m-0 bg-slate-50/70 dark:bg-slate-950/70">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-6 md:pb-8 bg-slate-50/70 dark:bg-slate-950/70">
            <div className="w-full max-w-[1680px] mx-auto space-y-6">
              {children}

              {/* User Dashboard Footer */}
              <footer className="mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'সেফনেক্সবিডি সুরক্ষিত মধ্যস্থতা কর্মক্ষেত্র' : 'SafnexBD Protected Workspace'}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'bn' ? '১০০% নিশ্চিত এসক্রো সুরক্ষা' : '100% Guaranteed Escrow Protection'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={installApp}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 transition flex items-center gap-1.5 shadow-xs text-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>
                      {isInstalled
                        ? lang === 'bn'
                          ? '✓ অ্যাপ ইনস্টলড'
                          : '✓ App Installed'
                        : lang === 'bn'
                          ? 'অ্যাপ ইনস্টল করুন (Install App)'
                          : 'Install App'}
                    </span>
                  </button>
                </div>
              </footer>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
