'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { setAuth } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res: any = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-600/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'অ্যাকাউন্টে লগইন করুন' : 'Sign in to SafnexBD'}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'আপনার ফোন নম্বর অথবা ইমেইল দিয়ে লগইন করুন' : 'Login using Phone Number or Email (Gmail)'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'bn' ? 'ফোন নম্বর অথবা ইমেইল' : 'Phone Number or Email'}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: 017xxxxxxxx অথবা example@gmail.com' : 'e.g. 017xxxxxxxx or user@gmail.com'}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-sky-600 hover:text-sky-500 hover:underline transition"
              >
                {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 pr-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>{t('login')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          <span>{lang === 'bn' ? 'নতুন ইউজার? ' : "Don't have an account? "}</span>
          <Link href="/register" className="font-bold text-sky-600 hover:underline">
            {t('register')}
          </Link>
        </div>

        {/* Demo credentials hint */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300">Demo Login:</div>
          <div>Admin: <code>admin@safnexbd.com</code> / <code>Admin@123456</code></div>
          <div>User: <code>user@safnexbd.com</code> / <code>User@123456</code></div>
        </div>
      </div>
    </div>
  );
}

