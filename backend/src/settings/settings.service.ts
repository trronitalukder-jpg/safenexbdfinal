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

const CATEGORY_KEYS: Record<string, string> = {
  general: 'WEBSITE_GENERAL',
  seo: 'WEBSITE_SEO',
  tracking: 'WEBSITE_TRACKING',
  localization: 'WEBSITE_LOCALIZATION',
  footer: 'WEBSITE_FOOTER',
  system: 'WEBSITE_SYSTEM',
  withdrawal: 'WEBSITE_WITHDRAWAL',
  operations: 'WEBSITE_OPERATIONS',
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
    };
  }

  /**
   * Get public settings (for frontend web visitors / public layout)
   * Excludes sensitive tokens like Facebook CAPI token
   */
  async getPublicSettings() {
    const all = await this.getAllSettings();

    // Mask or omit server-side secret tokens
    const publicTracking = {
      facebookPixelId: all.tracking.facebookPixelId || '',
      googleAnalyticsId: all.tracking.googleAnalyticsId || '',
      gtmId: all.tracking.gtmId || '',
      tiktokPixelId: all.tracking.tiktokPixelId || '',
      customHeadScripts: all.tracking.customHeadScripts || '',
      customBodyScripts: all.tracking.customBodyScripts || '',
    };

    return {
      general: all.general,
      seo: all.seo,
      tracking: publicTracking,
      localization: all.localization,
      footer: all.footer,
      system: {
        maintenanceMode: all.system.maintenanceMode,
        maintenanceMessage: all.system.maintenanceMessage,
        allowRegistration: all.system.allowRegistration,
      },
      withdrawal: all.withdrawal,
      operations: {
        workloadDistributionEnabled: all.operations.workloadDistributionEnabled,
        distributionAlgorithm: all.operations.distributionAlgorithm,
      },
    };
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
              isPublic: cat !== 'tracking' && cat !== 'system',
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
                isPublic: cat !== 'tracking' && cat !== 'system',
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
}