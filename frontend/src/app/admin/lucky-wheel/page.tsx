'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Sparkles,
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  History,
  Coins,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Heart,
  Palette,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface WheelSegmentAdmin {
  id: string;
  title: string;
  prizeType: string;
  prizeValue: number;
  probabilityWeight: number;
  color: string;
  textColor: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

interface WheelSettings {
  id: string;
  isEnabled: boolean;
  isBudgetEnabled: boolean;
  dailyBudget: number;
  isNewUserRewardEnabled: boolean;
  newUserMinReward: number;
  newUserMaxReward: number;
  isMonthlyCapEnabled: boolean;
  monthlyMaxPerUser: number;
  emptyMessage: string;
  dailyFreeSpinsPerUser: number;
}

interface Telemetry {
  todayCashDisbursed: number;
  todaySpinsCount: number;
  monthCashDisbursed: number;
  totalSpinsCount: number;
}

interface SpinLogItem {
  id: string;
  userId: string;
  prizeType: string;
  prizeValue: number;
  spinSource: string;
  createdAt: string;
  user?: {
    uniqueUserId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  segment?: {
    title?: string;
    color?: string;
  };
}

export default function AdminLuckyWheelPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'rules' | 'segments' | 'preview' | 'logs'>('rules');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [settings, setSettings] = useState<WheelSettings>({
    id: 'default',
    isEnabled: true,
    isBudgetEnabled: true,
    dailyBudget: 500,
    isNewUserRewardEnabled: true,
    newUserMinReward: 2,
    newUserMaxReward: 15,
    isMonthlyCapEnabled: true,
    monthlyMaxPerUser: 150,
    emptyMessage:
      'শূন্য আমি রিক্ত আমি আজ দেওয়ার কিছু নাই, আজ আছে শুধু ভালোবাসা দিয়ে গেলাম তাই, আবার চেষ্টা করুন ❤️',
    dailyFreeSpinsPerUser: 1,
  });

  const [segments, setSegments] = useState<WheelSegmentAdmin[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    todayCashDisbursed: 0,
    todaySpinsCount: 0,
    monthCashDisbursed: 0,
    totalSpinsCount: 0,
  });

  // New Segment form modal
  const [showAddSegmentModal, setShowAddSegmentModal] = useState(false);
  const [newSegment, setNewSegment] = useState<{
    title: string;
    prizeType: string;
    prizeValue: number;
    probabilityWeight: number;
    color: string;
    textColor: string;
    icon?: string;
  }>({
    title: '৳৫ ক্যাশ',
    prizeType: 'CASH',
    prizeValue: 5,
    probabilityWeight: 20,
    color: '#3B82F6',
    textColor: '#FFFFFF',
    icon: 'Coins',
  });

  // Spin Logs
  const [logs, setLogs] = useState<SpinLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  // Canvas ref for Admin Live Preview
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/lucky-wheel/admin/config');
      const data = (res as any)?.data ?? res;
      if (data) {
        if (data.settings) setSettings(data.settings);
        if (data.segments) setSegments(data.segments);
        if (data.telemetry) setTelemetry(data.telemetry);
      }
    } catch (err: any) {
      console.error('Failed to load admin lucky wheel config:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page: number = 1) => {
    try {
      setLogsLoading(true);
      const res = await api.get(`/lucky-wheel/admin/spins?page=${page}&limit=20`);
      const data = (res as any)?.data ?? res;
      if (data) {
        setLogs(data.items || []);
        setLogsPage(data.page || 1);
        setLogsTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch spin logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs(logsPage);
    }
  }, [activeTab, logsPage, fetchLogs]);

  // Draw Preview Canvas
  const drawPreviewWheel = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || segments.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2;
    const activeSegments = segments.filter((s) => s.isActive);
    if (activeSegments.length === 0) return;
    const arc = (2 * Math.PI) / activeSegments.length;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(radius, radius);

    activeSegments.forEach((seg, i) => {
      const angle = i * arc;

      ctx.beginPath();
      ctx.fillStyle = seg.color || '#3B82F6';
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius - 8, angle, angle + arc);
      ctx.lineTo(0, 0);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.textColor || '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';

      const title = seg.title.length > 12 ? seg.title.substring(0, 11) + '…' : seg.title;
      ctx.fillText(title, radius - 20, 4);
      ctx.restore();
    });

    ctx.restore();

    // Center Hub
    ctx.beginPath();
    ctx.arc(radius, radius, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(radius, radius, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('★', radius, radius);
  }, [segments]);

  useEffect(() => {
    if (activeTab === 'preview' || activeTab === 'segments') {
      drawPreviewWheel();
    }
  }, [activeTab, segments, drawPreviewWheel]);

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setSaveSuccess(false);
      setSaveError(null);

      await api.patch('/lucky-wheel/admin/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || (lang === 'bn' ? 'সেটিংস সেভ করতে ব্যর্থ হয়েছে' : 'Failed to save settings'));
    } finally {
      setSavingSettings(false);
    }
  };

  // Create Segment
  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/lucky-wheel/admin/segments', newSegment);
      const data = (res as any)?.data ?? res;
      setSegments((prev) => [...prev, data]);
      setShowAddSegmentModal(false);
      setNewSegment({
        title: '',
        prizeType: 'CASH',
        prizeValue: 0,
        probabilityWeight: 10,
        color: '#3B82F6',
        textColor: '#FFFFFF',
        icon: 'Coins',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || (lang === 'bn' ? 'সেগমেন্ট তৈরিতে সমস্যা হয়েছে' : 'Failed to create segment'));
    }
  };

  // Update existing segment
  const handleUpdateSegment = async (id: string, updates: Partial<WheelSegmentAdmin>) => {
    try {
      const res = await api.patch(`/lucky-wheel/admin/segments/${id}`, updates);
      const data = (res as any)?.data ?? res;
      setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    } catch (err: any) {
      alert(err.response?.data?.message || (lang === 'bn' ? 'সেগমেন্ট আপডেট করতে ব্যর্থ হয়েছে' : 'Failed to update segment'));
    }
  };

  // Delete segment
  const handleDeleteSegment = async (id: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই সেগমেন্টটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this segment?')) return;
    try {
      await api.delete(`/lucky-wheel/admin/segments/${id}`);
      setSegments((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || (lang === 'bn' ? 'সেগমেন্ট ডিলিট করতে সমস্যা হয়েছে' : 'Failed to delete segment'));
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">
          {lang === 'bn' ? 'লাকি হুইল কনফিগারেশন লোড হচ্ছে...' : 'Loading Lucky Wheel Configuration...'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{lang === 'bn' ? 'লাকি হুইল ম্যানেজমেন্ট' : 'Lucky Wheel Management'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold border border-amber-300 dark:border-amber-800">
                {lang === 'bn' ? 'কন্ট্রোল সেন্টার' : 'Control Center'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'দৈনিক বাজেট, নতুন ইউজার লিমিট, ডায়নামিক স্লাইস ও কাব্যিক বাংলা মেসেজ সম্পূর্ণ কাস্টমাইজ করুন'
                : 'Fully customize daily budgets, reward rules, dynamic slices & poetic messages'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {savingSettings
                ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                : (lang === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Settings')}
            </span>
          </button>
        </div>
      </div>

      {/* Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{lang === 'bn' ? 'আজকের বিতরণকৃত ক্যাশ' : "Today's Cash Disbursed"}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            ৳{telemetry.todayCashDisbursed.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'বাজেট:' : 'Budget:'}{' '}
            {settings.isBudgetEnabled ? `৳${settings.dailyBudget}` : (lang === 'bn' ? 'আনলিমিটেড' : 'Unlimited')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{lang === 'bn' ? 'আজকে মোট স্পিন' : "Today's Total Spins"}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {telemetry.todaySpinsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'আজকের সক্রিয় ব্যবহারকারী' : 'Active users today'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{lang === 'bn' ? 'চলতি মাসের মোট খরচ' : 'Monthly Cash Disbursed'}</span>
            <Coins className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            ৳{telemetry.monthCashDisbursed.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'ক্যালেন্ডার মাস অনুযায়ী' : 'Current calendar month'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{lang === 'bn' ? 'সর্বমোট স্পিন সংখ্যা' : 'Lifetime Spins Count'}</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">
            {telemetry.totalSpinsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'প্ল্যাটফর্ম শুরু থেকে আজ পর্যন্ত' : 'All time system spins'}
          </p>
        </div>
      </div>

      {/* Save Alerts */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>
            {lang === 'bn'
              ? 'লাকি হুইলের সমস্ত সেটিংস সফলভাবে আপডেট করা হয়েছে!'
              : 'Lucky wheel settings have been successfully updated!'}
          </span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'rules'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-t-2 border-sky-500 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{lang === 'bn' ? '১. বাজেট ও লিমিট রুলস' : '1. Budget & Limit Rules'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('segments')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'segments'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-t-2 border-sky-500 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>
            {lang === 'bn'
              ? `২. ডায়নামিক হুইল স্লাইস (${segments.length}টি)`
              : `2. Dynamic Wheel Slices (${segments.length})`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'preview'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-t-2 border-sky-500 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>{lang === 'bn' ? '৩. লাইভ প্রিভিউ' : '3. Live Preview'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-t-2 border-sky-500 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{lang === 'bn' ? '৪. স্পিন হিস্ট্রি ও অডিট' : '4. Spin History & Audit'}</span>
        </button>
      </div>

      {/* TAB 1: Budget, Rules & Poetry Settings */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Global Enable Switch */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'লাকি হুইল সিস্টেম সক্রিয় রাখুন' : 'Enable Lucky Wheel System'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'বন্ধ করলে ইউজাররা স্পিন করতে পারবেন না'
                    : 'If disabled, users cannot spin the wheel'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* 2. Dynamic Daily Budget Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'দৈনিক বাজেট লিমিট সক্রিয় রাখুন' : 'Enable Daily Budget Cap'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'বাজেট সেট করতেও পারেন নাও করতে পারেন (সম্পূর্ণ ডায়নামিক)'
                    : 'Budget cap is completely optional & dynamic'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isBudgetEnabled}
                  onChange={(e) => setSettings({ ...settings, isBudgetEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Budget & New User Caps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Daily Budget Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'দৈনিক বাজেট ক্যাপ (৳)' : 'Daily Budget Cap (৳)'}
              </label>
              <input
                type="number"
                disabled={!settings.isBudgetEnabled}
                value={settings.dailyBudget}
                onChange={(e) =>
                  setSettings({ ...settings, dailyBudget: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-40"
                placeholder="500"
              />
              <span className="text-[11px] text-slate-400">
                {settings.isBudgetEnabled
                  ? (lang === 'bn'
                      ? 'এই বাজেট পূর্ণ হলে আর কোনো ক্যাশ রিওয়ার্ড আসবে না'
                      : 'No cash rewards will be given after this cap is reached today')
                  : (lang === 'bn' ? 'বাজেট লিমিট বর্তমানে নিষ্ক্রিয়' : 'Budget cap is currently disabled')}
              </span>
            </div>

            {/* New User Reward Range Min */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'নতুন ইউজারের সর্বনিম্ন প্রাপ্তি (৳)' : 'New User Min Reward (৳)'}
              </label>
              <input
                type="number"
                value={settings.newUserMinReward}
                onChange={(e) =>
                  setSettings({ ...settings, newUserMinReward: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                placeholder="2"
              />
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'নতুন নিবন্ধিতদের মিনিমাম রেঞ্জ' : 'Minimum reward range for newly registered users'}
              </span>
            </div>

            {/* New User Reward Range Max */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'নতুন ইউজারের সর্বোচ্চ প্রাপ্তি (৳)' : 'New User Max Reward (৳)'}
              </label>
              <input
                type="number"
                value={settings.newUserMaxReward}
                onChange={(e) =>
                  setSettings({ ...settings, newUserMaxReward: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                placeholder="15"
              />
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'নতুন নিবন্ধিতদের ম্যাক্সিমাম রেঞ্জ' : 'Maximum reward range for newly registered users'}
              </span>
            </div>
          </div>

          {/* Monthly Cap & User Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Monthly Max per User */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn'
                    ? 'একজন ইউজারের মাসিক সর্বোচ্চ ক্যাশ জয়সীমা (৳) [ইউজারের কাছে গোপন থাকবে]'
                    : 'Monthly Max Cash Cap Per User (৳) [Hidden from user]'}
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isMonthlyCapEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, isMonthlyCapEnabled: e.target.checked })
                    }
                    className="rounded text-sky-600"
                  />
                  <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                </label>
              </div>
              <input
                type="number"
                disabled={!settings.isMonthlyCapEnabled}
                value={settings.monthlyMaxPerUser}
                onChange={(e) =>
                  setSettings({ ...settings, monthlyMaxPerUser: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-40"
                placeholder="150"
              />
              <span className="text-[11px] text-slate-400">
                {lang === 'bn'
                  ? 'এক মাসে কোনো ইউজার এই পরিমাণের বেশি ক্যাশ জিততে পারবে না (ইউজারকে দেখানো হবে না)'
                  : 'User cannot exceed this winning cap per calendar month (hidden from user view)'}
              </span>
            </div>

            {/* Note on Unlimited Spins */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
              <h5 className="font-bold text-xs text-amber-700 dark:text-amber-300">
                {lang === 'bn' ? '✨ আনলিমিটেড স্পিন রুল' : '✨ Unlimited Spins Rule'}
              </h5>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'ইউজাররা দিনে যতখুশি ততবার স্পিন করতে পারবেন। তবে দিনে সর্বোচ্চ একবার ক্যাশ জিততে পারবেন, বাকি স্পিনে বা বেশিরভাগ সময় কাব্যিক বার্তা আসবে।'
                  : 'Users can spin as many times as they want per day. Cash can be won at most once per day, and all other spins land on poetic greetings.'}
              </p>
            </div>
          </div>

          {/* Requested Poetic Bengali Message Editor */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {lang === 'bn'
                  ? '"আবার চেষ্টা করুন" পপআপ মেসেজ (কাব্যিক বাংলা বার্তা):'
                  : 'Try Again Poetic Bengali Message:'}
              </label>
            </div>
            <textarea
              rows={3}
              value={settings.emptyMessage}
              onChange={(e) => setSettings({ ...settings, emptyMessage: e.target.value })}
              className="w-full p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-900 dark:text-rose-200 focus:outline-sky-500 leading-relaxed"
              placeholder="শূন্য আমি রিক্ত আমি আজ দেওয়ার কিছু নাই..."
            />
            <p className="text-[11px] text-slate-400">
              {lang === 'bn'
                ? 'হুইলে কোনো টাকা বা পুরস্কার না উঠলে ইউজারের স্ক্রিনে এই সুন্দর বার্তাটি ভেসে উঠবে।'
                : 'This poetic Bengali message appears when non-cash segments are landed.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Dynamic Slices Builder */}
      {activeTab === 'segments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'হুইলে কতটি ফিল্ড থাকবে তা আপনি ইচ্ছামতো বাড়াতে বা কমাতে পারেন। প্রতিটি ফিল্ডের পুরস্কার, রং ও সম্ভাবনা নির্ধারণ করুন।'
                : 'Configure how many slices exist on the wheel. Customize title, prize, probability weight & colors.'}
            </p>
            <button
              type="button"
              onClick={() => setShowAddSegmentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নতুন স্লাইস যোগ করুন' : 'Add New Slice'}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">{lang === 'bn' ? 'ফিল্ডের নাম (Title)' : 'Slice Title'}</th>
                    <th className="py-3.5 px-4">{lang === 'bn' ? 'ধরন (Type)' : 'Prize Type'}</th>
                    <th className="py-3.5 px-4">{lang === 'bn' ? 'ক্যাশ মান (৳)' : 'Prize Value (৳)'}</th>
                    <th className="py-3.5 px-4">{lang === 'bn' ? 'প্রবাবিলিটি ওয়েইট' : 'Probability Weight'}</th>
                    <th className="py-3.5 px-4">{lang === 'bn' ? 'রং (Color)' : 'Color'}</th>
                    <th className="py-3.5 px-4">{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {segments.map((seg) => (
                    <tr key={seg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <input
                          type="text"
                          value={seg.title}
                          onChange={(e) => handleUpdateSegment(seg.id, { title: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-36 font-semibold"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={seg.prizeType}
                          onChange={(e) => handleUpdateSegment(seg.id, { prizeType: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                          <option value="CASH">{lang === 'bn' ? 'ক্যাশ (CASH)' : 'Cash (CASH)'}</option>
                          <option value="TRY_AGAIN">{lang === 'bn' ? 'আবার চেষ্টা করুন (TRY_AGAIN)' : 'Try Again (TRY_AGAIN)'}</option>
                          <option value="JOB_VOUCHER">{lang === 'bn' ? 'ভাউচার (VOUCHER)' : 'Voucher (VOUCHER)'}</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={seg.prizeValue}
                          onChange={(e) =>
                            handleUpdateSegment(seg.id, {
                              prizeValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-20 font-bold"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={seg.probabilityWeight}
                          onChange={(e) =>
                            handleUpdateSegment(seg.id, {
                              probabilityWeight: parseInt(e.target.value) || 1,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs w-16 font-bold"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={seg.color}
                            onChange={(e) => handleUpdateSegment(seg.id, { color: e.target.value })}
                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-[11px] text-slate-500 font-mono">{seg.color}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleUpdateSegment(seg.id, { isActive: !seg.isActive })}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            seg.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {seg.isActive ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'বন্ধ' : 'Disabled')}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSegment(seg.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Live Preview Wheel */}
      {activeTab === 'preview' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            {lang === 'bn'
              ? `লাইভ হুইল প্রিভিউ (${segments.filter((s) => s.isActive).length}টি সক্রিয় স্লাইস)`
              : `Live Wheel Preview (${segments.filter((s) => s.isActive).length} active slices)`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md text-center">
            {lang === 'bn'
              ? 'এডমিন প্যানেলে স্লাইস ও রং পরিবর্তনের সাথে সাথে ইউজাররা এই হুইলটি দেখতে পাবেন।'
              : 'As you configure slices, users will instantly see this rendered canvas.'}
          </p>

          <div className="p-3 rounded-full bg-slate-950 shadow-2xl border-4 border-amber-500/40">
            <canvas
              ref={previewCanvasRef}
              width={340}
              height={340}
              className="rounded-full max-w-[340px] max-h-[340px]"
            />
          </div>
        </div>
      )}

      {/* TAB 4: Spin Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {lang === 'bn' ? 'ব্যবহারকারীদের স্পিন অডিট হিস্ট্রি' : 'User Spin Audit Logs'}
            </h3>
            <span className="text-xs text-slate-400">
              {lang === 'bn' ? `পেজ ${logsPage} / ${logsTotalPages}` : `Page ${logsPage} of ${logsTotalPages}`}
            </span>
          </div>

          {logsLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400">
              {lang === 'bn' ? 'এখনো কোনো স্পিন হয়নি' : 'No spins recorded yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{lang === 'bn' ? 'ইউজার' : 'User'}</th>
                    <th className="py-3 px-4">{lang === 'bn' ? 'প্রাপ্ত স্লাইস' : 'Landed Slice'}</th>
                    <th className="py-3 px-4">{lang === 'bn' ? 'পুরস্কারের ধরন' : 'Prize Type'}</th>
                    <th className="py-3 px-4">{lang === 'bn' ? 'পরিমাণ (৳)' : 'Amount (৳)'}</th>
                    <th className="py-3 px-4">{lang === 'bn' ? 'স্পিন সোর্স' : 'Source'}</th>
                    <th className="py-3 px-4 text-right">{lang === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {log.user?.firstName || (lang === 'bn' ? 'ইউজার' : 'User')}{' '}
                        <span className="text-slate-400 text-[11px]">
                          ({log.user?.uniqueUserId || log.user?.phone || 'N/A'})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        {log.segment?.title || (lang === 'bn' ? 'স্লাইস' : 'Slice')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.prizeType === 'CASH'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {log.prizeType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-500">
                        {log.prizeValue > 0 ? `৳${log.prizeValue.toFixed(2)}` : '৳০.০০'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{log.spinSource}</td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Segment */}
      {showAddSegmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {lang === 'bn' ? 'নতুন হুইল স্লাইস যোগ করুন' : 'Add New Wheel Slice'}
            </h3>

            <form onSubmit={handleCreateSegment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'স্লাইস টাইটেল' : 'Slice Title'}
                </label>
                <input
                  type="text"
                  required
                  value={newSegment.title}
                  onChange={(e) => setNewSegment({ ...newSegment, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  placeholder={lang === 'bn' ? 'যেমন: ৳১০ ক্যাশ বা আবার চেষ্টা করুন' : 'e.g. ৳10 Cash or Try Again'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'পুরস্কারের ধরন' : 'Prize Type'}
                  </label>
                  <select
                    value={newSegment.prizeType}
                    onChange={(e) => setNewSegment({ ...newSegment, prizeType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="CASH">{lang === 'bn' ? 'ক্যাশ (CASH)' : 'Cash (CASH)'}</option>
                    <option value="TRY_AGAIN">{lang === 'bn' ? 'আবার চেষ্টা করুন (TRY_AGAIN)' : 'Try Again (TRY_AGAIN)'}</option>
                    <option value="JOB_VOUCHER">{lang === 'bn' ? 'ভাউচার (VOUCHER)' : 'Voucher (VOUCHER)'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'পুরস্কার মান (৳)' : 'Prize Value (৳)'}
                  </label>
                  <input
                    type="number"
                    value={newSegment.prizeValue}
                    onChange={(e) =>
                      setNewSegment({ ...newSegment, prizeValue: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'প্রবাবিলিটি ওয়েইট' : 'Probability Weight'}
                  </label>
                  <input
                    type="number"
                    value={newSegment.probabilityWeight}
                    onChange={(e) =>
                      setNewSegment({
                        ...newSegment,
                        probabilityWeight: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    placeholder="20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'স্লাইস ব্যাকগ্রাউন্ড কালার' : 'Slice Background Color'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newSegment.color}
                      onChange={(e) => setNewSegment({ ...newSegment, color: e.target.value })}
                      className="w-8 h-8 rounded border-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-slate-500">{newSegment.color}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSegmentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  {lang === 'bn' ? 'যোগ করুন' : 'Add Slice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
