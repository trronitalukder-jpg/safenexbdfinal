'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { getYouTubeThumbnailUrl } from '@/lib/youtubeUtils';
import { useLanguage } from '@/context/LanguageContext';
import {
  BookOpen,
  Video,
  FileText,
  Search,
  Eye,
  Calendar,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface GuideItem {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  youtubeUrl?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  viewsCount: number;
  createdAt: string;
}

export default function PublicGuidesPage() {
  const { lang } = useLanguage();
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'article'>('all');

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const res: any = await api.get('/guides');
        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : res?.data?.data || [];
        setGuides(data);
      } catch (err) {
        console.error('Failed to load public guides:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  // Helper to strip HTML tags for card snippet
  const stripHtml = (html?: string | null) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  const filteredGuides = guides.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(g.description).toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'video') return matchesSearch && Boolean(g.youtubeUrl);
    if (activeFilter === 'article') return matchesSearch && !g.youtubeUrl;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn' ? 'অফিসিয়াল নির্দেশিকা ও সহায়তা কেন্দ্র' : 'Official Instruction & Tutorials'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight">
            {lang === 'bn'
              ? 'সেফনেক্সবিডি নির্দেশিকা ও ভিডিও টিউটোরিয়াল'
              : 'SafnexBD Guides & Video Tutorials'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'কিভাবে নিরাপদে প্রোডাক্ট কিনবেন, বিক্রি করবেন, এসক্রো সুরক্ষা ব্যবহার করবেন এবং ডিপোজিট/উইথড্র করবেন তার বিস্তারিত ভিডিও ও লেখা নির্দেশিকা।'
              : 'Learn how to buy, sell, trade, and use 100% verified escrow protection with step-by-step videos and detailed instructions.'}
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'টিউটোরিয়াল বা নির্দেশিকা খুঁজুন...'
                    : 'Search guides, instructions, or videos...'
                }
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm shadow-md shadow-slate-200/50 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'all'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সব নির্দেশিকা' : 'All Guides'} ({guides.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('video')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'video'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-rose-500" />
              <span>
                {lang === 'bn' ? 'ভিডিও টিউটোরিয়াল' : 'Video Tutorials'} (
                {guides.filter((g) => Boolean(g.youtubeUrl)).length})
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('article')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'article'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {lang === 'bn' ? 'লেখা নির্দেশিকা' : 'Articles & Text'} (
                {guides.filter((g) => !g.youtubeUrl).length})
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-slate-200 dark:bg-slate-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'কোনো নির্দেশিকা পাওয়া যায়নি' : 'No Guides Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'bn'
                ? 'আপনার সার্চ অনুযায়ী কোনো নির্দেশিকা মেলেনি। অন্যান্য কিওয়ার্ড দিয়ে সার্চ করুন।'
                : 'No instructions matched your search query. Try searching with different keywords.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => {
              const hasVideo = Boolean(guide.youtubeUrl);
              const ytThumb = getYouTubeThumbnailUrl(guide.youtubeUrl);
              const thumbUrl = guide.coverImage
                ? getImageUrl(guide.coverImage)
                : ytThumb || '/images/hero-escrow.png';
              const cleanExcerpt = stripHtml(guide.description);

              return (
                <Link
                  key={guide.id}
                  href={`/guides/${guide.slug}`}
                  className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-xl hover:border-sky-400 dark:hover:border-sky-500/50 transition-all duration-200 flex flex-col"
                >
                  {/* Media Banner */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl}
                      alt={guide.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Overlay badge */}
                    <div className="absolute top-3 left-3">
                      {hasVideo ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[11px] font-bold shadow-md backdrop-blur-xs">
                          <Video className="w-3 h-3" />
                          <span>Video</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600/90 text-white text-[11px] font-bold shadow-md backdrop-blur-xs">
                          <FileText className="w-3 h-3" />
                          <span>Guide</span>
                        </span>
                      )}
                    </div>

                    {/* Center play icon for videos */}
                    {hasVideo && (
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center transition">
                        <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <div className="w-0 h-0 border-y-6 border-y-transparent border-l-10 border-l-white ml-1" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition line-clamp-2">
                        {guide.title}
                      </h3>

                      {cleanExcerpt && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {cleanExcerpt}
                        </p>
                      )}
                    </div>

                    {/* Metadata footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {guide.viewsCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(guide.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>{hasVideo ? 'Watch' : 'Read'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Safety Escrow Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>100% Guaranteed Escrow</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {lang === 'bn'
                ? 'লেনদেন করার পূর্বে কোনো প্রশ্ন বা সন্দেহ আছে?'
                : 'Need more assistance or have questions?'}
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
              {lang === 'bn'
                ? 'আমাদের ২৪/৭ সাপোর্ট টিম এবং অ্যাডমিনরা যে কোনো সময় সহায়তার জন্য প্রস্তুত।'
                : 'Our 24/7 helpline and admin support are available to guide you through any deal.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/chat"
              className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-sky-50 shadow-md transition"
            >
              {lang === 'bn' ? 'লাইভ সাপোর্ট চ্যাট' : 'Live Support Chat'}
            </Link>
            <Link
              href="/contact-us"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
            >
              {lang === 'bn' ? 'যোগাযোগ করুন' : 'Contact Helpdesk'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

