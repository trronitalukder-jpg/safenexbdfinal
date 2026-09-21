import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { invalidateUserCache } from '../auth/jwt.strategy';
import { purgeOrScrubUser } from '../common/utils/user-cleanup.util';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Complete Analytics Dashboard Summary (Spec #47, #98)
   */
  async getDashboardAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const nonStaffUserFilter = {
      isEmployee: false,
      userRoles: {
        none: {
          role: { name: { in: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'SUPPORT_ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN'] } },
        },
      },
    };

    const [
      totalUsers,
      activeUsers,
      newUsers30d,
      totalProducts,
      physicalProducts,
      digitalProducts,
      walletsAggregate,
      transactionsAggregate,
      commissionAggregate,
      rechargeAggregate,
      withdrawalAggregate,
      bidIncomeAggregate,
      transactionCounts,
      recentTransactions,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, ...nonStaffUserFilter } }),
      this.prisma.user.count({ where: { isActive: true, deletedAt: null, ...nonStaffUserFilter } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, ...nonStaffUserFilter } }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { productType: 'PHYSICAL', deletedAt: null } }),
      this.prisma.product.count({ where: { productType: 'DIGITAL_DOWNLOAD', deletedAt: null } }),
      this.prisma.wallet.aggregate({
        _sum: {
          availableBalance: true,
          holdBalance: true,
        },
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'RELEASED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { status: 'RELEASED' },
        _sum: { commissionAmount: true },
      }),
      this.prisma.rechargeRequest.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      this.prisma.walletLedger.aggregate({
        where: { type: 'BID_RESERVE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { uniqueUserId: true, firstName: true } },
          receiver: { select: { uniqueUserId: true, firstName: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null, ...nonStaffUserFilter },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          uniqueUserId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
    ]);

    const statusCountsMap: Record<string, number> = {};
    transactionCounts.forEach((c) => {
      statusCountsMap[c.status] = c._count.status;
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        newLast30Days: newUsers30d,
      },
      products: {
        total: totalProducts,
        physical: physicalProducts,
        digital: digitalProducts,
      },
      finance: {
        totalAvailableBalance: walletsAggregate._sum.availableBalance || 0,
        totalHoldBalance: walletsAggregate._sum.holdBalance || 0,
        totalTransactionVolume: transactionsAggregate._sum.amount || 0,
        totalCommissionEarned: commissionAggregate._sum.commissionAmount || 0,
        totalRechargeApproved: rechargeAggregate._sum.amount || 0,
        totalWithdrawalApproved: withdrawalAggregate._sum.amount || 0,
        totalBidIncome: bidIncomeAggregate._sum.amount || 0,
      },
      transactions: {
        requested: statusCountsMap['REQUESTED'] || 0,
        working: statusCountsMap['WORKING'] || 0,
        completed: statusCountsMap['RELEASED'] || 0,
        hold: statusCountsMap['HOLD'] || 0,
        disputed: statusCountsMap['DISPUTED'] || 0,
        rejected: statusCountsMap['REJECTED'] || 0,
      },
      recentTransactions,
      recentUsers,
    };
  }

  /**
   * User management list with full details (Spec #48)
   */
  async getUsersList(query: any) {
    const { search, isVerified, isActive, showDeleted } = query;
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const where: any = {
      isEmployee: false,
      userRoles: {
        none: {
          role: { name: { in: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'SUPPORT_ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN'] } },
        },
      },
    };

    if (showDeleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { uniqueUserId: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    if (isVerified !== undefined && isVerified !== '') {
      where.isVerified = isVerified === 'true';
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          wallet: true,
          _count: {
            select: {
              products: true,
              sentTransactions: true,
              receivedTransactions: true,
              rechargeRequests: true,
              withdrawalRequests: true,
              initiatedDisputes: true,
            },
          },
          userRoles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        uniqueUserId: u.uniqueUserId,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        address: u.address,
        city: u.city,
        country: u.country,
        postalCode: u.postalCode,
        businessName: u.businessName,
        businessType: u.businessType,
        isVerified: u.isVerified,
        isActive: u.isActive,
        wallet: u.wallet,
        productsCount: u._count.products,
        transactionsCount: u._count.sentTransactions + u._count.receivedTransactions,
        sentTransactionsCount: u._count.sentTransactions,
        receivedTransactionsCount: u._count.receivedTransactions,
        rechargesCount: u._count.rechargeRequests,
        withdrawalsCount: u._count.withdrawalRequests,
        disputesCount: u._count.initiatedDisputes,
        roles: u.userRoles.map((ur) => ur.role.name),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        deletedAt: u.deletedAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get comprehensive user details by ID for Admin Profile View
   */
  async getUserById(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        userRoles: { include: { role: true } },
        paymentAccounts: true,
        _count: {
          select: {
            products: true,
            sentTransactions: true,
            receivedTransactions: true,
            rechargeRequests: true,
            withdrawalRequests: true,
            initiatedDisputes: true,
            bids: true,
          },
        },
        sentTransactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            trackingNumber: true,
            amount: true,
            status: true,
            createdAt: true,
            receiver: { select: { uniqueUserId: true, firstName: true, lastName: true } },
          },
        },
        receivedTransactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            trackingNumber: true,
            amount: true,
            status: true,
            createdAt: true,
            sender: { select: { uniqueUserId: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!u) throw new NotFoundException('User not found');

    return {
      id: u.id,
      uniqueUserId: u.uniqueUserId,
      fullName: `${u.firstName} ${u.lastName}`.trim(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      additionalPhone: u.additionalPhone,
      gender: u.gender,
      dateOfBirth: u.dateOfBirth,
      avatarUrl: u.avatarUrl,
      address: u.address,
      city: u.city,
      country: u.country,
      division: u.division,
      district: u.district,
      upazila: u.upazila,
      postalCode: u.postalCode,
      businessName: u.businessName,
      businessType: u.businessType,
      profession: u.profession,
      company: u.company,
      jobTitle: u.jobTitle,
      institution: u.institution,
      department: u.department,
      educationLevel: u.educationLevel,
      graduationYear: u.graduationYear,
      headline: u.headline,
      bio: u.bio,
      skills: u.skills,
      interests: u.interests,
      languages: u.languages,
      website: u.website,
      socialLinks: u.socialLinks,
      nidNumber: u.nidNumber,
      nidName: u.nidName,
      nidFrontUrl: u.nidFrontUrl,
      nidBackUrl: u.nidBackUrl,
      verificationStatus: u.verificationStatus,
      verifiedAt: u.verifiedAt,
      profileVisibility: u.profileVisibility,
      twoFactorEnabled: u.twoFactorEnabled,
      isActive: u.isActive,
      isVerified: u.isVerified,
      wallet: u.wallet,
      roles: u.userRoles.map((ur) => ur.role.name),
      paymentAccounts: u.paymentAccounts,
      counts: {
        products: u._count.products,
        sentTransactions: u._count.sentTransactions,
        receivedTransactions: u._count.receivedTransactions,
        transactions: u._count.sentTransactions + u._count.receivedTransactions,
        recharges: u._count.rechargeRequests,
        withdrawals: u._count.withdrawalRequests,
        disputes: u._count.initiatedDisputes,
        bids: u._count.bids,
      },
      recentSentTransactions: u.sentTransactions,
      recentReceivedTransactions: u.receivedTransactions,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      deletedAt: u.deletedAt,
    };
  }

  /**
   * Helper to record immutable AuditLog
   */
  async recordAuditLog(
    data: {
      actorId: string;
      actorType?: 'USER' | 'ADMIN' | 'SYSTEM';
      action: string;
      targetEntity: string;
      targetId: string;
      beforeState?: any;
      afterState?: any;
      reason: string;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.auditLog.create({
      data: {
        actorId: data.actorId,
        actorType: data.actorType || 'ADMIN',
        action: data.action,
        targetEntity: data.targetEntity,
        targetId: data.targetId,
        beforeState: data.beforeState ?? undefined,
        afterState: data.afterState ?? undefined,
        reason: data.reason || 'Administrative action performed',
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  }

  /**
   * Toggle user active/verified status or update KYC verification
   */
  async updateUserStatus(
    userId: string,
    data: { isActive?: boolean; isVerified?: boolean; verificationStatus?: string },
    adminId?: string,
    reason?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    // Prevent deactivating super admin
    if (data.isActive === false) {
      const isSuperAdmin =
        user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN') ||
        user.email.toLowerCase() === 'admin@safnexbd.com';
      if (isSuperAdmin) {
        throw new BadRequestException('Super Admin account cannot be deactivated');
      }
    }

    const beforeState = {
      isActive: user.isActive,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus,
    };

    const updatePayload: any = {};
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    if (data.verificationStatus !== undefined) {
      updatePayload.verificationStatus = data.verificationStatus;
      if (data.verificationStatus === 'VERIFIED') {
        updatePayload.isVerified = true;
        updatePayload.verifiedAt = new Date();
      } else if (data.verificationStatus === 'REJECTED') {
        updatePayload.isVerified = false;
      }
    } else if (data.isVerified !== undefined) {
      updatePayload.isVerified = data.isVerified;
      if (data.isVerified) {
        updatePayload.verificationStatus = 'VERIFIED';
        updatePayload.verifiedAt = new Date();
      } else {
        updatePayload.verificationStatus = 'UNVERIFIED';
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updatePayload,
    });
    const afterState = {
      isActive: updated.isActive,
      isVerified: updated.isVerified,
      verificationStatus: updated.verificationStatus,
    };

    // Invalidate user authentication cache immediately
    invalidateUserCache(userId);

    // If user is deactivated, revoke all refresh tokens and cancel active bids
    if (data.isActive === false) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      }).catch((err) => console.error('Failed to revoke tokens on deactivate:', err));

      await this.prisma.bid.updateMany({
        where: { sellerId: userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      }).catch((err) => console.error('Failed to cancel bids on deactivate:', err));
    }

    if (adminId) {
      await this.recordAuditLog({
        actorId: adminId,
        actorType: 'ADMIN',
        action: 'USER_STATUS_UPDATE',
        targetEntity: 'User',
        targetId: userId,
        beforeState,
        afterState,
        reason:
          reason ||
          `Updated user status: isActive=${data.isActive ?? user.isActive}, isVerified=${data.isVerified ?? user.isVerified}`,
      }).catch((err) => console.error('Failed to log audit for user status:', err));
    }

    return updated;
  }

  /**
   * Soft delete user to protect financial and ledger audit history
   */
  async deleteUser(userId: string, currentAdminId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const isSuperAdmin =
      user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN') ||
      user.email.toLowerCase() === 'admin@safnexbd.com';
    if (isSuperAdmin) {
      throw new BadRequestException('Super Admin user cannot be deleted');
    }

    if (currentAdminId && user.id === currentAdminId) {
      throw new BadRequestException('You cannot delete your own admin account');
    }

    // Completely purge or scrub user credentials, chat presence, and profile
    const result = await purgeOrScrubUser(this.prisma, userId);

    if (currentAdminId) {
      await this.recordAuditLog({
        actorId: currentAdminId,
        actorType: 'ADMIN',
        action: 'USER_DELETE',
        targetEntity: 'User',
        targetId: userId,
        beforeState: { isActive: user.isActive, deletedAt: user.deletedAt },
        afterState: { isActive: false, deletedAt: new Date() },
        reason: result.hardDeleted
          ? 'User account permanently hard-deleted by administrator'
          : 'User account scrubbed and credentials freed by administrator',
      }).catch((err) => console.error('Failed to log audit for deleteUser:', err));
    }

    return {
      success: true,
      message: result.hardDeleted
        ? 'User completely deleted and all records removed'
        : 'User credentials wiped and freed successfully',
    };
  }

  /**
   * Restore a soft-deleted user
   */
  async restoreUser(userId: string, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        isActive: true,
      },
    });

    // Invalidate user authentication cache
    invalidateUserCache(userId);

    // Restore products belonging to this user
    await this.prisma.product.updateMany({
      where: { sellerId: userId, deletedAt: { not: null } },
      data: {
        deletedAt: null,
        status: 'ACTIVE',
      },
    }).catch((err) => console.error('Failed to restore products for restoreUser:', err));

    if (adminId) {
      await this.recordAuditLog({
        actorId: adminId,
        actorType: 'ADMIN',
        action: 'USER_RESTORE',
        targetEntity: 'User',
        targetId: userId,
        beforeState: { isActive: user.isActive, deletedAt: user.deletedAt },
        afterState: { isActive: true, deletedAt: null },
        reason: 'User account restored by administrator',
      }).catch((err) => console.error('Failed to log audit for restoreUser:', err));
    }

    return updated;
  }

  /**
   * View full audit logs (Spec #75) with advanced filters, search, actor hydration, and metrics
   */
  async getAuditLogs(query: any = {}) {
    let pageNum = 1;
    let limitNum = 25;
    let search = '';
    let action = '';
    let actorType = '';
    let targetEntity = '';
    let startDate = '';
    let endDate = '';

    if (typeof query === 'number') {
      pageNum = query;
      limitNum = typeof arguments[1] === 'number' ? arguments[1] : 25;
    } else if (typeof query === 'object' && query !== null) {
      pageNum = parseInt(query.page, 10) || 1;
      limitNum = parseInt(query.limit, 10) || 25;
      search = typeof query.search === 'string' ? query.search.trim() : '';
      action = typeof query.action === 'string' ? query.action.trim() : '';
      actorType = typeof query.actorType === 'string' ? query.actorType.trim() : '';
      targetEntity = typeof query.targetEntity === 'string' ? query.targetEntity.trim() : '';
      startDate = typeof query.startDate === 'string' ? query.startDate.trim() : '';
      endDate = typeof query.endDate === 'string' ? query.endDate.trim() : '';
    }

    const skip = (pageNum - 1) * limitNum;
    const where: any = {};

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (actorType && actorType !== 'ALL') {
      where.actorType = actorType;
    }

    if (targetEntity && targetEntity !== 'ALL') {
      where.targetEntity = targetEntity;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      const matchedUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { uniqueUserId: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        },
        select: { id: true },
        take: 30,
      });
      const matchedUserIds = matchedUsers.map((u) => u.id);

      where.OR = [
        { action: { contains: search } },
        { targetEntity: { contains: search } },
        { targetId: { contains: search } },
        { reason: { contains: search } },
        ...(matchedUserIds.length > 0 ? [{ actorId: { in: matchedUserIds } }] : []),
      ];
    }

    const [items, total, totalAdmin, totalFinancial, totalSystem] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({ where: { actorType: 'ADMIN' } }),
      this.prisma.auditLog.count({
        where: {
          OR: [
            { targetEntity: 'Wallet' },
            { targetEntity: 'WithdrawalRequest' },
            { targetEntity: 'RechargeRequest' },
          ],
        },
      }),
      this.prisma.auditLog.count({ where: { actorType: 'SYSTEM' } }),
    ]);

    // Hydrate actors
    const actorIds = Array.from(new Set(items.map((it) => it.actorId).filter(Boolean)));
    const users =
      actorIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          })
        : [];

    const userMap = new Map<string, any>();
    users.forEach((u) => {
      userMap.set(u.id, {
        id: u.id,
        uniqueUserId: u.uniqueUserId,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        roles: u.userRoles.map((r) => r.role.name),
      });
    });

    const enrichedItems = items.map((it) => ({
      ...it,
      actor: userMap.get(it.actorId) || null,
    }));

    return {
      items: enrichedItems,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      stats: {
        totalEvents: total,
        adminActions: totalAdmin,
        financialActions: totalFinancial,
        systemActions: totalSystem,
      },
    };
  }

  /**
   * List password reset requests
   */
  async getPasswordResetRequests(query: any) {
    const { search, status, page = 1, limit = 20 } = query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { uniqueUserId: { contains: q } },
        { phone: { contains: q } },
        { fullName: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.passwordResetRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
              avatarUrl: true,
              wallet: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.passwordResetRequest.count({ where }),
    ]);

    return {
      items,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  /**
   * Resolve password reset request by generating/updating password
   */
  async resolvePasswordResetRequest(
    requestId: string,
    adminId: string,
    body: { newPassword: string; adminNote?: string },
  ) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) throw new NotFoundException('Password reset request not found');

    let user = request.user;
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { uniqueUserId: request.uniqueUserId },
            { phone: request.phone },
            ...(request.email ? [{ email: request.email }] : []),
          ],
        },
      });
    }

    if (!user) {
      throw new NotFoundException('No user account found matching this reset request');
    }

    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isActive: true },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
      this.prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          generatedPassword: body.newPassword,
          adminNote: body.adminNote || 'Password reset by admin. Communicated to user.',
          resolvedBy: adminId,
          resolvedAt: new Date(),
          userId: user.id,
        },
      }),
    ]);

    const smsTemplate = `প্রিয় ${user.firstName || request.fullName}, SafnexBD তে আপনার অ্যাকাউন্টের নতুন পাসওয়ার্ড: ${body.newPassword}। দয়া করে লগইন করে পাসওয়ার্ড পরিবর্তন করে নিন।`;

    return {
      success: true,
      message: 'Password successfully updated in database.',
      user: {
        id: user.id,
        uniqueUserId: user.uniqueUserId,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        phone: user.phone,
        email: user.email,
      },
      newPassword: body.newPassword,
      smsTemplate,
    };
  }

  /**
   * Update reset request status (e.g. Reject or set note)
   */
  async updatePasswordResetStatus(
    requestId: string,
    adminId: string,
    body: { status: string; adminNote?: string },
  ) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Password reset request not found');

    return this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: body.status,
        adminNote: body.adminNote || request.adminNote,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Directly reset password for any user
   */
  async directResetUserPassword(
    userId: string,
    adminId: string,
    body: { newPassword: string; adminNote?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters long');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    const smsTemplate = `প্রিয় ${user.firstName}, SafnexBD তে আপনার অ্যাকাউন্টের নতুন পাসওয়ার্ড: ${body.newPassword}। দয়া করে লগইন করে পাসওয়ার্ড পরিবর্তন করে নিন।`;

    return {
      success: true,
      message: `Password successfully updated for user ${user.uniqueUserId}.`,
      user: {
        id: user.id,
        uniqueUserId: user.uniqueUserId,
        phone: user.phone,
        email: user.email,
      },
      newPassword: body.newPassword,
      smsTemplate,
    };
  }

  /**
   * ---------------- Product Management & Auto-Approval ----------------
   */

  async getProductSettings() {
    const setting = await this.prisma.cmsSection.findUnique({
      where: { sectionKey: 'product_approval_settings' },
    });
    return {
      autoApprove: setting ? setting.isEnabled : true,
    };
  }

  async updateProductSettings(body: { autoApprove: boolean }) {
    const isAuto = Boolean(body.autoApprove);
    await this.prisma.cmsSection.upsert({
      where: { sectionKey: 'product_approval_settings' },
      create: {
        sectionKey: 'product_approval_settings',
        title: 'Product Auto-Approval Settings',
        isEnabled: isAuto,
        content: { autoApprove: isAuto },
      },
      update: {
        isEnabled: isAuto,
        content: { autoApprove: isAuto },
      },
    });
    return { success: true, autoApprove: isAuto };
  }

  async getAllProducts(query: {
    search?: string;
    status?: string;
    canonicalUrl?: string;
    categoryId?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = query.page ? parseInt(String(query.page), 10) : 1;
    const limit = query.limit ? parseInt(String(query.limit), 10) : 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status === 'TRASH') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
      if (query.status && query.status !== 'ALL') {
        where.status = query.status;
      }
    }
    if (query.categoryId && query.categoryId !== 'ALL') {
      where.categoryId = query.categoryId;
    }
    if (query.canonicalUrl && query.canonicalUrl !== 'ALL') {
      const raw = String(query.canonicalUrl).trim();
      const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
      const withoutSlash = withSlash.replace(/^\//, '');
      where.OR = [
        { canonicalUrl: withSlash },
        { canonicalUrl: withoutSlash },
        { canonicalUrl: `/page${withSlash}` },
      ];
    }
    if (query.search) {
      const q = query.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: q } },
            { slug: { contains: q } },
            { seller: { uniqueUserId: { contains: q } } },
            { seller: { firstName: { contains: q } } },
            { seller: { lastName: { contains: q } } },
            { seller: { email: { contains: q } } },
          ],
        },
      ];
    }

    const [items, total, pendingCount, activeCount, inactiveCount, rejectedCount, trashCount] =
      await Promise.all([
        this.prisma.product.findMany({
          where,
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            category: true,
            seller: {
              select: {
                id: true,
                uniqueUserId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
            physicalMeta: true,
            files: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({ where }),
        this.prisma.product.count({ where: { status: 'PENDING', deletedAt: null } }),
        this.prisma.product.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        this.prisma.product.count({ where: { status: 'INACTIVE', deletedAt: null } }),
        this.prisma.product.count({ where: { status: 'REJECTED', deletedAt: null } }),
        this.prisma.product.count({ where: { deletedAt: { not: null } } }),
      ]);

    const sanitized = JSON.parse(
      JSON.stringify(items, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    return {
      items: sanitized,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        total: pendingCount + activeCount + inactiveCount + rejectedCount,
        pending: pendingCount,
        active: activeCount,
        inactive: inactiveCount,
        rejected: rejectedCount,
        trash: trashCount,
      },
    };
  }

  async updateProductStatus(productId: string, status: any) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status,
        ...(status === 'ACTIVE' ? { deletedAt: null } : {}),
      },
      include: { category: true, images: true, seller: true },
    });
    return JSON.parse(
      JSON.stringify(updated, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  async updateProductRoute(productId: string, canonicalUrl: string | null) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const cleanUrl = canonicalUrl && canonicalUrl.trim() !== '' ? canonicalUrl.trim() : null;

    let targetProductType: 'PHYSICAL' | 'DIGITAL_DOWNLOAD' | undefined = undefined;
    if (cleanUrl === '/physical-products') {
      targetProductType = 'PHYSICAL';
    } else if (cleanUrl === '/digital-products' || cleanUrl === '/money-exchange') {
      targetProductType = 'DIGITAL_DOWNLOAD';
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        canonicalUrl: cleanUrl,
        ...(targetProductType ? { productType: targetProductType } : {}),
      },
      include: { category: true, images: true, seller: true, physicalMeta: true, files: true },
    });
    return JSON.parse(
      JSON.stringify(updated, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  async deleteProduct(productId: string, adminId: string, permanent: boolean = false) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    if (permanent || product.deletedAt !== null) {
      await this.prisma.$transaction(async (tx) => {
        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productFile.deleteMany({ where: { productId } });
        await tx.productPhysicalMeta.deleteMany({ where: { productId } });
        await tx.bid.deleteMany({ where: { productId } });
        await tx.transaction.updateMany({
          where: { productId },
          data: { productId: null },
        });
        await tx.product.delete({ where: { id: productId } });
      });

      if (adminId) {
        await this.recordAuditLog({
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'PRODUCT_PERMANENT_DELETE',
          targetEntity: 'Product',
          targetId: productId,
          beforeState: { title: product.title, status: product.status },
          afterState: null,
          reason: 'Product permanently deleted by administrator',
        }).catch((err) => console.error('Failed to log audit for permanent deleteProduct:', err));
      }

      return { success: true, message: 'Product permanently deleted successfully' };
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });

    if (adminId) {
      await this.recordAuditLog({
        actorId: adminId,
        actorType: 'ADMIN',
        action: 'PRODUCT_SOFT_DELETE',
        targetEntity: 'Product',
        targetId: productId,
        beforeState: { status: product.status, deletedAt: product.deletedAt },
        afterState: { status: updated.status, deletedAt: updated.deletedAt },
        reason: 'Product moved to trash / soft-deleted by administrator',
      }).catch((err) => console.error('Failed to log audit for deleteProduct:', err));
    }

    return { success: true, message: 'Product moved to trash successfully' };
  }

  async restoreProduct(productId: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ACTIVE', deletedAt: null },
    });

    if (adminId) {
      await this.recordAuditLog({
        actorId: adminId,
        actorType: 'ADMIN',
        action: 'PRODUCT_RESTORE',
        targetEntity: 'Product',
        targetId: productId,
        beforeState: { status: product.status, deletedAt: product.deletedAt },
        afterState: { status: updated.status, deletedAt: updated.deletedAt },
        reason: 'Product restored from trash by administrator',
      }).catch((err) => console.error('Failed to log audit for restoreProduct:', err));
    }

    return { success: true, message: 'Product restored successfully' };
  }
}

