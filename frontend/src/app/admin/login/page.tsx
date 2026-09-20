'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { setAuth } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg(lang === 'bn' ? 'ইউজার আইডি/ইমেইল এবং পাসওয়ার্ড আবশ্যক' : 'Email/User ID and password are required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res: any = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const responseData = res?.user ? res : (res?.data?.data || res?.data || res);
      const user = responseData?.user;
      const accessToken = responseData?.accessToken;
      const refreshToken = responseData?.refreshToken;

      if (!user || !accessToken) {
        throw new Error(lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Invalid login credentials');
      }

      // Check if user has administrative roles
      const roles: string[] = user.roles || [];
      const hasAdminRole = roles.some((r) =>
        ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'CONTENT_ADMIN'].includes(r)
      );

      if (!hasAdminRole) {
        setErrorMsg(
          lang === 'bn'
            ? 'অ্যাক্সেস প্রত্যাখ্যাত: আপনার অ্যাকাউন্টে অ্যাডমিন অধিকার নেই।'
            : 'Access Denied: This account does not possess administrative privileges.'
        );
        setLoading(false);
        return;
      }

      // Save credentials
      if (typeof window !== 'undefined') {
        localStorage.setItem('safnexbd_token', accessToken);
        if (refreshToken) localStorage.setItem('safnexbd_refresh_token', refreshToken);
        localStorage.setItem('safnexbd_user', JSON.stringify(user));
      }

      setAuth(user, accessToken);

      // Redirect directly to admin overview
      router.push('/admin');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        (lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে, তথ্য যাচাই করুন' : 'Authentication failed. Verify credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIdentifier('admin@safnexbd.com');
    setPassword('Admin@123456');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-0 w-[500px] h-[500px] bg-sky-500/5 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md bg-slate-950/40">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>SafnexBD</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase">
                Admin Gateway
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Safe Transaction Control Center</div>
          </div>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'মার্কেটপ্লেসে ফিরুন' : 'Back to Marketplace'}</span>
        </Link>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl space-y-6">
          {/* Card Title & Icon */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner mb-1">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল সেন্টারে প্রবেশ' : 'Administrative Sign In'}
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {lang === 'bn'
                ? 'শুধুমাত্র অনুমোদিত কর্মকর্তা ও সুপার অ্যাডমিনদের জন্য সুরক্ষিত প্ল্যাটফর্ম।'
                : 'Restricted administrative access. Please authenticate with authorized credentials.'}
            </p>
          </div>

          {/* Quick Demo Credentials Autofill */}
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Demo Super Admin</span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">admin@safnexbd.com</div>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-xl shadow transition active:scale-95"
            >
              {lang === 'bn' ? 'অটো পূরণ' : 'Auto Fill'}
            </button>
          </div>

          {/* Error Message Display */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'bn' ? 'ইমেইল বা ইউনিক আইডি' : 'Email or Unique User ID'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@safnexbd.com or Admin0000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99] text-xs ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেলে সাইন ইন করুন' : 'Sign In to Control Center'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
              <span>TLS 1.3 Encrypted • Immutable Audit Ledger • Active Fraud Monitoring</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 py-4 px-6 text-center text-[11px] text-slate-600 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md">
        © {new Date().getFullYear()} SafnexBD Enterprise Security Systems. All rights reserved.
      </footer>
    </div>
  );
}

