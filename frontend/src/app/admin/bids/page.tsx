'use client';

import React, { useEffect, useState } from 'react';
import {
  Coins,
  Settings,
  Layout,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Package,
  User as UserIcon,
  Search,
  RefreshCw,
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Bell,
  Sliders,
  Store,
  Cpu,
  DownloadCloud,
  Layers,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

export default function AdminBidsPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'BIDS' | 'RATES' | 'HOMEPAGE'>('BIDS');
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings state
  const [bidSettings, setBidSettings] = useState({
    isSameBidRateForHomeAndShop: true,
    homeBaseRate: 200,
    homeExtraRate: 50,
    shopBaseRate: 150,
    shopExtraRate: 30,
    categoryBaseRate: 50,
    categoryExtraRate: 10,
    userHomeBaseRate: 100,
    userHomeExtraRate: 20,
    userDirBaseRate: 50,
    userDirExtraRate: 10,

    // Legacy compatibility
    productMinBid: 50,
    productExtraIncrement: 10,
    userMinBid: 100,
    userExtraIncrement: 20,
    homePageMinBid: 200,
    homePageExtraIncrement: 50,
    shopMinBid: 150,
    shopExtraIncrement: 30,
    digitalMinBid: 80,
    digitalExtraIncrement: 15,
    physicalMinBid: 80,
    physicalExtraIncrement: 15,
    moneyExchangeMinBid: 100,
    moneyExchangeExtraIncrement: 25,
    enableOutbidNotification: true,
  });

  const [homePageSettings, setHomePageSettings] = useState<{
    showShopProducts: boolean;
    shopProductsCount: number;
    showDigitalProducts: boolean;
    digitalProductsCount: number;
    showPhysicalProducts: boolean;
    physicalProductsCount: number;
    showMoneyExchange: boolean;
    moneyExchangeCount: number;
    showUsers: boolean;
    usersCount: number;
    sectionOrder: string[];
    layoutStyles: Record<string, string>;
    sectionTitles: Record<string, { bn: string; en: string; sub: string }>;
  }>({
    showShopProducts: true,
    shopProductsCount: 12,
    showDigitalProducts: true,
    digitalProductsCount: 8,
    showPhysicalProducts: true,
    physicalProductsCount: 8,
    showMoneyExchange: true,
    moneyExchangeCount: 6,
    showUsers: true,
    usersCount: 6,
    sectionOrder: [
      'shopProducts',
      'digitalProducts',
      'physicalProducts',
      'moneyExchange',
      'users',
    ],
    layoutStyles: {
      shopProducts: 'grid',
      digitalProducts: 'grid',
      physicalProducts: 'grid',
      moneyExchange: 'grid',
      users: 'grid',
    },
    sectionTitles: {
      shopProducts: { bn: 'শপ প্রোডাক্টস', en: 'Shop Products', sub: 'জনপ্রিয় ও শীর্ষস্থানীয় পণ্যসমূহ' },
      digitalProducts: { bn: 'ডিজিটাল প্রোডাক্টস', en: 'Digital Products', sub: 'সরাসরি ডাউনলোডযোগ্য প্রোডাক্ট' },
      physicalProducts: { bn: 'ফিজিক্যাল প্রোডাক্টস', en: 'Physical Products', sub: 'হোম ডেলিভারি সহ বাস্তব পণ্য' },
      moneyExchange: { bn: 'মানি এক্সচেঞ্জ', en: 'Money Exchange', sub: 'নিরাপদ ও বিশ্বস্ত লেনদেন সার্ভিস' },
      users: { bn: 'টপ ইউজার ও সেলার', en: 'Top Users & Sellers', sub: 'আমাদের শীর্ষ ভেরিফাইড প্রোফাইল' },
    },
  });

  // Filter state for bids table
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PRODUCT' | 'USER_ID'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bidsRes, settingsRes] = await Promise.all([
        api.get('/bids/admin/all').catch(() => null),
        api.get('/bids/settings').catch(() => null),
      ]);

      const bidsData: any = (bidsRes as any)?.data || bidsRes;
      setBids(Array.isArray(bidsData) ? bidsData : []);

      const settingsData = settingsRes?.data || settingsRes;
      if (settingsData) {
        if (settingsData.bidSettings) {
          setBidSettings((prev) => ({
            ...prev,
            ...settingsData.bidSettings,
            homeBaseRate: settingsData.bidSettings.homeBaseRate ?? settingsData.bidSettings.homePageMinBid ?? 200,
            homeExtraRate: settingsData.bidSettings.homeExtraRate ?? settingsData.bidSettings.homePageExtraIncrement ?? 50,
            shopBaseRate: settingsData.bidSettings.shopBaseRate ?? settingsData.bidSettings.shopMinBid ?? 150,
            shopExtraRate: settingsData.bidSettings.shopExtraRate ?? settingsData.bidSettings.shopExtraIncrement ?? 30,
            categoryBaseRate: settingsData.bidSettings.categoryBaseRate ?? settingsData.bidSettings.productMinBid ?? 50,
            categoryExtraRate: settingsData.bidSettings.categoryExtraRate ?? settingsData.bidSettings.productExtraIncrement ?? 10,
            userHomeBaseRate: settingsData.bidSettings.userHomeBaseRate ?? settingsData.bidSettings.userMinBid ?? 100,
            userHomeExtraRate: settingsData.bidSettings.userHomeExtraRate ?? settingsData.bidSettings.userExtraIncrement ?? 20,
            userDirBaseRate: settingsData.bidSettings.userDirBaseRate ?? 50,
            userDirExtraRate: settingsData.bidSettings.userDirExtraRate ?? 10,
          }));
        }
        if (settingsData.homePageSettings) {
          setHomePageSettings((prev) => ({
            ...prev,
            ...settingsData.homePageSettings,
            sectionOrder: settingsData.homePageSettings.sectionOrder || prev.sectionOrder,
            layoutStyles: { ...prev.layoutStyles, ...(settingsData.homePageSettings.layoutStyles || {}) },
            sectionTitles: { ...prev.sectionTitles, ...(settingsData.homePageSettings.sectionTitles || {}) },
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load admin bids data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMsg(null);

      await api.post('/bids/admin/settings', {
        ...bidSettings,
        ...homePageSettings,
      });

      setStatusMsg({
        type: 'success',
        text: lang === 'bn' ? 'সকল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'All settings saved successfully!',
      });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancel a bid
  const handleCancelBid = async (bidId: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি এই বিডটি বাতিল করতে চান?' : 'Are you sure you want to cancel this bid?')) {
      return;
    }

    try {
      await api.post(`/bids/admin/${bidId}/cancel`);
      setStatusMsg({
        type: 'success',
        text: lang === 'bn' ? 'বিড সফলভাবে বাতিল করা হয়েছে।' : 'Bid cancelled successfully.',
      });
      fetchData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel bid');
    }
  };

  // Move section order up or down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...homePageSettings.sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setHomePageSettings({
      ...homePageSettings,
      sectionOrder: newOrder,
    });
  };

  // Filtered bids
  const filteredBids = bids.filter((b) => {
    if (typeFilter !== 'ALL' && b.bidType !== typeFilter) return false;
    if (scopeFilter !== 'ALL' && b.scope !== scopeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (b.product?.title || b.targetUser?.uniqueUserId || '').toLowerCase();
      const bidder = (b.seller?.uniqueUserId || b.seller?.firstName || '').toLowerCase();
      return title.includes(q) || bidder.includes(q);
    }
    return true;
  });

  const activeCount = bids.filter((b) => b.status === 'ACTIVE').length;
  const productBidsCount = bids.filter((b) => b.bidType === 'PRODUCT' && b.status === 'ACTIVE').length;
  const userBidsCount = bids.filter((b) => b.bidType === 'USER_ID' && b.status === 'ACTIVE').length;

  const sectionMeta: Record<string, { nameBn: string; nameEn: string; icon: any; countKey: string; toggleKey: string }> = {
    shopProducts: {
      nameBn: 'শপ প্রোডাক্টস',
      nameEn: 'Shop Products',
      icon: Store,
      countKey: 'shopProductsCount',
      toggleKey: 'showShopProducts',
    },
    digitalProducts: {
      nameBn: 'ডিজিটাল প্রোডাক্টস',
      nameEn: 'Digital Products',
      icon: DownloadCloud,
      countKey: 'digitalProductsCount',
      toggleKey: 'showDigitalProducts',
    },
    physicalProducts: {
      nameBn: 'ফিজিক্যাল প্রোডাক্টস',
      nameEn: 'Physical Products',
      icon: Cpu,
      countKey: 'physicalProductsCount',
      toggleKey: 'showPhysicalProducts',
    },
    moneyExchange: {
      nameBn: 'মানি এক্সচেঞ্জ',
      nameEn: 'Money Exchange',
      icon: Coins,
      countKey: 'moneyExchangeCount',
      toggleKey: 'showMoneyExchange',
    },
    users: {
      nameBn: 'টপ ইউজার ও সেলার',
      nameEn: 'Top Users & Sellers',
      icon: UserIcon,
      countKey: 'usersCount',
      toggleKey: 'showUsers',
    },
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <span>{lang === 'bn' ? 'বিড ও পজিশন কন্ট্রোল সেন্টার' : 'Bids & Position Control Center'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'সক্রিয় বিড নিরীক্ষণ, রুট অনুযায়ী বিড রেট নির্ধারণ ও হোম পেজ সেকশন কাস্টমাইজেশন'
              : 'Monitor bids, configure route-specific bid rates, and customize homepage sections'}
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              {lang === 'bn' ? 'মোট সক্রিয় বিড' : 'Total Active Bids'}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              {lang === 'bn' ? 'প্রোডাক্ট সক্রিয় বিড' : 'Active Product Bids'}
            </div>
            <div className="text-2xl font-black text-sky-500 mt-1">
              {productBidsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              {lang === 'bn' ? 'ইউজার আইডি সক্রিয় বিড' : 'Active User ID Bids'}
            </div>
            <div className="text-2xl font-black text-emerald-500 mt-1">
              {userBidsCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('BIDS')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'BIDS'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>{lang === 'bn' ? 'সক্রিয় বিডসমূহ' : 'Active Bids'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RATES')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'RATES'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{lang === 'bn' ? 'বিড রেট সেটিংস' : 'Bid Rate Settings'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HOMEPAGE')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'HOMEPAGE'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>{lang === 'bn' ? 'হোম পেজ সেটিংস' : 'Home Page Settings'}</span>
        </button>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Tab 1: Active Bids Table */}
      {activeTab === 'BIDS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'প্রোডাক্ট বা ইউজার আইডি খুঁজুন...' : 'Search product or User ID...'}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="ALL">{lang === 'bn' ? 'সকল টাইপ' : 'All Types'}</option>
                <option value="PRODUCT">{lang === 'bn' ? 'প্রোডাক্ট বিড' : 'Product'}</option>
                <option value="USER_ID">{lang === 'bn' ? 'ইউজার আইডি বিড' : 'User ID'}</option>
              </select>

              <select
                value={scopeFilter}
                onChange={(e: any) => setScopeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="ALL">{lang === 'bn' ? 'সকল স্কোপ' : 'All Scopes'}</option>
                <option value="HOME_PAGE">{lang === 'bn' ? 'হোম পেজ' : 'Home Page'}</option>
                <option value="SHOP">{lang === 'bn' ? 'শপ পেজ (SHOP)' : 'Shop Page'}</option>
                <option value="DIGITAL_PRODUCTS">{lang === 'bn' ? 'ডিজিটাল প্রোডাক্টস' : 'Digital Products'}</option>
                <option value="PHYSICAL_PRODUCTS">{lang === 'bn' ? 'ফিজিক্যাল প্রোডাক্টস' : 'Physical Products'}</option>
                <option value="MONEY_EXCHANGE">{lang === 'bn' ? 'মানি এক্সচেঞ্জ' : 'Money Exchange'}</option>
                <option value="CATEGORY">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading bids...</div>
          ) : filteredBids.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              {lang === 'bn' ? 'কোনো বিড পাওয়া যায়নি।' : 'No bids found matching filter criteria.'}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Target Item</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Scope</th>
                      <th className="p-3.5">Position</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Bidder User</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Expires</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBids.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {b.bidType === 'USER_ID' ? (
                            <span className="font-mono text-sky-600 dark:text-sky-400">
                              @{b.targetUser?.uniqueUserId || 'User ID'}
                            </span>
                          ) : (
                            b.product?.title || 'Product'
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {b.bidType}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {b.scope}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-black text-amber-500">
                          #{b.targetPosition}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white font-mono">
                          ৳ {Number(b.bidAmount).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {b.seller?.firstName} {b.seller?.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            @{b.seller?.uniqueUserId} • {b.seller?.phone}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : b.status === 'OUTBID'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(b.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          {b.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleCancelBid(b.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition cursor-pointer"
                            >
                              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bid Rate Settings */}
      {activeTab === 'RATES' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            {/* Header & Description */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <span>{lang === 'bn' ? 'বিড রেট ও ইনক্রিমেন্ট সেটিংস' : 'Bid Minimums & Route-Specific Rates'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'bn'
                  ? 'হোম পেজ, শপ পেজ এবং অন্যান্য রাউটের বিড রেট ও সর্বনিম্ন ইনক্রিমেন্ট মান নির্ধারণ করুন।'
                  : 'Configure minimum bid rates and extra balance increments for each page/routing.'}
              </p>
            </div>

            {/* Same vs Separate Rate Toggle */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'হোম পেজ এবং শপ পেজ বিড রেট পলিসি' : 'Home Page & Shop Page Bid Rate Policy'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'হোম পেজ ও শপ পেজে একই বিড রেট প্রযোজ্য হবে নাকি আলাদা আলাদা রেট থাকবে?'
                    : 'Should Home Page and Shop Page share the exact same bid rate or have separate rates?'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBidSettings({ ...bidSettings, isSameBidRateForHomeAndShop: true })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    bidSettings.isSameBidRateForHomeAndShop
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {lang === 'bn' ? 'একই রেট (Same)' : 'Same Rate'}
                </button>
                <button
                  type="button"
                  onClick={() => setBidSettings({ ...bidSettings, isSameBidRateForHomeAndShop: false })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    !bidSettings.isSameBidRateForHomeAndShop
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {lang === 'bn' ? 'আলাদা রেট (Separate)' : 'Separate Rates'}
                </button>
              </div>
            </div>

            {/* Outbid Notification Toggle */}
            <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'আউটবিড রিয়েল-টাইম নোটিফিকেশন' : 'Outbid Real-Time Notification'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'অন্য কেউ বেশি বিড দিয়ে পজিশন নিয়ে নিলে পূর্বের বিডারকে স্বয়ংক্রিয় নোটিফিকেশন পাঠানো হবে।'
                    : 'Notify the displaced bidder via WebSocket when their position is taken.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bidSettings.enableOutbidNotification}
                  onChange={(e) =>
                    setBidSettings({ ...bidSettings, enableOutbidNotification: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {/* Rates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Home Page Rates */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Layout className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'হোম পেজ প্রোডাক্ট বিড রেট (Home Page)' : 'Home Page Product Bid Rate'}</span>
                  {bidSettings.isSameBidRateForHomeAndShop && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-normal">
                      {lang === 'bn' ? 'শপ পেজের জন্যও প্রযোজ্য' : 'Also applies to Shop'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'বিড না থাকলে বেস রেট প্রযোজ্য হবে। সক্রিয় বিড থাকলে (সর্বোচ্চ বিড + এক্সট্রা রেট) দিতে হবে।'
                    : 'If no active bid, Base Rate applies. If active bid exists, pays (Current Bid + Extra Rate).'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'বেস রেট (Base Rate ৳):' : 'Base Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.homeBaseRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, homeBaseRate: Number(e.target.value) || 0, homePageMinBid: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'এক্সট্রা রেট (Extra Rate ৳):' : 'Extra Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.homeExtraRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, homeExtraRate: Number(e.target.value) || 0, homePageExtraIncrement: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shop Page Rates */}
              <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4 ${
                bidSettings.isSameBidRateForHomeAndShop ? 'opacity-60' : ''
              }`}>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Store className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'শপ পেজ প্রোডাক্ট বিড রেট (Shop Page)' : 'Shop Page Product Bid Rate'}</span>
                  {bidSettings.isSameBidRateForHomeAndShop && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-normal">
                      {lang === 'bn' ? 'হোম পেজ রেট দ্বারা পরিচালিত' : 'Synced with Home Page'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'শপ পেজে পজিশন নেওয়ার রেট।'
                    : 'Rates for securing positions in the Shop directory.'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'বেস রেট (Base Rate ৳):' : 'Base Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={bidSettings.isSameBidRateForHomeAndShop}
                      value={bidSettings.isSameBidRateForHomeAndShop ? bidSettings.homeBaseRate : bidSettings.shopBaseRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, shopBaseRate: Number(e.target.value) || 0, shopMinBid: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'এক্সট্রা রেট (Extra Rate ৳):' : 'Extra Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={bidSettings.isSameBidRateForHomeAndShop}
                      value={bidSettings.isSameBidRateForHomeAndShop ? bidSettings.homeExtraRate : bidSettings.shopExtraRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, shopExtraRate: Number(e.target.value) || 0, shopExtraIncrement: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs disabled:bg-slate-100 dark:disabled:bg-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Category / Custom Route Rates */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  <span>{lang === 'bn' ? 'ক্যাটাগরি পেজ বিড রেট (Category / Route)' : 'Category / Route Bid Rate'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'যেকোনো নির্দিষ্ট ক্যাটাগরি বা কাস্টম পেজে বিড করার রেট।'
                    : 'Rates for bidding within specific category pages or routes.'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'বেস রেট (Base Rate ৳):' : 'Base Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.categoryBaseRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, categoryBaseRate: Number(e.target.value) || 0, productMinBid: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'এক্সট্রা রেট (Extra Rate ৳):' : 'Extra Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.categoryExtraRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, categoryExtraRate: Number(e.target.value) || 0, productExtraIncrement: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* User ID Home Page Rates */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <UserIcon className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'bn' ? 'ইউজার আইডি হোম পেজ বিড রেট (Home User)' : 'User ID Home Page Rate'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'হোম পেজের টপ ইউজার সেকশনে প্রোফাইল পজিশন নেওয়ার রেট।'
                    : 'Rates for users to bid on the Home Page Top Users section.'}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'বেস রেট (Base Rate ৳):' : 'Base Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.userHomeBaseRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, userHomeBaseRate: Number(e.target.value) || 0, userMinBid: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'এক্সট্রা রেট (Extra Rate ৳):' : 'Extra Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.userHomeExtraRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, userHomeExtraRate: Number(e.target.value) || 0, userExtraIncrement: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* User ID Directory Rates */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4 md:col-span-2">
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <UserIcon className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'ইউজার ডিরেক্টরি পেজ বিড রেট (/users Directory)' : 'User Directory Page Rate (/users)'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'http://localhost:3000/users ডিরেক্টরি পেজে পজিশন বিড করার রেট।'
                    : 'Rates for users to bid on the /users directory page.'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'বেস রেট (Base Rate ৳):' : 'Base Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.userDirBaseRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, userDirBaseRate: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'এক্সট্রা রেট (Extra Rate ৳):' : 'Extra Rate (৳):'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidSettings.userDirExtraRate}
                      onChange={(e) =>
                        setBidSettings({ ...bidSettings, userDirExtraRate: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : lang === 'bn' ? 'রেট সেভ করুন' : 'Save Rates'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Home Page Display & Order Settings */}
      {activeTab === 'HOMEPAGE' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            {/* Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layout className="w-5 h-5 text-amber-500" />
                <span>{lang === 'bn' ? 'হোম পেজ সেকশন, ডিসপ্লে লিমিট ও ক্যাটাগরি কন্ট্রোল' : 'Home Page Sections, Limits & Dynamic Categories'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'bn'
                  ? 'হোম পেজে কোন কোন সেকশন ও ক্যাটাগরি দেখাবেন, কতটি প্রোডাক্ট প্রদর্শিত হবে এবং কোন সেকশনটি আগে আসবে তা এখান থেকে নিয়ন্ত্রণ করুন।'
                  : 'Customize section visibility, display limits, and rearrange section order for the homepage.'}
              </p>
            </div>

            {/* Section Sequence Order Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'হোম পেজ সেকশন সিকোয়েন্স (ক্রমিক বিন্যাস)' : 'Section Display Sequence (Order)'}</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'উপরে বা নিচে মুভ করে ক্রম পরিবর্তন করুন' : 'Use Up/Down buttons to reorder'}
                </span>
              </div>

              <div className="space-y-2">
                {homePageSettings.sectionOrder.map((secKey, idx) => {
                  const meta = sectionMeta[secKey];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const isFirst = idx === 0;
                  const isLast = idx === homePageSettings.sectionOrder.length - 1;
                  const isEnabled = Boolean((homePageSettings as any)[meta.toggleKey]);

                  return (
                    <div
                      key={secKey}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                        isEnabled
                          ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-100/50 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 font-mono font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xs">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{lang === 'bn' ? meta.nameBn : meta.nameEn}</span>
                            {!isEnabled && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                {lang === 'bn' ? 'লুকানো (OFF)' : 'Hidden'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {lang === 'bn' ? `প্রদর্শিত সংখ্যা: ${(homePageSettings as any)[meta.countKey]} টি` : `Display limit: ${(homePageSettings as any)[meta.countKey]} items`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => moveSection(idx, 'up')}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 disabled:opacity-30 transition cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => moveSection(idx, 'down')}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 disabled:opacity-30 transition cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Section Settings */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === 'bn' ? 'মূল সেকশনসমূহের সেটিংস' : 'Core Sections Settings'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(sectionMeta).map(([secKey, meta]) => {
                  const Icon = meta.icon;
                  const isEnabled = Boolean((homePageSettings as any)[meta.toggleKey]);
                  const count = (homePageSettings as any)[meta.countKey];
                  const layoutStyle = homePageSettings.layoutStyles?.[secKey] || 'grid';
                  const titles = homePageSettings.sectionTitles?.[secKey] || { bn: '', en: '', sub: '' };

                  return (
                    <div
                      key={secKey}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {lang === 'bn' ? meta.nameBn : meta.nameEn}
                          </span>
                        </div>

                        {/* ON/OFF Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">
                            {isEnabled ? (lang === 'bn' ? 'চালু' : 'ON') : (lang === 'bn' ? 'বন্ধ' : 'OFF')}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setHomePageSettings({
                                ...homePageSettings,
                                [meta.toggleKey]: !isEnabled,
                              })
                            }
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isEnabled
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Display Count */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {lang === 'bn' ? 'প্রদর্শনের সংখ্যা (Limit):' : 'Display Limit:'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50000"
                            value={count}
                            onChange={(e) =>
                              setHomePageSettings({
                                ...homePageSettings,
                                [meta.countKey]: Number(e.target.value) || 1,
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          />
                        </div>

                        {/* Layout Style */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            {lang === 'bn' ? 'লেআউট স্টাইল:' : 'Layout Style:'}
                          </label>
                          <select
                            value={layoutStyle}
                            onChange={(e) =>
                              setHomePageSettings({
                                ...homePageSettings,
                                layoutStyles: {
                                  ...homePageSettings.layoutStyles,
                                  [secKey]: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          >
                            <option value="grid">{lang === 'bn' ? 'গ্রিড (Grid)' : 'Grid'}</option>
                            <option value="carousel">{lang === 'bn' ? 'ক্যারোজেল (Slider)' : 'Carousel'}</option>
                            <option value="compact">{lang === 'bn' ? 'কমপ্যাক্ট লিস্ট (Compact)' : 'Compact List'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Custom Title & Subtitle */}
                      <div className="space-y-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? 'শিরোনাম (বাংলা)' : 'Title (BN)'}
                            value={titles.bn || ''}
                            onChange={(e) =>
                              setHomePageSettings({
                                ...homePageSettings,
                                sectionTitles: {
                                  ...homePageSettings.sectionTitles,
                                  [secKey]: { ...titles, bn: e.target.value },
                                },
                              })
                            }
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                          />
                          <input
                            type="text"
                            placeholder={lang === 'bn' ? 'শিরোনাম (ইংরেজি)' : 'Title (EN)'}
                            value={titles.en || ''}
                            onChange={(e) =>
                              setHomePageSettings({
                                ...homePageSettings,
                                sectionTitles: {
                                  ...homePageSettings.sectionTitles,
                                  [secKey]: { ...titles, en: e.target.value },
                                },
                              })
                            }
                            className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder={lang === 'bn' ? 'উপ-শিরোনাম / সাবটাইটেল' : 'Subtitle'}
                          value={titles.sub || ''}
                          onChange={(e) =>
                            setHomePageSettings({
                              ...homePageSettings,
                              sectionTitles: {
                                ...homePageSettings.sectionTitles,
                                [secKey]: { ...titles, sub: e.target.value },
                              },
                            })
                          }
                          className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : lang === 'bn' ? 'সেটিংস সেভ করুন' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
