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
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

export default function UserPublicProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;
  const { lang, t } = useLanguage();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/users/profile/${userId}`)
      .then((res: any) => setProfile(res))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-xs text-slate-400">Loading user profile...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">User not found</h2>
        <Link href="/users" className="text-xs font-semibold text-sky-600 hover:underline">Back to Search</Link>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Back button */}
      <div>
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ইউজার তালিকায় ফিরে যান' : 'Back to Users'}</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left flex-1 min-w-0">
          {profile.avatarUrl ? (
            <img
              src={getImageUrl(profile.avatarUrl)}
              alt={profile.fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-sky-500/30 flex-shrink-0 shadow-lg shadow-sky-600/20"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-600/20">
              {profile.fullName?.charAt(0) || 'U'}
            </div>
          )}

          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                {profile.fullName}
              </h1>
              {profile.isVerified && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            {/* Headline */}
            {profile.headline && (
              <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                {profile.headline}
              </p>
            )}

            {/* Unique User ID & Business */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                ID: {profile.uniqueUserId}
              </span>
              {profile.businessName && (
                <>
                  <span>•</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {profile.businessName}
                  </span>
                </>
              )}
            </div>

            {/* Location & Member Since */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400 pt-0.5">
              {locationText && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{locationText}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(profile.memberSince).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Contact Details (if allowed by user) */}
            {(profile.phone || profile.email) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                {profile.phone && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    <Phone className="w-3 h-3 text-sky-500" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    <Mail className="w-3 h-3 text-sky-500" />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action & Stats Column */}
        <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
          <div className="flex gap-3 text-center">
            <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-base font-bold text-slate-900 dark:text-white">{profile.productsCount}</div>
              <div className="text-[10px] text-slate-400">{lang === 'bn' ? 'প্রোডাক্ট' : 'Products'}</div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="text-base font-bold text-emerald-600">{profile.completedTransactionsCount}</div>
              <div className="text-[10px] text-emerald-600">{lang === 'bn' ? 'সম্পন্ন ডিল' : 'Deals Done'}</div>
            </div>
          </div>

          <Link
            href={`/dashboard/chat?targetUserId=${profile.id}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('chat')}</span>
          </Link>
        </div>
      </div>

      {/* Private Profile Notice */}
      {isPrivate && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500">
          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{lang === 'bn' ? 'এই ব্যবহারকারী তার বিস্তারিত ব্যক্তিগত তথ্য গোপন (Private) রেখেছেন।' : 'This user has set their personal profile details to private.'}</span>
        </div>
      )}

      {/* About & Bio & Social Section (if not private) */}
      {!isPrivate && (profile.bio || skillsList.length > 0 || interestsList.length > 0 || languagesList.length > 0 || profile.website || Object.values(socialLinks).some(Boolean)) && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 text-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>{lang === 'bn' ? 'সম্পর্কে ও দক্ষতা (About & Skills)' : 'About & Skills'}</span>
          </h2>

          {/* Bio */}
          {profile.bio && (
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
              {profile.bio}
            </p>
          )}

          {/* Skills */}
          {skillsList.length > 0 && (
            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {lang === 'bn' ? 'দক্ষতাসমূহ (Skills):' : 'Skills:'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests & Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {interestsList.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'আগ্রহ / শখ (Interests):' : 'Interests:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {interestsList.map((item: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languagesList.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'ভাষাসমূহ (Languages):' : 'Languages:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {languagesList.map((item: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Social Links & Website */}
          {(profile.website || Object.values(socialLinks).some(Boolean)) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-sky-500" />
                <span>{lang === 'bn' ? 'সোশ্যাল ও অনলাইন লিঙ্কসমূহ:' : 'Social & Web Profiles:'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 hover:text-sky-600 font-semibold flex items-center gap-1.5 transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                    <span>Website</span>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-semibold transition"
                  >
                    Facebook
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
                  >
                    Twitter / X
                  </a>
                )}
                {socialLinks.telegram && (
                  <a
                    href={socialLinks.telegram.startsWith('http') ? socialLinks.telegram : `https://t.me/${socialLinks.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 hover:text-sky-500 font-semibold transition"
                  >
                    Telegram
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a
                    href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-500 font-semibold transition"
                  >
                    WhatsApp
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-500 font-semibold transition"
                  >
                    LinkedIn
                  </a>
                )}
                {socialLinks.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
                  >
                    GitHub
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-500 font-semibold transition"
                  >
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profession & Education Section (if not private and available) */}
      {!isPrivate && (profile.profession || profile.company || profile.jobTitle || profile.institution || profile.educationLevel) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Career */}
          {(profile.profession || profile.company || profile.jobTitle) && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <Briefcase className="w-4 h-4 text-purple-500" />
                <span>{lang === 'bn' ? 'পেশাগত তথ্য (Profession & Career)' : 'Profession & Career'}</span>
              </h3>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {profile.profession && (
                  <div>
                    <span className="text-slate-400">{lang === 'bn' ? 'পেশা: ' : 'Profession: '}</span>
                    <strong className="text-slate-900 dark:text-white">{profile.profession}</strong>
                  </div>
                )}
                {profile.company && (
                  <div>
                    <span className="text-slate-400">{lang === 'bn' ? 'প্রতিষ্ঠান: ' : 'Organization: '}</span>
                    <strong className="text-slate-900 dark:text-white">{profile.company}</strong>
                  </div>
                )}
                {profile.jobTitle && (
                  <div>
                    <span className="text-slate-400">{lang === 'bn' ? 'পদবী: ' : 'Job Title: '}</span>
                    <strong className="text-slate-900 dark:text-white">{profile.jobTitle}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education */}
          {(profile.institution || profile.educationLevel || profile.department) && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'bn' ? 'শিক্ষাগত যোগ্যতা (Education)' : 'Education'}</span>
              </h3>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {profile.educationLevel && (
                  <div>
                    <span className="text-slate-400">{lang === 'bn' ? 'লেভেল: ' : 'Level: '}</span>
                    <strong className="text-slate-900 dark:text-white">{profile.educationLevel}</strong>
                  </div>
                )}
                {profile.institution && (
                  <div>
                    <span className="text-slate-400">{lang === 'bn' ? 'প্রতিষ্ঠান: ' : 'Institution: '}</span>
                    <strong className="text-slate-900 dark:text-white">{profile.institution}</strong>
                  </div>
                )}
                {profile.department && (
                  <div>
                    <span className="text-slate-400">{lang === 'bn' ? 'বিভাগ: ' : 'Department: '}</span>
                    <strong className="text-slate-900 dark:text-white">{profile.department}</strong>
                  </div>
                )}
                {profile.graduationYear && (
                  <div>
                    <span className="text-slate-400">{lang === 'bn' ? 'পাসের বছর: ' : 'Year: '}</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{profile.graduationYear}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User's Products */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-500" />
          <span>{lang === 'bn' ? `${profile.fullName}-এর প্রোডাক্টসমূহ` : `${profile.fullName}'s Products`}</span>
        </h2>

        {profile.products?.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            {lang === 'bn' ? 'কোনো প্রোডাক্ট আপলোড করা নেই' : 'No products uploaded yet'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {profile.products?.map((p: any) => {
              const img = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
              return (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <Link href={`/products/${p.slug}`} className="block overflow-hidden group">
                      <img src={getImageUrl(img)} alt={p.title} className="w-full aspect-video object-cover group-hover:scale-105 transition duration-300" />
                    </Link>
                    <div className="p-4 space-y-2">
                      <Link href={`/products/${p.slug}`}>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 transition">{p.title}</h3>
                      </Link>
                      <div className="text-sm font-extrabold text-sky-600">৳ {Number(p.price).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <Link
                      href={`/dashboard/chat?targetUserId=${profile.id}&productId=${p.id}`}
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
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
  );
}
