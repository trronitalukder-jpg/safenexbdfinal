'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Package,
  ArrowLeft,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Phone,
  Mail,
  Share2,
  Sparkles,
  Lock,
  Star,
  X,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Award,
  TrendingUp,
  UserCheck,
  ThumbsUp,
  Clock,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import VerifiedBadge from '@/components/common/VerifiedBadge';

export default function UserPublicProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;
  const { lang, t } = useLanguage();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'reviews'>('overview');

  // Copy states
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Rating Modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState('');

  const fetchProfile = () => {
    if (!userId) return;
    setLoading(true);
    api.get(`/users/profile/${userId}`)
      .then((res: any) => setProfile(res))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleCopyId = () => {
    if (!profile?.uniqueUserId) return;
    navigator.clipboard.writeText(profile.uniqueUserId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareProfile = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmittingRating(true);
    setRatingError('');
    setRatingSuccess('');

    try {
      await api.post(`/users/${profile.id}/reviews`, {
        rating: ratingValue,
        comment: ratingComment.trim() || undefined,
      });
      setRatingSuccess(lang === 'bn' ? 'রেটিং সফলভাবে সম্পন্ন হয়েছে!' : 'Review submitted successfully!');
      setTimeout(() => {
        setShowRatingModal(false);
        setRatingSuccess('');
        fetchProfile();
      }, 1200);
    } catch (err: any) {
      setRatingError(err.response?.data?.message || err.message || (lang === 'bn' ? 'রেটিং দিতে ব্যর্থ হয়েছে' : 'Failed to submit review'));
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {lang === 'bn' ? 'প্রোফাইল লোড হচ্ছে...' : 'Loading profile...'}
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {lang === 'bn' ? 'ব্যবহারকারী পাওয়া যায়নি' : 'User Not Found'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {lang === 'bn'
            ? 'এই ইউজার অ্যাকাউন্টটি নিষ্ক্রিয় অথবা মুছে ফেলা হয়েছে।'
            : 'This user account is either inactive or does not exist.'}
        </p>
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'bn' ? 'ইউজার তালিকায় ফিরে যান' : 'Back to Users'}</span>
        </Link>
      </div>
    );
  }

  const isPrivate = profile.profileVisibility === 'PRIVATE';

  // Construct location string
  const locationParts = [profile.city, profile.district, profile.division, profile.country].filter(Boolean);
  const locationText = locationParts.join(', ');

  // Parse skills, interests, languages
  const skillsList = profile.skills ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const interestsList = profile.interests ? profile.interests.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const languagesList = profile.languages ? profile.languages.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const socialLinks = profile.socialLinks || {};

  // Calculate rating distribution
  const reviews = profile.reviews || profile.receivedReviews || [];
  const totalReviewsCount = reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r: any) => Math.round(r.rating) === star).length;
    const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
    return { star, count, percentage };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Top Breadcrumb & Share Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'bn' ? 'ইউজার ডিরেক্টরি' : 'All Users'}</span>
        </Link>

        <button
          type="button"
          onClick={handleShareProfile}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shadow-xs transition active:scale-95"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">{lang === 'bn' ? 'লিঙ্ক কপি হয়েছে!' : 'Link Copied!'}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-sky-500" />
              <span>{lang === 'bn' ? 'প্রোফাইল শেয়ার করুন' : 'Share Profile'}</span>
            </>
          )}
        </button>
      </div>

      {/* ULTRA-PREMIUM HERO BANNER CARD */}
      <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
        {/* Aesthetic Gradient Mesh Backdrop */}
        <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 relative overflow-hidden">
          {/* Decorative ambient glow orbs */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* User ID & Badges Top Right inside Banner */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white/90 font-mono text-[11px] font-bold transition shadow-xs"
              title={lang === 'bn' ? 'আইডি কপি করুন' : 'Copy ID'}
            >
              <span>ID: {profile.uniqueUserId}</span>
              {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/70" />}
            </button>

            {profile.isVerified && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-bold text-[11px] shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'bn' ? 'ভেরিফাইড ইউজার' : 'Verified Member'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="px-6 sm:px-10 pb-8 pt-0">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Avatar & Core Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              {/* Glowing Avatar */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl sm:rounded-[32px] overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl shadow-sky-950/40 bg-slate-100 dark:bg-slate-800 relative z-10">
                  {profile.avatarUrl ? (
                    <img
                      src={getImageUrl(profile.avatarUrl)}
                      alt={profile.fullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 text-white font-black text-4xl sm:text-5xl flex items-center justify-center">
                      {profile.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

                {/* Active pulsating status badge */}
                <div
                  className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 z-20 shadow-md flex items-center justify-center"
                  title="Active on SafnexBD"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
                </div>
              </div>

              {/* Title & Headline */}
              <div className="space-y-1.5 pb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>{profile.fullName}</span>
                    <VerifiedBadge isVerified={profile.isVerified} status={profile.verificationStatus} size="md" />
                  </h1>
                </div>

                {profile.headline ? (
                  <p className="text-sm sm:text-base font-semibold text-sky-600 dark:text-sky-400 max-w-xl">
                    {profile.headline}
                  </p>
                ) : profile.businessName ? (
                  <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300">
                    {profile.businessName} {profile.businessType ? `• ${profile.businessType}` : ''}
                  </p>
                ) : null}

                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  {locationText && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{locationText}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {lang === 'bn' ? 'যুক্ত হয়েছেন: ' : 'Member since '}
                      {new Date(profile.memberSince || profile.createdAt).toLocaleDateString(
                        lang === 'bn' ? 'bn-BD' : 'en-US',
                        { month: 'short', year: 'numeric' }
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0 w-full sm:w-auto">
              {!currentUser || currentUser.id !== profile.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(true)}
                    className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{lang === 'bn' ? 'রেটিং দিন' : 'Rate User'}</span>
                  </button>

                  <Link
                    href={`/dashboard/chat?targetUserId=${profile.id}`}
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'মেসেজ / চ্যাট করুন' : 'Send Message'}</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard/settings"
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <UserCheck className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'প্রোফাইল এডিট করুন' : 'Edit Profile'}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            {/* 1. Rating */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {profile.averageRating ? Number(profile.averageRating).toFixed(1) : '5.0'}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ 5.0</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {profile.reviewsCount || 0} {lang === 'bn' ? 'রিভিউ' : 'Reviews'}
                </div>
              </div>
            </div>

            {/* 2. Deals Done */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {profile.completedTransactionsCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'bn' ? 'সম্পন্ন ডিল' : 'Escrow Deals'}
                </div>
              </div>
            </div>

            {/* 3. Products */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {profile.products?.length || profile.productsCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'bn' ? 'সক্রিয় প্রোডাক্ট' : 'Listings'}
                </div>
              </div>
            </div>

            {/* 4. Trust Status */}
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {profile.isVerified
                    ? lang === 'bn' ? 'ভেরিফাইড সেলার' : 'Verified Seller'
                    : lang === 'bn' ? 'রেগুলার মেম্বার' : 'Member'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'bn' ? '১০০% বিশ্বস্ততা' : 'Trust Verified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENTED TAB NAVIGATION */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'সারসংক্ষেপ' : 'Overview'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
            activeTab === 'products'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'প্রোডাক্টসমূহ' : 'Products'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 font-extrabold">
            {profile.products?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{lang === 'bn' ? 'রিভিউ' : 'Reviews'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 font-extrabold">
            {profile.reviewsCount || reviews.length || 0}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Private Notice */}
          {isPrivate && (
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{lang === 'bn' ? 'এই ব্যবহারকারী তার ব্যক্তিগত তথ্য গোপন রেখেছেন।' : 'This user has set their personal profile details to private.'}</span>
            </div>
          )}

          {/* Bio & Skills Bento Card */}
          {!isPrivate && (profile.bio || skillsList.length > 0 || interestsList.length > 0 || languagesList.length > 0) && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'সম্পর্কে ও দক্ষতাসমূহ' : 'About & Skills'}</span>
                </h2>
                <span className="text-[11px] text-slate-400">Verified Profile Info</span>
              </div>

              {profile.bio && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm italic">
                  "{profile.bio}"
                </div>
              )}

              {/* Skills */}
              {skillsList.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {lang === 'bn' ? 'বিশেষ দক্ষতা (Skills):' : 'Key Skills:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-500/20 shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests & Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {interestsList.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {lang === 'bn' ? 'আগ্রহ ও শখ (Interests):' : 'Interests:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {interestsList.map((item: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {languagesList.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {lang === 'bn' ? 'ভাষাসমূহ (Languages):' : 'Languages:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {languagesList.map((item: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Career & Education Grid */}
          {!isPrivate && (profile.profession || profile.company || profile.institution || profile.educationLevel) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Career */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-500">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span>{lang === 'bn' ? 'পেশাগত ক্যারিয়ার (Career)' : 'Professional Career'}</span>
                </h3>
                <div className="space-y-2.5 text-slate-700 dark:text-slate-300">
                  {profile.profession && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-850">
                      <span className="text-slate-400">{lang === 'bn' ? 'পেশা' : 'Profession'}</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">{profile.profession}</strong>
                    </div>
                  )}
                  {profile.company && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-850">
                      <span className="text-slate-400">{lang === 'bn' ? 'প্রতিষ্ঠান' : 'Company'}</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">{profile.company}</strong>
                    </div>
                  )}
                  {profile.jobTitle && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">{lang === 'bn' ? 'পদবী' : 'Job Title'}</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">{profile.jobTitle}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Education */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs">
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span>{lang === 'bn' ? 'শিক্ষাগত যোগ্যতা (Education)' : 'Education Background'}</span>
                </h3>
                <div className="space-y-2.5 text-slate-700 dark:text-slate-300">
                  {profile.educationLevel && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-850">
                      <span className="text-slate-400">{lang === 'bn' ? 'ডিগ্রি' : 'Level'}</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">{profile.educationLevel}</strong>
                    </div>
                  )}
                  {profile.institution && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-850">
                      <span className="text-slate-400">{lang === 'bn' ? 'প্রতিষ্ঠান' : 'Institution'}</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">{profile.institution}</strong>
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50 dark:border-slate-850">
                      <span className="text-slate-400">{lang === 'bn' ? 'বিভাগ' : 'Department'}</span>
                      <strong className="text-slate-900 dark:text-white font-semibold">{profile.department}</strong>
                    </div>
                  )}
                  {profile.graduationYear && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">{lang === 'bn' ? 'পাসের বছর' : 'Year'}</span>
                      <strong className="text-slate-900 dark:text-white font-mono font-bold">{profile.graduationYear}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Social Profiles & Web Links */}
          {(profile.website || Object.values(socialLinks).some(Boolean)) && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Share2 className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'সোশ্যাল ও অনলাইন লিঙ্কসমূহ' : 'Social & Web Profiles'}</span>
              </h3>

              <div className="flex flex-wrap gap-2.5">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-sky-500 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-600 text-slate-800 dark:text-slate-200 font-bold transition flex items-center gap-2 shadow-xs"
                  >
                    <Globe className="w-4 h-4 text-sky-500 group-hover:text-white" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {socialLinks.telegram && (
                  <a
                    href={socialLinks.telegram.startsWith('http') ? socialLinks.telegram : `https://t.me/${socialLinks.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500 hover:text-white text-sky-600 dark:text-sky-400 font-bold transition flex items-center gap-2 border border-sky-500/20"
                  >
                    <span>Telegram</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {socialLinks.whatsapp && (
                  <a
                    href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold transition flex items-center gap-2 border border-emerald-500/20"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 font-bold transition flex items-center gap-2 border border-blue-600/20"
                  >
                    <span>Facebook</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-700/10 hover:bg-blue-700 hover:text-white text-blue-700 dark:text-blue-300 font-bold transition flex items-center gap-2 border border-blue-700/20"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {socialLinks.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition flex items-center gap-2"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}

                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 font-bold transition flex items-center gap-2 border border-rose-500/20"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTS / STORE */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-in fade-in">
          {profile.products?.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'কোনো প্রোডাক্ট আপলোড করা নেই' : 'No active products listed'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {profile.products?.map((p: any) => {
                const img = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
                return (
                  <div
                    key={p.id}
                    className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <Link href={`/products/${p.slug}`} className="block overflow-hidden relative aspect-video bg-slate-100 dark:bg-slate-800">
                        <img
                          src={getImageUrl(img)}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        {p.productType && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-extrabold text-[10px] tracking-wide uppercase">
                            {p.productType}
                          </span>
                        )}
                      </Link>

                      <div className="p-5 space-y-2">
                        <Link href={`/products/${p.slug}`}>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 transition">
                            {p.title}
                          </h3>
                        </Link>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {(p as any).pricingType === 'NEGOTIABLE' ? 'আলোচনাসাপেক্ষ' : `৳ ${Number(p.price).toLocaleString()}`}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Link
                        href={`/dashboard/chat?targetUserId=${profile.id}&productId=${p.id}`}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white dark:bg-slate-800 dark:hover:bg-sky-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'ইনকোয়ারি / চ্যাট' : 'Inquire / Chat'}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REVIEWS & TRUST */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Rating Summary & Breakdown Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <span>{lang === 'bn' ? 'রেটিং ও বিশ্বস্ততা মতামত' : 'Ratings & Trust Score'}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'এই ব্যবহারকারীর সাথে লেনদেন করা ক্লায়েন্টদের আসল মতামত ও প্রতিক্রিয়া।'
                    : 'Authentic feedback and reviews from verified users who transacted with this member.'}
                </p>
              </div>

              {!currentUser || currentUser.id !== profile.id ? (
                <button
                  type="button"
                  onClick={() => setShowRatingModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 self-start sm:self-auto"
                >
                  <Star className="w-4 h-4 fill-slate-950" />
                  <span>{lang === 'bn' ? 'রিভিউ দিন' : 'Write a Review'}</span>
                </button>
              ) : null}
            </div>

            {/* Score & Distribution Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Score Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                <div className="text-4xl sm:text-5xl font-black text-amber-500 tracking-tight">
                  {profile.averageRating ? Number(profile.averageRating).toFixed(1) : '5.0'}
                </div>
                <div className="flex items-center gap-1 my-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(profile.averageRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {totalReviewsCount} {lang === 'bn' ? 'টি মোট রিভিউ' : 'total reviews'}
                </div>
              </div>

              {/* Right Star Distribution Bars */}
              <div className="md:col-span-8 space-y-2">
                {ratingDistribution.map(({ star, count, percentage }) => (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
                      <span>{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>

                    <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-10 text-right font-mono text-[11px] text-slate-400 shrink-0">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-3">
            {reviews.length > 0 ? (
              reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {rev.reviewer?.avatarUrl ? (
                        <img
                          src={getImageUrl(rev.reviewer.avatarUrl)}
                          alt={rev.reviewer.fullName}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                          {rev.reviewer?.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <span>{rev.reviewer?.fullName || 'Verified Buyer'}</span>
                          {rev.reviewer?.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {rev.reviewer?.uniqueUserId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {new Date(rev.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-slate-700 dark:text-slate-300 text-xs pl-12 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-2">
                <Star className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p>{lang === 'bn' ? 'এখনো কোনো রিভিউ দেওয়া হয়নি।' : 'No reviews posted yet.'}</p>
                {!currentUser || currentUser.id !== profile.id ? (
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(true)}
                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline"
                  >
                    {lang === 'bn' ? 'প্রথম রিভিউটি আপনি দিন!' : 'Be the first to review!'}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RATING SUBMISSION MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>{lang === 'bn' ? 'ইউজার রেটিং ও রিভিউ দিন' : 'Rate & Review User'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {ratingSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{ratingSuccess}</span>
              </div>
            )}

            {ratingError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ratingError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRating} className="space-y-4 text-xs">
              <div className="text-center space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="text-slate-700 dark:text-slate-300 font-bold">
                  {lang === 'bn' ? `${profile.fullName}-কে কত স্টার দিতে চান?` : `Select rating for ${profile.fullName}`}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setRatingValue(star)}
                      className="p-1 transition transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition ${
                          star <= (ratingHover || ratingValue)
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-black text-amber-500">
                  {ratingValue} / 5 Stars
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  {lang === 'bn' ? 'মতামত বা মন্তব্য (ঐচ্ছিক)' : 'Feedback / Review Comment (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: লেনদেন খুবই দ্রুত ও নিরাপদ ছিল, দারুণ অভিজ্ঞতা!'
                      : 'e.g. Very fast transaction, trustworthy and polite seller!'
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {submittingRating ? (lang === 'bn' ? 'সাবমিট হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? 'সাবমিট করুন' : 'Submit Review')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
