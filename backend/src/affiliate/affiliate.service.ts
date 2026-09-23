import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ChatGateway } from '../chat/chat.gateway';

export interface AffiliateSettings {
  isEnabled: boolean;
  commissionSource: 'TRANSACTION' | 'RECHARGE' | 'BOTH';
  rewardType: 'PERCENTAGE' | 'FLAT';
  rewardValue: number;
  triggerCondition: 'LIFETIME' | 'FIRST_ONLY';
  minRewardThreshold: number; // Minimum platform fee required to trigger reward
}

export const DEFAULT_AFFILIATE_SETTINGS: AffiliateSettings = {
  isEnabled: true,
  commissionSource: 'BOTH',
  rewardType: 'PERCENTAGE',
  rewardValue: 20, // 20% of company profit/admin fee
  triggerCondition: 'LIFETIME',
  minRewardThreshold: 1, // at least 1 BDT fee
};

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private chatGateway?: ChatGateway,
  ) {}

  /**
   * Get affiliate settings from SystemSetting or fallback to defaults
   */
  async getSettings(): Promise<AffiliateSettings> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'AFFILIATE_SETTINGS' },
      });

      if (!setting || !setting.value) {
        return DEFAULT_AFFILIATE_SETTINGS;
      }

      const val = setting.value as any;
      return {
        isEnabled: val.isEnabled ?? DEFAULT_AFFILIATE_SETTINGS.isEnabled,
        commissionSource: val.commissionSource || DEFAULT_AFFILIATE_SETTINGS.commissionSource,
        rewardType: val.rewardType || DEFAULT_AFFILIATE_SETTINGS.rewardType,
        rewardValue: Number(val.rewardValue ?? DEFAULT_AFFILIATE_SETTINGS.rewardValue),
        triggerCondition: val.triggerCondition || DEFAULT_AFFILIATE_SETTINGS.triggerCondition,
        minRewardThreshold: Number(val.minRewardThreshold ?? DEFAULT_AFFILIATE_SETTINGS.minRewardThreshold),
      };
    } catch (err) {
      this.logger.error('Failed to get affiliate settings:', err);
      return DEFAULT_AFFILIATE_SETTINGS;
    }
  }

  /**
   * Update affiliate settings (Admin only)
   */
  async updateSettings(dto: Partial<AffiliateSettings>): Promise<AffiliateSettings> {
    const current = await this.getSettings();
    const updated: AffiliateSettings = {
      ...current,
      ...dto,
      rewardValue: dto.rewardValue !== undefined ? Number(dto.rewardValue) : current.rewardValue,
      minRewardThreshold: dto.minRewardThreshold !== undefined ? Number(dto.minRewardThreshold) : current.minRewardThreshold,
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'AFFILIATE_SETTINGS' },
      create: {
        key: 'AFFILIATE_SETTINGS',
        value: updated as any,
        description: 'Dynamic Affiliate & Referral System Configuration',
      },
      update: {
        value: updated as any,
      },
    });

    return updated;
  }

  /**
   * Calculate and credit referral reward if applicable
   * Called on Transaction completion or Recharge approval
   */
  async processReferralReward(params: {
    userId: string; // The user who did the transaction/recharge
    sourceType: 'TRANSACTION' | 'RECHARGE';
    sourceId: string; // transactionId or rechargeId
    adminFee: number; // The profit/fee company took
  }) {
    const { userId, sourceType, sourceId, adminFee } = params;

    try {
      const settings = await this.getSettings();
      if (!settings.isEnabled) return null;

      // Check if source type is enabled
      if (settings.commissionSource !== 'BOTH' && settings.commissionSource !== sourceType) {
        return null;
      }

      // Check if user has a referrer
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, uniqueUserId: true, firstName: true, referredById: true },
      });

      if (!user || !user.referredById) {
        return null;
      }

      const referrerId = user.referredById;

      // Prevent self-reward
      if (referrerId === userId) return null;

      // Check FIRST_ONLY condition
      if (settings.triggerCondition === 'FIRST_ONLY') {
        const existingReward = await this.prisma.referralReward.findFirst({
          where: {
            referrerId,
            referredId: userId,
            sourceType,
          },
        });
        if (existingReward) {
          return null; // Already rewarded for first activity
        }
      }

      // Calculate reward amount
      let rewardAmount = 0;
      if (settings.rewardType === 'PERCENTAGE') {
        // e.g. 20% of admin fee
        rewardAmount = (adminFee * settings.rewardValue) / 100;
      } else {
        // FLAT reward e.g. 10 BDT
        rewardAmount = settings.rewardValue;
        // Zero-loss safety guard: reward cannot exceed 70% of company fee
        if (adminFee > 0 && rewardAmount > adminFee * 0.7) {
          rewardAmount = adminFee * 0.7;
        }
      }

      // Round to 2 decimals
      rewardAmount = Math.round(rewardAmount * 100) / 100;

      if (rewardAmount <= 0) return null;

      // Credit referrer's wallet & log reward inside a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Log reward
        const rewardLog = await tx.referralReward.create({
          data: {
            referrerId,
            referredId: userId,
            sourceType,
            sourceId,
            amount: new Prisma.Decimal(rewardAmount),
            adminFee: new Prisma.Decimal(adminFee),
            rateType: settings.rewardType,
            rateValue: new Prisma.Decimal(settings.rewardValue),
            notes: `Affiliate commission from ${user.uniqueUserId || user.firstName} (${sourceType})`,
          },
        });

        // 2. Fetch referrer wallet to record balanceBefore and balanceAfter
        let refWallet = await tx.wallet.findUnique({
          where: { userId: referrerId },
        });

        if (!refWallet) {
          refWallet = await tx.wallet.create({
            data: {
              userId: referrerId,
              availableBalance: new Prisma.Decimal(0),
              holdBalance: 0,
            },
          });
        }

        const balanceBefore = refWallet.availableBalance;
        const balanceAfter = balanceBefore.add(new Prisma.Decimal(rewardAmount));

        // 3. Increment referrer wallet availableBalance
        await tx.wallet.update({
          where: { id: refWallet.id },
          data: {
            availableBalance: balanceAfter,
            version: { increment: 1 },
          },
        });

        // 4. Create WalletLedger record so it appears on /dashboard/wallet ledger!
        await tx.walletLedger.create({
          data: {
            walletId: refWallet.id,
            userId: referrerId,
            transactionId: sourceId || `AFF-${Date.now()}`,
            type: 'AFFILIATE_COMMISSION' as any,
            amount: new Prisma.Decimal(rewardAmount),
            commission: new Prisma.Decimal(0),
            balanceBefore,
            balanceAfter,
            holdBefore: refWallet.holdBalance,
            holdAfter: refWallet.holdBalance,
            referenceId: rewardLog.id,
            referenceType: 'AFFILIATE_REWARD',
            notes: `রেফারেল ইনকাম: ব্যবহারকারী @${user.uniqueUserId || user.firstName} এর ${sourceType === 'RECHARGE' ? 'রিচার্জ' : 'লেনদেন'} থেকে কমিশন`,
            status: 'COMPLETED',
            createdBy: 'SYSTEM',
          },
        });

        return rewardLog;
      });

      // 5. Notify referrer in real-time
      if (this.chatGateway && result) {
        this.chatGateway.notifyUser(referrerId, 'notification:affiliate_reward', {
          amount: rewardAmount,
          fromUser: user.uniqueUserId || user.firstName,
          sourceType,
          title: '🎉 রেফারেল কমিশন জমা হয়েছে!',
          message: `আপনার রেফারেল @${user.uniqueUserId || user.firstName} এর সফল কার্যক্রম থেকে ৳${rewardAmount} কমিশন আপনার ওয়ালেটে জমা হয়েছে।`,
        });
      }

      this.logger.log(`Affiliate reward credited: ৳${rewardAmount} to referrer ${referrerId} from user ${userId}`);
      return result;
    } catch (err) {
      this.logger.error('Failed to process referral reward:', err);
      return null;
    }
  }

  /**
   * User: Get personal affiliate statistics and referral list
   */
  async getMyAffiliateStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        uniqueUserId: true,
        phone: true,
        referrals: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        referrerRewards: {
          select: {
            id: true,
            sourceType: true,
            amount: true,
            createdAt: true,
            referred: {
              select: {
                uniqueUserId: true,
                firstName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const totalReferrals = user.referrals.length;

    // Aggregate from both referralReward and walletLedger to guarantee exact match
    const [rewardsAggregate, ledgerAggregate] = await Promise.all([
      this.prisma.referralReward.aggregate({
        where: { referrerId: userId },
        _sum: { amount: true },
      }),
      this.prisma.walletLedger.aggregate({
        where: { userId, type: 'AFFILIATE_COMMISSION' as any },
        _sum: { amount: true },
      }),
    ]);

    const sumRewards = Number(rewardsAggregate._sum.amount || 0);
    const sumLedger = Number(ledgerAggregate._sum.amount || 0);
    const totalEarned = Math.max(sumRewards, sumLedger);

    // Format referral link (e.g. https://safnexbd.com/register?ref=UNIQUE_ID)
    const referralCode = user.uniqueUserId || user.id;

    return {
      referralCode,
      totalReferrals,
      totalEarned: Math.round(totalEarned * 100) / 100,
      referrals: user.referrals.map((r) => ({
        id: r.id,
        uniqueUserId: r.uniqueUserId,
        name: r.firstName,
        joinedAt: r.createdAt,
      })),
      recentRewards: user.referrerRewards.map((rw) => ({
        id: rw.id,
        sourceType: rw.sourceType,
        amount: Number(rw.amount),
        fromUser: rw.referred.uniqueUserId || rw.referred.firstName,
        createdAt: rw.createdAt,
      })),
    };
  }

  /**
   * Admin: Get overall affiliate performance overview
   */
  async getAdminOverview() {
    const [totalRewardsCount, totalRewardsSum, topReferrers] = await Promise.all([
      this.prisma.referralReward.count(),
      this.prisma.referralReward.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.user.findMany({
        where: {
          referrerRewards: { some: {} },
        },
        select: {
          id: true,
          uniqueUserId: true,
          firstName: true,
          phone: true,
          _count: {
            select: {
              referrals: true,
              referrerRewards: true,
            },
          },
          referrerRewards: {
            select: { amount: true },
          },
        },
        take: 10,
      }),
    ]);

    const formattedTop = topReferrers
      .map((u) => ({
        id: u.id,
        uniqueUserId: u.uniqueUserId,
        name: u.firstName,
        phone: u.phone,
        totalReferrals: u._count.referrals,
        totalEarned: u.referrerRewards.reduce((s, r) => s + Number(r.amount), 0),
      }))
      .sort((a, b) => b.totalEarned - a.totalEarned);

    return {
      totalRewardsGiven: totalRewardsCount,
      totalAmountPaid: Number(totalRewardsSum._sum.amount || 0),
      topReferrers: formattedTop,
    };
  }
}

