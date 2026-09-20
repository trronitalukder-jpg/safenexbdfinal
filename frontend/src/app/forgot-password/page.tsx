'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Hash,
  Mail,
  Clock,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();

  // Mode: 'MANUAL' (Default/Existing ticket system) or 'OTP' (Self-service instant reset)
  const [activeMode, setActiveMode] = useState<'MANUAL' | 'OTP'>('MANUAL');
  const [canUseOtp, setCanUseOtp] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Manual Form States (Existing Method)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [uniqueUserId, setUniqueUserId] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState('');

  // OTP Form States (Instant Reset 3-Step)
  const [otpStep, setOtpStep] = useState<1 | 2 | 3>(1);
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpError, setOtpError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Fetch configured default mode from public endpoint
  useEffect(() => {
    api
      .get('/sms/public-modes')
      .then((res: any) => {
        const data = unwrap(res);
        const allowOtp = Boolean(
          data?.isAnyGatewayEnabled && data?.forgotPasswordMode === 'OTP'
        );
        setCanUseOtp(allowOtp);
        if (allowOtp) {
          setActiveMode('OTP');
        } else {
          setActiveMode('MANUAL');
        }
      })
      .catch(() => {
        setCanUseOtp(false);
        setActiveMode('MANUAL');
      })
      .finally(() => {
        setLoadingConfig(false);
      });
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ---------------------------------------------------------------------------
  // 1. MANUAL FORM SUBMISSION (Existing platform method)
  // ---------------------------------------------------------------------------
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setManualSuccess('');
    setManualLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        uniqueUserId: uniqueUserId.trim().replace(/^@/, ''),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const data = unwrap(res);
      setManualSuccess(
        data?.message ||
          (lang === 'bn'
            ? 'আপনার পাসওয়ার্ড রিসেট রিকোয়েস্টটি সফলভাবে গ্রহণ করা হয়েছে। অ্যাডমিন আপনার পাসওয়ার্ড পরিবর্তন করে ২৪ ঘণ্টার মধ্যে আপনার ফোন অথবা ইমেইলে পাঠিয়ে দেবে।'
            : 'Your password reset request has been received. Admin will change your password and send it to your phone or email within 24 hours.')
      );
    } catch (err: any) {
      setOtpError(err.message || (lang === 'bn' ? 'রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে' : 'Failed to submit request'));
    } finally {
      setManualLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. OTP FLOW - STEP 1: SEND OTP
  // ---------------------------------------------------------------------------
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpIdentifier.trim()) {
      setOtpError('অনুগ্রহ করে আপনার মোবাইল নম্বর বা ইমেইল লিখুন');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setSimulatedCode(null);

    try {
      const res: any = await api.post('/auth/forgot-password/send-otp', {
        identifier: otpIdentifier.trim(),
      });
      const data = unwrap(res);

      if (data?.simulatedCode) {
        setSimulatedCode(data.simulatedCode);
      }

      setCooldown(45);
      setOtpStep(2);
    } catch (err: any) {
      setOtpError(err.message || 'ওটিপি কোড পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setOtpLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. OTP FLOW - STEP 2: VERIFY OTP
  // ---------------------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setOtpError('অনুগ্রহ করে ওটিপি কোড লিখুন');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res: any = await api.post('/auth/forgot-password/verify-otp', {
        identifier: otpIdentifier.trim(),
        code: otpCode.trim(),
      });
      const data = unwrap(res);

      if (!data?.resetToken) {
        throw new Error('রিসেট টোকেন পাওয়া যায়নি');
      }

      setResetToken(data.resetToken);
      setOtpStep(3);
    } catch (err: any) {
      setOtpError(err.message || 'ভুল ওটিপি কোড প্রদান করেছেন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setOtpLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. OTP FLOW - STEP 3: RESET PASSWORD
  // ---------------------------------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setOtpError('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে');
      return;
    }

    if (newPassword !== confirmPassword) {
      setOtpError('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res: any = await api.post('/auth/forgot-password/reset-password', {
        resetToken,
        newPassword,
        confirmPassword,
      });
      const data = unwrap(res);

      setOtpSuccess(
        data?.message || 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
      );
    } catch (err: any) {
      setOtpError(err.message || 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে। ওটিপির মেয়াদ শেষ হতে পারে।');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Password Reset'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {canUseOtp && activeMode === 'OTP'
              ? (lang === 'bn'
                  ? 'নিবন্ধিত মোবাইল নম্বর বা ইমেইলে ওটিপি কোড দিয়ে তাৎক্ষণিকভাবে পাসওয়ার্ড পরিবর্তন করুন'
                  : 'Reset your password instantly with an OTP sent to your phone or email')
              : (lang === 'bn'
                  ? 'অ্যাকাউন্ট তথ্য প্রদান করে আবেদন করুন। অ্যাডমিন ভেরিফাই করে আপনার পাসওয়ার্ড রিসেট করে দেবে।'
                  : 'Submit account details. Admin will verify and reset your password.')}
          </p>

          {/* Dual-Mode Selector Pills ONLY shown when Gateways are active & OTP is enabled */}
          {canUseOtp && (
            <div className="pt-2 flex justify-center">
              <div className="inline-flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('OTP');
                    setOtpError('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeMode === 'OTP'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {lang === 'bn' ? 'তাৎক্ষণিক ওটিপি (OTP)' : 'Instant OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('MANUAL');
                    setOtpError('');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeMode === 'MANUAL'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {lang === 'bn' ? 'ম্যানুয়াল রিকোয়েস্ট' : 'Manual Request'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {otpError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{otpError}</span>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODE 1: EXISTING MANUAL REQUEST FORM (Preserved 100%)              */}
        {/* =================================================================== */}
        {(!canUseOtp || activeMode === 'MANUAL') && (
          <>
            {manualSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      {lang === 'bn' ? 'রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!' : 'Request Sent Successfully!'}
                    </h3>
                    <p className="text-xs leading-relaxed">{manualSuccess}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                  <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? 'অ্যাডমিন আপনার পাসওয়ার্ড পরিবর্তন করে ২৪ ঘণ্টার মধ্যে আপনার ফোন অথবা ইমেইলে পাঠিয়ে দেবে।'
                      : 'Admin will reset your password and send it to your phone or email within 24 hours.'}
                  </span>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'লগইন পেজে ফিরে যান' : 'Back to Login'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'আপনার পূর্ণ নাম (Full Name) *' : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahim Ahmed"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-medium"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর (Phone Number) *' : 'Phone Number *'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-medium"
                    />
                  </div>
                </div>

                {/* Unique User ID */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইউজার আইডি (User ID) *' : 'Unique User ID *'}
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={uniqueUserId}
                      onChange={(e) => setUniqueUserId(e.target.value)}
                      placeholder="e.g. Rahim2345"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-mono font-medium"
                    />
                  </div>
                </div>

                {/* Optional Email */}
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'ইমেইল এড্রেস (ঐচ্ছিক)' : 'Email Address (Optional)'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahim@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition font-medium"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'মন্তব্য বা অতিরিক্ত বিবরণ (ঐচ্ছিক)' : 'Additional Notes (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'যেমন: আমার সিম কার্ড বা ইমেইল সংক্রান্ত কোনো তথ্য থাকলে লিখুন...'
                        : 'Any additional details to identify your account...'
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* 24-Hour Notice Callout */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'bn'
                      ? 'রিকোয়েস্ট পাঠানোর পর অ্যাডমিন আপনার তথ্য ভেরিফাই করে ২৪ ঘণ্টার মধ্যে আপনার ফোন অথবা ইমেইলে নতুন পাসওয়ার্ড পাঠিয়ে দেবে।'
                      : 'After submitting, admin will verify your details and send a new password to your phone or email within 24 hours.'}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {manualLoading ? (
                    <span>{lang === 'bn' ? 'রিকোয়েস্ট পাঠানো হচ্ছে...' : 'Submitting Request...'}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'পাসওয়ার্ড রিসেট রিকোয়েস্ট পাঠান' : 'Submit Reset Request'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* =================================================================== */}
        {/* MODE 2: SELF-SERVICE 3-STEP INSTANT OTP RESET                      */}
        {/* =================================================================== */}
        {canUseOtp && activeMode === 'OTP' && (
          <>
            {otpSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!
                    </h3>
                    <p className="text-xs leading-relaxed">{otpSuccess}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>নতুন পাসওয়ার্ড দিয়ে লগইন করুন</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Steps Indicator */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      otpStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      1
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300">তথ্য প্রদান</span>
                  </div>
                  <div className="w-8 h-0.5 bg-slate-800"></div>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      otpStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      2
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300">ওটিপি যাচাই</span>
                  </div>
                  <div className="w-8 h-0.5 bg-slate-800"></div>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      otpStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      3
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300">নতুন পাসওয়ার্ড</span>
                  </div>
                </div>

                {/* Development Simulated OTP Notification */}
                {simulatedCode && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between font-mono animate-in fade-in">
                    <span>টেস্ট ওটিপি কোড: <strong>{simulatedCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(simulatedCode)}
                      className="px-2 py-0.5 bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 rounded text-[10px]"
                    >
                      অটোভিল করুন
                    </button>
                  </div>
                )}

                {/* STEP 1: Phone / Email Input */}
                {otpStep === 1 && (
                  <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        নিবন্ধিত মোবাইল নম্বর বা ইমেইল *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={otpIdentifier}
                          onChange={(e) => setOtpIdentifier(e.target.value)}
                          placeholder="e.g. 01700000000 বা user@gmail.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        আপনার অ্যাকাউন্টে নিবন্ধিত মোবাইল নম্বরে অথবা ইমেইলে ৬-ডিজিটের নিরাপদ ওটিপি কোড পাঠানো হবে।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {otpLoading ? (
                        <span>ওটিপি পাঠানো হচ্ছে...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>ওটিপি কোড পাঠান</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2: 6-Digit OTP Code Verification */}
                {otpStep === 2 && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          ৬-ডিজিটের ওটিপি কোড দিন *
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpStep(1)}
                          className="text-blue-500 hover:underline text-[11px]"
                        >
                          নম্বর পরিবর্তন করুন
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={8}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="739201"
                        className="w-full text-center text-xl font-bold tracking-widest py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                        আমরা <span className="font-mono text-slate-200">{otpIdentifier}</span> এ ওটিপি পাঠিয়েছি।
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {otpLoading ? (
                        <span>যাচাই করা হচ্ছে...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>ওটিপি কোড যাচাই করুন</span>
                        </>
                      )}
                    </button>

                    {/* Resend Cooldown */}
                    <div className="text-center pt-1">
                      {cooldown > 0 ? (
                        <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন: {cooldown}s</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={otpLoading}
                          className="text-xs text-blue-500 hover:underline font-semibold inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>পুনরায় ওটিপি কোড পাঠান</span>
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* STEP 3: Set New Password with Eye Toggles */}
                {otpStep === 3 && (
                  <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                    {/* New Password */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        নতুন পাসওয়ার্ড (New Password) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="ন্যূনতম ৬ অক্ষর লিখুন"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {otpLoading ? (
                        <span>পাসওয়ার্ড আপডেট হচ্ছে...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>নতুন পাসওয়ার্ড সংরক্ষণ করুন</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {/* Bottom Back Link */}
        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লগইন পেজে ফিরে যান' : 'Back to Login'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
