import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateMicroJobDto } from './dto/create-micro-job.dto';
import { SubmitMicroJobDto } from './dto/submit-micro-job.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { AffiliateService } from '../affiliate/affiliate.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class MicroJobsService {
  private readonly logger = new Logger(MicroJobsService.name);

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    @Optional() private affiliateService?: AffiliateService,
    @Optional() private telegramService?: TelegramService,
  ) {}

  /**
   * Seed default categories if none exist
   */
  async ensureDefaultCategories() {
    const count = await this.prisma.microJobCategory.count();
    if (count === 0) {
      const defaults = [
        { name: 'ইউটিউব (YouTube)', slug: 'youtube', icon: 'youtube', minReward: 2.0 },
        { name: 'ফেসবুক (Facebook)', slug: 'facebook', icon: 'facebook', minReward: 1.5 },
        { name: 'টেলিগ্রাম (Telegram)', slug: 'telegram', icon: 'send', minReward: 1.0 },
        { name: 'অ্যাপ ইনস্টল ও রিভিউ (App Install)', slug: 'app-install', icon: 'download', minReward: 5.0 },
        { name: 'ওয়েবসাইট সাইন আপ (Website Signup)', slug: 'website-signup', icon: 'globe', minReward: 3.0 },
        { name: 'সার্ভে ও ভোটিং (Survey & Vote)', slug: 'survey-vote', icon: 'check-square', minReward: 2.5 },
        { name: 'অন্যান্য কাজ (Other Tasks)', slug: 'other', icon: 'briefcase', minReward: 1.0 },
      ];

      for (let i = 0; i < defaults.length; i++) {
        const item = defaults[i];
        await this.prisma.microJobCategory.create({
          data: {
            name: item.name,
            slug: item.slug,
            icon: item.icon,
            minReward: item.minReward,
            sortOrder: i,
            isActive: true,
          },
        });
      }
    }
  }

  /**
   * Get all active categories
   */
  async getCategories() {
    await this.ensureDefaultCategories();
    return this.prisma.microJobCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Create a new micro job and lock total budget in escrow
   */
  async createJob(employerId: string, dto: CreateMicroJobDto) {
    const settings = await this.settingsService.getMicroJobSettings();
    if (settings.enabled === false) {
      throw new ForbiddenException('মাইক্রো জব সার্ভিসটি বর্তমানে বন্ধ আছে');
    }

    // Verify KYC requirement if enforced
    if (settings.requireKycToPost) {
      const employer = await this.prisma.user.findUnique({
        where: { id: employerId },
        select: { isVerified: true, verificationStatus: true },
      });
      if (!employer?.isVerified && employer?.verificationStatus !== 'VERIFIED') {
        throw new BadRequestException('মাইক্রো জব পোস্ট করতে আপনার এনআইডি/কেওয়াইসি ভেরিফিকেশন সম্পন্ন থাকতে হবে');
      }
    }

    const minReward = Number(settings.minJobReward || 1);
    if (dto.rewardPerWorker < minReward) {
      throw new BadRequestException(`প্রতি কর্মীর পারিশ্রমিক নূন্যতম ৳${minReward} হতে হবে`);
    }

    if (dto.totalWorkersNeeded < 1) {
      throw new BadRequestException('নূন্যতম ১ জন কর্মী প্রয়োজন');
    }

    const category = await this.prisma.microJobCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category || !category.isActive) {
      throw new BadRequestException('অনুগ্রহ করে একটি সঠিক ক্যাটাগরি নির্বাচন করুন');
    }

    const workerBudget = Number(dto.rewardPerWorker) * Number(dto.totalWorkersNeeded);
    const platformFeePercent = Number(settings.platformFeePercent ?? 5);
    const platformFee = (workerBudget * platformFeePercent) / 100;

    // Featured / Pin Job Fee configured by admin
    const isPinned = Boolean(dto.isPinned);
    const featuredJobFee = isPinned ? Number(settings.featuredJobFee ?? 20) : 0;
    const totalCost = workerBudget + platformFee + featuredJobFee;

    const autoApproveHours = dto.autoApproveHours || Number(settings.autoApproveHours || 48);

    // Atomically verify balance and lock funds
    const createdJob = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: employerId },
      });

      if (!wallet) {
        throw new BadRequestException('আপনার ওয়ালেট পাওয়া যায়নি');
      }

      const availableBalance = Number(wallet.availableBalance);
      if (availableBalance < totalCost) {
        throw new BadRequestException(
          `আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। মোট খরচ: ৳${totalCost.toFixed(2)}${featuredJobFee > 0 ? ` (জব পিন ফি সহ)` : ''} | বর্তমান ব্যালেন্স: ৳${availableBalance.toFixed(2)}`,
        );
      }

      const balanceBefore = availableBalance;
      const balanceAfter = balanceBefore - totalCost;

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: balanceAfter,
          version: { increment: 1 },
        },
      });

      // Create ledger entry
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId: employerId,
          type: 'MICROJOB_ESCROW',
          amount: totalCost,
          commission: platformFee + featuredJobFee,
          balanceBefore,
          balanceAfter,
          holdBefore: Number(wallet.holdBalance),
          holdAfter: Number(wallet.holdBalance),
          notes: `Micro Job Escrow: ${dto.title} (${dto.totalWorkersNeeded} workers x ৳${dto.rewardPerWorker} + ৳${platformFee.toFixed(2)} fee${featuredJobFee > 0 ? ` + ৳${featuredJobFee} pin fee` : ''})`,
          status: 'COMPLETED',
        },
      });

      // Create MicroJob (starts in PENDING status until Admin approves)
      const job = await tx.microJob.create({
        data: {
          employerId,
          categoryId: dto.categoryId,
          title: dto.title.trim(),
          description: dto.description.trim(),
          thumbnailUrl:
            settings.coverPictureEnabled !== false ? dto.thumbnailUrl?.trim() || null : null,
          taskUrl: settings.taskLinkEnabled !== false ? dto.taskUrl?.trim() || null : null,
          steps: dto.steps || [],
          proofRequirements: dto.proofRequirements || [],
          rewardPerWorker: dto.rewardPerWorker,
          totalWorkersNeeded: dto.totalWorkersNeeded,
          totalBudget: workerBudget,
          platformFee,
          status: 'PENDING',
          isPinned,
          pinnedUntil: isPinned ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
          minKycRequired: Boolean(dto.minKycRequired),
          autoApproveHours,
        },
        include: {
          category: true,
        },
      });

      return job;
    });

    // Process Affiliate Referral Reward for employer referral (from company platform fee profit)
    const affiliate = this.affiliateService;
    if (affiliate && platformFee > 0) {
      affiliate
        .processReferralReward({
          userId: employerId,
          sourceType: 'MICRO_JOB',
          sourceId: createdJob.id,
          adminFee: platformFee,
          notes: 'মাইক্রো জব পোস্ট ফি',
        })
        .catch((err) => this.logger.error('Failed to process micro job employer referral reward:', err));
    }

    // Send Admin Telegram Alert if enabled
    this.settingsService
      .sendAdminTelegramAlert(
        'নতুন মাইক্রো জব পোস্ট (Pending Review)',
        `📋 <b>জব:</b> ${createdJob.title}\n👥 <b>কর্মী সংখ্যা:</b> ${createdJob.totalWorkersNeeded} জন\n💰 <b>মোট বাজেট:</b> ৳${totalCost.toFixed(2)}`,
        'notifyMicroJob',
      )
      .catch(() => {});

    return createdJob;
  }

  /**
   * Public feed of micro jobs with filters & pagination
   */
  async getPublicJobs(query: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'newest' | 'reward_high' | 'reward_low';
  }) {
    this.processAutoApprovalsIfEnabled().catch(() => {});

    const settings = await this.settingsService.getMicroJobSettings();
    const coverEnabled = settings.coverPictureEnabled !== false;
    const taskLinkEnabled = settings.taskLinkEnabled !== false;
    const approvalRateEnabled = settings.employerApprovalRateEnabled !== false;

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim() } },
        { description: { contains: query.search.trim() } },
      ];
    }

    let orderBy: any = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    if (query.sort === 'reward_high') orderBy = [{ isPinned: 'desc' }, { rewardPerWorker: 'desc' }];
    if (query.sort === 'reward_low') orderBy = [{ isPinned: 'desc' }, { rewardPerWorker: 'asc' }];

    const [rawItems, total] = await Promise.all([
      this.prisma.microJob.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          employer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              uniqueUserId: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      }),
      this.prisma.microJob.count({ where }),
    ]);

    // Calculate Employer Approval Rate (%) if enabled by Admin
    const approvalRateMap = new Map<string, number>();
    if (approvalRateEnabled && rawItems.length > 0) {
      const employerIds = Array.from(new Set(rawItems.map((j) => j.employerId)));
      const [approvedSums, rejectedSubs] = await Promise.all([
        this.prisma.microJob.groupBy({
          by: ['employerId'],
          where: { employerId: { in: employerIds } },
          _sum: { approvedCount: true },
        }),
        this.prisma.microJobSubmission.findMany({
          where: {
            status: 'REJECTED',
            job: { employerId: { in: employerIds } },
          },
          select: {
            job: { select: { employerId: true } },
          },
        }),
      ]);

      const approvedByEmp = new Map<string, number>();
      approvedSums.forEach((row) => {
        approvedByEmp.set(row.employerId, Number(row._sum.approvedCount || 0));
      });

      const rejectedByEmp = new Map<string, number>();
      rejectedSubs.forEach((sub) => {
        const empId = sub.job.employerId;
        rejectedByEmp.set(empId, (rejectedByEmp.get(empId) || 0) + 1);
      });

      employerIds.forEach((empId) => {
        const appCount = approvedByEmp.get(empId) || 0;
        const rejCount = rejectedByEmp.get(empId) || 0;
        const totalReviewed = appCount + rejCount;
        const rate = totalReviewed > 0 ? Math.round((appCount / totalReviewed) * 100) : 100;
        approvalRateMap.set(empId, rate);
      });
    }

    const items = rawItems.map((job) => ({
      ...job,
      thumbnailUrl: coverEnabled ? job.thumbnailUrl : null,
      taskUrl: taskLinkEnabled ? job.taskUrl : null,
      employerApprovalRate: approvalRateEnabled
        ? (approvalRateMap.get(job.employerId) ?? 100)
        : null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Single job details by ID
   */
  async getJobById(jobId: string, currentUserId?: string) {
    const [job, settings] = await Promise.all([
      this.prisma.microJob.findUnique({
        where: { id: jobId },
        include: {
          category: true,
          employer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              uniqueUserId: true,
              avatarUrl: true,
              isVerified: true,
              createdAt: true,
            },
          },
        },
      }),
      this.settingsService.getMicroJobSettings(),
    ]);

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    let mySubmission: any = null;
    if (currentUserId) {
      mySubmission = await this.prisma.microJobSubmission.findUnique({
        where: {
          jobId_workerId: {
            jobId,
            workerId: currentUserId,
          },
        },
      });
    }

    const isMyJob = currentUserId === job.employerId;
    const coverEnabled = settings.coverPictureEnabled !== false;
    const taskLinkEnabled = settings.taskLinkEnabled !== false;
    const approvalRateEnabled = settings.employerApprovalRateEnabled !== false;

    let employerApprovalRate: number | null = null;
    if (approvalRateEnabled) {
      const [approvedAgg, rejectedCount] = await Promise.all([
        this.prisma.microJob.aggregate({
          where: { employerId: job.employerId },
          _sum: { approvedCount: true },
        }),
        this.prisma.microJobSubmission.count({
          where: { status: 'REJECTED', job: { employerId: job.employerId } },
        }),
      ]);
      const appCount = Number(approvedAgg._sum.approvedCount || 0);
      const totalReviewed = appCount + rejectedCount;
      employerApprovalRate = totalReviewed > 0 ? Math.round((appCount / totalReviewed) * 100) : 100;
    }

    return {
      ...job,
      thumbnailUrl: isMyJob || coverEnabled ? job.thumbnailUrl : null,
      taskUrl: isMyJob || taskLinkEnabled ? job.taskUrl : null,
      employerApprovalRate,
      mySubmission,
      isMyJob,
    };
  }

  /**
   * Worker submits proof of task completion
   */
  async submitProof(jobId: string, workerId: string, dto: SubmitMicroJobDto) {
    const settings = await this.settingsService.getMicroJobSettings();
    if (settings.enabled === false) {
      throw new ForbiddenException('মাইক্রো জব সার্ভিসটি বর্তমানে বন্ধ আছে');
    }

    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (job.status !== 'ACTIVE') {
      throw new BadRequestException('এই কাজটি বর্তমানে সক্রিয় নেই বা সম্পন্ন হয়ে গেছে');
    }

    if (job.employerId === workerId) {
      throw new BadRequestException('আপনি নিজের পোস্ট করা কাজে নিজে অংশগ্রহণ করতে পারবেন না');
    }

    // Check if slots are filled
    if (job.approvedCount >= job.totalWorkersNeeded) {
      throw new BadRequestException('এই কাজের সমস্ত কর্মী কোটা পূরণ হয়ে গেছে');
    }

    // Check KYC requirement
    if (job.minKycRequired || settings.requireKycToWork) {
      const worker = await this.prisma.user.findUnique({
        where: { id: workerId },
        select: { isVerified: true, verificationStatus: true },
      });
      if (!worker?.isVerified && worker?.verificationStatus !== 'VERIFIED') {
        throw new BadRequestException('এই কাজটি করতে আপনার এনআইডি/কেওয়াইসি ভেরিফিকেশন সম্পন্ন থাকতে হবে');
      }
    }

    // Check duplicate
    const existing = await this.prisma.microJobSubmission.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'REJECTED') {
        return this.resubmitSubmission(existing.id, workerId, dto);
      }
      throw new BadRequestException('আপনি ইতোমধ্যে এই কাজের প্রমাণ জমা দিয়েছেন');
    }

    const autoApproveHours = job.autoApproveHours || 48;
    const autoApproveAt = new Date(Date.now() + autoApproveHours * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const submission = await tx.microJobSubmission.create({
        data: {
          jobId,
          workerId,
          proofText: dto.proofText?.trim() || null,
          proofScreenshots: dto.proofScreenshots || [],
          status: 'SUBMITTED',
          autoApproveAt,
        },
      });

      await tx.microJob.update({
        where: { id: jobId },
        data: {
          pendingCount: { increment: 1 },
        },
      });

      return submission;
    });

    // Send Telegram alert to employer
    if (this.telegramService && job.employerId) {
      this.prisma.user
        .findUnique({
          where: { id: workerId },
          select: { firstName: true, lastName: true, uniqueUserId: true },
        })
        .then((worker) => {
          const workerName = worker?.firstName
            ? `${worker.firstName} ${worker.lastName || ''}`.trim()
            : worker?.uniqueUserId || 'Worker';
          return this.telegramService?.notifyMicroJobSubmitted(
            job.employerId,
            job.title,
            workerName,
            job.id,
          );
        })
        .catch((err) => this.logger.error('Failed to notify employer via Telegram:', err));
    }

    return result;
  }

  /**
   * Get all jobs posted by the employer
   */
  async getEmployerJobs(employerId: string) {
    this.processAutoApprovalsIfEnabled().catch(() => {});
    return this.prisma.microJob.findMany({
      where: { employerId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  /**
   * Get all submissions for a specific job (employer only)
   */
  async getJobSubmissions(jobId: string, employerId: string) {
    this.processAutoApprovalsIfEnabled().catch(() => {});
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (job.employerId !== employerId) {
      throw new ForbiddenException('আপনি শুধুমাত্র আপনার নিজের কাজের প্রুফ দেখতে পারবেন');
    }

    return this.prisma.microJobSubmission.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uniqueUserId: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
  }

  /**
   * Employer reviews submission (Approve or Reject)
   */
  async reviewSubmission(submissionId: string, employerId: string, dto: ReviewSubmissionDto) {
    const submission = await this.prisma.microJobSubmission.findUnique({
      where: { id: submissionId },
      include: {
        job: true,
        worker: {
          select: { id: true, firstName: true, uniqueUserId: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('সাবমিশনটি খুঁজে পাওয়া যায়নি');
    }

    if (submission.job.employerId !== employerId) {
      throw new ForbiddenException('এই কাজটি রিভিউ করার অনুমতি আপনার নেই');
    }

    if (submission.status !== 'SUBMITTED') {
      throw new BadRequestException('এই সাবমিশনটি ইতোমধ্যে রিভিউ করা হয়ে গেছে');
    }

    const reward = Number(submission.job.rewardPerWorker);

    if (dto.action === 'APPROVE') {
      const approvedResult = await this.prisma.$transaction(async (tx) => {
        // 1. Update submission
        const updated = await tx.microJobSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
          },
        });

        // 2. Credit worker's wallet
        const workerWallet = await tx.wallet.findUnique({
          where: { userId: submission.workerId },
        });

        if (workerWallet) {
          const balanceBefore = Number(workerWallet.availableBalance);
          const balanceAfter = balanceBefore + reward;

          await tx.wallet.update({
            where: { id: workerWallet.id },
            data: {
              availableBalance: balanceAfter,
              version: { increment: 1 },
            },
          });

          await tx.walletLedger.create({
            data: {
              walletId: workerWallet.id,
              userId: submission.workerId,
              type: 'MICROJOB_EARNING',
              amount: reward,
              balanceBefore,
              balanceAfter,
              holdBefore: Number(workerWallet.holdBalance),
              holdAfter: Number(workerWallet.holdBalance),
              referenceId: submission.id,
              referenceType: 'MICRO_JOB',
              notes: `Micro Job Earning: ${submission.job.title}`,
              status: 'COMPLETED',
            },
          });
        }

        // 3. Update job counts
        const newApprovedCount = submission.job.approvedCount + 1;
        const newPendingCount = Math.max(0, submission.job.pendingCount - 1);
        const isCompleted = newApprovedCount >= submission.job.totalWorkersNeeded;

        await tx.microJob.update({
          where: { id: submission.jobId },
          data: {
            approvedCount: newApprovedCount,
            pendingCount: newPendingCount,
            status: isCompleted ? 'COMPLETED' : submission.job.status,
          },
        });

        return updated;
      });

      // Process Affiliate Referral Reward for worker referral (from task platform fee)
      const affiliate = this.affiliateService;
      if (affiliate && submission) {
        const settings = await this.settingsService.getMicroJobSettings();
        const platformFeePercent = Number(settings.platformFeePercent ?? 5);
        const taskAdminFee = (reward * platformFeePercent) / 100;
        if (taskAdminFee > 0) {
          affiliate
            .processReferralReward({
              userId: submission.workerId,
              sourceType: 'MICRO_JOB',
              sourceId: submission.id,
              adminFee: taskAdminFee,
              notes: 'মাইক্রো জব কাজ সম্পন্ন',
            })
            .catch((err) => this.logger.error('Failed to process worker affiliate reward:', err));
        }
      }

      if (this.telegramService && submission.workerId) {
        this.telegramService
          .notifyMicroJobApproved(submission.workerId, submission.job.title, reward)
          .catch((err) => this.logger.error('Failed to notify worker via Telegram:', err));
      }

      return approvedResult;
    } else {
      // REJECT
      const rejectReason = dto.rejectReason?.trim() || 'কাজের শর্ত অনুযায়ী প্রমাণ সঠিক হয়নি';
      const rejectedResult = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.microJobSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'REJECTED',
            rejectReason,
            reviewedAt: new Date(),
          },
        });

        await tx.microJob.update({
          where: { id: submission.jobId },
          data: {
            pendingCount: { decrement: 1 },
          },
        });

        return updated;
      });

      if (this.telegramService && submission.workerId) {
        this.telegramService
          .notifyMicroJobRejected(submission.workerId, submission.job.title, rejectReason)
          .catch((err) => this.logger.error('Failed to notify worker via Telegram:', err));
      }

      return rejectedResult;
    }
  }

  /**
   * Cancel micro job and instantly refund unused budget to employer
   */
  async cancelJob(jobId: string, employerId: string) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (job.employerId !== employerId) {
      throw new ForbiddenException('এই কাজটি বাতিল করার অনুমতি আপনার নেই');
    }

    if (job.status === 'CANCELLED' || job.status === 'COMPLETED') {
      throw new BadRequestException('এই কাজটি ইতোমধ্যে সম্পন্ন বা বাতিল করা হয়েছে');
    }

    // Remaining slots that have not been approved and are not currently pending
    const remainingSlots = Math.max(0, job.totalWorkersNeeded - job.approvedCount - job.pendingCount);

    return this.prisma.$transaction(async (tx) => {
      let refundAmount = 0;
      if (remainingSlots > 0) {
        const unitReward = Number(job.rewardPerWorker);
        const workerBudgetRefund = remainingSlots * unitReward;

        // Platform fee portion refund
        const totalBudget = Number(job.totalBudget);
        const feeRatio = totalBudget > 0 ? Number(job.platformFee) / totalBudget : 0;
        const feeRefund = workerBudgetRefund * feeRatio;
        refundAmount = workerBudgetRefund + feeRefund;

        const wallet = await tx.wallet.findUnique({
          where: { userId: employerId },
        });

        if (wallet && refundAmount > 0) {
          const balanceBefore = Number(wallet.availableBalance);
          const balanceAfter = balanceBefore + refundAmount;

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
              userId: employerId,
              type: 'MICROJOB_REFUND',
              amount: refundAmount,
              balanceBefore,
              balanceAfter,
              holdBefore: Number(wallet.holdBalance),
              holdAfter: Number(wallet.holdBalance),
              referenceId: job.id,
              referenceType: 'MICRO_JOB',
              notes: `Refund for cancelled micro job (${remainingSlots} unfulfilled slots): ${job.title}`,
              status: 'COMPLETED',
            },
          });
        }
      }

      const updated = await tx.microJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
        },
      });

      return {
        job: updated,
        refundAmount,
        remainingSlots,
      };
    });
  }

  /**
   * Employer or Admin pauses / resumes a job (toggles between ACTIVE and PAUSED)
   */
  async toggleJobStatus(jobId: string, userId: string, isAdmin = false) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (!isAdmin && job.employerId !== userId) {
      throw new ForbiddenException('এই কাজটি পরিবর্তন করার অনুমতি আপনার নেই');
    }

    if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      throw new BadRequestException('সম্পন্ন বা বাতিল কাজ পুনরায় পরিবর্তন করা যাবে না');
    }

    const nextStatus = job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    const updated = await this.prisma.microJob.update({
      where: { id: jobId },
      data: { status: nextStatus },
      include: { category: true },
    });

    return updated;
  }

  /**
   * Employer permanently deletes a job (refunds remaining slots if active/paused)
   */
  async deleteJob(jobId: string, employerId: string) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (job.employerId !== employerId) {
      throw new ForbiddenException('এই কাজটি মুছে ফেলার অনুমতি আপনার নেই');
    }

    const remainingSlots = Math.max(0, job.totalWorkersNeeded - job.approvedCount - job.pendingCount);

    return this.prisma.$transaction(async (tx) => {
      let refundAmount = 0;
      if ((job.status === 'ACTIVE' || job.status === 'PAUSED' || job.status === 'PENDING' || job.status === 'REJECTED') && remainingSlots > 0) {
        const unitReward = Number(job.rewardPerWorker);
        const workerBudgetRefund = remainingSlots * unitReward;
        const totalBudget = Number(job.totalBudget);
        const feeRatio = totalBudget > 0 ? Number(job.platformFee) / totalBudget : 0;
        const feeRefund = workerBudgetRefund * feeRatio;
        refundAmount = workerBudgetRefund + feeRefund;

        const wallet = await tx.wallet.findUnique({
          where: { userId: employerId },
        });

        if (wallet && refundAmount > 0) {
          const balanceBefore = Number(wallet.availableBalance);
          const balanceAfter = balanceBefore + refundAmount;

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
              userId: employerId,
              type: 'MICROJOB_REFUND',
              amount: refundAmount,
              balanceBefore,
              balanceAfter,
              holdBefore: Number(wallet.holdBalance),
              holdAfter: Number(wallet.holdBalance),
              referenceId: job.id,
              referenceType: 'MICRO_JOB',
              notes: `Refund for deleted micro job (${remainingSlots} unfulfilled slots): ${job.title}`,
              status: 'COMPLETED',
            },
          });
        }
      }

      await tx.microJob.delete({
        where: { id: jobId },
      });

      return {
        success: true,
        deletedJobId: jobId,
        refundAmount,
      };
    });
  }

  /**
   * Admin permanently deletes any job (refunds remaining slots if active/paused/pending/rejected)
   */
  async adminDeleteJob(jobId: string, adminId: string) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    const remainingSlots = Math.max(0, job.totalWorkersNeeded - job.approvedCount - job.pendingCount);

    return this.prisma.$transaction(async (tx) => {
      let refundAmount = 0;
      if ((job.status === 'ACTIVE' || job.status === 'PAUSED' || job.status === 'PENDING' || job.status === 'REJECTED') && remainingSlots > 0) {
        const unitReward = Number(job.rewardPerWorker);
        const workerBudgetRefund = remainingSlots * unitReward;
        const totalBudget = Number(job.totalBudget);
        const feeRatio = totalBudget > 0 ? Number(job.platformFee) / totalBudget : 0;
        const feeRefund = workerBudgetRefund * feeRatio;
        refundAmount = workerBudgetRefund + feeRefund;

        const wallet = await tx.wallet.findUnique({
          where: { userId: job.employerId },
        });

        if (wallet && refundAmount > 0) {
          const balanceBefore = Number(wallet.availableBalance);
          const balanceAfter = balanceBefore + refundAmount;

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
              userId: job.employerId,
              type: 'MICROJOB_REFUND',
              amount: refundAmount,
              balanceBefore,
              balanceAfter,
              holdBefore: Number(wallet.holdBalance),
              holdAfter: Number(wallet.holdBalance),
              referenceId: job.id,
              referenceType: 'MICRO_JOB',
              notes: `Refund for micro job deleted by admin (${adminId}): ${job.title}`,
              status: 'COMPLETED',
            },
          });
        }
      }

      await tx.microJob.delete({
        where: { id: jobId },
      });

      return {
        success: true,
        deletedJobId: jobId,
        refundAmount,
      };
    });
  }

  /**
   * Admin updates job status (PENDING, ACTIVE, PAUSED, CANCELLED, COMPLETED, REJECTED)
   */
  async adminUpdateJobStatus(jobId: string, status: any, adminId: string, rejectReason?: string) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (status === 'CANCELLED') {
      return this.adminCancelJob(jobId, adminId);
    }

    const data: any = { status };
    if (status === 'ACTIVE') {
      data.rejectReason = null;
    } else if (status === 'REJECTED') {
      data.rejectReason =
        rejectReason?.trim() ||
        'অ্যাডমিন কর্তৃক জব পোস্টটি রিজেক্ট করা হয়েছে। অনুগ্রহ করে নির্দেশনা অনুযায়ী সংশোধন করে পুনরায় সাবমিট করুন।';
    }

    return this.prisma.microJob.update({
      where: { id: jobId },
      data,
      include: {
        category: true,
        employer: {
          select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
        },
      },
    });
  }

  /**
   * Admin reviews a micro job post (APPROVE -> ACTIVE, REJECT -> REJECTED with rejectReason)
   */
  async adminReviewJob(
    jobId: string,
    adminId: string,
    dto: { action: 'APPROVE' | 'REJECT'; rejectReason?: string },
  ) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (dto.action === 'APPROVE') {
      return this.prisma.microJob.update({
        where: { id: jobId },
        data: {
          status: 'ACTIVE',
          rejectReason: null,
        },
        include: {
          category: true,
          employer: {
            select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
          },
        },
      });
    } else {
      const reason =
        dto.rejectReason?.trim() ||
        'অ্যাডমিন কর্তৃক জব পোস্টটি রিজেক্ট করা হয়েছে। অনুগ্রহ করে নির্দেশনা অনুযায়ী সংশোধন করে পুনরায় সাবমিট করুন।';
      return this.prisma.microJob.update({
        where: { id: jobId },
        data: {
          status: 'REJECTED',
          rejectReason: reason,
        },
        include: {
          category: true,
          employer: {
            select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
          },
        },
      });
    }
  }

  /**
   * Employer edits & re-submits a REJECTED or PENDING micro job for Admin approval
   */
  async resubmitJob(
    jobId: string,
    employerId: string,
    dto: {
      title?: string;
      description?: string;
      categoryId?: string;
      thumbnailUrl?: string | null;
      taskUrl?: string | null;
      steps?: string[];
      proofRequirements?: string[];
    },
  ) {
    const [job, settings] = await Promise.all([
      this.prisma.microJob.findUnique({
        where: { id: jobId },
      }),
      this.settingsService.getMicroJobSettings(),
    ]);

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (job.employerId !== employerId) {
      throw new ForbiddenException('এই কাজটি এডিট করার অনুমতি আপনার নেই');
    }

    if (job.status !== 'REJECTED' && job.status !== 'PENDING') {
      throw new BadRequestException('শুধুমাত্র পেন্ডিং বা রিজেক্ট হওয়া কাজ এডিট ও পুনরায় সাবমিট করা যাবে');
    }

    const updateData: any = {
      status: 'PENDING',
      rejectReason: null,
    };

    if (dto.title?.trim()) updateData.title = dto.title.trim();
    if (dto.description?.trim()) updateData.description = dto.description.trim();
    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.thumbnailUrl !== undefined && settings.coverPictureEnabled !== false) {
      updateData.thumbnailUrl = dto.thumbnailUrl?.trim() || null;
    }
    if (dto.taskUrl !== undefined && settings.taskLinkEnabled !== false) {
      updateData.taskUrl = dto.taskUrl?.trim() || null;
    }
    if (Array.isArray(dto.steps)) updateData.steps = dto.steps.filter((s) => s && s.trim());
    if (Array.isArray(dto.proofRequirements)) {
      updateData.proofRequirements = dto.proofRequirements.filter((p) => p && p.trim());
    }

    return this.prisma.microJob.update({
      where: { id: jobId },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  /**
   * Employer adds more worker slots (Top-Up) to an existing job
   */
  async topUpWorkers(jobId: string, employerId: string, additionalWorkers: number) {
    const settings = await this.settingsService.getMicroJobSettings();
    if (settings.enabled === false) {
      throw new ForbiddenException('মাইক্রো জব সার্ভিসটি বর্তমানে বন্ধ আছে');
    }
    if (settings.workerTopUpEnabled === false) {
      throw new ForbiddenException('কর্মী সংখ্যা বাড়ানোর (Top-Up) ফিচারটি বর্তমানে বন্ধ আছে');
    }

    const addCount = Math.floor(Number(additionalWorkers || 0));
    if (!Number.isFinite(addCount) || addCount < 1 || addCount > 10000) {
      throw new BadRequestException('নূন্যতম ১ জন থেকে সর্বোচ্চ ১০,০০০ জন কর্মী যোগ করা যাবে');
    }

    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (job.employerId !== employerId) {
      throw new ForbiddenException('এই কাজের কর্মী সংখ্যা বাড়ানোর অনুমতি আপনার নেই');
    }

    if (job.status !== 'ACTIVE' && job.status !== 'COMPLETED' && job.status !== 'PAUSED') {
      throw new BadRequestException(
        'শুধুমাত্র চলমান (Active), পজ (Paused) অথবা সম্পন্ন (Completed) কাজে কর্মী সংখ্যা বাড়ানো যাবে',
      );
    }

    const rewardPerWorker = Number(job.rewardPerWorker);
    const extraBudget = rewardPerWorker * addCount;
    const platformFeePercent = Number(settings.platformFeePercent ?? 5);
    const extraFee = (extraBudget * platformFeePercent) / 100;
    const totalExtraCost = extraBudget + extraFee;

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: employerId },
      });

      if (!wallet) {
        throw new BadRequestException('আপনার ওয়ালেট পাওয়া যায়নি');
      }

      const availableBalance = Number(wallet.availableBalance);
      if (availableBalance < totalExtraCost) {
        throw new BadRequestException(
          `আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। অতিরিক্ত ${addCount} জন কর্মীর জন্য মোট প্রয়োজন: ৳${totalExtraCost.toFixed(2)} | বর্তমান ব্যালেন্স: ৳${availableBalance.toFixed(2)}`,
        );
      }

      const balanceBefore = availableBalance;
      const balanceAfter = balanceBefore - totalExtraCost;

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
          userId: employerId,
          type: 'MICROJOB_ESCROW',
          amount: totalExtraCost,
          commission: extraFee,
          balanceBefore,
          balanceAfter,
          holdBefore: Number(wallet.holdBalance),
          holdAfter: Number(wallet.holdBalance),
          notes: `Micro Job Top-Up: ${job.title} (+${addCount} workers x ৳${rewardPerWorker} + ৳${extraFee.toFixed(2)} fee)`,
          status: 'COMPLETED',
        },
      });

      return tx.microJob.update({
        where: { id: jobId },
        data: {
          totalWorkersNeeded: { increment: addCount },
          totalBudget: { increment: extraBudget },
          platformFee: { increment: extraFee },
          status: job.status === 'COMPLETED' ? 'ACTIVE' : job.status,
        },
        include: {
          category: true,
        },
      });
    });

    return updatedJob;
  }

  /**
   * Worker edits & re-submits a REJECTED (or SUBMITTED) task submission
   */
  async resubmitSubmission(submissionId: string, workerId: string, dto: SubmitMicroJobDto) {
    const submission = await this.prisma.microJobSubmission.findUnique({
      where: { id: submissionId },
      include: {
        job: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('সাবমিশনটি খুঁজে পাওয়া যায়নি');
    }

    if (submission.workerId !== workerId) {
      throw new ForbiddenException('এই সাবমিশনটি এডিট করার অনুমতি আপনার নেই');
    }

    if (submission.status !== 'REJECTED' && submission.status !== 'SUBMITTED') {
      throw new BadRequestException('শুধুমাত্র রিজেক্ট বা পেন্ডিং সাবমিশন পুনরায় সাবমিট করা যাবে');
    }

    if (submission.job.status !== 'ACTIVE') {
      throw new BadRequestException('এই কাজটি বর্তমানে সক্রিয় নেই বা সম্পন্ন হয়ে গেছে');
    }

    if (submission.job.approvedCount >= submission.job.totalWorkersNeeded) {
      throw new BadRequestException('এই কাজের সমস্ত কর্মী কোটা পূরণ হয়ে গেছে');
    }

    const wasRejected = submission.status === 'REJECTED';
    const autoApproveHours = submission.job.autoApproveHours || 48;
    const autoApproveAt = new Date(Date.now() + autoApproveHours * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.microJobSubmission.update({
        where: { id: submissionId },
        data: {
          proofText: dto.proofText?.trim() || null,
          proofScreenshots: dto.proofScreenshots || [],
          status: 'SUBMITTED',
          rejectReason: null,
          reviewedAt: null,
          autoApproveAt,
        },
      });

      if (wasRejected) {
        await tx.microJob.update({
          where: { id: submission.jobId },
          data: {
            pendingCount: { increment: 1 },
          },
        });
      }

      return updated;
    });
  }

  /**
   * Worker's task history and earnings
   */
  async getWorkerTasks(workerId: string) {
    this.processAutoApprovalsIfEnabled().catch(() => {});
    const submissions = await this.prisma.microJobSubmission.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            steps: true,
            proofRequirements: true,
            status: true,
            rewardPerWorker: true,
            category: {
              select: { name: true, icon: true },
            },
            employer: {
              select: { firstName: true, lastName: true, uniqueUserId: true },
            },
          },
        },
      },
    });

    let totalEarned = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;

    submissions.forEach((s) => {
      if (s.status === 'APPROVED') {
        totalEarned += Number(s.job.rewardPerWorker);
        approvedCount++;
      } else if (s.status === 'SUBMITTED') {
        pendingCount++;
      } else if (s.status === 'REJECTED') {
        rejectedCount++;
      }
    });

    return {
      submissions,
      stats: {
        totalEarned,
        totalTasks: submissions.length,
        approvedCount,
        pendingCount,
        rejectedCount,
      },
    };
  }

  /**
   * Admin: get all submissions for a job
   */
  async adminGetJobSubmissions(jobId: string) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
      include: {
        category: true,
        employer: {
          select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    const submissions = await this.prisma.microJobSubmission.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            uniqueUserId: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    return { job, submissions };
  }

  /**
   * Admin: get submissions queue with filters
   */
  async adminGetAllSubmissions(query: {
    status?: string;
    jobId?: string;
    page?: number;
    limit?: number;
  }) {
    this.processAutoApprovalsIfEnabled().catch(() => {});
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.jobId) where.jobId = query.jobId;

    const [items, total] = await Promise.all([
      this.prisma.microJobSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              rewardPerWorker: true,
              category: { select: { name: true, icon: true } },
              employer: {
                select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
              },
            },
          },
          worker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              uniqueUserId: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      }),
      this.prisma.microJobSubmission.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin reviews submission (Approve or Reject on behalf of employer or as platform admin)
   */
  async adminReviewSubmission(submissionId: string, adminId: string, dto: ReviewSubmissionDto) {
    const submission = await this.prisma.microJobSubmission.findUnique({
      where: { id: submissionId },
      include: {
        job: true,
        worker: {
          select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('সাবমিশনটি খুঁজে পাওয়া যায়নি');
    }

    if (submission.status !== 'SUBMITTED') {
      throw new BadRequestException('এই সাবমিশনটি ইতোমধ্যে রিভিউ করা হয়ে গেছে');
    }

    const reward = Number(submission.job.rewardPerWorker);

    if (dto.action === 'APPROVE') {
      const approvedResult = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.microJobSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            adminNotes: `Approved by Admin (${adminId})`,
          },
        });

        const workerWallet = await tx.wallet.findUnique({
          where: { userId: submission.workerId },
        });

        if (workerWallet) {
          const balanceBefore = Number(workerWallet.availableBalance);
          const balanceAfter = balanceBefore + reward;

          await tx.wallet.update({
            where: { id: workerWallet.id },
            data: {
              availableBalance: balanceAfter,
              version: { increment: 1 },
            },
          });

          await tx.walletLedger.create({
            data: {
              walletId: workerWallet.id,
              userId: submission.workerId,
              type: 'MICROJOB_EARNING',
              amount: reward,
              balanceBefore,
              balanceAfter,
              holdBefore: Number(workerWallet.holdBalance),
              holdAfter: Number(workerWallet.holdBalance),
              referenceId: submission.id,
              referenceType: 'MICRO_JOB',
              notes: `Admin Approved Micro Job: ${submission.job.title}`,
              status: 'COMPLETED',
            },
          });
        }

        const newApprovedCount = submission.job.approvedCount + 1;
        const newPendingCount = Math.max(0, submission.job.pendingCount - 1);
        const isCompleted = newApprovedCount >= submission.job.totalWorkersNeeded;

        await tx.microJob.update({
          where: { id: submission.jobId },
          data: {
            approvedCount: newApprovedCount,
            pendingCount: newPendingCount,
            status: isCompleted ? 'COMPLETED' : submission.job.status,
          },
        });

        return updated;
      });

      // Process Affiliate Referral Reward for worker referral (from task platform fee)
      const affiliate = this.affiliateService;
      if (affiliate && submission) {
        const settings = await this.settingsService.getMicroJobSettings();
        const platformFeePercent = Number(settings.platformFeePercent ?? 5);
        const taskAdminFee = (reward * platformFeePercent) / 100;
        if (taskAdminFee > 0) {
          affiliate
            .processReferralReward({
              userId: submission.workerId,
              sourceType: 'MICRO_JOB',
              sourceId: submission.id,
              adminFee: taskAdminFee,
              notes: 'মাইক্রো জব কাজ সম্পন্ন (এডমিন অ্যাপ্রুভ)',
            })
            .catch((err) => this.logger.error('Failed to process admin worker affiliate reward:', err));
        }
      }

      if (this.telegramService && submission.workerId) {
        this.telegramService
          .notifyMicroJobApproved(submission.workerId, submission.job.title, reward)
          .catch((err) => this.logger.error('Failed to notify worker via Telegram:', err));
      }

      return approvedResult;
    } else {
      // REJECT
      const rejectReason = dto.rejectReason?.trim() || 'অ্যাডমিন কর্তৃক বাতিল করা হয়েছে';
      const rejectedResult = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.microJobSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'REJECTED',
            rejectReason,
            adminNotes: `Rejected by Admin (${adminId})`,
            reviewedAt: new Date(),
          },
        });

        await tx.microJob.update({
          where: { id: submission.jobId },
          data: {
            pendingCount: { decrement: 1 },
          },
        });

        return updated;
      });

      if (this.telegramService && submission.workerId) {
        this.telegramService
          .notifyMicroJobRejected(submission.workerId, submission.job.title, rejectReason)
          .catch((err) => this.logger.error('Failed to notify worker via Telegram:', err));
      }

      return rejectedResult;
    }
  }

  /**
   * Admin cancels any job and refunds remaining budget to employer
   */
  async adminCancelJob(jobId: string, adminId: string) {
    const job = await this.prisma.microJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('কাজটি খুঁজে পাওয়া যায়নি');
    }

    if (job.status === 'CANCELLED' || job.status === 'COMPLETED') {
      throw new BadRequestException('এই কাজটি ইতোমধ্যে সম্পন্ন বা বাতিল করা হয়েছে');
    }

    const remainingSlots = Math.max(0, job.totalWorkersNeeded - job.approvedCount - job.pendingCount);

    return this.prisma.$transaction(async (tx) => {
      let refundAmount = 0;
      if (remainingSlots > 0) {
        const unitReward = Number(job.rewardPerWorker);
        const workerBudgetRefund = remainingSlots * unitReward;
        const totalBudget = Number(job.totalBudget);
        const feeRatio = totalBudget > 0 ? Number(job.platformFee) / totalBudget : 0;
        const feeRefund = workerBudgetRefund * feeRatio;
        refundAmount = workerBudgetRefund + feeRefund;

        const wallet = await tx.wallet.findUnique({
          where: { userId: job.employerId },
        });

        if (wallet && refundAmount > 0) {
          const balanceBefore = Number(wallet.availableBalance);
          const balanceAfter = balanceBefore + refundAmount;

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
              userId: job.employerId,
              type: 'MICROJOB_REFUND',
              amount: refundAmount,
              balanceBefore,
              balanceAfter,
              holdBefore: Number(wallet.holdBalance),
              holdAfter: Number(wallet.holdBalance),
              referenceId: job.id,
              referenceType: 'MICRO_JOB',
              notes: `Admin Cancelled Micro Job Refund: ${job.title} by Admin (${adminId})`,
              status: 'COMPLETED',
            },
          });
        }
      }

      const updatedJob = await tx.microJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
        },
      });

      return {
        job: updatedJob,
        refundAmount,
        refundedSlots: remainingSlots,
      };
    });
  }

  private lastAutoApproveCheckAt = 0;

  /**
   * Check settings and automatically approve expired submissions if enabled by Super Admin
   */
  async processAutoApprovalsIfEnabled() {
    const nowMs = Date.now();
    if (nowMs - this.lastAutoApproveCheckAt < 30000) {
      return { processedCount: 0, skipped: true };
    }
    this.lastAutoApproveCheckAt = nowMs;

    try {
      const all = await this.settingsService.getAllSettings();
      const microJobEnabled = all.microJob?.enabled !== false;
      const autoApproveEnabled =
        all.microJob?.autoApproveEnabled !== false &&
        all.advancedFeatures?.microJobAutoApproval?.enabled !== false;

      if (!microJobEnabled || !autoApproveEnabled) {
        return { processedCount: 0, disabled: true };
      }

      const autoApproveHours = Number(
        all.advancedFeatures?.microJobAutoApproval?.autoApproveHours ||
          all.microJob?.autoApproveHours ||
          48,
      );
      if (autoApproveHours <= 0) {
        return { processedCount: 0 };
      }

      return this.autoApproveExpiredSubmissions(autoApproveHours);
    } catch {
      return { processedCount: 0 };
    }
  }

  /**
   * Auto-approve pending submissions that have passed the autoApproveAt or configured hours threshold
   */
  async autoApproveExpiredSubmissions(overrideHours?: number) {
    const now = new Date();
    const cutoffByHours =
      overrideHours && overrideHours > 0
        ? new Date(now.getTime() - overrideHours * 60 * 60 * 1000)
        : now;

    const expired = await this.prisma.microJobSubmission.findMany({
      where: {
        status: 'SUBMITTED',
        OR: [
          { autoApproveAt: { lte: now } },
          { createdAt: { lte: cutoffByHours } },
        ],
      },
      include: {
        job: true,
      },
      take: 20,
    });

    let processedCount = 0;
    for (const sub of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.microJobSubmission.update({
            where: { id: sub.id },
            data: {
              status: 'APPROVED',
              reviewedAt: new Date(),
              adminNotes: 'Auto-approved by system timer',
            },
          });

          const reward = Number(sub.job.rewardPerWorker);
          const wallet = await tx.wallet.findUnique({
            where: { userId: sub.workerId },
          });

          if (wallet) {
            const balanceBefore = Number(wallet.availableBalance);
            const balanceAfter = balanceBefore + reward;

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
                userId: sub.workerId,
                type: 'MICROJOB_EARNING',
                amount: reward,
                balanceBefore,
                balanceAfter,
                holdBefore: Number(wallet.holdBalance),
                holdAfter: Number(wallet.holdBalance),
                referenceId: sub.id,
                referenceType: 'MICRO_JOB',
                notes: `Auto-approved Micro Job: ${sub.job.title}`,
                status: 'COMPLETED',
              },
            });
          }

          const newApproved = sub.job.approvedCount + 1;
          const newPending = Math.max(0, sub.job.pendingCount - 1);
          const isDone = newApproved >= sub.job.totalWorkersNeeded;

          await tx.microJob.update({
            where: { id: sub.jobId },
            data: {
              approvedCount: newApproved,
              pendingCount: newPending,
              status: isDone ? 'COMPLETED' : sub.job.status,
            },
          });
        });

        if (this.telegramService && sub.workerId) {
          this.telegramService
            .notifyMicroJobApproved(sub.workerId, sub.job.title, Number(sub.job.rewardPerWorker))
            .catch((err) => this.logger.error('Failed to notify auto-approved worker via Telegram:', err));
        }

        // Process Affiliate Referral Reward for worker referral (from task platform fee)
        const affiliate = this.affiliateService;
        if (affiliate) {
          const settings = await this.settingsService.getMicroJobSettings();
          const platformFeePercent = Number(settings.platformFeePercent ?? 5);
          const reward = Number(sub.job.rewardPerWorker);
          const taskAdminFee = (reward * platformFeePercent) / 100;
          if (taskAdminFee > 0) {
            affiliate
              .processReferralReward({
                userId: sub.workerId,
                sourceType: 'MICRO_JOB',
                sourceId: sub.id,
                adminFee: taskAdminFee,
                notes: 'মাইক্রো জব কাজ সম্পন্ন (অটো-অ্যাপ্রুভ)',
              })
              .catch((err) => this.logger.error('Failed to process auto-approved worker affiliate reward:', err));
          }
        }

        processedCount++;
      } catch (err) {
        console.error(`Failed to auto-approve submission ${sub.id}:`, err);
      }
    }

    return { processedCount };
  }
}
