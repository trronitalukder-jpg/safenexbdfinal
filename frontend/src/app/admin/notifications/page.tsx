'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  ShieldAlert,
  UserPlus,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  ArrowLeftRight,
  Send,
  MessageSquare,
  Volume2,
  VolumeX,
  Smartphone,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Briefcase,
  Sliders,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useNotification } from '@/context/NotificationContext';

export default function AdminNotificationSettingsPage() {
  const { lang } = useLanguage();
  const {
    permission: browserNotifPermission,
    requestPermission,
    sendNotification,
    playNotificationSound,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'superAdmin' | 'user' | 'employee'>('superAdmin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [testingTrigger, setTestingTrigger] = useState<string | null>(null);

  // Notification Config State
  const [config, setConfig] = useState({
    superAdmin: {
      newUserRegistration: true,
      rechargeRequest: true,
      withdrawRequest: true,
      disputeCalling: true,
      bids: true,
      transactions: true,
      payRequest: true,
      receiveRequest: true,
      soundAlerts: true,
      browserPush: true,
    },
    user: {
      chatMessage: true,
      rechargeStatus: true,
      withdrawStatus: true,
      payReceiveRequest: true,
      soundAlerts: true,
      browserPush: true,
    },
    employee: {
      rechargeQueue: true,
      withdrawQueue: true,
      disputeCalling: true,
      chatMediation: true,
      newRegistration: false,
      soundAlerts: true,
      browserPush: true,
    },
  });

  const loadSettings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res: any = await api.get('/settings/notifications');
      if (res) {
        setConfig((prev) => ({
          superAdmin: { ...prev.superAdmin, ...(res.superAdmin || {}) },
          user: { ...prev.user, ...(res.user || {}) },
          employee: { ...prev.employee, ...(res.employee || {}) },
        }));
      }
    } catch (err: any) {
      console.error('Failed to load notification settings:', err);
      setErrorMessage(
        lang === 'bn'
          ? 'নোটিফিকেশন সেটিংস লোড করতে সমস্যা হয়েছে।'
          : 'Failed to load notification settings.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggle = (role: 'superAdmin' | 'user' | 'employee', key: string) => {
    setConfig((prev) => ({
      ...prev,
      [role]: {
        ...(prev as any)[role],
        [key]: !(prev as any)[role][key],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');
    try {
      await api.post('/settings/notifications', config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save notification settings:', err);
      setErrorMessage(
        lang === 'bn'
          ? 'সেটিংস সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Failed to save settings. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Test notification trigger live
  const handleTestTrigger = async (title: string, body: string, triggerKey: string) => {
    setTestingTrigger(triggerKey);
    playNotificationSound();
    try {
      if (browserNotifPermission === 'granted') {
        await sendNotification(title, {
          body,
          icon: '/icon-192.png',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setTestingTrigger(null), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
        <span>{lang === 'bn' ? 'নোটিফিকেশন কনফিগারেশন লোড হচ্ছে...' : 'Loading notification configuration...'}</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <Bell className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'নোটিফিকেশন কনফিগারেশন' : 'Notification Control Center'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {lang === 'bn'
              ? 'সুপার অ্যাডমিন, কর্মচারী/স্টাফ এবং সাধারণ ব্যবহারকারীদের জন্য কোন কোন ইভেন্টে সাউন্ড ও ব্রাউজার পুশ নোটিফিকেশন যাবে তা কনফিগার করুন।'
              : 'Configure real-time audio and browser push notification triggers across Super Admin, Staff, and User accounts.'}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {browserNotifPermission !== 'granted' && (
            <button
              type="button"
              onClick={() => requestPermission()}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ব্রাউজার নোটিফিকেশন অন করুন' : 'Enable Browser Push'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'পরিবর্তন সেভ করুন' : 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Message Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            {lang === 'bn'
              ? '✓ নোটিফিকেশন কনফিগারেশন সফলভাবে সেভ করা হয়েছে!'
              : '✓ Notification configuration saved successfully!'}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3 Main Role Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('superAdmin')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'superAdmin'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{lang === 'bn' ? 'সুপার অ্যাডমিন নোটিফিকেশন' : 'Super Admin Alerts'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'user'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'bn' ? 'ইউজার নোটিফিকেশন' : 'User Notifications'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('employee')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-2 flex-shrink-0 cursor-pointer ${
            activeTab === 'employee'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{lang === 'bn' ? 'কর্মচারী ও স্টাফ নোটিফিকেশন' : 'Staff / Employee Alerts'}</span>
        </button>
      </div>

      {/* TAB 1: SUPER ADMIN NOTIFICATIONS */}
      {activeTab === 'superAdmin' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>{lang === 'bn' ? 'সুপার অ্যাডমিন ইভেন্ট নোটিফিকেশন' : 'Super Admin Real-time Event Triggers'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'প্ল্যাটফর্মে নিচের ইভেন্টগুলো ঘটলে সুপার অ্যাডমিন প্যানেলে তাৎক্ষণিক নোটিফিকেশন ও অ্যালার্ট আসবে।'
                  : 'Select which core platform events should notify the Super Admin console.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. New User Registration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'নতুন ইউজার রেজিস্ট্রেশন করলে' : 'New User Registration'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'নতুন গ্রাহক একাউন্ট খুললে অ্যাডমিনকে নাম ও ফোন নম্বর সহ নোটিফিকেশন জানানো হবে।'
                      : 'Notify when a new user registers on the platform with details.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '👤 নতুন ইউজার রেজিস্ট্রেশন',
                        'Rahim Ahmed (Rahim1234) নতুন একাউন্ট খুলেছেন।',
                        'newUserRegistration',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'newUserRegistration')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.newUserRegistration ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.newUserRegistration ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 2. Recharge Request */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'bn' ? 'রিচার্জ রিকোয়েস্ট আসলে' : 'Recharge Request Submitted'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'ইউজার ওয়ালেটে টাকা ডিপোজিট রিকোয়েস্ট পাঠালে সাথে সাথে নোটিফিকেশন আসবে।'
                      : 'Notify when a user deposits funds via bKash/Nagad/Rocket/Bank.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '💳 নতুন রিচার্জ রিকোয়েস্ট',
                        'ব্যবহারকারী ৳৫,০০০ টাকার ডিপোজিট আবেদন করেছেন (bKash)।',
                        'rechargeRequest',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'rechargeRequest')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.rechargeRequest ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.rechargeRequest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 3. Withdraw Request */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'bn' ? 'উইথড্র রিকোয়েস্ট আসলে' : 'Withdrawal Request Submitted'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'ব্যবহারকারী টাকা উত্তোলনের আবেদন জমা দিলে দ্রুত প্রসেস করার জন্য অ্যালার্ট আসবে।'
                      : 'Notify immediately when a user requests a payout withdrawal.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '💸 নতুন উইথড্র রিকোয়েস্ট',
                        '৳১০,০০০ টাকা উত্তোলনের জন্য আবেদন জমা হয়েছে।',
                        'withdrawRequest',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'withdrawRequest')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.withdrawRequest ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.withdrawRequest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 4. Dispute / Call Admin */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>{lang === 'bn' ? 'ডিসপ্যুট কলিং আসলে (Call Admin)' : 'Dispute / Call Admin'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'চ্যাট রুম বা লেনদেনে ব্যবহারকারী মধ্যস্থতা চাইলে জরুরী অ্যালার্ট পাঠানো হবে।'
                      : 'Urgent notification when buyer/seller calls admin or raises a dispute.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '🚨 জরুরী কল অ্যাডমিন!',
                        'চ্যাট রুমে বায়ার অ্যাডমিন সহায়তা চেয়েছেন।',
                        'disputeCalling',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'disputeCalling')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.disputeCalling ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.disputeCalling ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 5. Bids Placed */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>{lang === 'bn' ? 'বিডস করলে (Bids Placed)' : 'Bids Placed'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'মার্কেটপ্লেসে প্রোডাক্ট বা ইউজার পজিশন কেনার জন্য বিড করলে নোটিফিকেশন আসবে।'
                      : 'Notify when a seller places a bid to boost their positioning.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '🏷️ নতুন বিড জমা পড়েছে',
                        'ব্যবহারকারী ৳৩৫০ টাকার বিড প্লেস করেছেন (পজিশন #১)।',
                        'bids',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'bids')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.bids ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.bids ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 6. Transaction Completed */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'ট্রানজ্যাকশন সম্পন্ন হলে' : 'Transaction Completed'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'নতুন লেনদেন শুরু বা সফলভাবে কাজ অনুমোদন হয়ে এসক্রো ডিল সম্পন্ন হলে নোটিফিকেশন যাবে।'
                      : 'Notify when deals are created, approved, or finalized.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '🔄 লেনদেন সম্পন্ন হয়েছে',
                        '৳২,৫০০ টাকার এসক্রো ডিল সফলভাবে সম্পন্ন হয়েছে।',
                        'transactions',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'transactions')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.transactions ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.transactions ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 7. Pay Request in Chat */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'bn' ? 'পে-রিকোয়েস্ট (Pay Request) তৈরি হলে' : 'Pay Request Created'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'চ্যাটে সেলার বা ইউজার পেমেন্ট দাবি করে পে-রিকোয়েস্ট পাঠালে অ্যাডমিনকে অবহিত করা হবে।'
                      : 'Notify when a seller generates a Pay Request card inside chat.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '💳 পে-রিকোয়েস্ট তৈরি হয়েছে',
                        'চ্যাট রুমে ৳১,৫০০ টাকার নতুন পে-রিকোয়েস্ট পাঠানো হয়েছে।',
                        'payRequest',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'payRequest')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.payRequest ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.payRequest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 8. Receive Request in Chat */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-500" />
                    <span>{lang === 'bn' ? 'রিসিভ রিকোয়েস্ট (Receive Request) আসলে' : 'Receive Request Created'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'চ্যাটে ইউজার টাকা গ্রহণের অনুরোধ তৈরি করলে অ্যাডমিন নোটিফিকেশন পাবেন।'
                      : 'Notify when a buyer generates a money receive request card in chat.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleTestTrigger(
                        '📥 রিসিভ রিকোয়েস্ট তৈরি হয়েছে',
                        'চ্যাটে টাকা গ্রহণের অনুরোধ তৈরি করা হয়েছে।',
                        'receiveRequest',
                      )
                    }
                    title="টেস্ট নোটিফিকেশন পাঠান"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle('superAdmin', 'receiveRequest')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.superAdmin.receiveRequest ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config.superAdmin.receiveRequest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Audio and Push Master Toggles for Super Admin */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-500" />
                    <span>{lang === 'bn' ? 'সাউন্ড অ্যালার্ট চালু রাখুন' : 'Admin Sound Ringtone'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'অ্যাডমিন প্যানেলে অ্যালার্ট আসার সময় রিংটোন বাজবে' : 'Play audio chime on admin alert'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('superAdmin', 'soundAlerts')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.superAdmin.soundAlerts ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.superAdmin.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'ব্রাউজার পুশ নোটিফিকেশন' : 'Browser Desktop/Mobile Push'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'ট্যাব বন্ধ থাকলেও কম্পিউটারে পপআপ আসবে' : 'Show banner notifications even when tab is backgrounded'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('superAdmin', 'browserPush')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.superAdmin.browserPush ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.superAdmin.browserPush ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER NOTIFICATIONS */}
      {activeTab === 'user' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'সাধারণ ব্যবহারকারী (User) নোটিফিকেশন' : 'General User Notification Triggers'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'গ্রাহকরা তাদের অ্যাকাউন্ট, মেসেজ এবং লেনদেনের কোন কোন আপডেটের নোটিফিকেশন পাবেন তা নির্ধারণ করুন।'
                  : 'Configure which alerts end-users will receive on mobile and desktop.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Chat Message */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'কেউ মেসেজ দিলে (Chat Message)' : 'Chat Messages'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'অন্য কোনো ইউজার মেসেজ পাঠালে প্রেরকের নাম ও মেসেজ প্রিভিউ সহ ফোন/পিসিতে পুশ নোটিফিকেশন যাবে।'
                      : 'Trigger real-time push showing sender name and message preview when receiving messages.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('user', 'chatMessage')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.user.chatMessage ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.user.chatMessage ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 2. Recharge Status (Pending & Success) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'bn' ? 'রিচার্জ পেন্ডিং ও সাকসেস হলে' : 'Recharge Pending & Success'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'রিচার্জ রিকোয়েস্ট সাবমিট হলে পেন্ডিং নোটিফিকেশন এবং অ্যাডমিন অনুমোদন দিলে ব্যালেন্স ক্রেডিট নোটিফিকেশন যাবে।'
                      : 'Notify user when deposit is submitted (pending) and when admin verifies & credits balance.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('user', 'rechargeStatus')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.user.rechargeStatus ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.user.rechargeStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Withdraw Status (Pending & Success) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'bn' ? 'উইথড্র পেন্ডিং ও সাকসেস হলে' : 'Withdrawal Pending & Success'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'উইথড্র আবেদন জমা হওয়া মাত্র পেন্ডিং নোটিফিকেশন এবং অ্যাডমিন টাকা পাঠিয়ে দিলে সাকসেস নোটিফিকেশন যাবে।'
                      : 'Notify user when payout request is placed and when admin disburses the money.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('user', 'withdrawStatus')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.user.withdrawStatus ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.user.withdrawStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Pay / Receive Request Received */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-500" />
                    <span>{lang === 'bn' ? 'পেমেন্ট বা রিসিভ রিকোয়েস্ট আসলে' : 'Pay or Receive Requests in Chat'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'চ্যাটে বায়ার বা সেলার টাকা দেওয়া বা নেওয়ার রিকোয়েস্ট পাঠালে সাথে সাথে নোটিফিকেশন পৌঁছাবে।'
                      : 'Instant alert when another party initiates a Pay or Receive card inside direct conversation.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('user', 'payReceiveRequest')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.user.payReceiveRequest ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.user.payReceiveRequest ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Master User Audio/Push settings */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'ইউজার সাউন্ড অ্যালার্ট' : 'User Audio Alerts'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'মেসেজ ও লেনদেনের সময় অডিও রিংটোন বাজবে' : 'Play synthetic audio chime on chat & wallet'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('user', 'soundAlerts')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.user.soundAlerts ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.user.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'ব্রাউজার পুশ প্রম্পট' : 'User Browser Push Alerts'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'ইউজারদের ফোন বা কম্পিউটারে পুশ নোটিফিকেশন সক্রিয় থাকবে' : 'Enable browser push for users'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('user', 'browserPush')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.user.browserPush ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.user.browserPush ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE & STAFF NOTIFICATIONS */}
      {activeTab === 'employee' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span>{lang === 'bn' ? 'কর্মচারী ও স্টাফ (Employee & Staff) নোটিফিকেশন' : 'Staff & Employee Operational Alerts'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'দায়িত্বপ্রাপ্ত কর্মচারীরা তাদের কার্যপরিধি অনুযায়ী কোন কোন কাজের নোটিফিকেশন পাবেন তা সেট করুন।'
                  : 'Assign real-time operational queues and alerts for moderators and staff members.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Recharge Queue */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'bn' ? 'রিচার্জ কিউ নোটিফিকেশন' : 'Recharge Queue Alerts'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'নতুন রিচার্জ রিকোয়েস্ট আসলে দায়িত্বপ্রাপ্ত স্টাফদের অবিলম্বে অ্যালার্ট যাবে।'
                      : 'Notify staff members assigned to verify recharge deposits.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('employee', 'rechargeQueue')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.employee.rechargeQueue ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.employee.rechargeQueue ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 2. Withdraw Queue */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'bn' ? 'উইথড্র কিউ নোটিফিকেশন' : 'Withdrawal Processing Queue'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'নতুন উইথড্র আবেদন আসলে ফাইন্যান্স স্টাফদের দ্রুত টাকা প্রেরণের জন্য নোটিফিকেশন পাঠানো হবে।'
                      : 'Notify finance staff when cashouts are waiting for disbursement.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('employee', 'withdrawQueue')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.employee.withdrawQueue ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.employee.withdrawQueue ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Dispute Calling Queue */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>{lang === 'bn' ? 'ডিসপ্যুট ও কল অ্যাডমিন কিউ' : 'Dispute & Arbitration Calling Queue'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'কোনো লেনদেনে বিরোধ ঘটলে বা কল অ্যাডমিন চাপলে দায়িত্বপ্রাপ্ত মধ্যস্থতাকারীদের উচ্চ অগ্রাধিকার নোটিফিকেশন যাবে।'
                      : 'Emergency notification for dispute resolution staff to intervene in live chats.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('employee', 'disputeCalling')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.employee.disputeCalling ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.employee.disputeCalling ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Chat Mediation */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-500" />
                    <span>{lang === 'bn' ? 'লাইভ চ্যাট সহায়তা ও মেডিয়শন' : 'Live Chat Mediation Alerts'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'লাইভ চ্যাট পর্যবেক্ষণে গুরুত্বপূর্ণ বার্তা বা ডিল সম্পর্কিত পরিবর্তন ঘটলে জানানো হবে।'
                      : 'Notify moderators when flagged words or help requests appear in chat.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('employee', 'chatMediation')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.employee.chatMediation ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.employee.chatMediation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 5. New Registration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-500" />
                    <span>{lang === 'bn' ? 'নতুন ইউজার রেজিস্ট্রেশন অ্যালার্ট' : 'New User Signup Alert'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'স্টাফদের নতুন রেজিস্ট্রেশন পর্যবেক্ষণ করার অনুমতি চালু বা বন্ধ রাখুন।'
                      : 'Toggle whether general staff should receive new user signup alerts.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('employee', 'newRegistration')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.employee.newRegistration ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.employee.newRegistration ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Master Employee Audio/Push settings */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'bn' ? 'স্টাফ সাউন্ড অ্যালার্ট' : 'Staff Audio Chime'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'কিউতে নতুন কাজ আসলে কর্মচারীদের সাউন্ড অ্যালার্ট বাজবে' : 'Play audio tone when queue receives tasks'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('employee', 'soundAlerts')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.employee.soundAlerts ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.employee.soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'bn' ? 'স্টাফ ব্রাউজার পুশ' : 'Staff Browser Push'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'স্টাফ কনসোলে ব্রাউজার নোটিফিকেশন সক্রিয় থাকবে' : 'Push notifications for staff members'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('employee', 'browserPush')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.employee.browserPush ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.employee.browserPush ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

