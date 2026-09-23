'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Plus,
  Store,
  Sparkles,
  Clock,
  Award,
  DownloadCloud,
  Cpu,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { fetchWithCache } from '@/lib/cache';

function BidBadge({ position }: { position: number; expiresAt?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
      #{position}
    </span>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [sortBy, setSortBy] = useState('newest');

  const fetchProducts = () => {
    const query = new URLSearchParams();
    query.append('scope', 'SHOP');
    if (search) query.append('search', search);
    if (selectedCategory) query.append('category', selectedCategory);
    if (selectedType) query.append('type', selectedType);
    if (sortBy) query.append('sortBy', sortBy);

    const cacheKey = `shop:products:${query.toString()}`;
    fetchWithCache(
      cacheKey,
      async () => {
        const res: any = await api.get(`/products?${query.toString()}`);
        const data = res?.data !== undefined ? res.data : res;
        return data.items || (Array.isArray(data) ? data : []);
      },
      20000,
    )
      .then((items) => {
        setProducts(items);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWithCache(
      'common:categories',
      async () => {
        const res: any = await api.get('/categories');
        const data = res?.data !== undefined ? res.data : res;
        return Array.isArray(data) ? data : [];
      },
      60000,
    )
      .then((cats) => setCategories(cats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedType, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-sky-100 text-xs font-bold border border-white/20">
              <Store className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সেফনেক্সবিডি শপ (SHOP)' : 'SafnexBD Shop'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {lang === 'bn' ? 'সকল পণ্য ও সার্ভিস শপ' : 'Official Marketplace & Shop'}
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              {lang === 'bn'
                ? 'সেরা ডিল খুঁজুন, ১০০% সুরক্ষিত এসক্রো হোল্ডে কিনুন। বিড করা শীর্ষ পণ্যগুলো সবসময় সবার আগে প্রদর্শিত হয়।'
                : 'Browse verified products with 100% escrow protection. Boosted bid products are displayed at top positions.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/products/new"
              className="px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'প্রোডাক্ট আপলোড করুন' : 'Sell a Product'}</span>
            </Link>
            <Link
              href="/dashboard/bids"
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{lang === 'bn' ? 'পজিশন বিড দিন' : 'Boost / Bid Now'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Bubbles / Quick Filters (Mobile & Tablet Horizontal Scroll) */}
      {categories.length > 0 && (
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
              selectedCategory === ''
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-sky-500'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                selectedCategory === c.slug
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-sky-500'
              }`}
            >
              <span>{c.name}</span>
              {c._count?.products > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === c.slug ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {c._count.products}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Filters Sidebar */}
        <div className={`space-y-4 sm:space-y-6 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          {/* Search box (desktop) */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'bn' ? 'শপ প্রোডাক্ট খুঁজুন...' : 'Search shop products...'}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </form>

          {/* Desktop Vertical Categories Sidebar */}
          {categories.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{lang === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Categories'}</span>
                </h3>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('')}
                    className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'রিসেট' : 'Reset'}
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs max-h-[360px] overflow-y-auto pr-1">
                {/* All Categories Button */}
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-between ${
                    selectedCategory === ''
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800/80 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedCategory === '' ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span>{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</span>
                  </div>
                </button>

                {/* Individual Categories */}
                {categories.map((c) => {
                  const isSelected = selectedCategory === c.slug;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800/80 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {c._count?.products !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-semibold ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {c._count.products}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Type Filter */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {lang === 'bn' ? 'প্রোডাক্ট টাইপ' : 'Product Type'}
            </h3>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => { setSelectedType(''); setMobileFiltersOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                  selectedType === '' ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{lang === 'bn' ? 'সকল প্রোডাক্ট' : 'All Products'}</span>
              </button>
              <button
                onClick={() => { setSelectedType('DIGITAL_DOWNLOAD'); setMobileFiltersOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  selectedType === 'DIGITAL_DOWNLOAD' ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ডিজিটাল প্রোডাক্ট' : 'Digital Downloads'}</span>
              </button>
              <button
                onClick={() => { setSelectedType('PHYSICAL'); setMobileFiltersOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  selectedType === 'PHYSICAL' ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফিজিক্যাল পণ্য' : 'Physical Products'}</span>
              </button>
            </div>
          </div>

          {/* Quick Boost CTA for Sellers */}
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'bn' ? 'আপনার প্রোডাক্ট শীর্ষে আনুন' : 'Boost Your Product to Top'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'বিড করে আপনার প্রোডাক্টকে শপ ও হোম পেজের এক নম্বর পজিশনে রাখুন এবং দ্বিগুণ বিক্রি বাড়ান।'
                : 'Bid for top positions to keep your products in the spotlight and maximize sales.'}
            </p>
            <Link
              href="/dashboard/bids"
              className="inline-block w-full text-center py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
            >
              {lang === 'bn' ? 'পজিশন বিড দিন ➔' : 'Place a Bid ➔'}
            </Link>
          </div>
        </div>

        {/* Products Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Sort & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? `মোট ${products.length} টি প্রোডাক্ট` : `${products.length} products found`}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                {lang === 'bn' ? 'শীর্ষে বিডকৃত পণ্য' : 'Bids Ranked Top'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 hidden xs:inline">{lang === 'bn' ? 'সর্ট করুন:' : 'Sort by:'}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-medium"
              >
                <option value="newest">{lang === 'bn' ? 'নতুন আপলোড আগে' : 'Newest'}</option>
                <option value="oldest">{lang === 'bn' ? 'আগের আপলোড আগে' : 'Oldest'}</option>
                <option value="price_asc">{lang === 'bn' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}</option>
                <option value="price_desc">{lang === 'bn' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Store className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
                {lang === 'bn' ? 'কোনো প্রোডাক্ট পাওয়া যায়নি' : 'No products found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {products.map((p) => {
                const mainImg = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
                const hasActiveBid = Boolean(p.activeBid);

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition flex flex-col justify-between group overflow-hidden shadow-xs hover:shadow-md ${
                      hasActiveBid
                        ? 'border-amber-400/80 dark:border-amber-500/60 ring-1 ring-amber-400/30'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
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

                        {/* Bid Badge or Regular Type Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          {hasActiveBid ? (
                            <BidBadge position={p.activeBid.targetPosition} expiresAt={p.activeBid.expiresAt} />
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900/80 text-white backdrop-blur">
                              {p.productType === 'DIGITAL_DOWNLOAD' ? 'DIGITAL' : 'PHYSICAL'}
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="p-3 sm:p-4 space-y-2">
                        <Link
                          href={`/users/${p.seller?.uniqueUserId || p.seller?.id}`}
                          className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition cursor-pointer group"
                          title={lang === 'bn' ? 'সেলার প্রোফাইল দেখুন' : 'View Seller Profile'}
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-600 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center flex-shrink-0 group-hover:ring-1 group-hover:ring-sky-500 transition">
                            {p.seller?.firstName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-[10px] sm:text-xs text-slate-500 group-hover:text-sky-600 font-mono truncate transition">
                            @{p.seller?.uniqueUserId || 'Seller'}
                          </span>
                        </Link>

                        <Link href={`/products/${p.slug}`}>
                          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 transition leading-snug">
                            {p.title}
                          </h2>
                        </Link>

                        <div className="text-sm sm:text-base font-extrabold text-sky-600 dark:text-sky-400">
                          {(p as any).pricingType === 'NEGOTIABLE' ? 'আলোচনাসাপেক্ষ' : `৳ ${Number(p.price).toLocaleString()}`}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 pt-0">
                      <Link
                        href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
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
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}

