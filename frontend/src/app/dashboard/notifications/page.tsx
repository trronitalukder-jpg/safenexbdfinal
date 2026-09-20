'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useNotification, UserNotificationItem } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';

export default function NotificationsPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    soundEnabled,
    toggleSound,
    permission,
    requestPermission,
  } = useNotification();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'deals' | 'messages'>('all');

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.read;
    if (activeFilter === 'deals') {
      return [
        'pay_request',
        'receive_request',
        'hold_approved',
        'release_request',
        'release_approve',
        'dispute',
        'withdraw',
      ].includes(item.type);
    }
    if (activeFilter === 'messages') return item.type === 'message';
    return true;
  });

  const getNotificationIcon = (type: UserNotificationItem['type']) => {
    switch (type) {
      case 'message':
        return (
          <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        );
      case 'pay_request':
        return (
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        );
      case 'receive_request':
        return (
          <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        );
      case 'hold_approved':
        return (
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
        );
      case 'release_request':
        return (
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        );
      case 'release_approve':
        return (
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'dispute':
        return (
          <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'withdraw':
        return (
          <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 rounded-2xl bg-slate-500/15 text-slate-600 dark:text-slate-400 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return lang === 'bn' ? 'এইমাত্র' : 'Just now';
      if (diffMin < 60) return lang === 'bn' ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
      if (diffHour < 24) return lang === 'bn' ? `${diffHour} ঘণ্টা আগে` : `${diffHour}h ago`;
      if (diffDay === 1) return lang === 'bn' ? 'গতকাল' : 'Yesterday';
      return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (item: UserNotificationItem) => {
    markAsRead(item.id);
    if (item.url) {
      router.push(item.url);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-xs">
            <Bell className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notification Center'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {lang === 'bn' ? 'সকল নোটিফিকেশন ও অ্যালার্ট' : 'All Notifications & Alerts'}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-lg">
            {lang === 'bn'
              ? 'চ্যাট মেসেজ, পে-রিকোয়েস্ট, এসক্রো হোল্ড, রিলিজ ও উইথড্রয়াল সংক্রান্ত সকল আপডেট এখানে দেখতে পাবেন।'
              : 'Real-time alerts for live chats, payment requests, escrow releases, and withdrawals.'}
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 z-10 self-stretch sm:self-auto justify-end">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? (lang === 'bn' ? 'সাউন্ড অন' : 'Sound On') : (lang === 'bn' ? 'সাউন্ড অফ' : 'Sound Off')}
            className={`p-2.5 rounded-2xl border transition flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                : 'bg-black/20 border-white/20 text-white/70 hover:bg-black/30'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xs:inline">{soundEnabled ? (lang === 'bn' ? 'শব্দ চালু' : 'Sound On') : (lang === 'bn' ? 'শব্দ বন্ধ' : 'Muted')}</span>
          </button>

          {/* Browser Permission Button */}
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={requestPermission}
              className="px-3 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পুশ অন করুন' : 'Enable Push'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeFilter === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'bn' ? 'সকল' : 'All'} ({notifications.length})
          </button>

          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeFilter === 'unread'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{lang === 'bn' ? 'অপঠিত' : 'Unread'}</span>
            {unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeFilter === 'unread' ? 'bg-white text-sky-600' : 'bg-rose-500 text-white'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveFilter('deals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeFilter === 'deals'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'bn' ? 'লেনদেন ও এসক্রো' : 'Deals & Escrow'}
          </button>

          <button
            onClick={() => setActiveFilter('messages')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeFilter === 'messages'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {lang === 'bn' ? 'মেসেজ' : 'Messages'}
          </button>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Clear all'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {activeFilter === 'unread'
                ? lang === 'bn'
                  ? 'কোনো অপঠিত নোটিফিকেশন নেই'
                  : 'No unread notifications'
                : lang === 'bn'
                ? 'বর্তমানে কোনো নোটিফিকেশন নেই'
                : 'No notifications yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {lang === 'bn'
                ? 'নতুন মেসেজ আসলে বা লেনদেনের কোনো পরিবর্তন হলে আপনি সাথে সাথে নোটিফিকেশন দেখতে পাবেন।'
                : 'When someone sends you a message, pays an escrow request, or your withdrawal updates, it will appear here.'}
            </p>
          </div>
          <Link
            href="/dashboard/chat"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লাইভ চ্যাট পেজে যান' : 'Go to Live Chat'}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-4 rounded-2xl border transition flex items-start gap-3.5 sm:gap-4 cursor-pointer relative group ${
                !item.read
                  ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/80 hover:bg-sky-50 dark:hover:bg-sky-950/50 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              {/* Notification Icon */}
              {getNotificationIcon(item.type)}

              {/* Notification Details */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4
                    className={`text-sm sm:text-[15px] font-bold truncate ${
                      !item.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.title}
                  </h4>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 ring-4 ring-sky-500/20" />
                  )}
                </div>

                {item.message && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span>{formatTime(item.createdAt)}</span>
                  {item.url && (
                    <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-bold hover:underline">
                      <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Action Chevron */}
              <div className="shrink-0 self-center opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition">
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

