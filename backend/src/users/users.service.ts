import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  ChangePasswordDto,
  CreatePaymentAccountDto,
  CreateUserReviewDto,
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
      isEmployee: false,
    };

    if (query) {
      const q = query.trim();
      const compactQ = q.replace(/[\s\-\(\)]+/g, '');
      const cleanPhone = compactQ.replace(/^\+?88/, '');
      const tokens = q.split(/\s+/).filter(Boolean);

      const conditions: any[] = [
        { uniqueUserId: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { email: { contains: compactQ } },
        { phone: { contains: q } },
        ...(compactQ && compactQ !== q ? [{ phone: { contains: compactQ } }] : []),
        ...(cleanPhone && cleanPhone !== compactQ ? [{ phone: { contains: cleanPhone } }] : []),
        { headline: { contains: q } },
        { profession: { contains: q } },
        { skills: { contains: q } },
        { company: { contains: q } },
        { businessName: { contains: q } },
        { city: { contains: q } },
        { district: { contains: q } },
        { division: { contains: q } },
      ];

      if (tokens.length > 1) {
        for (const token of tokens) {
          if (token.length >= 2) {
            conditions.push(
              { firstName: { contains: token } },
              { lastName: { contains: token } },
              { headline: { contains: token } },
              { skills: { contains: token } },
              { profession: { contains: token } },
              { company: { contains: token } },
              { businessName: { contains: token } },
              { city: { contains: token } },
              { district: { contains: token } },
            );
          }
        }
      }

      whereClause.OR = conditions;
    }

    if (isVerified === 'true') {
      whereClause.isVerified = true;
    }

    // Check if Super Admin chat presence/visibility is enabled
    let isSuperAdminVisible = false;
    try {
      const superAdminVisibilitySetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'super_admin_chat_visibility' },
      });
      if (superAdminVisibilitySetting?.value) {
        const val =
          typeof superAdminVisibilitySetting.value === 'string'
            ? JSON.parse(superAdminVisibilitySetting.value)
            : superAdminVisibilitySetting.value;
        isSuperAdminVisible = val?.isVisible === true;
      }
    } catch {
      // Ignore if setting not initialized yet
    }

    // Exclude staff and admin accounts from normal marketplace user search
    const excludedRoles = isSuperAdminVisible
      ? ['ADMIN', 'EMPLOYEE', 'SUPPORT_ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN']
      : ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'SUPPORT_ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN'];

    whereClause.isEmployee = false;
    whereClause.userRoles = {
      none: {
        role: { name: { in: excludedRoles } },
      },
    };

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
      headline: true,
      profession: true,
      skills: true,
      city: true,
      district: true,
      division: true,
      receivedReviews: {
        select: {
          rating: true,
        },
      },
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

    return allUsers.map((u) => {
      const reviews = u.receivedReviews || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 5.0;

      return {
        id: u.id,
        uniqueUserId: u.uniqueUserId,
        fullName: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        avatarUrl: u.avatarUrl,
        isVerified: u.isVerified,
        businessName: u.businessName,
        businessType: u.businessType,
        headline: u.headline,
        profession: u.profession,
        skills: u.skills,
        location: [u.city, u.district, u.division].filter(Boolean).join(', '),
        memberSince: u.createdAt,
        activeProductsCount: u._count?.products || 0,
        completedTransactionsCount: u._count?.receivedTransactions || 0,
        bidPosition: userBidMap.get(u.id)?.targetPosition,
        activeBid: userBidMap.get(u.id) || null,
        averageRating,
        reviewsCount: totalReviews,
      };
    });
  }

  async getPublicProfile(uniqueUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { uniqueUserId },
          { id: uniqueUserId },
        ],
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        uniqueUserId: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        isEmployee: true,
        businessName: true,
        businessType: true,
        headline: true,
        bio: true,
        skills: true,
        interests: true,
        languages: true,
        website: true,
        socialLinks: true,
        profession: true,
        company: true,
        jobTitle: true,
        institution: true,
        department: true,
        educationLevel: true,
        graduationYear: true,
        country: true,
        division: true,
        district: true,
        upazila: true,
        city: true,
        profileVisibility: true,
        whoCanMessage: true,
        showPhone: true,
        showEmail: true,
        showLocation: true,
        showProfession: true,
        showSkills: true,
        showSocialLinks: true,
        phone: true,
        email: true,
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
        receivedReviews: {
          take: 30,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                id: true,
                uniqueUserId: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
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
            receivedReviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${uniqueUserId} not found`);
    }

    // Admins and staff are not marketplace users and must not have public user profiles
    const isAdminOrStaff =
      user.isEmployee ||
      user.userRoles?.some((ur: any) =>
        ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE', 'SUPPORT_ADMIN', 'FINANCE_ADMIN', 'CONTENT_ADMIN'].includes(
          ur.role?.name,
        ),
      );

    if (isAdminOrStaff) {
      const isSuperAdmin = user.userRoles?.some((ur: any) => ur.role?.name === 'SUPER_ADMIN');
      if (isSuperAdmin) {
        let isSuperAdminVisible = false;
        try {
          const superAdminVisibilitySetting = await this.prisma.systemSetting.findUnique({
            where: { key: 'super_admin_chat_visibility' },
          });
          if (superAdminVisibilitySetting?.value) {
            const val =
              typeof superAdminVisibilitySetting.value === 'string'
                ? JSON.parse(superAdminVisibilitySetting.value)
                : superAdminVisibilitySetting.value;
            isSuperAdminVisible = val?.isVisible === true;
          }
        } catch {}
        if (!isSuperAdminVisible) {
          throw new NotFoundException(`User with ID ${uniqueUserId} not found`);
        }
      } else {
        throw new NotFoundException(`User with ID ${uniqueUserId} not found`);
      }
    }

    const isPrivate = user.profileVisibility === 'PRIVATE';
    const hideLocation = !user.showLocation && isPrivate;
    const hideProfession = !user.showProfession || isPrivate;
    const hideSkills = !user.showSkills || isPrivate;
    const hideSocial = !user.showSocialLinks || isPrivate;

    const reviews = user.receivedReviews || [];
    const totalReviews = user._count?.receivedReviews || reviews.length;
    const averageRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 5.0;

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
      headline: user.headline,
      bio: isPrivate ? null : user.bio,
      skills: hideSkills ? null : user.skills,
      interests: hideSkills ? null : user.interests,
      languages: hideSkills ? null : user.languages,
      website: hideSocial ? null : user.website,
      socialLinks: hideSocial ? null : user.socialLinks,
      profession: hideProfession ? null : user.profession,
      company: hideProfession ? null : user.company,
      jobTitle: hideProfession ? null : user.jobTitle,
      institution: hideProfession ? null : user.institution,
      department: hideProfession ? null : user.department,
      educationLevel: hideProfession ? null : user.educationLevel,
      graduationYear: hideProfession ? null : user.graduationYear,
      country: hideLocation ? null : user.country,
      division: hideLocation ? null : user.division,
      district: hideLocation ? null : user.district,
      upazila: hideLocation ? null : user.upazila,
      city: hideLocation ? null : user.city,
      profileVisibility: user.profileVisibility,
      whoCanMessage: user.whoCanMessage,
      showPhone: user.showPhone,
      showEmail: user.showEmail,
      showLocation: user.showLocation,
      showProfession: user.showProfession,
      showSkills: user.showSkills,
      showSocialLinks: user.showSocialLinks,
      phone: user.showPhone ? user.phone : null,
      email: user.showEmail ? user.email : null,
      averageRating,
      reviewsCount: totalReviews,
      reviews: reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: {
          id: r.reviewer?.id,
          uniqueUserId: r.reviewer?.uniqueUserId,
          fullName: `${r.reviewer?.firstName || ''} ${r.reviewer?.lastName || ''}`.trim(),
          avatarUrl: r.reviewer?.avatarUrl,
          isVerified: r.reviewer?.isVerified,
        },
      })),
    };
  }

  async createOrUpdateReview(reviewerId: string, targetUserId: string, dto: CreateUserReviewDto) {
    if (reviewerId === targetUserId) {
      throw new BadRequestException('নিজের প্রোফাইলে নিজে রিভিউ দিতে পারবেন না');
    }
    const rating = Math.min(5, Math.max(1, Math.round(Number(dto.rating) || 5)));

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const review = await this.prisma.userReview.upsert({
      where: {
        reviewerId_targetUserId: {
          reviewerId,
          targetUserId,
        },
      },
      create: {
        reviewerId,
        targetUserId,
        rating,
        comment: dto.comment?.trim() || null,
      },
      update: {
        rating,
        comment: dto.comment?.trim() || null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    return review;
  }

  async getUserReviews(targetUserId: string) {
    const reviews = await this.prisma.userReview.findMany({
      where: { targetUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reviewer: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 5.0;

    return {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewer: {
          id: r.reviewer?.id,
          uniqueUserId: r.reviewer?.uniqueUserId,
          fullName: `${r.reviewer?.firstName || ''} ${r.reviewer?.lastName || ''}`.trim(),
          avatarUrl: r.reviewer?.avatarUrl,
          isVerified: r.reviewer?.isVerified,
        },
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const dataToUpdate: any = {};
    if (dto.firstName !== undefined) dataToUpdate.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) dataToUpdate.lastName = dto.lastName.trim();
    if (dto.avatarUrl !== undefined) dataToUpdate.avatarUrl = dto.avatarUrl.trim() || null;
    if (dto.phone !== undefined) dataToUpdate.phone = dto.phone.trim();
    if (dto.additionalPhone !== undefined) dataToUpdate.additionalPhone = dto.additionalPhone.trim() || null;
    if (dto.dateOfBirth !== undefined) dataToUpdate.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.gender !== undefined) dataToUpdate.gender = dto.gender.trim() || null;
    if (dto.country !== undefined) dataToUpdate.country = dto.country.trim() || null;
    if (dto.division !== undefined) dataToUpdate.division = dto.division.trim() || null;
    if (dto.district !== undefined) dataToUpdate.district = dto.district.trim() || null;
    if (dto.upazila !== undefined) dataToUpdate.upazila = dto.upazila.trim() || null;
    if (dto.city !== undefined) dataToUpdate.city = dto.city.trim() || null;
    if (dto.address !== undefined) dataToUpdate.address = dto.address.trim() || null;
    if (dto.postalCode !== undefined) dataToUpdate.postalCode = dto.postalCode.trim() || null;
    if (dto.profession !== undefined) dataToUpdate.profession = dto.profession.trim() || null;
    if (dto.company !== undefined) dataToUpdate.company = dto.company.trim() || null;
    if (dto.jobTitle !== undefined) dataToUpdate.jobTitle = dto.jobTitle.trim() || null;
    if (dto.institution !== undefined) dataToUpdate.institution = dto.institution.trim() || null;
    if (dto.department !== undefined) dataToUpdate.department = dto.department.trim() || null;
    if (dto.educationLevel !== undefined) dataToUpdate.educationLevel = dto.educationLevel.trim() || null;
    if (dto.graduationYear !== undefined) dataToUpdate.graduationYear = dto.graduationYear.trim() || null;
    if (dto.headline !== undefined) dataToUpdate.headline = dto.headline.trim() || null;
    if (dto.bio !== undefined) dataToUpdate.bio = dto.bio.trim() || null;
    if (dto.skills !== undefined) dataToUpdate.skills = dto.skills.trim() || null;
    if (dto.interests !== undefined) dataToUpdate.interests = dto.interests.trim() || null;
    if (dto.languages !== undefined) dataToUpdate.languages = dto.languages.trim() || null;
    if (dto.website !== undefined) dataToUpdate.website = dto.website.trim() || null;
    if (dto.socialLinks !== undefined) dataToUpdate.socialLinks = dto.socialLinks;
    if (dto.businessName !== undefined) dataToUpdate.businessName = dto.businessName.trim() || null;
    if (dto.businessType !== undefined) dataToUpdate.businessType = dto.businessType.trim() || null;
    if (dto.twoFactorEnabled !== undefined) dataToUpdate.twoFactorEnabled = Boolean(dto.twoFactorEnabled);
    if (dto.profileVisibility !== undefined) dataToUpdate.profileVisibility = dto.profileVisibility.trim();
    if (dto.whoCanMessage !== undefined) dataToUpdate.whoCanMessage = dto.whoCanMessage.trim();
    if (dto.showPhone !== undefined) dataToUpdate.showPhone = Boolean(dto.showPhone);
    if (dto.showEmail !== undefined) dataToUpdate.showEmail = Boolean(dto.showEmail);
    if (dto.showLocation !== undefined) dataToUpdate.showLocation = Boolean(dto.showLocation);
    if (dto.showProfession !== undefined) dataToUpdate.showProfession = Boolean(dto.showProfession);
    if (dto.showSkills !== undefined) dataToUpdate.showSkills = Boolean(dto.showSkills);
    if (dto.showSocialLinks !== undefined) dataToUpdate.showSocialLinks = Boolean(dto.showSocialLinks);
    if (dto.timezone !== undefined) dataToUpdate.timezone = dto.timezone.trim() || 'Asia/Dhaka';
    if (dto.nidNumber !== undefined) dataToUpdate.nidNumber = dto.nidNumber.trim() || null;
    if (dto.nidName !== undefined) dataToUpdate.nidName = dto.nidName.trim() || null;
    if (dto.nidFrontUrl !== undefined) dataToUpdate.nidFrontUrl = dto.nidFrontUrl.trim() || null;
    if (dto.nidBackUrl !== undefined) dataToUpdate.nidBackUrl = dto.nidBackUrl.trim() || null;

    if ((dto.nidFrontUrl || dto.nidBackUrl || dto.nidNumber) && dto.nidNumber?.trim()) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isVerified: true, verificationStatus: true },
      });
      if (!currentUser?.isVerified && currentUser?.verificationStatus !== 'VERIFIED') {
        dataToUpdate.verificationStatus = 'PENDING';
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
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
    if (!dto.password || !dto.password.trim()) {
      throw new BadRequestException('অ্যাকাউন্ট আপডেট করতে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) {
      throw new BadRequestException('আপনার অ্যাকাউন্টে পাসওয়ার্ড সেট করা নেই।');
    }
    const isMatch = await bcrypt.compare(dto.password.trim(), user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('ভুল পাসওয়ার্ড! অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
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
    if (!password || !password.trim()) {
      throw new BadRequestException('অ্যাকাউন্ট মুছতে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) {
      throw new BadRequestException('আপনার অ্যাকাউন্টে পাসওয়ার্ড সেট করা নেই।');
    }
    const isMatch = await bcrypt.compare(password.trim(), user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('ভুল পাসওয়ার্ড! অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
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

