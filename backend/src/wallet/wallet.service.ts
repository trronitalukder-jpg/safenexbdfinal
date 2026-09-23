import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminWalletAdjustmentDto,
  CreateRechargeMethodDto,
  CreateRechargeRequestDto,
  CreateWithdrawalRequestDto,
  HoldResolutionDto,
  ReviewRechargeDto,
  ReviewWithdrawalDto,
  UpdateRechargeMethodDto,
} from './dto/wallet.dto';
import { CommissionService } from '../commission/commission.service';
import { ChatGateway } from '../chat/chat.gateway';
import { TelegramService } from '../telegram/telegram.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { OtpService } from '../sms/otp.service';
import { SmsService } from '../sms/sms.service';
import { SettingsService } from '../settings/settings.service';
import { OperationsService } from '../operations/operations.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private activeRechargeLocks = new Set<string>();
  private activeWithdrawLocks = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    @Optional() private chatGateway?: ChatGateway,
    @Optional() private otpService?: OtpService,
    @Optional() private smsService?: SmsService,
    @Optional() private settingsService?: SettingsService,
    @Optional() private operationsService?: OperationsService,
    @Optional()
    @Inject(forwardRef(() => TelegramService))
    private telegramService?: TelegramService,
    @Optional()
    @Inject(forwardRef(() => AffiliateService))
    private affiliateService?: AffiliateService,
  ) {}

  /**
   * Fetch user's current wallet
   */
  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          availableBalance: new Prisma.Decimal(0),
          holdBalance: new Prisma.Decimal(0),
        },
      });
    }

    return wallet;
  }

  /**
   * Fetch immutable wallet ledger history
   */
  async getLedger(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.walletLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletLedger.count({ where: { userId } }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get active recharge methods for users
   */
  async getRechargeMethods() {
    return this.prisma.rechargeMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Admin: Get all recharge methods (active + inactive) with stats
   */
  async getAllAdminRechargeMethods() {
    return this.prisma.rechargeMethod.findMany({
      include: {
        _count: {
          select: { requests: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Admin: Create a new recharge method
   */
  async createRechargeMethod(dto: CreateRechargeMethodDto) {
    const existing = await this.prisma.rechargeMethod.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`Payment method with code '${dto.code}' already exists`);
    }

    return this.prisma.rechargeMethod.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        type: dto.type as any,
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName?.trim() || null,
        bankDetails: dto.bankDetails?.trim() || null,
        instructions: dto.instructions?.trim() || null,
        minAmount: new Prisma.Decimal(dto.minAmount ?? 10),
        maxAmount: new Prisma.Decimal(dto.maxAmount ?? 500000),
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
        sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) : 0,
      },
    });
  }

  /**
   * Admin: Update an existing recharge method
   */
  async updateRechargeMethod(id: string, dto: UpdateRechargeMethodDto) {
    const method = await this.prisma.rechargeMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');

    if (dto.code && dto.code.trim().toUpperCase() !== method.code) {
      const existing = await this.prisma.rechargeMethod.findUnique({
        where: { code: dto.code.trim().toUpperCase() },
      });
      if (existing) {
        throw new BadRequestException(`Payment method with code '${dto.code}' already exists`);
      }
    }

    return this.prisma.rechargeMethod.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.type && { type: dto.type as any }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber.trim() }),
        ...(dto.accountName !== undefined && { accountName: dto.accountName?.trim() || null }),
        ...(dto.bankDetails !== undefined && { bankDetails: dto.bankDetails?.trim() || null }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions?.trim() || null }),
        ...(dto.minAmount !== undefined && { minAmount: new Prisma.Decimal(dto.minAmount) }),
        ...(dto.maxAmount !== undefined && { maxAmount: new Prisma.Decimal(dto.maxAmount) }),
        ...(dto.isActive !== undefined && { isActive: Boolean(dto.isActive) }),
        ...(dto.sortOrder !== undefined && { sortOrder: Number(dto.sortOrder) }),
      },
    });
  }

  /**
   * Admin: Quick Toggle Active/Inactive status
   */
  async toggleRechargeMethod(id: string) {
    const method = await this.prisma.rechargeMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');

    return this.prisma.rechargeMethod.update({
      where: { id },
      data: { isActive: !method.isActive },
    });
  }

  /**
   * Admin: Delete or deactivate recharge method
   */
  async deleteRechargeMethod(id: string) {
    const method = await this.prisma.rechargeMethod.findUnique({
      where: { id },
      include: { _count: { select: { requests: true } } },
    });
    if (!method) throw new NotFoundException('Payment method not found');

    if (method._count.requests > 0) {
      // If requests exist, deactivate rather than causing foreign key constraint error
      await this.prisma.rechargeMethod.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true, message: 'Payment method deactivated because requests are attached to it' };
    }

    await this.prisma.rechargeMethod.delete({ where: { id } });
    return { success: true, message: 'Payment method deleted successfully' };
  }

  /**
   * Get active withdrawal methods
   */
  async getWithdrawalMethods() {
    return this.prisma.withdrawalMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * User submits a Recharge Request
   */
  async submitRechargeRequest(userId: string, dto: CreateRechargeRequestDto) {
    if (this.activeRechargeLocks.has(userId)) {
      throw new BadRequestException('একটি রিচার্জ আবেদন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।');
    }
    this.activeRechargeLocks.add(userId);

    try {
      const method = await this.prisma.rechargeMethod.findUnique({
        where: { id: dto.methodId },
      });

      if (!method || !method.isActive) {
        throw new BadRequestException('Selected payment method is currently unavailable');
      }

      const amount = new Prisma.Decimal(dto.amount);
      if (amount.lessThan(method.minAmount) || amount.greaterThan(method.maxAmount)) {
        throw new BadRequestException(
          `Amount must be between ৳${method.minAmount} and ৳${method.maxAmount}`,
        );
      }

      // Check duplicate pending recharge with same transactionNumber or rapid re-submission
      const existingPending = await this.prisma.rechargeRequest.findFirst({
        where: {
          userId,
          status: 'PENDING',
          transactionNumber: dto.transactionNumber.trim(),
        },
      });
      if (existingPending) {
        throw new BadRequestException('এই ট্রানজেকশন নম্বরটির একটি রিচার্জ রিকোয়েস্ট ইতিমধ্যে পেন্ডিং রয়েছে। অনুগ্রহ করে অপেক্ষা করুন।');
      }

      const recentPending = await this.prisma.rechargeRequest.findFirst({
        where: {
          userId,
          status: 'PENDING',
          createdAt: { gte: new Date(Date.now() - 10000) },
        },
      });
      if (recentPending) {
        throw new BadRequestException('একটি রিচার্জ আবেদন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।');
      }

      const recharge = await this.prisma.$transaction(async (tx) => {
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

        const recharge = await tx.rechargeRequest.create({
          data: {
            userId,
            methodId: dto.methodId,
            amount,
            senderAccount: dto.senderAccount.trim(),
            transactionNumber: dto.transactionNumber.trim(),
            proofUrl: dto.proofUrl,
            status: 'PENDING',
          },
        });

        // Write initial pending ledger entry into WalletLedger
        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            userId,
            transactionId: dto.transactionNumber.trim(),
            type: 'RECHARGE',
            amount,
            commission: new Prisma.Decimal(0),
            balanceBefore: wallet.availableBalance,
            balanceAfter: wallet.availableBalance, // not credited yet
            holdBefore: wallet.holdBalance,
            holdAfter: wallet.holdBalance,
            referenceId: recharge.id,
            referenceType: 'RECHARGE_REQUEST',
            notes: `Recharge Pending: Request submitted via ${method.name}. TrxID: ${dto.transactionNumber.trim()}`,
            status: 'PENDING',
            createdBy: userId,
          },
        });

        return recharge;
      });

      // Real-time notifications for Recharge Request
      if (this.chatGateway && recharge) {
        const amountNum = recharge.amount ? Number(recharge.amount) : Number(dto.amount);
        this.chatGateway.notifyUser(userId, 'notification:recharge', {
          id: recharge.id,
          status: 'PENDING',
          amount: amountNum,
          title: 'রিচার্জ আবেদন জমা হয়েছে',
          message: `আপনার ৳${amountNum.toLocaleString()} টাকার রিচার্জ আবেদন পর্যালোচনার জন্য জমা রয়েছে।`,
          createdAt: new Date().toISOString(),
        });

        this.chatGateway.notifyAdminsAndStaff('notification:admin', {
          type: 'NEW_RECHARGE_REQUEST',
          title: 'নতুন রিচার্জ রিকোয়েস্ট',
          message: `ব্যবহারকারী ৳${amountNum.toLocaleString()} টাকার রিচার্জ রিকোয়েস্ট পাঠিয়েছেন (${method.name})।`,
          targetUrl: '/admin/recharges',
          createdAt: new Date().toISOString(),
        });
      }

      // Send Recharge Alert to Admin Telegram Group
      try {
        if (this.telegramService && recharge) {
          const settings = await this.telegramService.getSettings();
          if (settings.isEnabled && settings.botToken && settings.adminGroupId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, uniqueUserId: true } });
            const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
            const uniqueId = user?.uniqueUserId || 'N/A';
            const amountNum = recharge.amount ? Number(recharge.amount) : Number(dto.amount);

            const text = `🚨 <b>[Admin Alert] নতুন রিচার্জ রিকোয়েস্ট!</b>\n\n👤 ইউজার: <b>${userName}</b> (@${uniqueId})\n💰 পরিমাণ: <b>৳${amountNum.toLocaleString()}</b>\n💳 মেথড: ${method.name}\n📱 প্রেরক নম্বর: <code>${dto.senderAccount}</code>\n🔢 TrxID: <code>${dto.transactionNumber}</code>\n⏰ সময়: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}`;

            await this.telegramService.callApi(settings.botToken, 'sendMessage', {
              chat_id: settings.adminGroupId,
              text,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '👁️ অ্যাডমিন প্যানেলে দেখুন',
                      url: `${settings.miniAppUrl || 'https://safnexbd.com'}/admin/recharges`,
                    },
                  ],
                ],
              },
            });
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to send telegram recharge alert: ${err.message}`);
      }

      if (this.operationsService && recharge?.id) {
        await this.operationsService.autoAssignTaskOnCreate('RECHARGE', recharge.id, 'FINANCE_RECHARGE');
      }

      return recharge;
    } finally {
      this.activeRechargeLocks.delete(userId);
    }
  }

  /**
   * User fetches their recharge requests
   */
  async getMyRecharges(userId: string) {
    return this.prisma.rechargeRequest.findMany({
      where: { userId },
      include: { method: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin reviews recharge request
   * Option 1: Approve requested amount
   * Option 2: Approve custom verified amount
   */
  async reviewRecharge(requestId: string, adminId: string, dto: ReviewRechargeDto) {
    const updatedRecharge = await this.prisma.$transaction(async (tx) => {
      const request = await tx.rechargeRequest.findUnique({
        where: { id: requestId },
        include: { user: { include: { wallet: true } }, method: true },
      });

      if (!request) {
        throw new NotFoundException('Recharge request not found');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException('Recharge request has already been reviewed');
      }

      if (dto.action === 'REJECT') {
        // Record immutable audit log
        await tx.auditLog.create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'RECHARGE_REJECT',
            targetEntity: 'RechargeRequest',
            targetId: requestId,
            beforeState: {
              status: request.status,
              amount: request.amount.toString(),
              method: request.method?.name,
              transactionNumber: request.transactionNumber,
            },
            afterState: { status: 'REJECTED' },
            reason: dto.adminNotes || 'Recharge verification failed',
          },
        });

        // Update existing pending ledger entry to REJECTED if exists
        const existingLedger = await tx.walletLedger.findFirst({
          where: {
            referenceId: requestId,
            referenceType: 'RECHARGE_REQUEST',
          },
        });

        if (existingLedger) {
          await tx.walletLedger.update({
            where: { id: existingLedger.id },
            data: {
              status: 'REJECTED',
              notes: `Recharge Rejected: ${dto.adminNotes || 'Verification failed'}. TrxID: ${request.transactionNumber}`,
            },
          });
        }

        return tx.rechargeRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            adminNotes: dto.adminNotes || 'Verification failed',
            proofUrl: dto.proofUrl !== undefined ? dto.proofUrl : request.proofUrl,
            reviewedById: adminId,
            reviewedAt: new Date(),
          },
          include: { user: true, method: true },
        });
      }

      // Determine approved amount (Option 1 vs Option 2 per Spec #15)
      const approvedAmount = dto.approvedAmount
        ? new Prisma.Decimal(dto.approvedAmount)
        : request.amount;

      if (approvedAmount.lessThanOrEqualTo(0)) {
        throw new BadRequestException('Approved amount must be greater than zero');
      }

      // Calculate recharge fee from configured platform settings (Flat or Percentage)
      const recCalc = await this.commissionService.calculateCommission({
        amount: approvedAmount.toNumber(),
        type: 'RECHARGE',
      });
      const rechargeFee = recCalc.commissionAmount;
      const netCredit = approvedAmount.sub(rechargeFee).greaterThan(0)
        ? approvedAmount.sub(rechargeFee)
        : new Prisma.Decimal(0);

      const wallet = request.user.wallet!;
      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore.add(netCredit);

      // Update wallet atomically with true optimistic locking
      const updateRes = await tx.wallet.updateMany({
        where: { id: wallet.id, version: wallet.version },
        data: {
          availableBalance: balanceAfter,
          version: { increment: 1 },
        },
      });
      if (updateRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }

      // Record immutable ledger entry (Recharge Success)
      const rateDesc = recCalc.ruleApplied
        ? recCalc.ruleApplied.rateType === 'PERCENTAGE'
          ? `${recCalc.ruleApplied.value}%`
          : `৳${recCalc.ruleApplied.value} Flat`
        : '';

      const successNotes = `Recharge Success: Approved by Admin. Claimed: ৳${request.amount}, Approved: ৳${approvedAmount}${
        rechargeFee.greaterThan(0) ? `, Charge (${rateDesc}): ৳${rechargeFee}, Net Credited: ৳${netCredit}` : ''
      }. TrxID: ${request.transactionNumber}`;

      // Find existing pending ledger entry to update to COMPLETED (Recharge Success)
      const existingLedger = await tx.walletLedger.findFirst({
        where: {
          referenceId: request.id,
          referenceType: 'RECHARGE_REQUEST',
        },
      });

      if (existingLedger) {
        await tx.walletLedger.update({
          where: { id: existingLedger.id },
          data: {
            amount: netCredit,
            commission: rechargeFee,
            balanceBefore,
            balanceAfter,
            holdBefore: wallet.holdBalance,
            holdAfter: wallet.holdBalance,
            notes: successNotes,
            status: 'COMPLETED',
            createdBy: adminId,
            createdAt: new Date(),
          },
        });
      } else {
        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            userId: request.userId,
            transactionId: request.transactionNumber,
            type: 'RECHARGE',
            amount: netCredit,
            commission: rechargeFee,
            balanceBefore,
            balanceAfter,
            holdBefore: wallet.holdBalance,
            holdAfter: wallet.holdBalance,
            referenceId: request.id,
            referenceType: 'RECHARGE_REQUEST',
            notes: successNotes,
            status: 'COMPLETED',
            createdBy: adminId,
          },
        });
      }

      // Mark request approved
      const finalAdminNotes = dto.adminNotes
        ? rechargeFee.greaterThan(0)
          ? `${dto.adminNotes} (Charge ${rateDesc}: ৳${rechargeFee})`
          : dto.adminNotes
        : rechargeFee.greaterThan(0)
        ? `Recharge charge (${rateDesc}): ৳${rechargeFee} deducted`
        : undefined;

      // Record immutable audit log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'RECHARGE_APPROVE',
          targetEntity: 'RechargeRequest',
          targetId: requestId,
          beforeState: {
            status: request.status,
            claimedAmount: request.amount.toString(),
            transactionNumber: request.transactionNumber,
          },
          afterState: {
            status: 'APPROVED',
            approvedAmount: approvedAmount.toString(),
            netCredited: netCredit.toString(),
            charge: rechargeFee.toString(),
          },
          reason:
            finalAdminNotes ||
            `Recharge approved for ৳${approvedAmount} (TrxID: ${request.transactionNumber})`,
        },
      });

      return tx.rechargeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedAmount,
          adminNotes: finalAdminNotes,
          proofUrl: dto.proofUrl !== undefined ? dto.proofUrl : request.proofUrl,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
        include: { user: true, method: true },
      });
    });

    // Notify user of recharge decision in real-time
    if (this.chatGateway && updatedRecharge) {
      const isApproved = updatedRecharge.status === 'APPROVED';
      const amountNum = Number(updatedRecharge.approvedAmount || updatedRecharge.amount || 0);
      this.chatGateway.notifyUser(updatedRecharge.userId, 'notification:recharge', {
        id: updatedRecharge.id,
        status: isApproved ? 'SUCCESS' : 'REJECTED',
        amount: amountNum,
        title: isApproved ? 'রিচার্জ সফল হয়েছে! ব্যালেন্স যোগ হয়েছে' : 'রিচার্জ আবেদন বাতিল হয়েছে',
        message: isApproved
          ? `আপনার অ্যাকাউন্টে ৳${amountNum.toLocaleString()} টাকা যোগ করা হয়েছে।`
          : `আপনার ৳${amountNum.toLocaleString()} টাকার রিচার্জ আবেদন বাতিল করা হয়েছে (${dto.adminNotes || 'ভেরিফিকেশন সম্পন্ন হয়নি'})।`,
        createdAt: new Date().toISOString(),
      });
    }

    // Trigger SMS / Email event notification
    if (this.smsService && updatedRecharge) {
      const isApproved = updatedRecharge.status === 'APPROVED';
      const eventKey = isApproved ? 'recharge_success' : 'recharge_rejected';
      const user = (updatedRecharge as any).user;
      const amountVal = String(updatedRecharge.approvedAmount || updatedRecharge.amount || 0);

      this.smsService
        .triggerEventNotification({
          eventKey,
          recipientPhone: user?.phone || undefined,
          recipientEmail: user?.email || undefined,
          variables: {
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
            amount: amountVal,
            method: (updatedRecharge as any).method?.name || 'Recharge',
            txId: updatedRecharge.transactionNumber || '',
            reason: dto.adminNotes || '',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          },
          lang: 'bn',
        })
        .catch(() => {});
    }

    // Process Affiliate Referral Reward for approved recharge
    if (this.affiliateService && updatedRecharge.status === 'APPROVED') {
      const rechargeFee = Number(
        (updatedRecharge as any).adminFee || 
        (updatedRecharge.amount ? Number(updatedRecharge.amount) * 0.02 : 10) // fallback base
      );
      this.affiliateService
        .processReferralReward({
          userId: updatedRecharge.userId,
          sourceType: 'RECHARGE',
          sourceId: updatedRecharge.id,
          adminFee: rechargeFee,
        })
        .catch(() => null);
    }

    return updatedRecharge;
  }

  /**
   * Send OTP for withdrawal request if Withdrawal OTP security mode is active
   */
  async sendWithdrawOtp(
    userId: string,
    body: { amount: number; methodId?: string; destination?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('ইউজার পাওয়া যায়নি');
    }

    const destPhone =
      body.destination && /^01[3-9]\d{8}$/.test(body.destination.trim())
        ? body.destination.trim()
        : null;

    const identifier = user.phone || destPhone || user.email;
    if (!identifier) {
      throw new BadRequestException('আপনার প্রোফাইলে কোনো মোবাইল নম্বর বা ইমেইল যুক্ত নেই। অনুগ্রহ করে প্রোফাইল আপডেট করুন।');
    }

    if (!this.otpService) {
      throw new BadRequestException('ওটিপি সার্ভিস এই মুহূর্তে অনুপলব্ধ রয়েছে।');
    }

    let methodName = '';
    if (body.methodId) {
      const method = await this.prisma.withdrawalMethod.findUnique({
        where: { id: body.methodId },
        select: { name: true },
      });
      if (method) methodName = method.name;
    }

    return this.otpService.sendOtp({
      identifier,
      purpose: 'WITHDRAWAL',
      metadata: {
        userId,
        amount: body.amount,
        method: methodName,
        destination: body.destination,
      },
      lang: 'bn',
    });
  }

  /**
   * User submits a Withdrawal Request
   * Rule: Only Available Balance can be withdrawn. Hold balance is strictly excluded.
   */
  async submitWithdrawalRequest(userId: string, dto: CreateWithdrawalRequestDto) {
    if (this.activeWithdrawLocks.has(userId)) {
      throw new BadRequestException('একটি উইথড্র রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।');
    }
    this.activeWithdrawLocks.add(userId);

    try {
      // Check if a pending withdrawal request was submitted by this user in the last 10 seconds
      const recentWithdraw = await this.prisma.withdrawalRequest.findFirst({
        where: {
          userId,
          status: 'PENDING',
          createdAt: { gte: new Date(Date.now() - 10000) },
        },
      });
      if (recentWithdraw) {
        throw new BadRequestException('একটি উইথড্র রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।');
      }

    // Verify OTP if Security Mode requires Withdrawal OTP
    if (this.smsService) {
      const secModes = await this.smsService.getSecurityModesConfig();
      if (secModes.withdrawOtpEnabled) {
        if (!dto.otpCode || !dto.otpCode.trim()) {
          throw new BadRequestException('উইথড্র সম্পন্ন করতে অনুগ্রহ করে ওটিপি (OTP) কোড দিন।');
        }

        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { phone: true, email: true },
        });

        const destPhone =
          dto.destinationAccount && /^01[3-9]\d{8}$/.test(dto.destinationAccount.trim())
            ? dto.destinationAccount.trim()
            : null;

        const identifier = user?.phone || destPhone || user?.email;
        if (!identifier) {
          throw new BadRequestException('ওটিপি যাচাইকরণের জন্য ইউজারের ফোন বা ইমেইল পাওয়া যায়নি।');
        }

        if (!this.otpService) {
          throw new BadRequestException('ওটিপি সার্ভিস এই মুহূর্তে অনুপলব্ধ রয়েছে।');
        }

        await this.otpService.verifyOtp({
          identifier,
          purpose: 'WITHDRAWAL',
          code: dto.otpCode.trim(),
        });
      }
    }

    // Load Admin-Configured Withdrawal & Security Settings
    const withSettings = this.settingsService
      ? await this.settingsService.getWithdrawalSettings()
      : {
          requirePasswordForPayoutAccount: true,
          autoSaveWithdrawalAccount: true,
          requirePasswordFirstWithdraw: true,
          cancelPendingWithdrawEnabled: true,
          freezeAfterPasswordChange: true,
          freezeDurationHours: 24,
          dailyWithdrawLimitUnverified: 5000,
          dailyWithdrawLimitVerified: 50000,
        };

    // 1. Check: Withdrawal Freeze after Password Change
    if (withSettings.freezeAfterPasswordChange) {
      const freezeHours = withSettings.freezeDurationHours || 24;
      const lastPasswordChange = await this.prisma.auditLog.findFirst({
        where: {
          action: 'PASSWORD_CHANGE',
          OR: [{ actorId: userId }, { targetId: userId }],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastPasswordChange) {
        const elapsedMs = Date.now() - new Date(lastPasswordChange.createdAt).getTime();
        const freezeMs = freezeHours * 60 * 60 * 1000;
        if (elapsedMs < freezeMs) {
          const remainingMinutes = Math.ceil((freezeMs - elapsedMs) / (60 * 1000));
          const remHours = Math.floor(remainingMinutes / 60);
          const remMins = remainingMinutes % 60;
          const timeStr = remHours > 0 ? `${remHours} ঘণ্টা ${remMins} মিনিট` : `${remMins} মিনিট`;
          throw new BadRequestException(
            `অ্যাকাউন্টের নিরাপত্তার স্বার্থে পাসওয়ার্ড পরিবর্তনের পর ${freezeHours} ঘণ্টার জন্য উইথড্র সাময়িকভাবে স্থগিত থাকে। অনুগ্রহ করে আর ${timeStr} পর চেষ্টা করুন।`,
          );
        }
      }
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        passwordHash: true,
      },
    });

    if (!userRecord) {
      throw new NotFoundException('ইউজার পাওয়া যায়নি');
    }

    const method = await this.prisma.withdrawalMethod.findUnique({
      where: { id: dto.methodId },
    });

    if (!method || !method.isActive) {
      throw new BadRequestException('Withdrawal method is currently unavailable');
    }

    const requestedAmount = new Prisma.Decimal(dto.amount);
    if (requestedAmount.lessThan(method.minAmount) || requestedAmount.greaterThan(method.maxAmount)) {
      throw new BadRequestException(
        `Withdrawal amount must be between ৳${method.minAmount} and ৳${method.maxAmount}`,
      );
    }

    // 2. Check: Daily Withdrawal Limits for Verified vs Unverified
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayWithdrawnAgg = await this.prisma.withdrawalRequest.aggregate({
      where: {
        userId,
        createdAt: { gte: todayStart },
        status: { in: ['PENDING', 'APPROVED'] },
      },
      _sum: { amount: true },
    });
    const todayWithdrawn = Number(todayWithdrawnAgg._sum?.amount || 0);

    if (userRecord.isVerified && withSettings.dailyWithdrawLimitVerified > 0) {
      if (todayWithdrawn + requestedAmount.toNumber() > withSettings.dailyWithdrawLimitVerified) {
        throw new BadRequestException(
          `আপনার দৈনিক উইথড্র লিমিট (৳${withSettings.dailyWithdrawLimitVerified.toLocaleString()}) অতিক্রম করবে। আজ ইতোমধ্যে ৳${todayWithdrawn.toLocaleString()} উত্তোলনের আবেদন করেছেন।`,
        );
      }
    } else if (!userRecord.isVerified && withSettings.dailyWithdrawLimitUnverified > 0) {
      if (todayWithdrawn + requestedAmount.toNumber() > withSettings.dailyWithdrawLimitUnverified) {
        throw new BadRequestException(
          `আনভেরিফাইড অ্যাকাউন্টের দৈনিক উইথড্র লিমিট (৳${withSettings.dailyWithdrawLimitUnverified.toLocaleString()}) অতিক্রম করবে। আজ ইতোমধ্যে ৳${todayWithdrawn.toLocaleString()} উত্তোলনের আবেদন করেছেন। বড় অঙ্কের উত্তোলনের জন্য প্রোফাইল ভেরিফাই করুন।`,
        );
      }
    }

    const savedAccountsCount = await this.prisma.userPaymentAccount.count({ where: { userId } });

    // Validation for Bank vs Mobile banking
    const isBank = method.code.toUpperCase().includes('BANK') || !!dto.bankName;
    let targetAccountNum = '';

    if (isBank) {
      if (!dto.bankName || !dto.bankName.trim()) {
        throw new BadRequestException('Bank Name is required for Bank Transfer withdrawal');
      }
      if (!dto.accountHolderName || !dto.accountHolderName.trim()) {
        throw new BadRequestException('Account Holder Name is required for Bank Transfer withdrawal');
      }
      if (!dto.accountNumber || !dto.accountNumber.trim()) {
        throw new BadRequestException('Account Number is required for Bank Transfer withdrawal');
      }
      if (!dto.routingNumber || !dto.routingNumber.trim()) {
        throw new BadRequestException('Bank Routing Number is required for Bank Transfer withdrawal');
      }
      targetAccountNum = dto.accountNumber.trim();
    } else {
      if (!dto.destinationAccount || !dto.destinationAccount.trim()) {
        throw new BadRequestException('Destination account / mobile number is required');
      }
      targetAccountNum = dto.destinationAccount.trim();
    }

    // Check if destination account is already in user's saved payment accounts
    const existingSavedAccount = await this.prisma.userPaymentAccount.findFirst({
      where: {
        userId,
        accountNumber: targetAccountNum,
      },
    });
    const isSavedAccount = !!existingSavedAccount;

    // Security check:
    // If account is NOT saved -> Password is REQUIRED!
    // If account IS saved -> Password is NOT required.
    if (!isSavedAccount) {
      if (!dto.password || !dto.password.trim()) {
        throw new BadRequestException('নতুন অ্যাকাউন্টে উত্তোলনের জন্য আপনার অ্যাকাউন্টের পাসওয়ার্ড দেওয়া বাধ্যতামূলক।');
      }
      if (!userRecord.passwordHash) {
        throw new BadRequestException('আপনার অ্যাকাউন্টে পাসওয়ার্ড সেট করা নেই। অনুগ্রহ করে প্রোফাইল থেকে পাসওয়ার্ড সেট করুন।');
      }
      const isMatch = await bcrypt.compare(dto.password.trim(), userRecord.passwordHash);
      if (!isMatch) {
        throw new BadRequestException('ভুল পাসওয়ার্ড! অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
      }
    } else {
      // Saved account: password not required, but if provided, verify it
      if (dto.password && dto.password.trim() && userRecord.passwordHash) {
        const isMatch = await bcrypt.compare(dto.password.trim(), userRecord.passwordHash);
        if (!isMatch) {
          throw new BadRequestException('ভুল পাসওয়ার্ড! অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।');
        }
      }
    }

    const destinationSummary = isBank
      ? `${dto.bankName?.trim() || ''} | A/C: ${dto.accountNumber?.trim() || ''} | Holder: ${dto.accountHolderName?.trim() || ''} | Routing: ${dto.routingNumber?.trim() || ''}${dto.branchName?.trim() ? ` | Branch: ${dto.branchName.trim()}` : ''}`
      : `${dto.destinationAccount?.trim() || ''}${dto.accountType ? ` (${dto.accountType})` : ''}`;

    // Fee calculation based on Admin Commission Settings (/admin/commissions)
    let fee = new Prisma.Decimal(0);
    const withSetting = await this.prisma.systemSetting.findUnique({
      where: { key: 'COMMISSION_WITHDRAW' },
    });
    const settingVal = (withSetting?.value as any) || { isActive: true, rateType: 'PERCENTAGE', value: 1.5 };
    const isCommActive = settingVal.isActive !== false;

    if (isCommActive) {
      const withCalc = await this.commissionService.calculateCommission({
        amount: requestedAmount.toNumber(),
        type: 'WITHDRAW',
      });
      if (withCalc && withCalc.commissionAmount) {
        fee = withCalc.commissionAmount;
      }
    } else if (method.feePercentage.greaterThan(0) || method.feeFlat.greaterThan(0)) {
      if (method.feePercentage.greaterThan(0)) {
        fee = fee.add(requestedAmount.mul(method.feePercentage).div(100));
      }
      if (method.feeFlat.greaterThan(0)) {
        fee = fee.add(method.feeFlat);
      }
    }
    const netAmount = requestedAmount.sub(fee).greaterThan(0)
      ? requestedAmount.sub(fee)
      : new Prisma.Decimal(0);

    const withdrawal = await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Strict validation: Available Balance must cover requested amount
      if (wallet.availableBalance.lessThan(requestedAmount)) {
        throw new BadRequestException(
          `Insufficient available balance. Available: ৳${wallet.availableBalance}, Requested: ৳${requestedAmount}`,
        );
      }

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore.sub(requestedAmount);

      // Deduct immediately to prevent double spending with optimistic locking
      const updateRes = await tx.wallet.updateMany({
        where: { id: wallet.id, version: wallet.version },
        data: {
          availableBalance: balanceAfter,
          version: { increment: 1 },
        },
      });
      if (updateRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }

      // Record ledger entry
      const createdWithdrawal = await (tx.withdrawalRequest as any).create({
        data: {
          userId,
          methodId: dto.methodId,
          amount: requestedAmount,
          fee,
          netAmount,
          destinationAccount: destinationSummary,
          accountType: dto.accountType || (isBank ? 'BANK' : 'PERSONAL'),
          bankName: dto.bankName?.trim() || null,
          accountHolderName: dto.accountHolderName?.trim() || null,
          accountNumber: dto.accountNumber?.trim() || (isBank ? null : dto.destinationAccount.trim()),
          routingNumber: dto.routingNumber?.trim() || null,
          branchName: dto.branchName?.trim() || null,
          status: 'PENDING',
        },
      });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'WITHDRAWAL',
          amount: requestedAmount,
          commission: fee,
          balanceBefore,
          balanceAfter,
          holdBefore: wallet.holdBalance,
          holdAfter: wallet.holdBalance,
          referenceId: createdWithdrawal.id,
          referenceType: 'WITHDRAWAL_REQUEST',
          notes: `Withdrawal request submitted for ৳${requestedAmount} (Net payout: ৳${netAmount}, Fee: ৳${fee}) to ${destinationSummary}. Status: Pending admin review.`,
          status: 'PENDING',
          createdBy: userId,
        },
      });

      // 4. Auto-save destination account to user's saved payment accounts
      if (withSettings.autoSaveWithdrawalAccount) {
        const accNum = isBank ? dto.accountNumber!.trim() : dto.destinationAccount.trim();
        const existingAcc = await tx.userPaymentAccount.findFirst({
          where: { userId, accountNumber: accNum },
        });

        if (!existingAcc) {
          let methodTypeEnum: any = 'OTHER';
          const codeUpper = (method.code || '').toUpperCase();
          if (codeUpper.includes('BKASH')) methodTypeEnum = 'BKASH';
          else if (codeUpper.includes('NAGAD')) methodTypeEnum = 'NAGAD';
          else if (codeUpper.includes('ROCKET')) methodTypeEnum = 'ROCKET';
          else if (codeUpper.includes('BANK') || isBank) methodTypeEnum = 'BANK';

          await tx.userPaymentAccount.create({
            data: {
              userId,
              methodType: methodTypeEnum,
              accountType:
                dto.accountType === 'AGENT'
                  ? 'AGENT'
                  : dto.accountType === 'MERCHANT'
                  ? 'MERCHANT'
                  : 'PERSONAL',
              accountNumber: accNum,
              accountName: (
                dto.accountHolderName?.trim() ||
                `${userRecord.firstName} ${userRecord.lastName}`.trim() ||
                'উইথড্র অ্যাকাউন্ট'
              ).slice(0, 100),
              bankName: dto.bankName?.trim() || null,
              branchName: dto.branchName?.trim() || null,
              routingNumber: dto.routingNumber?.trim() || null,
              isDefault: savedAccountsCount === 0,
            },
          });
        }
      }

      return createdWithdrawal;
    });

    // Notify user in real-time
    if (this.chatGateway && withdrawal) {
      this.chatGateway.notifyUser(userId, 'notification:withdraw', {
        id: withdrawal.id,
        type: 'SUBMITTED',
        status: 'PENDING',
        amount: requestedAmount.toNumber(),
        title: 'উইথড্র রিকোয়েস্ট জমা হয়েছে',
        message: `৳${requestedAmount.toNumber().toLocaleString()} উত্তোলনের রিকোয়েস্ট সফলভাবে জমা হয়েছে। অ্যাডমিন পর্যালোচনার পর ব্যালেন্স পাঠানো হবে।`,
        createdAt: new Date().toISOString(),
      });

      this.chatGateway.notifyAdminsAndStaff('notification:admin', {
        type: 'NEW_WITHDRAW_REQUEST',
        title: 'নতুন উইথড্র রিকোয়েস্ট',
        message: `৳${requestedAmount.toNumber().toLocaleString()} উত্তোলনের আবেদন এসেছে (${destinationSummary})।`,
        targetUrl: '/admin/withdrawals',
        createdAt: new Date().toISOString(),
      });
    }

    // Send Withdraw Alert to Admin Telegram Group
    try {
      if (this.telegramService && withdrawal) {
        const settings = await this.telegramService.getSettings();
        if (settings.isEnabled && settings.botToken && settings.adminGroupId) {
          const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, uniqueUserId: true } });
          const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
          const uniqueId = user?.uniqueUserId || 'N/A';

          const text = `🚨 <b>[Admin Alert] নতুন উইথড্র রিকোয়েস্ট!</b>\n\n👤 ইউজার: <b>${userName}</b> (@${uniqueId})\n💰 পরিমাণ: <b>৳${requestedAmount.toNumber().toLocaleString()}</b>\n🏦 অ্যাকাউন্ট: <code>${destinationSummary}</code>\n⏰ সময়: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}`;

          await this.telegramService.callApi(settings.botToken, 'sendMessage', {
            chat_id: settings.adminGroupId,
            text,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '👁️ অ্যাডমিন প্যানেলে দেখুন',
                    url: `${settings.miniAppUrl || 'https://safnexbd.com'}/admin/withdrawals`,
                  },
                ],
              ],
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to send telegram withdraw alert: ${err.message}`);
    }

      if (this.operationsService && withdrawal?.id) {
        await this.operationsService.autoAssignTaskOnCreate('WITHDRAWAL', withdrawal.id, 'FINANCE_WITHDRAWAL');
      }

      return withdrawal;
    } finally {
      this.activeWithdrawLocks.delete(userId);
    }
  }

  /**
   * User fetches their withdrawal requests
   */
  async getMyWithdrawals(userId: string) {
    return this.prisma.withdrawalRequest.findMany({
      where: { userId },
      include: { method: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * User cancels their own PENDING withdrawal request
   */
  async cancelPendingWithdrawal(userId: string, requestId: string) {
    const withSettings = this.settingsService
      ? await this.settingsService.getWithdrawalSettings()
      : { cancelPendingWithdrawEnabled: true };

    if (withSettings.cancelPendingWithdrawEnabled === false) {
      throw new BadRequestException('উইথড্র বাতিল করার সুবিধা বর্তমানে বন্ধ রয়েছে।');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findFirst({
        where: { id: requestId, userId },
        include: { user: { include: { wallet: true } }, method: true },
      });

      if (!request) {
        throw new NotFoundException('উইথড্র রিকোয়েস্ট পাওয়া যায়নি।');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException('শুধুমাত্র পেন্ডিং উইথড্র রিকোয়েস্ট বাতিল করা সম্ভব।');
      }

      const wallet = request.user.wallet;
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore.add(request.amount);

      // Refund wallet available balance with optimistic locking
      const updateRes = await tx.wallet.updateMany({
        where: { id: wallet.id, version: wallet.version },
        data: {
          availableBalance: balanceAfter,
          version: { increment: 1 },
        },
      });
      if (updateRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }

      // Update withdrawal request to REJECTED (Cancelled by User)
      const updated = await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          adminNotes: 'ব্যবহারকারী কর্তৃক বাতিল করা হয়েছে (Cancelled by User)',
          reviewedAt: new Date(),
        },
        include: { method: true },
      });

      // Update pending ledger entry
      const existingLedger = await tx.walletLedger.findFirst({
        where: {
          referenceId: requestId,
          referenceType: 'WITHDRAWAL_REQUEST',
        },
      });

      if (existingLedger) {
        await tx.walletLedger.update({
          where: { id: existingLedger.id },
          data: {
            status: 'REJECTED',
            notes: `Withdrawal Cancelled: ব্যবহারকারী নিজে আবেদন বাতিল করেছেন। ৳${request.amount} মূল ব্যালেন্সে রিফান্ড করা হয়েছে।`,
          },
        });
      }

      // Record ledger entry for the refund
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'ADMIN_ADJUSTMENT',
          amount: request.amount,
          commission: new Prisma.Decimal(0),
          balanceBefore,
          balanceAfter,
          holdBefore: wallet.holdBalance,
          holdAfter: wallet.holdBalance,
          referenceId: requestId,
          referenceType: 'WITHDRAWAL_REQUEST',
          notes: `উইথড্র বাতিলজনিত রিফান্ড: ৳${request.amount} মূল ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
          status: 'COMPLETED',
          createdBy: userId,
        },
      });

      // Record audit log
      try {
        await tx.auditLog.create({
          data: {
            actorId: userId,
            actorType: 'USER',
            action: 'WITHDRAWAL_CANCELLED_BY_USER',
            targetEntity: 'WithdrawalRequest',
            targetId: requestId,
            reason: 'User cancelled their own pending withdrawal',
          },
        });
      } catch {}

      return updated;
    });
  }

  /**
   * Admin reviews withdrawal request
   */
  async reviewWithdrawal(requestId: string, adminId: string, dto: ReviewWithdrawalDto) {
    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({
        where: { id: requestId },
        include: { user: { include: { wallet: true } } },
      });

      if (!request) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (request.status !== 'PENDING') {
        throw new BadRequestException('Withdrawal request has already been reviewed');
      }

      const wallet = request.user.wallet!;

      if (dto.action === 'REJECT') {
        // 1. Refund deducted amount back to user's available balance
        const balanceBefore = wallet.availableBalance;
        const balanceAfter = balanceBefore.add(request.amount);

        const updateRes = await tx.wallet.updateMany({
          where: { id: wallet.id, version: wallet.version },
          data: {
            availableBalance: balanceAfter,
            version: { increment: 1 },
          },
        });
        if (updateRes.count === 0) {
          throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
        }

        // 2. Mark the pending withdrawal ledger entry as REJECTED
        const pendingLedger = await tx.walletLedger.findFirst({
          where: {
            referenceId: request.id,
            referenceType: 'WITHDRAWAL_REQUEST',
          },
        });
        if (pendingLedger) {
          await tx.walletLedger.update({
            where: { id: pendingLedger.id },
            data: {
              status: 'REJECTED',
              notes: `${pendingLedger.notes} | REJECTED by Admin: ${dto.adminNotes || 'Unspecified reason'}`,
            },
          });
        }

        // 3. Create a refund ledger entry reflecting balance added back
        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            userId: request.userId,
            type: 'ADMIN_ADJUSTMENT',
            amount: request.amount,
            commission: new Prisma.Decimal(0),
            balanceBefore,
            balanceAfter,
            holdBefore: wallet.holdBalance,
            holdAfter: wallet.holdBalance,
            referenceId: request.id,
            referenceType: 'WITHDRAWAL_REJECTED_REFUND',
            notes: `Withdrawal rejected by Admin: ${dto.adminNotes || 'Unspecified reason'}. Refunded ৳${request.amount} to Available Balance`,
            status: 'COMPLETED',
            createdBy: adminId,
          },
        });

        // Record immutable audit log
        await tx.auditLog.create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'WITHDRAWAL_REJECT',
            targetEntity: 'WithdrawalRequest',
            targetId: requestId,
            beforeState: {
              status: request.status,
              amount: request.amount.toString(),
              fee: request.fee.toString(),
              netAmount: request.netAmount.toString(),
              destinationAccount: request.destinationAccount,
            },
            afterState: {
              status: 'REJECTED',
              refundedAmount: request.amount.toString(),
            },
            reason: dto.adminNotes || 'Withdrawal rejected by administrator',
          },
        });

        return tx.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            adminNotes: dto.adminNotes,
            reviewedById: adminId,
            reviewedAt: new Date(),
          },
          include: { user: true, method: true },
        });
      }

      // Approved: Mark pending withdrawal ledger entry as COMPLETED
      const pendingLedger = await tx.walletLedger.findFirst({
        where: {
          referenceId: request.id,
          referenceType: 'WITHDRAWAL_REQUEST',
        },
      });

      if (pendingLedger) {
        await tx.walletLedger.update({
          where: { id: pendingLedger.id },
          data: {
            status: 'COMPLETED',
            notes: `Withdrawal approved & disbursed by Admin. Net payout: ৳${request.netAmount} sent to ${request.destinationAccount}. ${dto.adminNotes ? `Admin Ref: ${dto.adminNotes}` : ''}`,
          },
        });
      } else {
        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            userId: request.userId,
            type: 'WITHDRAWAL',
            amount: request.amount,
            commission: request.fee,
            balanceBefore: wallet.availableBalance,
            balanceAfter: wallet.availableBalance,
            holdBefore: wallet.holdBalance,
            holdAfter: wallet.holdBalance,
            referenceId: request.id,
            referenceType: 'WITHDRAWAL_REQUEST',
            notes: `Withdrawal approved & disbursed by Admin. Net payout: ৳${request.netAmount} sent to ${request.destinationAccount}. ${dto.adminNotes ? `Admin Ref: ${dto.adminNotes}` : ''}`,
            status: 'COMPLETED',
            createdBy: adminId,
          },
        });
      }

      // Record immutable audit log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'WITHDRAWAL_APPROVE',
          targetEntity: 'WithdrawalRequest',
          targetId: requestId,
          beforeState: {
            status: request.status,
            amount: request.amount.toString(),
            fee: request.fee.toString(),
            netAmount: request.netAmount.toString(),
            destinationAccount: request.destinationAccount,
          },
          afterState: {
            status: 'APPROVED',
            disbursedAmount: request.netAmount.toString(),
            fee: request.fee.toString(),
          },
          reason:
            dto.adminNotes ||
            `Withdrawal approved & disbursed: ৳${request.netAmount} to ${request.destinationAccount}`,
        },
      });

      return tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          adminNotes: dto.adminNotes,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
        include: { user: true, method: true },
      });
    });

    // Notify user in real-time
    if (this.chatGateway && updatedRequest) {
      const isApproved = updatedRequest.status === 'APPROVED';
      const amountNum = Number(updatedRequest.amount || 0);
      this.chatGateway.notifyUser(updatedRequest.userId, 'notification:withdraw', {
        id: updatedRequest.id,
        type: isApproved ? 'APPROVED' : 'REJECTED',
        status: updatedRequest.status,
        amount: amountNum,
        title: isApproved ? `উইথড্র সফল হয়েছে! ৳${amountNum.toLocaleString()}` : 'উইথড্র বাতিল হয়েছে',
        message: isApproved
          ? `আপনার ৳${amountNum.toLocaleString()} উত্তোলন সফলভাবে সম্পন্ন হয়েছে এবং একাউন্টে পাঠিয়ে দেওয়া হয়েছে।`
          : `আপনার ৳${amountNum.toLocaleString()} উত্তোলন বাতিল হয়েছে (${dto.adminNotes || 'রিভিউ সম্পন্ন হয়নি'})। টাকা মূল ব্যালেন্সে রিফান্ড করা হয়েছে।`,
        createdAt: new Date().toISOString(),
      });
    }

    // Trigger SMS / Email event notification
    if (this.smsService && updatedRequest) {
      const isApproved = updatedRequest.status === 'APPROVED';
      const eventKey = isApproved ? 'withdraw_approved' : 'withdraw_rejected';
      const user = (updatedRequest as any).user;
      const amountVal = String(updatedRequest.amount || 0);
      const netVal = String(updatedRequest.netAmount || 0);

      this.smsService
        .triggerEventNotification({
          eventKey,
          recipientPhone: user?.phone || undefined,
          recipientEmail: user?.email || undefined,
          variables: {
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
            amount: amountVal,
            netAmount: netVal,
            method: (updatedRequest as any).method?.name || updatedRequest.destinationAccount || '',
            txId: updatedRequest.id || '',
            reason: dto.adminNotes || '',
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          },
          lang: 'bn',
        })
        .catch(() => {});
    }

    return updatedRequest;
  }

  /**
   * Admin manual balance adjustment with mandatory audit reason (Rule 7 & Spec #49)
   */
  async adminAdjustWallet(adminId: string, dto: AdminWalletAdjustmentDto) {
    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new BadRequestException('A descriptive reason is mandatory for financial adjustment');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: dto.userId },
      });

      if (!wallet) {
        throw new NotFoundException('Target user wallet not found');
      }

      const availAdj = new Prisma.Decimal(dto.availableAdjustment || 0);
      const holdAdj = new Prisma.Decimal(dto.holdAdjustment || 0);

      const availBefore = wallet.availableBalance;
      const availAfter = availBefore.add(availAdj);
      const holdBefore = wallet.holdBalance;
      const holdAfter = holdBefore.add(holdAdj);

      if (availAfter.lessThan(0) || holdAfter.lessThan(0)) {
        throw new BadRequestException('Adjustment would result in negative balance');
      }

      const updateRes = await tx.wallet.updateMany({
        where: { id: wallet.id, version: wallet.version },
        data: {
          availableBalance: availAfter,
          holdBalance: holdAfter,
          version: { increment: 1 },
        },
      });
      if (updateRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }
      const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });

      // Write to immutable ledger
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          userId: dto.userId,
          type: 'ADMIN_ADJUSTMENT',
          amount: availAdj,
          commission: new Prisma.Decimal(0),
          balanceBefore: availBefore,
          balanceAfter: availAfter,
          holdBefore,
          holdAfter,
          notes: `Admin Manual Adjustment: ${dto.reason.trim()}`,
          status: 'COMPLETED',
          createdBy: adminId,
        },
      });

      // Write to AuditLog
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'WALLET_ADJUST',
          targetEntity: 'Wallet',
          targetId: wallet.id,
          beforeState: { availableBalance: availBefore.toString(), holdBalance: holdBefore.toString() },
          afterState: { availableBalance: availAfter.toString(), holdBalance: holdAfter.toString() },
          reason: dto.reason.trim(),
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Admin Hold Balance Management: Release to Receiver or Refund to Sender (Spec #37)
   */
  async resolveHoldBalance(holdId: string, adminId: string, dto: HoldResolutionDto) {
    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.walletHold.findUnique({
        where: { id: holdId },
        include: {
          wallet: true,
        },
      });

      if (!hold || hold.status !== 'HELD') {
        throw new BadRequestException('Hold record not found or already resolved');
      }

      const holdAmount = hold.amount;

      // Find the associated transaction
      const transaction = await tx.transaction.findUnique({
        where: { id: hold.transactionId },
        include: {
          sender: { include: { wallet: true } },
          receiver: { include: { wallet: true } },
        },
      });

      if (!transaction || !transaction.sender.wallet || !transaction.receiver.wallet) {
        throw new BadRequestException('Transaction or associated wallets not found');
      }

      const senderWallet = transaction.sender.wallet;
      const receiverWallet = transaction.receiver.wallet;

      if (dto.action === 'RELEASE') {
        // Release: Deduct from sender's hold balance, credit to receiver's available balance
        const senderHoldBefore = senderWallet.holdBalance;
        const senderHoldAfter = senderHoldBefore.sub(holdAmount);
        const receiverAvailBefore = receiverWallet.availableBalance;
        const receiverAvailAfter = receiverAvailBefore.add(transaction.amount);

        const senderRes = await tx.wallet.updateMany({
          where: { id: senderWallet.id, version: senderWallet.version },
          data: {
            holdBalance: senderHoldAfter.lessThan(0) ? new Prisma.Decimal(0) : senderHoldAfter,
            version: { increment: 1 },
          },
        });

        const receiverRes = await tx.wallet.updateMany({
          where: { id: receiverWallet.id, version: receiverWallet.version },
          data: {
            availableBalance: receiverAvailAfter,
            version: { increment: 1 },
          },
        });

        if (senderRes.count === 0 || receiverRes.count === 0) {
          throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
        }

        await tx.walletHold.update({
          where: { id: holdId },
          data: {
            status: 'RELEASED',
            releasedAt: new Date(),
            notes: dto.notes,
          },
        });

        // Ledger for sender
        await tx.walletLedger.create({
          data: {
            walletId: senderWallet.id,
            userId: transaction.senderId,
            transactionId: hold.transactionId,
            type: 'HOLD_RELEASE',
            amount: holdAmount,
            balanceBefore: senderWallet.availableBalance,
            balanceAfter: senderWallet.availableBalance,
            holdBefore: senderHoldBefore,
            holdAfter: senderHoldAfter,
            referenceId: hold.id,
            referenceType: 'WALLET_HOLD_RELEASE',
            notes: `Admin released hold balance to ${transaction.receiver.firstName} ${transaction.receiver.lastName}: ${dto.notes || 'Admin approval'}`,
            createdBy: adminId,
          },
        });

        // Ledger for receiver
        await tx.walletLedger.create({
          data: {
            walletId: receiverWallet.id,
            userId: transaction.receiverId,
            transactionId: hold.transactionId,
            type: 'TRANSFER_IN',
            amount: transaction.amount,
            balanceBefore: receiverAvailBefore,
            balanceAfter: receiverAvailAfter,
            holdBefore: receiverWallet.holdBalance,
            holdAfter: receiverWallet.holdBalance,
            referenceId: hold.id,
            referenceType: 'PAY_REQUEST_RECEIVED',
            notes: `Payment released by Admin from ${transaction.sender.firstName} ${transaction.sender.lastName}`,
            createdBy: adminId,
          },
        });

        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'RELEASED',
            statusHistory: {
              create: {
                fromStatus: transaction.status,
                toStatus: 'RELEASED',
                changedById: adminId,
                reason: dto.notes || 'Hold released by Admin to receiver',
              },
            },
          },
        });

        // If part of a conversation, update chat cards and post notice
        if (transaction.conversationId) {
          const messages = await tx.message.findMany({
            where: { conversationId: transaction.conversationId, messageType: 'PAY_REQUEST' },
          });
          for (const m of messages) {
            const meta = (m.metadata as any) || {};
            if (meta.transactionId === transaction.id || meta.trackingNumber === transaction.trackingNumber) {
              await tx.message.update({
                where: { id: m.id },
                data: { metadata: { ...meta, status: 'COMPLETED' } },
              });
            }
          }

          await tx.message.create({
            data: {
              conversationId: transaction.conversationId,
              senderId: transaction.receiverId,
              messageType: 'SYSTEM',
              content: `✓ Payment Released by Admin\n\n৳${transaction.amount} has been released to ${transaction.receiver.firstName} ${transaction.receiver.lastName}.\nTracking: ${transaction.trackingNumber}`,
              metadata: {
                transactionId: transaction.id,
                trackingNumber: transaction.trackingNumber,
                status: 'COMPLETED',
                amount: Number(transaction.amount),
              },
            },
          });

          await tx.conversation.update({
            where: { id: transaction.conversationId },
            data: { updatedAt: new Date() },
          });
        }

        return { message: 'Hold released to receiver available balance' };
      } else {
        // Refund: Deduct from sender's hold balance, credit back to sender's available balance
        const senderHoldBefore = senderWallet.holdBalance;
        const senderHoldAfter = senderHoldBefore.sub(holdAmount);
        const senderAvailBefore = senderWallet.availableBalance;
        const senderAvailAfter = senderAvailBefore.add(holdAmount);

        const updateRes = await tx.wallet.updateMany({
          where: { id: senderWallet.id, version: senderWallet.version },
          data: {
            holdBalance: senderHoldAfter.lessThan(0) ? new Prisma.Decimal(0) : senderHoldAfter,
            availableBalance: senderAvailAfter,
            version: { increment: 1 },
          },
        });
        if (updateRes.count === 0) {
          throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
        }

        await tx.walletHold.update({
          where: { id: holdId },
          data: {
            status: 'REFUNDED',
            releasedAt: new Date(),
            notes: dto.notes,
          },
        });

        await tx.walletLedger.create({
          data: {
            walletId: senderWallet.id,
            userId: transaction.senderId,
            transactionId: hold.transactionId,
            type: 'HOLD_REFUND',
            amount: holdAmount,
            balanceBefore: senderAvailBefore,
            balanceAfter: senderAvailAfter,
            holdBefore: senderHoldBefore,
            holdAfter: senderHoldAfter,
            referenceId: hold.id,
            referenceType: 'WALLET_HOLD_REFUND',
            notes: `Admin refunded held transaction amount back to sender: ${dto.notes || 'Admin refund'}`,
            createdBy: adminId,
          },
        });

        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'REFUNDED',
            statusHistory: {
              create: {
                fromStatus: transaction.status,
                toStatus: 'REFUNDED',
                changedById: adminId,
                reason: dto.notes || 'Hold refunded by Admin back to sender',
              },
            },
          },
        });

        // If part of a conversation, update chat cards and post notice
        if (transaction.conversationId) {
          const messages = await tx.message.findMany({
            where: { conversationId: transaction.conversationId, messageType: 'PAY_REQUEST' },
          });
          for (const m of messages) {
            const meta = (m.metadata as any) || {};
            if (meta.transactionId === transaction.id || meta.trackingNumber === transaction.trackingNumber) {
              await tx.message.update({
                where: { id: m.id },
                data: { metadata: { ...meta, status: 'REJECTED' } },
              });
            }
          }

          await tx.message.create({
            data: {
              conversationId: transaction.conversationId,
              senderId: transaction.senderId,
              messageType: 'SYSTEM',
              content: `✕ Payment Refunded by Admin\n\n৳${transaction.amount} has been returned to ${transaction.sender.firstName} ${transaction.sender.lastName}'s Main Balance.\nTracking: ${transaction.trackingNumber}`,
              metadata: {
                transactionId: transaction.id,
                trackingNumber: transaction.trackingNumber,
                status: 'REJECTED',
                amount: Number(transaction.amount),
              },
            },
          });

          await tx.conversation.update({
            where: { id: transaction.conversationId },
            data: { updatedAt: new Date() },
          });
        }

        return { message: 'Hold refunded back to sender available balance' };
      }
    });
  }

  /**
   * Admin sets warning date/time for hold balance (Spec #38)
   */
  async setHoldWarning(holdId: string, warningDate: string, warningTime: string, notes?: string) {
    return this.prisma.walletHold.update({
      where: { id: holdId },
      data: {
        warningDate: new Date(warningDate),
        warningTime,
        notes,
      },
    });
  }

  /**
   * Fetch all holds for admin inspection with enriched transaction and sender/receiver details
   */
  async getAllHolds() {
    const holds = await this.prisma.walletHold.findMany({
      include: {
        wallet: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transactionIds = holds.map((h) => h.transactionId).filter(Boolean);
    const transactions = await this.prisma.transaction.findMany({
      where: { id: { in: transactionIds } },
      include: {
        sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, phone: true, email: true } },
        receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, phone: true, email: true } },
      },
    });

    const txnMap = new Map(transactions.map((t) => [t.id, t]));

    return holds.map((h) => ({
      ...h,
      transaction: txnMap.get(h.transactionId) || null,
    }));
  }

  /**
   * Admin fetches all recharge requests with filtering
   */
  async getAllRecharges(query: { status?: any; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.rechargeRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          method: true,
          assignedTo: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rechargeRequest.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin fetches all withdrawal requests with filtering
   */
  async getAllWithdrawals(query: { status?: any; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          method: true,
          assignedTo: {
            select: {
              id: true,
              uniqueUserId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
