'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/youtubeUtils';
import { useLanguage } from '@/context/LanguageContext';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Share2,
  Check,
  Video,
  FileText,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface GuideItem {
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
  updatedAt?: string;
}

interface GuideDetailClientProps {
  slug: string;
  initialGuide?: GuideItem | null;
  initialOthers?: GuideItem[];
}

export default function GuideDetailClient({
  slug,
  initialGuide = null,
  initialOthers = [],
}: GuideDetailClientProps) {
  const { lang } = useLanguage();
  const [guide, setGuide] = useState<GuideItem | null>(initialGuide);
  const [otherGuides, setOtherGuides] = useState<GuideItem[]>(initialOthers);
  const [loading, setLoading] = useState(!initialGuide);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // If we already have the initialGuide matching this slug, only refresh others if needed
    if (initialGuide && initialGuide.slug === slug) {
      setGuide(initialGuide);
      setLoading(false);
      if (initialOthers && initialOthers.length > 0) {
        setOtherGuides(initialOthers);
        return;
      }
    }

    const loadGuideAndRelated = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const res: any = await api.get(`/guides/${slug}`);
        const data = res?.id ? res : res?.data?.data || res?.data || res;
        if (data && data.id) {
          setGuide(data);
        } else {
          setNotFound(true);
        }

        // Fetch other guides for the sidebar
        const listRes: any = await api.get('/guides');
        const listData = Array.isArray(listRes)
          ? listRes
          : Array.isArray(listRes?.data)
          ? listRes.data
          : listRes?.data?.data || [];
        setOtherGuides(listData.filter((g: GuideItem) => g.slug !== slug).slice(0, 4));
      } catch (err: any) {
        console.error('Failed to load guide details:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadGuideAndRelated();
    }
  }, [slug, initialGuide, initialOthers]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const embedUrl = guide?.youtubeUrl ? getYouTubeEmbedUrl(guide.youtubeUrl) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="aspect-video w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="space-y-3 pt-6">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !guide) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-24 px-4 text-center">
        <div className="max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'নির্দেশিকাটি পাওয়া যায়নি' : 'Guide Not Found'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'bn'
              ? 'এই নির্দেশিকাটি সরানো হয়েছে অথবা লিংকটি সঠিক নয়।'
              : 'The tutorial or guide you are looking for has been moved or does not exist.'}
          </p>
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:bg-sky-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'সকল নির্দেশিকায় ফিরুন' : 'Back to All Guides'}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-sky-500 transition">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/guides" className="hover:text-sky-500 transition">
              Guides
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
              {guide.title}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              title="Share Guide Link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            <Link
              href="/guides"
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Guides</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article & Video Column */}
          <main className="lg:col-span-8 space-y-6">
            {/* Guide Header Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {guide.youtubeUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold">
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Tutorial</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900 text-xs font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Instruction Guide</span>
                  </span>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(guide.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {guide.viewsCount} views
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {guide.title}
              </h1>
            </div>

            {/* Embedded YouTube Player (if video url present) */}
            {embedUrl && (
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 aspect-video bg-black">
                <iframe
                  src={embedUrl}
                  title={guide.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {/* Cover Image (if present and no video, or as a complement banner) */}
            {guide.coverImage && !embedUrl && (
              <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 aspect-video bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(guide.coverImage)}
                  alt={guide.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Guide Content Description */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 shadow-xs">
              {guide.description ? (
                <article
                  className="prose prose-slate dark:prose-invert max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
                    prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-4
                    prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-4
                    prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base
                    prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:text-sm sm:prose-li:text-base
                    prose-strong:font-bold prose-strong:text-slate-900 dark:prose-strong:text-white
                    prose-blockquote:border-l-sky-500 prose-blockquote:bg-sky-50/50 dark:prose-blockquote:bg-sky-950/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl
                    prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sky-600 dark:prose-code:text-sky-400
                    prose-img:rounded-2xl prose-img:shadow-md"
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof window !== 'undefined'
                        ? DOMPurify.sanitize(guide.description || '')
                        : guide.description || '',
                  }}
                />
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {lang === 'bn'
                    ? 'এই ভিডিও টিউটোরিয়ালের সাথে কোনো অতিরিক্ত বর্ণনা সংযুক্ত করা হয়নি।'
                    : 'No additional written description provided for this tutorial.'}
                </div>
              )}
            </div>
          </main>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Safety Notice Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-4 border border-slate-700">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">100% Escrow Protection</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Never complete deals outside SafnexBD. Escrow holds your payment safely until you
                  receive and verify your order.
                </p>
              </div>
              <Link
                href="/escrow-rules"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
              >
                <span>Read Escrow Rules</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Other Guides Section */}
            {otherGuides.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-500" />
                  <span>Other Recommended Tutorials</span>
                </h3>

                <div className="space-y-3">
                  {otherGuides.map((item) => {
                    const ytThumb = getYouTubeThumbnailUrl(item.youtubeUrl);
                    const itemThumb = item.coverImage
                      ? getImageUrl(item.coverImage)
                      : ytThumb || '/icon-192.png';

                    return (
                      <Link
                        key={item.id}
                        href={`/guides/${item.slug}`}
                        className="group flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
                      >
                        <div className="w-16 h-12 rounded-xl bg-slate-950 overflow-hidden shrink-0 relative border border-slate-200 dark:border-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={itemThumb}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {item.youtubeUrl && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Video className="w-3 h-3 text-rose-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-500 transition line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Eye className="w-3 h-3" />
                            {item.viewsCount || 0} views
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Need Direct Help CTA */}
            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-3xl p-6 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-sky-500 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Still have questions?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Our live support agents are active 24/7 to help resolve disputes or answer queries.
                </p>
              </div>
              <Link
                href="/dashboard/chat"
                className="inline-block w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition"
              >
                Chat with Support Agent
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

