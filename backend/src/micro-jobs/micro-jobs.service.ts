import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CreateMicroJobDto } from './dto/create-micro-job.dto';
import { SubmitMicroJobDto } from './dto/submit-micro-job.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MicroJobsService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
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
    const totalCost = workerBudget + platformFee;

    const autoApproveHours = dto.autoApproveHours || Number(settings.autoApproveHours || 48);

    // Atomically verify balance and lock funds
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: employerId },
      });

      if (!wallet) {
        throw new BadRequestException('আপনার ওয়ালেট পাওয়া যায়নি');
      }

      const availableBalance = Number(wallet.availableBalance);
      if (availableBalance < totalCost) {
        throw new BadRequestException(
          `আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। মোট খরচ: ৳${totalCost.toFixed(2)} | বর্তমান ব্যালেন্স: ৳${availableBalance.toFixed(2)}`,
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
          commission: platformFee,
          balanceBefore,
          balanceAfter,
          holdBefore: Number(wallet.holdBalance),
          holdAfter: Number(wallet.holdBalance),
          notes: `Micro Job Escrow: ${dto.title} (${dto.totalWorkersNeeded} workers x ৳${dto.rewardPerWorker} + ৳${platformFee.toFixed(2)} fee)`,
          status: 'COMPLETED',
        },
      });

      // Create MicroJob
      const job = await tx.microJob.create({
        data: {
          employerId,
          categoryId: dto.categoryId,
          title: dto.title.trim(),
          description: dto.description.trim(),
          steps: dto.steps || [],
          proofRequirements: dto.proofRequirements || [],
          rewardPerWorker: dto.rewardPerWorker,
          totalWorkersNeeded: dto.totalWorkersNeeded,
          totalBudget: workerBudget,
          platformFee,
          status: 'ACTIVE',
          minKycRequired: Boolean(dto.minKycRequired),
          autoApproveHours,
        },
        include: {
          category: true,
        },
      });

      return job;
    });
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

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'reward_high') orderBy = { rewardPerWorker: 'desc' };
    if (query.sort === 'reward_low') orderBy = { rewardPerWorker: 'asc' };

    const [items, total] = await Promise.all([
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
    const job = await this.prisma.microJob.findUnique({
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
    });

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

    return {
      ...job,
      mySubmission,
      isMyJob: currentUserId === job.employerId,
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
      throw new BadRequestException('আপনি ইতোমধ্যে এই কাজের প্রমাণ জমা দিয়েছেন');
    }

    const autoApproveHours = job.autoApproveHours || 48;
    const autoApproveAt = new Date(Date.now() + autoApproveHours * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
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
  }

  /**
   * Get all jobs posted by the employer
   */
  async getEmployerJobs(employerId: string) {
    return this.prisma.microJob.findMany({
      where: { employerId },
      orderBy: { createdAt: 'desc' },
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
      return this.prisma.$transaction(async (tx) => {
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
    } else {
      // REJECT
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.microJobSubmission.update({
          where: { id: submissionId },
          data: {
            status: 'REJECTED',
            rejectReason: dto.rejectReason?.trim() || 'কাজের শর্ত অনুযায়ী প্রমাণ সঠিক হয়নি',
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
   * Worker's task history and earnings
   */
  async getWorkerTasks(workerId: string) {
    const submissions = await this.prisma.microJobSubmission.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
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
   * Auto-approve pending submissions that have passed the autoApproveAt threshold
   */
  async autoApproveExpiredSubmissions() {
    const now = new Date();
    const expired = await this.prisma.microJobSubmission.findMany({
      where: {
        status: 'SUBMITTED',
        autoApproveAt: { lte: now },
      },
      include: {
        job: true,
      },
      take: 50,
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
        processedCount++;
      } catch (err) {
        console.error(`Failed to auto-approve submission ${sub.id}:`, err);
      }
    }

    return { processedCount };
  }
}
