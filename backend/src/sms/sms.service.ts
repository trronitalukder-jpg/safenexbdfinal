import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import {
  DEFAULT_MAIL_GATEWAY,
  DEFAULT_SECURITY_MODES,
  DEFAULT_SMS_GATEWAY,
  DEFAULT_GATEWAY_TEMPLATES,
  GatewayTemplatesMap,
  MailGatewayConfig,
  SecurityModesConfig,
  SmsGatewayConfig,
} from './sms.types';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION RETRIEVAL & UPDATE
  // ---------------------------------------------------------------------------
  async getSmsGatewayConfig(): Promise<SmsGatewayConfig> {
    try {
      const rec = await this.prisma.systemSetting.findUnique({ where: { key: 'GATEWAY_SMS' } });
      if (!rec?.value) return DEFAULT_SMS_GATEWAY;
      const val = typeof rec.value === 'string' ? JSON.parse(rec.value) : rec.value;
      return { ...DEFAULT_SMS_GATEWAY, ...val };
    } catch {
      return DEFAULT_SMS_GATEWAY;
    }
  }

  async getMailGatewayConfig(): Promise<MailGatewayConfig> {
    try {
      const rec = await this.prisma.systemSetting.findUnique({ where: { key: 'GATEWAY_MAIL' } });
      if (!rec?.value) return DEFAULT_MAIL_GATEWAY;
      const val = typeof rec.value === 'string' ? JSON.parse(rec.value) : rec.value;
      return { ...DEFAULT_MAIL_GATEWAY, ...val };
    } catch {
      return DEFAULT_MAIL_GATEWAY;
    }
  }

  async getSecurityModesConfig(): Promise<SecurityModesConfig> {
    try {
      const rec = await this.prisma.systemSetting.findUnique({ where: { key: 'GATEWAY_SECURITY_MODES' } });
      if (!rec?.value) return DEFAULT_SECURITY_MODES;
      const val = typeof rec.value === 'string' ? JSON.parse(rec.value) : rec.value;
      return { ...DEFAULT_SECURITY_MODES, ...val };
    } catch {
      return DEFAULT_SECURITY_MODES;
    }
  }

  async getTemplatesConfig(): Promise<GatewayTemplatesMap> {
    try {
      const rec = await this.prisma.systemSetting.findUnique({ where: { key: 'GATEWAY_TEMPLATES' } });
      if (!rec?.value) return DEFAULT_GATEWAY_TEMPLATES;
      const val = typeof rec.value === 'string' ? JSON.parse(rec.value) : rec.value;
      return { ...DEFAULT_GATEWAY_TEMPLATES, ...val };
    } catch {
      return DEFAULT_GATEWAY_TEMPLATES;
    }
  }

  async getAllConfig() {
    const [sms, mail, modes, templates] = await Promise.all([
      this.getSmsGatewayConfig(),
      this.getMailGatewayConfig(),
      this.getSecurityModesConfig(),
      this.getTemplatesConfig(),
    ]);

    return { sms, mail, modes, securityModes: modes, templates };
  }

  async saveAllConfig(dto: {
    sms?: Partial<SmsGatewayConfig>;
    mail?: Partial<MailGatewayConfig>;
    modes?: Partial<SecurityModesConfig>;
    securityModes?: Partial<SecurityModesConfig>;
    templates?: Partial<GatewayTemplatesMap>;
  }) {
    if (dto.sms) {
      const current = await this.getSmsGatewayConfig();
      const updated = { ...current, ...dto.sms };
      await this.prisma.systemSetting.upsert({
        where: { key: 'GATEWAY_SMS' },
        create: {
          key: 'GATEWAY_SMS',
          value: updated as any,
          category: 'SMS',
          isPublic: false,
          description: 'SMS Gateway credentials and endpoint mapping',
        },
        update: { value: updated as any },
      });
    }

    if (dto.mail) {
      const current = await this.getMailGatewayConfig();
      const updated = { ...current, ...dto.mail };
      await this.prisma.systemSetting.upsert({
        where: { key: 'GATEWAY_MAIL' },
        create: {
          key: 'GATEWAY_MAIL',
          value: updated as any,
          category: 'MAIL',
          isPublic: false,
          description: 'SMTP Email Gateway credentials',
        },
        update: { value: updated as any },
      });
    }

    const modesPayload = dto.modes || dto.securityModes;
    if (modesPayload) {
      const current = await this.getSecurityModesConfig();
      const updated = { ...current, ...modesPayload };
      await this.prisma.systemSetting.upsert({
        where: { key: 'GATEWAY_SECURITY_MODES' },
        create: {
          key: 'GATEWAY_SECURITY_MODES',
          value: updated as any,
          category: 'SMS',
          isPublic: true,
          description: 'Security & OTP mode switches for withdrawals and password resets',
        },
        update: { value: updated as any },
      });
    }

    if (dto.templates) {
      const current = await this.getTemplatesConfig();
      const updated = { ...current, ...dto.templates };
      await this.prisma.systemSetting.upsert({
        where: { key: 'GATEWAY_TEMPLATES' },
        create: {
          key: 'GATEWAY_TEMPLATES',
          value: updated as any,
          category: 'SMS',
          isPublic: false,
          description: 'Multi-lingual SMS & Email event trigger templates',
        },
        update: { value: updated as any },
      });
    }

    return this.getAllConfig();
  }

  // ---------------------------------------------------------------------------
  // 2. TEMPLATE COMPILATION
  // ---------------------------------------------------------------------------
  compileTemplate(templateStr: string, variables: Record<string, string | number>): string {
    let result = templateStr;
    for (const [key, val] of Object.entries(variables)) {
      const safeVal = String(val !== undefined && val !== null ? val : '');
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, safeVal);
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // 3. SMS DISPATCHER
  // ---------------------------------------------------------------------------
  async sendSms(phone: string, message: string): Promise<{ success: boolean; response?: any; error?: string }> {
    const config = await this.getSmsGatewayConfig();

    if (!config.isEnabled || !config.apiUrl) {
      this.logger.log(`[SIMULATED SMS] To: ${phone} | Content: "${message}" (SMS Gateway is OFF or unconfigured)`);
      return { success: true, response: 'SIMULATED_SUCCESS_GATEWAY_OFF' };
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    try {
      let url = config.apiUrl;
      let options: RequestInit = {
        method: config.httpMethod,
        headers: { ...(config.customHeaders || {}) },
      };

      if (config.provider === 'BULKSMSBD') {
        // BulkSMSBD Standard Endpoint: http://bulksmsbd.net/api/smsapi
        const queryParams = new URLSearchParams({
          api_key: config.apiKey,
          type: 'text',
          number: cleanPhone,
          senderid: config.senderId || '',
          message: message,
        });

        if (config.httpMethod === 'POST') {
          options.body = queryParams;
          options.headers = { ...options.headers, 'Content-Type': 'application/x-www-form-urlencoded' };
        } else {
          url += (url.includes('?') ? '&' : '?') + queryParams.toString();
        }
      } else if (config.provider === 'GREENWEB') {
        // Greenweb Standard Endpoint: http://api.greenweb.com.bd/api.php
        const queryParams = new URLSearchParams({
          token: config.apiKey,
          to: cleanPhone,
          message: message,
        });
        url += (url.includes('?') ? '&' : '?') + queryParams.toString();
      } else if (config.provider === 'MIMSMS') {
        // MimSMS Standard Endpoint
        const payload = {
          token: config.apiKey,
          sender_id: config.senderId || '',
          receiver: cleanPhone,
          message: message,
        };
        options.method = 'POST';
        options.body = JSON.stringify(payload);
        options.headers = { ...options.headers, 'Content-Type': 'application/json' };
      } else {
        // GENERIC_HTTP / CUSTOM
        const toKey = config.paramMapping?.toParam || 'to';
        const msgKey = config.paramMapping?.messageParam || 'message';
        const apiKeyKey = config.paramMapping?.apiKeyParam || 'api_key';
        const senderIdKey = config.paramMapping?.senderIdParam || 'sender_id';

        const payloadObj: Record<string, any> = {
          [toKey]: cleanPhone,
          [msgKey]: message,
        };
        if (config.apiKey) payloadObj[apiKeyKey] = config.apiKey;
        if (config.senderId) payloadObj[senderIdKey] = config.senderId;
        if (config.clientId) payloadObj['client_id'] = config.clientId;

        if (config.requestFormat === 'JSON' && config.httpMethod === 'POST') {
          options.body = JSON.stringify(payloadObj);
          options.headers = { ...options.headers, 'Content-Type': 'application/json' };
        } else {
          const queryParams = new URLSearchParams();
          for (const [k, v] of Object.entries(payloadObj)) {
            queryParams.append(k, String(v));
          }
          if (config.httpMethod === 'POST') {
            options.body = queryParams;
            options.headers = { ...options.headers, 'Content-Type': 'application/x-www-form-urlencoded' };
          } else {
            url += (url.includes('?') ? '&' : '?') + queryParams.toString();
          }
        }
      }

      this.logger.log(`Dispatching SMS to ${cleanPhone} via ${config.provider}...`);
      const response = await fetch(url, options);
      const text = await response.text();
      let parsed = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Keep plain text
      }

      this.logger.log(`SMS Gateway Response for ${cleanPhone}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
      return { success: response.ok, response: parsed };
    } catch (err: any) {
      this.logger.error(`SMS send error to ${cleanPhone}: ${err.message}`, err.stack);
      return { success: false, error: err.message };
    }
  }

  // ---------------------------------------------------------------------------
  // 4. EMAIL DISPATCHER
  // ---------------------------------------------------------------------------
  async sendEmail(
    toEmail: string,
    subject: string,
    bodyText: string,
    bodyHtml?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.getMailGatewayConfig();

    if (!config.isEnabled || !config.host || !config.user) {
      this.logger.log(`[SIMULATED EMAIL] To: ${toEmail} | Subject: "${subject}" | Content: "${bodyText}" (Mail Gateway is OFF or unconfigured)`);
      return { success: true, messageId: 'SIMULATED_SUCCESS_GATEWAY_OFF' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port || 587,
        secure: Boolean(config.secure),
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${config.fromName || 'SafnexBD'}" <${config.fromEmail || config.user}>`,
        to: toEmail,
        subject: subject,
        text: bodyText,
        html: bodyHtml || `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">${bodyText.replace(/\n/g, '<br/>')}</div>`,
      });

      this.logger.log(`Email dispatched to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`Email dispatch failed to ${toEmail}: ${err.message}`, err.stack);
      return { success: false, error: err.message };
    }
  }

  // ---------------------------------------------------------------------------
  // 5. TRIGGER EVENT NOTIFIER
  // ---------------------------------------------------------------------------
  async triggerEventNotification(params: {
    eventKey: string;
    recipientPhone?: string | null;
    recipientEmail?: string | null;
    variables: Record<string, string | number>;
    lang?: 'bn' | 'en';
  }) {
    const templates = await this.getTemplatesConfig();
    const template = templates[params.eventKey];

    if (!template || !template.isEnabled) {
      return { triggered: false, reason: 'TEMPLATE_DISABLED_OR_NOT_FOUND' };
    }

    const preferredLang = params.lang || 'bn';
    const rawTemplate = preferredLang === 'en' ? template.templateEn || template.templateBn : template.templateBn;
    const finalMessage = this.compileTemplate(rawTemplate, {
      ...params.variables,
      siteName: 'SafnexBD',
    });

    const results: any = { triggered: true };

    if (params.recipientPhone) {
      results.sms = await this.sendSms(params.recipientPhone, finalMessage);
    }

    if (params.recipientEmail) {
      const subject = `${template.titleBn} - SafnexBD`;
      results.email = await this.sendEmail(params.recipientEmail, subject, finalMessage);
    }

    return results;
  }
}

