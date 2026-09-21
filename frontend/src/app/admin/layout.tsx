'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
  ChevronLeft,
  BookOpen,
  Home,
  Lock,
  Bell,
  Sparkles,
  ExternalLink,
  Check,
  Activity,
  Coffee,
  Power,
  ChevronDown,
} from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/context/NotificationContext';
import { getSocket } from '@/lib/socket';
import { getImageUrl } from '@/lib/imageUtils';
import { adminMenuRegistry } from '@/config/adminMenuRegistry';
import { api } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAdmin, isSuperAdmin, hasAdminPermission, refreshMe } = useAuthStore();
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const {
    permission: notifPermission,
    requestPermission,
    sendNotification,
    playNotificationSound,
  } = useNotification();
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Staff Workload & Duty Status
  const [dutyStatus, setDutyStatus] = useState<'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY'>('OFF_DUTY');
  const [activeTasksCount, setActiveTasksCount] = useState<number>(0);
  const [showDutyMenu, setShowDutyMenu] = useState(false);
  const [updatingDuty, setUpdatingDuty] = useState(false);

  const fetchDutyStatus = React.useCallback(async () => {
    if (!user || !isAdmin()) return;
    try {
      const res: any = await api.get('/operations/my-duty');
      const data = res?.data !== undefined ? res.data : res;
      if (data && data.dutyStatus) {
        setDutyStatus(data.dutyStatus);
        setActiveTasksCount(data.activeTasksCount || 0);
      }
    } catch {
      // Operations might be disabled or route unreachable; soft-ignore
    }
  }, [user, isAdmin]);

  const handleDutyChange = async (newStatus: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY') => {
    try {
      setUpdatingDuty(true);
      // Optimistically update status and close menu immediately
      setDutyStatus(newStatus);
      setShowDutyMenu(false);
      const res: any = await api.post('/operations/duty-status', { dutyStatus: newStatus });
      const data = res?.data !== undefined ? res.data : res;
      if (data && data.dutyStatus) {
        setDutyStatus(data.dutyStatus);
      }
      await fetchDutyStatus();
    } catch (err: any) {
      console.warn('Failed to change duty status', err);
    } finally {
      setUpdatingDuty(false);
    }
  };

  useEffect(() => {
    fetchDutyStatus();
  }, [fetchDutyStatus]);

  // Real-time socket listener for Super Admin and Staff alerts
  useEffect(() => {
    if (!user || !isAdmin()) return;

    const socket = getSocket();
    socket.emit('admin:join', { adminId: user.id });
    socket.emit('staff:join', { staffId: user.id });

    const handleConnect = () => {
      socket.emit('admin:join', { adminId: user.id });
      socket.emit('staff:join', { staffId: user.id });
    };

    socket.on('connect', handleConnect);

    const handleAdminNotification = (data: any) => {
      if (!data) return;

      playNotificationSound();

      setAdminNotifications((prev) => [
        { ...data, id: data.id || Date.now(), receivedAt: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19),
      ]);
      setUnreadCount((c) => c + 1);

      if (notifPermission === 'granted') {
        sendNotification(
          data.title || 'অ্যাডমিন নোটিফিকেশন',
          {
            body: data.message || 'প্ল্যাটফর্মে নতুন ইভেন্ট ঘটেছে।',
            icon: '/icon-192.png',
            tag: `admin-${data.type || Date.now()}`,
          },
          data.targetUrl || '/admin',
        );
      }
    };

    socket.on('notification:admin', handleAdminNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:admin', handleAdminNotification);
    };
  }, [user, isAdmin, notifPermission, playNotificationSound, sendNotification]);

  useEffect(() => {
    refreshMe();
  }, []);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') {
      if (!isLoading && user && isAdmin()) {
        router.push('/admin');
      }
      return;
    }

    if (!isLoading && (!user || !isAdmin())) {
      router.push('/admin/login');
    }
  }, [user, isLoading, pathname]);

  // Dedicated Full Page view for Admin Login (no sidebar, no restrictions)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading || !user || !isAdmin()) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-xs text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span>Verifying Administrative Credentials...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Mobile Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200 h-full overflow-hidden">
            <AdminSidebar onClose={() => setMobileDrawerOpen(false)} isMobile={true} />
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-20 sticky top-0">
        {/* Left: Mobile Menu Toggle & Admin Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-500 transition"
            title="Open Admin Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                {lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল সেন্টার' : 'Admin Control Center'}
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold tracking-wide">
                {user.roles?.includes('SUPER_ADMIN') ? 'SUPER ADMIN' : user.roles?.[0] || 'ADMIN'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Duty Selector, User Dashboard link, Language Switch, Theme Toggle, and Admin Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Staff Duty & Workload Status Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDutyMenu(!showDutyMenu)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
                dutyStatus === 'ON_DUTY'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : dutyStatus === 'ON_BREAK'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={lang === 'bn' ? 'স্টাফ ডিউটি স্ট্যাটাস পরিবর্তন' : 'Change Duty Status'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dutyStatus === 'ON_DUTY'
                    ? 'bg-emerald-500 animate-pulse'
                    : dutyStatus === 'ON_BREAK'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {dutyStatus === 'ON_DUTY'
                  ? (lang === 'bn' ? 'ডিউটিতে আছি' : 'On Duty')
                  : dutyStatus === 'ON_BREAK'
                  ? (lang === 'bn' ? 'বিরতিতে' : 'On Break')
                  : (lang === 'bn' ? 'অফ-ডিউটি' : 'Off Duty')}
              </span>
              {activeTasksCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black text-[10px]" title="Active Tasks">
                  {activeTasksCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showDutyMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowDutyMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                    {lang === 'bn' ? 'স্টাফ ডিউটি স্ট্যাটাস' : 'Staff Duty Status'}
                  </div>
                <button
                  type="button"
                  disabled={updatingDuty}
                  onClick={() => handleDutyChange('ON_DUTY')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    dutyStatus === 'ON_DUTY'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'bn' ? '🟢 অন ডিউটি' : '🟢 On Duty'}</span>
                  </div>
                  {dutyStatus === 'ON_DUTY' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  disabled={updatingDuty}
                  onClick={() => handleDutyChange('ON_BREAK')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    dutyStatus === 'ON_BREAK'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <span>{lang === 'bn' ? '🟡 বিরতি (পজ)' : '🟡 On Break'}</span>
                  </div>
                  {dutyStatus === 'ON_BREAK' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  disabled={updatingDuty}
                  onClick={() => handleDutyChange('OFF_DUTY')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    dutyStatus === 'OFF_DUTY'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-rose-500" />
                    <span>{lang === 'bn' ? '🔴 অফ ডিউটি' : '🔴 Off Duty'}</span>
                  </div>
                  {dutyStatus === 'OFF_DUTY' && <Check className="w-3.5 h-3.5" />}
                </button>

                {isSuperAdmin() && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                    <Link
                      href="/admin/operations"
                      onClick={() => setShowDutyMenu(false)}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold transition"
                    >
                      <span>{lang === 'bn' ? 'লাইভ অপারেশন কন্ট্রোল' : 'Live Operations'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

          {/* Quick Home Page Link */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition"
            title={lang === 'bn' ? 'হোম পেজে যান' : 'Go to Home Page'}
          >
            <Home className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'bn' ? 'হোম পেজ' : 'Home'}</span>
          </Link>

          {/* Guides Button (left of language toggle) */}
          <Link
            href="/admin/guides"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-slate-950 dark:hover:text-slate-950 text-xs font-bold border border-amber-500/30 transition shadow-xs"
            title={lang === 'bn' ? 'গাইডস ও টিউটোরিয়াল' : 'Guides & Tutorials'}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'গাইডস' : 'Guides'}</span>
          </Link>

          {/* Language Switch */}
          <button
            type="button"
            onClick={toggleLang}
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? (lang === 'bn' ? 'লাইট মোড' : 'Light Mode') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Admin Real-time Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setUnreadCount(0);
              }}
              title={lang === 'bn' ? 'অ্যাডমিন নোটিফিকেশন' : 'Admin Alerts'}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>{lang === 'bn' ? 'অ্যাডমিন নোটিফিকেশন' : 'Recent Admin Alerts'}</span>
                  </div>
                  <Link
                    href="/admin/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-[11px] font-bold text-amber-500 hover:text-amber-400"
                  >
                    {lang === 'bn' ? 'কনফিগ সেটিংস' : 'Configure'}
                  </Link>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                  {adminNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {lang === 'bn' ? 'কোনো নতুন নোটিফিকেশন নেই' : 'No new notifications yet.'}
                    </div>
                  ) : (
                    adminNotifications.map((notif, i) => (
                      <Link
                        key={notif.id || i}
                        href={notif.targetUrl || '/admin'}
                        onClick={() => setShowNotifMenu(false)}
                        className="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold text-amber-500">{notif.type || 'ALERT'}</span>
                          <span>{notif.receivedAt || 'Just now'}</span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{notif.title}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </Link>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-center">
                  <Link
                    href="/admin/notifications"
                    onClick={() => setShowNotifMenu(false)}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-amber-500"
                  >
                    {lang === 'bn' ? 'সব নোটিফিকেশন কনফিগারেশন দেখুন →' : 'View full notification settings →'}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            {user.avatarUrl ? (
              <img
                src={getImageUrl(user.avatarUrl)}
                alt={user.firstName}
                className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.firstName?.charAt(0) || 'A'}
              </div>
            )}
            <span className="hidden lg:inline-block text-xs font-bold text-slate-900 dark:text-white">
              {user.firstName}
            </span>
          </div>
        </div>
      </header>

      {/* Main Column & Persistent Desktop Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block flex-shrink-0 h-[calc(100vh-4rem)] overflow-hidden">
          <AdminSidebar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="w-full max-w-[1680px] mx-auto">
            {(() => {
              const matchedItem = adminMenuRegistry.find(
                (item) => item.href === pathname || (item.href !== '/admin' && pathname.startsWith(item.href))
              );
              const isAllowed = !matchedItem || hasAdminPermission(matchedItem.key);

              if (!isAllowed) {
                return (
                  <div className="p-8 max-w-lg mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-lg space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {lang === 'bn' ? 'অ্যাক্সেস সংরক্ষিত / অনুমতি নেই' : 'Access Restricted'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {lang === 'bn'
                          ? 'আপনার অ্যাকাউন্টে এই সেকশনটি দেখার বা পরিবর্তন করার প্রশাসনিক অনুমতি দেওয়া হয়নি। প্রয়োজনে সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।'
                          : 'You do not have administrative permission to view or manage this section. Please contact your Super Administrator.'}
                      </p>
                    </div>
                  </div>
                );
              }

              return children;
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
