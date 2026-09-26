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
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-600/20">
            <UserCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === 'bn'
              ? 'একটি অ্যাকাউন্ট থেকেই আপনি বায়ার, সেলার ও সার্ভিস প্রোভাইডার হিসেবে কাজ করতে পারবেন'
              : 'Single account for Buyer, Seller, and Service Provider'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Profile Picture Upload Section */}
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white dark:border-slate-800 shadow-md bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-200 text-xl font-bold">
                    {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : <Camera className="w-7 h-7 opacity-70" />}
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
                title={lang === 'bn' ? 'ছবি যুক্ত করুন' : 'Upload Avatar'}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow border-2 border-white dark:border-slate-900 transition hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                <span>{lang === 'bn' ? 'প্রোফাইল ছবি (ঐচ্ছিক)' : 'Profile Picture (Optional)'}</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {lang === 'bn'
                  ? 'রেজিস্ট্রেশনের সময়ই ছবি যুক্ত করুন অথবা পরেও প্রোফাইল সেটিংসে পরিবর্তন করতে পারবেন।'
                  : 'Add your photo now to build instant trust, or update later in settings.'}
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] shadow-xs flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3 h-3" />
                  <span>{avatarPreview ? (lang === 'bn' ? 'ছবি পরিবর্তন' : 'Change') : (lang === 'bn' ? 'ছবি আপলোড' : 'Upload Photo')}</span>
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'মুছুন' : 'Remove'}</span>
                  </button>
                )}
              </div>

              {avatarMessage && (
                <div
                  className={`p-2 rounded-lg text-[10.5px] flex items-center gap-1.5 mt-1 ${
                    avatarMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}
                >
                  {avatarMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span>{avatarMessage.text}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ফার্স্ট নেম *' : 'First Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Rahim"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'লাস্ট নেম *' : 'Last Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Ahmed"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Phone *'}
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 01712345678"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ইমেইল *' : 'Email Address *'}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ব্যবসা / স্টোরের নাম (ঐচ্ছিক)' : 'Business / Store Name (Optional)'}
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. TrustTech BD"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ঠিকানা (Address)' : 'Address'}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Mirpur, Dhaka"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'পাসওয়ার্ড *' : 'Password *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'কনফার্ম পাসওয়ার্ড *' : 'Confirm Password *'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Optional Referral Code Box */}
          <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'bn' ? 'রেফারেল কোড (ঐচ্ছিক)' : 'Referral Code (Optional)'}</span>
              </label>
              {formData.referralCode && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {lang === 'bn' ? '✓ রেফারেল কোড যুক্ত হয়েছে' : '✓ Referral code applied'}
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              placeholder={lang === 'bn' ? 'যেমন: Rahim2345 (যদি কেউ রেফার করে থাকে)' : 'e.g. Rahim2345'}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-xs font-mono text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploadingAvatar}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {uploadingAvatar ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'bn' ? 'ছবি আপলোড হচ্ছে...' : 'Uploading photo...'}</span>
              </span>
            ) : loading ? (
              <span>{lang === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating account...'}</span>
            ) : (
              <>
                <span>{lang === 'bn' ? 'রেজিস্ট্রেশন সম্পন্ন করুন' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
          <span>{lang === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? ' : 'Already have an account? '}</span>
          <Link href="/login" className="font-bold text-sky-600 hover:underline">
            {t('login')}
          </Link>
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
