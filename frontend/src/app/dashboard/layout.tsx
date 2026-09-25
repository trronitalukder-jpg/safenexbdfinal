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
  Home,
  Smartphone,
  Download,
  Bell,
  Gift,
  Briefcase,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { usePwa } from '@/context/PwaContext';
import { useNotification } from '@/context/NotificationContext';
import { getImageUrl } from '@/lib/imageUtils';
import { ComplaintModal } from '@/components/complaint/ComplaintModal';

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
  const { permission: notifPermission, requestPermission, unreadCount } = useNotification();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  useEffect(() => {
    refreshMe();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openComplaint') === 'true') {
        setShowComplaintModal(true);
      }
    }
  }, []);

  const isStaffOrAdmin =
    Boolean(user?.isEmployee) ||
    Boolean(
      user?.roles?.some((r: string) =>
        ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'SUPPORT_ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN'].includes(r)
      )
    ) ||
    Boolean(user?.adminPermissions && user.adminPermissions.length > 0);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (isStaffOrAdmin) {
        router.push('/admin');
      }
    }
  }, [user, isLoading, isStaffOrAdmin]);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const { settings } = useSettings();
  const isMicroJobEnabled = settings.microJob?.enabled !== false;

  const navLinks = [
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
    { href: '/guides', label: lang === 'bn' ? 'গাইডস ও টিউটোরিয়াল' : 'Guides & Tutorials', icon: BookOpen },
    { href: '/dashboard/settings', label: lang === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings', icon: Settings },
  ];

  if (isLoading || !user || isStaffOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-xs text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span>{isStaffOrAdmin ? 'Redirecting to Admin Panel...' : 'Authenticating Dashboard Session...'}</span>
      </div>
    );
  }

  const available = Number(user?.wallet?.availableBalance || 0);

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Desktop Fixed Left Sidebar */}
      <div className={`flex-shrink-0 h-full ${pathname === '/dashboard/chat' ? 'hidden xl:block' : 'hidden md:block'}`}>
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

              {/* Home Page link on mobile */}
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="mt-3 mb-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'হোম পেজে যান' : 'Home Page'}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </Link>

              {/* Browse Marketplace link on mobile */}
              <Link
                href="/products"
                onClick={() => setMobileDrawerOpen(false)}
                className="mb-3 px-3 py-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-between text-xs font-bold"
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
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 shrink-0" />
                        <span>{l.label}</span>
                      </div>
                      {l.href === '/dashboard/notifications' && unreadCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                          {unreadCount}
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 opacity-40" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Controls */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {/* Complaint Button in Mobile Drawer */}
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setShowComplaintModal(true);
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>
                    {lang === 'bn' ? '📢 অভিযোগ দাখিল করুন' : '📢 File a Complaint'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
                  {lang === 'bn' ? 'সাপোর্ট' : 'Support'}
                </span>
              </button>

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
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Dedicated Clean Dashboard Header Bar */}
        <header className="h-16 flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between z-10">
          {/* Left: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 transition shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <div className="flex flex-col min-w-0 justify-center">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate leading-tight">
                  {user.firstName} {user.lastName}
                </span>
                {user.uniqueUserId && (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate leading-none mt-0.5">
                    ID: {user.uniqueUserId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Home, Browse Marketplace, Language, Theme, Notifications and User Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Direct Home Page Link */}
            <Link
              href="/"
              title={lang === 'bn' ? 'হোম পেজে যান' : 'Go to Home Page'}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition shrink-0"
            >
              <Home className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-sky-500" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'হোম' : 'Home'}</span>
            </Link>

            {/* Direct Marketplace Link */}
            <Link
              href="/products"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
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
              className="hidden sm:flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition"
            >
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? (lang === 'bn' ? 'লাইট মোড' : 'Light Mode') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}
              className="hidden sm:flex p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>

            {/* Real-time Notification Bell */}
            <Link
              href="/dashboard/notifications"
              title={lang === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notification Center'}
              className="relative p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : notifPermission === 'granted' ? (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              ) : notifPermission === 'default' ? (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
              ) : null}
            </Link>

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

            {/* Quick Logout Button (Desktop, Tab, Laptop) */}
            <button
              type="button"
              onClick={logout}
              title={lang === 'bn' ? 'লগআউট করুন' : 'Logout'}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        </header>

        {/* Workspace Body Area */}
        {pathname === '/dashboard/chat' ? (
          <main className="flex-1 h-full min-h-0 overflow-hidden p-0 m-0 bg-slate-50/70 dark:bg-slate-950/70">
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

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* File Complaint Button */}
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition flex items-center gap-1.5 shadow-xs text-xs active:scale-95 cursor-pointer"
                    title={lang === 'bn' ? 'এডমিনের কাছে অভিযোগ দাখিল করুন' : 'File a Complaint to Admin'}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>
                      {lang === 'bn' ? '📢 অভিযোগ দাখিল করুন' : '📢 File a Complaint'}
                    </span>
                  </button>

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

      {/* Complaint Submission Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
      />
    </div>
  );
}
