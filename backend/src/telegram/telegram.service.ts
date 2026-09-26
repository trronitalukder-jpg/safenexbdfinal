import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';

export interface TelegramBotSettings {
  isEnabled: boolean;
  botToken: string;
  botUsername: string;
  adminGroupId: string;
  allowUserSearch: boolean;
  allowP2pChat: boolean;
  enable2Fa: boolean;
  enableMiniApp: boolean;
  miniAppUrl: string;
  alertEvents: {
    chatMessage: boolean;
    escrowPayRequest: boolean;
    escrowRelease: boolean;
    disputeOpened: boolean;
    rechargeRequest: boolean;
    withdrawalRequest: boolean;
    securityLogin: boolean;
  };
  templates: {
    chatMessage: string;
    escrowPayRequest: string;
    escrowRelease: string;
    disputeOpened: string;
    rechargeApproved: string;
    withdrawalApproved: string;
    securityLogin: string;
    adminRechargeAlert: string;
    adminWithdrawAlert: string;
    adminDisputeAlert: string;
  };
}

export const DEFAULT_TELEGRAM_SETTINGS: TelegramBotSettings = {
  isEnabled: true,
  botToken: '',
  botUsername: 'SafnexBDBot',
  adminGroupId: '',
  allowUserSearch: true,
  allowP2pChat: true,
  enable2Fa: false,
  enableMiniApp: true,
  miniAppUrl: 'https://safnexbd.com',
  alertEvents: {
    chatMessage: true,
    escrowPayRequest: true,
    escrowRelease: true,
    disputeOpened: true,
    rechargeRequest: true,
    withdrawalRequest: true,
    securityLogin: true,
  },
  templates: {
    chatMessage:
      '📩 <b>[SafnexBD] নতুন মেসেজ!</b>\n\n👤 <b>{senderName}</b> (@{senderUniqueId}) আপনাকে বার্তা পাঠিয়েছেন:\n<i>"{messageSnippet}"</i>\n\nচ্যাটে কথা বলতে নিচের বাটনে ক্লিক করুন:',
    escrowPayRequest:
      '💸 <b>[SafnexBD] নতুন পেমেন্ট রিকোয়েস্ট!</b>\n\n👤 <b>{senderName}</b> আপনার কাছে <b>৳{amount}</b> টাকার এসক্রো পেমেন্ট রিকোয়েস্ট পাঠিয়েছেন।\n📦 লেনদেন আইডি: <code>{transactionId}</code>\nবিস্তারিত দেখতে নিচে ক্লিক করুন:',
    escrowRelease:
      '🎉 <b>[SafnexBD] পেমেন্ট রিলিজ সম্পন্ন!</b>\n\nআপনার ওয়ালেটে <b>৳{amount}</b> যোগ করা হয়েছে।\n📦 লেনদেন আইডি: <code>{transactionId}</code>\nSafnexBD এর সাথে থাকার জন্য ধন্যবাদ!',
    disputeOpened:
      '⚠️ <b>[SafnexBD] ডিসপ্যুট সতর্কতা!</b>\n\nলেনদেন #<code>{transactionId}</code>-এ একটি অভিযোগ (Dispute) ওপেন করা হয়েছে।\nপ্রয়োজনীয় প্রমাণপত্র দিয়ে দ্রুত সমাধানে সহযোগিতা করুন।',
    rechargeApproved:
      '✅ <b>[SafnexBD] রিচার্জ সফল!</b>\n\nআপনার <b>৳{amount}</b> রিচার্জের আবেদন সফলভাবে অনুমোদন হয়েছে এবং ওয়ালেটে ব্যালেন্স যুক্ত করা হয়েছে।',
    withdrawalApproved:
      '💸 <b>[SafnexBD] টাকা উত্তোলন সম্পন্ন!</b>\n\nআপনার <b>৳{amount}</b> উত্তোলনের আবেদন সফলভাবে সম্পন্ন করা হয়েছে। অনুগ্রহ করে আপনার অ্যাকাউন্ট চেক করুন।',
    securityLogin:
      '🚨 <b>[SafnexBD] সিকিউরিটি অ্যালার্ট!</b>\n\nআপনার অ্যাকাউন্টে নতুন ডিভাইস বা আইপি থেকে লগইন করা হয়েছে।\n🌐 আইপি: <code>{ipAddress}</code>\n⏰ সময়: {time}\n<i>এটি আপনি না হলে সাথে সাথে পাসওয়ার্ড পরিবর্তন করুন!</i>',
    adminRechargeAlert:
      '🚨 <b>[Admin Alert] নতুন রিচার্জ রিকোয়েস্ট!</b>\n\n👤 ইউজার: <b>{userName}</b> (@{uniqueUserId})\n💰 পরিমাণ: <b>৳{amount}</b>\n💳 মেথড: {method}\n⏰ সময়: {time}',
    adminWithdrawAlert:
      '🚨 <b>[Admin Alert] নতুন উইথড্র রিকোয়েস্ট!</b>\n\n👤 ইউজার: <b>{userName}</b> (@{uniqueUserId})\n💰 পরিমাণ: <b>৳{amount}</b>\n🏦 অ্যাকাউন্ট: {accountNumber}\n⏰ সময়: {time}',
    adminDisputeAlert:
      '⚠️ <b>[Admin Alert] নতুন ডিসপ্যুট ওপেন হয়েছে!</b>\n\n📦 ট্রানজেকশন: <code>{transactionId}</code>\n👤 বায়ার: {buyerName}\n👤 সেলার: {sellerName}\n📝 কারণ: {reason}',
  },
};

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private cachedSettings: TelegramBotSettings | null = null;
  private lastSettingsFetch = 0;

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
  ) {}

  async onModuleInit() {
    try {
      const settings = await this.getSettings();
      if (settings?.isEnabled && settings?.botToken) {
        this.logger.log('[Telegram] Auto-syncing bot commands and native WebApp menu button...');
        const siteUrl = settings.miniAppUrl || 'https://safnexbd.com';
        await Promise.allSettled([
          this.setChatMenuButton(settings.botToken, siteUrl),
          this.setMyCommands(settings.botToken),
        ]);
        this.logger.log('[Telegram] Bot commands and WebApp menu button synced successfully!');
      }
    } catch (err: any) {
      this.logger.warn(`[Telegram] Failed to auto-sync bot menu: ${err?.message}`);
    }
  }

  /**
   * Fetch current telegram bot settings from DB (cached for 30s)
   */
  async getSettings(): Promise<TelegramBotSettings> {
    const now = Date.now();
    if (this.cachedSettings && now - this.lastSettingsFetch < 30000) {
      return this.cachedSettings;
    }

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'telegram_bot_settings' },
      });

      if (setting && setting.value) {
        const val =
          typeof setting.value === 'string'
            ? JSON.parse(setting.value)
            : setting.value;
        this.cachedSettings = {
          ...DEFAULT_TELEGRAM_SETTINGS,
          ...val,
          alertEvents: {
            ...DEFAULT_TELEGRAM_SETTINGS.alertEvents,
            ...(val.alertEvents || {}),
          },
          templates: {
            ...DEFAULT_TELEGRAM_SETTINGS.templates,
            ...(val.templates || {}),
          },
        };
      } else {
        this.cachedSettings = DEFAULT_TELEGRAM_SETTINGS;
      }
    } catch {
      this.cachedSettings = DEFAULT_TELEGRAM_SETTINGS;
    }

    this.lastSettingsFetch = now;
    return this.cachedSettings || DEFAULT_TELEGRAM_SETTINGS;
  }

  /**
   * Update Telegram Bot settings (Admin)
   */
  async updateSettings(
    payload: Partial<TelegramBotSettings>,
    adminId?: string,
  ): Promise<TelegramBotSettings> {
    const current = await this.getSettings();
    const updated: TelegramBotSettings = {
      ...current,
      ...payload,
      alertEvents: {
        ...current.alertEvents,
        ...(payload.alertEvents || {}),
      },
      templates: {
        ...current.templates,
        ...(payload.templates || {}),
      },
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'telegram_bot_settings' },
      create: {
        key: 'telegram_bot_settings',
        value: updated as any,
        category: 'INTEGRATION',
        isPublic: false,
        description:
          'SafnexBD 3-Phase Telegram Bot Configuration, Templates, and Switches',
      },
      update: {
        value: updated as any,
      },
    });

    this.cachedSettings = updated;
    this.lastSettingsFetch = Date.now();

    // If bot token is supplied or updated, automatically register webhook, menu button, and commands
    if (updated.botToken && updated.isEnabled) {
      const siteUrl = (updated.miniAppUrl || 'https://safnexbd.com').replace(/\/$/, '');
      const webhookUrl = `${siteUrl}/api/v1/telegram/webhook`;
      this.setWebhook(updated.botToken, webhookUrl).catch((err) =>
        this.logger.warn(`Failed to set Telegram webhook: ${err.message}`),
      );
      this.setChatMenuButton(updated.botToken, `${siteUrl}/dashboard`).catch((err) =>
        this.logger.warn(`Failed to set Telegram chat menu button: ${err.message}`),
      );
      this.setMyCommands(updated.botToken).catch((err) =>
        this.logger.warn(`Failed to set Telegram commands: ${err.message}`),
      );
    }

    if (adminId) {
      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'TELEGRAM_SETTINGS_UPDATE',
            targetEntity: 'SystemSetting',
            targetId: 'telegram_bot_settings',
            beforeState: current as any,
            afterState: updated as any,
            reason: 'Updated Telegram Bot Configuration and Templates',
          },
        })
        .catch(() => null);
    }

    return updated;
  }

  /**
   * Send HTTP request to Telegram Bot API
   */
  async callApi(botToken: string, method: string, payload: any): Promise<any> {
    if (!botToken) return null;
    try {
      const url = `https://api.telegram.org/bot${botToken}/${method}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      this.logger.error(`Telegram API error [${method}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Set native WebView Menu Button right next to chat input bar
   */
  async setChatMenuButton(botToken: string, webAppUrl: string): Promise<any> {
    return this.callApi(botToken, 'setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '⚡ SafnexBD App',
        web_app: { url: webAppUrl },
      },
    });
  }

  /**
   * Register official Bot Commands list in Telegram
   */
  async setMyCommands(botToken: string): Promise<any> {
    return this.callApi(botToken, 'setMyCommands', {
      commands: [
        { command: 'menu', description: '📱 প্রধান মেনু ও শর্টকাট (Main Menu)' },
        { command: 'balance', description: '💰 ওয়ালেট ব্যালেন্স ও হিসেব (Balance)' },
        { command: 'orders', description: '📦 চলতি এসক্রো অর্ডার ও অবস্থা (Orders)' },
        { command: 'search', description: '🔍 ইউজার খুঁজুন ও চ্যাট করুন (Find User)' },
        { command: 'complaint', description: '📢 অভিযোগ দাখিল করুন (File Complaint)' },
        { command: 'support', description: '📞 কাস্টমার সাপোর্ট ও হেল্পলাইন (Support)' },
        { command: 'help', description: '❓ বট ব্যবহারের সহায়িকা (Help Guide)' },
      ],
    });
  }

  /**
   * Returns rich persistent reply keyboard with native WebApp buttons
   */
  getPersistentMenuKeyboard(siteUrl: string) {
    const base = (siteUrl || 'https://safnexbd.com').replace(/\/$/, '');
    return {
      keyboard: [
        [
          { text: '⚡ SafnexBD ড্যাশবোর্ড', web_app: { url: `${base}/dashboard` } },
          { text: '💬 লাইভ চ্যাট ও ডিল', web_app: { url: `${base}/dashboard/chat` } },
        ],
        [
          { text: '💰 ওয়ালেট ও ব্যালেন্স', web_app: { url: `${base}/dashboard/wallet` } },
          { text: '📢 অভিযোগ দাখিল করুন', web_app: { url: `${base}/dashboard?openComplaint=true` } },
        ],
        [
          { text: '📦 চলতি লেনদেন' },
          { text: '🔍 ইউজার সার্চ' },
          { text: '❓ হেল্প' },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    };
  }

  /**
   * Set webhook on Telegram servers
   */
  async setWebhook(botToken: string, webhookUrl: string): Promise<any> {
    return this.callApi(botToken, 'setWebhook', {
      url: webhookUrl,
      drop_pending_updates: false,
    });
  }

  /**
   * Test Bot Token Connection
   */
  async testConnection(
    botToken?: string,
  ): Promise<{ success: boolean; bot?: any; error?: string }> {
    const settings = await this.getSettings();
    const token = botToken || settings.botToken;
    if (!token) {
      return { success: false, error: 'Bot Token is not configured' };
    }

    const res = await this.callApi(token, 'getMe', {});
    if (res && res.ok && res.result) {
      return { success: true, bot: res.result };
    }
    return {
      success: false,
      error: res?.description || 'Invalid Telegram Bot Token',
    };
  }

  /**
   * Interpolate template variables
   */
  private interpolate(
    template: string,
    vars: Record<string, string | number>,
  ): string {
    let result = template;
    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(val ?? ''));
    }
    return result;
  }

  /**
   * Send Alert to a specific SafnexBD user via Telegram
   */
  async sendUserAlert(
    userId: string,
    eventKey: keyof TelegramBotSettings['alertEvents'],
    variables: Record<string, string | number>,
    inlineButtons?: Array<{ text: string; url?: string; callback_data?: string }>,
  ): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.isEnabled || !settings.botToken) return false;
    if (!settings.alertEvents[eventKey]) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramChatId: true,
        telegramNotifications: true,
        firstName: true,
      },
    });

    if (!user || !user.telegramChatId || !user.telegramNotifications) {
      return false;
    }

    const template =
      settings.templates[eventKey as keyof TelegramBotSettings['templates']] ||
      '';
    if (!template) return false;

    const messageText = this.interpolate(template, {
      userName: user.firstName,
      ...variables,
    });

    const replyMarkup: any = {};
    if (inlineButtons && inlineButtons.length > 0) {
      replyMarkup.inline_keyboard = [inlineButtons];
    } else if (settings.enableMiniApp && settings.miniAppUrl) {
      replyMarkup.inline_keyboard = [
        [
          {
            text: '🛍️ Open SafnexBD',
            web_app: { url: settings.miniAppUrl },
          },
        ],
      ];
    }

    const res = await this.callApi(settings.botToken, 'sendMessage', {
      chat_id: user.telegramChatId,
      text: messageText,
      parse_mode: 'HTML',
      ...(Object.keys(replyMarkup).length > 0
        ? { reply_markup: replyMarkup }
        : {}),
    });

    return !!(res && res.ok);
  }

  /**
   * Send Alert to Admin Telegram Group
   */
  async sendAdminAlert(
    templateKey: keyof TelegramBotSettings['templates'],
    variables: Record<string, string | number>,
    inlineButtons?: Array<{ text: string; url?: string; callback_data?: string }>,
  ): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.isEnabled || !settings.botToken || !settings.adminGroupId) {
      return false;
    }

    const template = settings.templates[templateKey];
    if (!template) return false;

    const messageText = this.interpolate(template, variables);

    const replyMarkup: any = {};
    if (inlineButtons && inlineButtons.length > 0) {
      replyMarkup.inline_keyboard = [inlineButtons];
    }

    const res = await this.callApi(settings.botToken, 'sendMessage', {
      chat_id: settings.adminGroupId,
      text: messageText,
      parse_mode: 'HTML',
      ...(Object.keys(replyMarkup).length > 0
        ? { reply_markup: replyMarkup }
        : {}),
    });

    return !!(res && res.ok);
  }

  /**
   * Send Alert to Employer when a Worker submits proof for their Micro Job
   */
  async notifyMicroJobSubmitted(
    employerId: string,
    jobTitle: string,
    workerName: string,
    jobId: string,
  ): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      if (!settings.isEnabled || !settings.botToken) return false;

      const user = await this.prisma.user.findUnique({
        where: { id: employerId },
        select: { telegramChatId: true, telegramNotifications: true },
      });
      if (!user?.telegramChatId || user.telegramNotifications === false) return false;

      const base = (settings.miniAppUrl || 'https://safnexbd.com').replace(/\/$/, '');
      const message = `💼 <b>[SafnexBD] নতুন ওয়ার্কার কাজ জমা দিয়েছেন!</b>\n\n📋 <b>জব:</b> ${jobTitle}\n👤 <b>ওয়ার্কার:</b> ${workerName}\n\nপ্রুফ যাচাই ও অনুমোদনের জন্য নিচে ক্লিক করুন:`;

      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: user.telegramChatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 রিভিউ করুন (Review Proof)', url: `${base}/dashboard/micro-jobs` }],
          ],
        },
      });
      return true;
    } catch (err) {
      this.logger.error('Failed to send micro-job submitted alert:', err);
      return false;
    }
  }

  /**
   * Send Alert to Worker when their Micro Job Submission is Approved & Paid
   */
  async notifyMicroJobApproved(
    workerId: string,
    jobTitle: string,
    amount: number,
  ): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      if (!settings.isEnabled || !settings.botToken) return false;

      const user = await this.prisma.user.findUnique({
        where: { id: workerId },
        select: { telegramChatId: true, telegramNotifications: true },
      });
      if (!user?.telegramChatId || user.telegramNotifications === false) return false;

      const base = (settings.miniAppUrl || 'https://safnexbd.com').replace(/\/$/, '');
      const message = `🎉 <b>[SafnexBD] অভিনন্দন! কাজ অনুমোদিত হয়েছে!</b>\n\n📋 <b>জব:</b> ${jobTitle}\n💰 <b>আয়:</b> ৳${amount.toFixed(2)} আপনার ওয়ালেটে জমা হয়েছে!\n\nSafnexBD এর সাথে থাকার জন্য ধন্যবাদ।`;

      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: user.telegramChatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 ওয়ালেট ব্যালেন্স দেখুন', url: `${base}/dashboard/wallet` }],
          ],
        },
      });
      return true;
    } catch (err) {
      this.logger.error('Failed to send micro-job approved alert:', err);
      return false;
    }
  }

  /**
   * Send Alert to Worker when their Micro Job Submission is Rejected
   */
  async notifyMicroJobRejected(
    workerId: string,
    jobTitle: string,
    reason: string,
  ): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      if (!settings.isEnabled || !settings.botToken) return false;

      const user = await this.prisma.user.findUnique({
        where: { id: workerId },
        select: { telegramChatId: true, telegramNotifications: true },
      });
      if (!user?.telegramChatId || user.telegramNotifications === false) return false;

      const base = (settings.miniAppUrl || 'https://safnexbd.com').replace(/\/$/, '');
      const message = `⚠️ <b>[SafnexBD] কাজ প্রত্যাখ্যাত হয়েছে</b>\n\n📋 <b>জব:</b> ${jobTitle}\n📝 <b>কারণ:</b> ${reason || 'প্রমাণপত্র নিয়মানুযায়ী জমা দেওয়া হয়নি'}`;

      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: user.telegramChatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💼 অন্যান্য কাজ দেখুন', url: `${base}/micro-jobs` }],
          ],
        },
      });
      return true;
    } catch (err) {
      this.logger.error('Failed to send micro-job rejected alert:', err);
      return false;
    }
  }

  /**
   * Broadcast message to all connected Telegram users
   */
  async broadcast(
    messageText: string,
    buttonText?: string,
    buttonUrl?: string,
  ): Promise<{ sent: number; failed: number }> {
    const settings = await this.getSettings();
    if (!settings.isEnabled || !settings.botToken) {
      throw new BadRequestException('Telegram bot is not enabled');
    }

    const users = await this.prisma.user.findMany({
      where: {
        telegramChatId: { not: null },
        telegramNotifications: true,
        deletedAt: null,
        isActive: true,
      },
      select: { telegramChatId: true },
    });

    let sent = 0;
    let failed = 0;

    const replyMarkup: any = {};
    if (buttonText && buttonUrl) {
      replyMarkup.inline_keyboard = [[{ text: buttonText, url: buttonUrl }]];
    }

    for (const u of users) {
      if (!u.telegramChatId) continue;
      const res = await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: u.telegramChatId,
        text: messageText,
        parse_mode: 'HTML',
        ...(Object.keys(replyMarkup).length > 0
          ? { reply_markup: replyMarkup }
          : {}),
      });

      if (res && res.ok) {
        sent++;
      } else {
        failed++;
      }

      // Small delay to respect Telegram rate limits (30 msg/sec)
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    return { sent, failed };
  }

  /**
   * Generate secure link URL for user to connect their Telegram
   */
  async generateLinkUrl(userId: string): Promise<{ url: string; botUsername: string }> {
    const settings = await this.getSettings();
    const botUsername = settings.botUsername || 'SafnexBDBot';
    // Link token format: u_<userId>
    const url = `https://t.me/${botUsername}?start=u_${userId}`;
    return { url, botUsername };
  }

  /**
   * Disconnect Telegram account
   */
  async disconnectUser(userId: string): Promise<boolean> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLastActiveSession: null,
        telegram2FaEnabled: false,
      },
    });
    return true;
  }

  /**
   * Get connection status for a user
   */
  async getUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramNotifications: true,
        telegram2FaEnabled: true,
      },
    });

    const settings = await this.getSettings();
    const botUsername = settings.botUsername || 'SafnexBDBot';
    const linkUrl = `https://t.me/${botUsername}?start=u_${userId}`;

    return {
      connected: !!user?.telegramChatId,
      isConnected: !!user?.telegramChatId,
      telegramChatId: user?.telegramChatId,
      telegramUsername: user?.telegramUsername,
      telegramNotifications: user?.telegramNotifications ?? true,
      telegram2FaEnabled: user?.telegram2FaEnabled ?? false,
      botUsername,
      linkUrl,
      botEnabled: settings.isEnabled,
      allowUserSearch: settings.allowUserSearch,
      allowP2pChat: settings.allowP2pChat,
      enableMiniApp: settings.enableMiniApp,
      miniAppUrl: settings.miniAppUrl,
    };
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    dto: { telegramNotifications?: boolean; telegram2FaEnabled?: boolean },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.telegramNotifications !== undefined
          ? { telegramNotifications: Boolean(dto.telegramNotifications) }
          : {}),
        ...(dto.telegram2FaEnabled !== undefined
          ? { telegram2FaEnabled: Boolean(dto.telegram2FaEnabled) }
          : {}),
      },
      select: {
        telegramNotifications: true,
        telegram2FaEnabled: true,
      },
    });
    return updated;
  }

  /**
   * Main Webhook Handler for Telegram Updates
   */
  async handleWebhook(update: any): Promise<any> {
    const settings = await this.getSettings();
    if (!settings.isEnabled || !settings.botToken) {
      return { ok: true };
    }

    // 1. Handle Callback Queries (Inline Button clicks)
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query, settings);
      return { ok: true };
    }

    // 2. Handle Messages
    if (update.message) {
      await this.handleMessage(update.message, settings);
      return { ok: true };
    }

    return { ok: true };
  }

  /**
   * Handle incoming user messages and commands
   */
  private async handleMessage(message: any, settings: TelegramBotSettings) {
    const chatId = String(message.chat?.id);
    const text: string = (message.text || '').trim();
    const fromUsername: string = message.from?.username || '';

    if (!text) return;

    // 1. Command: /start u_<userId> (Account Linking)
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1 && parts[1].startsWith('u_')) {
        const userId = parts[1].replace('u_', '').trim();
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              telegramChatId: chatId,
              telegramUsername: fromUsername || null,
              telegramNotifications: true,
            },
          });

          await this.callApi(settings.botToken, 'sendMessage', {
            chat_id: chatId,
            text: `🎉 <b>অভিনন্দন ${user.firstName}!</b>\n\nআপনার SafnexBD অ্যাকাউন্ট (@${user.uniqueUserId}) সফলভাবে টেলিগ্রামের সাথে যুক্ত হয়েছে।\n\nএখন থেকে আপনি নতুন মেসেজ, এসক্রো পেমেন্ট ও লেনদেনের সকল আপডেট সাথে সাথে এখানে পেয়ে যাবেন।\n\n<b>প্রয়োজনীয় কমান্ডসমূহ:</b>\n• /menu - প্রধান শর্টকাট মেনু\n• /search &lt;নাম&gt; - ইউজার খুঁজুন ও চ্যাট করুন\n• /balance - ওয়ালেট ব্যালেন্স দেখুন\n• /orders - চলতি লেনদেন দেখুন\n• /complaint - অভিযোগ দাখিল করুন\n• /help - সকল সহায়িকা`,
            parse_mode: 'HTML',
            reply_markup: this.getPersistentMenuKeyboard(settings.miniAppUrl),
          });
          return;
        }
      }

      // General /start greeting
      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `👋 <b>স্বাগতম SafnexBD অফিসিয়াল বটের সাথে!</b>\n\nআপনার SafnexBD অ্যাকাউন্টের সাথে টেলিগ্রাম যুক্ত করতে আপনার SafnexBD ড্যাশবোর্ডের Settings থেকে <b>"Connect Telegram"</b> বাটনে ক্লিক করুন।\n\n🌐 ওয়েবসাইট: ${settings.miniAppUrl || 'https://safnexbd.com'}`,
        parse_mode: 'HTML',
        reply_markup: this.getPersistentMenuKeyboard(settings.miniAppUrl),
      });
      return;
    }

    // Check if user is linked to an account
    const linkedUser = await this.prisma.user.findFirst({
      where: { telegramChatId: chatId, deletedAt: null, isActive: true },
    });

    if (!linkedUser) {
      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `⚠️ আপনার টেলিগ্রাম অ্যাকাউন্টটি কোনো SafnexBD অ্যাকাউন্টের সাথে যুক্ত নেই।\n\nদয়া করে ${settings.miniAppUrl}/dashboard/settings এ গিয়ে টেলিগ্রাম কানেক্ট করুন।`,
        parse_mode: 'HTML',
      });
      return;
    }

    // 2. Command: /menu or 📱 মেনু
    if (text === '/menu' || text.toLowerCase() === 'menu' || text === '📱 মেনু') {
      const siteUrl = (settings.miniAppUrl || 'https://safnexbd.com').replace(/\/$/, '');
      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `📱 <b>SafnexBD প্রধান মেনু (Quick Actions):</b>\n\nনিচের বোতামগুলো ব্যবহার করে এক ক্লিকেই আপনার প্রয়োজনীয় অপশনে যান অথবা ওয়েবভিউ অ্যাপ ওপেন করুন:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⚡ ড্যাশবোর্ড (WebApp)', web_app: { url: `${siteUrl}/dashboard` } },
              { text: '💬 লাইভ চ্যাট ও ডিল', web_app: { url: `${siteUrl}/dashboard/chat` } },
            ],
            [
              { text: '💰 ওয়ালেট ও ব্যালেন্স', web_app: { url: `${siteUrl}/dashboard/wallet` } },
              { text: '📢 অভিযোগ দাখিল করুন', web_app: { url: `${siteUrl}/dashboard?openComplaint=true` } },
            ],
          ],
        },
      });
      return;
    }

    // 3. Command: /complaint or 📢 অভিযোগ দাখিল করুন
    if (
      text === '/complaint' ||
      text.startsWith('/complaint') ||
      text === '📢 অভিযোগ দাখিল করুন' ||
      text === '📢 অভিযোগ দাখিল'
    ) {
      const siteUrl = (settings.miniAppUrl || 'https://safnexbd.com').replace(/\/$/, '');
      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `📢 <b>SafnexBD অভিযোগ দাখিল সেবা (Grievance Center):</b>\n\nআপনার যেকোনো এসক্রো লেনদেন, প্রতারণা, অ্যাকাউন্ট বা সার্ভিস সংক্রান্ত সমস্যা প্রমাণাদিসহ জমা দিতে নিচের বাটনে ক্লিক করুন। আমাদের সিনিয়র অ্যাডমিন টিম অগ্রাধিকার ভিত্তিতে তা নিষ্পত্তি করবে।`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📝 অভিযোগ ফর্ম ওপেন করুন (WebApp)',
                web_app: { url: `${siteUrl}/dashboard?openComplaint=true` },
              },
            ],
            [
              {
                text: '📞 লাইভ অ্যাডমিন সাপোর্ট চ্যাট',
                web_app: { url: `${siteUrl}/dashboard/chat` },
              },
            ],
          ],
        },
      });
      return;
    }

    // Keyboard Shortcuts
    if (text === '🔍 ইউজার সার্চ') {
      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `🔍 <b>ইউজার সার্চ করতে লিখুন:</b>\n<code>/search রহিম</code> বা <code>/search Rahim2345</code>`,
        parse_mode: 'HTML',
      });
      return;
    }

    // 4. Command: /search <query> or /find <query> (P2P User Search)
    if (text.startsWith('/search') || text.startsWith('/find')) {
      if (!settings.allowUserSearch) {
        await this.callApi(settings.botToken, 'sendMessage', {
          chat_id: chatId,
          text: `⚠️ অ্যাডমিন বর্তমানে টেলিগ্রাম থেকে ইউজার সার্চ সাময়িকভাবে বন্ধ রেখেছেন।`,
          parse_mode: 'HTML',
        });
        return;
      }

      const q = text.replace(/^\/(search|find)/, '').trim();
      if (!q) {
        await this.callApi(settings.botToken, 'sendMessage', {
          chat_id: chatId,
          text: `🔍 <b>ইউজার সার্চ করতে লিখুন:</b>\n<code>/search রহিম</code> বা <code>/search Rahim2345</code>`,
          parse_mode: 'HTML',
        });
        return;
      }

      const results = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          id: { not: linkedUser.id },
          OR: [
            { uniqueUserId: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { businessName: { contains: q } },
          ],
        },
        select: {
          id: true,
          uniqueUserId: true,
          firstName: true,
          lastName: true,
          isVerified: true,
          _count: {
            select: { receivedReviews: true, receivedTransactions: true },
          },
        },
        take: 5,
      });

      if (results.length === 0) {
        await this.callApi(settings.botToken, 'sendMessage', {
          chat_id: chatId,
          text: `🔍 "${q}" দিয়ে কোনো ইউজার খুঁজে পাওয়া যায়নি।`,
          parse_mode: 'HTML',
        });
        return;
      }

      for (const target of results) {
        const dName = `${target.firstName} ${target.lastName}`.trim();
        const badge = target.isVerified ? '🛡️ Verified' : '👤 Member';
        const msg = `👤 <b>${dName}</b> (@${target.uniqueUserId})\n🏷️ স্ট্যাটাস: ${badge}\n📦 সফল লেনদেন: ${target._count.receivedTransactions}টি`;

        const inlineKeyboard: any[] = [];
        if (settings.allowP2pChat) {
          inlineKeyboard.push([
            {
              text: `💬 চ্যাট শুরু করুন (@${target.uniqueUserId})`,
              callback_data: `chat_with_${target.id}`,
            },
          ]);
        }

        inlineKeyboard.push([
          {
            text: '👁️ প্রোফাইল দেখুন',
            url: `${settings.miniAppUrl}/users/${target.uniqueUserId}`,
          },
        ]);

        await this.callApi(settings.botToken, 'sendMessage', {
          chat_id: chatId,
          text: msg,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: inlineKeyboard },
        });
      }
      return;
    }

    // 5. Command: /balance
    if (text === '/balance' || text === '💰 ওয়ালেট ও ব্যালেন্স') {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: linkedUser.id },
      });
      const available = wallet ? Number(wallet.availableBalance).toFixed(2) : '0.00';
      const hold = wallet ? Number(wallet.holdBalance).toFixed(2) : '0.00';

      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `💰 <b>আপনার SafnexBD ওয়ালেট ব্যালেন্স:</b>\n\n• ব্যবহারযোগ্য ব্যালেন্স: <b>৳${available}</b>\n• এসক্রো হোল্ড ব্যালেন্স: <b>৳${hold}</b>\n\nরিচার্জ বা উইথড্র করতে নিচে ক্লিক করুন:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💳 রিচার্জ (WebApp)', web_app: { url: `${settings.miniAppUrl}/dashboard/wallet` } },
              { text: '💸 উত্তোলন (WebApp)', web_app: { url: `${settings.miniAppUrl}/dashboard/wallet` } },
            ],
          ],
        },
      });
      return;
    }

    // 6. Command: /orders
    if (text === '/orders' || text === '📦 চলতি লেনদেন') {
      const orders = await this.prisma.transaction.findMany({
        where: {
          OR: [{ senderId: linkedUser.id }, { receiverId: linkedUser.id }],
          status: { in: ['HOLD', 'REQUESTED', 'WORKING', 'DISPUTED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          sender: { select: { uniqueUserId: true, firstName: true } },
          receiver: { select: { uniqueUserId: true, firstName: true } },
        },
      });

      if (orders.length === 0) {
        await this.callApi(settings.botToken, 'sendMessage', {
          chat_id: chatId,
          text: `📦 বর্তমানে আপনার কোনো চলমান এসক্রো লেনদেন নেই।`,
          parse_mode: 'HTML',
        });
        return;
      }

      let msg = `📦 <b>আপনার চলমান এসক্রো লেনদেনসমূহ:</b>\n\n`;
      for (const o of orders) {
        const isBuyer = o.senderId === linkedUser.id;
        const counterpart = isBuyer ? o.receiver?.firstName : o.sender?.firstName;
        msg += `• <b>#${o.id.slice(0, 8)}</b> - ৳${Number(o.amount).toFixed(0)} (${o.status})\n  পার্টনার: ${counterpart || 'N/A'}\n  <a href="${settings.miniAppUrl}/dashboard/chat">চ্যাট ওপেন করুন</a>\n\n`;
      }

      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: msg,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💬 লাইভ চ্যাট ও ডিল দেখুন (WebApp)',
                web_app: { url: `${settings.miniAppUrl}/dashboard/chat` },
              },
            ],
          ],
        },
      });
      return;
    }

    // 7. Command: /help & /support
    if (text === '/help' || text === '❓ হেল্প' || text === '/support') {
      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `🤖 <b>SafnexBD বট সহায়িকা:</b>\n\n• /menu - প্রধান অ্যাকশন মেনু\n• /search &lt;নাম/আইডি&gt; - ইউজার খুঁজুন\n• /balance - ওয়ালেট ব্যালেন্স জানুন\n• /orders - চলতি লেনদেনের অবস্থা\n• /complaint - অভিযোগ দাখিল করুন\n• /support - হেল্পলাইন ও সাপোর্ট\n• /help - কমান্ড তালিকা`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⚡ SafnexBD ড্যাশবোর্ড ওপেন করুন',
                web_app: { url: `${settings.miniAppUrl}/dashboard` },
              },
            ],
          ],
        },
      });
      return;
    }

    // 6. Direct Chat Session Reply (P2P Chat Sync)
    // If the user has an active chat session set in telegramLastActiveSession
    if (linkedUser.telegramLastActiveSession && settings.allowP2pChat) {
      const targetUserId = linkedUser.telegramLastActiveSession;
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          uniqueUserId: true,
          firstName: true,
          telegramChatId: true,
          telegramNotifications: true,
          isActive: true,
          deletedAt: true,
        },
      });

      if (targetUser && !targetUser.deletedAt && targetUser.isActive) {
        try {
          // Get or create conversation in SafnexBD
          const conv = await this.chatService.getOrCreateConversation(
            linkedUser.id,
            targetUser.id,
          );

          // Save message in SafnexBD
          await this.chatService.saveMessage({
            conversationId: conv.id,
            senderId: linkedUser.id,
            content: text,
            messageType: 'TEXT',
          });

          // Forward to target user's telegram if connected
          if (targetUser.telegramChatId && targetUser.telegramNotifications) {
            await this.callApi(settings.botToken, 'sendMessage', {
              chat_id: targetUser.telegramChatId,
              text: `📩 <b>[SafnexBD] @${linkedUser.uniqueUserId}</b>:\n${text}`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: `💬 উত্তর দিন (@${linkedUser.uniqueUserId})`,
                      callback_data: `chat_with_${linkedUser.id}`,
                    },
                  ],
                ],
              },
            });
          }

          await this.callApi(settings.botToken, 'sendMessage', {
            chat_id: chatId,
            text: `✅ @${targetUser.uniqueUserId}-কে মেসেজ পাঠানো হয়েছে!`,
            parse_mode: 'HTML',
          });
          return;
        } catch (err: any) {
          this.logger.error(`Failed to forward Telegram P2P message: ${err.message}`);
        }
      }
    }

    // Default response for unrecognized text
    await this.callApi(settings.botToken, 'sendMessage', {
      chat_id: chatId,
      text: `🤖 আপনার বার্তাটি পেয়েছি। কমান্ড দেখতে /help লিখুন অথবা কারো সাথে চ্যাট করতে /search <নাম> লিখুন।`,
      parse_mode: 'HTML',
    });
  }

  /**
   * Handle Inline Button clicks (Callback Queries)
   */
  private async handleCallbackQuery(
    callbackQuery: any,
    settings: TelegramBotSettings,
  ) {
    const data: string = callbackQuery.data || '';
    const chatId = String(callbackQuery.message?.chat?.id);
    const callbackQueryId = callbackQuery.id;

    // Acknowledge callback query
    await this.callApi(settings.botToken, 'answerCallbackQuery', {
      callback_query_id: callbackQueryId,
    });

    const linkedUser = await this.prisma.user.findFirst({
      where: { telegramChatId: chatId, deletedAt: null, isActive: true },
    });

    if (!linkedUser) return;

    // Handle chat_with_<targetUserId>
    if (data.startsWith('chat_with_')) {
      if (!settings.allowP2pChat) {
        await this.callApi(settings.botToken, 'sendMessage', {
          chat_id: chatId,
          text: `⚠️ অ্যাডমিন বর্তমানে টেলিগ্রাম থেকে সরাসরি চ্যাট সাময়িকভাবে বন্ধ রেখেছেন।`,
          parse_mode: 'HTML',
        });
        return;
      }

      const targetUserId = data.replace('chat_with_', '').trim();
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!targetUser) {
        await this.callApi(settings.botToken, 'sendMessage', {
          chat_id: chatId,
          text: `⚠️ ইউজার পাওয়া যায়নি।`,
          parse_mode: 'HTML',
        });
        return;
      }

      // Set active chat session
      await this.prisma.user.update({
        where: { id: linkedUser.id },
        data: { telegramLastActiveSession: targetUserId },
      });

      await this.callApi(settings.botToken, 'sendMessage', {
        chat_id: chatId,
        text: `💬 <b>@${targetUser.uniqueUserId} (${targetUser.firstName}) এর সাথে চ্যাট সেশন চালু হয়েছে!</b>\n\nআপনি এখন যা লিখে পাঠাবেন, তা সরাসরি তার কাছে চলে যাবে।\n\n<i>(সেশন বন্ধ করতে /help লিখুন)</i>`,
        parse_mode: 'HTML',
      });
    }
  }
}
