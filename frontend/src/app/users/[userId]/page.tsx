'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, MessageSquare, CheckCircle2, Calendar, Package, ArrowLeft } from 'lucide-react';
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
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">Loading user profile...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">User not found</h2>
        <Link href="/users" className="text-xs font-semibold text-sky-600 hover:underline">Back to Search</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {profile.avatarUrl ? (
            <img
              src={getImageUrl(profile.avatarUrl)}
              alt={profile.fullName}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-sky-500/30 flex-shrink-0 shadow-lg shadow-sky-600/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-sky-600 text-white font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-600/20">
              {profile.fullName?.charAt(0) || 'U'}
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{profile.fullName}</h1>
              {profile.isVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">ID: {profile.uniqueUserId}</div>
            {profile.businessName && <div className="text-xs text-slate-500">{profile.businessName}</div>}
            <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined: {new Date(profile.memberSince).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end gap-3">
          <div className="flex gap-4 text-center">
            <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-base font-bold text-slate-900 dark:text-white">{profile.productsCount}</div>
              <div className="text-[10px] text-slate-400">Products</div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="text-base font-bold text-emerald-600">{profile.completedTransactionsCount}</div>
              <div className="text-[10px] text-emerald-600">Deals Done</div>
            </div>
          </div>

          <Link
            href={`/dashboard/chat?targetUserId=${profile.id}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('chat')}</span>
          </Link>
        </div>
      </div>

      {/* User's Products */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-500" />
          <span>{lang === 'bn' ? `${profile.fullName}-এর প্রোডাক্টসমূহ` : `${profile.fullName}'s Products`}</span>
        </h2>

        {profile.products?.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No products uploaded yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {profile.products?.map((p: any) => {
              const img = p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80';
              return (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between">
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

