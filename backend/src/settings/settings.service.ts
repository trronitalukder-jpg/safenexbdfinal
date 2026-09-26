import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_SETTINGS = {
  general: {
    siteName: 'SafnexBD',
    siteTagline: 'Secure Escrow & P2P Marketplace in Bangladesh',
    logoType: 'TEXT', // 'TEXT' | 'IMAGE_URL' | 'IMAGE_UPLOAD'
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
      'Buy and sell digital assets, physical goods, services, and exchange money securely with automated escrow protection in Bangladesh.',
    metaKeywords:
      'escrow bangladesh, buy sell online, digital goods, p2p escrow, safe payment, bkash escrow, nagad escrow',
    canonicalUrl: 'https://safnexbd.com',
    ogTitle: 'SafnexBD - Secure Escrow Marketplace in Bangladesh',
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
    events: {
      pageView: true,
      viewContent: true,
      completeRegistration: true,
      initiateCheckout: true,
      purchase: true,
      contact: true,
      search: true,
    },
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
    mobileBottomNavEnabled: true,
    appInstallPromptOnRegister: true,
    appInstallDelaySeconds: 10,
    newVisitorPopupEnabled: true,
    newVisitorPopupDelaySeconds: 3,
    newVisitorPopupAutoCloseSeconds: 0,
    newVisitorPopupTitle: 'ফ্রি রেজিস্ট্রেশন করে আজই আয় শুরু করুন!',
    newVisitorPopupMessage: 'নিরাপদ ট্রানজেকশনে প্রোডাক্ট কেনাবেচা করুন এবং সহজ কাজ সম্পন্ন করে বিকাশ/নগদে ঘরে বসেই আয় করুন।',
    newVisitorPopupCtaText: '🚀 এখনই ফ্রি রেজিস্ট্রেশন করুন',
    newVisitorPopupCtaUrl: '/register',
    scammerCheckerEnabled: true,
    scammerGlobalWarningOnly: false,
    socialProofEnabled: true,
    socialProofInitialDelaySeconds: 5,
    socialProofIntervalSeconds: 25,
    socialProofDurationSeconds: 8,
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
    workloadDistributionEnabled: false, // Default false: Super Admin master switch
    distributionAlgorithm: 'CLAIM_POOL', // CLAIM_POOL, LEAST_LOADED, ROUND_ROBIN
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
  ai: {
    enabled: false,
    provider: 'GEMINI', // 'GEMINI' | 'OPENAI' | 'QWEN'
    apiKey: '',
    baseUrl: '', // Custom API base URL (e.g. for Qwen, OpenRouter, DashScope, Groq)
    modelName: 'gemini-2.0-flash',
    riskThreshold: 70, // 50 to 95
    scamDetectionEnabled: true,
    offPlatformDetectionEnabled: true,
    inChatWarningEnabled: true,
    adminFlaggingEnabled: true,
    disputeSummaryEnabled: true,
    dealProposalEnabled: true,
  },
  microJob: {
    enabled: true,
    autoApproveHours: 48,
    platformFeePercent: 5,
    minJobReward: 1,
    requireKycToPost: false,
    requireKycToWork: false,
    featuredJobFee: 20,
  },
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  superAdmin: {
    newUserRegistration: true,
    rechargeRequest: true,
    withdrawRequest: true,
    disputeCalling: true,
    bids: true,
    transactions: true,
    payRequest: true,
    receiveRequest: true,
    soundAlerts: true,
    browserPush: true,
  },
  user: {
    chatMessage: true,
    rechargeStatus: true,
    withdrawStatus: true,
    payReceiveRequest: true,
    soundAlerts: true,
    browserPush: true,
  },
  employee: {
    rechargeQueue: true,
    withdrawQueue: true,
    disputeCalling: true,
    chatMediation: true,
    newRegistration: false,
    soundAlerts: true,
    browserPush: true,
  },
};

export interface RechargeStep {
  stepNumber: number;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  badgeText?: string;
}

export interface RechargeInstructions {
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  steps: RechargeStep[];
  importantNotesBn: string[];
  importantNotesEn: string[];
  supportPhone?: string;
  supportWhatsapp?: string;
  videoUrl?: string;
  updatedAt?: string;
}

export const DEFAULT_RECHARGE_INSTRUCTIONS: RechargeInstructions = {
  titleBn: 'কিভাবে ব্যালেন্স রিচার্জ করবেন?',
  titleEn: 'How to Recharge Wallet Balance?',
  subtitleBn: 'নিচের ৪টি সহজ ধাপ অনুসরণ করে যেকোনো সময় আপনার অ্যাকাউন্টে টাকা যোগ করুন।',
  subtitleEn: 'Follow these 4 simple steps to safely add money to your SafnexBD wallet.',
  steps: [
    {
      stepNumber: 1,
      titleBn: 'পেমেন্ট মেথড ও নম্বর নির্বাচন করুন',
      titleEn: 'Select Payment Method & Copy Number',
      descriptionBn: 'বিকাশ, নগদ, রকেট বা ব্যাংক মেথড সিলেক্ট করুন এবং আমাদের প্রদর্শিত অফিশিয়াল পার্সোনাল বা মার্চেন্ট নম্বরটি কপি করুন।',
      descriptionEn: 'Choose bKash, Nagad, Rocket or Bank and copy our official payment number.',
      badgeText: 'Step 1',
    },
    {
      stepNumber: 2,
      titleBn: 'সঠিক পরিমাণ টাকা সেন্ড মানি করুন',
      titleEn: 'Send Money from Your App',
      descriptionBn: 'আপনার বিকাশ/নগদ অ্যাপ থেকে আমাদের নম্বরে কাঙ্ক্ষিত টাকার সমপরিমাণ অর্থ সেন্ড মানি (Send Money) অথবা পেমেন্ট করুন।',
      descriptionEn: 'Send the exact recharge amount to our number using your mobile banking app.',
      badgeText: 'Step 2',
    },
    {
      stepNumber: 3,
      titleBn: 'TrxID ও প্রেরক নম্বর সাবমিট করুন',
      titleEn: 'Submit TrxID & Sender Number',
      descriptionBn: 'টাকা পাঠানোর পর প্রাপ্ত ট্রানজেকশন আইডি (TrxID) ও যে নম্বর থেকে টাকা পাঠিয়েছেন তা রিচার্জ ফর্মে লিখে সাবমিট করুন।',
      descriptionEn: 'Enter the Transaction ID (TrxID) and your sender phone number in the form and submit.',
      badgeText: 'Step 3',
    },
    {
      stepNumber: 4,
      titleBn: 'দ্রুত ব্যালেন্স ভেরিফিকেশন ও ক্রেডিট',
      titleEn: 'Fast Verification & Instant Credit',
      descriptionBn: 'আমাদের সিস্টেম ও এডমিন দ্রুত আপনার ট্রানজেকশন যাচাই করে ৫ থেকে ১৫ মিনিটের মধ্যে আপনার ওয়ালেটে ব্যালেন্স যুক্ত করে দেবে।',
      descriptionEn: 'Our staff will verify your transaction details and credit your wallet within 5-15 minutes.',
      badgeText: 'Step 4',
    },
  ],
  importantNotesBn: [
    'সর্বদা ওয়ালেট পেজে প্রদর্শিত সর্বশেষ অফিসিয়াল নম্বরেই টাকা পাঠাবেন। পুরনো নম্বরে টাকা পাঠালে তা গ্রহণযোগ্য হবে না।',
    'ভুল TrxID বা ভুয়া রিকোয়েস্ট দিলে আপনার অ্যাকাউন্ট সাময়িক বা স্থায়ীভাবে ব্যান হতে পারে।',
    'টাকা পাঠানোর পর ট্রানজেকশনের এসএমএস বা কনফার্মেশন স্ক্রিনশট নিরাপদ রাখুন।',
    'যেকোনো জরুরি প্রয়োজনে আমাদের লাইভ সাপোর্ট বা হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করুন।',
  ],
  importantNotesEn: [
    'Always send money to the latest official number displayed on the wallet recharge screen.',
    'Submitting fake TrxID or misleading information will cause instant account suspension.',
    'Keep your transaction SMS or payment screenshot safe until credited.',
    'Contact our 24/7 Live Support or WhatsApp if you need immediate assistance.',
  ],
  supportPhone: '+880 1700-000000',
  supportWhatsapp: '+880 1700-000000',
};

const CATEGORY_KEYS: Record<string, string> = {
  general: 'WEBSITE_GENERAL',
  seo: 'WEBSITE_SEO',
  tracking: 'WEBSITE_TRACKING',
  localization: 'WEBSITE_LOCALIZATION',
  footer: 'WEBSITE_FOOTER',
  system: 'WEBSITE_SYSTEM',
  withdrawal: 'WEBSITE_WITHDRAWAL',
  operations: 'WEBSITE_OPERATIONS',
  performance: 'WEBSITE_PERFORMANCE',
  ai: 'WEBSITE_AI',
  microJob: 'WEBSITE_MICRO_JOB',
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all settings (for Admin Panel)
   */
  async getAllSettings() {
    const records = await this.prisma.systemSetting.findMany({
      where: {
        key: { in: Object.values(CATEGORY_KEYS) },
      },
    });

    const settingsMap = new Map<string, any>();
    records.forEach((r) => settingsMap.set(r.key, r.value));

    return {
      general: { ...DEFAULT_SETTINGS.general, ...(settingsMap.get(CATEGORY_KEYS.general) || {}) },
      seo: { ...DEFAULT_SETTINGS.seo, ...(settingsMap.get(CATEGORY_KEYS.seo) || {}) },
      tracking: { ...DEFAULT_SETTINGS.tracking, ...(settingsMap.get(CATEGORY_KEYS.tracking) || {}) },
      localization: {
        ...DEFAULT_SETTINGS.localization,
        ...(settingsMap.get(CATEGORY_KEYS.localization) || {}),
      },
      footer: { ...DEFAULT_SETTINGS.footer, ...(settingsMap.get(CATEGORY_KEYS.footer) || {}) },
      system: { ...DEFAULT_SETTINGS.system, ...(settingsMap.get(CATEGORY_KEYS.system) || {}) },
      withdrawal: {
        ...DEFAULT_SETTINGS.withdrawal,
        ...(settingsMap.get(CATEGORY_KEYS.withdrawal) || {}),
      },
      operations: {
        ...DEFAULT_SETTINGS.operations,
        ...(settingsMap.get(CATEGORY_KEYS.operations) || {}),
      },
      performance: {
        ...DEFAULT_SETTINGS.performance,
        ...(settingsMap.get(CATEGORY_KEYS.performance) || {}),
      },
      ai: {
        ...DEFAULT_SETTINGS.ai,
        ...(settingsMap.get(CATEGORY_KEYS.ai) || {}),
      },
      microJob: {
        ...DEFAULT_SETTINGS.microJob,
        ...(settingsMap.get(CATEGORY_KEYS.microJob) || {}),
      },
    };
  }

  private publicSettingsCache: { data: any; expiresAt: number } | null = null;

  public clearPublicSettingsCache() {
    this.publicSettingsCache = null;
  }

  /**
   * Get public settings (for frontend web visitors / public layout)
   * Excludes sensitive tokens like Facebook CAPI token and AI API keys
   */
  async getPublicSettings() {
    if (this.publicSettingsCache && Date.now() < this.publicSettingsCache.expiresAt) {
      return this.publicSettingsCache.data;
    }

    const all = await this.getAllSettings();

    // Mask or omit server-side secret tokens
    const publicTracking = {
      facebookPixelId: (all.tracking.facebookPixelId || '').trim(),
      facebookTestEventCode: (all.tracking.facebookTestEventCode || '').trim(),
      googleAnalyticsId: (all.tracking.googleAnalyticsId || '').trim(),
      gtmId: (all.tracking.gtmId || '').trim(),
      tiktokPixelId: (all.tracking.tiktokPixelId || '').trim(),
      customHeadScripts: all.tracking.customHeadScripts || '',
      customBodyScripts: all.tracking.customBodyScripts || '',
      events: all.tracking.events || DEFAULT_SETTINGS.tracking.events,
    };

    const result = {
      general: all.general,
      seo: all.seo,
      tracking: publicTracking,
      localization: all.localization,
      footer: all.footer,
      system: {
        maintenanceMode: all.system.maintenanceMode,
        maintenanceMessage: all.system.maintenanceMessage,
        allowRegistration: all.system.allowRegistration,
        mobileBottomNavEnabled: Boolean(all.system?.mobileBottomNavEnabled !== false),
        scammerCheckerEnabled: Boolean(all.system?.scammerCheckerEnabled !== false),
        scammerGlobalWarningOnly: Boolean(all.system?.scammerGlobalWarningOnly === true),
        socialProofEnabled: Boolean(all.system?.socialProofEnabled !== false),
        socialProofInitialDelaySeconds: Number(all.system?.socialProofInitialDelaySeconds ?? 5),
        socialProofIntervalSeconds: Number(all.system?.socialProofIntervalSeconds ?? 25),
        socialProofDurationSeconds: Number(all.system?.socialProofDurationSeconds ?? 8),
      },
      withdrawal: all.withdrawal,
      operations: {
        workloadDistributionEnabled: all.operations.workloadDistributionEnabled,
        distributionAlgorithm: all.operations.distributionAlgorithm,
      },
      performance: {
        maxImageSizeMb: all.performance.maxImageSizeMb,
        enableClientCompression: all.performance.enableClientCompression,
        compressionQuality: all.performance.compressionQuality,
        maxChatAttachmentsPerMsg: all.performance.maxChatAttachmentsPerMsg,
        otpCooldownSeconds: all.performance.otpCooldownSeconds,
        defaultPageSize: all.performance.defaultPageSize,
      },
      ai: {
        enabled: Boolean(all.ai?.enabled),
        inChatWarningEnabled: Boolean(all.ai?.inChatWarningEnabled),
        dealProposalEnabled: Boolean(all.ai?.dealProposalEnabled),
      },
      microJob: {
        enabled: Boolean(all.microJob?.enabled !== false),
        autoApproveHours: Number(all.microJob?.autoApproveHours || 48),
        platformFeePercent: Number(all.microJob?.platformFeePercent || 5),
        minJobReward: Number(all.microJob?.minJobReward || 1),
        requireKycToPost: Boolean(all.microJob?.requireKycToPost),
        requireKycToWork: Boolean(all.microJob?.requireKycToWork),
        featuredJobFee: Number(all.microJob?.featuredJobFee ?? 20),
      },
    };

    this.publicSettingsCache = {
      data: result,
      expiresAt: Date.now() + 60 * 1000, // Cache for 60 seconds
    };

    return result;
  }

  /**
   * Helper to check if micro job feature is globally enabled
   */
  async isMicroJobEnabled(): Promise<boolean> {
    try {
      const all = await this.getAllSettings();
      return Boolean(all.microJob?.enabled !== false);
    } catch {
      return true;
    }
  }

  /**
   * Helper to get micro job operational settings
   */
  async getMicroJobSettings() {
    try {
      const all = await this.getAllSettings();
      return all.microJob || DEFAULT_SETTINGS.microJob;
    } catch {
      return DEFAULT_SETTINGS.microJob;
    }
  }

  /**
   * Get AI settings (internal & admin use)
   */
  async getAiSettings() {
    try {
      const record = await this.prisma.systemSetting.findUnique({
        where: { key: CATEGORY_KEYS.ai },
      });
      return {
        ...DEFAULT_SETTINGS.ai,
        ...(record && typeof record.value === 'object' ? (record.value as any) : {}),
      };
    } catch {
      return DEFAULT_SETTINGS.ai;
    }
  }

  /**
   * Test AI Connection directly for Admin
   */
  async testAiConnection(provider: string, apiKey: string, modelName?: string, baseUrl?: string) {
    const prov = (provider || 'GEMINI').toUpperCase();
    const key = (apiKey || '').trim();
    if (!key) {
      return { success: false, message: 'API key is required for testing' };
    }

    const startTime = Date.now();

    if (prov === 'GEMINI') {
      const model = modelName?.trim() || 'gemini-2.0-flash';
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with exactly: SafnexBD AI connection successful' }] }],
          }),
        });
        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
          return { success: false, latency, message: `Gemini Error: ${errMsg}` };
        }
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return {
          success: true,
          latency,
          provider: 'GEMINI',
          model,
          message: 'Google Gemini API connection successful!',
          reply: reply.trim(),
        };
      } catch (err: any) {
        return { success: false, latency: Date.now() - startTime, message: err.message || 'Gemini connection failed' };
      }
    } else if (prov === 'OPENAI') {
      const model = modelName?.trim() || 'gpt-4o-mini';
      try {
        const url = 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Respond with exactly: SafnexBD AI connection successful' }],
            max_tokens: 30,
          }),
        });
        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
          return { success: false, latency, message: `OpenAI Error: ${errMsg}` };
        }
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '';
        return {
          success: true,
          latency,
          provider: 'OPENAI',
          model,
          message: 'OpenAI API connection successful!',
          reply: reply.trim(),
        };
      } catch (err: any) {
        return { success: false, latency: Date.now() - startTime, message: err.message || 'OpenAI connection failed' };
      }
    } else if (prov === 'QWEN' || prov === 'CUSTOM') {
      let effectiveKey = key;
      let endpoint = (baseUrl || '').trim();

      // If user accidentally pasted API key into baseUrl
      if (endpoint.startsWith('sk-') || endpoint.startsWith('gsk_')) {
        if (!effectiveKey || !effectiveKey.startsWith('sk-')) {
          effectiveKey = endpoint;
        }
        endpoint = '';
      }

      if (!endpoint) {
        if (effectiveKey.startsWith('sk-or-')) {
          endpoint = 'https://openrouter.ai/api/v1';
        } else if (effectiveKey.startsWith('gsk_')) {
          endpoint = 'https://api.groq.com/openai/v1';
        } else {
          endpoint = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
        }
      } else if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
        endpoint = `https://${endpoint}`;
      }

      const cleanBase = endpoint.replace(/\/+$/, '');
      const url = cleanBase.endsWith('/chat/completions')
        ? cleanBase
        : `${cleanBase}/chat/completions`;

      const model = modelName?.trim() || (effectiveKey.startsWith('sk-or-') ? 'qwen/qwen-2.5-72b-instruct' : 'qwen-plus');

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
        };
        if (effectiveKey.startsWith('sk-or-')) {
          headers['HTTP-Referer'] = 'https://safnexbd.com';
          headers['X-Title'] = 'SafnexBD';
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Respond with exactly: SafnexBD AI connection successful' }],
            max_tokens: 30,
          }),
        });
        const latency = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || errData?.message || `HTTP ${res.status}: ${res.statusText}`;
          return { success: false, latency, message: `Qwen/Custom Error: ${errMsg}` };
        }
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '';
        return {
          success: true,
          latency,
          provider: 'QWEN',
          model,
          message: 'Qwen / OpenAI-compatible API connection successful!',
          reply: reply.trim(),
        };
      } catch (err: any) {
        return { success: false, latency: Date.now() - startTime, message: err.message || 'Qwen connection failed' };
      }
    }

    return { success: false, message: `Unsupported provider: ${provider}` };
  }

  /**
   * Get Operations & Workload Distribution Settings
   */
  async getOperationsSettings() {
    try {
      const record = await this.prisma.systemSetting.findUnique({
        where: { key: CATEGORY_KEYS.operations },
      });
      return {
        ...DEFAULT_SETTINGS.operations,
        ...(record && typeof record.value === 'object' ? (record.value as any) : {}),
      };
    } catch {
      return DEFAULT_SETTINGS.operations;
    }
  }

  /**
   * Get withdrawal specific settings
   */
  async getWithdrawalSettings() {
    try {
      const rec = await this.prisma.systemSetting.findUnique({
        where: { key: CATEGORY_KEYS.withdrawal },
      });
      if (!rec?.value) return DEFAULT_SETTINGS.withdrawal;
      const val = typeof rec.value === 'string' ? JSON.parse(rec.value) : rec.value;
      return { ...DEFAULT_SETTINGS.withdrawal, ...val };
    } catch {
      return DEFAULT_SETTINGS.withdrawal;
    }
  }

  /**
   * Save settings by category or full payload, recording AuditLog
   */
  async saveSettings(
    payload: {
      category?: string;
      data?: any;
      general?: any;
      seo?: any;
      tracking?: any;
      localization?: any;
      footer?: any;
      system?: any;
      withdrawal?: any;
      operations?: any;
      performance?: any;
      ai?: any;
    },
    adminId?: string,
  ) {
    const current = await this.getAllSettings();
    const updates: Promise<any>[] = [];
    const auditChanges: Record<string, { before: any; after: any }> = {};

    // 1. If category-based single update
    if (payload.category && payload.data) {
      const cat = payload.category.toLowerCase();
      const settingKey = CATEGORY_KEYS[cat];
      if (settingKey) {
        const merged = { ...((current as any)[cat] || {}), ...payload.data };
        auditChanges[cat] = { before: (current as any)[cat], after: merged };

        updates.push(
          this.prisma.systemSetting.upsert({
            where: { key: settingKey },
            create: {
              key: settingKey,
              category: 'WEBSITE_SETTINGS',
              isPublic: cat !== 'tracking' && cat !== 'system' && cat !== 'ai',
              value: merged,
              description: `Website ${cat} configuration settings`,
            },
            update: { value: merged },
          }),
        );
      }
    } else {
      // 2. Multi-category or full payload update
      for (const [cat, settingKey] of Object.entries(CATEGORY_KEYS)) {
        if ((payload as any)[cat]) {
          const merged = { ...((current as any)[cat] || {}), ...(payload as any)[cat] };
          auditChanges[cat] = { before: (current as any)[cat], after: merged };

          updates.push(
            this.prisma.systemSetting.upsert({
              where: { key: settingKey },
              create: {
                key: settingKey,
                category: 'WEBSITE_SETTINGS',
                isPublic: cat !== 'tracking' && cat !== 'system' && cat !== 'ai',
                value: merged,
                description: `Website ${cat} configuration settings`,
              },
              update: { value: merged },
            }),
          );
        }
      }
    }

    await Promise.all(updates);
    this.clearPublicSettingsCache();

    // Record immutable audit log
    if (adminId) {
      const beforeState: any = {};
      const afterState: any = {};
      for (const [cat, change] of Object.entries(auditChanges)) {
        beforeState[cat] = change.before;
        afterState[cat] = change.after;
      }

      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'WEBSITE_SETTINGS_UPDATE',
            targetEntity: 'SystemSetting',
            targetId: payload.category ? CATEGORY_KEYS[payload.category.toLowerCase()] || 'WEBSITE_ALL' : 'WEBSITE_ALL',
            beforeState,
            afterState,
            reason: `Updated website settings for: ${Object.keys(auditChanges).join(', ')}`,
          },
        })
        .catch((err) => console.error('Failed to log website settings audit:', err));
    }

    return this.getAllSettings();
  }

  /**
   * Get notification settings (Super Admin, User, Employee)
   */
  async getNotificationSettings() {
    const record = await this.prisma.systemSetting.findUnique({
      where: { key: 'NOTIFICATION_SETTINGS' },
    });

    if (!record || !record.value) {
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    const val: any = record.value;
    return {
      superAdmin: { ...DEFAULT_NOTIFICATION_SETTINGS.superAdmin, ...(val.superAdmin || {}) },
      user: { ...DEFAULT_NOTIFICATION_SETTINGS.user, ...(val.user || {}) },
      employee: { ...DEFAULT_NOTIFICATION_SETTINGS.employee, ...(val.employee || {}) },
    };
  }

  /**
   * Save notification settings
   */
  async saveNotificationSettings(payload: any, adminId?: string) {
    const current = await this.getNotificationSettings();
    const updated = {
      superAdmin: { ...current.superAdmin, ...(payload.superAdmin || {}) },
      user: { ...current.user, ...(payload.user || {}) },
      employee: { ...current.employee, ...(payload.employee || {}) },
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'NOTIFICATION_SETTINGS' },
      create: {
        key: 'NOTIFICATION_SETTINGS',
        category: 'NOTIFICATIONS',
        isPublic: false,
        value: updated,
        description: 'Multi-role notification configuration for Super Admin, Employees and Users',
      },
      update: {
        value: updated,
      },
    });

    if (adminId) {
      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'NOTIFICATION_SETTINGS_UPDATE',
            targetEntity: 'SystemSetting',
            targetId: 'NOTIFICATION_SETTINGS',
            beforeState: current,
            afterState: updated,
            reason: 'Updated platform notification triggers configuration',
          },
        })
        .catch((err) => console.error('Failed to log notification settings audit:', err));
    }

    return updated;
  }

  /**
   * Helper to check if a specific notification trigger is enabled
   */
  async isNotificationEnabled(
    role: 'superAdmin' | 'user' | 'employee',
    triggerKey: string,
  ): Promise<boolean> {
    try {
      const settings = await this.getNotificationSettings();
      return Boolean((settings as any)?.[role]?.[triggerKey]);
    } catch {
      return true;
    }
  }

  /**
   * Get maintenance & database health statistics for Admin Dashboard
   */
  async getMaintenanceStats() {
    const now = new Date();
    const [
      totalUsers,
      totalTransactions,
      totalLedgers,
      totalOtps,
      expiredOtps,
      totalAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.walletLedger.count(),
      this.prisma.otp.count(),
      this.prisma.otp.count({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isUsed: true },
          ],
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      totalUsers,
      totalTransactions,
      totalLedgers,
      totalOtps,
      expiredOtps,
      totalAuditLogs,
      serverUptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
    };
  }

  /**
   * Clean expired OTP records
   */
  async cleanExpiredOtps(days = 7, adminId?: string) {
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.prisma.otp.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() }, createdAt: { lt: threshold } },
          { isUsed: true, createdAt: { lt: threshold } },
        ],
      },
    });

    if (adminId) {
      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'MAINTENANCE_CLEAN_EXPIRED_OTPS',
            targetEntity: 'Otp',
            targetId: 'ALL_EXPIRED',
            reason: `Cleaned ${result.count} expired OTP records older than ${days} days`,
          },
        })
        .catch(() => {});
    }

    return { deletedCount: result.count };
  }

  /**
   * Clean old non-financial audit logs
   */
  async cleanOldAuditLogs(days = 180, adminId?: string) {
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: threshold },
        action: { notIn: ['WITHDRAWAL_CONFIRM', 'RECHARGE_APPROVE', 'DISPUTE_ACTION', 'WALLET_ADJUSTMENT'] },
      },
    });

    if (adminId) {
      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'MAINTENANCE_CLEAN_AUDIT_LOGS',
            targetEntity: 'AuditLog',
            targetId: 'OLD_LOGS',
            reason: `Cleaned ${result.count} old system audit logs older than ${days} days`,
          },
        })
        .catch(() => {});
    }

    return { deletedCount: result.count };
  }

  /**
   * Clean test transactions, disputes, chats, and financial requests before production launch
   */
  async cleanTestData(
    adminId: string,
    options?: {
      cleanTransactions?: boolean;
      cleanDisputes?: boolean;
      cleanChats?: boolean;
      cleanFinancials?: boolean;
      cleanNonStaffUsers?: boolean;
    },
  ) {
    const opts = {
      cleanTransactions: options?.cleanTransactions ?? true,
      cleanDisputes: options?.cleanDisputes ?? true,
      cleanChats: options?.cleanChats ?? true,
      cleanFinancials: options?.cleanFinancials ?? true,
      cleanNonStaffUsers: options?.cleanNonStaffUsers ?? false,
    };

    // 1. Identify all staff and admin accounts to preserve
    const staffUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { isEmployee: true },
          {
            userRoles: {
              some: {
                role: {
                  name: {
                    in: [
                      'ADMIN',
                      'SUPER_ADMIN',
                      'EMPLOYEE',
                      'SUPPORT_ADMIN',
                      'FINANCE_ADMIN',
                      'CONTENT_ADMIN',
                    ],
                  },
                },
              },
            },
          },
        ],
      },
      select: { id: true, email: true, uniqueUserId: true },
    });

    const staffUserIds = staffUsers.map((s) => s.id);

    let deletedMessagesCount = 0;
    let deletedConversationsCount = 0;
    let deletedDisputesCount = 0;
    let deletedTransactionsCount = 0;
    let deletedRechargesCount = 0;
    let deletedWithdrawalsCount = 0;
    let deletedLedgersCount = 0;
    let deletedUsersCount = 0;

    // 1. Clean Chats
    if (opts.cleanChats) {
      await this.prisma.messageAttachment.deleteMany({});
      const msgs = await this.prisma.message.deleteMany({});
      deletedMessagesCount = msgs.count;
      await this.prisma.conversationParticipant.deleteMany({});
      const convs = await this.prisma.conversation.deleteMany({});
      deletedConversationsCount = convs.count;
    }

    // 2. Clean Disputes
    if (opts.cleanDisputes) {
      await this.prisma.disputeEvidence.deleteMany({});
      await this.prisma.disputeAction.deleteMany({});
      const disputes = await this.prisma.dispute.deleteMany({});
      deletedDisputesCount = disputes.count;
    }

    // 3. Clean Transactions
    if (opts.cleanTransactions) {
      // If transactions are deleted, disputes must also be deleted due to FK
      if (!opts.cleanDisputes) {
        await this.prisma.disputeEvidence.deleteMany({});
        await this.prisma.disputeAction.deleteMany({});
        const disputes = await this.prisma.dispute.deleteMany({});
        deletedDisputesCount += disputes.count;
      }
      await this.prisma.transactionWorkLog.deleteMany({});
      await this.prisma.transactionStatusHistory.deleteMany({});
      await this.prisma.taskHandoffLog.deleteMany({});
      const txs = await this.prisma.transaction.deleteMany({});
      deletedTransactionsCount = txs.count;
    }

    // 4. Clean Financials (Recharges, Withdrawals, Wallet Holds, Ledgers)
    if (opts.cleanFinancials) {
      const recharges = await this.prisma.rechargeRequest.deleteMany({});
      deletedRechargesCount = recharges.count;
      const withdrawals = await this.prisma.withdrawalRequest.deleteMany({});
      deletedWithdrawalsCount = withdrawals.count;
      await this.prisma.walletHold.deleteMany({});
      const ledgers = await this.prisma.walletLedger.deleteMany({});
      deletedLedgersCount = ledgers.count;

      // Reset all staff wallets to 0
      await this.prisma.wallet.updateMany({
        where: { userId: { in: staffUserIds } },
        data: {
          availableBalance: 0,
          holdBalance: 0,
          version: 0,
        },
      });

      // Reset all user wallets to 0
      await this.prisma.wallet.updateMany({
        data: {
          availableBalance: 0,
          holdBalance: 0,
          version: 0,
        },
      });
    }

    // 5. Clean Non-Staff Users if explicitly requested
    if (opts.cleanNonStaffUsers) {
      await this.prisma.wallet.deleteMany({
        where: { userId: { notIn: staffUserIds } },
      });
      await this.prisma.userReview.deleteMany({});
      await this.prisma.passwordResetRequest.deleteMany({});
      await this.prisma.userPaymentAccount.deleteMany({
        where: { userId: { notIn: staffUserIds } },
      });
      await this.prisma.refreshToken.deleteMany({
        where: { userId: { notIn: staffUserIds } },
      });
      const users = await this.prisma.user.deleteMany({
        where: { id: { notIn: staffUserIds } },
      });
      deletedUsersCount = users.count;
    }

    // Log in AuditLog
    if (adminId) {
      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'MAINTENANCE_CLEAN_TEST_DATA',
            targetEntity: 'Database',
            targetId: 'TEST_DATA_CLEANUP',
            reason: `Purged test data: ${deletedTransactionsCount} txs, ${deletedDisputesCount} disputes, ${deletedMessagesCount} msgs, ${deletedRechargesCount} recharges, ${deletedWithdrawalsCount} withdrawals, ${deletedLedgersCount} ledgers, ${deletedUsersCount} test users. Preserved ${staffUsers.length} staff accounts.`,
          },
        })
        .catch(() => {});
    }

    return {
      success: true,
      message: 'Test data cleaned successfully',
      preservedStaffCount: staffUsers.length,
      deletedTransactions: deletedTransactionsCount,
      deletedDisputes: deletedDisputesCount,
      deletedMessages: deletedMessagesCount,
      deletedConversations: deletedConversationsCount,
      deletedRecharges: deletedRechargesCount,
      deletedWithdrawals: deletedWithdrawalsCount,
      deletedLedgers: deletedLedgersCount,
      deletedUsers: deletedUsersCount,
    };
  }

  /**
   * Send server-side event to Meta Conversions API (CAPI)
   */
  async sendMetaCapiEvent(
    eventName: string,
    params: Record<string, any> = {},
    clientIp?: string,
    userAgent?: string,
  ) {
    const all = await this.getAllSettings();
    const pixelId = (all.tracking.facebookPixelId || '').trim();
    const token = (all.tracking.facebookCapiToken || '').trim();
    const testEventCode = (all.tracking.facebookTestEventCode || '').trim();

    if (!pixelId || !token) {
      return { success: false, message: 'Meta Pixel ID or CAPI Access Token not configured' };
    }

    try {
      const crypto = await import('crypto');
      const hash = (str: string) =>
        crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');

      const userData: Record<string, any> = {};
      if (clientIp) userData.client_ip_address = clientIp;
      if (userAgent) userData.client_user_agent = userAgent;
      if (params.email) userData.em = [hash(params.email)];
      if (params.phone) userData.ph = [hash(params.phone)];

      const customData: Record<string, any> = {
        currency: params.currency || 'BDT',
      };
      if (params.value !== undefined) customData.value = Number(params.value);
      if (params.content_name) customData.content_name = params.content_name;
      if (params.content_category) customData.content_category = params.content_category;
      if (params.content_ids) {
        customData.content_ids = Array.isArray(params.content_ids)
          ? params.content_ids
          : [params.content_ids];
      }
      if (params.content_type) customData.content_type = params.content_type;
      if (params.order_id || params.transaction_id) {
        customData.order_id = params.order_id || params.transaction_id;
      }

      const eventPayload: any = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: params.page_path || 'https://safnexbd.com',
        user_data: userData,
        custom_data: customData,
      };

      const capiBody: any = {
        data: [eventPayload],
      };

      if (testEventCode) {
        capiBody.test_event_code = testEventCode;
      }

      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capiBody),
          signal: AbortSignal.timeout(5000),
        },
      );

      const resData = await response.json();
      return {
        success: response.ok,
        data: resData,
      };
    } catch (err: any) {
      console.error('Meta CAPI Error:', err);
      return { success: false, message: err.message };
    }
  }

  private rechargeInstructionsCache: { data: RechargeInstructions; expiresAt: number } | null = null;

  /**
   * Get recharge instructions (for public wallet users and admin preview)
   */
  async getRechargeInstructions(): Promise<RechargeInstructions> {
    if (this.rechargeInstructionsCache && Date.now() < this.rechargeInstructionsCache.expiresAt) {
      return this.rechargeInstructionsCache.data;
    }

    try {
      const record = await this.prisma.systemSetting.findUnique({
        where: { key: 'SYSTEM_RECHARGE_INSTRUCTIONS' },
      });

      let data: RechargeInstructions = DEFAULT_RECHARGE_INSTRUCTIONS;
      if (record && record.value && typeof record.value === 'object') {
        data = {
          ...DEFAULT_RECHARGE_INSTRUCTIONS,
          ...(record.value as any),
        };
      }

      this.rechargeInstructionsCache = {
        data,
        expiresAt: Date.now() + 60 * 1000, // 1 min cache
      };
      return data;
    } catch (err) {
      return DEFAULT_RECHARGE_INSTRUCTIONS;
    }
  }

  /**
   * Save recharge instructions (by Super Admin / Admin)
   */
  async saveRechargeInstructions(payload: Partial<RechargeInstructions>, adminId?: string) {
    const current = await this.getRechargeInstructions();
    const updated: RechargeInstructions = {
      ...current,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'SYSTEM_RECHARGE_INSTRUCTIONS' },
      create: {
        key: 'SYSTEM_RECHARGE_INSTRUCTIONS',
        category: 'WEBSITE_SETTINGS',
        isPublic: true,
        value: updated as any,
        description: 'Customer wallet recharge instructions and step-by-step guidance',
      },
      update: {
        value: updated as any,
      },
    });

    this.rechargeInstructionsCache = null;

    if (adminId) {
      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'RECHARGE_INSTRUCTIONS_UPDATE',
            targetEntity: 'SystemSetting',
            targetId: 'SYSTEM_RECHARGE_INSTRUCTIONS',
            beforeState: current as any,
            afterState: updated as any,
            reason: 'Admin updated recharge instructions and guide',
          },
        })
        .catch(() => {});
    }

    return updated;
  }
}