import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

import { OtpService } from '../sms/otp.service';
import { SmsService } from '../sms/sms.service';
import { purgeOrScrubUser } from '../common/utils/user-cleanup.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Optional() private chatGateway?: ChatGateway,
    @Optional() private otpService?: OtpService,
    @Optional() private smsService?: SmsService,
  ) {}

  /**
   * Generates a unique user ID per Spec #8:
   * Format: FirstName + Last 4 Digit of Phone
   * Example: Rahim2345. If duplicate: Rahim2345A, Rahim2345B, etc.
   */
  async generateUniqueUserId(firstName: string, phone: string): Promise<string> {
    const cleanName = firstName.trim().replace(/[^a-zA-Z]/g, '');
    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const last4 = cleanPhone.slice(-4) || '0000';
    const baseId = `${formattedName}${last4}`;

    let candidate = baseId;
    let suffixIndex = 0;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    while (true) {
      const existing = await this.prisma.user.findUnique({
        where: { uniqueUserId: candidate },
      });

      if (!existing) {
        return candidate;
      }

      if (suffixIndex < alphabet.length) {
        candidate = `${baseId}${alphabet[suffixIndex]}`;
        suffixIndex++;
      } else {
        candidate = `${baseId}${suffixIndex}`;
        suffixIndex++;
      }
    }
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and Confirm Password do not match');
    }

    // Check duplicate email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      if (existingEmail.deletedAt) {
        await purgeOrScrubUser(this.prisma, existingEmail.id);
      } else {
        throw new BadRequestException('An account with this email already exists');
      }
    }

    // Check duplicate phone
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone.trim() },
    });
    if (existingPhone) {
      if (existingPhone.deletedAt) {
        await purgeOrScrubUser(this.prisma, existingPhone.id);
      } else {
        throw new BadRequestException('An account with this phone number already exists');
      }
    }

    const uniqueUserId = await this.generateUniqueUserId(dto.firstName, dto.phone);
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Get default USER role
    const userRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });

    // Create user and wallet inside a transaction
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          uniqueUserId,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone.trim(),
          passwordHash,
          address: dto.address,
          avatarUrl: dto.avatarUrl,
          businessName: dto.businessName,
          businessType: dto.businessType,
          isActive: true,
          wallet: {
            create: {
              availableBalance: 0,
              holdBalance: 0,
            },
          },
        },
        include: {
          wallet: true,
        },
      });

      if (userRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: userRole.id,
          },
        });
      }

      return user;
    });

    // Notify Admins & Staff of New User Registration
    if (this.chatGateway && newUser) {
      this.chatGateway.notifyAdminsAndStaff('notification:admin', {
        type: 'NEW_USER_REGISTRATION',
        title: 'নতুন ইউজার রেজিস্ট্রেশন',
        message: `${newUser.firstName} ${newUser.lastName} (${newUser.uniqueUserId}) নতুন একাউন্ট খুলেছেন।`,
        targetUrl: '/admin/users',
        data: {
          userId: newUser.id,
          uniqueUserId: newUser.uniqueUserId,
          email: newUser.email,
          phone: newUser.phone,
        },
        createdAt: new Date().toISOString(),
      });
    }

    const tokens = await this.generateTokens(newUser.id, newUser.email);
    return {
      user: {
        id: newUser.id,
        uniqueUserId: newUser.uniqueUserId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        avatarUrl: newUser.avatarUrl,
        wallet: newUser.wallet,
        roles: ['USER'],
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    // Find by email, phone number, or uniqueUserId
    const cleanIdentifier = identifier.replace(/^@/, '');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phone: identifier },
          { uniqueUserId: cleanIdentifier },
        ],
      },
      include: {
        wallet: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials or account deactivated');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    );

    let adminPermissions: string[] = [];
    try {
      if (roles.includes('SUPER_ADMIN')) {
        adminPermissions = ['*'];
      } else if (user.adminPermissions) {
        adminPermissions = JSON.parse(user.adminPermissions);
      }
    } catch {
      adminPermissions = [];
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        uniqueUserId: user.uniqueUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        isEmployee: user.isEmployee,
        wallet: user.wallet,
        roles,
        permissions,
        adminPermissions,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'safnexbd_super_secret_jwt_refresh_key_2026_production_grade',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          wallet: true,
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User is not active');
      }

      // Check revoked tokens
      const activeToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId: user.id,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!activeToken) {
        throw new UnauthorizedException('Refresh token revoked or expired');
      }

      // Rotate refresh token
      await this.prisma.refreshToken.update({
        where: { id: activeToken.id },
        data: { isRevoked: true },
      });

      const tokens = await this.generateTokens(user.id, user.email);

      const roles = user.userRoles.map((ur) => ur.role.name);
      const permissions = Array.from(
        new Set(
          user.userRoles.flatMap((ur) =>
            ur.role.permissions.map((rp) => rp.permission.code),
          ),
        ),
      );

      return {
        user: {
          id: user.id,
          uniqueUserId: user.uniqueUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          wallet: user.wallet,
          roles,
          permissions,
        },
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        paymentAccounts: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    );

    let adminPermissions: string[] = [];
    try {
      if (roles.includes('SUPER_ADMIN')) {
        adminPermissions = ['*'];
      } else if (user.adminPermissions) {
        adminPermissions = JSON.parse(user.adminPermissions);
      }
    } catch {
      adminPermissions = [];
    }

    return {
      id: user.id,
      uniqueUserId: user.uniqueUserId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      additionalPhone: user.additionalPhone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      country: user.country,
      division: user.division,
      district: user.district,
      upazila: user.upazila,
      city: user.city,
      address: user.address,
      postalCode: user.postalCode,
      profession: user.profession,
      company: user.company,
      jobTitle: user.jobTitle,
      institution: user.institution,
      department: user.department,
      educationLevel: user.educationLevel,
      graduationYear: user.graduationYear,
      headline: user.headline,
      bio: user.bio,
      skills: user.skills,
      interests: user.interests,
      languages: user.languages,
      website: user.website,
      socialLinks: user.socialLinks,
      businessName: user.businessName,
      businessType: user.businessType,
      twoFactorEnabled: user.twoFactorEnabled,
      profileVisibility: user.profileVisibility,
      whoCanMessage: user.whoCanMessage,
      showPhone: user.showPhone,
      showEmail: user.showEmail,
      timezone: user.timezone,
      nidNumber: user.nidNumber,
      nidName: user.nidName,
      nidFrontUrl: user.nidFrontUrl,
      nidBackUrl: user.nidBackUrl,
      verificationStatus: user.verificationStatus,
      verifiedAt: user.verifiedAt,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isEmployee: user.isEmployee,
      wallet: user.wallet,
      paymentAccounts: user.paymentAccounts,
      roles,
      permissions,
      adminPermissions,
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'safnexbd_super_secret_jwt_refresh_key_2026_production_grade',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    };
  }

  /**
   * User requests a password reset (Spec #PasswordReset)
   * Admin will change password and communicate within 24 hours
   */
  async requestForgotPassword(dto: ForgotPasswordDto) {
    const cleanUserId = dto.uniqueUserId.trim().replace(/^@/, '');
    const cleanPhone = dto.phone.trim();

    // Look for matching user
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { uniqueUserId: cleanUserId },
          { phone: cleanPhone },
          ...(dto.email ? [{ email: dto.email.trim() }] : []),
        ],
        deletedAt: null,
      },
    });

    // Create the request
    const request = await this.prisma.passwordResetRequest.create({
      data: {
        userId: user ? user.id : null,
        fullName: dto.fullName.trim(),
        phone: cleanPhone,
        uniqueUserId: cleanUserId,
        email: dto.email?.trim() || user?.email || null,
        notes: dto.notes?.trim() || null,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      message:
        'আপনার পাসওয়ার্ড রিসেট রিকোয়েস্ট সফলভাবে গ্রহণ করা হয়েছে। অ্যাডমিন আপনার পাসওয়ার্ড পরিবর্তন করে ২৪ ঘণ্টার মধ্যে আপনার ফোন অথবা ইমেইলে পাঠিয়ে দেবে।',
      requestId: request.id,
    };
  }

  /**
   * Send OTP for instant self-service password reset
   */
  async sendForgotPasswordOtp(identifier: string) {
    if (!this.otpService) {
      throw new BadRequestException('ওটিপি সার্ভিস বর্তমানে উপলব্ধ নেই');
    }

    const clean = identifier.trim().replace(/^@/, '');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: clean },
          { email: clean.toLowerCase() },
          { uniqueUserId: clean },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('প্রদত্ত ফোন নম্বর বা ইমেইল দিয়ে কোনো ইউজার অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।');
    }

    const target = user.phone || user.email;
    return this.otpService.sendOtp({
      identifier: target,
      purpose: 'FORGOT_PASSWORD',
      metadata: { userId: user.id },
    });
  }

  /**
   * Verify Forgot Password OTP and return temporary Reset Token
   */
  async verifyForgotPasswordOtp(identifier: string, code: string) {
    if (!this.otpService) {
      throw new BadRequestException('ওটিপি সার্ভিস বর্তমানে উপলব্ধ নেই');
    }

    const clean = identifier.trim().replace(/^@/, '');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: clean },
          { email: clean.toLowerCase() },
          { uniqueUserId: clean },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('ইউজার অ্যাকাউন্ট পাওয়া যায়নি');
    }

    const target = user.phone || user.email;
    await this.otpService.verifyOtp({
      identifier: target,
      purpose: 'FORGOT_PASSWORD',
      code: code.trim(),
    });

    // Generate short-lived reset token (15 mins)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'PASSWORD_RESET' },
      {
        secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
        expiresIn: '15m',
      },
    );

    return {
      success: true,
      resetToken,
      message: 'ওটিপি সফলভাবে যাচাই হয়েছে। এখন নতুন পাসওয়ার্ড সেট করুন।',
    };
  }

  /**
   * Reset Password using verified Reset Token
   */
  async resetPasswordWithOtp(body: {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    if (body.newPassword !== body.confirmPassword) {
      throw new BadRequestException('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
    }

    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।');
    }

    let decoded: any;
    try {
      decoded = this.jwtService.verify(body.resetToken, {
        secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
      });
    } catch {
      throw new BadRequestException('পাসওয়ার্ড রিসেট টোকেনটির মেয়াদ শেষ হয়ে গেছে বা অকার্যকর। অনুগ্রহ করে পুনরায় ওটিপি কোড নিন।');
    }

    if (decoded?.purpose !== 'PASSWORD_RESET' || !decoded?.sub) {
      throw new BadRequestException('অবৈধ রিসেট টোকেন');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      throw new NotFoundException('ইউজার অ্যাকাউন্ট পাওয়া যায়নি');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Revoke old refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    return {
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। এখন আপনার নতুন পাসওয়ার্ড দিয়ে লগইন করুন।',
    };
  }
}
