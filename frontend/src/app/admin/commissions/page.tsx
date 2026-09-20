'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  Percent,
  Plus,
  Edit2,
  RefreshCw,
  Calculator,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Trash2,
  Save,
  Check,
  Settings2,
  Info,
  Layers,
  Tag,
  Zap,
} from 'lucide-react';

interface CoreFeeSetting {
  rateType: 'PERCENTAGE' | 'FLAT';
  value: number;
  isActive: boolean;
  minFee: number;
  maxFee: number;
}

interface CoreSettings {
  recharge: CoreFeeSetting;
  withdraw: CoreFeeSetting;
  transaction: CoreFeeSetting;
}

interface CommissionRule {
  id: string;
  name: string;
  scope: 'GLOBAL' | 'CATEGORY' | 'PHYSICAL_PRODUCT' | 'DIGITAL_PRODUCT' | 'TRANSACTION_TYPE';
  categorySlug?: string | null;
  rateType: 'PERCENTAGE' | 'FLAT';
  value: number | string;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

const unwrap = (res: any) => {
  if (res && res.data !== undefined) return res.data;
  return res;
};

export default function AdminCommissionsPage() {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [savingCore, setSavingCore] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Core settings state
  const [coreSettings, setCoreSettings] = useState<CoreSettings>({
    recharge: {
      rateType: 'PERCENTAGE',
      value: 0,
      isActive: true,
      minFee: 0,
      maxFee: 0,
    },
    withdraw: {
      rateType: 'PERCENTAGE',
      value: 0,
      isActive: true,
      minFee: 0,
      maxFee: 0,
    },
    transaction: {
      rateType: 'PERCENTAGE',
      value: 5,
      isActive: true,
      minFee: 0,
      maxFee: 0,
    },
  });

  // Custom Rules Matrix
  const [rules, setRules] = useState<CommissionRule[]>([]);

  // Modal State for Custom Category/Product Rule
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    scope: 'CATEGORY',
    categorySlug: '',
    rateType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    value: '5.0',
    priority: '10',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulator State
  const [simType, setSimType] = useState<'TRANSACTION' | 'RECHARGE' | 'WITHDRAW'>('TRANSACTION');
  const [simAmount, setSimAmount] = useState('1000');
  const [simProductType, setSimProductType] = useState('DIGITAL');
  const [simCategorySlug, setSimCategorySlug] = useState('');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Load core settings & rules
  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, rulesRes] = await Promise.all([
        api.get('/commission/admin/settings').catch(() => api.get('/commission/settings')),
        api.get('/commission/admin/rules').catch(() => null),
      ]);

      const raw = unwrap(settingsRes);
      const settingsData = raw?.data || raw;
      if (settingsData && (settingsData.withdraw || settingsData.recharge)) {
        setCoreSettings({
          recharge: {
            rateType: settingsData.recharge?.rateType || 'PERCENTAGE',
            value: Number(settingsData.recharge?.value ?? 0),
            isActive: settingsData.recharge?.isActive !== false,
            minFee: Number(settingsData.recharge?.minFee ?? 0),
            maxFee: Number(settingsData.recharge?.maxFee ?? 0),
          },
          withdraw: {
            rateType: settingsData.withdraw?.rateType || 'PERCENTAGE',
            value: Number(settingsData.withdraw?.value ?? 0),
            isActive: settingsData.withdraw?.isActive !== false,
            minFee: Number(settingsData.withdraw?.minFee ?? 0),
            maxFee: Number(settingsData.withdraw?.maxFee ?? 0),
          },
          transaction: {
            rateType: settingsData.transaction?.rateType || 'PERCENTAGE',
            value: Number(settingsData.transaction?.value ?? 5),
            isActive: settingsData.transaction?.isActive !== false,
            minFee: Number(settingsData.transaction?.minFee ?? 0),
            maxFee: Number(settingsData.transaction?.maxFee ?? 0),
          },
        });
      }

      const rulesData = unwrap(rulesRes);
      if (Array.isArray(rulesData)) {
        setRules(rulesData);
      }
    } catch (err: any) {
      console.error('Failed to load commission data:', err);
      showToast('error', lang === 'bn' ? 'তথ্য লোড করতে সমস্যা হয়েছে' : 'Failed to load commission settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Core Settings (Individual or All)
  const handleSaveCoreSetting = async (targetKey: 'recharge' | 'withdraw' | 'transaction' | 'all') => {
    setSavingCore(targetKey);
    try {
      let payload: any = {};
      if (targetKey === 'all') {
        payload = coreSettings;
      } else {
        payload = { [targetKey]: coreSettings[targetKey] };
      }

      const res = await api.post('/commission/admin/settings', payload);
      const updated = unwrap(res);
      if (updated) {
        showToast(
          'success',
          lang === 'bn'
            ? targetKey === 'all'
              ? 'সকল কমিশন ও সার্ভিস চার্জ সফলভাবে সংরক্ষিত হয়েছে!'
              : `${
                  targetKey === 'recharge'
                    ? 'রিচার্জ'
                    : targetKey === 'withdraw'
                    ? 'উইথড্র'
                    : 'ট্রানজ্যাকশন'
                } চার্জ সফলভাবে আপডেট হয়েছে!`
            : 'Commission settings saved successfully!',
        );
        // Refresh simulation
        handleSimulate();
      }
    } catch (err: any) {
      console.error('Save core setting failed:', err);
      showToast(
        'error',
        err?.response?.data?.message ||
          (lang === 'bn' ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save settings'),
      );
    } finally {
      setSavingCore(null);
    }
  };

  // Run Simulator
  const handleSimulate = async () => {
    const amt = parseFloat(simAmount);
    if (isNaN(amt) || amt <= 0) return;
    setSimLoading(true);
    try {
      let url = `/commission/calculate?amount=${amt}&type=${simType}`;
      if (simType === 'TRANSACTION') {
        if (simProductType) url += `&productType=${simProductType}`;
        if (simCategorySlug) url += `&categorySlug=${encodeURIComponent(simCategorySlug.trim())}`;
      }

      const res = await api.get(url);
      const data = unwrap(res);
      if (data) {
        setSimResult(data);
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    handleSimulate();
  }, [simAmount, simType, simProductType, simCategorySlug]);

  // Submit Custom Rule
  const handleSubmitCustomRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        id: editingRuleId || undefined,
        name: formData.name.trim(),
        scope: formData.scope,
        categorySlug: formData.scope === 'CATEGORY' ? formData.categorySlug.trim() : null,
        rateType: formData.rateType,
        value: parseFloat(formData.value) || 0,
        priority: parseInt(formData.priority, 10) || 0,
        isActive: formData.isActive,
      };

      await api.post('/commission/admin/rules', payload);
      showToast(
        'success',
        lang === 'bn' ? 'কাস্টম রুল সফলভাবে সংরক্ষিত হয়েছে!' : 'Custom rule saved successfully!',
      );
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to save rule:', err);
      showToast(
        'error',
        err?.response?.data?.message || (lang === 'bn' ? 'রুল সংরক্ষণে ত্রুটি' : 'Failed to save rule'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Custom Rule
  const handleDeleteRule = async (id: string, name: string) => {
    const confirmMsg =
      lang === 'bn'
        ? `আপনি কি নিশ্চিতভাবে "${name}" রুলটি মুছে ফেলতে চান?`
        : `Are you sure you want to delete "${name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/commission/admin/rules/${id}`);
      showToast(
        'success',
        lang === 'bn' ? 'রুলটি সফলভাবে মুছে ফেলা হয়েছে' : 'Rule deleted successfully',
      );
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete rule:', err);
      showToast(
        'error',
        err?.response?.data?.message || (lang === 'bn' ? 'মুছে ফেলতে ব্যর্থ' : 'Failed to delete rule'),
      );
    }
  };

  // Helper calculation previews for the 3 cards
  const calculatePreview = (setting: CoreFeeSetting, sampleAmount: number = 1000) => {
    if (!setting.isActive) return { fee: 0, text: 'নিষ্ক্রিয় (কোন চার্জ প্রযোজ্য নয়)' };
    let fee = 0;
    if (setting.rateType === 'PERCENTAGE') {
      fee = (sampleAmount * Number(setting.value)) / 100;
    } else {
      fee = Number(setting.value);
    }
    if (setting.minFee && fee < setting.minFee) fee = setting.minFee;
    if (setting.maxFee && setting.maxFee > 0 && fee > setting.maxFee) fee = setting.maxFee;
    return { fee, text: `৳${fee.toFixed(2)}` };
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all transform animate-in slide-in-from-top-3 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'bn' ? 'কমিশন ও সার্ভিস চার্জ সেটিংস' : 'Commission & Service Charges'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {lang === 'bn'
                  ? 'প্রতিটি রিচার্জ, উইথড্র এবং ট্রানজ্যাকশন/লেনদেনের চার্জ ফ্ল্যাট (৳) বা পার্সেন্টেজ (%) আকারে নির্ধারণ করুন।'
                  : 'Configure flat (৳) or percentage (%) fees for recharge, withdrawal, and escrow transactions.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => handleSaveCoreSetting('all')}
            disabled={savingCore === 'all'}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {savingCore === 'all' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{lang === 'bn' ? 'সকল চার্জ সংরক্ষণ করুন' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 CORE SERVICE CHARGE CARDS (Recharge, Withdraw, Transaction) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <Settings2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'মূল প্ল্যাটফর্ম সার্ভিস চার্জ (৩টি প্রধান অপারেশন)' : 'Core Platform Service Charges'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. RECHARGE CHARGE CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-200 dark:border-blue-900/60 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ArrowDownCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'রিচার্জ চার্জ' : 'Recharge Fee'}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'bn' ? 'ওয়ালেট রিচার্জের সময় কর্তন' : 'Deposit / Wallet Topup'}
                    </span>
                  </div>
                </div>

                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setCoreSettings({
                      ...coreSettings,
                      recharge: {
                        ...coreSettings.recharge,
                        isActive: !coreSettings.recharge.isActive,
                      },
                    })
                  }
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                    coreSettings.recharge.isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {coreSettings.recharge.isActive
                    ? lang === 'bn'
                      ? 'সক্রিয়'
                      : 'ACTIVE'
                    : lang === 'bn'
                    ? 'নিষ্ক্রিয়'
                    : 'INACTIVE'}
                </button>
              </div>

              {/* Rate Type Selector: Flat vs Percentage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'চার্জের ধরন নির্বাচন করুন' : 'Charge Calculation Type'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() =>
                      setCoreSettings({
                        ...coreSettings,
                        recharge: { ...coreSettings.recharge, rateType: 'PERCENTAGE' },
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      coreSettings.recharge.rateType === 'PERCENTAGE'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'পার্সেন্টেজ (%)' : 'Percentage (%)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCoreSettings({
                        ...coreSettings,
                        recharge: { ...coreSettings.recharge, rateType: 'FLAT' },
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      coreSettings.recharge.rateType === 'FLAT'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>৳</span>
                    <span>{lang === 'bn' ? 'ফ্ল্যাট (৳ ফিক্সড)' : 'Flat (৳ Fixed)'}</span>
                  </button>
                </div>
              </div>

              {/* Rate Value Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn'
                    ? coreSettings.recharge.rateType === 'PERCENTAGE'
                      ? 'চার্জের পরিমাণ (শতকরা %)'
                      : 'চার্জের পরিমাণ (ফিক্সড ৳)'
                    : 'Charge Rate / Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={coreSettings.recharge.value}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        recharge: {
                          ...coreSettings.recharge,
                          value: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {coreSettings.recharge.rateType === 'PERCENTAGE' ? '%' : '৳'}
                  </span>
                </div>
              </div>

              {/* Min and Max Limits (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'সর্বনিম্ন ফি (৳)' : 'Min Fee Cap (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={coreSettings.recharge.minFee}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        recharge: {
                          ...coreSettings.recharge,
                          minFee: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'সর্বোচ্চ ফি (৳)' : 'Max Fee Cap (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={coreSettings.recharge.maxFee}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        recharge: {
                          ...coreSettings.recharge,
                          maxFee: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0 = Unlimited"
                  />
                </div>
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-300">
                  <span>{lang === 'bn' ? '৳১,০০০ রিচার্জে চার্জ:' : 'Charge on ৳1,000:'}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {calculatePreview(coreSettings.recharge, 1000).text}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{lang === 'bn' ? 'ইউজার ব্যালেন্স পাবে:' : 'Net Credited:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ৳
                    {(
                      1000 - calculatePreview(coreSettings.recharge, 1000).fee
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Save Button */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveCoreSetting('recharge')}
                disabled={savingCore === 'recharge'}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
              >
                {savingCore === 'recharge' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'bn' ? 'রিচার্জ চার্জ সংরক্ষণ' : 'Save Recharge Setting'}</span>
              </button>
            </div>
          </div>

          {/* 2. WITHDRAW CHARGE CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-200 dark:border-amber-900/60 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ArrowUpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'উইথড্র চার্জ (ক্যাশআউট)' : 'Withdrawal Fee'}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'bn' ? 'ক্যাশআউটের সময় কর্তন' : 'Cashout / Payout Fee'}
                    </span>
                  </div>
                </div>

                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setCoreSettings({
                      ...coreSettings,
                      withdraw: {
                        ...coreSettings.withdraw,
                        isActive: !coreSettings.withdraw.isActive,
                      },
                    })
                  }
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                    coreSettings.withdraw.isActive
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {coreSettings.withdraw.isActive
                    ? lang === 'bn'
                      ? 'সক্রিয়'
                      : 'ACTIVE'
                    : lang === 'bn'
                    ? 'নিষ্ক্রিয়'
                    : 'INACTIVE'}
                </button>
              </div>

              {/* Rate Type Selector: Flat vs Percentage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'চার্জের ধরন নির্বাচন করুন' : 'Charge Calculation Type'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() =>
                      setCoreSettings({
                        ...coreSettings,
                        withdraw: { ...coreSettings.withdraw, rateType: 'PERCENTAGE' },
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      coreSettings.withdraw.rateType === 'PERCENTAGE'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'পার্সেন্টেজ (%)' : 'Percentage (%)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCoreSettings({
                        ...coreSettings,
                        withdraw: { ...coreSettings.withdraw, rateType: 'FLAT' },
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      coreSettings.withdraw.rateType === 'FLAT'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>৳</span>
                    <span>{lang === 'bn' ? 'ফ্ল্যাট (৳ ফিক্সড)' : 'Flat (৳ Fixed)'}</span>
                  </button>
                </div>
              </div>

              {/* Rate Value Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn'
                    ? coreSettings.withdraw.rateType === 'PERCENTAGE'
                      ? 'চার্জের পরিমাণ (শতকরা %)'
                      : 'চার্জের পরিমাণ (ফিক্সড ৳)'
                    : 'Charge Rate / Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={coreSettings.withdraw.value}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        withdraw: {
                          ...coreSettings.withdraw,
                          value: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="1.5"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {coreSettings.withdraw.rateType === 'PERCENTAGE' ? '%' : '৳'}
                  </span>
                </div>
              </div>

              {/* Min and Max Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'সর্বনিম্ন ফি (৳)' : 'Min Fee Cap (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={coreSettings.withdraw.minFee}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        withdraw: {
                          ...coreSettings.withdraw,
                          minFee: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'সর্বোচ্চ ফি (৳)' : 'Max Fee Cap (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={coreSettings.withdraw.maxFee}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        withdraw: {
                          ...coreSettings.withdraw,
                          maxFee: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-300">
                  <span>{lang === 'bn' ? '৳১,০০০ উইথড্রতে চার্জ:' : 'Charge on ৳1,000:'}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {calculatePreview(coreSettings.withdraw, 1000).text}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{lang === 'bn' ? 'ইউজার বিকাশ/নগদে পাবে:' : 'Net Received:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ৳
                    {(
                      1000 - calculatePreview(coreSettings.withdraw, 1000).fee
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Save Button */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveCoreSetting('withdraw')}
                disabled={savingCore === 'withdraw'}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
              >
                {savingCore === 'withdraw' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'bn' ? 'উইথড্র চার্জ সংরক্ষণ' : 'Save Withdraw Setting'}</span>
              </button>
            </div>
          </div>

          {/* 3. TRANSACTION / DEAL CHARGE CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-200 dark:border-emerald-900/60 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'ট্রানজ্যাকশন কমিশন' : 'Transaction Commission'}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'bn' ? 'এসক্রো / পে-রিকোয়েস্ট ফি' : 'Escrow & Pay Requests'}
                    </span>
                  </div>
                </div>

                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setCoreSettings({
                      ...coreSettings,
                      transaction: {
                        ...coreSettings.transaction,
                        isActive: !coreSettings.transaction.isActive,
                      },
                    })
                  }
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                    coreSettings.transaction.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {coreSettings.transaction.isActive
                    ? lang === 'bn'
                      ? 'সক্রিয়'
                      : 'ACTIVE'
                    : lang === 'bn'
                    ? 'নিষ্ক্রিয়'
                    : 'INACTIVE'}
                </button>
              </div>

              {/* Rate Type Selector: Flat vs Percentage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'চার্জের ধরন নির্বাচন করুন' : 'Charge Calculation Type'}
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() =>
                      setCoreSettings({
                        ...coreSettings,
                        transaction: { ...coreSettings.transaction, rateType: 'PERCENTAGE' },
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      coreSettings.transaction.rateType === 'PERCENTAGE'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'পার্সেন্টেজ (%)' : 'Percentage (%)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCoreSettings({
                        ...coreSettings,
                        transaction: { ...coreSettings.transaction, rateType: 'FLAT' },
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      coreSettings.transaction.rateType === 'FLAT'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>৳</span>
                    <span>{lang === 'bn' ? 'ফ্ল্যাট (৳ ফিক্সড)' : 'Flat (৳ Fixed)'}</span>
                  </button>
                </div>
              </div>

              {/* Rate Value Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn'
                    ? coreSettings.transaction.rateType === 'PERCENTAGE'
                      ? 'কমিশনের হার (শতকরা %)'
                      : 'কমিশনের পরিমাণ (ফিক্সড ৳)'
                    : 'Commission Rate / Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={coreSettings.transaction.value}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        transaction: {
                          ...coreSettings.transaction,
                          value: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="5.0"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {coreSettings.transaction.rateType === 'PERCENTAGE' ? '%' : '৳'}
                  </span>
                </div>
              </div>

              {/* Min and Max Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'সর্বনিম্ন ফি (৳)' : 'Min Fee Cap (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={coreSettings.transaction.minFee}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        transaction: {
                          ...coreSettings.transaction,
                          minFee: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'সর্বোচ্চ ফি (৳)' : 'Max Fee Cap (৳)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={coreSettings.transaction.maxFee}
                    onChange={(e) =>
                      setCoreSettings({
                        ...coreSettings,
                        transaction: {
                          ...coreSettings.transaction,
                          maxFee: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="0 = Unlimited"
                  />
                </div>
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-300">
                  <span>{lang === 'bn' ? '৳১,০০০ লেনদেনে ফি:' : 'Fee on ৳1,000 deal:'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {calculatePreview(coreSettings.transaction, 1000).text}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{lang === 'bn' ? 'সেন্ডারের মোট প্রয়োজন:' : 'Total Required:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ৳
                    {(
                      1000 + calculatePreview(coreSettings.transaction, 1000).fee
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Save Button */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveCoreSetting('transaction')}
                disabled={savingCore === 'transaction'}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
              >
                {savingCore === 'transaction' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'bn' ? 'ট্রানজ্যাকশন চার্জ সংরক্ষণ' : 'Save Transaction Setting'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MATRIX TABLE & LIVE SIMULATOR */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Custom Rules Matrix Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'bn' ? 'ক্যাটাগরি ও বিশেষ কমিশন রুলস' : 'Category & Specific Rules Matrix'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {lang === 'bn'
                    ? 'নির্দিষ্ট কোনো ক্যাটাগরি বা পণ্যের জন্য ভিন্ন কমিশন রেট থাকলে এখানে যোগ করুন।'
                    : 'Override global rates for specific categories or deal formats.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingRuleId(null);
                  setFormData({
                    name: '',
                    scope: 'CATEGORY',
                    categorySlug: '',
                    rateType: 'PERCENTAGE',
                    value: '5.0',
                    priority: '10',
                    isActive: true,
                  });
                  setModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন রুল যুক্ত করুন' : 'Add Custom Rule'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5">{lang === 'bn' ? 'রুল নাম' : 'Rule Name'}</th>
                    <th className="px-4 py-3.5">{lang === 'bn' ? 'টার্গেট / স্কোপ' : 'Target / Scope'}</th>
                    <th className="px-4 py-3.5">{lang === 'bn' ? 'চার্জ রেট' : 'Fee Rate'}</th>
                    <th className="px-4 py-3.5">{lang === 'bn' ? 'প্রায়োরিটি' : 'Priority'}</th>
                    <th className="px-4 py-3.5">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="px-5 py-3.5 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                        {lang === 'bn' ? 'নিয়মাবলী লোড হচ্ছে...' : 'Loading rules...'}
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Info className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                        <p className="font-semibold text-xs">
                          {lang === 'bn'
                            ? 'কোনো কাস্টম ক্যাটাগরি রুলস নেই।'
                            : 'No custom category rules configured.'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {lang === 'bn'
                            ? 'সিস্টেম স্বয়ংক্রিয়ভাবে উপরের গ্লোবাল ট্রানজ্যাকশন কমিশন ব্যবহার করবে।'
                            : 'All transactions currently use the global core settings above.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    rules.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition font-medium"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {r.name}
                          </span>
                          {r.categorySlug && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              slug: {r.categorySlug}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                            {r.scope}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            {r.rateType === 'PERCENTAGE'
                              ? `${parseFloat(r.value.toString())}%`
                              : `৳${parseFloat(r.value.toString()).toFixed(2)}`}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {r.rateType === 'PERCENTAGE' ? 'Percentage' : 'Flat Fixed'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-bold">
                          {r.priority}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                              r.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {r.isActive
                              ? lang === 'bn'
                                ? 'সক্রিয়'
                                : 'ACTIVE'
                              : lang === 'bn'
                              ? 'নিষ্ক্রিয়'
                              : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRuleId(r.id);
                                setFormData({
                                  name: r.name,
                                  scope: r.scope,
                                  categorySlug: r.categorySlug || '',
                                  rateType: r.rateType,
                                  value: parseFloat(r.value.toString()).toString(),
                                  priority: (r.priority || 0).toString(),
                                  isActive: r.isActive,
                                });
                                setModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                              title="Edit Rule"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(r.id, r.name)}
                              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition"
                              title="Delete Rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              {lang === 'bn'
                ? `মোট সক্রিয় নিয়ম: ${rules.filter((r) => r.isActive).length}`
                : `Active rules: ${rules.filter((r) => r.isActive).length}`}
            </span>
            <span className="text-[11px] font-mono">Hierarchy: Category &gt; Product &gt; Global</span>
          </div>
        </div>

        {/* Right 1 Col: Live Fee Simulator Widget */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'bn' ? 'লাইভ চার্জ সিমুলেটর' : 'Live Fee Simulator'}</span>
              </h3>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                TEST ENGINE
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {lang === 'bn'
                ? 'পরিমাণ এবং অপারেশন নির্বাচন করে লাইভ চার্জ ও নেট ফলাফল পরীক্ষা করুন।'
                : 'Simulate any transaction amount to verify exact deductions.'}
            </p>

            {/* Operation Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'অপারেশনের ধরন' : 'Operation Type'}
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSimType('TRANSACTION')}
                  className={`py-1.5 rounded-xl transition ${
                    simType === 'TRANSACTION'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'লেনদেন' : 'Deal'}
                </button>
                <button
                  type="button"
                  onClick={() => setSimType('RECHARGE')}
                  className={`py-1.5 rounded-xl transition ${
                    simType === 'RECHARGE'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'রিচার্জ' : 'Recharge'}
                </button>
                <button
                  type="button"
                  onClick={() => setSimType('WITHDRAW')}
                  className={`py-1.5 rounded-xl transition ${
                    simType === 'WITHDRAW'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'উইথড্র' : 'Withdraw'}
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'পরীক্ষামূলক পরিমাণ (৳)' : 'Test Amount (৳)'}
              </label>
              <input
                type="number"
                min="1"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="1000"
              />
            </div>

            {/* Optional details for transaction */}
            {simType === 'TRANSACTION' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'পণ্যের ধরন' : 'Product Type'}
                  </label>
                  <select
                    value={simProductType}
                    onChange={(e) => setSimProductType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="DIGITAL">Digital Product / Freelancing</option>
                    <option value="PHYSICAL">Physical Goods</option>
                  </select>
                </div>
              </div>
            )}

            {/* Output Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>{lang === 'bn' ? 'প্রযোজ্য রুল:' : 'Applied Rule:'}</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">
                  {simResult?.ruleApplied?.name || 'Default System Rule'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                <span>{lang === 'bn' ? 'চার্জের হার:' : 'Charge Rate:'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {simResult?.ruleApplied?.rateType === 'FLAT'
                    ? `৳${parseFloat(simResult?.ruleApplied?.value || 0).toFixed(2)} Flat`
                    : `${parseFloat(simResult?.ruleApplied?.value || 0)}%`}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <span className="font-bold">{lang === 'bn' ? 'কর্তনকৃত চার্জ / ফি:' : 'Calculated Fee:'}</span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                  ৳{simResult?.commissionAmount ? parseFloat(simResult.commissionAmount).toFixed(2) : '0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 text-slate-900 dark:text-white font-bold">
                <span>
                  {simType === 'TRANSACTION'
                    ? lang === 'bn'
                      ? 'সেন্ডারের প্রয়োজন (মোট):'
                      : 'Total Required:'
                    : lang === 'bn'
                    ? 'ইউজার প্রাপ্তি (Net):'
                    : 'Net Amount:'}
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                  ৳
                  {simType === 'TRANSACTION'
                    ? simResult?.totalRequired
                      ? parseFloat(simResult.totalRequired).toFixed(2)
                      : '0.00'
                    : simResult?.netAmount
                    ? parseFloat(simResult.netAmount).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            {lang === 'bn'
              ? '💡 রিয়েলটাইম ইঞ্জিনের মাধ্যমে লেনদেন সম্পন্নের সময় এই ফি হিসাব করা হয়।'
              : '💡 Verified in real-time by the central backend commission service.'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOM RULE MODAL */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-500" />
                <span>
                  {editingRuleId
                    ? lang === 'bn'
                      ? 'কমিশন রুল সম্পাদন করুন'
                      : 'Edit Commission Rule'
                    : lang === 'bn'
                    ? 'নতুন কমিশন রুল যোগ করুন'
                    : 'Add Commission Rule'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCustomRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'নিয়মের নাম (Rule Name)' : 'Rule Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Gaming Topup Discount Rule"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'স্কোপ / টার্গেট (Scope)' : 'Rule Scope'}
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CATEGORY">CATEGORY SPECIFIC</option>
                  <option value="DIGITAL_PRODUCT">DIGITAL PRODUCTS</option>
                  <option value="PHYSICAL_PRODUCT">PHYSICAL PRODUCTS</option>
                  <option value="TRANSACTION_TYPE">TRANSACTION TYPE</option>
                  <option value="GLOBAL">GLOBAL FALLBACK</option>
                </select>
              </div>

              {formData.scope === 'CATEGORY' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ক্যাটাগরি স্লাগ (Category Slug)' : 'Category Slug'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.categorySlug}
                    onChange={(e) => setFormData({ ...formData, categorySlug: e.target.value })}
                    placeholder="e.g. game-topup or accounts"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'চার্জের ধরন' : 'Rate Type'}
                  </label>
                  <select
                    value={formData.rateType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rateType: e.target.value as 'PERCENTAGE' | 'FLAT',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FLAT">FLAT (৳ ফিক্সড)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মান / রেট' : 'Value'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'অগ্রাধিকার (Priority - বেশি মান আগে প্রযোজ্য)' : 'Priority'}
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ruleActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="ruleActive"
                  className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {lang === 'bn' ? 'এই রুলটি সক্রিয় রাখুন' : 'Rule is Active'}
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition hover:bg-slate-200"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? lang === 'bn'
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'Saving...'
                    : lang === 'bn'
                    ? 'সংরক্ষণ করুন'
                    : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
