'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Camera,
  Upload,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Sparkles,
  Phone,
  Mail,
  User,
  Lock,
  Building2,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettings } from '@/context/SettingsContext';
import { usePwa } from '@/context/PwaContext';
import { api } from '@/lib/api';
import { compressImage } from '@/lib/imageUtils';
import { trackEvent } from '@/lib/tracking';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const { setAuth } = useAuthStore();
  const { settings } = useSettings();
  const { triggerPostRegistrationPrompt } = usePwa();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refParam = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    referralCode: refParam,
  });

  useEffect(() => {
    if (refParam) {
      setFormData((prev) => ({ ...prev, referralCode: refParam }));
    }
  }, [refParam]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate password strength score (0 to 4)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return Math.min(score, 4);
  };

  const pwdStrength = getPasswordStrength(formData.password);

  const getStrengthLabel = (score: number) => {
    if (!formData.password) return '';
    if (score <= 1) return lang === 'bn' ? 'দুর্বল' : 'Weak';
    if (score === 2) return lang === 'bn' ? 'মোটামুটি' : 'Fair';
    if (score === 3) return lang === 'bn' ? 'ভালো' : 'Good';
    return lang === 'bn' ? 'অত্যন্ত শক্তিশালী' : 'Very Strong';
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-rose-500 text-rose-500';
    if (score === 2) return 'bg-amber-500 text-amber-500';
    if (score === 3) return 'bg-sky-500 text-sky-500';
    return 'bg-emerald-500 text-emerald-500';
  };

  // Handle avatar file selection & background upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (up to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setAvatarMessage({
        type: 'error',
        text: lang === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ২০ মেগাবাইট হতে পারে' : 'Image size must not exceed 20MB',
      });
      return;
    }

    setUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      // Auto compress and resize client-side to 800x800 high quality JPEG
      const { base64Data, fileName } = await compressImage(file, 800, 800, 0.85);
      setAvatarPreview(base64Data);

      // Upload file to /uploads API
      const uploadRes: any = await api.post('/uploads', {
        base64Data,
        fileName,
        folder: 'avatars',
      });

      const fileUrl = uploadRes?.fileUrl || uploadRes?.data?.fileUrl;
      if (!fileUrl) {
        throw new Error('Upload response missing file URL');
      }

      setAvatarUrl(fileUrl);
      setAvatarMessage({
        type: 'success',
        text: lang === 'bn' ? 'ছবি যুক্ত করা হয়েছে' : 'Photo attached successfully',
      });
    } catch (err: any) {
      setAvatarMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || (lang === 'bn' ? 'ছবি আপলোড ব্যর্থ হয়েছে' : 'Failed to upload photo'),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarUrl('');
    setAvatarMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(lang === 'bn' ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না' : 'Passwords do not match');
      return;
    }

    if (uploadingAvatar) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে প্রোফাইল ছবি আপলোড হওয়া পর্যন্ত ২ সেকেন্ড অপেক্ষা করুন...' : 'Please wait for profile photo to finish uploading...');
      return;
    }

    setLoading(true);

    try {
      let finalAvatarUrl = avatarUrl;
      // If photo was chosen but upload is not yet complete or failed, attempt immediate upload now
      if (!finalAvatarUrl && avatarPreview && avatarPreview.startsWith('data:')) {
        try {
          const uploadRes: any = await api.post('/uploads', {
            base64Data: avatarPreview,
            fileName: 'avatar.jpg',
            folder: 'avatars',
          });
          finalAvatarUrl = uploadRes?.fileUrl || uploadRes?.data?.fileUrl || '';
        } catch (uErr) {
          console.error('Fallback avatar upload failed:', uErr);
        }
      }

      const res: any = await api.post('/auth/register', {
        ...formData,
        avatarUrl: finalAvatarUrl || undefined,
      });

      setAuth(res.user, res.accessToken, res.refreshToken);

      // Trigger PWA app install prompt after admin configurable seconds
      if (settings?.system?.appInstallPromptOnRegister !== false) {
        const delaySec = settings?.system?.appInstallDelaySeconds ?? 10;
        triggerPostRegistrationPrompt(delaySec);
      }

      // Track Meta Pixel & Analytics Registration Event
      trackEvent('CompleteRegistration', {
        content_name: 'User Registration',
        status: true,
        method: 'phone_email',
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-3 sm:px-6 py-6 sm:py-12 overflow-hidden">
      {/* Ambient background glow for high-end look */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-sky-500/15 to-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-xl bg-white dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none space-y-6 relative overflow-hidden">
        {/* Top vibrant gradient accent line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500" />

        {/* Header & Trust Highlights */}
        <div className="text-center space-y-3 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-[11px] sm:text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'bn' ? '১০০% ফ্রি অ্যাকাউন্ট • কোনো লুকানো চার্জ নেই' : '100% Free Account • Zero Hidden Fees'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? (
              <>
                নতুন অ্যাকাউন্ট <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">তৈরি করুন</span>
              </>
            ) : (
              <>
                Create Your <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Free Account</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'নিরাপদ লেনদেন, মাইক্রো-টাস্ক ইনকাম ও বাই-সেল—সবকিছু এক অ্যাকাউন্টে!'
              : 'One secure account for Escrow, Micro-Job Earning, Buying & Selling.'}
          </p>

          {/* 3 Mobile-Optimized Trust Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="truncate">{lang === 'bn' ? '১০০% নিরাপদ' : '100% Safe'}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
              <span className="text-amber-500 font-extrabold flex-shrink-0">⚡</span>
              <span className="truncate">{lang === 'bn' ? 'দ্রুত পেমেন্ট' : 'Fast Payout'}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center gap-1.5 shadow-2xs">
              <span className="text-sky-500 font-extrabold flex-shrink-0">💼</span>
              <span className="truncate">{lang === 'bn' ? 'কাজ ও আয়' : 'Work & Earn'}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture Upload Section */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 sm:gap-4">
            <div className="relative group flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-md bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black relative ring-4 ring-sky-500/10">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg sm:text-xl font-bold">
                    {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : <Camera className="w-6 h-6 sm:w-7 sm:h-7 opacity-80" />}
                  </span>
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Quick Camera Badge Click */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                aria-label={lang === 'bn' ? 'ছবি যুক্ত করুন' : 'Upload Avatar'}
                className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-md border-2 border-white dark:border-slate-900 transition hover:scale-110 active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {lang === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Picture'}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {lang === 'bn' ? '(ঐচ্ছিক)' : '(Optional)'}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight line-clamp-2">
                {lang === 'bn'
                  ? 'ছবি দিলে আপনার প্রোফাইল ভেরিফায়েড ও বিশ্বস্ত দেখাবে।'
                  : 'Add a photo to boost credibility and trust.'}
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Upload className="w-3 h-3" />
                  <span>{avatarPreview ? (lang === 'bn' ? 'পরিবর্তন' : 'Change') : (lang === 'bn' ? 'ছবি আপলোড' : 'Upload Photo')}</span>
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-200 dark:border-rose-900/50 transition flex items-center gap-1 active:scale-95"
                  >
                    <X className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'মুছুন' : 'Remove'}</span>
                  </button>
                )}
              </div>

              {avatarMessage && (
                <div
                  className={`p-1.5 rounded-lg text-[10.5px] font-semibold flex items-center gap-1.5 mt-1 ${
                    avatarMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {avatarMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{avatarMessage.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* First & Last Name: Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'ফার্স্ট নেম *' : 'First Name *'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder={lang === 'bn' ? 'যেমন: Rahim' : 'e.g. Rahim'}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'লাস্ট নেম *' : 'Last Name *'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder={lang === 'bn' ? 'যেমন: Ahmed' : 'e.g. Ahmed'}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Mobile & Email: Stacked on small phone for full readability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Phone *'}
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold text-xs border-r border-slate-200 dark:border-slate-700 pr-2 pointer-events-none">
                  <span>🇧🇩 +88</span>
                </div>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="017XXXXXXXX"
                  className="w-full pl-24 pr-3.5 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'ইমেইল এড্রেস *' : 'Email Address *'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Business Name & Address (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'ব্যবসা / পেইজ এর নাম (ঐচ্ছিক)' : 'Business / Store Name (Optional)'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder={lang === 'bn' ? 'যেমন: Safenex Shop' : 'e.g. TrustTech BD'}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'ঠিকানা / জেলা (ঐচ্ছিক)' : 'Address / District (Optional)'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={lang === 'bn' ? 'যেমন: Mirpur, Dhaka' : 'e.g. Mirpur, Dhaka'}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'পাসওয়ার্ড *' : 'Password *'}
                </label>
                {formData.password && (
                  <span className={`text-[10px] font-bold ${getStrengthColor(pwdStrength).split(' ')[1]}`}>
                    {getStrengthLabel(pwdStrength)}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Progress Bar */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-4 gap-1 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-all duration-300 ${
                          pwdStrength >= step ? getStrengthColor(pwdStrength).split(' ')[0] : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'কনফার্ম পাসওয়ার্ড *' : 'Confirm Password *'}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700/80 focus:ring-sky-500/30 focus:border-sky-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[10.5px] font-bold text-rose-500 mt-1">
                  {lang === 'bn' ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
                </p>
              )}
            </div>
          </div>

          {/* Referral Code Box with high visual appeal */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/8 via-amber-500/5 to-transparent border border-amber-500/30 dark:border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>{lang === 'bn' ? 'রেফারেল কোড (ঐচ্ছিক / বোনাস কোড)' : 'Referral Code (Optional)'}</span>
              </label>
              {formData.referralCode && (
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>✓</span>
                  <span>{lang === 'bn' ? 'কোড যুক্ত হয়েছে' : 'Applied'}</span>
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              placeholder={lang === 'bn' ? 'যেমন: Safenex77 (যদি কেউ রেফার করে থাকে)' : 'e.g. Safenex77'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-xs font-mono text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* High-Converting Gradient CTA Button */}
          <button
            type="submit"
            disabled={loading || uploadingAvatar}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-600 hover:from-sky-600 hover:via-indigo-700 hover:to-sky-700 text-white font-black text-sm sm:text-base shadow-xl shadow-sky-600/25 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {uploadingAvatar ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'bn' ? 'ছবি আপলোড হচ্ছে...' : 'Uploading photo...'}</span>
              </span>
            ) : loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating account...'}</span>
              </span>
            ) : (
              <>
                <span>{lang === 'bn' ? 'ফ্রি রেজিস্ট্রেশন সম্পন্ন করুন' : 'Complete Free Registration'}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Trust & Security Notice */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              {lang === 'bn'
                ? 'আপনার সকল তথ্য এবং লেনদেন সম্পূর্ণ এনক্রিপ্টেড ও সুরক্ষিত'
                : 'All your data and transactions are 256-bit encrypted and safe'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
            <span>{lang === 'bn' ? 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে? ' : 'Already have an account? '}</span>
            <Link href="/login" className="font-extrabold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1">
              <span>{t('login')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
