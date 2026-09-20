import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
  ClaimTaskDto,
  EscalateTaskDto,
  ReassignTaskDto,
  ReleaseTaskDto,
  UpdateDutyStatusDto,
} from './dto/operations.dto';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    @Optional() private chatGateway?: ChatGateway,
  ) {}

  /**
   * Get current staff member's duty profile & workload count
   */
  async getMyDutyStatus(userId: string) {
    let profile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.staffProfile.create({
        data: {
          userId,
          dutyStatus: 'OFF_DUTY',
          department: 'GENERAL',
        },
      });
    }

    // Count currently assigned active tasks
    const now = new Date();
    const [activeWithdrawals, activeRecharges, activeDisputes] = await Promise.all([
      this.prisma.withdrawalRequest.count({
        where: {
          assignedToId: userId,
          status: 'PENDING',
          lockedUntil: { gte: now },
        },
      }),
      this.prisma.rechargeRequest.count({
        where: {
          assignedToId: userId,
          status: 'PENDING',
          lockedUntil: { gte: now },
        },
      }),
      this.prisma.dispute.count({
        where: {
          assignedToId: userId,
          status: 'ACTIVE_CALL',
        },
      }),
    ]);

    const activeTasksCount = activeWithdrawals + activeRecharges + activeDisputes;

    return {
      ...profile,
      activeTasksCount,
      breakdown: {
        withdrawals: activeWithdrawals,
        recharges: activeRecharges,
        disputes: activeDisputes,
      },
    };
  }

  /**
   * Update staff member's duty status (ON_DUTY, ON_BREAK, OFF_DUTY)
   */
  async updateDutyStatus(userId: string, dto: UpdateDutyStatusDto) {
    const updated = await this.prisma.staffProfile.upsert({
      where: { userId },
      update: {
        dutyStatus: dto.dutyStatus,
        department: dto.department || undefined,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        dutyStatus: dto.dutyStatus,
        department: dto.department || 'GENERAL',
        lastActiveAt: new Date(),
      },
    });

    // Notify other staff / admin of presence change
    if (this.chatGateway) {
      this.chatGateway.notifyAdminsAndStaff('operations:presence_changed', {
        userId,
        dutyStatus: updated.dutyStatus,
        department: updated.department,
      });
    }

    return updated;
  }

  /**
   * Get list of currently ON_DUTY staff members (for peer reassignment dropdown)
   */
  async getActiveStaffList(department?: string) {
    const whereClause: any = {
      dutyStatus: 'ON_DUTY',
    };
    if (department && department !== 'ALL' && department !== 'GENERAL') {
      whereClause.OR = [
        { department },
        { department: 'GENERAL' },
      ];
    }

    const profiles = await this.prisma.staffProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uniqueUserId: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    const now = new Date();

    // Map each profile with active task count
    const staffWithLoad = await Promise.all(
      profiles.map(async (p) => {
        const [wCount, rCount, dCount] = await Promise.all([
          this.prisma.withdrawalRequest.count({
            where: { assignedToId: p.userId, status: 'PENDING', lockedUntil: { gte: now } },
          }),
          this.prisma.rechargeRequest.count({
            where: { assignedToId: p.userId, status: 'PENDING', lockedUntil: { gte: now } },
          }),
          this.prisma.dispute.count({
            where: { assignedToId: p.userId, status: 'ACTIVE_CALL' },
          }),
        ]);

        return {
          userId: p.userId,
          name: `${p.user.firstName} ${p.user.lastName}`.trim() || p.user.uniqueUserId,
          uniqueUserId: p.user.uniqueUserId,
          email: p.user.email,
          avatarUrl: p.user.avatarUrl,
          department: p.department,
          dutyStatus: p.dutyStatus,
          activeTasks: wCount + rCount + dCount,
          maxTasks: p.maxConcurrentTasks,
        };
      }),
    );

    return staffWithLoad;
  }

  /**
   * Claim next task from queue or claim a specific task
   */
  async claimTask(staffId: string, dto: ClaimTaskDto) {
    const settings = await this.settingsService.getOperationsSettings();
    const lockMinutes = Number(settings.lockDurationMinutes || 10);
    const maxTasks = Number(settings.maxConcurrentTasksPerStaff || 5);
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);

    // 1. Check staff concurrent workload
    const [wCount, rCount, dCount] = await Promise.all([
      this.prisma.withdrawalRequest.count({
        where: { assignedToId: staffId, status: 'PENDING', lockedUntil: { gte: now } },
      }),
      this.prisma.rechargeRequest.count({
        where: { assignedToId: staffId, status: 'PENDING', lockedUntil: { gte: now } },
      }),
      this.prisma.dispute.count({
        where: { assignedToId: staffId, status: 'ACTIVE_CALL' },
      }),
    ]);

    if (wCount + rCount + dCount >= maxTasks) {
      throw new BadRequestException(
        `আপনি ইতিমধ্যে সর্বোচ্চ ${maxTasks} টি কাজ পরিচালনা করছেন। নতুন কাজ ক্লেইম করার আগে বিদ্যমান কাজ সম্পন্ন বা রিলিজ করুন।`,
      );
    }

    // 2. Claim by Type
    if (dto.taskType === 'WITHDRAWAL') {
      let targetId = dto.taskId;

      if (!targetId) {
        // Find oldest pending unassigned or expired-lock withdrawal
        const candidate = await this.prisma.withdrawalRequest.findFirst({
          where: {
            status: 'PENDING',
            OR: [
              { assignedToId: null },
              { lockedUntil: { lt: now } },
            ],
          },
          orderBy: { createdAt: 'asc' },
        });

        if (!candidate) {
          throw new NotFoundException('উইথড্র কিউতে বর্তমানে কোনো অপেক্ষমাণ রিকোয়েস্ট নেই।');
        }
        targetId = candidate.id;
      }

      // Concurrency lock update
      const updated = await this.prisma.withdrawalRequest.update({
        where: { id: targetId },
        data: {
          assignedToId: staffId,
          assignedAt: now,
          lockedUntil,
        },
        include: { user: true, method: true },
      });

      return { success: true, taskType: 'WITHDRAWAL', task: updated };
    }

    if (dto.taskType === 'RECHARGE') {
      let targetId = dto.taskId;

      if (!targetId) {
        const candidate = await this.prisma.rechargeRequest.findFirst({
          where: {
            status: 'PENDING',
            OR: [
              { assignedToId: null },
              { lockedUntil: { lt: now } },
            ],
          },
          orderBy: { createdAt: 'asc' },
        });

        if (!candidate) {
          throw new NotFoundException('রিচার্জ কিউতে বর্তমানে কোনো অপেক্ষমাণ রিকোয়েস্ট নেই।');
        }
        targetId = candidate.id;
      }

      const updated = await this.prisma.rechargeRequest.update({
        where: { id: targetId },
        data: {
          assignedToId: staffId,
          assignedAt: now,
          lockedUntil,
        },
        include: { user: true, method: true },
      });

      return { success: true, taskType: 'RECHARGE', task: updated };
    }

    if (dto.taskType === 'DISPUTE') {
      let targetId = dto.taskId;

      if (!targetId) {
        const candidate = await this.prisma.dispute.findFirst({
          where: {
            status: 'ACTIVE_CALL',
            OR: [
              { assignedToId: null },
              { lockedUntil: { lt: now } },
            ],
          },
          orderBy: { createdAt: 'asc' },
        });

        if (!candidate) {
          throw new NotFoundException('ডিসপুট কিউতে বর্তমানে কোনো কল বা বিরোধ অপেক্ষমাণ নেই।');
        }
        targetId = candidate.id;
      }

      const updated = await this.prisma.dispute.update({
        where: { id: targetId },
        data: {
          assignedToId: staffId,
          assignedAt: now,
          lockedUntil,
        },
        include: {
          transaction: {
            include: {
              sender: true,
              receiver: true,
            },
          },
          initiatedBy: true,
        },
      });

      return { success: true, taskType: 'DISPUTE', task: updated };
    }

    throw new BadRequestException('Invalid task type');
  }

  /**
   * Release task back to open queue (clears lock & assignment)
   */
  async releaseTask(staffId: string, dto: ReleaseTaskDto) {
    if (dto.taskType === 'WITHDRAWAL') {
      await this.prisma.withdrawalRequest.update({
        where: { id: dto.taskId },
        data: { assignedToId: null, assignedAt: null, lockedUntil: null },
      });
    } else if (dto.taskType === 'RECHARGE') {
      await this.prisma.rechargeRequest.update({
        where: { id: dto.taskId },
        data: { assignedToId: null, assignedAt: null, lockedUntil: null },
      });
    } else if (dto.taskType === 'DISPUTE') {
      await this.prisma.dispute.update({
        where: { id: dto.taskId },
        data: { assignedToId: null, assignedAt: null, lockedUntil: null },
      });
    }

    return { success: true, message: 'টাস্ক সফলভাবে উন্মুক্ত কিউতে ফেরত দেওয়া হয়েছে।' };
  }

  /**
   * Peer Reassignment: Transfer task to another on-duty staff or return to pool
   */
  async reassignTask(staffId: string, dto: ReassignTaskDto) {
    const settings = await this.settingsService.getOperationsSettings();
    if (settings.peerReassignmentEnabled === false) {
      throw new BadRequestException('স্টাফদের মধ্যে কাজ ট্রান্সফার করার অপশন বর্তমানে বন্ধ রয়েছে।');
    }

    if (settings.requireHandoverNotes && (!dto.reason || !dto.reason.trim())) {
      throw new BadRequestException('সহকর্মীর কাছে কাজ ট্রান্সফার করতে হ্যান্ডওভার নোট আবশ্যক।');
    }

    const lockMinutes = Number(settings.lockDurationMinutes || 10);
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);

    let targetStaffName = 'উন্মুক্ত কিউ';

    if (dto.toStaffId) {
      const targetStaff = await this.prisma.user.findUnique({
        where: { id: dto.toStaffId },
        select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
      });
      if (!targetStaff) {
        throw new NotFoundException('প্রদত্ত সহকর্মী পাওয়া যায়নি।');
      }
      targetStaffName = `${targetStaff.firstName} ${targetStaff.lastName}`.trim() || targetStaff.uniqueUserId;
    }

    // 1. Update task record
    if (dto.taskType === 'WITHDRAWAL') {
      await this.prisma.withdrawalRequest.update({
        where: { id: dto.taskId },
        data: {
          assignedToId: dto.toStaffId || null,
          assignedAt: dto.toStaffId ? now : null,
          lockedUntil: dto.toStaffId ? lockedUntil : null,
        },
      });
    } else if (dto.taskType === 'RECHARGE') {
      await this.prisma.rechargeRequest.update({
        where: { id: dto.taskId },
        data: {
          assignedToId: dto.toStaffId || null,
          assignedAt: dto.toStaffId ? now : null,
          lockedUntil: dto.toStaffId ? lockedUntil : null,
        },
      });
    } else if (dto.taskType === 'DISPUTE') {
      await this.prisma.dispute.update({
        where: { id: dto.taskId },
        data: {
          assignedToId: dto.toStaffId || null,
          assignedAt: dto.toStaffId ? now : null,
          lockedUntil: dto.toStaffId ? lockedUntil : null,
        },
      });
    }

    // 2. Log handoff in audit history
    await this.prisma.taskHandoffLog.create({
      data: {
        taskType: dto.taskType,
        taskId: dto.taskId,
        fromStaffId: staffId,
        toStaffId: dto.toStaffId || null,
        reason: dto.reason || 'Handover without specific notes',
      },
    });

    // 3. Realtime Socket notification to receiver
    if (this.chatGateway && dto.toStaffId) {
      this.chatGateway.notifyAdminsAndStaff('operations:task_assigned', {
        toStaffId: dto.toStaffId,
        fromStaffId: staffId,
        taskType: dto.taskType,
        taskId: dto.taskId,
        reason: dto.reason,
        message: `সহকর্মী কর্তৃক একটি ${dto.taskType} কাজ আপনাকে ট্রান্সফার করা হয়েছে।`,
      });
    }

    return {
      success: true,
      message: `কাজটি সফলভাবে ${targetStaffName}-এর কাছে ট্রান্সফার করা হয়েছে।`,
    };
  }

  /**
   * Escalate Task to Senior / Super Admin
   */
  async escalateTask(staffId: string, dto: EscalateTaskDto) {
    const settings = await this.settingsService.getOperationsSettings();
    if (settings.escalationEnabled === false) {
      throw new BadRequestException('এসকেলেশন ফিচারটি বর্তমানে নিষ্ক্রিয় রয়েছে।');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('সুপার অ্যাডমিনে এসকেলেট করতে কারণ উল্লেখ করা আবশ্যক।');
    }

    if (dto.taskType === 'DISPUTE') {
      await this.prisma.dispute.update({
        where: { id: dto.taskId },
        data: {
          isEscalated: true,
          escalationLevel: 2,
          escalationReason: dto.reason,
          assignedToId: null, // Released from junior staff tray to Super Admin queue
          lockedUntil: null,
        },
      });
    }

    // Log handoff
    await this.prisma.taskHandoffLog.create({
      data: {
        taskType: dto.taskType,
        taskId: dto.taskId,
        fromStaffId: staffId,
        toStaffId: null,
        reason: `[ESCALATED TO SUPER ADMIN] ${dto.reason}`,
      },
    });

    // Urgent socket notification to Super Admins
    if (this.chatGateway) {
      this.chatGateway.notifyAdminsAndStaff('operations:task_escalated', {
        fromStaffId: staffId,
        taskType: dto.taskType,
        taskId: dto.taskId,
        reason: dto.reason,
        priority: 'HIGH',
      });
    }

    return {
      success: true,
      message: 'জরুরি ভিত্তিতে কাজটিকে সুপার অ্যাডমিন এসকেলেশন কিউতে পাঠানো হয়েছে।',
    };
  }

  /**
   * Auto-assign newly created request to on-duty staff (Hook)
   */
  async autoAssignTaskOnCreate(
    taskType: 'WITHDRAWAL' | 'RECHARGE' | 'DISPUTE',
    taskId: string,
    department?: string,
  ) {
    try {
      const settings = await this.settingsService.getOperationsSettings();
      if (!settings.workloadDistributionEnabled) return null;

      const algorithm = settings.distributionAlgorithm || 'CLAIM_POOL';
      if (algorithm === 'CLAIM_POOL') {
        // Leaves it in open queue for staff to click "Claim Next"
        return null;
      }

      // For LEAST_LOADED or ROUND_ROBIN:
      const activeStaff = await this.getActiveStaffList(department);
      if (activeStaff.length === 0) return null;

      // Filter staff below max tasks
      const eligible = activeStaff.filter((s) => s.activeTasks < s.maxTasks);
      if (eligible.length === 0) return null;

      // Least loaded: sort by activeTasks ascending
      eligible.sort((a, b) => a.activeTasks - b.activeTasks);
      const chosenStaff = eligible[0];

      const lockMinutes = Number(settings.lockDurationMinutes || 10);
      const now = new Date();
      const lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);

      if (taskType === 'WITHDRAWAL') {
        await this.prisma.withdrawalRequest.update({
          where: { id: taskId },
          data: { assignedToId: chosenStaff.userId, assignedAt: now, lockedUntil },
        });
      } else if (taskType === 'RECHARGE') {
        await this.prisma.rechargeRequest.update({
          where: { id: taskId },
          data: { assignedToId: chosenStaff.userId, assignedAt: now, lockedUntil },
        });
      } else if (taskType === 'DISPUTE') {
        await this.prisma.dispute.update({
          where: { id: taskId },
          data: { assignedToId: chosenStaff.userId, assignedAt: now, lockedUntil },
        });
      }

      // Notify chosen staff
      if (this.chatGateway) {
        this.chatGateway.notifyAdminsAndStaff('operations:task_assigned', {
          toStaffId: chosenStaff.userId,
          taskType,
          taskId,
          message: `একটি নতুন ${taskType} কাজ স্বয়ংক্রিয়ভাবে আপনার ট্রলিতে যুক্ত হয়েছে।`,
        });
      }

      return chosenStaff;
    } catch (err) {
      console.error('Auto assign error (soft failure):', err);
      return null;
    }
  }

  /**
   * Super Admin Live Operations Dashboard Data
   */
  async getLiveOperationsDashboard() {
    const settings = await this.settingsService.getOperationsSettings();
    const now = new Date();
    const slaWarningMinutes = Number(settings.slaWarningMinutes || 15);
    const slaBreachMinutes = Number(settings.slaBreachMinutes || 30);

    const slaWarningTime = new Date(now.getTime() - slaWarningMinutes * 60 * 1000);
    const slaBreachTime = new Date(now.getTime() - slaBreachMinutes * 60 * 1000);

    // 1. Pending & Active Counts
    const [
      pendingWithdrawals,
      claimedWithdrawals,
      breachedWithdrawals,
      pendingRecharges,
      claimedRecharges,
      breachedRecharges,
      activeDisputes,
      escalatedDisputes,
      breachedDisputes,
    ] = await Promise.all([
      this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawalRequest.count({
        where: { status: 'PENDING', assignedToId: { not: null }, lockedUntil: { gte: now } },
      }),
      this.prisma.withdrawalRequest.count({
        where: { status: 'PENDING', createdAt: { lte: slaBreachTime } },
      }),

      this.prisma.rechargeRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.rechargeRequest.count({
        where: { status: 'PENDING', assignedToId: { not: null }, lockedUntil: { gte: now } },
      }),
      this.prisma.rechargeRequest.count({
        where: { status: 'PENDING', createdAt: { lte: slaBreachTime } },
      }),

      this.prisma.dispute.count({ where: { status: 'ACTIVE_CALL' } }),
      this.prisma.dispute.count({ where: { status: 'ACTIVE_CALL', isEscalated: true } }),
      this.prisma.dispute.count({
        where: { status: 'ACTIVE_CALL', createdAt: { lte: slaBreachTime } },
      }),
    ]);

    // 2. Staff Profiles & Live Workload
    const staffProfiles = await this.prisma.staffProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uniqueUserId: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const staffMatrix = await Promise.all(
      staffProfiles.map(async (sp) => {
        const [wActive, rActive, dActive, wDoneToday, rDoneToday, dDoneToday] = await Promise.all([
          this.prisma.withdrawalRequest.count({
            where: { assignedToId: sp.userId, status: 'PENDING', lockedUntil: { gte: now } },
          }),
          this.prisma.rechargeRequest.count({
            where: { assignedToId: sp.userId, status: 'PENDING', lockedUntil: { gte: now } },
          }),
          this.prisma.dispute.count({
            where: { assignedToId: sp.userId, status: 'ACTIVE_CALL' },
          }),
          this.prisma.withdrawalRequest.count({
            where: { reviewedById: sp.userId, reviewedAt: { gte: startOfToday } },
          }),
          this.prisma.rechargeRequest.count({
            where: { reviewedById: sp.userId, reviewedAt: { gte: startOfToday } },
          }),
          this.prisma.dispute.count({
            where: { resolvedById: sp.userId, resolvedAt: { gte: startOfToday } },
          }),
        ]);

        return {
          userId: sp.userId,
          name: `${sp.user.firstName} ${sp.user.lastName}`.trim() || sp.user.uniqueUserId,
          uniqueUserId: sp.user.uniqueUserId,
          email: sp.user.email,
          avatarUrl: sp.user.avatarUrl,
          department: sp.department,
          dutyStatus: sp.dutyStatus,
          activeTasks: wActive + rActive + dActive,
          completedToday: wDoneToday + rDoneToday + dDoneToday,
          breakdown: {
            active: { withdrawals: wActive, recharges: rActive, disputes: dActive },
            completedToday: { withdrawals: wDoneToday, recharges: rDoneToday, disputes: dDoneToday },
          },
          lastActiveAt: sp.lastActiveAt,
        };
      }),
    );

    return {
      settings,
      queues: {
        withdrawals: {
          pending: pendingWithdrawals,
          inProgress: claimedWithdrawals,
          unassigned: Math.max(0, pendingWithdrawals - claimedWithdrawals),
          breached: breachedWithdrawals,
        },
        recharges: {
          pending: pendingRecharges,
          inProgress: claimedRecharges,
          unassigned: Math.max(0, pendingRecharges - claimedRecharges),
          breached: breachedRecharges,
        },
        disputes: {
          active: activeDisputes,
          escalated: escalatedDisputes,
          breached: breachedDisputes,
        },
      },
      staff: staffMatrix,
    };
  }

  /**
   * Super Admin Rebalance Queue: Evenly distribute all unassigned tasks across online staff
   */
  async rebalanceQueue(adminId: string) {
    const activeStaff = await this.getActiveStaffList();
    if (activeStaff.length === 0) {
      throw new BadRequestException('পুনর্বণ্টন করার জন্য বর্তমানে কোনো অন-ডিউটি স্টাফ উপস্থিত নেই।');
    }

    const settings = await this.settingsService.getOperationsSettings();
    const lockMinutes = Number(settings.lockDurationMinutes || 10);
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);

    // 1. Fetch unassigned items
    const [unassignedWithdrawals, unassignedRecharges, unassignedDisputes] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where: {
          status: 'PENDING',
          OR: [{ assignedToId: null }, { lockedUntil: { lt: now } }],
        },
        select: { id: true },
      }),
      this.prisma.rechargeRequest.findMany({
        where: {
          status: 'PENDING',
          OR: [{ assignedToId: null }, { lockedUntil: { lt: now } }],
        },
        select: { id: true },
      }),
      this.prisma.dispute.findMany({
        where: {
          status: 'ACTIVE_CALL',
          isEscalated: false,
          OR: [{ assignedToId: null }, { lockedUntil: { lt: now } }],
        },
        select: { id: true },
      }),
    ]);

    let staffIdx = 0;
    let distributedCount = 0;

    // Distribute withdrawals
    for (const w of unassignedWithdrawals) {
      const staff = activeStaff[staffIdx % activeStaff.length];
      await this.prisma.withdrawalRequest.update({
        where: { id: w.id },
        data: { assignedToId: staff.userId, assignedAt: now, lockedUntil },
      });
      staffIdx++;
      distributedCount++;
    }

    // Distribute recharges
    for (const r of unassignedRecharges) {
      const staff = activeStaff[staffIdx % activeStaff.length];
      await this.prisma.rechargeRequest.update({
        where: { id: r.id },
        data: { assignedToId: staff.userId, assignedAt: now, lockedUntil },
      });
      staffIdx++;
      distributedCount++;
    }

    // Distribute disputes
    for (const d of unassignedDisputes) {
      const staff = activeStaff[staffIdx % activeStaff.length];
      await this.prisma.dispute.update({
        where: { id: d.id },
        data: { assignedToId: staff.userId, assignedAt: now, lockedUntil },
      });
      staffIdx++;
      distributedCount++;
    }

    if (this.chatGateway) {
      this.chatGateway.notifyAdminsAndStaff('operations:queue_rebalanced', {
        adminId,
        distributedCount,
        staffCount: activeStaff.length,
      });
    }

    return {
      success: true,
      message: `মোট ${distributedCount} টি অপেক্ষমাণ কাজ ${activeStaff.length} জন সক্রিয় স্টাফের মাঝে সমানভাবে বণ্টন করা হয়েছে।`,
      distributedCount,
    };
  }
}

