import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from './sms.service';

export type OtpPurpose = 'FORGOT_PASSWORD' | 'WITHDRAWAL';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  /**
   * Generate secure random numeric OTP using cryptographically strong CSPRNG
   */
  generateNumericCode(length = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length);
    return String(crypto.randomInt(min, max));
  }

  /**
   * Send 6-digit OTP code to user via SMS and/or Email
   */
  async sendOtp(params: {
    identifier: string; // phone number or email
    purpose: OtpPurpose;
    metadata?: any;
    lang?: 'bn' | 'en';
  }) {
    const cleanIdentifier = params.identifier.trim();
    if (!cleanIdentifier) {
      throw new BadRequestException('Phone number or email is required to send OTP');
    }

    const modes = await this.smsService.getSecurityModesConfig();
    const expiryMinutes = modes.otpExpiryMinutes || 5;
    const length = modes.otpLength || 6;

    // Rate Limiting: Check if an OTP was sent in the last 45 seconds
    const recentOtp = await this.prisma.otp.findFirst({
      where: {
        identifier: cleanIdentifier,
        purpose: params.purpose,
        createdAt: { gt: new Date(Date.now() - 45 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      throw new BadRequestException('অনুগ্রহ করে ৪৫ সেকেন্ড অপেক্ষা করে পুনরায় ওটিপি কোডের জন্য চেষ্টা করুন।');
    }

    const code = this.generateNumericCode(length);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save OTP in database
    await this.prisma.otp.create({
      data: {
        identifier: cleanIdentifier,
        code,
        purpose: params.purpose,
        expiresAt,
        isUsed: false,
        metadata: params.metadata || undefined,
      },
    });

    // Determine channels
    const isEmail = cleanIdentifier.includes('@');
    const templateKey = params.purpose === 'WITHDRAWAL' ? 'withdraw_otp' : 'forgot_password_otp';

    // Fetch user for personalized name & cross-channel notification
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { phone: cleanIdentifier },
          { uniqueUserId: cleanIdentifier },
        ],
      },
      select: { firstName: true, lastName: true, phone: true, email: true },
    });

    const targetPhone = isEmail ? user?.phone : cleanIdentifier;
    const targetEmail = isEmail ? cleanIdentifier : user?.email;
    const recipientName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';

    const dispatchResult = await this.smsService.triggerEventNotification({
      eventKey: templateKey,
      recipientPhone: targetPhone || undefined,
      recipientEmail: targetEmail || undefined,
      variables: {
        name: recipientName,
        otp: code,
        expiry: expiryMinutes,
        amount: params.metadata?.amount || '',
        method: params.metadata?.method || '',
      },
      lang: params.lang || 'bn',
    });

    this.logger.log(
      `[OTP DISPATCHED] Purpose: ${params.purpose} | Target: ${cleanIdentifier} | Code: ${code} | Expiry: ${expiryMinutes}m`,
    );

    return {
      success: true,
      identifier: cleanIdentifier,
      purpose: params.purpose,
      expiresAt: expiresAt.toISOString(),
      expiryMinutes,
      // In development or when gateway is not enabled, return simulated hint
      isSimulated: dispatchResult?.sms?.response === 'SIMULATED_SUCCESS_GATEWAY_OFF',
      simulatedCode:
        process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  /**
   * Verify an OTP code provided by user
   */
  async verifyOtp(params: {
    identifier: string;
    purpose: OtpPurpose;
    code: string;
  }): Promise<{ valid: boolean; otpId: string; metadata?: any }> {
    const cleanIdentifier = params.identifier.trim();
    const cleanCode = params.code.trim();

    if (!cleanCode) {
      throw new BadRequestException('অনুগ্রহ করে ওটিপি কোডটি প্রদান করুন');
    }

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        identifier: cleanIdentifier,
        purpose: params.purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('ভুল অথবা মেয়াদোত্তীর্ণ ওটিপি কোড প্রদান করেছেন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }

    if (otpRecord.attempts >= 5) {
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });
      throw new BadRequestException('অতিরিক্ত ভুল চেষ্টার কারণে ওটিপি কোডটি বাতিল করা হয়েছে। অনুগ্রহ করে নতুন কোড নিন।');
    }

    if (otpRecord.code !== cleanCode) {
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      const remainingAttempts = 4 - otpRecord.attempts;
      if (remainingAttempts <= 0) {
        await this.prisma.otp.update({
          where: { id: otpRecord.id },
          data: { isUsed: true },
        });
        throw new BadRequestException('অতিরিক্ত ভুল চেষ্টার কারণে ওটিপি কোডটি বাতিল করা হয়েছে। অনুগ্রহ করে নতুন কোড নিন।');
      }
      throw new BadRequestException(`ভুল ওটিপি কোড প্রদান করেছেন। অবশিষ্ট চেষ্টা: ${remainingAttempts} বার।`);
    }

    // Mark as used
    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return {
      valid: true,
      otpId: otpRecord.id,
      metadata: otpRecord.metadata,
    };
  }
}

