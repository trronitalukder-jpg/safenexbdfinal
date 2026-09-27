import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PromotionCommissionType } from '@prisma/client';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  RecordPayoutDto,
  UpdatePromotionSettingsDto,
} from './dto/promotion.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure default global promotion settings exist
   */
  async ensureSettings() {
    let setting = await this.prisma.promotionSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await this.prisma.promotionSetting.create({
        data: {
          id: 'default',
          isEnabled: true,
          allowSelfPortal: true,
          attributionDays: 30,
          defaultTargetUrl: '/',
        },
      });
    }

    return setting;
  }

  /**
   * Get global promotion settings (Master ON/OFF switch)
   */
  async getSettings() {
    return this.ensureSettings();
  }

  /**
   * Update global promotion settings (Master ON/OFF switch)
   */
  async updateSettings(dto: UpdatePromotionSettingsDto) {
    await this.ensureSettings();

    return this.prisma.promotionSetting.update({
      where: { id: 'default' },
      data: {
        ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
        ...(dto.allowSelfPortal !== undefined && { allowSelfPortal: dto.allowSelfPortal }),
        ...(dto.attributionDays !== undefined && { attributionDays: dto.attributionDays }),
        ...(dto.defaultTargetUrl !== undefined && { defaultTargetUrl: dto.defaultTargetUrl }),
      },
    });
  }

  /**
   * Track visitor click on promotion link (Public)
   */
  async trackClick(
    code: string,
    ipAddress?: string,
    userAgent?: string,
    referrer?: string,
    device?: string,
  ) {
    const settings = await this.ensureSettings();
    const cleanCode = code.toLowerCase().trim();

    const campaign = await this.prisma.promotionCampaign.findUnique({
      where: { code: cleanCode },
    });

    if (!campaign) {
      return {
        success: false,
        active: false,
        targetUrl: settings.defaultTargetUrl || '/',
      };
    }

    // If global switch is OFF or campaign is inactive
    if (!settings.isEnabled || !campaign.isActive) {
      return {
        success: true,
        active: false,
        code: campaign.code,
        targetUrl: campaign.targetUrl || settings.defaultTargetUrl || '/',
      };
    }

    // Check unique visitor by IP
    let isUnique = false;
    if (ipAddress) {
      const existingClick = await this.prisma.promotionClick.findFirst({
        where: {
          campaignId: campaign.id,
          ipAddress,
        },
      });
      if (!existingClick) {
        isUnique = true;
      }
    } else {
      isUnique = true;
    }

    // Record click log
    await this.prisma.promotionClick.create({
      data: {
        campaignId: campaign.id,
        ipAddress: ipAddress ? ipAddress.slice(0, 50) : null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
        referrer: referrer ? referrer.slice(0, 500) : null,
        device: device ? device.slice(0, 50) : null,
      },
    });

    // Increment click counts
    await this.prisma.promotionCampaign.update({
      where: { id: campaign.id },
      data: {
        clicksCount: { increment: 1 },
        ...(isUnique && { uniqueVisitorsCount: { increment: 1 } }),
      },
    });

    return {
      success: true,
      active: true,
      code: campaign.code,
      name: campaign.name,
      targetUrl: campaign.targetUrl || settings.defaultTargetUrl || '/',
    };
  }

  /**
   * Validate promo code for user registration (Public)
   */
  async validateCode(code: string) {
    const settings = await this.ensureSettings();
    if (!settings.isEnabled) {
      return { valid: false, message: 'প্রমোশন সিস্টেম সাময়িকভাবে নিষ্ক্রিয় আছে' };
    }

    const cleanCode = code.toLowerCase().trim();
    const campaign = await this.prisma.promotionCampaign.findUnique({
      where: { code: cleanCode },
      select: {
        id: true,
        name: true,
        code: true,
        promoterName: true,
        isActive: true,
      },
    });

    if (!campaign || !campaign.isActive) {
      return { valid: false, message: 'প্রমো কোডটি সঠিক নয় অথবা মেয়াদোত্তীর্ণ' };
    }

    return {
      valid: true,
      campaignId: campaign.id,
      code: campaign.code,
      name: campaign.name,
      promoterName: campaign.promoterName,
    };
  }

  /**
   * Promoter Self-Check Live Portal (Protected by secret viewToken)
   */
  async getPromoterPortal(code: string, token: string) {
    const settings = await this.ensureSettings();
    if (!settings.isEnabled || !settings.allowSelfPortal) {
      throw new BadRequestException('প্রমোটার লাইভ পোর্টাল বর্তমানে বন্ধ রয়েছে');
    }

    const cleanCode = code.toLowerCase().trim();
    const campaign = await this.prisma.promotionCampaign.findUnique({
      where: { code: cleanCode },
      include: {
        registeredUsers: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            createdAt: true,
            isVerified: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign || campaign.viewToken !== token) {
      throw new NotFoundException('প্রমোশন পোর্টাল পাওয়া যায়নি বা টোকেন সঠিক নয়');
    }

    // Calculate economics for this promoter
    const userIds = campaign.registeredUsers.map((u) => u.id);

    let completedTxnCount = 0;
    let totalTxnVolume = 0;
    let totalCommissionGenerated = 0;

    if (userIds.length > 0) {
      const txns = await this.prisma.transaction.findMany({
        where: {
          status: 'RELEASED',
          OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }],
        },
        select: {
          amount: true,
          commissionAmount: true,
        },
      });

      completedTxnCount = txns.length;
      totalTxnVolume = txns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      totalCommissionGenerated = txns.reduce(
        (sum, t) => sum + Number(t.commissionAmount || 0),
        0,
      );
    }

    // Calculate commission
    const signupsCount = campaign.registeredUsers.length;
    let earnedCommission = 0;

    switch (campaign.commissionType) {
      case PromotionCommissionType.FIXED_PER_REGISTRATION:
        earnedCommission = signupsCount * Number(campaign.commissionRate);
        break;
      case PromotionCommissionType.COMMISSION_PERCENTAGE:
        earnedCommission = (totalCommissionGenerated * Number(campaign.commissionRate)) / 100;
        break;
      case PromotionCommissionType.FLAT_BUDGET:
        earnedCommission = Number(campaign.flatBudget);
        break;
      default:
        earnedCommission = 0;
    }

    const paidAmount = Number(campaign.paidAmount);
    const pendingPayable = Math.max(0, earnedCommission - paidAmount);

    return {
      campaign: {
        name: campaign.name,
        code: campaign.code,
        promoterName: campaign.promoterName,
        promoterChannel: campaign.promoterChannel,
        isActive: campaign.isActive,
        createdAt: campaign.createdAt,
      },
      stats: {
        clicksCount: campaign.clicksCount,
        uniqueVisitorsCount: campaign.uniqueVisitorsCount,
        signupsCount,
        completedTxnCount,
        totalTxnVolume,
        commissionType: campaign.commissionType,
        commissionRate: Number(campaign.commissionRate),
        earnedCommission,
        paidAmount,
        pendingPayable,
      },
      recentSignups: campaign.registeredUsers.slice(0, 15).map((u) => ({
        uniqueUserId: u.uniqueUserId,
        firstName: u.firstName,
        createdAt: u.createdAt,
        isVerified: u.isVerified,
      })),
    };
  }

  // =========================================================================
  // ADMIN PANEL METHODS
  // =========================================================================

  /**
   * Get all promotion campaigns with aggregated metrics
   */
  async getAdminCampaignsList() {
    const settings = await this.ensureSettings();

    const campaigns = await this.prisma.promotionCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        registeredUsers: {
          select: {
            id: true,
          },
        },
      },
    });

    const result = await Promise.all(
      campaigns.map(async (c) => {
        const userIds = c.registeredUsers.map((u) => u.id);
        const signupsCount = userIds.length;

        let completedTxnCount = 0;
        let totalTxnVolume = 0;
        let totalCommissionGenerated = 0;
        let totalRechargesVolume = 0;

        if (userIds.length > 0) {
          // Escrow transactions completed
          const txns = await this.prisma.transaction.findMany({
            where: {
              status: 'RELEASED',
              OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }],
            },
            select: {
              amount: true,
              commissionAmount: true,
            },
          });

          completedTxnCount = txns.length;
          totalTxnVolume = txns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          totalCommissionGenerated = txns.reduce(
            (sum, t) => sum + Number(t.commissionAmount || 0),
            0,
          );

          // Wallet Recharges
          const recharges = await this.prisma.rechargeRequest.findMany({
            where: {
              userId: { in: userIds },
              status: 'APPROVED',
            },
            select: { amount: true },
          });

          totalRechargesVolume = recharges.reduce(
            (sum, r) => sum + Number(r.amount || 0),
            0,
          );
        }

        // Commission calculation
        let earnedCommission = 0;
        switch (c.commissionType) {
          case PromotionCommissionType.FIXED_PER_REGISTRATION:
            earnedCommission = signupsCount * Number(c.commissionRate);
            break;
          case PromotionCommissionType.COMMISSION_PERCENTAGE:
            earnedCommission = (totalCommissionGenerated * Number(c.commissionRate)) / 100;
            break;
          case PromotionCommissionType.FLAT_BUDGET:
            earnedCommission = Number(c.flatBudget);
            break;
          default:
            earnedCommission = 0;
        }

        const paidAmount = Number(c.paidAmount);
        const pendingPayable = Math.max(0, earnedCommission - paidAmount);
        const conversionRate =
          c.clicksCount > 0 ? ((signupsCount / c.clicksCount) * 100).toFixed(1) : '0.0';

        return {
          id: c.id,
          name: c.name,
          code: c.code,
          promoterName: c.promoterName,
          promoterPhone: c.promoterPhone,
          promoterChannel: c.promoterChannel,
          commissionType: c.commissionType,
          commissionRate: Number(c.commissionRate),
          flatBudget: Number(c.flatBudget),
          paidAmount,
          earnedCommission,
          pendingPayable,
          commissionNote: c.commissionNote,
          targetUrl: c.targetUrl,
          viewToken: c.viewToken,
          isActive: c.isActive,
          clicksCount: c.clicksCount,
          uniqueVisitorsCount: c.uniqueVisitorsCount,
          signupsCount,
          completedTxnCount,
          totalTxnVolume,
          totalRechargesVolume,
          conversionRate: Number(conversionRate),
          createdAt: c.createdAt,
        };
      }),
    );

    // Global Telemetry
    const totalCampaigns = result.length;
    const activeCampaigns = result.filter((c) => c.isActive).length;
    const totalClicks = result.reduce((sum, c) => sum + c.clicksCount, 0);
    const totalUniqueVisitors = result.reduce((sum, c) => sum + c.uniqueVisitorsCount, 0);
    const totalSignups = result.reduce((sum, c) => sum + c.signupsCount, 0);
    const totalPlatformVolume = result.reduce((sum, c) => sum + c.totalTxnVolume, 0);
    const totalPayableCommission = result.reduce((sum, c) => sum + c.pendingPayable, 0);

    return {
      settings,
      summary: {
        totalCampaigns,
        activeCampaigns,
        totalClicks,
        totalUniqueVisitors,
        totalSignups,
        totalPlatformVolume,
        totalPayableCommission,
      },
      campaigns: result,
    };
  }

  /**
   * Create a new promotion campaign (Admin)
   */
  async createCampaign(dto: CreatePromotionDto) {
    const cleanCode = dto.code.toLowerCase().trim();

    // Check duplicate code
    const existing = await this.prisma.promotionCampaign.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      throw new BadRequestException('এই রেফারেল কোড বা স্ল্যাগটি ইতিমধ্যে ব্যবহৃত হয়েছে');
    }

    return this.prisma.promotionCampaign.create({
      data: {
        name: dto.name.trim(),
        code: cleanCode,
        promoterName: dto.promoterName?.trim(),
        promoterPhone: dto.promoterPhone?.trim(),
        promoterChannel: dto.promoterChannel?.trim(),
        commissionType: dto.commissionType || PromotionCommissionType.TRACKING_ONLY,
        commissionRate: new Prisma.Decimal(dto.commissionRate || 0),
        flatBudget: new Prisma.Decimal(dto.flatBudget || 0),
        commissionNote: dto.commissionNote?.trim(),
        targetUrl: dto.targetUrl?.trim() || '/',
        viewToken: randomUUID().replace(/-/g, '').slice(0, 16),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  /**
   * Update an existing campaign (Admin)
   */
  async updateCampaign(id: string, dto: UpdatePromotionDto) {
    const campaign = await this.prisma.promotionCampaign.findUnique({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException('প্রমোশন ক্যাম্পেইন পাওয়া যায়নি');
    }

    let cleanCode = campaign.code;
    if (dto.code && dto.code.trim().toLowerCase() !== campaign.code) {
      cleanCode = dto.code.trim().toLowerCase();
      const existing = await this.prisma.promotionCampaign.findUnique({
        where: { code: cleanCode },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('এই কোডটি ইতিমধ্যে অন্য ক্যাম্পেইনে ব্যবহৃত হচ্ছে');
      }
    }

    return this.prisma.promotionCampaign.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        code: cleanCode,
        ...(dto.promoterName !== undefined && { promoterName: dto.promoterName?.trim() }),
        ...(dto.promoterPhone !== undefined && { promoterPhone: dto.promoterPhone?.trim() }),
        ...(dto.promoterChannel !== undefined && { promoterChannel: dto.promoterChannel?.trim() }),
        ...(dto.commissionType && { commissionType: dto.commissionType }),
        ...(dto.commissionRate !== undefined && { commissionRate: new Prisma.Decimal(dto.commissionRate) }),
        ...(dto.flatBudget !== undefined && { flatBudget: new Prisma.Decimal(dto.flatBudget) }),
        ...(dto.commissionNote !== undefined && { commissionNote: dto.commissionNote?.trim() }),
        ...(dto.targetUrl !== undefined && { targetUrl: dto.targetUrl?.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Record a payout to promoter (Admin)
   */
  async recordPayout(id: string, dto: RecordPayoutDto) {
    const campaign = await this.prisma.promotionCampaign.findUnique({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException('প্রমোশন ক্যাম্পেইন পাওয়া যায়নি');
    }

    const currentPaid = Number(campaign.paidAmount);
    const newPaid = currentPaid + Number(dto.amount);

    return this.prisma.promotionCampaign.update({
      where: { id },
      data: {
        paidAmount: new Prisma.Decimal(newPaid),
      },
    });
  }

  /**
   * Delete a promotion campaign (Admin)
   */
  async deleteCampaign(id: string) {
    const campaign = await this.prisma.promotionCampaign.findUnique({
      where: { id },
    });
    if (!campaign) {
      throw new NotFoundException('প্রমোশন ক্যাম্পেইন পাওয়া যায়নি');
    }

    // Set user references to null first, then delete
    await this.prisma.user.updateMany({
      where: { promotionCampaignId: id },
      data: { promotionCampaignId: null },
    });

    await this.prisma.promotionCampaign.delete({
      where: { id },
    });

    return { success: true, message: 'প্রমোশন ক্যাম্পেইন সফলভাবে মুছে ফেলা হয়েছে' };
  }

  /**
   * Get deep drill-down details of a specific campaign (Admin)
   */
  async getAdminCampaignDetails(id: string) {
    const campaign = await this.prisma.promotionCampaign.findUnique({
      where: { id },
      include: {
        registeredUsers: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
            isVerified: true,
            wallet: {
              select: {
                availableBalance: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        clicks: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('প্রমোশন ক্যাম্পেইন পাওয়া যায়নি');
    }

    const userIds = campaign.registeredUsers.map((u) => u.id);

    // Fetch transactions made by these users
    let transactions: any[] = [];
    let completedTxnCount = 0;
    let totalTxnVolume = 0;
    let totalCommissionGenerated = 0;

    if (userIds.length > 0) {
      transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          trackingNumber: true,
          amount: true,
          commissionAmount: true,
          status: true,
          createdAt: true,
          sender: {
            select: {
              uniqueUserId: true,
              firstName: true,
            },
          },
          receiver: {
            select: {
              uniqueUserId: true,
              firstName: true,
            },
          },
        },
      });

      const releasedTxns = transactions.filter((t) => t.status === 'RELEASED');
      completedTxnCount = releasedTxns.length;
      totalTxnVolume = releasedTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      totalCommissionGenerated = releasedTxns.reduce(
        (sum, t) => sum + Number(t.commissionAmount || 0),
        0,
      );
    }

    // Commission calculations
    const signupsCount = campaign.registeredUsers.length;
    let earnedCommission = 0;
    switch (campaign.commissionType) {
      case PromotionCommissionType.FIXED_PER_REGISTRATION:
        earnedCommission = signupsCount * Number(campaign.commissionRate);
        break;
      case PromotionCommissionType.COMMISSION_PERCENTAGE:
        earnedCommission = (totalCommissionGenerated * Number(campaign.commissionRate)) / 100;
        break;
      case PromotionCommissionType.FLAT_BUDGET:
        earnedCommission = Number(campaign.flatBudget);
        break;
      default:
        earnedCommission = 0;
    }

    const paidAmount = Number(campaign.paidAmount);
    const pendingPayable = Math.max(0, earnedCommission - paidAmount);

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        code: campaign.code,
        promoterName: campaign.promoterName,
        promoterPhone: campaign.promoterPhone,
        promoterChannel: campaign.promoterChannel,
        commissionType: campaign.commissionType,
        commissionRate: Number(campaign.commissionRate),
        flatBudget: Number(campaign.flatBudget),
        paidAmount,
        earnedCommission,
        pendingPayable,
        commissionNote: campaign.commissionNote,
        targetUrl: campaign.targetUrl,
        viewToken: campaign.viewToken,
        isActive: campaign.isActive,
        clicksCount: campaign.clicksCount,
        uniqueVisitorsCount: campaign.uniqueVisitorsCount,
        createdAt: campaign.createdAt,
      },
      stats: {
        signupsCount,
        completedTxnCount,
        totalTxnVolume,
        totalCommissionGenerated,
      },
      registeredUsers: campaign.registeredUsers.map((u) => ({
        id: u.id,
        uniqueUserId: u.uniqueUserId,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        phone: u.phone,
        createdAt: u.createdAt,
        isVerified: u.isVerified,
        availableBalance: Number(u.wallet?.availableBalance || 0),
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        trackingNumber: t.trackingNumber,
        amount: Number(t.amount),
        commissionAmount: Number(t.commissionAmount),
        status: t.status,
        createdAt: t.createdAt,
        sender: t.sender,
        receiver: t.receiver,
      })),
      recentClicks: campaign.clicks,
    };
  }
}
