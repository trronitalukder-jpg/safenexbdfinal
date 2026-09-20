'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  User as UserIcon,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  Wallet,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Store,
  DownloadCloud,
  Cpu,
  Lock,
  Zap,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  productType: string;
  canonicalUrl?: string | null;
  status: string;
  imageUrl: string | null;
  categoryName: string;
  categoryId: string;
  currentPosition: number;
  homePosition?: number;
  shopPosition?: number;
  categoryPosition?: number;
  homeBid?: { id: string; position: number; amount: number; scope: string; expiresAt: string } | null;
  shopBid?: { id: string; position: number; amount: number; scope: string; expiresAt: string } | null;
  categoryBid?: { id: string; position: number; amount: number; scope: string; expiresAt: string } | null;
  activeBid: {
    id: string;
    position: number;
    amount: number;
    scope: string;
    expiresAt: string;
  } | null;
  activeBids?: any[];
}

interface UserProfileData {
  id: string;
  uniqueUserId: string;
  fullName: string;
  avatarUrl: string | null;
  currentPosition: number;
  homePosition?: number;
  usersPosition?: number;
  homeBid?: { id: string; position: number; amount: number; scope: string; expiresAt: string } | null;
  usersBid?: { id: string; position: number; amount: number; scope: string; expiresAt: string } | null;
  activeBid: {
    id: string;
    position: number;
    amount: number;
    scope: string;
    expiresAt: string;
  } | null;
  activeBids?: any[];
}

function BidBadge({ position }: { position: number; expiresAt?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
      #{position}
    </span>
  );
}

export default function MyBidsPage() {
  const { lang, t } = useLanguage();
  const { user: authUser, refreshMe } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'ID_BID' | 'PRODUCT_BIDS'>('ID_BID');
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [bidsHistory, setBidsHistory] = useState<any[]>([]);
  const [homeSettings, setHomeSettings] = useState<any>(null);
  const [bidSettings, setBidSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [bidMode, setBidMode] = useState<'SINGLE' | 'COMBO'>('SINGLE');
  const [modalTarget, setModalTarget] = useState<{
    type: 'USER_ID' | 'PRODUCT';
    id: string;
    title: string;
    productType?: string;
    canonicalUrl?: string | null;
    categoryId?: string;
    currentPosition: number;
    homePosition?: number;
    shopPosition?: number;
    categoryPosition?: number;
  } | null>(null);

  const [selectedScope, setSelectedScope] = useState<string>('HOME_PAGE');
  const [comboSelectedScopes, setComboSelectedScopes] = useState<string[]>([]);
  const [targetPosition, setTargetPosition] = useState<number>(1);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calculation, setCalculation] = useState<{
    minimumRequiredBid: number;
    currentHighestBid: number;
    extraIncrement: number;
    hasActiveBid: boolean;
    currentHolder: string | null;
  } | null>(null);

  // Combo calculations per scope
  const [comboCalculations, setComboCalculations] = useState<Record<string, {
    minimumRequiredBid: number;
    currentHighestBid: number;
    extraIncrement: number;
    hasActiveBid: boolean;
    currentHolder: string | null;
  }>>({});

  const [bidAmount, setBidAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch Items & Current Positions & Settings
  const loadData = async () => {
    try {
      setLoading(true);
      const [posRes, historyRes, settingsRes] = await Promise.all([
        api.get('/bids/my-items-positions'),
        api.get('/bids/my-bids'),
        api.get('/bids/settings'),
      ]);

      const posData: any = (posRes as any)?.data || posRes;
      if (posData) {
        setUserData(posData.user || null);
        setProducts(posData.products || []);
      }

      const historyData: any = (historyRes as any)?.data || historyRes;
      setBidsHistory(Array.isArray(historyData) ? historyData : []);

      const settingsData: any = (settingsRes as any)?.data || settingsRes;
      if (settingsData) {
        setHomeSettings(settingsData.homePageSettings || null);
        setBidSettings(settingsData.bidSettings || null);
      }
    } catch (err) {
      console.error('Error loading bids data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    refreshMe();
  }, []);

  // Helper to check if a scope is disabled by Admin Settings
  const isScopeDisabled = (scope: string, target = modalTarget): { disabled: boolean; reason: string } => {
    if (!target || !homeSettings) return { disabled: false, reason: '' };

    if (scope === 'HOME_PAGE') {
      if (target.type === 'USER_ID') {
        if (!homeSettings.showUsers || Number(homeSettings.usersCount || 0) <= 0) {
          return {
            disabled: true,
            reason: lang === 'bn' ? 'অ্যাডমিন হোম পেজে ইউজার শো বন্ধ রেখেছেন' : 'Admin disabled users on Home Page',
          };
        }
      } else {
        const isMoneyExchange = target.canonicalUrl === '/money-exchange' || target.canonicalUrl === 'money-exchange';
        if (isMoneyExchange) {
          if (!homeSettings.showMoneyExchange || Number(homeSettings.moneyExchangeCount || 0) <= 0) {
            return {
              disabled: true,
              reason: lang === 'bn' ? 'হোম পেজে মানি এক্সচেঞ্জ সেকশন বন্ধ' : 'Money exchange disabled on Home',
            };
          }
        } else if (target.productType === 'DIGITAL_DOWNLOAD') {
          if (!homeSettings.showDigitalProducts || Number(homeSettings.digitalProductsCount || 0) <= 0) {
            return {
              disabled: true,
              reason: lang === 'bn' ? 'হোম পেজে ডিজিটাল প্রোডাক্ট সেকশন বন্ধ' : 'Digital products disabled on Home',
            };
          }
        } else if (target.productType === 'PHYSICAL') {
          if (!homeSettings.showPhysicalProducts || Number(homeSettings.physicalProductsCount || 0) <= 0) {
            return {
              disabled: true,
              reason: lang === 'bn' ? 'হোম পেজে ফিজিক্যাল প্রোডাক্ট সেকশন বন্ধ' : 'Physical products disabled on Home',
            };
          }
        }
      }
    }

    if (scope === 'SHOP') {
      if (target.type === 'USER_ID') {
        return { disabled: true, reason: 'ইউজার আইডির জন্য শপ পেজ প্রযোজ্য নয়' };
      }
      if (!homeSettings.showShopProducts || Number(homeSettings.shopProductsCount || 0) <= 0) {
        return {
          disabled: true,
          reason: lang === 'bn' ? 'অ্যাডমিন শপ প্রোডাক্ট সেকশন বন্ধ রেখেছেন' : 'Shop section disabled by admin',
        };
      }
    }

    return { disabled: false, reason: '' };
  };

  // Open Bid Modal
  const handleOpenBidModal = (
    type: 'USER_ID' | 'PRODUCT',
    id: string,
    title: string,
    currentPos: number,
    categoryId?: string,
    productType?: string,
    canonicalUrl?: string | null,
    homePos?: number,
    shopPos?: number,
    catPos?: number,
  ) => {
    const targetObj = {
      type,
      id,
      title,
      currentPosition: currentPos,
      categoryId,
      productType,
      canonicalUrl,
      homePosition: homePos,
      shopPosition: shopPos,
      categoryPosition: catPos,
    };
    setModalTarget(targetObj);
    setTargetPosition(1);

    // Initial scope determination: if HOME_PAGE is disabled, fallback to next allowed scope
    const homeCheck = isScopeDisabled('HOME_PAGE', targetObj);
    const defaultScope = !homeCheck.disabled
      ? 'HOME_PAGE'
      : type === 'PRODUCT'
      ? 'SHOP'
      : 'CATEGORY';

    setSelectedScope(defaultScope);

    // Initial combo selection: select all enabled scopes for this target
    const allowedScopes: string[] = [];
    if (!homeCheck.disabled) allowedScopes.push('HOME_PAGE');
    if (type === 'PRODUCT') {
      if (!isScopeDisabled('SHOP', targetObj).disabled) allowedScopes.push('SHOP');
      if (productType === 'DIGITAL_DOWNLOAD') allowedScopes.push('DIGITAL_PRODUCTS');
      else if (productType === 'PHYSICAL') allowedScopes.push('PHYSICAL_PRODUCTS');
      else if (canonicalUrl === '/money-exchange' || canonicalUrl === 'money-exchange') allowedScopes.push('MONEY_EXCHANGE');
      else allowedScopes.push('CATEGORY');
    } else {
      allowedScopes.push('CATEGORY');
    }
    setComboSelectedScopes(allowedScopes);

    setBidMode('SINGLE');
    setErrorMsg(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  // Run live calculation when scope or targetPosition changes (Single Mode)
  useEffect(() => {
    if (!modalOpen || !modalTarget || bidMode !== 'SINGLE') return;

    let isMounted = true;
    setCalcLoading(true);

    const params = new URLSearchParams({
      bidType: modalTarget.type,
      scope: selectedScope,
      targetPosition: String(targetPosition || 1),
    });

    if (modalTarget.type === 'PRODUCT' && modalTarget.id) {
      params.append('productId', modalTarget.id);
    }
    if (modalTarget.categoryId && selectedScope === 'CATEGORY') {
      params.append('categoryId', modalTarget.categoryId);
    }

    api.get(`/bids/calculate?${params.toString()}`)
      .then((res: any) => {
        if (!isMounted) return;
        const data = res?.data || res;
        setCalculation(data);
        setBidAmount(Number(data.minimumRequiredBid || 50));
      })
      .catch((err) => {
        console.error('Failed to calculate bid:', err);
      })
      .finally(() => {
        if (isMounted) setCalcLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [modalOpen, modalTarget, selectedScope, targetPosition, bidMode]);

  // Run calculations for all combo scopes (Combo Mode)
  useEffect(() => {
    if (!modalOpen || !modalTarget || bidMode !== 'COMBO') return;

    let isMounted = true;
    setCalcLoading(true);

    Promise.all(
      comboSelectedScopes.map(async (scope) => {
        const params = new URLSearchParams({
          bidType: modalTarget.type,
          scope,
          targetPosition: String(targetPosition || 1),
        });
        if (modalTarget.type === 'PRODUCT' && modalTarget.id) {
          params.append('productId', modalTarget.id);
        }
        if (modalTarget.categoryId && scope === 'CATEGORY') {
          params.append('categoryId', modalTarget.categoryId);
        }
        try {
          const res: any = await api.get(`/bids/calculate?${params.toString()}`);
          return { scope, data: res?.data || res };
        } catch {
          return { scope, data: null };
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const map: Record<string, any> = {};
      for (const r of results) {
        if (r.data) map[r.scope] = r.data;
      }
      setComboCalculations(map);
      setCalcLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [modalOpen, modalTarget, comboSelectedScopes, targetPosition, bidMode]);


  // Total combo required balance
  const totalComboRequired = Object.entries(comboCalculations)
    .filter(([scope]) => comboSelectedScopes.includes(scope))
    .reduce((sum, [, calc]) => sum + Number(calc?.minimumRequiredBid || 0), 0);

  // Available Balance
  const userBalance = Number(authUser?.wallet?.availableBalance || 0);
  const requiredBalance = bidMode === 'COMBO'
    ? totalComboRequired
    : Number(calculation?.minimumRequiredBid || 0);
  const isInsufficient = userBalance < requiredBalance;

  // Submit Bid (Single or Combo)
  const handleExecuteBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTarget) return;

    if (bidMode === 'COMBO' && comboSelectedScopes.length === 0) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে কমপক্ষে একটি স্কোপ নির্বাচন করুন।' : 'Please select at least one scope.');
      return;
    }

    if (isInsufficient) {
      setErrorMsg(
        lang === 'bn'
          ? 'insufficient balance please recharge — আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই, অনুগ্রহ করে রিচার্জ করুন।'
          : 'insufficient balance please recharge — You do not have sufficient available balance.',
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (bidMode === 'COMBO') {
        const comboBids = comboSelectedScopes.map((scope) => ({
          scope,
          targetPosition: Number(targetPosition),
          bidAmount: Number(comboCalculations[scope]?.minimumRequiredBid || 50),
        }));

        await api.post('/bids/place-combo', {
          bidType: modalTarget.type,
          productId: modalTarget.type === 'PRODUCT' ? modalTarget.id : undefined,
          bids: comboBids,
        });

        setSuccessMsg(
          lang === 'bn'
            ? `অভিনন্দন! আপনার ${comboBids.length}টি কম্বো বিড সফল হয়েছে এবং পজিশন #${targetPosition} সংরক্ষিত হয়েছে।`
            : `Success! Your ${comboBids.length} combo bids have been placed for Position #${targetPosition}.`,
        );
      } else {
        await api.post('/bids/place', {
          bidType: modalTarget.type,
          scope: selectedScope,
          productId: modalTarget.type === 'PRODUCT' ? modalTarget.id : undefined,
          targetPosition: Number(targetPosition),
          bidAmount: Number(bidAmount),
        });

        setSuccessMsg(
          lang === 'bn'
            ? `অভিনন্দন! আপনার বিড কার্যকর হয়েছে এবং পজিশন #${targetPosition} সংরক্ষিত হয়েছে।`
            : `Success! Your bid has been placed for Position #${targetPosition}.`,
        );
      }

      // Refresh data & wallet
      await Promise.all([loadData(), refreshMe()]);

      setTimeout(() => {
        setModalOpen(false);
      }, 1800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to place bid';
      if (typeof msg === 'string' && msg.toLowerCase().includes('insufficient')) {
        setErrorMsg(
          lang === 'bn'
            ? 'insufficient balance please recharge — আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই, অনুগ্রহ করে রিচার্জ করুন।'
            : 'insufficient balance please recharge — You do not have sufficient available balance.',
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header & Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <span>{lang === 'bn' ? 'আমার বিড ও পজিশন প্রমোশন' : 'My Bids & Position Promotions'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'ইউজার আইডি বা প্রোডাক্টে বিড করে ক্যাটাগরি ও হোম পেজের শীর্ষে থাকুন'
              : 'Boost your User ID and Products to top spots through smart position bidding'}
          </p>
        </div>

        {/* Current Available Balance Widget */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'ব্যবহারযোগ্য ব্যালেন্স' : 'Available Balance'}
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              ৳ {userBalance.toLocaleString()}
            </div>
          </div>
          <Link
            href="/dashboard/wallet"
            className="ml-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
          >
            {lang === 'bn' ? 'রিচার্জ' : 'Recharge'}
          </Link>
        </div>
      </div>

      {/* Main Tabs: ID Bid vs Product Bids */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('ID_BID')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'ID_BID'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>{lang === 'bn' ? 'আইডি বিড (ID Bid)' : 'User ID Bid'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRODUCT_BIDS')}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'PRODUCT_BIDS'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{lang === 'bn' ? 'প্রোডাক্ট বিডস (Product Bids)' : 'Product Bids'}</span>
          {products.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300">
              {products.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: User ID Bid */}
      {activeTab === 'ID_BID' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {userData?.avatarUrl ? (
                  <img
                    src={getImageUrl(userData.avatarUrl)}
                    alt={userData.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/30 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-black text-2xl shadow-xs">
                    {userData?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {lang === 'bn' ? 'ইউনিক ইউজার আইডি:' : 'Unique User ID:'}
                    </span>
                    <span className="font-mono font-black text-lg text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      {userData?.uniqueUserId || '...'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {userData?.fullName}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400">
                      {lang === 'bn' ? 'বর্তমান সর্টিং পজিশন:' : 'Current Sorting Position:'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn' ? `পজিশন: ${userData?.currentPosition || 1}` : `Position: ${userData?.currentPosition || 1}`}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Bid Button */}
              <div className="flex flex-col sm:items-end gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Home Page Position */}
                  <div className={`p-2.5 rounded-2xl border text-xs flex flex-col gap-0.5 ${userData?.homeBid ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      🏠 {lang === 'bn' ? 'হোম পেজ' : 'Home'}
                    </span>
                    <span className="font-mono font-black text-slate-800 dark:text-white flex items-center gap-1">
                      {userData?.homeBid ? (
                        <span className="text-amber-500">#{userData.homeBid.position} (সক্রিয়)</span>
                      ) : (
                        <span>#{userData?.homePosition || 1}</span>
                      )}
                    </span>
                  </div>

                  {/* Users Directory Position */}
                  <div className={`p-2.5 rounded-2xl border text-xs flex flex-col gap-0.5 ${userData?.usersBid ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      👥 {lang === 'bn' ? 'ইউজার লিস্ট' : 'Users List'}
                    </span>
                    <span className="font-mono font-black text-slate-800 dark:text-white flex items-center gap-1">
                      {userData?.usersBid ? (
                        <span className="text-amber-500">#{userData.usersBid.position} (সক্রিয়)</span>
                      ) : (
                        <span>#{userData?.usersPosition || 1}</span>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    userData &&
                    handleOpenBidModal(
                      'USER_ID',
                      userData.id,
                      `User ID: @${userData.uniqueUserId}`,
                      userData.currentPosition,
                      undefined,
                      undefined,
                      undefined,
                      userData.homePosition,
                      undefined,
                      userData.usersPosition,
                    )
                  }
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'বিড করুন (Place Bid)' : 'Place Bid'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Product Bids */}
      {activeTab === 'PRODUCT_BIDS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading products & positions...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Package className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'আপনার কোনো আপলোড করা প্রোডাক্ট নেই' : 'No uploaded products found'}
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'প্রথমে প্রোডাক্ট আপলোড করুন, তারপর শীর্ষে থাকার জন্য বিড করুন।'
                  : 'Upload a product first to start position bidding.'}
              </p>
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
              >
                <span>{lang === 'bn' ? 'নতুন প্রোডাক্ট আপলোড' : 'Upload Product'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-xs hover:border-amber-500/40 transition"
                >
                  <div className="flex items-start gap-4">
                    <Link href={`/products/${p.slug}`} className="hover:opacity-85 transition flex-shrink-0">
                      {p.imageUrl ? (
                        <img
                          src={getImageUrl(p.imageUrl)}
                          alt={p.title}
                          className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                          No Image
                        </div>
                      )}
                    </Link>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.categoryName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {p.productType === 'DIGITAL_DOWNLOAD' ? 'Digital' : p.productType === 'PHYSICAL' ? 'Physical' : 'Service'}
                        </span>
                      </div>

                      <Link href={`/products/${p.slug}`}>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate hover:text-sky-500 transition">
                          {p.title}
                        </h3>
                      </Link>

                      <div className="text-sm font-black text-sky-600 dark:text-sky-400">
                        ৳ {p.price.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Scope Position Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    {/* Home Position */}
                    <div className={`p-2 rounded-2xl border text-[11px] flex flex-col items-center justify-center ${p.homeBid ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
                      <span className="text-[10px] text-slate-400 font-bold">🏠 {lang === 'bn' ? 'হোম পেজ' : 'Home'}</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">
                        {p.homeBid ? <span className="text-amber-500">#{p.homeBid.position}</span> : `#${p.homePosition || '-'}`}
                      </span>
                    </div>

                    {/* Shop Position */}
                    <div className={`p-2 rounded-2xl border text-[11px] flex flex-col items-center justify-center ${p.shopBid ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
                      <span className="text-[10px] text-slate-400 font-bold">🛍️ {lang === 'bn' ? 'শপ পেজ' : 'Shop'}</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">
                        {p.shopBid ? <span className="text-amber-500">#{p.shopBid.position}</span> : `#${p.shopPosition || '-'}`}
                      </span>
                    </div>

                    {/* Category Position */}
                    <div className={`p-2 rounded-2xl border text-[11px] flex flex-col items-center justify-center ${p.categoryBid ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'}`}>
                      <span className="text-[10px] text-slate-400 font-bold">📂 {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
                      <span className="font-mono font-black text-slate-800 dark:text-white">
                        {p.categoryBid ? <span className="text-amber-500">#{p.categoryBid.position}</span> : `#${p.categoryPosition || '-'}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={`/products/${p.slug}`}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {lang === 'bn' ? 'প্রোডাক্ট দেখুন' : 'View Product'}
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBidModal(
                          'PRODUCT',
                          p.id,
                          p.title,
                          p.currentPosition,
                          p.categoryId,
                          p.productType,
                          p.canonicalUrl,
                          p.homePosition,
                          p.shopPosition,
                          p.categoryPosition,
                        )
                      }
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'বিড করুন (Bid)' : 'Place Bid'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bid Form Modal */}
      {modalOpen && modalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'পজিশন নিলাম ফর্ম (Place Bid)' : 'Position Bid Form'}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {modalTarget.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch: Single Bid vs Combo Bid */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setBidMode('SINGLE')}
                className={`w-1/2 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  bidMode === 'SINGLE'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🎯</span>
                <span>{lang === 'bn' ? 'একক বিড (Single Bid)' : 'Single Bid'}</span>
              </button>
              <button
                type="button"
                onClick={() => setBidMode('COMBO')}
                className={`w-1/2 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  bidMode === 'COMBO'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{lang === 'bn' ? '⚡ অল-ইন-ওয়ান কম্বো (Combo)' : '⚡ All-in-One Combo'}</span>
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.toLowerCase().includes('insufficient') && (
                  <div className="pt-1">
                    <Link
                      href="/dashboard/wallet"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition shadow-xs"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'এখনই রিচার্জ করুন' : 'Recharge Wallet Now'}</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleExecuteBid} className="space-y-4">
              {/* --- MODE 1: SINGLE BID --- */}
              {bidMode === 'SINGLE' && (
                <>
                  {/* 1. Scope Selection with Admin Setting Checks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'বিড স্কোপ / অবস্থান নির্বাচন:' : 'Select Bidding Scope / Page:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* Home Page Scope */}
                      {(() => {
                        const homeCheck = isScopeDisabled('HOME_PAGE');
                        return (
                          <button
                            type="button"
                            disabled={homeCheck.disabled}
                            onClick={() => setSelectedScope('HOME_PAGE')}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                              homeCheck.disabled
                                ? 'opacity-40 bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                : selectedScope === 'HOME_PAGE'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {homeCheck.disabled ? <Lock className="w-3 h-3 text-rose-400" /> : <Sparkles className="w-3.5 h-3.5" />}
                              <span>{lang === 'bn' ? 'হোম পেজ' : 'Home Page'}</span>
                            </div>
                            {homeCheck.disabled && (
                              <span className="text-[9px] text-rose-500 dark:text-rose-400 font-normal">
                                {lang === 'bn' ? '(হোমে বন্ধ)' : '(Disabled)'}
                              </span>
                            )}
                          </button>
                        );
                      })()}

                      {modalTarget.type === 'PRODUCT' ? (
                        <>
                          {/* Shop Page Scope */}
                          {(() => {
                            const shopCheck = isScopeDisabled('SHOP');
                            return (
                              <button
                                type="button"
                                disabled={shopCheck.disabled}
                                onClick={() => setSelectedScope('SHOP')}
                                className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                                  shopCheck.disabled
                                    ? 'opacity-40 bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                    : selectedScope === 'SHOP'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {shopCheck.disabled ? <Lock className="w-3 h-3 text-rose-400" /> : <Store className="w-3.5 h-3.5" />}
                                  <span>{lang === 'bn' ? 'শপ পেজ (SHOP)' : 'Shop Page'}</span>
                                </div>
                                {shopCheck.disabled && (
                                  <span className="text-[9px] text-rose-500 dark:text-rose-400 font-normal">
                                    {lang === 'bn' ? '(শপে বন্ধ)' : '(Disabled)'}
                                  </span>
                                )}
                              </button>
                            );
                          })()}

                          {/* Route-specific: Only show Digital for Digital products */}
                          {modalTarget.productType === 'DIGITAL_DOWNLOAD' &&
                            modalTarget.canonicalUrl !== '/money-exchange' &&
                            modalTarget.canonicalUrl !== 'money-exchange' && (
                              <button
                                type="button"
                                onClick={() => setSelectedScope('DIGITAL_PRODUCTS')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                  selectedScope === 'DIGITAL_PRODUCTS'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <DownloadCloud className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'ডিজিটাল মার্কেট' : 'Digital Market'}</span>
                              </button>
                            )}

                          {/* Route-specific: Only show Physical for Physical products */}
                          {modalTarget.productType === 'PHYSICAL' &&
                            modalTarget.canonicalUrl !== '/money-exchange' &&
                            modalTarget.canonicalUrl !== 'money-exchange' && (
                              <button
                                type="button"
                                onClick={() => setSelectedScope('PHYSICAL_PRODUCTS')}
                                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                  selectedScope === 'PHYSICAL_PRODUCTS'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <Cpu className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'ফিজিক্যাল মার্কেট' : 'Physical Market'}</span>
                              </button>
                            )}

                          {/* Route-specific: Only show Money Exchange for Money Exchange products */}
                          {(modalTarget.canonicalUrl === '/money-exchange' ||
                            modalTarget.canonicalUrl === 'money-exchange') && (
                            <button
                              type="button"
                              onClick={() => setSelectedScope('MONEY_EXCHANGE')}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                selectedScope === 'MONEY_EXCHANGE'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? 'এক্সচেঞ্জ পেজ' : 'Exchange Page'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedScope('CATEGORY')}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              selectedScope === 'CATEGORY'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'ক্যাটাগরি পেজ' : 'Category Page'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedScope('CATEGORY')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            selectedScope === 'CATEGORY'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'ইউজার ডিরেক্টরি' : 'User Directory'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Target Position Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'কাঙ্ক্ষিত পজিশন (Sorting Position):' : 'Desired Position Number:'}
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {lang === 'bn' ? `বর্তমান পজিশন: #${modalTarget.currentPosition}` : `Current: #${modalTarget.currentPosition}`}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={targetPosition}
                      onChange={(e) => setTargetPosition(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500 transition"
                      placeholder="e.g. 1, 2, 5..."
                      required
                    />
                  </div>

                  {/* 3. Single Price Calculation Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        {lang === 'bn' ? 'পজিশন স্ট্যাটাস:' : 'Position Status:'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {calcLoading ? (
                          <span className="text-slate-400 animate-pulse">Calculating...</span>
                        ) : calculation?.hasActiveBid ? (
                          <span className="text-amber-500">
                            {lang === 'bn' ? `দখলকৃত (${calculation.currentHolder})` : `Occupied (${calculation.currentHolder})`}
                          </span>
                        ) : (
                          <span className="text-emerald-500">{lang === 'bn' ? 'উন্মুক্ত / ফাঁকা' : 'Vacant'}</span>
                        )}
                      </span>
                    </div>

                    {calculation?.hasActiveBid && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {lang === 'bn' ? 'বর্তমান বিড + অ্যাডমিন এক্সট্রা:' : 'Current Bid + Admin Extra:'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            ৳{calculation.currentHighestBid} + ৳{calculation.extraIncrement}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBidAmount(Number(calculation.minimumRequiredBid))}
                            className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] hover:bg-amber-500/30 transition cursor-pointer"
                          >
                            {lang === 'bn' ? 'আউটবিড মান বসান' : 'Set Outbid'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'সর্বনিম্ন প্রয়োজনীয় বিড ব্যালেন্স:' : 'Minimum Required Bid Balance:'}
                      </span>
                      <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                        ৳ {requiredBalance.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-500">
                        {lang === 'bn' ? 'আপনার ওয়ালেট ব্যালেন্স:' : 'Your Available Balance:'}
                      </span>
                      <span className={`font-mono font-bold ${isInsufficient ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ৳ {userBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* --- MODE 2: COMBO BID --- */}
              {bidMode === 'COMBO' && (
                <>
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'এক ক্লিকেই সব সিলেক্টেড অবস্থানে আপনার আইটেম শীর্ষ পজিশনে বিড করুন।'
                        : 'Boost your item across all selected locations in a single click.'}
                    </span>
                  </div>

                  {/* Combo Scopes Selection Checkboxes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'কম্বো স্কোপসমূহ নির্বাচন করুন:' : 'Select Combo Scopes:'}
                    </label>

                    <div className="space-y-2">
                      {/* 1. Home Page Scope */}
                      {(() => {
                        const homeCheck = isScopeDisabled('HOME_PAGE');
                        const isChecked = comboSelectedScopes.includes('HOME_PAGE');
                        const calc = comboCalculations['HOME_PAGE'];
                        return (
                          <div
                            onClick={() => {
                              if (homeCheck.disabled) return;
                              setComboSelectedScopes((prev) =>
                                isChecked ? prev.filter((s) => s !== 'HOME_PAGE') : [...prev, 'HOME_PAGE']
                              );
                            }}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                              homeCheck.disabled
                                ? 'opacity-40 bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                : isChecked
                                ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isChecked && !homeCheck.disabled ? (
                                <CheckSquare className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                              <div>
                                <div className="font-bold text-xs flex items-center gap-1.5">
                                  <span>🏠 {lang === 'bn' ? 'হোম পেজ' : 'Home Page'}</span>
                                  {homeCheck.disabled && <Lock className="w-3 h-3 text-rose-500" />}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {homeCheck.disabled
                                    ? homeCheck.reason
                                    : lang === 'bn'
                                    ? 'হোম পেজের শীর্ষ স্পন্সরড পজিশন'
                                    : 'Top sponsored slot on Home Page'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {homeCheck.disabled ? (
                                <span className="text-[10px] text-rose-500 font-bold">বন্ধ</span>
                              ) : (
                                <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                                  ৳ {calc?.minimumRequiredBid ? calc.minimumRequiredBid.toLocaleString() : '...'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. Shop Page Scope (Product only) */}
                      {modalTarget.type === 'PRODUCT' &&
                        (() => {
                          const shopCheck = isScopeDisabled('SHOP');
                          const isChecked = comboSelectedScopes.includes('SHOP');
                          const calc = comboCalculations['SHOP'];
                          return (
                            <div
                              onClick={() => {
                                if (shopCheck.disabled) return;
                                setComboSelectedScopes((prev) =>
                                  isChecked ? prev.filter((s) => s !== 'SHOP') : [...prev, 'SHOP']
                                );
                              }}
                              className={`p-3 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                                shopCheck.disabled
                                  ? 'opacity-40 bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                  : isChecked
                                  ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {isChecked && !shopCheck.disabled ? (
                                  <CheckSquare className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                                <div>
                                  <div className="font-bold text-xs flex items-center gap-1.5">
                                    <span>🛍️ {lang === 'bn' ? 'শপ পেজ (SHOP)' : 'Shop Page'}</span>
                                    {shopCheck.disabled && <Lock className="w-3 h-3 text-rose-500" />}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {shopCheck.disabled
                                      ? shopCheck.reason
                                      : lang === 'bn'
                                      ? 'অল প্রোডাক্ট শপ পেজের শীর্ষ পজিশন'
                                      : 'Top slot on All-Products Shop Page'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {shopCheck.disabled ? (
                                  <span className="text-[10px] text-rose-500 font-bold">বন্ধ</span>
                                ) : (
                                  <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                                    ৳ {calc?.minimumRequiredBid ? calc.minimumRequiredBid.toLocaleString() : '...'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                      {/* 3. Category / Route Scope */}
                      {(() => {
                        const targetScope =
                          modalTarget.type === 'USER_ID'
                            ? 'CATEGORY'
                            : modalTarget.productType === 'DIGITAL_DOWNLOAD'
                            ? 'DIGITAL_PRODUCTS'
                            : modalTarget.productType === 'PHYSICAL'
                            ? 'PHYSICAL_PRODUCTS'
                            : modalTarget.canonicalUrl === '/money-exchange' || modalTarget.canonicalUrl === 'money-exchange'
                            ? 'MONEY_EXCHANGE'
                            : 'CATEGORY';

                        const label =
                          modalTarget.type === 'USER_ID'
                            ? (lang === 'bn' ? '👥 ইউজার ডিরেক্টরি (/users)' : 'Users Directory')
                            : modalTarget.productType === 'DIGITAL_DOWNLOAD'
                            ? (lang === 'bn' ? '📥 ডিজিটাল প্রোডাক্টস মার্কেট' : 'Digital Products Page')
                            : modalTarget.productType === 'PHYSICAL'
                            ? (lang === 'bn' ? '📦 ফিজিক্যাল প্রোডাক্টস মার্কেট' : 'Physical Products Page')
                            : modalTarget.canonicalUrl === '/money-exchange'
                            ? (lang === 'bn' ? '💱 মানি এক্সচেঞ্জ পেজ' : 'Money Exchange Page')
                            : (lang === 'bn' ? '📂 ক্যাটাগরি পেজ' : 'Category Page');

                        const isChecked = comboSelectedScopes.includes(targetScope);
                        const calc = comboCalculations[targetScope];

                        return (
                          <div
                            onClick={() => {
                              setComboSelectedScopes((prev) =>
                                isChecked ? prev.filter((s) => s !== targetScope) : [...prev, targetScope]
                              );
                            }}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition cursor-pointer ${
                              isChecked
                                ? 'bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-amber-500" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                              <div>
                                <div className="font-bold text-xs">{label}</div>
                                <div className="text-[10px] text-slate-400">
                                  {lang === 'bn' ? 'নির্দিষ্ট ক্যাটাগরি পেজের শীর্ষ পজিশন' : 'Category/Route page top slot'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                                ৳ {calc?.minimumRequiredBid ? calc.minimumRequiredBid.toLocaleString() : '...'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Target Position Input for Combo */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'কাঙ্ক্ষিত পজিশন (সকল নির্বাচিত স্কোপে):' : 'Desired Position (All Selected Scopes):'}
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Spot #{targetPosition}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={targetPosition}
                      onChange={(e) => setTargetPosition(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500 transition"
                      placeholder="e.g. 1"
                      required
                    />
                  </div>

                  {/* Combo Total Balance Summary Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>{lang === 'bn' ? 'নির্বাচিত স্কোপ সংখ্যা:' : 'Selected Scopes Count:'}</span>
                      <span className="font-mono text-amber-500">{comboSelectedScopes.length}টি স্থান</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'সর্বমোট প্রয়োজনীয় কম্বো ব্যালেন্স:' : 'Total Required Combo Balance:'}
                      </span>
                      <span className="font-mono font-black text-base text-amber-600 dark:text-amber-400">
                        ৳ {totalComboRequired.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-500">
                        {lang === 'bn' ? 'আপনার ওয়ালেট ব্যালেন্স:' : 'Your Available Balance:'}
                      </span>
                      <span className={`font-mono font-bold ${isInsufficient ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ৳ {userBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Insufficient Warning */}
              {isInsufficient && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
                  <span>insufficient balance please recharge</span>
                  <Link
                    href="/dashboard/wallet"
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 transition"
                  >
                    {lang === 'bn' ? 'রিচার্জ' : 'Recharge'}
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting || calcLoading || isInsufficient || (bidMode === 'COMBO' && comboSelectedScopes.length === 0)}
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  {submitting ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{bidMode === 'COMBO' ? (lang === 'bn' ? 'কম্বো বিড নিশ্চিত করুন' : 'Confirm Combo Bid') : (lang === 'bn' ? 'বিড নিশ্চিত করুন' : 'Confirm Bid')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Bids History Table */}
      <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span>{lang === 'bn' ? 'আমার বিডিং হিস্ট্রি' : 'My Bidding History'}</span>
        </h2>

        {bidsHistory.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
            {lang === 'bn' ? 'এখনো কোনো বিড হিস্ট্রি নেই।' : 'No bidding history recorded.'}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Target</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Bid Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bidsHistory.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {b.bidType === 'USER_ID'
                        ? `@${b.targetUser?.uniqueUserId || 'My ID'}`
                        : b.product?.title || 'Product'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {b.bidType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-medium">
                      {b.scope}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-500">
                      Spot #{b.targetPosition}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      ৳ {Number(b.bidAmount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {b.status === 'OUTBID' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenBidModal(
                              b.bidType,
                              b.productId || b.targetUserId,
                              b.bidType === 'USER_ID' ? `@${b.targetUser?.uniqueUserId}` : (b.product?.title || 'Product'),
                              b.targetPosition,
                              b.categoryId,
                            )
                          }
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-200 transition cursor-pointer"
                        >
                          OUTBID (Re-bid ➔)
                        </button>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(b.createdAt || b.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
