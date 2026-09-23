'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Coins, ShieldCheck, ArrowRight, MessageSquare, AlertCircle, Plus, Sparkles, UserCheck, Clock } from 'lucide-react';
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

export default function MoneyExchangePage() {
  const { lang, t } = useLanguage();
  const [exchangeProducts, setExchangeProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default P2P benchmark rates
  const benchmarkPairs = [
    { from: 'USD (Payoneer / Wise)', to: 'BDT (bKash / Bank)', rate: '1 USD = 124.50 BDT', fee: '2.0% Escrow Fee' },
    { from: 'BDT (bKash / Nagad)', to: 'USD (Wise / Bank)', rate: '127.00 BDT = 1 USD', fee: '2.0% Escrow Fee' },
    { from: 'EUR (SEPA Transfer)', to: 'BDT (Local Bank)', rate: '1 EUR = 135.00 BDT', fee: '2.0% Escrow Fee' },
    { from: 'USDT (TRC20)', to: 'BDT (bKash / Bank)', rate: '1 USDT = 125.00 BDT', fee: '1.5% Escrow Fee' },
  ];

  useEffect(() => {
    api.get('/products?canonicalUrl=/money-exchange&scope=MONEY_EXCHANGE&limit=30')
      .then((res: any) => {
        const data = unwrap(res);
        setExchangeProducts(data?.items || []);
      })
      .catch(() => setExchangeProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-xs font-bold">
            <Coins className="w-4 h-4" />
            <span>{lang === 'bn' ? 'পিয়ার-টু-পিয়ার কারেন্সি এক্সচেঞ্জ' : 'P2P Currency Escrow'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'মানি এক্সচেঞ্জ ও এসক্রো ট্রানজ্যাকশন' : 'Money Exchange & Escrow Deals'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'টাকা বা ডলার পাঠানোর আগে এসক্রো হোল্ডে রাখুন। কোনো তৃতীয় পক্ষের ঝুঁকি ছাড়া নিরাপদে লেনদেন করুন।'
              : 'Funds remain locked in SafnexBD escrow hold until payment verification is confirmed.'}
          </p>
        </div>

        <div>
          <Link
            href="/dashboard/products/new?destination=money_exchange"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'এক্সচেঞ্জ অফার পোস্ট করুন' : 'Post Exchange Offer'}</span>
          </Link>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          {lang === 'bn'
            ? 'সতর্কবার্তা: মানি এক্সচেঞ্জের ক্ষেত্রে কেবল প্ল্যাটফর্মের চ্যাট এবং অফিসিয়াল এসক্রো হোল্ড ব্যবহার করুন। বাইরে লেনদেন করলে প্ল্যাটফর্ম দায়ী থাকবে না।'
            : 'Notice: Always conduct peer exchanges within SafnexBD Escrow hold. Never transact outside the platform.'}
        </p>
      </div>

      {/* USER UPLOADED LIVE MONEY EXCHANGE OFFERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সক্রিয় মানি এক্সচেঞ্জ অফার ও লিস্টিং' : 'Active Peer Exchange Listings'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {exchangeProducts.length} {lang === 'bn' ? 'টি অফার পাওয়া গেছে' : 'offers available'}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : exchangeProducts.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Coins className="w-10 h-10 text-amber-500/60 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {lang === 'bn' ? 'বর্তমানে কোনো কাস্টম এক্সচেঞ্জ অফার নেই' : 'No user exchange listings yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {lang === 'bn'
                  ? 'আপনি কি ডলার, পেওনিয়ার, ক্রিপ্টো বা লোকাল কারেন্সি এক্সচেঞ্জ অফার লিস্টিং করতে চান? এখনই অফার পোস্ট করুন।'
                  : 'Be the first to list a verified P2P currency or cryptocurrency escrow exchange deal.'}
              </p>
            </div>
            <Link
              href="/dashboard/products/new?destination=money_exchange"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'প্রথম অফার দিন' : 'Create First Offer'}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exchangeProducts.map((p) => {
              const mainImg = p.images?.[0]?.imageUrl;
              const hasActiveBid = Boolean(p.activeBid);

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                    hasActiveBid
                      ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/60">
                          P2P ESCROW DEAL
                        </span>
                        {p.seller && (
                          <Link
                            href={`/users/${p.seller.uniqueUserId || p.seller.id}`}
                            className="text-[10px] font-mono text-slate-400 hover:text-sky-600 hover:underline flex items-center gap-1 transition"
                            title={lang === 'bn' ? 'সেলার প্রোফাইল দেখুন' : 'View Seller Profile'}
                          >
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                            <span>{p.seller.uniqueUserId}</span>
                          </Link>
                        )}
                      </div>

                      {hasActiveBid && (
                        <BidBadge position={p.activeBid.targetPosition} expiresAt={p.activeBid.expiresAt} />
                      )}
                    </div>

                    {mainImg && (
                      <Link
                        href={`/products/${p.slug}`}
                        className="block relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group"
                      >
                        <img
                          src={getImageUrl(mainImg)}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </Link>
                    )}

                    <div>
                      <Link href={`/products/${p.slug}`}>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white hover:text-amber-600 transition line-clamp-2">
                          {p.title}
                        </h3>
                      </Link>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {p.descriptionHtml ? p.descriptionHtml.replace(/<[^>]*>?/gm, '') : ''}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                      {(p as any).pricingType === 'NEGOTIABLE' ? (
                        <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                          {lang === 'bn' ? 'আলোচনাসাপেক্ষ' : 'Negotiable'}
                        </span>
                      ) : (
                        <>
                          <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                            ৳ {Number(p.price).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {lang === 'bn' ? '(এসক্রো রেট/মূল্য)' : '(Escrow Rate/Amount)'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Link
                      href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সেলারকে চ্যাট করুন' : 'Chat & Deal'}</span>
                    </Link>
                    <Link
                      href={`/products/${p.slug}`}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
                    >
                      <span>{lang === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BENCHMARK / PLATFORM P2P PAIRS */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {lang === 'bn' ? 'প্ল্যাটফর্ম রেফারেন্স রেট ও ডিল' : 'Platform Reference Exchange Rates'}
          </h2>
          <span className="text-xs text-slate-400 font-mono">Realtime Escrow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {benchmarkPairs.map((p, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1 rounded-lg">
                  BENCHMARK
                </span>
                <span className="text-xs text-slate-400">{p.fee}</span>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{p.from} ➔ {p.to}</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">{p.rate}</div>
              </div>

              <div className="pt-2">
                <Link
                  href="/transactions"
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <span>{lang === 'bn' ? 'এসক্রো ডিল শুরু করুন' : 'Start Escrow Deal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
