'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cpu, MessageSquare, Plus, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

function BidBadge({ position }: { position: number; expiresAt?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
      #{position}
    </span>
  );
}

export default function PhysicalProductsPage() {
  const { lang, t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?productType=PHYSICAL&scope=PHYSICAL_PRODUCTS&limit=30')
      .then((res: any) => setProducts(res.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Cpu className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ফিজিক্যাল গ্যাজেট' : 'Physical Gadgets'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'ফিজিক্যাল ও ইলেকট্রনিক গ্যাজেটস' : 'Physical & Electronics Goods'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn' ? 'পণ্য হাতে পেয়ে টাকা রিলিজ করুন। ১০০% ক্যাশ-অন-এসক্রো সুরক্ষা।' : 'Safe delivery with escrow locked funds until product inspection'}
          </p>
        </div>

        <div>
          <Link
            href="/dashboard/products/new?destination=physical_products"
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ফিজিক্যাল পণ্য আপলোড' : 'Upload Physical Item'}</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          {[1, 2, 3].map((n) => <div key={n} className="h-56 sm:h-64 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No physical products found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {products.map((p) => {
            const mainImg = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80';
            const hasActiveBid = Boolean(p.activeBid);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs sm:shadow-sm flex flex-col justify-between ${
                  hasActiveBid
                    ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-amber-500/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <Link href={`/products/${p.slug}`} className="block relative overflow-hidden group">
                    <img src={getImageUrl(mainImg)} alt={p.title} className="w-full aspect-video object-cover group-hover:scale-105 transition duration-300" />
                    {hasActiveBid && (
                      <div className="absolute top-2 left-2 z-10">
                        <BidBadge position={p.activeBid.targetPosition} expiresAt={p.activeBid.expiresAt} />
                      </div>
                    )}
                  </Link>
                  <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-2">
                    <Link
                      href={`/users/${p.seller?.uniqueUserId || p.seller?.id}`}
                      className="inline-block text-[9px] sm:text-[10px] font-mono text-slate-400 hover:text-sky-600 hover:underline transition"
                      title={lang === 'bn' ? 'সেলার প্রোফাইল দেখুন' : 'View Seller Profile'}
                    >
                      ID: {p.seller?.uniqueUserId}
                    </Link>
                    <Link href={`/products/${p.slug}`}>
                      <h2 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 transition leading-snug">{p.title}</h2>
                    </Link>
                    <div className="text-xs sm:text-sm font-extrabold text-sky-600 dark:text-sky-400">
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

