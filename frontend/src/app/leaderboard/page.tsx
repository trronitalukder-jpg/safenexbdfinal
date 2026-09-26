'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { getImageUrl } from '@/lib/imageUtils';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Sparkles,
  Calendar,
  Gift,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface LeaderboardItem {
  rank: number;
  userId: string;
  score: number;
  scoreLabel: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    uniqueUserId: string;
    avatarUrl?: string | null;
    isVerified?: boolean;
    verificationStatus?: string;
  };
}

export default function LeaderboardPage() {
  const { lang } = useLanguage();
  const [type, setType] = useState<'workers' | 'earners' | 'referrers'>('workers');
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [monthName, setMonthName] = useState('');
  const [prizePool, setPrizePool] = useState<any>({ first: 1000, second: 500, third: 300, total: 2500 });

  useEffect(() => {
    fetchLeaderboard();
  }, [type, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/leaderboard?type=${type}&period=${period}`);
      const data = res?.data || res;
      if (data?.items) {
        setItems(data.items);
        if (data.monthName) setMonthName(data.monthName);
        if (data.prizePool) setPrizePool(data.prizePool);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const top1 = items.find((i) => i.rank === 1);
  const top2 = items.find((i) => i.rank === 2);
  const top3 = items.find((i) => i.rank === 3);
  const restItems = items.filter((i) => i.rank > 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/30 p-6 sm:p-10 shadow-lg text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold">
            <Trophy className="w-4 h-4" />
            <span>{lang === 'bn' ? `চলতি মাস: ${monthName || 'এই মাসের কনটেস্ট'}` : 'Monthly Leaderboard'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? '🏆 মাসিক লিডারবোর্ড ও প্রাইজপুল' : '🏆 Monthly Leaderboard & Prize Pool'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'কঠোর পরিশ্রমী সেরা কর্মী, উপার্জনকারী ও রেফারারদের জন্য বিশেষ আর্থিক প্রাইজমানি ও এক্সক্লুসিভ রিওয়ার্ড!'
              : 'Compete with top earners, task workers, and referrers to claim grand cash prize rewards!'}
          </p>

          {/* Prize Pool Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 max-w-2xl mx-auto text-center">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              <span className="text-xs font-bold block">🥇 ১ম স্থান রিওয়ার্ড</span>
              <span className="text-xl font-black">৳ {prizePool.first}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="text-xs font-bold block">🥈 ২য় স্থান রিওয়ার্ড</span>
              <span className="text-xl font-black">৳ {prizePool.second}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400">
              <span className="text-xs font-bold block">🥉 ৩য় স্থান রিওয়ার্ড</span>
              <span className="text-xl font-black">৳ {prizePool.third}</span>
            </div>
          </div>
        </div>

        {/* Tab & Period Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Type Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setType('workers')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                type === 'workers'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'টপ ওয়ার্কার' : 'Top Workers'}</span>
            </button>
            <button
              onClick={() => setType('earners')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                type === 'earners'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'টপ আর্নার' : 'Top Earners'}</span>
            </button>
            <button
              onClick={() => setType('referrers')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                type === 'referrers'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'টপ রেফারার' : 'Top Referrers'}</span>
            </button>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-end sm:self-auto">
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                period === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'bn' ? 'চলতি মাস' : 'This Month'}
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                period === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {lang === 'bn' ? 'সর্বকালীন' : 'All Time'}
            </button>
          </div>
        </div>

        {/* Top 3 Podium */}
        {loading ? (
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800/60 animate-pulse" />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-8 pb-4">
            {/* Rank 2 (Silver) */}
            <div className="flex flex-col items-center text-center order-1">
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 dark:border-slate-500 bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-lg flex items-center justify-center font-black text-xl">
                  {top2?.user?.avatarUrl ? (
                    <img src={getImageUrl(top2.user.avatarUrl)} alt="2nd" className="w-full h-full object-cover" />
                  ) : (
                    <span>{top2?.user?.firstName?.[0] || '2'}</span>
                  )}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-400 text-white font-black text-[10px] shadow-sm">
                  #2
                </span>
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs sm:text-sm font-bold truncate max-w-[100px] sm:max-w-[140px] text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  <span>{top2?.user ? `${top2.user.firstName} ${top2.user.lastName || ''}`.trim() : '---'}</span>
                  <VerifiedBadge isVerified={top2?.user?.isVerified} status={top2?.user?.verificationStatus} size="xs" />
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-500">
                  {top2 ? `${top2.score} ${top2.scoreLabel}` : '---'}
                </p>
                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                  ৳ {prizePool.second}
                </span>
              </div>
            </div>

            {/* Rank 1 (Gold) */}
            <div className="flex flex-col items-center text-center order-2 -translate-y-4">
              <div className="relative mb-2">
                <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400 absolute -top-7 sm:-top-9 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-amber-400 ring-4 ring-amber-400/30 bg-amber-500/10 overflow-hidden shadow-2xl flex items-center justify-center font-black text-2xl">
                  {top1?.user?.avatarUrl ? (
                    <img src={getImageUrl(top1.user.avatarUrl)} alt="1st" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-500">{top1?.user?.firstName?.[0] || '1'}</span>
                  )}
                </div>
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md">
                  👑 #1
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm sm:text-base font-black truncate max-w-[120px] sm:max-w-[180px] text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  <span>{top1?.user ? `${top1.user.firstName} ${top1.user.lastName || ''}`.trim() : '---'}</span>
                  <VerifiedBadge isVerified={top1?.user?.isVerified} status={top1?.user?.verificationStatus} size="sm" />
                </p>
                <p className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                  {top1 ? `${top1.score} ${top1.scoreLabel}` : '---'}
                </p>
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow-sm">
                  ৳ {prizePool.first} বোনাস
                </span>
              </div>
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="flex flex-col items-center text-center order-3">
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-700/60 dark:border-amber-600/50 bg-amber-900/10 overflow-hidden shadow-lg flex items-center justify-center font-black text-xl">
                  {top3?.user?.avatarUrl ? (
                    <img src={getImageUrl(top3.user.avatarUrl)} alt="3rd" className="w-full h-full object-cover" />
                  ) : (
                    <span>{top3?.user?.firstName?.[0] || '3'}</span>
                  )}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-700 text-white font-black text-[10px] shadow-sm">
                  #3
                </span>
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs sm:text-sm font-bold truncate max-w-[100px] sm:max-w-[140px] text-slate-900 dark:text-white flex items-center justify-center gap-1">
                  <span>{top3?.user ? `${top3.user.firstName} ${top3.user.lastName || ''}`.trim() : '---'}</span>
                  <VerifiedBadge isVerified={top3?.user?.isVerified} status={top3?.user?.verificationStatus} size="xs" />
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-500">
                  {top3 ? `${top3.score} ${top3.scoreLabel}` : '---'}
                </p>
                <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                  ৳ {prizePool.third}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Full Table: Ranks 4 to 20 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Medal className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'শীর্ষ ২০ লিডারবোর্ড র‍্যাংকিং' : 'Top 20 Leaderboard Rankings'}</span>
            </h2>
            <span className="text-xs text-slate-400">
              {items.length} {lang === 'bn' ? 'জন সদস্য' : 'members'}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">লোড হচ্ছে...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              এই ক্যাটাগরিতে এখনো কোনো তথ্য নেই। আজই কাজ শুরু করুন এবং লিডারবোর্ডের শীর্ষে পৌঁছান!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {items.map((item) => (
                <div
                  key={item.userId}
                  className={`flex items-center justify-between px-4 sm:px-6 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    item.rank <= 3 ? 'bg-amber-500/5 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                        item.rank === 1
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                          : item.rank === 2
                          ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white'
                          : item.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono'
                      }`}
                    >
                      {item.rank}
                    </span>

                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs">
                      {item.user?.avatarUrl ? (
                        <img src={getImageUrl(item.user.avatarUrl)} alt={item.user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{item.user?.firstName?.[0] || 'U'}</span>
                      )}
                    </div>

                    <div className="truncate">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span>{item.user ? `${item.user.firstName} ${item.user.lastName || ''}`.trim() : 'User'}</span>
                        <VerifiedBadge isVerified={item.user?.isVerified} status={item.user?.verificationStatus} size="xs" />
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">@{item.user?.uniqueUserId}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-mono block">
                      {item.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{item.scoreLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
