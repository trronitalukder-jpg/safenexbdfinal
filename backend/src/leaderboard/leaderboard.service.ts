import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(
    type: 'earners' | 'workers' | 'referrers' = 'workers',
    period: 'all' | 'month' = 'month',
  ) {
    const startDate =
      period === 'month'
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        : new Date(0);

    if (type === 'workers') {
      const results = await this.prisma.microJobSubmission.groupBy({
        by: ['workerId'],
        where: {
          status: 'APPROVED',
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 20,
      });

      const workerIds = results.map((r) => r.workerId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: workerIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          uniqueUserId: true,
          avatarUrl: true,
          isVerified: true,
          verificationStatus: true,
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      const leaderboard = results.map((r, index) => {
        const user = userMap.get(r.workerId);
        return {
          rank: index + 1,
          userId: r.workerId,
          score: r._count.id,
          scoreLabel: 'টাস্ক সম্পন্ন',
          user: user || {
            id: r.workerId,
            firstName: 'Worker',
            lastName: '',
            uniqueUserId: 'worker',
            avatarUrl: null,
            isVerified: false,
            verificationStatus: 'NONE',
          },
        };
      });

      return {
        type,
        period,
        monthName: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' }),
        prizePool: {
          first: 1000,
          second: 500,
          third: 300,
          total: 2500,
        },
        items: leaderboard,
      };
    } else if (type === 'referrers') {
      const results = await this.prisma.user.groupBy({
        by: ['referredById'],
        where: {
          referredById: { not: null },
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 20,
      });

      const validResults = results.filter((r) => Boolean(r.referredById));
      const referrerIds = validResults.map((r) => r.referredById as string);

      const users = await this.prisma.user.findMany({
        where: { id: { in: referrerIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          uniqueUserId: true,
          avatarUrl: true,
          isVerified: true,
          verificationStatus: true,
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      const leaderboard = validResults.map((r, index) => {
        const user = userMap.get(r.referredById!);
        return {
          rank: index + 1,
          userId: r.referredById,
          score: r._count.id,
          scoreLabel: 'সদস্য রেফার',
          user: user || {
            id: r.referredById,
            firstName: 'Referrer',
            lastName: '',
            uniqueUserId: 'referrer',
            avatarUrl: null,
            isVerified: false,
            verificationStatus: 'NONE',
          },
        };
      });

      return {
        type,
        period,
        monthName: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' }),
        prizePool: {
          first: 800,
          second: 400,
          third: 200,
          total: 2000,
        },
        items: leaderboard,
      };
    } else {
      // earners
      const results = await this.prisma.walletLedger.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          type: { in: ['MICROJOB_EARNING', 'AFFILIATE_COMMISSION', 'HOLD_RELEASE', 'TRANSFER_IN'] },
          createdAt: { gte: startDate },
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 20,
      });

      const userIds = results.map((r) => r.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          uniqueUserId: true,
          avatarUrl: true,
          isVerified: true,
          verificationStatus: true,
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      const leaderboard = results.map((r, index) => {
        const user = userMap.get(r.userId);
        return {
          rank: index + 1,
          userId: r.userId,
          score: Number(r._sum?.amount || 0),
          scoreLabel: 'আয় (BDT)',
          user: user || {
            id: r.userId,
            firstName: 'User',
            lastName: '',
            uniqueUserId: 'user',
            avatarUrl: null,
            isVerified: false,
            verificationStatus: 'NONE',
          },
        };
      });

      return {
        type,
        period,
        monthName: new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' }),
        prizePool: {
          first: 1500,
          second: 800,
          third: 500,
          total: 3500,
        },
        items: leaderboard,
      };
    }
  }
}
