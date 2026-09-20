import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  ChangePasswordDto,
  CreatePaymentAccountDto,
  SearchUserQueryDto,
  UpdatePaymentAccountDto,
  UpdateProfileDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async searchUsers(queryDto: SearchUserQueryDto) {
    const { query, isVerified } = queryDto;
    const limit = queryDto.limit ? Math.max(1, parseInt(String(queryDto.limit), 10)) : 30;

    const whereClause: any = {
      isActive: true,
      deletedAt: null,
    };

    if (query) {
      const q = query.trim();
      const compactQ = q.replace(/[\s\-\(\)]+/g, '');
      const cleanPhone = compactQ.replace(/^\+?88/, '');
      whereClause.OR = [
        { uniqueUserId: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { email: { contains: compactQ } },
        { phone: { contains: q } },
        ...(compactQ && compactQ !== q ? [{ phone: { contains: compactQ } }] : []),
        ...(cleanPhone && cleanPhone !== compactQ ? [{ phone: { contains: cleanPhone } }] : []),
      ];
    }

    if (isVerified === 'true') {
      whereClause.isVerified = true;
    }

    // Check if Super Admin chat presence/visibility is enabled
    try {
      const superAdminVisibilitySetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'super_admin_chat_visibility' },
      });
      let isSuperAdminVisible = false;
      if (superAdminVisibilitySetting?.value) {
        const val =
          typeof superAdminVisibilitySetting.value === 'string'
            ? JSON.parse(superAdminVisibilitySetting.value)
            : superAdminVisibilitySetting.value;
        isSuperAdminVisible = val?.isVisible === true;
      }

      if (!isSuperAdminVisible) {
        whereClause.userRoles = {
          none: {
            role: { name: 'SUPER_ADMIN' },
          },
        };
      }
    } catch {
      // Ignore if setting not initialized yet
    }

    // 1. Fetch active USER_ID bids (respecting scope if provided)
    const bidWhere: any = {
      bidType: 'USER_ID',
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    };
    if (queryDto.scope) {
      bidWhere.scope = queryDto.scope;
    }

    const activeUserBids = await this.prisma.bid.findMany({
      where: bidWhere,
      orderBy: { targetPosition: 'asc' },
      select: {
        id: true,
        targetUserId: true,
        sellerId: true,
        targetPosition: true,
        bidAmount: true,
        expiresAt: true,
        scope: true,
      },
    });

    const userBidMap = new Map<string, any>();
    const bidUserIds: string[] = [];
    for (const b of activeUserBids) {
      const uId = b.targetUserId || b.sellerId;
      if (uId && !userBidMap.has(uId)) {
        userBidMap.set(uId, {
          id: b.id,
          targetPosition: b.targetPosition,
          bidAmount: Number(b.bidAmount),
          expiresAt: b.expiresAt,
          scope: b.scope,
        });
        bidUserIds.push(uId);
      }
    }

    const selectUserFields = {
      id: true,
      uniqueUserId: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
      businessName: true,
      businessType: true,
      _count: {
        select: {
          products: { where: { status: 'ACTIVE' as any } },
          receivedTransactions: { where: { status: 'RELEASED' as any } },
        },
      },
    };

    // 2. Fetch active bid users first
    let bidUsers: any[] = [];
    if (bidUserIds.length > 0) {
      bidUsers = await this.prisma.user.findMany({
        where: {
          ...whereClause,
          id: { in: bidUserIds },
        },
        select: selectUserFields,
      });

      // Sort strictly by targetPosition asc
      bidUsers.sort((a, b) => {
        const posA = userBidMap.get(a.id)?.targetPosition ?? 999;
        const posB = userBidMap.get(b.id)?.targetPosition ?? 999;
        return posA - posB;
      });
    }

    // 3. How many non-bid users do we need to reach limit?
    const remainingLimit = Math.max(0, limit - bidUsers.length);
    let nonBidUsers: any[] = [];
    if (remainingLimit > 0) {
      nonBidUsers = await this.prisma.user.findMany({
        where: {
          ...whereClause,
          ...(bidUserIds.length > 0 ? { id: { notIn: bidUserIds } } : {}),
        },
        select: selectUserFields,
        take: remainingLimit,
        orderBy: { createdAt: 'desc' },
      });
    }

    const allUsers = [...bidUsers, ...nonBidUsers];

    return allUsers.map((u) => ({
      id: u.id,
      uniqueUserId: u.uniqueUserId,
      fullName: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      avatarUrl: u.avatarUrl,
      isVerified: u.isVerified,
      businessName: u.businessName,
      businessType: u.businessType,
      memberSince: u.createdAt,
      activeProductsCount: u._count?.products || 0,
      completedTransactionsCount: u._count?.receivedTransactions || 0,
      bidPosition: userBidMap.get(u.id)?.targetPosition,
      activeBid: userBidMap.get(u.id) || null,
    }));
  }

  async getPublicProfile(uniqueUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { uniqueUserId },
          { id: uniqueUserId },
        ],
      },
      select: {
        id: true,
        uniqueUserId: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        businessName: true,
        businessType: true,
        createdAt: true,
        products: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            productType: true,
            images: { where: { isMain: true }, select: { imageUrl: true }, take: 1 },
          },
          take: 12,
        },
        userRoles: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } },
            receivedTransactions: { where: { status: 'RELEASED' } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${uniqueUserId} not found`);
    }

    const isSuperAdmin = user.userRoles?.some((ur: any) => ur.role?.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      try {
        const superAdminVisibilitySetting = await this.prisma.systemSetting.findUnique({
          where: { key: 'super_admin_chat_visibility' },
        });
        let isSuperAdminVisible = false;
        if (superAdminVisibilitySetting?.value) {
          const val =
            typeof superAdminVisibilitySetting.value === 'string'
              ? JSON.parse(superAdminVisibilitySetting.value)
              : superAdminVisibilitySetting.value;
          isSuperAdminVisible = val?.isVisible === true;
        }
        if (!isSuperAdminVisible) {
          throw new NotFoundException(`User with ID ${uniqueUserId} not found`);
        }
      } catch (err) {
        if (err instanceof NotFoundException) throw err;
      }
    }

    return {
      id: user.id,
      uniqueUserId: user.uniqueUserId,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      businessName: user.businessName,
      businessType: user.businessType,
      memberSince: user.createdAt,
      productsCount: user._count.products,
      completedTransactionsCount: user._count.receivedTransactions,
      products: user.products,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName.trim() }),
        ...(dto.lastName && { lastName: dto.lastName.trim() }),
        ...(dto.avatarUrl && { avatarUrl: dto.avatarUrl.trim() }),
        ...(dto.address && { address: dto.address.trim() }),
        ...(dto.businessName && { businessName: dto.businessName.trim() }),
        ...(dto.businessType && { businessType: dto.businessType.trim() }),
      },
      select: {
        id: true,
        uniqueUserId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        address: true,
        businessName: true,
        businessType: true,
        isVerified: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password cannot be the same as current password');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Record audit log to track password modification timestamp (used for withdrawal security freeze)
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          actorType: 'USER',
          action: 'PASSWORD_CHANGE',
          targetEntity: 'User',
          targetId: userId,
          reason: 'User successfully changed account password',
        },
      });
    } catch {}

    return { success: true, message: 'Password changed successfully' };
  }

  async getPaymentAccounts(userId: string) {
    return this.prisma.userPaymentAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addPaymentAccount(userId: string, dto: CreatePaymentAccountDto) {
    const withdrawalSettings = await this.settingsService.getWithdrawalSettings();
    if (withdrawalSettings.requirePasswordForPayoutAccount) {
      if (!dto.password || !dto.password.trim()) {
        throw new BadRequestException('নিরাপত্তার জন্য আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });
      if (!user) throw new NotFoundException('User not found');
      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('ভুল পাসওয়ার্ড! অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
      }
    }

    const count = await this.prisma.userPaymentAccount.count({ where: { userId } });
    const shouldBeDefault = dto.isDefault !== undefined ? Boolean(dto.isDefault) : count === 0;

    if (shouldBeDefault && count > 0) {
      await this.prisma.userPaymentAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const account = await this.prisma.userPaymentAccount.create({
      data: {
        userId,
        methodType: dto.methodType,
        accountType: dto.accountType || 'PERSONAL',
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim(),
        bankName: dto.bankName?.trim() || null,
        branchName: dto.branchName?.trim() || null,
        routingNumber: dto.routingNumber?.trim() || null,
        isDefault: shouldBeDefault,
      },
    });

    return account;
  }

  async updatePaymentAccount(userId: string, accountId: string, dto: UpdatePaymentAccountDto) {
    const withdrawalSettings = await this.settingsService.getWithdrawalSettings();
    if (withdrawalSettings.requirePasswordForPayoutAccount) {
      if (!dto.password || !dto.password.trim()) {
        throw new BadRequestException('নিরাপত্তার জন্য আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });
      if (!user) throw new NotFoundException('User not found');
      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('ভুল পাসওয়ার্ড! অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
      }
    }

    const account = await this.prisma.userPaymentAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Payment account not found');
    }

    if (dto.isDefault) {
      await this.prisma.userPaymentAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.userPaymentAccount.update({
      where: { id: accountId },
      data: {
        ...(dto.methodType && { methodType: dto.methodType }),
        ...(dto.accountType && { accountType: dto.accountType }),
        ...(dto.accountNumber && { accountNumber: dto.accountNumber.trim() }),
        ...(dto.accountName && { accountName: dto.accountName.trim() }),
        ...(dto.bankName !== undefined && { bankName: dto.bankName?.trim() || null }),
        ...(dto.branchName !== undefined && { branchName: dto.branchName?.trim() || null }),
        ...(dto.routingNumber !== undefined && { routingNumber: dto.routingNumber?.trim() || null }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    return updated;
  }

  async setDefaultPaymentAccount(userId: string, accountId: string) {
    const account = await this.prisma.userPaymentAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Payment account not found');
    }

    await this.prisma.$transaction([
      this.prisma.userPaymentAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      this.prisma.userPaymentAccount.update({
        where: { id: accountId },
        data: { isDefault: true },
      }),
    ]);

    return { success: true, message: 'Default payment account updated successfully' };
  }

  async deletePaymentAccount(userId: string, accountId: string, password?: string) {
    const withdrawalSettings = await this.settingsService.getWithdrawalSettings();
    if (withdrawalSettings.requirePasswordForPayoutAccount) {
      if (!password || !password.trim()) {
        throw new BadRequestException('নিরাপত্তার জন্য আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });
      if (!user) throw new NotFoundException('User not found');
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('ভুল পাসওয়ার্ড! অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
      }
    }

    const account = await this.prisma.userPaymentAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Payment account not found');
    }

    await this.prisma.userPaymentAccount.delete({ where: { id: accountId } });
    return { message: 'Payment account deleted successfully' };
  }
}

