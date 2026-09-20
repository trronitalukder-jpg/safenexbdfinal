'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { compressImage, getImageUrl } from '@/lib/imageUtils';
import {
  Settings,
  Palette,
  Search,
  Activity,
  Clock,
  LayoutTemplate,
  ShieldCheck,
  UploadCloud,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Send,
  MessageCircle,
  AlertCircle,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Save,
  CheckCircle2,
  FileCode,
  Sliders,
  DollarSign,
  Share2,
  Users,
  GitFork,
  Workflow,
  Zap,
  Database,
  Trash2,
  HardDrive,
  Cpu,
  Gauge,
  AlertTriangle,
  Flame,
} from 'lucide-react';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function AdminSettingsPage() {
  const { lang } = useLanguage();
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<
    'general' | 'seo' | 'tracking' | 'localization' | 'footer' | 'system' | 'withdrawal' | 'operations' | 'performance'
  >('general');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCapiToken, setShowCapiToken] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Maintenance & Database Health state
  const [maintenanceStats, setMaintenanceStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [cleaningAction, setCleaningAction] = useState<string | null>(null);
  const [cleanupMessage, setCleanupMessage] = useState('');

  // Settings State
  const [settings, setSettings] = useState<any>({
    general: {
      siteName: 'SafnexBD',
      siteTagline: 'Secure Escrow & P2P Marketplace in Bangladesh',
      logoType: 'TEXT',
      logoText: 'SafnexBD',
      logoAccent: '#f59e0b',
      logoLightUrl: '',
      logoDarkUrl: '',
      faviconUrl: '',
    },
    seo: {
      metaTitle: 'SafnexBD - Secure Escrow Marketplace in Bangladesh',
      titleSeparator: '|',
      metaDescription:
        'Buy and sell digital assets, physical goods, services, and exchange money securely with automated escrow protection.',
      metaKeywords:
        'escrow bangladesh, buy sell online, digital goods, p2p escrow, safe payment, bkash escrow, nagad escrow',
      canonicalUrl: 'https://safnexbd.com',
      ogTitle: 'SafnexBD - Bangladesh Escrow Platform',
      ogDescription:
        'Experience zero-risk transactions with buyer and seller protection on SafnexBD.',
      ogImage: '',
      twitterCard: 'summary_large_image',
      twitterHandle: '@safnexbd',
      googleSiteVerification: '',
      bingSiteVerification: '',
      robotsIndexing: true,
    },
    tracking: {
      facebookPixelId: '',
      facebookCapiToken: '',
      facebookTestEventCode: '',
      googleAnalyticsId: '',
      gtmId: '',
      tiktokPixelId: '',
      customHeadScripts: '',
      customBodyScripts: '',
    },
    localization: {
      timezone: 'Asia/Dhaka',
      currencySymbol: '৳',
      currencyCode: 'BDT',
      currencyPosition: 'BEFORE',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12H',
      defaultLanguage: 'bn',
    },
    footer: {
      copyrightText: '© 2026 SafnexBD. All rights reserved.',
      aboutText:
        'SafnexBD is Bangladesh’s premier multi-category digital escrow marketplace ensuring 100% security for online transactions, digital services, and physical products.',
      supportEmail: 'support@safnexbd.com',
      supportPhone: '+880 1700-000000',
      whatsappNumber: '+880 1700-000000',
      officeAddress: 'House #12, Road #5, Dhanmondi, Dhaka-1205, Bangladesh',
      socialFacebook: 'https://facebook.com/safnexbd',
      socialYoutube: 'https://youtube.com/@safnexbd',
      socialTelegram: 'https://t.me/safnexbd',
      socialWhatsapp: 'https://wa.me/8801700000000',
      socialTwitter: 'https://twitter.com/safnexbd',
      socialLinkedin: 'https://linkedin.com/company/safnexbd',
      socialInstagram: 'https://instagram.com/safnexbd',
      noticeBarEnabled: false,
      noticeBarText:
        '🎉 Welcome to SafnexBD! Fast, secure, and automated escrow for all your transactions.',
    },
    system: {
      maintenanceMode: false,
      maintenanceMessage:
        'We are currently upgrading our platform to serve you better. We will be back shortly.',
      allowRegistration: true,
      requireKycForWithdraw: false,
    },
    withdrawal: {
      requirePasswordForPayoutAccount: true,
      autoSaveWithdrawalAccount: true,
      requirePasswordFirstWithdraw: true,
      cancelPendingWithdrawEnabled: true,
      freezeAfterPasswordChange: true,
      freezeDurationHours: 24,
      dailyWithdrawLimitUnverified: 5000,
      dailyWithdrawLimitVerified: 50000,
    },
    operations: {
      workloadDistributionEnabled: false,
      distributionAlgorithm: 'CLAIM_POOL',
      maxConcurrentTasksPerStaff: 5,
      lockDurationMinutes: 10,
      autoReleaseInactiveMinutes: 15,
      peerReassignmentEnabled: true,
      escalationEnabled: true,
      requireHandoverNotes: true,
      slaWarningMinutes: 15,
      slaBreachMinutes: 30,
    },
    performance: {
      maxImageSizeMb: 2,
      enableClientCompression: true,
      compressionQuality: 80,
      maxChatAttachmentsPerMsg: 4,
      maxLoginAttemptsBeforeLockout: 5,
      lockoutDurationMinutes: 15,
      otpCooldownSeconds: 60,
      maxDailyOtpPerUser: 5,
      maxDailyWithdrawRequests: 5,
      maxDailyRechargeRequests: 10,
      defaultPageSize: 20,
      maxPageSize: 50,
      chatHistoryInitialLimit: 30,
      autoCleanExpiredOtpDays: 30,
      autoCleanAuditLogsDays: 180,
    },
  });

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res: any = await api.get('/settings/admin');
      const data = res?.data !== undefined ? res.data : res;
      if (data && typeof data === 'object') {
        setSettings((prev: any) => ({
          general: { ...prev.general, ...(data.general || {}) },
          seo: { ...prev.seo, ...(data.seo || {}) },
          tracking: { ...prev.tracking, ...(data.tracking || {}) },
          localization: { ...prev.localization, ...(data.localization || {}) },
          footer: { ...prev.footer, ...(data.footer || {}) },
          system: { ...prev.system, ...(data.system || {}) },
          withdrawal: { ...prev.withdrawal, ...(data.withdrawal || {}) },
          operations: { ...prev.operations, ...(data.operations || {}) },
          performance: { ...prev.performance, ...(data.performance || {}) },
        }));
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setErrorMessage(
        lang === 'bn'
          ? 'সেটিংস লোড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to load website settings. Please check your network and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceStats = async () => {
    setLoadingStats(true);
    try {
      const res: any = await api.get('/settings/maintenance/stats');
      const data = res?.data !== undefined ? res.data : res;
      setMaintenanceStats(data);
    } catch (err) {
      console.error('Failed to load maintenance stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchMaintenanceStats();
    }
  }, [activeTab]);

  const handleCleanExpiredOtps = async () => {
    if (!confirm(lang === 'bn' ? 'আপনি কি সকল এক্সপায়ার্ড ওটিপি রেকর্ড মুছে ফেলতে চান?' : 'Are you sure you want to clean all expired OTPs?')) return;
    setCleaningAction('otps');
    setCleanupMessage('');
    try {
      const res: any = await api.post('/settings/maintenance/clean-otps', {
        days: Number(settings.performance?.autoCleanExpiredOtpDays) || 7,
      });
      const data = res?.data !== undefined ? res.data : res;
      setCleanupMessage(
        lang === 'bn'
          ? `সফলভাবে ${data.deletedCount || 0}টি এক্সপায়ার্ড ওটিপি রেকর্ড ক্লিন করা হয়েছে!`
          : `Successfully cleaned ${data.deletedCount || 0} expired OTP records!`
      );
      fetchMaintenanceStats();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to clean OTPs');
    } finally {
      setCleaningAction(null);
    }
  };

  const handleCleanAuditLogs = async () => {
    if (!confirm(lang === 'bn' ? 'আপনি কি পুরনো সিস্টেম অডিট লগ মুছে ফেলতে চান? (আর্থিক লেনদেন ছাড়া)' : 'Are you sure you want to clean old non-financial audit logs?')) return;
    setCleaningAction('audit');
    setCleanupMessage('');
    try {
      const res: any = await api.post('/settings/maintenance/clean-audit-logs', {
        days: Number(settings.performance?.autoCleanAuditLogsDays) || 180,
      });
      const data = res?.data !== undefined ? res.data : res;
      setCleanupMessage(
        lang === 'bn'
          ? `সফলভাবে ${data.deletedCount || 0}টি পুরনো সিস্টেম লগ ক্লিন করা হয়েছে!`
          : `Successfully cleaned ${data.deletedCount || 0} old system logs!`
      );
      fetchMaintenanceStats();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to clean audit logs');
    } finally {
      setCleaningAction(null);
    }
  };

  const handleFlushServerLogs = async () => {
    if (!confirm(lang === 'bn' ? 'সার্ভার লগ ফ্লাশ করতে চান?' : 'Do you want to flush server logs?')) return;
    setCleaningAction('logs');
    setCleanupMessage('');
    try {
      await api.post('/settings/maintenance/flush-logs', {});
      setCleanupMessage(
        lang === 'bn'
          ? 'সার্ভার লগ ফাইল সফলভাবে ফ্লাশ ও পরিষ্কার করা হয়েছে!'
          : 'Server log files successfully flushed!'
      );
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to flush logs');
    } finally {
      setCleaningAction(null);
    }
  };

  const handleSave = async (categoryToSave?: string) => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const payload = categoryToSave
        ? {
            category: categoryToSave,
            data: settings[categoryToSave],
          }
        : settings;

      const res: any = await api.post('/settings/admin', payload);
      const data = res?.data !== undefined ? res.data : res;
      if (data && typeof data === 'object') {
        setSettings((prev: any) => ({
          general: { ...prev.general, ...(data.general || {}) },
          seo: { ...prev.seo, ...(data.seo || {}) },
          tracking: { ...prev.tracking, ...(data.tracking || {}) },
          localization: { ...prev.localization, ...(data.localization || {}) },
          footer: { ...prev.footer, ...(data.footer || {}) },
          system: { ...prev.system, ...(data.system || {}) },
          withdrawal: { ...prev.withdrawal, ...(data.withdrawal || {}) },
          operations: { ...prev.operations, ...(data.operations || {}) },
          performance: { ...prev.performance, ...(data.performance || {}) },
        }));
      }

      setSaveSuccess(true);
      refreshSettings();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMessage(
        err.response?.data?.message ||
          (lang === 'bn' ? 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে!' : 'Failed to save settings!'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = `${category}.${field}`;
    setUploadingField(uploadKey);
    try {
      const compressed = await compressImage(file, 800, 800, 0.85);
      const res: any = await api.post('/uploads', {
        base64Data: compressed.base64Data,
        fileName: compressed.fileName,
        folder: 'branding',
      });
      const url = res?.data?.url || res?.url;
      if (url) {
        setSettings((prev: any) => ({
          ...prev,
          [category]: {
            ...prev[category],
            [field]: url,
          },
        }));
      }
    } catch (err) {
      console.error('File upload failed:', err);
      alert(lang === 'bn' ? 'ফাইল আপলোড ব্যর্থ হয়েছে' : 'File upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const tabs = [
    {
      id: 'general' as const,
      label: lang === 'bn' ? 'ব্র্যান্ডিং ও লোগো' : 'General & Branding',
      icon: Palette,
      desc: lang === 'bn' ? 'লোগো, ফেভিকন, প্ল্যাটফর্মের নাম ও কালার' : 'Logo, favicon, site name & branding',
    },
    {
      id: 'seo' as const,
      label: lang === 'bn' ? 'এসইও (SEO A-Z)' : 'SEO & Metadata',
      icon: Search,
      desc: lang === 'bn' ? 'টাইটেল, মেটা ডেসক্রিপশন ও সোশ্যাল কার্ড' : 'Meta tags, OpenGraph & search previews',
    },
    {
      id: 'tracking' as const,
      label: lang === 'bn' ? 'পিক্সেল ও ট্র্যাকিং' : 'Pixel & Tracking',
      icon: Activity,
      desc: lang === 'bn' ? 'Facebook Pixel, CAPI, GTM, GA4 ও স্ক্রিপ্ট' : 'Meta CAPI, GTM, GA4 & custom scripts',
    },
    {
      id: 'localization' as const,
      label: lang === 'bn' ? 'টাইমজোন ও মুদ্রা' : 'Timezone & Regional',
      icon: Clock,
      desc: lang === 'bn' ? 'টাইমজোন, কারেন্সি সিম্বল ও তারিখ ফরম্যাট' : 'Timezone, currency & date formats',
    },
    {
      id: 'footer' as const,
      label: lang === 'bn' ? 'ফুটার ও সোশ্যাল' : 'Footer & Contacts',
      icon: LayoutTemplate,
      desc: lang === 'bn' ? 'কপিরাইট, সাপোর্ট কন্টাক্ট ও সোশ্যাল লিঙ্ক' : 'Copyright, contact info & social links',
    },
    {
      id: 'system' as const,
      label: lang === 'bn' ? 'সিকিউরিটি ও সিস্টেম' : 'System & Security',
      icon: ShieldCheck,
      desc: lang === 'bn' ? 'মেইনটেন্যান্স মোড ও রেজিস্ট্রেশন নিয়ন্ত্রণ' : 'Maintenance mode & registration gate',
    },
    {
      id: 'withdrawal' as const,
      label: lang === 'bn' ? 'উইথড্র ও নিরাপত্তা' : 'Withdrawal & Security',
      icon: DollarSign,
      desc: lang === 'bn' ? 'পাসওয়ার্ড যাচাই, অটো-সেভ ও লিমিট কন্ট্রোল' : 'Password checks, auto-save & limits',
    },
    {
      id: 'operations' as const,
      label: lang === 'bn' ? 'ওয়ার্কলোড ও স্টাফ' : 'Operations & Workload',
      icon: Users,
      desc: lang === 'bn' ? 'অটো-বণ্টন, ক্লেইম কিউ, এসকেলেশন ও SLA' : 'Auto-distribution, claim queue, reassignment & SLA',
    },
    {
      id: 'performance' as const,
      label: lang === 'bn' ? 'স্পিড ও লিমিট কন্ট্রোল' : 'Speed & Limits Control',
      icon: Zap,
      desc: lang === 'bn' ? 'ইমেজ কম্প্রেশন, এপিআই/ওটিপি রেট লিমিট ও ডাটা ক্লিনআপ' : 'Image compression, rate limits, OTP limits & cleanup',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm font-medium">
          {lang === 'bn' ? 'ওয়েবসাইট সেটিংস লোড হচ্ছে...' : 'Loading website configurations...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Settings className="w-6 h-6" />
            </div>
            <span>{lang === 'bn' ? 'ওয়েবসাইট সেটিংস ও কন্ট্রোল' : 'Website Settings & Configuration'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'ব্র্যান্ডিং, এসইও, পিক্সেল ট্র্যাকিং, টাইমজোন, ফুটার ও নিরাপত্তা কনফিগারেশন সম্পূর্ণ নিয়ন্ত্রণ করুন।'
              : 'Complete production management of branding, SEO metadata, pixel tracking, timezones, and footer links.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 text-slate-950" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {saving
                ? lang === 'bn'
                  ? 'সংরক্ষণ হচ্ছে...'
                  : 'Saving...'
                : saveSuccess
                ? lang === 'bn'
                  ? 'সংরক্ষিত হয়েছে!'
                  : 'Saved Successfully!'
                : lang === 'bn'
                ? 'সব সেভ করুন'
                : 'Save All Settings'}
            </span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>
            {lang === 'bn'
              ? 'ওয়েবসাইট সেটিংস সফলভাবে সংরক্ষিত ও কার্যকর হয়েছে!'
              : 'Website settings updated and synchronized successfully across the platform!'}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center sm:items-start p-3 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="font-bold text-xs">{tab.label}</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full hidden sm:block mt-1">
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General & Branding */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'bn' ? 'প্ল্যাটফর্ম ব্র্যান্ডিং ও লোগো' : 'Platform Identity & Logo'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'টেক্সট লোগো, ইমেজ লিঙ্ক অথবা সরাসরি ফাইল আপলোড সিলেক্ট করুন।'
                    : 'Configure logo display mode, favicon, platform name, and accent colors.'}
                </p>
              </div>

              <button
                onClick={() => handleSave('general')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-400 dark:hover:text-slate-950 rounded-xl text-xs font-bold transition"
              >
                {lang === 'bn' ? 'ব্র্যান্ডিং সেভ করুন' : 'Save Branding'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Site Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'ওয়েবসাইটের নাম (Site Name)' : 'Website Title / Platform Name'}
                </label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      general: { ...p.general, siteName: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Site Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'স্লোগান / ট্যাগলাইন (Tagline)' : 'Site Slogan / Tagline'}
                </label>
                <input
                  type="text"
                  value={settings.general.siteTagline}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      general: { ...p.general, siteTagline: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Logo Configuration Mode */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'লোগো ডিসপ্লে মোড নির্বাচন করুন' : 'Select Logo Display Mode'}
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'TEXT', label: lang === 'bn' ? 'টেক্সট লোগো' : 'Text Logo', desc: 'Custom Typography' },
                  { id: 'IMAGE_URL', label: lang === 'bn' ? 'ইমেজ লিঙ্ক (URL)' : 'Image Link (URL)', desc: 'CDN or External' },
                  { id: 'IMAGE_UPLOAD', label: lang === 'bn' ? 'সরাসরি ফাইল আপলোড' : 'Direct Upload', desc: 'Local Storage' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      setSettings((p: any) => ({
                        ...p,
                        general: { ...p.general, logoType: mode.id },
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.general.logoType === mode.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs">{mode.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Logo Inputs */}
            {settings.general.logoType === 'TEXT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'লোগো টেক্সট' : 'Logo Text Display'}
                  </label>
                  <input
                    type="text"
                    value={settings.general.logoText}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        general: { ...p.general, logoText: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'একসেন্ট কালার (Accent Color)' : 'Logo Accent Color (HEX)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.general.logoAccent || '#f59e0b'}
                      onChange={(e) =>
                        setSettings((p: any) => ({
                          ...p,
                          general: { ...p.general, logoAccent: e.target.value },
                        }))
                      }
                      className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.general.logoAccent || '#f59e0b'}
                      onChange={(e) =>
                        setSettings((p: any) => ({
                          ...p,
                          general: { ...p.general, logoAccent: e.target.value },
                        }))
                      }
                      className="w-32 px-3 py-2 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {settings.general.logoType === 'IMAGE_URL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'লাইট মোড লোগো লিঙ্ক (Light Mode URL)' : 'Light Mode Logo URL'}
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo-light.png"
                    value={settings.general.logoLightUrl || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        general: { ...p.general, logoLightUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'ডার্ক মোড লোগো লিঙ্ক (Dark Mode URL)' : 'Dark Mode Logo URL'}
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo-dark.png"
                    value={settings.general.logoDarkUrl || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        general: { ...p.general, logoDarkUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {settings.general.logoType === 'IMAGE_UPLOAD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                {/* Light Logo Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'লাইট মোড লোগো আপলোড' : 'Light Mode Logo File'}
                  </label>
                  <div className="flex items-center gap-3">
                    {settings.general.logoLightUrl ? (
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-[140px] max-h-12 overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(settings.general.logoLightUrl)}
                          alt="Logo Preview"
                          className="max-h-8 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">No image uploaded</div>
                    )}
                    <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                      <span>{uploadingField === 'general.logoLightUrl' ? 'Uploading...' : 'Choose File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'general', 'logoLightUrl')}
                      />
                    </label>
                  </div>
                </div>

                {/* Dark Logo Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'ডার্ক মোড লোগো আপলোড' : 'Dark Mode Logo File'}
                  </label>
                  <div className="flex items-center gap-3">
                    {settings.general.logoDarkUrl ? (
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-700 max-w-[140px] max-h-12 overflow-hidden flex items-center justify-center">
                        <img
                          src={getImageUrl(settings.general.logoDarkUrl)}
                          alt="Dark Logo Preview"
                          className="max-h-8 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">No image uploaded</div>
                    )}
                    <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                      <span>{uploadingField === 'general.logoDarkUrl' ? 'Uploading...' : 'Choose File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'general', 'logoDarkUrl')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Favicon Setup */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'ওয়েবসাইট ফেভিকন (Browser Tab Favicon)' : 'Browser Favicon (32x32)'}
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {settings.general.faviconUrl ? (
                    <img
                      src={getImageUrl(settings.general.faviconUrl)}
                      alt="Favicon"
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-amber-500">T</span>
                  )}
                </div>

                <div className="flex-1 w-full space-y-1">
                  <input
                    type="text"
                    placeholder="Favicon image URL or upload below..."
                    value={settings.general.faviconUrl || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        general: { ...p.general, faviconUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <label className="cursor-pointer px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                  <span>{uploadingField === 'general.faviconUrl' ? 'Uploading...' : 'Upload Favicon'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'general', 'faviconUrl')}
                  />
                </label>
              </div>
            </div>

            {/* Live Header Branding Preview */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Navigation Branding Preview</span>
              </span>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.general.faviconUrl && (
                    <img
                      src={getImageUrl(settings.general.faviconUrl)}
                      alt="ico"
                      className="w-5 h-5 object-contain"
                    />
                  )}
                  {settings.general.logoType === 'TEXT' ? (
                    <div className="text-lg font-black tracking-tight text-white flex items-center">
                      <span>{settings.general.logoText || 'SafnexBD'}</span>
                      <span
                        className="ml-1 w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: settings.general.logoAccent || '#f59e0b' }}
                      />
                    </div>
                  ) : settings.general.logoDarkUrl || settings.general.logoLightUrl ? (
                    <img
                      src={getImageUrl(settings.general.logoDarkUrl || settings.general.logoLightUrl)}
                      alt="Brand Logo"
                      className="h-7 object-contain"
                    />
                  ) : (
                    <span className="text-base font-bold text-amber-400">SafnexBD</span>
                  )}
                </div>

                <div className="text-xs text-slate-400 hidden sm:block italic">
                  {settings.general.siteTagline}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SEO & Metadata */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'bn' ? 'সার্চ ইঞ্জিন অপ্টিমাইজেশন (SEO A to Z)' : 'Search Engine Optimization (SEO)'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'গুগল সার্চ ও সোশ্যাল মিডিয়া শেয়ারিং প্রিভিউ সহ সম্পূর্ণ মেটাট্যাগ কনফিগারেশন।'
                    : 'Configure meta title, description, OpenGraph tags, and search engine verification.'}
                </p>
              </div>

              <button
                onClick={() => handleSave('seo')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-400 dark:hover:text-slate-950 rounded-xl text-xs font-bold transition"
              >
                {lang === 'bn' ? 'এসইও সেভ করুন' : 'Save SEO'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Meta Title */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'প্রধান মেটা টাইটেল (Meta Title)' : 'Default Meta Title'}
                </label>
                <input
                  type="text"
                  value={settings.seo.metaTitle}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      seo: { ...p.seo, metaTitle: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {/* Title Separator */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'টাইটেল সেপারেটর' : 'Title Separator'}
                </label>
                <select
                  value={settings.seo.titleSeparator || '|'}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      seo: { ...p.seo, titleSeparator: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="|">| (Pipe)</option>
                  <option value="-">- (Hyphen)</option>
                  <option value="•">• (Bullet)</option>
                  <option value="—">— (Em Dash)</option>
                </select>
              </div>
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'মেটা ডেসক্রিপশন (Meta Description)' : 'Meta Description'}
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    (settings.seo.metaDescription?.length || 0) >= 120 &&
                    (settings.seo.metaDescription?.length || 0) <= 165
                      ? 'text-emerald-500 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {settings.seo.metaDescription?.length || 0} / 160 characters
                </span>
              </div>
              <textarea
                rows={3}
                value={settings.seo.metaDescription || ''}
                onChange={(e) =>
                  setSettings((p: any) => ({
                    ...p,
                    seo: { ...p.seo, metaDescription: e.target.value },
                  }))
                }
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Meta Keywords & Canonical */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'মেটা কীওয়ার্ডস (কমা দিয়ে আলাদা করুন)' : 'Meta Keywords (comma separated)'}
                </label>
                <input
                  type="text"
                  value={settings.seo.metaKeywords || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      seo: { ...p.seo, metaKeywords: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'ক্যানোনিকাল ডোমেন URL' : 'Canonical Base URL'}
                </label>
                <input
                  type="url"
                  value={settings.seo.canonicalUrl || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      seo: { ...p.seo, canonicalUrl: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* OpenGraph & Social Sharing */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-500" />
                <span>OpenGraph & Social Share Cards</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    OG Card Title
                  </label>
                  <input
                    type="text"
                    value={settings.seo.ogTitle || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        seo: { ...p.seo, ogTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Twitter / X Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@safnexbd"
                    value={settings.seo.twitterHandle || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        seo: { ...p.seo, twitterHandle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* OG Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  OpenGraph Share Image (1200 x 630 px recommended)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="https://example.com/og-image.jpg"
                    value={settings.seo.ogImage || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        seo: { ...p.seo, ogImage: e.target.value },
                      }))
                    }
                    className="flex-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                  <label className="cursor-pointer px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-shrink-0">
                    <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                    <span>{uploadingField === 'seo.ogImage' ? 'Uploading...' : 'Upload OG Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'seo', 'ogImage')}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Webmaster Verifications & Indexing */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Google Search Console Verification Code
                </label>
                <input
                  type="text"
                  placeholder="google-site-verification=..."
                  value={settings.seo.googleSiteVerification || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      seo: { ...p.seo, googleSiteVerification: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Search Engine Indexation (Robots Policy)
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="robotsIndexing"
                    checked={settings.seo.robotsIndexing !== false}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        seo: { ...p.seo, robotsIndexing: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="robotsIndexing" className="text-xs text-slate-700 dark:text-slate-300">
                    Allow Search Engines to Index this Website (<span className="font-mono text-amber-500">index, follow</span>)
                  </label>
                </div>
              </div>
            </div>

            {/* Live Google Search Snippet Preview */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Live Google Search Snippet Preview</span>
              </span>

              <div className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono truncate">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{settings.seo.canonicalUrl || 'https://safnexbd.com'}</span>
                </div>
                <div className="text-base text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium leading-snug">
                  {settings.seo.metaTitle || 'SafnexBD - Secure Escrow Marketplace'} {settings.seo.titleSeparator || '|'} {settings.general.siteName}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {settings.seo.metaDescription || 'Buy and sell safely in Bangladesh with automated escrow protection.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pixel & Tracking */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'bn' ? 'পিক্সেল ও সার্ভার সাইড ট্র্যাকিং' : 'Pixel & Server-Side Tracking'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'Meta Pixel, Conversions API (CAPI), Google Tag Manager, GA4 এবং কাস্টম স্ক্রিপ্ট।'
                    : 'Manage analytics pixels, Meta Conversions API (CAPI), and custom tracking tags.'}
                </p>
              </div>

              <button
                onClick={() => handleSave('tracking')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-400 dark:hover:text-slate-950 rounded-xl text-xs font-bold transition"
              >
                {lang === 'bn' ? 'ট্র্যাকিং সেভ করুন' : 'Save Tracking'}
              </button>
            </div>

            {/* Meta / Facebook Pixel & CAPI */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <FacebookIcon className="w-4 h-4" />
                <span>Meta / Facebook Pixel & Conversions API (CAPI)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Meta Pixel ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1029384756102938"
                    value={settings.tracking.facebookPixelId || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        tracking: { ...p.tracking, facebookPixelId: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Meta CAPI Test Event Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TEST12345 (Optional)"
                    value={settings.tracking.facebookTestEventCode || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        tracking: { ...p.tracking, facebookTestEventCode: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* CAPI Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Meta Conversions API (CAPI) System User Access Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCapiToken(!showCapiToken)}
                    className="text-xs text-amber-500 hover:underline flex items-center gap-1"
                  >
                    {showCapiToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showCapiToken ? 'Hide Secret' : 'Show Secret'}</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="EAAG..."
                  value={settings.tracking.facebookCapiToken || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      tracking: { ...p.tracking, facebookCapiToken: e.target.value },
                    }))
                  }
                  className={`w-full p-3 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white ${
                    !showCapiToken ? 'filter blur-xs select-none' : ''
                  }`}
                />
              </div>
            </div>

            {/* Google & TikTok Tracking */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>Google & Other Analytics</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Google Tag Manager (GTM)
                  </label>
                  <input
                    type="text"
                    placeholder="GTM-XXXXXXX"
                    value={settings.tracking.gtmId || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        tracking: { ...p.tracking, gtmId: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Google Analytics 4 (GA4) ID
                  </label>
                  <input
                    type="text"
                    placeholder="G-XXXXXXXXXX"
                    value={settings.tracking.googleAnalyticsId || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        tracking: { ...p.tracking, googleAnalyticsId: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    TikTok Pixel ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. C8XXXXX"
                    value={settings.tracking.tiktokPixelId || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        tracking: { ...p.tracking, tiktokPixelId: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Custom Scripts */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-500" />
                <span>Custom HTML / Tracking Script Injection</span>
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Header Custom Scripts (Injected inside <span className="font-mono text-amber-500">&lt;head&gt;</span>)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="<!-- Custom Analytics or Verification Script -->"
                    value={settings.tracking.customHeadScripts || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        tracking: { ...p.tracking, customHeadScripts: e.target.value },
                      }))
                    }
                    className="w-full p-3 font-mono text-xs bg-slate-950 text-slate-200 rounded-xl border border-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Body Custom Scripts (Injected before closing <span className="font-mono text-amber-500">&lt;/body&gt;</span>)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="<!-- Chat Widget or noscript tags -->"
                    value={settings.tracking.customBodyScripts || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        tracking: { ...p.tracking, customBodyScripts: e.target.value },
                      }))
                    }
                    className="w-full p-3 font-mono text-xs bg-slate-950 text-slate-200 rounded-xl border border-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Timezone & Regional */}
      {activeTab === 'localization' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'bn' ? 'টাইমজোন ও মুদ্রা সেটিংস' : 'Timezone & Localization'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'ওয়েবসাইটের ডিফল্ট সময় অঞ্চল, মুদ্রা প্রতীক ও পজিশন নির্বাচন করুন।'
                    : 'Configure default timezone, currency code, position, and default language.'}
                </p>
              </div>

              <button
                onClick={() => handleSave('localization')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-400 dark:hover:text-slate-950 rounded-xl text-xs font-bold transition"
              >
                {lang === 'bn' ? 'টাইমজোন সেভ করুন' : 'Save Localization'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Platform Timezone
                </label>
                <select
                  value={settings.localization.timezone || 'Asia/Dhaka'}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      localization: { ...p.localization, timezone: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+06:00 - Bangladesh)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (GMT+05:30 - India)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+04:00 - UAE)</option>
                  <option value="Europe/London">Europe/London (GMT+00:00 - UK)</option>
                  <option value="America/New_York">America/New_York (GMT-05:00 - US)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                </select>
              </div>

              {/* Currency Symbol */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.localization.currencySymbol || '৳'}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      localization: { ...p.localization, currencySymbol: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Currency Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={settings.localization.currencyCode || 'BDT'}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      localization: { ...p.localization, currencyCode: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Currency Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Currency Symbol Position
                </label>
                <select
                  value={settings.localization.currencyPosition || 'BEFORE'}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      localization: { ...p.localization, currencyPosition: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="BEFORE">Prefix (e.g. ৳500)</option>
                  <option value="AFTER">Suffix (e.g. 500৳)</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date Format
                </label>
                <select
                  value={settings.localization.dateFormat || 'DD/MM/YYYY'}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      localization: { ...p.localization, dateFormat: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 18/09/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-18)</option>
                  <option value="MMM DD, YYYY">MMM DD, YYYY (e.g. Sep 18, 2026)</option>
                </select>
              </div>

              {/* Default Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Platform Language
                </label>
                <select
                  value={settings.localization.defaultLanguage || 'bn'}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      localization: { ...p.localization, defaultLanguage: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Live Currency Preview Badge */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Sample Formatted Amount:
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {settings.localization.currencyPosition === 'AFTER'
                  ? `2,500.00 ${settings.localization.currencySymbol}`
                  : `${settings.localization.currencySymbol} 2,500.00`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Footer & Contacts */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'bn' ? 'ফুটার টেক্সট ও কন্টাক্ট ইনফো' : 'Footer Content & Contact Channels'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'কপিরাইট নোটিশ, প্ল্যাটফর্ম বায়ো, সাপোর্ট ফোন/ইমেইল এবং সোশ্যাল লিংক সেট করুন।'
                    : 'Manage platform footer blurb, copyright text, contact phone numbers, and social links.'}
                </p>
              </div>

              <button
                onClick={() => handleSave('footer')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-400 dark:hover:text-slate-950 rounded-xl text-xs font-bold transition"
              >
                {lang === 'bn' ? 'ফুটার সেভ করুন' : 'Save Footer'}
              </button>
            </div>

            {/* Copyright & About Bio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Copyright Notice
                </label>
                <input
                  type="text"
                  value={settings.footer.copyrightText || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      footer: { ...p.footer, copyrightText: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={settings.footer.supportEmail || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      footer: { ...p.footer, supportEmail: e.target.value },
                    }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Phone, WhatsApp, Office */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Support Phone Number
                </label>
                <input
                  type="text"
                  value={settings.footer.supportPhone || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      footer: { ...p.footer, supportPhone: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={settings.footer.whatsappNumber || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      footer: { ...p.footer, whatsappNumber: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Office / Headquarters Address
                </label>
                <input
                  type="text"
                  value={settings.footer.officeAddress || ''}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      footer: { ...p.footer, officeAddress: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Platform Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Footer About / Bio Description
              </label>
              <textarea
                rows={2}
                value={settings.footer.aboutText || ''}
                onChange={(e) =>
                  setSettings((p: any) => ({
                    ...p,
                    footer: { ...p.footer, aboutText: e.target.value },
                  }))
                }
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Social Media Links */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-500" />
                <span>Official Social Media Channels</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <FacebookIcon className="w-3.5 h-3.5 text-blue-600" /> Facebook Page
                  </span>
                  <input
                    type="url"
                    value={settings.footer.socialFacebook || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        footer: { ...p.footer, socialFacebook: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <YoutubeIcon className="w-3.5 h-3.5 text-red-600" /> YouTube Channel
                  </span>
                  <input
                    type="url"
                    value={settings.footer.socialYoutube || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        footer: { ...p.footer, socialYoutube: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" /> Telegram Channel
                  </span>
                  <input
                    type="url"
                    value={settings.footer.socialTelegram || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        footer: { ...p.footer, socialTelegram: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <TwitterIcon className="w-3.5 h-3.5 text-sky-400" /> Twitter / X
                  </span>
                  <input
                    type="url"
                    value={settings.footer.socialTwitter || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        footer: { ...p.footer, socialTwitter: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <LinkedinIcon className="w-3.5 h-3.5 text-blue-700" /> LinkedIn
                  </span>
                  <input
                    type="url"
                    value={settings.footer.socialLinkedin || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        footer: { ...p.footer, socialLinkedin: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-500" /> Instagram
                  </span>
                  <input
                    type="url"
                    value={settings.footer.socialInstagram || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        footer: { ...p.footer, socialInstagram: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Notice Banner */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Top Announcement / Emergency Notice Banner
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="noticeEnabled"
                    checked={settings.footer.noticeBarEnabled === true}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        footer: { ...p.footer, noticeBarEnabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="noticeEnabled" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Enable Top Banner
                  </label>
                </div>
              </div>

              <input
                type="text"
                placeholder="Important Announcement Text..."
                value={settings.footer.noticeBarText || ''}
                onChange={(e) =>
                  setSettings((p: any) => ({
                    ...p,
                    footer: { ...p.footer, noticeBarText: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: System & Security */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'bn' ? 'সিস্টেম ও সিকিউরিটি কন্ট্রোল' : 'System Operations & Access Control'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'মেইনটেন্যান্স মোড চালু/বন্ধ, নতুন ইউজার রেজিস্ট্রেশন ও কেওয়াইসি রুলস।'
                    : 'Configure maintenance mode, new user registration gate, and mandatory verification rules.'}
                </p>
              </div>

              <button
                onClick={() => handleSave('system')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-slate-950 dark:text-amber-400 dark:hover:text-slate-950 rounded-xl text-xs font-bold transition"
              >
                {lang === 'bn' ? 'সিস্টেম সেভ করুন' : 'Save System'}
              </button>
            </div>

            {/* Maintenance Mode */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'মেইনটেন্যান্স মোড (Maintenance Mode)' : 'Maintenance Mode'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'চালু করলে সাধারণ ভিজিটরদের কাছে সাইট বন্ধ থাকবে এবং রক্ষণাবেক্ষণ বার্তা দেখাবে।'
                      : 'When enabled, public visitors will see a maintenance screen while admins can still access.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.system.maintenanceMode === true}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        system: { ...p.system, maintenanceMode: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {settings.system.maintenanceMode && (
                <div className="pt-2 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Maintenance Notice Message
                  </label>
                  <textarea
                    rows={2}
                    value={settings.system.maintenanceMessage || ''}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        system: { ...p.system, maintenanceMessage: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Registration Gate & KYC Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    Allow User Registrations
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Accept new signups from the registration page
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.system.allowRegistration !== false}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      system: { ...p.system, allowRegistration: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    Mandatory KYC for Withdrawals
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Users must be verified before requesting payout
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settings.system.requireKycForWithdraw === true}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      system: { ...p.system, requireKycForWithdraw: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Withdrawal & Security */}
      {activeTab === 'withdrawal' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <span>{lang === 'bn' ? 'উইথড্র ও অ্যাকাউন্ট নিরাপত্তা কন্ট্রোল' : 'Withdrawal & Account Security'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'পাসওয়ার্ড নিরাপত্তা, একাউন্ট অটো-সেভ, উইথড্র ফ্রিজ ও লিমিট অন/অফ করুন।'
                    : 'Manage password verification, auto-save payout accounts, freeze rules, and limits.'}
                </p>
              </div>

              <button
                onClick={() => handleSave('withdrawal')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                {lang === 'bn' ? 'উইথড্র রুলস সেভ করুন' : 'Save Withdrawal Settings'}
              </button>
            </div>

            {/* Core Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Require Password for Payout Accounts */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'পে-আউট একাউন্ট সেভ/এডিট/ডিলিট-এ পাসওয়ার্ড আবশ্যক'
                      : 'Require Password for Payout Accounts'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'ইউজার যখন বিকাশ, নগদ বা ব্যাংক একাউন্ট যুক্ত, পরিবর্তন বা মুছবে তখন একাউন্ট পাসওয়ার্ড দিতে হবে।'
                      : 'Users must provide account password to save, update, or remove payout accounts.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.withdrawal?.requirePasswordForPayoutAccount !== false}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: { ...p.withdrawal, requirePasswordForPayoutAccount: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* 2. Require Password for First/Unsaved Withdrawal */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'নতুন ইউজারের প্রথম উইথড্র-তে পাসওয়ার্ড প্রম্পট'
                      : 'Require Password for First-time / Unsaved Payout'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'সেভ করা একাউন্ট ছাড়া প্রথমবার উইথড্র করার সময় "নিরাপত্তার জন্য পাসওয়ার্ড দিন" বার্তা আসবে।'
                      : 'Prompt for password when withdrawing without a pre-saved account.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.withdrawal?.requirePasswordFirstWithdraw !== false}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: { ...p.withdrawal, requirePasswordFirstWithdraw: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* 3. Auto-Save Destination Account */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'উইথড্র কৃত অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে সেভ করা (Auto-Save)'
                      : 'Auto-Save Withdrawal Destination Account'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'টাকা উত্তোলনের পর ওই বিকাশ/নগদ/ব্যাংক নম্বরটি ভবিষ্যতে ১-ক্লিকে তোলার জন্য সেভ থাকবে।'
                      : 'Automatically save the destination account to user profile for future 1-click use.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.withdrawal?.autoSaveWithdrawalAccount !== false}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: { ...p.withdrawal, autoSaveWithdrawalAccount: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* 4. User Can Cancel Pending Withdrawal */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'ইউজার পেন্ডিং উইথড্র বাতিল করার সুবিধা'
                      : 'Allow User to Cancel Pending Withdrawal'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'এডমিন রিভিউ করার আগে ইউজার চাইলে পেন্ডিং উইথড্র বাতিল করতে পারবে এবং টাকা ব্যালেন্সে ফিরবে।'
                      : 'Users can cancel pending requests before admin approval to instantly refund their balance.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.withdrawal?.cancelPendingWithdrawEnabled !== false}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: { ...p.withdrawal, cancelPendingWithdrawEnabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Security Freeze after Password Change */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-500" />
                    <span>
                      {lang === 'bn'
                        ? 'পাসওয়ার্ড পরিবর্তনের পর উইথড্র সুরক্ষা ফ্রিজ (Security Freeze)'
                        : 'Freeze Withdrawals After Password Change'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'হ্যাকড বা সন্দেহভাজন লগইন রোধে পাসওয়ার্ড চেঞ্জের পর নির্দিষ্ট সময় উইথড্র স্থগিত থাকবে।'
                      : 'Prevent wallet drainage after account takeover by freezing withdrawals temporarily.'}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={settings.withdrawal?.freezeAfterPasswordChange !== false}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: { ...p.withdrawal, freezeAfterPasswordChange: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {settings.withdrawal?.freezeAfterPasswordChange !== false && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 max-w-xs space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'ফ্রিজ রাখার সময়সীমা (ঘণ্টায়)' : 'Freeze Duration (Hours)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={settings.withdrawal?.freezeDurationHours ?? 24}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: { ...p.withdrawal, freezeDurationHours: parseInt(e.target.value, 10) || 24 },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Daily Limits */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                {lang === 'bn' ? 'দৈনিক উত্তোলনের সীমা (Daily Withdrawal Limits)' : 'Tiered Daily Withdrawal Limits'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'সাধারণ/আনভেরিফাইড ইউজার (৳)' : 'Unverified Users Daily Limit (৳)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={settings.withdrawal?.dailyWithdrawLimitUnverified ?? 5000}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: {
                          ...p.withdrawal,
                          dailyWithdrawLimitUnverified: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'সীমাহীন করতে ০ রাখুন।' : 'Set 0 to disable limit.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'এনআইডি/কেওয়াইসি ভেরিফাইড ইউজার (৳)' : 'Verified KYC Users Daily Limit (৳)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={settings.withdrawal?.dailyWithdrawLimitVerified ?? 50000}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        withdrawal: {
                          ...p.withdrawal,
                          dailyWithdrawLimitVerified: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'সীমাহীন করতে ০ রাখুন।' : 'Set 0 to disable limit.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Operations & Workload Tab */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {lang === 'bn' ? 'মাল্টি-স্টাফ ওয়ার্কলোড ও অটো-বণ্টন ইঞ্জিন' : 'Multi-Staff Workload & Auto-Distribution'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'bn'
                    ? 'হাজার হাজার রিকোয়েস্ট ও ডিসপুট একাধিক স্টাফের মাঝে সমবণ্টন, ক্লেইম কিউ এবং এসকেলেশন নিয়ন্ত্রণ করুন।'
                    : 'Configure fair queue distribution, FIFO claim engine, peer reassignment, and SLA monitoring.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSave('operations')}
                disabled={saving}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{lang === 'bn' ? 'সেভ করুন' : 'Save Changes'}</span>
              </button>
            </div>

            {/* Master Switch Alert */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {lang === 'bn' ? 'সুপার অ্যাডমিন মাস্টার অন/অফ সুইচ' : 'Super Admin Master Switch'}
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  {lang === 'bn'
                    ? 'এই অপশনটি অফ থাকলে প্ল্যাটফর্ম সাধারণ উন্মুক্ত কিউতে চলবে। কাজের চাপ বেশি বাড়লে এটি অন করে দিলে স্বয়ংক্রিয়ভাবে অন-ডিউটি স্টাফদের মাঝে কাজ ৫০%/২০% করে বণ্টন হবে।'
                    : 'When disabled, requests remain in the shared open queue. Enable when scaling to automatically balance tasks across active on-duty staff.'}
                </p>
              </div>
            </div>

            {/* Toggle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Master Auto Distribution */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {lang === 'bn' ? 'ওয়ার্কলোড অটো-বণ্টন চালু করুন (Master Toggle)' : 'Enable Workload Auto-Distribution'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {lang === 'bn'
                      ? 'নতুন রিকোয়েস্ট সরাসরি অন-ডিউটি স্টাফদের ট্রলিতে চলে যাবে'
                      : 'Automatically assign incoming tasks to on-duty staff trays'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.operations?.workloadDistributionEnabled ?? false}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          workloadDistributionEnabled: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* 2. Peer Reassignment */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {lang === 'bn' ? 'সহকর্মীর কাছে ট্রান্সফার (Peer Reassign)' : 'Enable Peer Reassignment'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {lang === 'bn'
                      ? 'এক স্টাফ কাজ সামলাতে না পারলে অন্য অন-ডিউটি সহকর্মীকে দিতে পারবে'
                      : 'Allow staff to hand over tasks to active colleagues'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.operations?.peerReassignmentEnabled ?? true}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          peerReassignmentEnabled: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* 3. Escalation */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {lang === 'bn' ? 'সুপার অ্যাডমিনে এসকেলেশন' : 'Senior / Super Admin Escalation'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {lang === 'bn'
                      ? 'বড় অঙ্কের বিরোধ বা জটিল সমস্যা সরাসরি সুপার অ্যাডমিনে পাঠানোর বাটন'
                      : 'Allow staff to forward high-risk or complex disputes to Super Admin'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.operations?.escalationEnabled ?? true}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          escalationEnabled: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* 4. Require Handover Notes */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5 max-w-[80%]">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {lang === 'bn' ? 'ট্রান্সফারে হ্যান্ডওভার নোট আবশ্যক' : 'Mandatory Handover Notes'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {lang === 'bn'
                      ? 'সহকর্মীকে কাজ দেওয়ার সময় কারণ ও অগ্রগতি লিখে দেওয়া বাধ্যতামূলক'
                      : 'Require staff to write explanation notes before handing over tasks'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.operations?.requireHandoverNotes ?? true}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          requireHandoverNotes: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {/* Algorithm & Capacity Limits */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                {lang === 'bn' ? 'অ্যালগরিদম ও সময় নির্ধারণ' : 'Algorithm & Capacity Configuration'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Distribution Algorithm */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'বণ্টন অ্যালগরিদম' : 'Distribution Algorithm'}
                  </label>
                  <select
                    value={settings.operations?.distributionAlgorithm || 'CLAIM_POOL'}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          distributionAlgorithm: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="CLAIM_POOL">
                      {lang === 'bn' ? 'Claim Pool (সুপারিশকৃত - বাটন চেপে ক্লেইম)' : 'Claim Pool (Staff Click Next)'}
                    </option>
                    <option value="LEAST_LOADED">
                      {lang === 'bn' ? 'Least Loaded (যার কাজ কম তার কাছে যাবে)' : 'Least Loaded (Fair Distribution)'}
                    </option>
                    <option value="ROUND_ROBIN">
                      {lang === 'bn' ? 'Round Robin (ধারাবাহিক ৫০%-৫০% বণ্টন)' : 'Round Robin (Even Sequence)'}
                    </option>
                  </select>
                </div>

                {/* Max Concurrent Tasks per Staff */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'এক স্টাফ সর্বোচ্চ কয়টি কাজ একসাথে নিতে পারবে' : 'Max Concurrent Tasks / Staff'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.operations?.maxConcurrentTasksPerStaff ?? 5}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          maxConcurrentTasksPerStaff: parseInt(e.target.value) || 5,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'কাজের চাপ জমতে না দেওয়ার সর্বোচ্চ সীমা (ডিফল্ট: ৫)' : 'Prevents task hoarding.'}
                  </p>
                </div>

                {/* Lock Duration Minutes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'টাস্ক লক থাকার সময় (মিনিট)' : 'Task Lock Duration (Minutes)'}
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={settings.operations?.lockDurationMinutes ?? 10}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          lockDurationMinutes: parseInt(e.target.value) || 10,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'অন্য কেউ স্পর্শ করতে পারবে না (ডিফল্ট: ১০ মিনিট)' : 'Concurrency safety window.'}
                  </p>
                </div>

                {/* SLA Warning Minutes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'SLA ওয়ার্নিং সময় (মিনিট)' : 'SLA Warning Threshold (Mins)'}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={settings.operations?.slaWarningMinutes ?? 15}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          slaWarningMinutes: parseInt(e.target.value) || 15,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* SLA Breach Minutes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'SLA লঙ্ঘন / লাল অ্যালার্ট (মিনিট)' : 'SLA Breach / Red Alert (Mins)'}
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={settings.operations?.slaBreachMinutes ?? 30}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        operations: {
                          ...p.operations,
                          slaBreachMinutes: parseInt(e.target.value) || 30,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SPEED, RATE LIMITS & MAINTENANCE CONTROL TAB                           */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{lang === 'bn' ? 'স্পিড, রেট লিমিট ও সিস্টেম মেইনটেন্যান্স' : 'Speed, Limits & System Maintenance'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Performance Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'ওয়েবসাইট সবসময় দ্রুত রাখা, ইমেজ কম্প্রেশন, ব্যবহারকারীদের রিকোয়েস্ট লিমিট এবং ডাটাবেজ স্বাস্থ্য পরিচালনা করুন।'
                    : 'Configure image compression, user rate limits, pagination constraints and 1-click database maintenance.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSave('performance')}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition shrink-0"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{lang === 'bn' ? 'সেটিংস সংরক্ষণ করুন' : 'Save Limits'}</span>
            </button>
          </div>

          {/* Cleanup Success / Alert Message */}
          {cleanupMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cleanupMessage}</span>
            </div>
          )}

          {/* Section 1: Image & Media Upload Limits */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UploadCloud className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? '১. ছবি ও ফাইল আপলোড নিয়ন্ত্রণ (Image & Media Limits)' : '1. Image & Media Upload Limits'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Max Image Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'সর্বোচ্চ ইমেজ সাইজ (MB)' : 'Max Image Size (MB)'}
                </label>
                <select
                  value={settings.performance?.maxImageSizeMb ?? 2}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        maxImageSizeMb: Number(e.target.value) || 2,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={1}>1 MB ({lang === 'bn' ? 'সুপার ফাস্ট' : 'Super Fast'})</option>
                  <option value={2}>2 MB ({lang === 'bn' ? 'সুপারিশকৃত / ডিফল্ট' : 'Recommended'})</option>
                  <option value={3}>3 MB</option>
                  <option value={5}>5 MB</option>
                  <option value={10}>10 MB</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'বড় ছবি সার্ভার স্লো করে, ২ MB রাখা উত্তম।' : 'Prevents bandwidth bloat.'}
                </p>
              </div>

              {/* Client-side Auto Compression */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'ব্রাউজারে অটো-কম্প্রেশন' : 'Auto Browser Compression'}
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance?.enableClientCompression !== false}
                      onChange={(e) =>
                        setSettings((p: any) => ({
                          ...p,
                          performance: {
                            ...p.performance,
                            enableClientCompression: e.target.checked,
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {settings.performance?.enableClientCompression !== false
                      ? (lang === 'bn' ? 'সক্রিয় (Active)' : 'Enabled')
                      : (lang === 'bn' ? 'নিষ্ক্রিয় (Disabled)' : 'Disabled')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? '১০-১৫ MB ছবি স্বয়ংক্রিয়ভাবে ৫০-৮০ KB-তে নামিয়ে আনবে।' : 'Compresses huge phone photos.'}
                </p>
              </div>

              {/* Compression Quality */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'কম্প্রেশন কোয়ালিটি (%)' : 'Compression Quality (%)'}
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={settings.performance?.compressionQuality ?? 80}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        compressionQuality: Math.min(100, Math.max(50, parseInt(e.target.value) || 80)),
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'ডিফল্ট: ৮০% (ছবি স্পষ্ট ও হালকা থাকে)' : 'Default: 80%'}
                </p>
              </div>

              {/* Max Chat Attachments */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'প্রতি চ্যাটে সর্বোচ্চ ফাইল সংখ্যা' : 'Max Chat Files / Message'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.performance?.maxChatAttachmentsPerMsg ?? 4}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        maxChatAttachmentsPerMsg: parseInt(e.target.value) || 4,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'এক মেসেজে একসাথে সর্বোচ্চ কতটি ছবি/ফাইল পাঠানো যাবে।' : 'Chat attachment throttle.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Security & User Rate Limits */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? '২. সিকিউরিটি ও ইউজার রিকোয়েস্ট লিমিট (Rate Limits)' : '2. Security & User Rate Limits'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Max Login Attempts */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'লগইনে ভুল পাসওয়ার্ড লিমিট' : 'Max Failed Logins Before Lockout'}
                </label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={settings.performance?.maxLoginAttemptsBeforeLockout ?? 5}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        maxLoginAttemptsBeforeLockout: parseInt(e.target.value) || 5,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'কয়বার ভুল পাসওয়ার্ড দিলে অ্যাকাউন্ট সাময়িক লক হবে (ডিফল্ট: ৫)' : 'Brute-force protection.'}
                </p>
              </div>

              {/* Lockout Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'লকআউট সময়কাল (মিনিট)' : 'Lockout Duration (Minutes)'}
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.performance?.lockoutDurationMinutes ?? 15}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        lockoutDurationMinutes: parseInt(e.target.value) || 15,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'লক হওয়ার পর কতক্ষণ অপেক্ষা করতে হবে (ডিফল্ট: ১৫ মিনিট)' : 'Lockout freeze window.'}
                </p>
              </div>

              {/* OTP Cooldown Seconds */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'ওটিপি পুনরায় পাঠানোর বিরতি (সেকেন্ড)' : 'OTP Resend Cooldown (Seconds)'}
                </label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={settings.performance?.otpCooldownSeconds ?? 60}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        otpCooldownSeconds: parseInt(e.target.value) || 60,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'এক ওটিপি চাওয়ার পর পরের ওটিপির বিরতি (ডিফল্ট: ৬০ সেকেন্ড)' : 'Prevents SMS flooding.'}
                </p>
              </div>

              {/* Max Daily OTPs */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'দৈনিক সর্বোচ্চ ওটিপি প্রতি ইউজার' : 'Max Daily OTP / User'}
                </label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={settings.performance?.maxDailyOtpPerUser ?? 5}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        maxDailyOtpPerUser: parseInt(e.target.value) || 5,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? '২৪ ঘণ্টায় একজন ইউজার সর্বোচ্চ কয়টি ওটিপি পাবে (ডিফল্ট: ৫)' : 'SMS bill control.'}
                </p>
              </div>

              {/* Max Daily Withdraw Requests */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'দৈনিক সর্বোচ্চ উইথড্র রিকোয়েস্ট' : 'Max Daily Withdrawals / User'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.performance?.maxDailyWithdrawRequests ?? 5}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        maxDailyWithdrawRequests: parseInt(e.target.value) || 5,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'একজন ইউজার দিনে সর্বোচ্চ কয়টি উইথড্র দিতে পারবে।' : 'Prevents withdrawal spam.'}
                </p>
              </div>

              {/* Max Daily Recharge Requests */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'দৈনিক সর্বোচ্চ রিচার্জ রিকোয়েস্ট' : 'Max Daily Recharges / User'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.performance?.maxDailyRechargeRequests ?? 10}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        maxDailyRechargeRequests: parseInt(e.target.value) || 10,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'একজন ইউজার দিনে সর্বোচ্চ কয়টি রিচার্জ দিতে পারবে।' : 'Prevents recharge spam.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Pagination & Query Speed Tuning */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Gauge className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? '৩. পেজিনেশন ও কুয়েরি স্পিড নিয়ন্ত্রণ (Query & Display Limits)' : '3. Pagination & Query Limits'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Default Page Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'ডিফল্ট পেজ সাইজ (প্রতি পেজে আইটেম)' : 'Default Page Size (Items/Page)'}
                </label>
                <select
                  value={settings.performance?.defaultPageSize ?? 20}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        defaultPageSize: Number(e.target.value) || 20,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={10}>10 {lang === 'bn' ? 'টি (খুব হালকা)' : 'Items (Light)'}</option>
                  <option value={20}>20 {lang === 'bn' ? 'টি (আদর্শ / ডিফল্ট)' : 'Items (Optimal)'}</option>
                  <option value={30}>30 {lang === 'bn' ? 'টি' : 'Items'}</option>
                  <option value={50}>50 {lang === 'bn' ? 'টি' : 'Items'}</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'শপ, প্রোডাক্ট ও ট্রানজ্যাকশন লিস্টে লোড হওয়ার সংখ্যা।' : 'Items loaded per page request.'}
                </p>
              </div>

              {/* Max Page Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'সর্বোচ্চ অনুমোদিত পেজ সাইজ' : 'Max Allowed Page Size'}
                </label>
                <select
                  value={settings.performance?.maxPageSize ?? 50}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        maxPageSize: Number(e.target.value) || 50,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={30}>30 {lang === 'bn' ? 'টি' : 'Items'}</option>
                  <option value={50}>50 {lang === 'bn' ? 'টি (ডিফল্ট)' : 'Items'}</option>
                  <option value={100}>100 {lang === 'bn' ? 'টি' : 'Items'}</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'কোনো ইউজার এপিআই দিয়ে এর বেশি আইটেম একবারে টানতে পারবে না।' : 'Hard cap on API query limit.'}
                </p>
              </div>

              {/* Chat Initial Messages */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'চ্যাটে প্রাথমিক মেসেজ লোড সংখ্যা' : 'Initial Chat Messages Loaded'}
                </label>
                <select
                  value={settings.performance?.chatHistoryInitialLimit ?? 30}
                  onChange={(e) =>
                    setSettings((p: any) => ({
                      ...p,
                      performance: {
                        ...p.performance,
                        chatHistoryInitialLimit: Number(e.target.value) || 30,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={20}>20 {lang === 'bn' ? 'টি' : 'Messages'}</option>
                  <option value={30}>30 {lang === 'bn' ? 'টি (সুপারিশকৃত)' : 'Messages (Optimal)'}</option>
                  <option value={50}>50 {lang === 'bn' ? 'টি' : 'Messages'}</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'ইনবক্স দ্রুত খোলার জন্য প্রাথমিক লোড সংখ্যা (স্ক্রল করলে পুরনো মেসেজ আসবে)।' : 'Faster chat opening.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Database Health & 1-Click Maintenance Center */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? '৪. ডাটাবেজ স্বাস্থ্য ও ওয়ান-ক্লিক ক্লিনআপ সেন্টার (Maintenance Center)' : '4. Database Health & 1-Click Cleanup Center'}
                </h3>
              </div>
              <button
                onClick={fetchMaintenanceStats}
                disabled={loadingStats}
                className="text-xs text-slate-500 hover:text-amber-500 flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                <span>{lang === 'bn' ? 'রিফ্রেশ ডাটা' : 'Refresh'}</span>
              </button>
            </div>

            {/* Live Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Financial Records Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {lang === 'bn' ? 'আর্থিক লেজার ও লেনদেন' : 'Financial Records'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                    {lang === 'bn' ? 'আজীবন সুরক্ষিত' : 'Protected'}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {maintenanceStats ? (maintenanceStats.totalLedgers + maintenanceStats.totalTransactions).toLocaleString() : '...'}
                </div>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  {lang === 'bn'
                    ? 'ব্যালেন্স হিসেব ও অডিটের স্বার্থে এই ডাটা কখনো ডিলিট করা হবে না।'
                    : 'Permanently preserved for audit & balance ledger.'}
                </p>
              </div>

              {/* Expired OTPs Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'মেয়াদোত্তীর্ণ ওটিপি (Expired)' : 'Expired OTP Logs'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {lang === 'bn' ? 'ক্লিনযোগ্য' : 'Cleanable'}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {maintenanceStats ? maintenanceStats.expiredOtps.toLocaleString() : '...'}
                </div>
                <button
                  type="button"
                  onClick={handleCleanExpiredOtps}
                  disabled={cleaningAction === 'otps' || !maintenanceStats?.expiredOtps}
                  className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-[10px] transition flex items-center justify-center gap-1.5"
                >
                  {cleaningAction === 'otps' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  <span>{lang === 'bn' ? 'এখনই ক্লিন করুন' : 'Clean Now'}</span>
                </button>
              </div>

              {/* System Audit Logs Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'সিস্টেম অডিট লগ' : 'System Audit Logs'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    {lang === 'bn' ? 'অডিট রেকর্ড' : 'Audit'}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {maintenanceStats ? maintenanceStats.totalAuditLogs.toLocaleString() : '...'}
                </div>
                <button
                  type="button"
                  onClick={handleCleanAuditLogs}
                  disabled={cleaningAction === 'audit' || !maintenanceStats?.totalAuditLogs}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 text-slate-800 dark:text-slate-200 font-bold text-[10px] transition flex items-center justify-center gap-1.5"
                >
                  {cleaningAction === 'audit' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  <span>{lang === 'bn' ? '১৮০ দিনের পুরনো মুছুন' : 'Clean 180d+ Old'}</span>
                </button>
              </div>

              {/* Server Memory & PM2 Logs Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'সার্ভার ও লগ ফাইল' : 'Server & Memory'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white space-y-0.5">
                  <div>RAM Heap: {maintenanceStats ? `${maintenanceStats.memoryUsageMb} MB` : '...'}</div>
                  <div className="text-[10px] text-slate-400">
                    Uptime: {maintenanceStats ? `${Math.floor(maintenanceStats.serverUptimeSeconds / 3600)}h ${Math.floor((maintenanceStats.serverUptimeSeconds % 3600) / 60)}m` : '...'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFlushServerLogs}
                  disabled={cleaningAction === 'logs'}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-[10px] transition flex items-center justify-center gap-1.5"
                >
                  {cleaningAction === 'logs' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Flame className="w-3 h-3" />}
                  <span>{lang === 'bn' ? 'সার্ভার লগ ফ্লাশ করুন' : 'Flush PM2 Logs'}</span>
                </button>
              </div>
            </div>

            {/* Retention Policies */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                {lang === 'bn' ? 'স্বয়ংক্রিয় ডাটা রিটেনশন পলিসি (Auto-Clean Policies):' : 'Automated Data Retention Policies:'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'এক্সপায়ার্ড ওটিপি স্বয়ংক্রিয় ডিলিট (দিন)' : 'Auto Clean Expired OTPs (Days)'}
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={90}
                    value={settings.performance?.autoCleanExpiredOtpDays ?? 30}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        performance: {
                          ...p.performance,
                          autoCleanExpiredOtpDays: parseInt(e.target.value) || 30,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'কতদিনের পুরনো এক্সপায়ার্ড ওটিপি মুছে ফেলা হবে (ডিফল্ট: ৩০ দিন)' : 'Auto-purge interval.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'সাধারণ অডিট লগ স্বয়ংক্রিয় ডিলিট (দিন)' : 'Auto Clean Audit Logs (Days)'}
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={730}
                    value={settings.performance?.autoCleanAuditLogsDays ?? 180}
                    onChange={(e) =>
                      setSettings((p: any) => ({
                        ...p,
                        performance: {
                          ...p.performance,
                          autoCleanAuditLogsDays: parseInt(e.target.value) || 180,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'কতদিনের পুরনো সাধারণ অডিট লগ মুছে ফেলা হবে (আর্থিক লেনদেন ছাড়া, ডিফল্ট: ১৮০ দিন)' : 'Non-financial audit retention.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
