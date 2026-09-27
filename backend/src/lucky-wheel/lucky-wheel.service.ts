import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  UpdateLuckyWheelSettingsDto,
  CreateSegmentDto,
  UpdateSegmentDto,
} from './dto/lucky-wheel.dto';
import { ChatGateway } from '../chat/chat.gateway';

export const DEFAULT_LUCKY_WHEEL_SETTING = {
  id: 'default',
  isEnabled: true,
  isBudgetEnabled: true,
  dailyBudget: 500,
  isNewUserRewardEnabled: true,
  newUserMinReward: 2,
  newUserMaxReward: 15,
  isMonthlyCapEnabled: true,
  monthlyMaxPerUser: 150,
  emptyMessage:
    'শূন্য আমি রিক্ত আমি আজ দেওয়ার কিছু নাই, আজ আছে শুধু ভালোবাসা দিয়ে গেলাম তাই, আবার চেষ্টা করুন ❤️',
  dailyFreeSpinsPerUser: 1,
};

export const DEFAULT_SEGMENTS = [
  {
    title: '৳৫ ক্যাশ',
    prizeType: 'CASH',
    prizeValue: 5,
    probabilityWeight: 20,
    color: '#3B82F6',
    textColor: '#FFFFFF',
    icon: 'Coins',
    sortOrder: 1,
    isActive: true,
  },
  {
    title: 'আবার চেষ্টা করুন',
    prizeType: 'TRY_AGAIN',
    prizeValue: 0,
    probabilityWeight: 35,
    color: '#EF4444',
    textColor: '#FFFFFF',
    icon: 'Heart',
    sortOrder: 2,
    isActive: true,
  },
  {
    title: '৳১০ ক্যাশ',
    prizeType: 'CASH',
    prizeValue: 10,
    probabilityWeight: 15,
    color: '#10B981',
    textColor: '#FFFFFF',
    icon: 'Sparkles',
    sortOrder: 3,
    isActive: true,
  },
  {
    title: 'আজ শুধু ভালোবাসা',
    prizeType: 'TRY_AGAIN',
    prizeValue: 0,
    probabilityWeight: 25,
    color: '#8B5CF6',
    textColor: '#FFFFFF',
    icon: 'Gift',
    sortOrder: 4,
    isActive: true,
  },
  {
    title: '৳২ ক্যাশ',
    prizeType: 'CASH',
    prizeValue: 2,
    probabilityWeight: 30,
    color: '#06B6D4',
    textColor: '#FFFFFF',
    icon: 'Coins',
    sortOrder: 5,
    isActive: true,
  },
  {
    title: 'শুভকামনা রইল',
    prizeType: 'TRY_AGAIN',
    prizeValue: 0,
    probabilityWeight: 20,
    color: '#F59E0B',
    textColor: '#FFFFFF',
    icon: 'Smile',
    sortOrder: 6,
    isActive: true,
  },
  {
    title: '৳১৫ ক্যাশ',
    prizeType: 'CASH',
    prizeValue: 15,
    probabilityWeight: 10,
    color: '#EC4899',
    textColor: '#FFFFFF',
    icon: 'Trophy',
    sortOrder: 7,
    isActive: true,
  },
  {
    title: 'কালকে আসুন',
    prizeType: 'TRY_AGAIN',
    prizeValue: 0,
    probabilityWeight: 20,
    color: '#64748B',
    textColor: '#FFFFFF',
    icon: 'Clock',
    sortOrder: 8,
    isActive: true,
  },
];

@Injectable()
export class LuckyWheelService {
  private readonly logger = new Logger(LuckyWheelService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly chatGateway?: ChatGateway,
  ) {}

  /**
   * Seed default settings and segments if none exist
   */
  async ensureDefaults() {
    let setting = await this.prisma.luckyWheelSetting.findUnique({
      where: { id: 'default' },
    });
    if (!setting) {
      setting = await this.prisma.luckyWheelSetting.create({
        data: {
          id: 'default',
          isEnabled: DEFAULT_LUCKY_WHEEL_SETTING.isEnabled,
          isBudgetEnabled: DEFAULT_LUCKY_WHEEL_SETTING.isBudgetEnabled,
          dailyBudget: new Prisma.Decimal(DEFAULT_LUCKY_WHEEL_SETTING.dailyBudget),
          isNewUserRewardEnabled: DEFAULT_LUCKY_WHEEL_SETTING.isNewUserRewardEnabled,
          newUserMinReward: new Prisma.Decimal(DEFAULT_LUCKY_WHEEL_SETTING.newUserMinReward),
          newUserMaxReward: new Prisma.Decimal(DEFAULT_LUCKY_WHEEL_SETTING.newUserMaxReward),
          isMonthlyCapEnabled: DEFAULT_LUCKY_WHEEL_SETTING.isMonthlyCapEnabled,
          monthlyMaxPerUser: new Prisma.Decimal(DEFAULT_LUCKY_WHEEL_SETTING.monthlyMaxPerUser),
          emptyMessage: DEFAULT_LUCKY_WHEEL_SETTING.emptyMessage,
          dailyFreeSpinsPerUser: DEFAULT_LUCKY_WHEEL_SETTING.dailyFreeSpinsPerUser,
        },
      });
    }

    const segmentsCount = await this.prisma.luckyWheelSegment.count();
    if (segmentsCount === 0) {
      for (const seg of DEFAULT_SEGMENTS) {
        await this.prisma.luckyWheelSegment.create({
          data: {
            title: seg.title,
            prizeType: seg.prizeType,
            prizeValue: new Prisma.Decimal(seg.prizeValue),
            probabilityWeight: seg.probabilityWeight,
            color: seg.color,
            textColor: seg.textColor,
            icon: seg.icon,
            sortOrder: seg.sortOrder,
            isActive: seg.isActive,
          },
        });
      }
    }

    return setting;
  }

  /**
   * Get public wheel configuration (Active segments & general wheel info for users)
   */
  async getPublicConfig() {
    await this.ensureDefaults();

    const setting = await this.prisma.luckyWheelSetting.findUnique({
      where: { id: 'default' },
    });

    const segments = await this.prisma.luckyWheelSegment.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        prizeType: true,
        prizeValue: true,
        color: true,
        textColor: true,
        icon: true,
        sortOrder: true,
      },
    });

    return {
      isEnabled: setting?.isEnabled ?? true,
      emptyMessage: setting?.emptyMessage,
      segments: segments.map((s) => ({
        ...s,
        prizeValue: Number(s.prizeValue),
      })),
    };
  }

  /**
   * Get user's spin status (Can spin today? Bonus spins count, next free spin time)
   */
  async getUserSpinStatus(userId: string) {
    await this.ensureDefaults();

    const setting = await this.prisma.luckyWheelSetting.findUnique({
      where: { id: 'default' },
    });

    let quota = await this.prisma.userSpinQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      quota = await this.prisma.userSpinQuota.create({
        data: {
          userId,
          bonusSpins: 0,
        },
      });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if user has already won a CASH prize today
    const todayCashWonCount = await this.prisma.luckyWheelSpin.count({
      where: {
        userId,
        prizeType: 'CASH',
        prizeValue: { gt: 0 },
        createdAt: { gte: startOfToday },
      },
    });

    const hasWonCashToday = todayCashWonCount >= 1;

    return {
      canSpin: setting?.isEnabled ?? true,
      hasWonCashToday,
    };
  }

  /**
   * Execute spin by server-side RNG with budget & cap safeguards
   * User can spin anytime unlimited times per day, wins cash at most once per day
   */
  async executeSpin(userId: string) {
    await this.ensureDefaults();

    const setting = await this.prisma.luckyWheelSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting || !setting.isEnabled) {
      throw new BadRequestException('লাকি হুইল সিস্টেম বর্তমানে সাময়িকভাবে বন্ধ আছে');
    }

    // 1. Fetch all active segments
    const allSegments = await this.prisma.luckyWheelSegment.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (allSegments.length === 0) {
      throw new BadRequestException('হুইলের কোনো সেগমেন্ট কনফিগার করা নেই');
    }

    // 2. Evaluate platform daily budget constraint
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let isDailyBudgetExceeded = false;
    if (setting.isBudgetEnabled) {
      const todaySum = await this.prisma.luckyWheelSpin.aggregate({
        where: {
          prizeType: 'CASH',
          createdAt: { gte: startOfToday },
        },
        _sum: { prizeValue: true },
      });
      const todayGiven = Number(todaySum._sum.prizeValue || 0);
      if (todayGiven >= Number(setting.dailyBudget)) {
        isDailyBudgetExceeded = true;
      }
    }

    // 3. Check if user already won a cash prize today (User can spin unlimited, but only wins cash once per day)
    const todayCashSpins = await this.prisma.luckyWheelSpin.count({
      where: {
        userId,
        prizeType: 'CASH',
        prizeValue: { gt: 0 },
        createdAt: { gte: startOfToday },
      },
    });
    const hasWonCashToday = todayCashSpins >= 1;

    // 4. Evaluate monthly cap per user constraint (silent internal risk limit)
    let isUserMonthlyCapExceeded = false;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySum = await this.prisma.luckyWheelSpin.aggregate({
      where: {
        userId,
        prizeType: 'CASH',
        createdAt: { gte: startOfMonth },
      },
      _sum: { prizeValue: true },
    });
    const monthlyWon = Number(monthlySum._sum.prizeValue || 0);

    if (setting.isMonthlyCapEnabled) {
      if (monthlyWon >= Number(setting.monthlyMaxPerUser)) {
        isUserMonthlyCapExceeded = true;
      }
    }

    // 5. Check if user is a new user (created within 3 days and has never spun)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true, uniqueUserId: true, firstName: true },
    });

    const userQuota = await this.prisma.userSpinQuota.findUnique({
      where: { userId },
    });

    const isNewUser =
      user &&
      now.getTime() - new Date(user.createdAt).getTime() <= 3 * 24 * 60 * 60 * 1000 &&
      (!userQuota || !userQuota.lastDailySpinAt);

    // 6. Filter candidate segments based on rules
    let candidateSegments = allSegments.filter((seg) => {
      const prizeVal = Number(seg.prizeValue);

      // If already won cash today, or platform budget exceeded, or monthly cap reached:
      // Strictly no CASH prizes allowed!
      if (seg.prizeType === 'CASH') {
        if (hasWonCashToday || isDailyBudgetExceeded || isUserMonthlyCapExceeded) {
          return false;
        }
        // If monthly cap would be exceeded
        if (
          setting.isMonthlyCapEnabled &&
          monthlyWon + prizeVal > Number(setting.monthlyMaxPerUser)
        ) {
          return false;
        }
      }

      // If user is new and new user reward is enabled
      if (
        isNewUser &&
        setting.isNewUserRewardEnabled &&
        seg.prizeType === 'CASH'
      ) {
        const minRew = Number(setting.newUserMinReward);
        const maxRew = Number(setting.newUserMaxReward);
        if (prizeVal < minRew || prizeVal > maxRew) {
          return false;
        }
      }

      return true;
    });

    // Fallback if filtering left no candidates (pick non-cash segments)
    if (candidateSegments.length === 0) {
      candidateSegments = allSegments.filter((s) => s.prizeType !== 'CASH');
      if (candidateSegments.length === 0) {
        candidateSegments = allSegments;
      }
    }

    // 7. Weighted Random Selection
    const totalWeight = candidateSegments.reduce(
      (sum, seg) => sum + Math.max(1, seg.probabilityWeight),
      0,
    );
    let randomNum = Math.random() * totalWeight;
    let selectedSegment = candidateSegments[0];

    for (const seg of candidateSegments) {
      const w = Math.max(1, seg.probabilityWeight);
      if (randomNum <= w) {
        selectedSegment = seg;
        break;
      }
      randomNum -= w;
    }

    const wonAmount =
      selectedSegment.prizeType === 'CASH' ? Number(selectedSegment.prizeValue) : 0;
    const targetIndex = allSegments.findIndex((s) => s.id === selectedSegment.id);

    // 8. Execute Database Transaction (Credit wallet if CASH, record spin log)
    const result = await this.prisma.$transaction(async (tx) => {
      // Update last spin timestamp
      await tx.userSpinQuota.upsert({
        where: { userId },
        create: {
          userId,
          lastDailySpinAt: now,
          bonusSpins: 0,
        },
        update: {
          lastDailySpinAt: now,
        },
      });

      let spinRecordId: string | null = null;
      let updatedBalance: number | null = null;

      // Crucial: Only insert a database record into luckyWheelSpin if it is an actual CASH win!
      // Unlimited spins with empty / non-cash messages do NOT insert rows into the database,
      // which completely prevents database table bloat and ensures the website runs blazing fast!
      if (wonAmount > 0 && selectedSegment.prizeType === 'CASH') {
        const spinRecord = await tx.luckyWheelSpin.create({
          data: {
            userId,
            segmentId: selectedSegment.id,
            prizeType: selectedSegment.prizeType,
            prizeValue: new Prisma.Decimal(wonAmount),
            spinSource: hasWonCashToday ? 'UNLIMITED_SPIN' : 'DAILY_SPIN',
          },
        });
        spinRecordId = spinRecord.id;

        let wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId,
              availableBalance: new Prisma.Decimal(0),
              holdBalance: new Prisma.Decimal(0),
            },
          });
        }

        const balanceBefore = wallet.availableBalance;
        const balanceAfter = balanceBefore.add(new Prisma.Decimal(wonAmount));

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: balanceAfter,
            version: { increment: 1 },
          },
        });

        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            userId,
            type: 'LUCKY_WHEEL_REWARD',
            amount: new Prisma.Decimal(wonAmount),
            commission: new Prisma.Decimal(0),
            balanceBefore,
            balanceAfter,
            transactionId: spinRecord.id,
            notes: `লাকি হুইল পুরস্কার: ৳${wonAmount.toFixed(2)} (${selectedSegment.title})`,
          },
        });

        updatedBalance = Number(balanceAfter);
      }

      return {
        spinId: spinRecordId,
        updatedBalance,
      };
    });

    // Background cleanup: Purge any non-cash spin records to keep database clean
    this.prisma.luckyWheelSpin
      .deleteMany({
        where: {
          prizeType: { not: 'CASH' },
        },
      })
      .catch(() => {});

    return {
      success: true,
      selectedSegment: {
        id: selectedSegment.id,
        title: selectedSegment.title,
        prizeType: selectedSegment.prizeType,
        prizeValue: wonAmount,
        color: selectedSegment.color,
        textColor: selectedSegment.textColor,
        icon: selectedSegment.icon,
      },
      targetIndex: targetIndex >= 0 ? targetIndex : 0,
      wonAmount,
      isCash: selectedSegment.prizeType === 'CASH',
      emptyMessage: setting.emptyMessage,
      updatedBalance: result.updatedBalance,
      canSpin: true,
    };
  }

  /**
   * Get recent public lucky wheel winners for marquee ticker
   */
  async getRecentWinners() {
    const spins = await this.prisma.luckyWheelSpin.findMany({
      where: {
        prizeType: 'CASH',
        prizeValue: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        user: {
          select: {
            id: true,
            uniqueUserId: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        segment: {
          select: {
            title: true,
          },
        },
      },
    });

    return spins.map((s) => ({
      id: s.id,
      userName: s.user ? `${s.user.firstName} ${s.user.uniqueUserId ? `(${s.user.uniqueUserId})` : ''}` : 'ইউজার',
      avatarUrl: s.user?.avatarUrl,
      amount: Number(s.prizeValue),
      segmentTitle: s.segment?.title,
      timeAgo: s.createdAt,
    }));
  }

  // =========================================================================
  // ADMIN PANEL METHODS
  // =========================================================================

  /**
   * Get full admin configuration (Settings, all segments, today's budget summary)
   */
  async getAdminSettings() {
    await this.ensureDefaults();

    const setting = await this.prisma.luckyWheelSetting.findUnique({
      where: { id: 'default' },
    });

    const segments = await this.prisma.luckyWheelSegment.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Telemetry: Today's cash given
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayAgg = await this.prisma.luckyWheelSpin.aggregate({
      where: {
        prizeType: 'CASH',
        createdAt: { gte: startOfToday },
      },
      _sum: { prizeValue: true },
      _count: { id: true },
    });

    const monthAgg = await this.prisma.luckyWheelSpin.aggregate({
      where: {
        prizeType: 'CASH',
        createdAt: { gte: startOfMonth },
      },
      _sum: { prizeValue: true },
      _count: { id: true },
    });

    const totalSpinsCount = await this.prisma.luckyWheelSpin.count();

    return {
      settings: {
        id: setting?.id,
        isEnabled: setting?.isEnabled ?? true,
        isBudgetEnabled: setting?.isBudgetEnabled ?? true,
        dailyBudget: Number(setting?.dailyBudget || 500),
        isNewUserRewardEnabled: setting?.isNewUserRewardEnabled ?? true,
        newUserMinReward: Number(setting?.newUserMinReward || 2),
        newUserMaxReward: Number(setting?.newUserMaxReward || 15),
        isMonthlyCapEnabled: setting?.isMonthlyCapEnabled ?? true,
        monthlyMaxPerUser: Number(setting?.monthlyMaxPerUser || 150),
        emptyMessage: setting?.emptyMessage,
        dailyFreeSpinsPerUser: setting?.dailyFreeSpinsPerUser || 1,
      },
      segments: segments.map((s) => ({
        ...s,
        prizeValue: Number(s.prizeValue),
      })),
      telemetry: {
        todayCashDisbursed: Number(todayAgg._sum.prizeValue || 0),
        todaySpinsCount: todayAgg._count.id,
        monthCashDisbursed: Number(monthAgg._sum.prizeValue || 0),
        totalSpinsCount,
      },
    };
  }

  /**
   * Update admin settings
   */
  async updateSettings(dto: UpdateLuckyWheelSettingsDto) {
    await this.ensureDefaults();

    const data: Prisma.LuckyWheelSettingUpdateInput = {};

    if (dto.isEnabled !== undefined) data.isEnabled = dto.isEnabled;
    if (dto.isBudgetEnabled !== undefined) data.isBudgetEnabled = dto.isBudgetEnabled;
    if (dto.dailyBudget !== undefined) data.dailyBudget = new Prisma.Decimal(dto.dailyBudget);
    if (dto.isNewUserRewardEnabled !== undefined) data.isNewUserRewardEnabled = dto.isNewUserRewardEnabled;
    if (dto.newUserMinReward !== undefined) data.newUserMinReward = new Prisma.Decimal(dto.newUserMinReward);
    if (dto.newUserMaxReward !== undefined) data.newUserMaxReward = new Prisma.Decimal(dto.newUserMaxReward);
    if (dto.isMonthlyCapEnabled !== undefined) data.isMonthlyCapEnabled = dto.isMonthlyCapEnabled;
    if (dto.monthlyMaxPerUser !== undefined) data.monthlyMaxPerUser = new Prisma.Decimal(dto.monthlyMaxPerUser);
    if (dto.emptyMessage !== undefined) data.emptyMessage = dto.emptyMessage;
    if (dto.dailyFreeSpinsPerUser !== undefined) data.dailyFreeSpinsPerUser = dto.dailyFreeSpinsPerUser;

    const updated = await this.prisma.luckyWheelSetting.update({
      where: { id: 'default' },
      data,
    });

    return updated;
  }

  /**
   * Create new segment (Admin)
   */
  async createSegment(dto: CreateSegmentDto) {
    const count = await this.prisma.luckyWheelSegment.count();
    const segment = await this.prisma.luckyWheelSegment.create({
      data: {
        title: dto.title,
        prizeType: dto.prizeType,
        prizeValue: new Prisma.Decimal(dto.prizeValue || 0),
        probabilityWeight: dto.probabilityWeight || 10,
        color: dto.color || '#3B82F6',
        textColor: dto.textColor || '#FFFFFF',
        icon: dto.icon || 'Sparkles',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : count + 1,
      },
    });

    return {
      ...segment,
      prizeValue: Number(segment.prizeValue),
    };
  }

  /**
   * Update segment (Admin)
   */
  async updateSegment(id: string, dto: UpdateSegmentDto) {
    const existing = await this.prisma.luckyWheelSegment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('সেগমেন্টটি পাওয়া যায়নি');
    }

    const data: Prisma.LuckyWheelSegmentUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.prizeType !== undefined) data.prizeType = dto.prizeType;
    if (dto.prizeValue !== undefined) data.prizeValue = new Prisma.Decimal(dto.prizeValue);
    if (dto.probabilityWeight !== undefined) data.probabilityWeight = dto.probabilityWeight;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.textColor !== undefined) data.textColor = dto.textColor;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    const updated = await this.prisma.luckyWheelSegment.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      prizeValue: Number(updated.prizeValue),
    };
  }

  /**
   * Delete segment (Admin)
   */
  async deleteSegment(id: string) {
    const count = await this.prisma.luckyWheelSegment.count();
    if (count <= 2) {
      throw new BadRequestException('হুইলে কমপক্ষে ২টি সেগমেন্ট থাকা আবশ্যক');
    }

    await this.prisma.luckyWheelSegment.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get spins log for audit (Admin)
   */
  async getAdminSpinsLog(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.luckyWheelSpin.count(),
      this.prisma.luckyWheelSpin.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          segment: {
            select: {
              title: true,
              color: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: items.map((i) => ({
        ...i,
        prizeValue: Number(i.prizeValue),
      })),
    };
  }
}
