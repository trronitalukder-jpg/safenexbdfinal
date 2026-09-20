'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DownloadCloud, MessageSquare, Plus, Zap, Download, Sparkles, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

function BidBadge({ position }: { position: number; expiresAt?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
      #{position}
    </span>
  );
}

export default function DigitalProductsPage() {
  const { lang, t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'account' | 'downloadable'>('all');

  useEffect(() => {
    api.get('/products?productType=DIGITAL_DOWNLOAD&scope=DIGITAL_PRODUCTS&limit=30')
      .then((res: any) => {
        const data = unwrap(res);
        setProducts(data?.items || []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    if (filterTab === 'all') return true;
    const isDownloadable =
      p.canonicalUrl?.includes('downloadable') ||
      (p.files && p.files.length > 0 && !p.files[0]?.fileUrl?.includes('chat'));

    if (filterTab === 'downloadable') return isDownloadable;
    if (filterTab === 'account') return !isDownloadable;
    return true;
  });

  return (
    <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 text-xs font-bold">
            <DownloadCloud className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ডিজিটাল এসেটস' : 'Digital Assets'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'ডিজিটাল ও ডাউনলোডযোগ্য প্রোডাক্টস' : 'Digital & Downloadable Products'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'সফটওয়্যার, স্ক্রিপ্ট, ইবুক এবং ডিজিটাল অ্যাকাউন্ট নিরাপদ এসক্রো চ্যাটে কিনুন'
              : 'Scripts, templates, ebooks, gaming accounts and software with secure delivery'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/products/new?destination=digital_product"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ডিজিটাল প্রোডাক্ট আপলোড' : 'Upload Digital Product'}</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterTab === 'all'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'সকল ডিজিটাল প্রোডাক্ট' : 'All Digital Products'}</span>
          <span className="text-[10px] opacity-80 font-mono">({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('account')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterTab === 'account'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? '⚡ অ্যাকাউন্ট ও সার্ভিস' : '⚡ Accounts & Services'}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('downloadable')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            filterTab === 'downloadable'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? '💾 ডাউনলোডযোগ্য রিসোর্স' : '💾 Downloadable Files'}</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-56 sm:h-64 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <DownloadCloud className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'কোনো ডিজিটাল প্রোডাক্ট পাওয়া যায়নি' : 'No digital products found in this category'}
          </p>
          <Link
            href="/dashboard/products/new?destination=digital_product"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((p) => {
            const mainImg =
              p.images?.[0]?.imageUrl ||
              'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
            const isDownloadable =
              p.canonicalUrl?.includes('downloadable') ||
              (p.files && p.files.length > 0 && !p.files[0]?.fileUrl?.includes('chat'));
            const hasActiveBid = Boolean(p.activeBid);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs sm:shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                  hasActiveBid
                    ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-amber-500/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <Link href={`/products/${p.slug}`} className="block relative cursor-pointer group">
                    <img src={getImageUrl(mainImg)} alt={p.title} className="w-full aspect-video object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10 flex flex-col gap-1">
                      {hasActiveBid ? (
                        <BidBadge position={p.activeBid.targetPosition} expiresAt={p.activeBid.expiresAt} />
                      ) : (
                        <span
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold ${
                            isDownloadable
                              ? 'bg-teal-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isDownloadable ? '💾 Downloadable' : '⚡ Account'}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-2">
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">ID: {p.seller?.uniqueUserId}</span>
                    <Link href={`/products/${p.slug}`}>
                      <h2 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 transition leading-snug">
                        {p.title}
                      </h2>
                    </Link>
                    <div className="text-xs sm:text-sm font-extrabold text-sky-600 dark:text-sky-400">৳ {Number(p.price).toLocaleString()}</div>
                  </div>
                </div>
                <div className="p-2.5 sm:p-4 pt-0">
                  <Link
                    href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                    className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition"
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
  );
}
