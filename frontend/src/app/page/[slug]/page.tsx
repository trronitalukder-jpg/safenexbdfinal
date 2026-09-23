'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  FileText,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Package,
  Plus,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/context/LanguageContext';
import DOMPurify from 'dompurify';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function PublicCustomPage() {
  const params = useParams();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const rawSlug = params?.slug;
  const slug = (Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug as string)) || '';

  const [page, setPage] = useState<any>(null);
  const [menuItem, setMenuItem] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;

    // Ignore file assets and internal paths
    if (
      slug.includes('.') ||
      ['api', '_next', 'static', 'favicon.ico', 'manifest.json', 'robots.txt'].includes(slug.toLowerCase())
    ) {
      setLoading(false);
      setError('Page not found');
      return;
    }

    setLoading(true);
    setError(null);

    const formattedRoute = `/${slug}`;

    Promise.allSettled([
      // 1. Fetch CMS Page info if defined
      api.get(`/cms/pages/${slug}`),
      // 2. Fetch Header Navigation menus
      api.get('/cms/menus/HEADER'),
      // 3. Fetch products assigned to this custom route
      api.get(`/products?canonicalUrl=${encodeURIComponent(formattedRoute)}&limit=50`),
    ])
      .then(([cmsRes, menuRes, productsRes]) => {
        let pageData: any = null;
        let menuData: any = null;
        let productItems: any[] = [];

        // Check CMS Page
        if (cmsRes.status === 'fulfilled') {
          const cmsVal = unwrap(cmsRes.value);
          if (cmsVal && (cmsVal.title || cmsVal.contentHtml)) {
            pageData = cmsVal;
          }
        }

        // Check Menu Items
        if (menuRes.status === 'fulfilled') {
          const mVal = unwrap(menuRes.value);
          const items: any[] = mVal?.items || (Array.isArray(mVal) ? mVal : []);
          const matched = items.find(
            (it) =>
              it.url === formattedRoute ||
              it.url === `/page/${slug}` ||
              it.url?.replace(/^\//, '') === slug
          );
          if (matched) {
            menuData = matched;
          }
        }

        // Check Products
        if (productsRes.status === 'fulfilled') {
          const pVal: any = productsRes.value;
          const list = pVal?.items || pVal?.data?.items || (Array.isArray(pVal) ? pVal : []);
          productItems = list;
        }

        // If either CMS page exists, navbar item exists, or products exist, this is a valid page!
        if (pageData || menuData || productItems.length > 0) {
          setPage(pageData);
          setMenuItem(menuData);
          setProducts(productItems);
          setError(null);
        } else {
          setError(lang === 'bn' ? 'পেজটি পাওয়া যায়নি (404)' : 'Page not found');
        }
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load page');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, lang]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-medium">
          {lang === 'bn' ? 'পেজ ও প্রোডাক্ট লোড হচ্ছে...' : 'Loading page & products...'}
        </p>
      </div>
    );
  }

  if (error && !page && !menuItem && products.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {lang === 'bn' ? 'পেজটি পাওয়া যায়নি (404)' : 'Page Not Found (404)'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {error || 'This page does not exist or has been unpublished by admin.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-sky-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'bn' ? 'হোম পেজে ফিরে যান' : 'Back to Home'}</span>
        </Link>
      </div>
    );
  }

  const pageTitle =
    page?.title || menuItem?.title || slug.charAt(0).toUpperCase() + slug.slice(1);
  const targetRoute = `/${slug}`;

  return (
    <main className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-sky-600 dark:hover:text-sky-400 transition font-medium">
          {lang === 'bn' ? 'হোম' : 'Home'}
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-semibold">{pageTitle}</span>
      </div>

      {/* Page Header Banner */}
      <div className="bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent dark:from-sky-950/40 dark:via-indigo-950/20 border border-sky-500/20 dark:border-sky-800/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'অফিসিয়াল কালেকশন পেজ' : 'Official Showcase Page'}</span>
            <span className="font-mono text-xs opacity-80">{targetRoute}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
            {lang === 'bn'
              ? `${pageTitle} পেজের পণ্যসমূহ ১০০% নিরাপদ এসক্রো পেমেন্ট ও ভেরিফাইড ডেলিভারি সিস্টেমে নিশ্চিত করা হয়।`
              : `Explore verified products in ${pageTitle}. Protected by SafnexBD Escrow safe payment.`}
          </p>
          {page?.updatedAt && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn' ? 'আপডেট:' : 'Updated:'} {new Date(page.updatedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <Link
            href={`/dashboard/products/new?targetRoute=${encodeURIComponent(targetRoute)}`}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>
              {lang === 'bn' ? 'এই পেজে পণ্য যোগ করুন' : 'Upload Product to this Page'}
            </span>
          </Link>
        </div>
      </div>

      {/* CMS Content Box (Only rendered if substantial content/article is provided) */}
      {page?.contentHtml && page.contentHtml.trim().length > 15 && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div
            className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{
              __html: typeof window !== 'undefined' ? DOMPurify.sanitize(page.contentHtml || '') : (page.contentHtml || ''),
            }}
          />
        </div>
      )}

      {/* PRODUCTS SHOWCASE SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sky-500" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'পণ্যসমূহ' : 'Products Collection'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold">
              {products.length}
            </span>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>{lang === 'bn' ? 'সকল প্রোডাক্ট দেখুন' : 'View All Marketplace'}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {products.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-slate-900/60 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center shadow-sm">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {lang === 'bn'
                  ? 'এই পেজে এখনও কোনো পণ্য যোগ করা হয়নি'
                  : 'No products added to this page yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? `আপনি প্রোডাক্ট আপলোড করার সময় টার্গেট পেজ হিসেবে "${pageTitle}" বা "${targetRoute}" নির্বাচন করলে তা সরাসরি এই পেজে প্রদর্শিত হবে।`
                  : `Assign "${targetRoute}" as the destination when uploading products to have them display here.`}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href={`/dashboard/products/new?targetRoute=${encodeURIComponent(targetRoute)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {lang === 'bn' ? 'এই পেজে প্রথম পণ্য আপলোড করুন' : 'Upload First Product Here'}
                </span>
              </Link>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const mainImg =
                p.images?.[0]?.imageUrl ||
                'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80';
              return (
                <div
                  key={p.id}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-sky-500/50"
                >
                  <div>
                    {/* Image Container */}
                    <Link
                      href={`/products/${p.slug}`}
                      className="block relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
                    >
                      <img
                        src={getImageUrl(mainImg)}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold font-mono">
                        <Tag className="w-3 h-3 text-sky-400" />
                        <span>ID: {p.seller?.uniqueUserId || 'SELLER'}</span>
                      </div>
                      {p.status === 'ACTIVE' && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[9px] font-bold shadow">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <Link href={`/products/${p.slug}`}>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 dark:hover:text-sky-400 transition leading-snug">
                          {p.title}
                        </h3>
                      </Link>
                      <div className="text-base font-black text-sky-600 dark:text-sky-400">
                        {(p as any).pricingType === 'NEGOTIABLE' ? 'আলোচনাসাপেক্ষ' : `৳ ${Number(p.price).toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/chat?targetUserId=${p.seller?.id}`}
                        className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t('chat')}</span>
                      </Link>
                      <Link
                        href={`/products/${p.slug}`}
                        className="py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-600 hover:text-white text-sky-700 dark:text-sky-300 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                      >
                        <span>{lang === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 rounded-3xl bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold">
            {lang === 'bn'
              ? 'SafnexBD এসক্রো সুরক্ষিত লেনদেন প্ল্যাটফর্ম • পণ্য পেয়ে সন্তুষ্ট হলে তবেই টাকা রিলিজ'
              : 'SafnexBD Escrow Protected Platform • Funds released only after buyer satisfaction'}
          </span>
        </div>
        <button
          onClick={() => router.back()}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-1.5 transition text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'পূর্বের পেজে যান' : 'Go Back'}</span>
        </button>
      </div>
    </main>
  );
}
