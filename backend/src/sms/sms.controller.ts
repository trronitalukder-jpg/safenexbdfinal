import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  GatewayTemplatesMap,
  MailGatewayConfig,
  SecurityModesConfig,
  SmsGatewayConfig,
} from './sms.types';

@Controller('sms')
export class SmsController {
  constructor(private smsService: SmsService) {}

  /**
   * Public endpoint: Get active security modes for frontend dynamic UI adaptation
   */
  @Get('public-modes')
  async getPublicModes() {
    const [modes, sms, mail] = await Promise.all([
      this.smsService.getSecurityModesConfig(),
      this.smsService.getSmsGatewayConfig(),
      this.smsService.getMailGatewayConfig(),
    ]);

    const isSmsEnabled = Boolean(sms.isEnabled);
    const isMailEnabled = Boolean(mail.isEnabled);
    const isAnyGatewayEnabled = isSmsEnabled || isMailEnabled;

    // If gateways are off, OTP cannot be used for password reset (force MANUAL)
    const effectiveForgotPasswordMode = isAnyGatewayEnabled
      ? (modes.forgotPasswordMode || 'MANUAL')
      : 'MANUAL';

    return {
      forgotPasswordMode: effectiveForgotPasswordMode,
      withdrawOtpEnabled: Boolean(modes.withdrawOtpEnabled),
      isAnyGatewayEnabled,
      isSmsEnabled,
      isMailEnabled,
      otpExpiryMinutes: modes.otpExpiryMinutes || 5,
      otpLength: modes.otpLength || 6,
    };
  }

  /**
   * Super Admin & Admin: Get all gateway credentials, security modes, and templates
   */
  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getFullConfig() {
    return this.smsService.getAllConfig();
  }

  /**
   * Super Admin & Admin: Update gateway credentials, security modes, and templates
   */
  @Post('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async saveConfig(
    @Body()
    body: {
      sms?: Partial<SmsGatewayConfig>;
      mail?: Partial<MailGatewayConfig>;
      modes?: Partial<SecurityModesConfig>;
      securityModes?: Partial<SecurityModesConfig>;
      templates?: Partial<GatewayTemplatesMap>;
    },
  ) {
    const modes = body.modes || body.securityModes;
    return this.smsService.saveAllConfig({
      sms: body.sms,
      mail: body.mail,
      modes,
      templates: body.templates,
    });
  }

  /**
   * Super Admin & Admin: Send Test SMS
   */
  @Post('test-sms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async sendTestSms(
    @Body() body: { phone: string; message?: string },
    @CurrentUser() user: any,
  ) {
    if (!body.phone || !body.phone.trim()) {
      throw new BadRequestException('Phone number is required for test SMS');
    }

    const testMessage =
      body.message?.trim() ||
      `সেফনেক্সবিডি টেস্ট এসএমএস: আপনার এসএমএস গেটওয়ে সফলভাবে কনফিগার হয়েছে! প্রেরক: ${user.firstName || 'Admin'}`;

    const result = await this.smsService.sendSms(body.phone.trim(), testMessage);
    return {
      success: result.success,
      phone: body.phone.trim(),
      message: testMessage,
      gatewayResponse: result.response,
      error: result.error,
    };
  }

  /**
   * Super Admin & Admin: Send Test Email
   */
  @Post('test-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async sendTestEmail(
    @Body() body: { email: string; subject?: string; message?: string },
    @CurrentUser() user: any,
  ) {
    if (!body.email || !body.email.trim()) {
      throw new BadRequestException('Email address is required for test email');
    }

    const subject = body.subject?.trim() || 'SafnexBD Test Email - Gateway Verification';
    const message =
      body.message?.trim() ||
      `This is a test email sent from SafnexBD Admin Panel to verify SMTP configuration.\nTested by: ${user.firstName || 'Admin'}`;

    const result = await this.smsService.sendEmail(body.email.trim(), subject, message);
    return {
      success: result.success,
      email: body.email.trim(),
      subject,
      messageId: result.messageId,
      error: result.error,
    };
  }
}

