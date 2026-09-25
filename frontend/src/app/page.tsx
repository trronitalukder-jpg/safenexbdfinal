'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Coins,
  Cpu,
  DownloadCloud,
  CheckCircle2,
  Users,
  ChevronRight,
  Store,
  Sparkles,
  ChevronLeft,
  ExternalLink,
  X,
  Package,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

function HomePositionTag({ position }: { position: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-xs font-mono">
      #{position}
    </span>
  );
}

export default function HomePage() {
  const { lang, t } = useLanguage();
  const [sliders, setSliders] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Products & Users data
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [physicalProducts, setPhysicalProducts] = useState<any[]>([]);
  const [moneyExchangeProducts, setMoneyExchangeProducts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);

  // Settings from admin
  const [homeSettings, setHomeSettings] = useState<any>({
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1 single aggregated request for the entire home page
    api.get('/products/home-feed')
      .then((res: any) => {
        const data = unwrap(res);
        if (data) {
          if (Array.isArray(data.sliders)) setSliders(data.sliders);
          if (data.settings) setHomeSettings((prev: any) => ({ ...prev, ...data.settings }));
          if (Array.isArray(data.shopProducts)) setShopProducts(data.shopProducts);
          if (Array.isArray(data.digitalProducts)) setDigitalProducts(data.digitalProducts);
          if (Array.isArray(data.physicalProducts)) setPhysicalProducts(data.physicalProducts);
          if (Array.isArray(data.moneyExchangeProducts)) setMoneyExchangeProducts(data.moneyExchangeProducts);
          if (Array.isArray(data.topUsers)) setTopUsers(data.topUsers);
        }
      })
      .catch(() => {
        // Fallback parallel loads if home-feed fails
        Promise.allSettled([
          api.get('/cms/sliders').then((r: any) => setSliders(unwrap(r) || [])).catch(() => {}),
          api.get('/products?scope=HOME_PAGE&limit=12').then((r: any) => setShopProducts(unwrap(r)?.items || [])).catch(() => {}),
          api.get('/products?productType=DIGITAL_DOWNLOAD&scope=DIGITAL_PRODUCTS&limit=8').then((r: any) => setDigitalProducts(unwrap(r)?.items || [])).catch(() => {}),
          api.get('/products?productType=PHYSICAL&scope=PHYSICAL_PRODUCTS&limit=8').then((r: any) => setPhysicalProducts(unwrap(r)?.items || [])).catch(() => {}),
          api.get('/products?canonicalUrl=/money-exchange&scope=MONEY_EXCHANGE&limit=6').then((r: any) => setMoneyExchangeProducts(unwrap(r)?.items || [])).catch(() => {}),
          api.get('/users/search?limit=6&scope=HOME_PAGE').then((r: any) => setTopUsers(unwrap(r) || [])).catch(() => {}),
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Slide autoplay
  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [sliders]);

  // Section Renderers
  const renderShopProductsSection = () => {
    if (!homeSettings.showShopProducts) return null;
    if (!loading && shopProducts.length === 0) return null;
    const titles = homeSettings.sectionTitles?.shopProducts || {};
    const titleText = (lang === 'bn' ? titles.bn : titles.en) || (lang === 'bn' ? 'শপ প্রোডাক্টস' : 'Shop Products');
    const subText = titles.sub || (lang === 'bn' ? 'সকল শীর্ষ পণ্য ও মার্কেটপ্লেস আইটেম' : 'All top rated products and marketplace items');
    const isCarousel = homeSettings.layoutStyles?.shopProducts === 'carousel';

    return (
      <section key="shopProducts" className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <Store className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'শপ মার্কেটপ্লেস' : 'Shop Marketplace'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {titleText}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {subText}
            </p>
          </div>
          <Link
            href="/shop"
            className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'সবগুলো দেখুন (SHOP)' : 'View All (SHOP)'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading && shopProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 animate-pulse">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className={isCarousel ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-thin' : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'}>
          {shopProducts.map((p) => {
            const mainImg = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
            const hasActiveBid = Boolean(p.activeBid);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs sm:shadow-sm hover:shadow-md transition flex flex-col justify-between group ${
                  isCarousel ? 'min-w-[240px] sm:min-w-[280px] flex-shrink-0' : ''
                } ${hasActiveBid ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-200/80 dark:border-slate-800'}`}
              >
                <div>
                  <Link
                    href={`/products/${p.slug}`}
                    className="block relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={getImageUrl(mainImg)}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      {hasActiveBid ? (
                        <HomePositionTag position={p.activeBid.targetPosition} />
                      ) : (
                        <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-xs font-bold bg-slate-900/80 text-white backdrop-blur shadow-xs">
                          {p.productType === 'DIGITAL_DOWNLOAD' ? 'DIGITAL' : 'PHYSICAL'}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-2.5 sm:p-5 space-y-1.5 sm:space-y-3">
                    <Link
                      href={`/users/${p.seller?.uniqueUserId || p.seller?.id}`}
                      className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition cursor-pointer group"
                      title={lang === 'bn' ? 'সেলার প্রোফাইল দেখুন' : 'View Seller Profile'}
                    >
                      <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-amber-500 text-slate-950 text-[9px] sm:text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:ring-1 group-hover:ring-amber-500 transition">
                        {p.seller?.firstName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-500 group-hover:text-amber-500 font-mono truncate transition">
                        @{p.seller?.uniqueUserId || 'Seller'}
                      </span>
                    </Link>

                    <Link href={`/products/${p.slug}`}>
                      <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-amber-500 transition leading-snug">
                        {p.title}
                      </h3>
                    </Link>

                    <div className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-400">
                      {(p as any).pricingType === 'NEGOTIABLE' || Number(p.price) === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {lang === 'bn' ? 'আলোচনাসাপেক্ষ' : 'Negotiable'}
                        </span>
                      ) : (
                        `৳ ${Number(p.price).toLocaleString()}`
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-5 pt-0">
                  <Link
                    href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                    className="w-full py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('chat')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>
    );
  };

  const renderDigitalProductsSection = () => {
    if (!homeSettings.showDigitalProducts) return null;
    if (!loading && digitalProducts.length === 0) return null;
    const titles = homeSettings.sectionTitles?.digitalProducts || {};
    const titleText = (lang === 'bn' ? titles.bn : titles.en) || (lang === 'bn' ? 'ডিজিটাল প্রোডাক্টস ও সফটওয়্যার' : 'Digital Products & Software');
    const subText = titles.sub || (lang === 'bn' ? 'সফটওয়্যার, স্ক্রিপ্ট, ইবুক ও অ্যাকাউন্ট — সরাসরি নিরাপদ এসক্রোতে কিনুন' : 'Software, scripts, ebooks and accounts delivered instantly with safe escrow');
    const isCarousel = homeSettings.layoutStyles?.digitalProducts === 'carousel';

    return (
      <section key="digitalProducts" className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold mb-1">
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ডিজিটাল মার্কেটপ্লেস' : 'Digital Marketplace'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {titleText}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {subText}
            </p>
          </div>
          <Link
            href="/digital-products"
            className="text-sm font-bold text-sky-600 hover:underline flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'সবগুলো দেখুন' : 'View All'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading && digitalProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 animate-pulse">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className={isCarousel ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-thin' : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'}>
          {digitalProducts.map((p) => {
            const mainImg = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
            const hasActiveBid = Boolean(p.activeBid);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs sm:shadow-sm hover:shadow-md transition flex flex-col justify-between group ${
                  isCarousel ? 'min-w-[240px] sm:min-w-[280px] flex-shrink-0' : ''
                } ${hasActiveBid ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-200/80 dark:border-slate-800'}`}
              >
                <div>
                  <Link
                    href={`/products/${p.slug}`}
                    className="block relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={getImageUrl(mainImg)}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      {hasActiveBid ? (
                        <HomePositionTag position={p.activeBid.targetPosition} />
                      ) : (
                        <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-xs font-bold bg-sky-600 text-white backdrop-blur shadow-xs">
                          DIGITAL
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-2.5 sm:p-5 space-y-1.5 sm:space-y-3">
                    <Link
                      href={`/users/${p.seller?.uniqueUserId || p.seller?.id}`}
                      className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition cursor-pointer group"
                      title={lang === 'bn' ? 'সেলার প্রোফাইল দেখুন' : 'View Seller Profile'}
                    >
                      <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-sky-600 text-white text-[9px] sm:text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:ring-1 group-hover:ring-sky-500 transition">
                        {p.seller?.firstName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-500 group-hover:text-sky-600 font-mono truncate transition">
                        @{p.seller?.uniqueUserId || 'Seller'}
                      </span>
                    </Link>

                    <Link href={`/products/${p.slug}`}>
                      <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 transition leading-snug">
                        {p.title}
                      </h3>
                    </Link>

                    <div className="text-sm sm:text-lg font-black text-sky-600 dark:text-sky-400">
                      {(p as any).pricingType === 'NEGOTIABLE' || Number(p.price) === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {lang === 'bn' ? 'আলোচনাসাপেক্ষ' : 'Negotiable'}
                        </span>
                      ) : (
                        `৳ ${Number(p.price).toLocaleString()}`
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-5 pt-0">
                  <Link
                    href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                    className="w-full py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('chat')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>
    );
  };

  const renderPhysicalProductsSection = () => {
    if (!homeSettings.showPhysicalProducts) return null;
    if (!loading && physicalProducts.length === 0) return null;
    const titles = homeSettings.sectionTitles?.physicalProducts || {};
    const titleText = (lang === 'bn' ? titles.bn : titles.en) || (lang === 'bn' ? 'ফিজিক্যাল প্রোডাক্টস ও ইলেকট্রনিক্স' : 'Physical Products & Gadgets');
    const subText = titles.sub || (lang === 'bn' ? 'স্মার্ট গ্যাজেট, ইলেকট্রনিক্স ও পণ্য — পণ্য হাতে পেয়ে সন্তুষ্ট হলে তবেই টাকা ছাড়ুন' : 'Smart gadgets, electronics and hardware with guaranteed escrow delivery');
    const isCarousel = homeSettings.layoutStyles?.physicalProducts === 'carousel';

    return (
      <section key="physicalProducts" className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'স্মার্ট ডিভাইস ও গ্যাজেট' : 'Smart Devices & Hardware'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {titleText}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {subText}
            </p>
          </div>
          <Link
            href="/physical-products"
            className="text-sm font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'সবগুলো দেখুন' : 'View All'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading && physicalProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 animate-pulse">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className={isCarousel ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-thin' : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'}>
          {physicalProducts.map((p) => {
            const mainImg = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';
            const hasActiveBid = Boolean(p.activeBid);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs sm:shadow-sm hover:shadow-md transition flex flex-col justify-between group ${
                  isCarousel ? 'min-w-[240px] sm:min-w-[280px] flex-shrink-0' : ''
                } ${hasActiveBid ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-200/80 dark:border-slate-800'}`}
              >
                <div>
                  <Link
                    href={`/products/${p.slug}`}
                    className="block relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={getImageUrl(mainImg)}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      {hasActiveBid ? (
                        <HomePositionTag position={p.activeBid.targetPosition} />
                      ) : (
                        <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-xs font-bold bg-emerald-600 text-white backdrop-blur shadow-xs">
                          PHYSICAL
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="p-2.5 sm:p-5 space-y-1.5 sm:space-y-3">
                    <Link
                      href={`/users/${p.seller?.uniqueUserId || p.seller?.id}`}
                      className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition cursor-pointer group"
                      title={lang === 'bn' ? 'সেলার প্রোফাইল দেখুন' : 'View Seller Profile'}
                    >
                      <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white text-[9px] sm:text-xs font-bold flex items-center justify-center flex-shrink-0 group-hover:ring-1 group-hover:ring-emerald-500 transition">
                        {p.seller?.firstName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-500 group-hover:text-emerald-600 font-mono truncate transition">
                        @{p.seller?.uniqueUserId || 'Seller'}
                      </span>
                    </Link>

                    <Link href={`/products/${p.slug}`}>
                      <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-emerald-600 transition leading-snug">
                        {p.title}
                      </h3>
                    </Link>

                    <div className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {(p as any).pricingType === 'NEGOTIABLE' || Number(p.price) === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {lang === 'bn' ? 'আলোচনাসাপেক্ষ' : 'Negotiable'}
                        </span>
                      ) : (
                        `৳ ${Number(p.price).toLocaleString()}`
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-5 pt-0">
                  <Link
                    href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                    className="w-full py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('chat')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>
    );
  };

  const renderMoneyExchangeSection = () => {
    if (!homeSettings.showMoneyExchange) return null;
    if (!loading && moneyExchangeProducts.length === 0) return null;
    const titles = homeSettings.sectionTitles?.moneyExchange || {};
    const titleText = (lang === 'bn' ? titles.bn : titles.en) || (lang === 'bn' ? 'মানি এক্সচেঞ্জ অফারসমূহ' : 'Money Exchange Offers');
    const subText = titles.sub || (lang === 'bn' ? 'ডলার, কারেন্সি ও ওয়ালেট ব্যালেন্স নিরাপদে এক্সচেঞ্জ করুন ১০০% এসক্রো হোল্ডে' : 'Exchange USD, EUR, USDT and e-wallets safely with automated escrow protection');
    const isCarousel = homeSettings.layoutStyles?.moneyExchange === 'carousel';

    return (
      <section key="moneyExchange" className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পিয়ার-টু-পিয়ার এসক্রো এক্সচেঞ্জ' : 'P2P Escrow Exchange'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {titleText}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {subText}
            </p>
          </div>
          <Link
            href="/money-exchange"
            className="text-sm font-bold text-amber-600 hover:underline flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'সব এক্সচেঞ্জ দেখুন' : 'View All Exchanges'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading && moneyExchangeProducts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className={isCarousel ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-thin' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6'}>
          {moneyExchangeProducts.map((p) => {
            const hasActiveBid = Boolean(p.activeBid);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border p-4 sm:p-5 shadow-xs sm:shadow-sm hover:shadow-md transition flex flex-col justify-between group ${
                  isCarousel ? 'min-w-[280px] sm:min-w-[320px] flex-shrink-0' : ''
                } ${hasActiveBid ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-slate-200/80 dark:border-slate-800'}`}
              >
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/users/${p.seller?.uniqueUserId || p.seller?.id}`}
                      className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer group"
                      title={lang === 'bn' ? 'সেলার প্রোফাইল দেখুন' : 'View Seller Profile'}
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs group-hover:ring-1 group-hover:ring-amber-500 transition">
                        <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="font-mono text-[11px] sm:text-xs text-slate-500 group-hover:text-amber-500 transition">
                        @{p.seller?.uniqueUserId || 'Seller'}
                      </span>
                    </Link>

                    {hasActiveBid ? (
                      <HomePositionTag position={p.activeBid.targetPosition} />
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Exchange
                      </span>
                    )}
                  </div>

                  <Link href={`/products/${p.slug}`}>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-amber-500 transition">
                      {p.title}
                    </h3>
                  </Link>

                  <div className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-400">
                    {(p as any).pricingType === 'NEGOTIABLE' || Number(p.price) === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {lang === 'bn' ? 'আলোচনাসাপেক্ষ' : 'Negotiable'}
                      </span>
                    ) : (
                      `৳ ${Number(p.price).toLocaleString()}`
                    )}
                  </div>
                </div>

                <div className="pt-3 sm:pt-4">
                  <Link
                    href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                    className="w-full py-2 sm:py-2.5 px-4 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('chat')}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>
    );
  };

  const renderUsersSection = () => {
    if (!homeSettings.showUsers) return null;
    if (!loading && topUsers.length === 0) return null;
    const titles = homeSettings.sectionTitles?.users || {};
    const titleText = (lang === 'bn' ? titles.bn : titles.en) || (lang === 'bn' ? 'টপ ইউজার ও সেলার আইডি' : 'Top Users & Verified Sellers');
    const subText = titles.sub || (lang === 'bn' ? 'প্ল্যাটফর্মের শীর্ষ সক্রিয় ইউজারদের সাথে সরাসরি চ্যাট বা লেনদেন শুরু করুন' : 'Connect and start verified transactions directly with top platform members');
    const isCarousel = homeSettings.layoutStyles?.users === 'carousel';

    return (
      <section key="users" className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'শীর্ষ প্রোফাইল' : 'Top Profiles'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {titleText}
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {subText}
            </p>
          </div>
          <Link
            href="/users"
            className="text-sm font-bold text-sky-600 hover:underline flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'সকল ইউজার খুঁজুন' : 'Find All Users'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading && topUsers.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                  </div>
                </div>
                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className={isCarousel ? 'flex gap-4 overflow-x-auto pb-4 scrollbar-thin' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6'}>
          {topUsers.map((u) => {
            const hasActiveBid = Boolean(u.activeBid);

            return (
              <div
                key={u.id}
                className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border p-4 sm:p-5 shadow-xs sm:shadow-sm hover:shadow-md transition flex flex-col justify-between group ${
                  isCarousel ? 'min-w-[280px] sm:min-w-[320px] flex-shrink-0' : ''
                } ${hasActiveBid ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-amber-500/10' : 'border-slate-200/80 dark:border-slate-800'}`}
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/users/${u.uniqueUserId || u.id}`}
                      className="flex items-center gap-3 sm:gap-3.5 min-w-0 hover:opacity-85 transition cursor-pointer group/user"
                      title={lang === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
                    >
                      {u.avatarUrl ? (
                        <img
                          src={getImageUrl(u.avatarUrl)}
                          alt={u.fullName}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-sky-500/30 flex-shrink-0 group-hover/user:ring-2 group-hover/user:ring-sky-500 transition"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sky-600 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-xs flex-shrink-0 group-hover/user:ring-2 group-hover/user:ring-sky-500 transition">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover/user:text-sky-600 group-hover/user:underline transition">
                            @{u.uniqueUserId}
                          </span>
                          {u.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-500 truncate">{u.fullName}</div>
                      </div>
                    </Link>

                    {hasActiveBid && (
                      <div className="flex-shrink-0">
                        <HomePositionTag position={u.activeBid.targetPosition} />
                      </div>
                    )}
                  </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-[9px] sm:text-[10px] text-slate-400">
                      {lang === 'bn' ? 'সক্রিয় প্রোডাক্ট' : 'Products'}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {u.activeProductsCount || 0}
                    </div>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-[9px] sm:text-[10px] text-slate-400">
                      {lang === 'bn' ? 'সম্পন্ন ডিল' : 'Deals'}
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {u.completedTransactionsCount || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 sm:pt-4">
                <Link
                  href={`/dashboard/chat?targetUserId=${u.id}`}
                  className="w-full py-2 sm:py-2.5 px-4 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'চ্যাট শুরু করুন' : 'Chat Now'}</span>
                </Link>
              </div>
            </div>
          );
        })}
        </div>
        )}
      </section>
    );
  };

  const renderOrderedSection = (sectionKey: string) => {
    switch (sectionKey) {
      case 'shopProducts':
        return renderShopProductsSection();
      case 'digitalProducts':
        return renderDigitalProductsSection();
      case 'physicalProducts':
        return renderPhysicalProductsSection();
      case 'moneyExchange':
        return renderMoneyExchangeSection();
      case 'users':
        return renderUsersSection();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Section & Sliders */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Slide Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-400 text-xs sm:text-sm font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'bn' ? '১০০% নিরাপদ এসক্রো ট্রানজ্যাকশন প্ল্যাটফর্ম' : '100% Secure Escrow Safe Transactions'}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                {sliders[currentSlide]?.title || (lang === 'bn'
                  ? 'নিরাপদ লেনদেন ও আধুনিক মার্কেটপ্লেস'
                  : 'Safe Transaction Marketplace & Escrow')}
              </h1>

              <p className="text-sm sm:text-lg md:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
                {sliders[currentSlide]?.subtitle || (lang === 'bn'
                  ? 'পণ্য বা সার্ভিস বুঝে পেয়ে টাকা ছাড়ুন। টাকা থাকবে সুরক্ষিত Hold ব্যালেন্সে। কোনো প্রতারণার সুযোগ নেই।'
                  : 'Pay with complete peace of mind. Funds stay locked in Escrow Hold balance until you confirm delivery.')}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <Link
                  href="/transactions"
                  className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/30 flex items-center gap-2 transition"
                >
                  <span>{lang === 'bn' ? 'নিরাপদ লেনদেন শুরু করুন' : 'Start Safe Transaction'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/shop"
                  className="px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'শপ দেখুন (SHOP)' : 'Visit SHOP'}</span>
                </Link>
              </div>

              {/* Slider Dots */}
              {sliders.length > 1 && (
                <div className="flex items-center gap-2 pt-4">
                  {sliders.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        currentSlide === idx ? 'w-8 bg-sky-500' : 'w-2 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Hero Visual Card: Escrow Simulation */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'এসক্রো লেনদেন সুরক্ষা' : 'Escrow Protection Flow'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    PROTECTED
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{lang === 'bn' ? 'চ্যাটে কথা বলে অফার ঠিক করুন' : 'Chat & Agree on Price'}</div>
                      <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'সরাসরি চ্যাটে Pay বা Receive রিকোয়েস্ট পাঠান' : 'Direct one-to-one negotiation'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{lang === 'bn' ? 'টাকা থাকবে Hold ব্যালেন্সে' : 'Funds Secured in Hold Balance'}</div>
                      <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'কাজ চলাকালীন সেলার বা বায়ার কেউ টাকা তুলতে পারবে না' : 'Locked safely under system escrow'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      3
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{lang === 'bn' ? 'কাজ শেষ হলে নিশ্চিত করে রিলিজ' : 'Approve Work & Release Money'}</div>
                      <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'কোনো বিরোধ হলে Call Admin দিয়ে ২৪/৭ সাপোর্ট নিন' : 'Dispute mediation available at any time'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'bn' ? 'জিরো ফ্রড গ্যারান্টি ও সেন্ট্রালাইজড লেজার' : 'Zero Fraud Guarantee & Immutable Ledger'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dynamically Rendered Sections in Admin-Defined Sequence Order */}
      {homeSettings.sectionOrder.map((sectionKey: string) => renderOrderedSection(sectionKey))}

      {/* 3. Trust & Safety Statistics */}
      <section className="bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 py-10 sm:py-16">
        <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'বিশ্বাস ও নিরাপত্তার প্রতীক — SafnexBD' : 'Trust, Security & Protection'}
            </h2>
            <p className="text-xs sm:text-base text-slate-700 dark:text-slate-300">
              {lang === 'bn'
                ? 'আমরা বায়ার ও সেলার উভয়ের অর্থ সুরক্ষায় ১০০% মধ্যস্থতা প্রদান করি'
                : 'Zero-fraud policy with centralized wallet ledger & automated dispute support'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8 text-center">
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-sky-600">১০০%</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 sm:mt-2">{lang === 'bn' ? 'এসক্রো সুরক্ষা' : 'Escrow Protected'}</div>
            </div>
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-emerald-600">৳ ৫M+</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 sm:mt-2">{lang === 'bn' ? 'নিরাপদ লেনদেন ভলিউম' : 'Volume Secured'}</div>
            </div>
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-500">২৪/৭</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 sm:mt-2">{lang === 'bn' ? 'অ্যাডমিন সাপোর্ট ও মীমাংসা' : 'Dispute Mediation'}</div>
            </div>
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-indigo-600">০%</div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-1 sm:mt-2">{lang === 'bn' ? 'প্রতারণার ঝুঁকি' : 'Fraud Risk'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Call To Action Banner */}
      <section className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-6 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 shadow-xl">
          <div className="space-y-2 sm:space-y-3 max-w-2xl text-center md:text-left">
            <h3 className="text-2xl sm:text-4xl font-black">
              {lang === 'bn' ? 'আজই শুরু করুন নিরাপদ লেনদেন' : 'Start Your Safe Deals Today'}
            </h3>
            <p className="text-sm sm:text-base text-sky-100 leading-relaxed">
              {lang === 'bn'
                ? 'একই অ্যাকাউন্ট থেকে কেনাবেচা করুন, সার্ভিস প্রদান করুন এবং নিশ্চিন্তে পেমেন্ট গ্রহণ করুন।'
                : 'One single account for Buyer, Seller, Service Provider and Peer-to-Peer exchanges.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full md:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-100 shadow-md transition"
            >
              {t('register')}
            </Link>
            <Link
              href="/transactions"
              className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-sky-900/60 hover:bg-sky-900 text-white font-bold text-xs sm:text-sm border border-sky-400/30 transition"
            >
              {t('safe_transactions')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
