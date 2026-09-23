import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { ChatGateway } from '../chat/chat.gateway';
import { TelegramService } from '../telegram/telegram.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import {
  CreateTransactionDto,
  RejectTransactionDto,
  ReviewWorkDoneDto,
  SetWorkTimeDto,
  SubmitWorkDoneDto,
} from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    @Optional() private chatGateway?: ChatGateway,
    @Optional()
    @Inject(forwardRef(() => TelegramService))
    private telegramService?: TelegramService,
    @Optional()
    @Inject(forwardRef(() => AffiliateService))
    private affiliateService?: AffiliateService,
  ) {}

  /**
   * Generates a unique tracking number: TXN-YYYYMMDD-XXXXXXXX (Spec #87)
   */
  private generateTrackingNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN-${dateStr}-${randomHex}`;
  }

  /**
   * Initiate a safe transaction (e.g. from chat or product page)
   */
  async createTransaction(currentUserId: string, dto: CreateTransactionDto) {
    let senderId = currentUserId;
    let receiverId = dto.receiverId;

    if (dto.isMoneyRequest && dto.payerId) {
      // Current user is requesting money from dto.payerId
      senderId = dto.payerId;
      receiverId = currentUserId;
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Sender and receiver cannot be the same user');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver || !receiver.isActive) {
      throw new NotFoundException('Receiver user not found or inactive');
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });
    if (!sender || !sender.isActive) {
      throw new NotFoundException('Sender user not found or inactive');
    }

    // Check commission
    const commissionResult = await this.commissionService.calculateCommission({
      amount: dto.amount,
      transactionType: dto.transactionType,
    });

    const totalRequired = commissionResult.totalRequired;

    // If current user is the payer (direct payment request), check balance immediately
    if (senderId === currentUserId) {
      const senderWallet = await this.prisma.wallet.findUnique({
        where: { userId: senderId },
      });

      if (!senderWallet || senderWallet.availableBalance.lessThan(totalRequired)) {
        throw new BadRequestException({
          message: `Insufficient balance. Required: ৳${totalRequired} (Amount: ৳${dto.amount} + Commission: ৳${commissionResult.commissionAmount}), Available: ৳${senderWallet?.availableBalance || 0}`,
          code: 'INSUFFICIENT_BALANCE',
        });
      }
    }

    const trackingNumber = this.generateTrackingNumber();

    const transaction = await this.prisma.transaction.create({
      data: {
        trackingNumber,
        conversationId: dto.conversationId,
        senderId,
        receiverId,
        productId: dto.productId,
        transactionType: dto.transactionType || 'GENERAL_TRANSACTION',
        amount: new Prisma.Decimal(dto.amount),
        commissionAmount: commissionResult.commissionAmount,
        totalRequired,
        status: 'REQUESTED',
        workExpectedDuration: dto.expectedDuration,
        statusHistory: {
          create: {
            fromStatus: 'DRAFT',
            toStatus: 'REQUESTED',
            changedById: currentUserId,
            reason: dto.notes || (dto.isMoneyRequest ? 'Payment requested' : 'Payment request initiated'),
          },
        },
      },
      include: {
        sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        product: true,
      },
    });

    if (this.chatGateway && transaction) {
      const amtNum = Number(transaction.amount || 0);
      this.chatGateway.notifyAdmins('notification:admin', {
        type: 'TRANSACTION_CREATED',
        title: 'নতুন লেনদেন শুরু হয়েছে',
        message: `৳${amtNum.toLocaleString()} টাকার নতুন এসক্রো লেনদেন শুরু হয়েছে (${transaction.trackingNumber})।`,
        targetUrl: '/admin/transactions',
        data: {
          transactionId: transaction.id,
          trackingNumber: transaction.trackingNumber,
          amount: amtNum,
        },
        createdAt: new Date().toISOString(),
      });
    }

    return transaction;
  }

  /**
   * Receiver accepts or rejects the transaction request
   */
  async respondToRequest(transactionId: string, userId: string, action: 'APPROVE' | 'REJECT', reason?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'REQUESTED') {
      throw new BadRequestException(`Cannot respond to transaction in status ${transaction.status}`);
    }

    // Either receiver or sender can respond depending on who initiated
    if (transaction.receiverId !== userId && transaction.senderId !== userId) {
      throw new ForbiddenException('Not authorized to respond to this transaction');
    }

    if (action === 'REJECT') {
      return this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'REJECTED',
          rejectReason: reason || 'Rejected by user',
          statusHistory: {
            create: {
              fromStatus: transaction.status,
              toStatus: 'REJECTED',
              changedById: userId,
              reason,
            },
          },
        },
      });
    }

    // Approved: verify sender balance still covers totalRequired
    const senderWallet = await this.prisma.wallet.findUnique({
      where: { userId: transaction.senderId },
    });

    if (!senderWallet || senderWallet.availableBalance.lessThan(transaction.totalRequired)) {
      throw new BadRequestException({
        message: 'Sender has insufficient balance to proceed with transaction',
        code: 'INSUFFICIENT_BALANCE',
      });
    }

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        statusHistory: {
          create: {
            fromStatus: transaction.status,
            toStatus: 'APPROVED',
            changedById: userId,
            reason: 'Transaction approved',
          },
        },
      },
    });
  }

  /**
   * Receiver sets Work Time (Spec #33)
   */
  async setWorkTime(transactionId: string, receiverId: string, dto: SetWorkTimeDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.receiverId !== receiverId) {
      throw new ForbiddenException('Only the receiver can set working schedule');
    }

    if (transaction.status !== 'APPROVED' && transaction.status !== 'WORKING') {
      throw new BadRequestException('Transaction must be in APPROVED or WORKING status');
    }

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'WORKING',
        workStartTime: dto.workStartTime ? new Date(dto.workStartTime) : new Date(),
        workEndTime: dto.workEndTime ? new Date(dto.workEndTime) : null,
        workExpectedDuration: dto.expectedDuration,
        statusHistory: {
          create: {
            fromStatus: transaction.status,
            toStatus: 'WORKING',
            changedById: receiverId,
            reason: `Work time scheduled: ${dto.expectedDuration || 'Custom timeline'}`,
          },
        },
      },
    });
  }

  /**
   * Receiver submits Work Done (Spec #34)
   */
  async submitWorkDone(transactionId: string, receiverId: string, dto: SubmitWorkDoneDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.receiverId !== receiverId) {
      throw new ForbiddenException('Only the receiver can submit work done');
    }

    if (transaction.status !== 'WORKING' && transaction.status !== 'APPROVED') {
      throw new BadRequestException('Transaction is not in progress');
    }

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'WORK_COMPLETED',
        workCompletedAt: new Date(),
        workLogs: {
          create: {
            submittedById: receiverId,
            workDescription: dto.workDescription,
            proofUrls: dto.proofUrls || [],
            status: 'SUBMITTED',
          },
        },
        statusHistory: {
          create: {
            fromStatus: transaction.status,
            toStatus: 'WORK_COMPLETED',
            changedById: receiverId,
            reason: 'Work completed and submitted for buyer approval',
          },
        },
      },
      include: { workLogs: true },
    });
  }

  /**
   * Sender approves or rejects Work Done (Spec #35, #36)
   * On Approve:
   * 1. Sender Available Balance deducted by Total Required (Amount + Commission).
   * 2. Commission recorded in ledger.
   * 3. Net Amount credited to Receiver's **Hold Balance** (NOT Available Balance!).
   * 4. WalletHold record created.
   * 5. Status becomes HOLD.
   */
  async reviewWorkDone(transactionId: string, senderId: string, dto: ReviewWorkDoneDto) {
    const res = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          sender: { include: { wallet: true } },
          receiver: { include: { wallet: true } },
        },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.senderId !== senderId) {
        throw new ForbiddenException('Only the buyer/sender can review completed work');
      }

      if (transaction.status !== 'WORK_COMPLETED') {
        throw new BadRequestException('Work has not been submitted or is already processed');
      }

      if (dto.action === 'REJECT') {
        return tx.transaction.update({
          where: { id: transactionId },
          data: {
            rejectReason: dto.feedback || 'Work rejected by buyer',
            statusHistory: {
              create: {
                fromStatus: transaction.status,
                toStatus: 'WORKING', // Returns to working so seller can revise
                changedById: senderId,
                reason: `Work rejected: ${dto.feedback}`,
              },
            },
            status: 'WORKING',
          },
        });
      }

      // Sender approves work done
      const senderWallet = transaction.sender.wallet!;
      const receiverWallet = transaction.receiver.wallet!;

      // Validate sender balance
      if (senderWallet.availableBalance.lessThan(transaction.totalRequired)) {
        throw new BadRequestException({
          message: 'Insufficient balance to complete transaction release',
          code: 'INSUFFICIENT_BALANCE',
        });
      }

      // 1. Deduct from sender available balance
      const senderAvailBefore = senderWallet.availableBalance;
      const senderAvailAfter = senderAvailBefore.sub(transaction.totalRequired);

      const senderRes = await tx.wallet.updateMany({
        where: { id: senderWallet.id, version: senderWallet.version },
        data: {
          availableBalance: senderAvailAfter,
          version: { increment: 1 },
        },
      });
      if (senderRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }

      // Sender ledger entry
      await tx.walletLedger.create({
        data: {
          walletId: senderWallet.id,
          userId: senderId,
          transactionId: transaction.id,
          type: 'TRANSFER_OUT',
          amount: transaction.amount,
          commission: transaction.commissionAmount,
          balanceBefore: senderAvailBefore,
          balanceAfter: senderAvailAfter,
          holdBefore: senderWallet.holdBalance,
          holdAfter: senderWallet.holdBalance,
          referenceId: transaction.id,
          referenceType: 'SAFE_TRANSACTION',
          notes: `Payment for transaction ${transaction.trackingNumber} (Amount: ৳${transaction.amount}, Commission: ৳${transaction.commissionAmount})`,
          status: 'COMPLETED',
          createdBy: senderId,
        },
      });

      // 2. Credit to receiver's HOLD balance (Spec #36: NOT Available Balance!)
      const receiverHoldBefore = receiverWallet.holdBalance;
      const receiverHoldAfter = receiverHoldBefore.add(transaction.amount);

      const receiverRes = await tx.wallet.updateMany({
        where: { id: receiverWallet.id, version: receiverWallet.version },
        data: {
          holdBalance: receiverHoldAfter,
          version: { increment: 1 },
        },
      });
      if (receiverRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }

      // Create WalletHold record
      await tx.walletHold.create({
        data: {
          walletId: receiverWallet.id,
          userId: transaction.receiverId,
          transactionId: transaction.id,
          amount: transaction.amount,
          status: 'HELD',
          notes: `Safe transaction escrow hold pending final clearance or admin review`,
        },
      });

      // Receiver ledger entry
      await tx.walletLedger.create({
        data: {
          walletId: receiverWallet.id,
          userId: transaction.receiverId,
          transactionId: transaction.id,
          type: 'HOLD_LOCK',
          amount: transaction.amount,
          commission: new Prisma.Decimal(0),
          balanceBefore: receiverWallet.availableBalance,
          balanceAfter: receiverWallet.availableBalance,
          holdBefore: receiverHoldBefore,
          holdAfter: receiverHoldAfter,
          referenceId: transaction.id,
          referenceType: 'SAFE_TRANSACTION_HOLD',
          notes: `Earned ৳${transaction.amount} from transaction ${transaction.trackingNumber} locked in Hold Balance`,
          status: 'COMPLETED',
          createdBy: senderId,
        },
      });

      // Update transaction status to HOLD
      return tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'HOLD',
          statusHistory: {
            create: {
              fromStatus: transaction.status,
              toStatus: 'HOLD',
              changedById: senderId,
              reason: 'Buyer approved work done. Funds moved to seller hold balance.',
            },
          },
        },
      });
    });

    if (this.chatGateway && res) {
      if (res.status === 'HOLD') {
        this.chatGateway.notifyAdmins('notification:admin', {
          type: 'TRANSACTION_COMPLETED',
          title: 'কাজ অনুমোদিত হয়েছে!',
          message: `লেনদেনের কাজ ক্রেতা অনুমোদন করেছেন (${res.trackingNumber || transactionId})। টাকা হোল্ডে জমা হয়েছে।`,
          targetUrl: '/admin/transactions',
          data: { transactionId },
          createdAt: new Date().toISOString(),
        });
      }
    }

    return res;
  }

  /**
   * Release hold balance automatically or by user confirmation if no dispute (Spec #37)
   */
  async releaseHoldToAvailable(transactionId: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { receiver: { include: { wallet: true } } },
      });

      if (!transaction || transaction.status !== 'HOLD') {
        throw new BadRequestException('Transaction is not in HOLD status');
      }

      const hold = await tx.walletHold.findFirst({
        where: { transactionId, status: 'HELD' },
      });

      if (!hold) {
        throw new NotFoundException('Active hold record not found');
      }

      const receiverWallet = transaction.receiver.wallet!;
      const holdBefore = receiverWallet.holdBalance;
      const holdAfter = holdBefore.sub(hold.amount);
      const availBefore = receiverWallet.availableBalance;
      const availAfter = availBefore.add(hold.amount);

      const receiverRes = await tx.wallet.updateMany({
        where: { id: receiverWallet.id, version: receiverWallet.version },
        data: {
          holdBalance: holdAfter,
          availableBalance: availAfter,
          version: { increment: 1 },
        },
      });
      if (receiverRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }

      await tx.walletHold.update({
        where: { id: hold.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      await tx.walletLedger.create({
        data: {
          walletId: receiverWallet.id,
          userId: transaction.receiverId,
          transactionId: transaction.id,
          type: 'HOLD_RELEASE',
          amount: hold.amount,
          balanceBefore: availBefore,
          balanceAfter: availAfter,
          holdBefore,
          holdAfter,
          referenceId: transaction.id,
          referenceType: 'SAFE_TRANSACTION_RELEASE',
          notes: `Hold balance released to available balance for transaction ${transaction.trackingNumber}`,
          status: 'COMPLETED',
          createdBy: actorId,
        },
      });

      return tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'RELEASED',
          statusHistory: {
            create: {
              fromStatus: 'HOLD',
              toStatus: 'RELEASED',
              changedById: actorId,
              reason: 'Hold balance successfully cleared and released to receiver',
            },
          },
        },
      });
    });
  }

  /**
   * Fetch single transaction details
   */
  async getTransactionById(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
        receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
        product: { select: { id: true, title: true, slug: true, price: true, productType: true } },
        workLogs: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        dispute: { include: { evidences: true, actions: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Fetch user's transactions with status filter
   */
  async getMyTransactions(userId: string, status?: TransactionStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {
      OR: [{ senderId: userId }, { receiverId: userId }],
    };
    if (status && (status as string) !== 'ALL') {
      const statusMap: Record<string, string> = {
        IN_PROGRESS: 'WORKING',
        WORK_DONE_SUBMITTED: 'WORK_COMPLETED',
        COMPLETED: 'RELEASED',
      };
      const resolvedStatus = statusMap[status as string] || (status as string);
      const validStatuses = [
        'DRAFT', 'REQUESTED', 'APPROVED', 'WORKING', 'WORK_COMPLETED',
        'HOLD', 'RELEASED', 'REJECTED', 'CANCELLED', 'DISPUTED', 'REFUNDED'
      ];
      if (validStatuses.includes(resolvedStatus)) {
        where.status = resolvedStatus as any;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          product: { select: { id: true, title: true, slug: true } },
          dispute: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
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
   * Fetch all transactions for admin with filters
   */
  async getAllTransactionsForAdmin(query: any) {
    const { status, transactionType, search } = query;
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status && status !== 'ALL') {
      const statusMap: Record<string, string> = {
        IN_PROGRESS: 'WORKING',
        WORK_DONE_SUBMITTED: 'WORK_COMPLETED',
        COMPLETED: 'RELEASED',
      };
      const resolvedStatus = statusMap[status] || status;
      const validStatuses = [
        'DRAFT', 'REQUESTED', 'APPROVED', 'WORKING', 'WORK_COMPLETED',
        'HOLD', 'RELEASED', 'REJECTED', 'CANCELLED', 'DISPUTED', 'REFUNDED'
      ];
      if (validStatuses.includes(resolvedStatus)) {
        where.status = resolvedStatus as any;
      }
    }

    if (transactionType) where.transactionType = transactionType;
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search } },
        { sender: { uniqueUserId: { contains: search } } },
        { receiver: { uniqueUserId: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, phone: true, email: true, avatarUrl: true } },
          receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, phone: true, email: true, avatarUrl: true } },
          product: { select: { id: true, title: true } },
          dispute: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Messenger Pay Request with Instant Escrow Hold on Payer Balance (Spec #8, #9)
   */
  async createPayRequest(
    senderId: string,
    dto: { receiverId: string; amount: number; notes?: string; conversationId?: string },
  ) {
    if (senderId === dto.receiverId) {
      throw new BadRequestException('Sender and receiver cannot be the same user');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver || !receiver.isActive) {
      throw new NotFoundException('Receiver user not found or inactive');
    }

    const commissionResult = await this.commissionService.calculateCommission({
      amount: dto.amount,
      transactionType: 'GENERAL_TRANSACTION',
    });

    const totalRequired = commissionResult.totalRequired;

    let convId = dto.conversationId;
    if (!convId) {
      const existingConv = await this.prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: senderId } } },
            { participants: { some: { userId: dto.receiverId } } },
          ],
        },
      });
      if (existingConv) {
        convId = existingConv.id;
      } else {
        const newConv = await this.prisma.conversation.create({
          data: {
            type: 'DIRECT',
            participants: {
              create: [{ userId: senderId }, { userId: dto.receiverId }],
            },
          },
        });
        convId = newConv.id;
      }
    }

    const trackingNumber = this.generateTrackingNumber();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Verify sender has sufficient available balance
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: senderId },
      });

      if (!senderWallet || senderWallet.availableBalance.lessThan(totalRequired)) {
        throw new BadRequestException({
          message: `Insufficient balance. Required: ৳${totalRequired} (Amount: ৳${dto.amount} + Fee: ৳${commissionResult.commissionAmount}), Available: ৳${senderWallet?.availableBalance || 0}`,
          code: 'INSUFFICIENT_BALANCE',
        });
      }

      const senderUser = await tx.user.findUnique({
        where: { id: senderId },
        select: { id: true, firstName: true, lastName: true, uniqueUserId: true, avatarUrl: true },
      });

      // 2. Create Transaction in REQUESTED status (No balance deduction yet)
      const transaction = await tx.transaction.create({
        data: {
          trackingNumber,
          conversationId: convId,
          senderId,
          receiverId: dto.receiverId,
          transactionType: 'GENERAL_TRANSACTION',
          amount: new Prisma.Decimal(dto.amount),
          commissionAmount: commissionResult.commissionAmount,
          totalRequired,
          status: 'REQUESTED',
          statusHistory: {
            create: {
              fromStatus: 'DRAFT',
              toStatus: 'REQUESTED',
              changedById: senderId,
              reason: dto.notes || 'Pay Request initiated by sender',
            },
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      // 3. Create in-chat Message with PAY_REQUEST type
      const inChatMessage = await tx.message.create({
        data: {
          conversationId: convId!,
          senderId,
          content: dto.notes || `💸 Pay Request: ৳${dto.amount}`,
          messageType: 'PAY_REQUEST',
          metadata: {
            transactionId: transaction.id,
            trackingNumber,
            amount: dto.amount,
            commissionAmount: Number(commissionResult.commissionAmount),
            totalRequired: Number(totalRequired),
            status: 'REQUESTED',
            reason: dto.notes || 'Service Payment',
            senderId,
            receiverId: dto.receiverId,
            initiatorRole: 'SENDER',
            senderName: `${senderUser?.firstName || ''} ${senderUser?.lastName || ''}`.trim(),
            senderUniqueId: senderUser?.uniqueUserId || '',
            senderNote: dto.notes || '',
            adminNote: 'সেফনেক্সবিডি এসক্রো সুরক্ষা: আপনি Approve করলে প্রেরকের অ্যাকাউন্ট থেকে টাকা কেটে এসক্রো হোল্ডে লক হবে এবং কাজ শেষে রিলিজ পাবেন।',
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          attachments: true,
        },
      });

      await tx.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });

      const messageWithAttachments = {
        ...inChatMessage,
        attachments: (inChatMessage.attachments || []).map((att) => ({
          ...att,
          fileSize: Number(att.fileSize || 0),
        })),
      };

      return {
        transaction,
        message: messageWithAttachments,
        senderUser,
      };
    });

    const gw = this.chatGateway;
    if (gw) {
      if (convId) {
        gw.broadcastNewMessage(result.message, convId, senderId);
      }

      const senderFullName =
        `${result.senderUser?.firstName || ''} ${result.senderUser?.lastName || ''}`.trim() ||
        result.senderUser?.uniqueUserId ||
        'User';

      gw.notifyUser(dto.receiverId, 'notification:pay_request', {
        conversationId: convId,
        transactionId: result.transaction.id,
        trackingNumber,
        amount: dto.amount,
        senderName: senderFullName,
        senderAvatar: result.senderUser?.avatarUrl,
        title: 'নতুন পে-রিকোয়েস্ট (Pay Request)',
        message: `${senderFullName} আপনাকে ৳${dto.amount} এর পে-রিকোয়েস্ট পাঠিয়েছেন।`,
      });

      gw.notifyAdmins('notification:admin', {
        type: 'PAY_REQUEST',
        title: 'নতুন পে-রিকোয়েস্ট',
        message: `${senderFullName} চ্যাটে ৳${dto.amount} এর পে-রিকোয়েস্ট পাঠিয়েছেন। (TRX: ${trackingNumber})`,
        targetUrl: `/admin/cms`,
        createdAt: new Date().toISOString(),
      });
    }

    // Trigger Telegram Notification for recipient and admin
    if (this.telegramService) {
      const senderFullName =
        `${result.senderUser?.firstName || ''} ${result.senderUser?.lastName || ''}`.trim() ||
        result.senderUser?.uniqueUserId ||
        'User';

      this.telegramService
        .sendUserAlert(
          dto.receiverId,
          'escrowPayRequest',
          {
            senderName: senderFullName,
            senderUniqueId: result.senderUser?.uniqueUserId || 'User',
            amount: dto.amount,
            transactionId: result.transaction.id,
            trackingNumber,
            notes: dto.notes || 'Service Payment',
          },
          [
            {
              text: `💬 চ্যাটে দেখুন (@${result.senderUser?.uniqueUserId || 'User'})`,
              callback_data: `chat_with_${senderId}`,
            },
          ],
        )
        .catch(() => null);

      // Send Pay Request Alert to Admin Telegram Group
      try {
        const settings = await this.telegramService.getSettings();
        if (settings.isEnabled && settings.botToken && settings.adminGroupId) {
          const text = `💸 <b>[Admin Alert] নতুন পে-রিকোয়েস্ট!</b>\n\n👤 প্রেরক: <b>${senderFullName}</b> (@${result.senderUser?.uniqueUserId || 'N/A'})\n💰 পরিমাণ: <b>৳${dto.amount}</b>\n📦 TRX: <code>${trackingNumber}</code>\n⏰ সময়: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}`;

          await this.telegramService.callApi(settings.botToken, 'sendMessage', {
            chat_id: settings.adminGroupId,
            text,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '👁️ অ্যাডমিন প্যানেলে দেখুন',
                    url: `${settings.miniAppUrl || 'https://safnexbd.com'}/admin/cms`,
                  },
                ],
              ],
            },
          });
        }
      } catch (err: any) {
        // silently ignore admin group alert failures
      }
    }

    return {
      transaction: result.transaction,
      message: result.message,
    };
  }


  /**
   * Accept Pay Request: Receiver approves REQUESTED proposal, locking funds into Escrow Hold
   */
  async acceptPayRequest(transactionId: string, actorId: string, isAdmin: boolean = false) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sender: { include: { wallet: true } },
        receiver: { include: { wallet: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'REQUESTED') {
      throw new BadRequestException(`Cannot accept transaction with status ${transaction.status}. Must be in REQUESTED status.`);
    }

    // Authorization: If initiated by sender, receiver approves. If initiated by receiver, sender approves.
    const isParty = transaction.senderId === actorId || transaction.receiverId === actorId;
    if (!isParty && !isAdmin) {
      throw new ForbiddenException('Not authorized to approve this request');
    }

    const updatedTx = await this.prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: transaction.senderId },
      });

      if (!senderWallet || senderWallet.availableBalance.lessThan(transaction.totalRequired)) {
        throw new BadRequestException({
          message: `Sender has insufficient balance to approve this payment. Required: ৳${transaction.totalRequired}, Available: ৳${senderWallet?.availableBalance || 0}`,
          code: 'INSUFFICIENT_BALANCE',
        });
      }

      // 1. Deduct sender available balance, credit sender hold balance
      const senderAvailBefore = senderWallet.availableBalance;
      const senderAvailAfter = senderAvailBefore.sub(transaction.totalRequired);
      const senderHoldBefore = senderWallet.holdBalance;
      const senderHoldAfter = senderHoldBefore.add(transaction.amount);

      const senderRes = await tx.wallet.updateMany({
        where: { id: senderWallet.id, version: senderWallet.version },
        data: {
          availableBalance: senderAvailAfter,
          holdBalance: senderHoldAfter,
          version: { increment: 1 },
        },
      });
      if (senderRes.count === 0) {
        throw new ConflictException('Concurrent wallet transaction detected. Please retry.');
      }

      // 2. Create WalletHold record
      await tx.walletHold.create({
        data: {
          walletId: senderWallet.id,
          userId: transaction.senderId,
          transactionId: transaction.id,
          amount: transaction.amount,
          status: 'HELD',
          notes: `Escrow hold for transaction ${transaction.trackingNumber}`,
        },
      });

      // 3. Create WalletLedger entry for sender (HOLD_LOCK)
      await tx.walletLedger.create({
        data: {
          walletId: senderWallet.id,
          userId: transaction.senderId,
          transactionId: transaction.id,
          type: 'HOLD_LOCK',
          amount: transaction.totalRequired,
          commission: transaction.commissionAmount,
          balanceBefore: senderAvailBefore,
          balanceAfter: senderAvailAfter,
          holdBefore: senderHoldBefore,
          holdAfter: senderHoldAfter,
          referenceId: transaction.id,
          referenceType: 'PAY_REQUEST_HOLD',
          notes: `৳${transaction.amount} placed in Escrow Hold (+ ৳${transaction.commissionAmount} commission)`,
          status: 'COMPLETED',
          createdBy: actorId,
        },
      });

      // 4. Update Transaction status to HOLD
      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'HOLD',
          statusHistory: {
            create: {
              fromStatus: 'REQUESTED',
              toStatus: 'HOLD',
              changedById: actorId,
              reason: 'Request approved and funds placed into escrow hold',
            },
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      // 5. Update in-chat message metadata
      if (transaction.conversationId) {
        const messages = await tx.message.findMany({
          where: {
            conversationId: transaction.conversationId,
            messageType: { in: ['PAY_REQUEST', 'RECEIVE_REQUEST'] },
          },
        });
        for (const m of messages) {
          const meta = (m.metadata as any) || {};
          if (meta.transactionId === transaction.id || meta.trackingNumber === transaction.trackingNumber) {
            await tx.message.update({
              where: { id: m.id },
              data: {
                metadata: {
                  ...meta,
                  status: 'HOLD',
                },
              },
            });
          }
        }

        // 6. Automatic system message
        await tx.message.create({
          data: {
            conversationId: transaction.conversationId,
            senderId: actorId,
            messageType: 'SYSTEM',
            content: `🔒 এসক্রো লক সক্রিয় (Escrow Hold Active)\n\n৳${transaction.amount} সেফনেক্সবিডি এসক্রো হোল্ডে সফলভাবে যুক্ত হয়েছে। কাজ সম্পন্ন হলে ক্লায়েন্ট রিলিজ করবেন।`,
            metadata: {
              transactionId: transaction.id,
              trackingNumber: transaction.trackingNumber,
              status: 'HOLD',
              amount: Number(transaction.amount),
            },
          },
        });

        await tx.conversation.update({
          where: { id: transaction.conversationId },
          data: { updatedAt: new Date() },
        });
      }

      return updatedTx;
    });

    const gw = this.chatGateway;
    if (gw && updatedTx) {
      if (transaction.conversationId) {
        gw.server?.to(transaction.conversationId).emit('transaction:update', {
          conversationId: transaction.conversationId,
          transaction: updatedTx,
        });
      }

      const counterpartId = transaction.senderId === actorId ? transaction.receiverId : transaction.senderId;
      gw.notifyUser(counterpartId, 'notification:hold_approved', {
        conversationId: transaction.conversationId,
        transactionId: transaction.id,
        trackingNumber: transaction.trackingNumber,
        amount: Number(transaction.amount),
        title: '🔒 এসক্রো লক সক্রিয় (Escrow Hold Active)',
        message: `৳${transaction.amount} সফলভাবে সেফনেক্সবিডি এসক্রো হোল্ডে লক করা হয়েছে। কাজ সন্তোষজনকভাবে সম্পন্ন হলে ক্লায়েন্ট রিলিজ করবেন।`,
      });
    }

    return updatedTx;
  }

  /**
   * Release Pay Request: Releases Escrow Hold to Receiver Main Balance upon satisfaction
   */
  async releasePayRequest(transactionId: string, actorId: string, isAdmin: boolean = false, notes?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sender: { include: { wallet: true } },
        receiver: { include: { wallet: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'HOLD') {
      throw new BadRequestException(`Cannot release transaction with status ${transaction.status}. Funds must be in HOLD status.`);
    }

    // Only Sender or Admin can release held funds
    if (transaction.senderId !== actorId && !isAdmin) {
      throw new ForbiddenException('Only the sender (or admin) can release held funds to the receiver');
    }

    const updatedTx = await this.prisma.$transaction(async (tx) => {
      const senderWallet = transaction.sender.wallet!;
      const receiverWallet = transaction.receiver.wallet!;

      // 1. Release sender holding balance
      const senderHoldBefore = senderWallet.holdBalance;
      const senderHoldAfter = senderHoldBefore.sub(transaction.amount);

      const senderRes = await tx.wallet.updateMany({
        where: { id: senderWallet.id, version: senderWallet.version },
        data: {
          holdBalance: senderHoldAfter.lessThan(0) ? new Prisma.Decimal(0) : senderHoldAfter,
          version: { increment: 1 },
        },
      });

      // 2. Add amount to receiver available balance
      const receiverAvailBefore = receiverWallet.availableBalance;
      const receiverAvailAfter = receiverAvailBefore.add(transaction.amount);

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

      // 3. Update WalletHold
      await tx.walletHold.updateMany({
        where: { transactionId: transaction.id, status: 'HELD' },
        data: { status: 'RELEASED', releasedAt: new Date(), notes: notes || 'Released to receiver' },
      });

      // 4. Ledger for sender
      await tx.walletLedger.create({
        data: {
          walletId: senderWallet.id,
          userId: transaction.senderId,
          transactionId: transaction.id,
          type: 'HOLD_RELEASE',
          amount: transaction.amount,
          balanceBefore: senderWallet.availableBalance,
          balanceAfter: senderWallet.availableBalance,
          holdBefore: senderHoldBefore,
          holdAfter: senderHoldAfter,
          referenceId: transaction.id,
          referenceType: 'PAY_REQUEST_RELEASE',
          notes: notes || `Payment released to ${transaction.receiver.firstName} ${transaction.receiver.lastName}`,
          status: 'COMPLETED',
          createdBy: actorId,
        },
      });

      // 5. Ledger for receiver
      await tx.walletLedger.create({
        data: {
          walletId: receiverWallet.id,
          userId: transaction.receiverId,
          transactionId: transaction.id,
          type: 'TRANSFER_IN',
          amount: transaction.amount,
          commission: new Prisma.Decimal(0),
          balanceBefore: receiverAvailBefore,
          balanceAfter: receiverAvailAfter,
          holdBefore: receiverWallet.holdBalance,
          holdAfter: receiverWallet.holdBalance,
          referenceId: transaction.id,
          referenceType: 'PAY_REQUEST_RECEIVED',
          notes: notes || `Payment received from ${transaction.sender.firstName} ${transaction.sender.lastName}`,
          status: 'COMPLETED',
          createdBy: actorId,
        },
      });

      // 6. Update Transaction status to RELEASED
      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'RELEASED',
          statusHistory: {
            create: {
              fromStatus: 'HOLD',
              toStatus: 'RELEASED',
              changedById: actorId,
              reason: notes || 'Payment released from escrow hold to receiver',
            },
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      // 7. Update in-chat message metadata
      if (transaction.conversationId) {
        const messages = await tx.message.findMany({
          where: {
            conversationId: transaction.conversationId,
            messageType: { in: ['PAY_REQUEST', 'RECEIVE_REQUEST'] },
          },
        });
        for (const m of messages) {
          const meta = (m.metadata as any) || {};
          if (meta.transactionId === transaction.id || meta.trackingNumber === transaction.trackingNumber) {
            await tx.message.update({
              where: { id: m.id },
              data: {
                metadata: {
                  ...meta,
                  status: 'RELEASED',
                },
              },
            });
          }
        }

        // 8. Create automatic system message in conversation
        await tx.message.create({
          data: {
            conversationId: transaction.conversationId,
            senderId: actorId,
            messageType: 'SYSTEM',
            content: `🎉 পেমেন্ট রিলিজ সম্পন্ন!\n\n৳${transaction.amount} প্রাপক ${transaction.receiver.firstName} ${transaction.receiver.lastName}-এর মূল ব্যালেন্সে যুক্ত হয়েছে।\n\nTransaction ID:\n${transaction.trackingNumber}`,
            metadata: {
              transactionId: transaction.id,
              trackingNumber: transaction.trackingNumber,
              status: 'RELEASED',
              amount: Number(transaction.amount),
            },
          },
        });

        await tx.conversation.update({
          where: { id: transaction.conversationId },
          data: { updatedAt: new Date() },
        });
      }

      return updatedTx;
    });

    const gw = this.chatGateway;
    if (gw && updatedTx) {
      if (transaction.conversationId) {
        gw.server?.to(transaction.conversationId).emit('transaction:update', {
          conversationId: transaction.conversationId,
          transaction: updatedTx,
        });
      }

      // Notify receiver with celebration notification
      gw.notifyUser(transaction.receiverId, 'notification:release_approve', {
        conversationId: transaction.conversationId,
        transactionId: transaction.id,
        trackingNumber: transaction.trackingNumber,
        amount: Number(transaction.amount),
        title: '🎉 পেমেন্ট রিলিজ সম্পন্ন!',
        message: `৳${transaction.amount} আপনার মূল ব্যালেন্সে সফলভাবে যুক্ত হয়েছে। (TRX: ${transaction.trackingNumber})`,
      });

      // Also notify sender
      gw.notifyUser(transaction.senderId, 'notification:release_approve', {
        conversationId: transaction.conversationId,
        transactionId: transaction.id,
        trackingNumber: transaction.trackingNumber,
        amount: Number(transaction.amount),
        title: 'পেমেন্ট রিলিজ সম্পন্ন',
        message: `৳${transaction.amount} প্রাপকের মূল ব্যালেন্সে সফলভাবে রিলিজ হয়েছে।`,
      });
    }

    // Trigger Telegram Notification for receiver
    if (this.telegramService && updatedTx) {
      this.telegramService
        .sendUserAlert(
          transaction.receiverId,
          'escrowRelease',
          {
            amount: Number(transaction.amount),
            transactionId: transaction.id,
            trackingNumber: transaction.trackingNumber,
          },
          [
            {
              text: '💰 ওয়ালেট ব্যালেন্স দেখুন',
              callback_data: 'view_balance',
            },
          ],
        )
        .catch(() => null);
    }
    // Process Affiliate Referral Reward from platform commission
    if (this.affiliateService && Number(transaction.commissionAmount) > 0) {
      // Reward based on buyer/sender referral
      this.affiliateService
        .processReferralReward({
          userId: transaction.senderId,
          sourceType: 'TRANSACTION',
          sourceId: transaction.id,
          adminFee: Number(transaction.commissionAmount),
        })
        .catch(() => null);

      // Also check receiver referral
      this.affiliateService
        .processReferralReward({
          userId: transaction.receiverId,
          sourceType: 'TRANSACTION',
          sourceId: transaction.id,
          adminFee: Number(transaction.commissionAmount),
        })
        .catch(() => null);
    }

    return updatedTx;
  }

  /**
   * Universal approve method that routes based on current status:
   * - REQUESTED -> acceptPayRequest (Locks funds into Escrow HOLD)
   * - HOLD -> releasePayRequest (Releases held funds to Receiver)
   */
  async approvePayRequest(transactionId: string, actorId: string, isAdmin: boolean = false, notes?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    if (transaction.status === 'REQUESTED') {
      return this.acceptPayRequest(transactionId, actorId, isAdmin);
    } else if (transaction.status === 'HOLD') {
      return this.releasePayRequest(transactionId, actorId, isAdmin, notes);
    } else {
      throw new BadRequestException(`Cannot approve/release transaction with status ${transaction.status}`);
    }
  }

  /**
   * Receiver requests payment release for a transaction in HOLD status
   */
  async requestRelease(transactionId: string, actorId: string) {
    let transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!transaction) {
      transaction = await this.prisma.transaction.findFirst({
        where: { trackingNumber: transactionId },
        include: {
          sender: true,
          receiver: true,
        },
      });
    }

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== 'HOLD') {
      throw new BadRequestException('Can only request release for transactions currently on Escrow Hold');
    }

    if (transaction.receiverId !== actorId) {
      throw new ForbiddenException('Only the receiver can request payment release');
    }

    let convId = transaction.conversationId;
    if (!convId) {
      const existingConv = await this.prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: transaction.senderId } } },
            { participants: { some: { userId: transaction.receiverId } } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      });
      if (existingConv) {
        convId = existingConv.id;
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { conversationId: convId },
        });
      }
    }

    if (convId) {
      const msg = await this.prisma.message.create({
        data: {
          conversationId: convId,
          senderId: actorId,
          messageType: 'SYSTEM',
          content: `🔔 রিলিজের অনুরোধ:\n\n${transaction.receiver.firstName} ${transaction.receiver.lastName} কাজ সম্পন্ন করেছেন এবং ৳${transaction.amount} (TRX: ${transaction.trackingNumber}) রিলিজ করার অনুরোধ জানিয়েছেন। অনুগ্রহ করে কাজ যাচাই করে রিলিজ করুন অথবা আপত্তি থাকলে ডিসপ্যুট করুন।`,
          metadata: {
            type: 'RELEASE_REQUEST',
            transactionId: transaction.id,
            trackingNumber: transaction.trackingNumber,
            amount: Number(transaction.amount),
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      await this.prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });

      const gw = this.chatGateway;
      if (gw) {
        gw.broadcastNewMessage(msg, convId, actorId);
        gw.notifyUser(transaction.senderId, 'notification:release_request', {
          conversationId: convId,
          transactionId: transaction.id,
          trackingNumber: transaction.trackingNumber,
          amount: Number(transaction.amount),
          receiverName: `${transaction.receiver.firstName} ${transaction.receiver.lastName}`.trim(),
          title: '🔔 রিলিজের অনুরোধ (Release Request)',
          message: `${transaction.receiver.firstName} ${transaction.receiver.lastName} কাজ সম্পন্ন করেছেন এবং ৳${transaction.amount} রিলিজ করার অনুরোধ জানিয়েছেন।`,
        });
      }

      return msg;
    }

    return { success: true };
  }

  /**
   * Decline / Reject Pay Request:
   * - If REQUESTED: Rejects proposal with zero balance deduction.
   * - If HOLD: Receiver or Admin refunds held funds back to sender available balance. Sender cannot self-refund (must dispute).
   */
  async declinePayRequest(transactionId: string, userId: string, reason?: string, isAdmin: boolean = false) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        sender: { include: { wallet: true } },
        receiver: { include: { wallet: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const isParty = transaction.receiverId === userId || transaction.senderId === userId;
    if (!isParty && !isAdmin) {
      throw new ForbiddenException('Not authorized to decline or cancel this transaction');
    }

    // CASE 1: Transaction is in REQUESTED status (No funds were ever deducted)
    if (transaction.status === 'REQUESTED') {
      return this.prisma.$transaction(async (tx) => {
        const updatedTx = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'REJECTED',
            rejectReason: reason || 'Declined by recipient',
            statusHistory: {
              create: {
                fromStatus: 'REQUESTED',
                toStatus: 'REJECTED',
                changedById: userId,
                reason: reason || 'Request rejected. No funds deducted.',
              },
            },
          },
        });

        if (transaction.conversationId) {
          const messages = await tx.message.findMany({
            where: {
              conversationId: transaction.conversationId,
              messageType: { in: ['PAY_REQUEST', 'RECEIVE_REQUEST'] },
            },
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
              senderId: userId,
              messageType: 'SYSTEM',
              content: `✕ পেমেন্ট রিকোয়েস্ট প্রত্যাখ্যাত (Declined)\n\nরিকোয়েস্টটি বাতিল করা হয়েছে। কোনো প্রকার ব্যালেন্স কর্তন হয়নি।`,
              metadata: {
                transactionId: transaction.id,
                trackingNumber: transaction.trackingNumber,
                status: 'REJECTED',
              },
            },
          });

          await tx.conversation.update({
            where: { id: transaction.conversationId },
            data: { updatedAt: new Date() },
          });
        }

        return updatedTx;
      });
    }

    // CASE 2: Transaction is in HOLD status (Escrow active)
    if (transaction.status === 'HOLD') {
      // Critical Security Rule: Senders cannot unilaterally refund held money back to their main balance
      if (!isAdmin && transaction.senderId === userId) {
        throw new BadRequestException(
          'Senders cannot unilaterally recall or refund held escrow funds. If you have an issue or want a refund, please open a dispute for Admin review.',
        );
      }

      return this.prisma.$transaction(async (tx) => {
        const senderWallet = transaction.sender.wallet!;

        // 1. Refund from sender hold back to sender available balance
        const senderHoldBefore = senderWallet.holdBalance;
        const senderHoldAfter = senderHoldBefore.sub(transaction.amount);

        const senderAvailBefore = senderWallet.availableBalance;
        const senderAvailAfter = senderAvailBefore.add(transaction.amount);

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

        // 2. Update WalletHold
        await tx.walletHold.updateMany({
          where: { transactionId: transaction.id, status: 'HELD' },
          data: { status: 'REFUNDED', releasedAt: new Date(), notes: reason || 'Declined' },
        });

        // 3. WalletLedger for sender
        await tx.walletLedger.create({
          data: {
            walletId: senderWallet.id,
            userId: transaction.senderId,
            transactionId: transaction.id,
            type: 'HOLD_REFUND',
            amount: transaction.amount,
            balanceBefore: senderAvailBefore,
            balanceAfter: senderAvailAfter,
            holdBefore: senderHoldBefore,
            holdAfter: senderHoldAfter,
            referenceId: transaction.id,
            referenceType: 'PAY_REQUEST_DECLINED',
            notes: `Escrow hold declined/refunded. ৳${transaction.amount} refunded to available balance. Reason: ${reason || 'Declined'}`,
            status: 'COMPLETED',
            createdBy: userId,
          },
        });

        // 4. Update transaction status to REJECTED
        const updatedTx = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'REJECTED',
            rejectReason: reason || 'Declined',
            statusHistory: {
              create: {
                fromStatus: 'HOLD',
                toStatus: 'REJECTED',
                changedById: userId,
                reason: reason || 'Declined by recipient/admin',
              },
            },
          },
          include: {
            sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
            receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        });

        // 5. Update in-chat message metadata
        if (transaction.conversationId) {
          const messages = await tx.message.findMany({
            where: {
              conversationId: transaction.conversationId,
              messageType: { in: ['PAY_REQUEST', 'RECEIVE_REQUEST'] },
            },
          });
          for (const m of messages) {
            const meta = (m.metadata as any) || {};
            if (meta.transactionId === transaction.id || meta.trackingNumber === transaction.trackingNumber) {
              await tx.message.update({
                where: { id: m.id },
                data: {
                  metadata: {
                    ...meta,
                    status: 'REJECTED',
                  },
                },
              });
            }
          }

          // 6. Create automatic system message in conversation
          await tx.message.create({
            data: {
              conversationId: transaction.conversationId,
              senderId: userId,
              messageType: 'SYSTEM',
              content: `✕ এসক্রো হোল্ড বাতিল ও রিফান্ড\n\n৳${transaction.amount} প্রেরক ${transaction.sender.firstName} ${transaction.sender.lastName}-এর মূল ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
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

        return updatedTx;
      });
    }

    throw new BadRequestException(`Cannot decline transaction with status ${transaction.status}`);
  }

  /**
   * Dispute Pay Request: Keeps Funds in Escrow Hold for Admin Review (Spec #13)
   */
  async disputePayRequest(
    transactionId: string,
    userId: string,
    dto: { reason: string; details?: string; evidenceUrls?: string[] },
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { dispute: true, sender: true, receiver: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      throw new ForbiddenException('Not authorized to dispute this transaction');
    }

    if (transaction.status === 'RELEASED' || transaction.status === 'REJECTED') {
      throw new BadRequestException('Cannot dispute an already completed or rejected transaction');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Transaction status to DISPUTED
      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'DISPUTED',
          statusHistory: {
            create: {
              fromStatus: transaction.status,
              toStatus: 'DISPUTED',
              changedById: userId,
              reason: `${dto.reason}: ${dto.details || 'Dispute raised'}`,
            },
          },
        },
      });

      // 2. Create or reactivate Dispute record
      let dispute = transaction.dispute;
      if (!dispute) {
        dispute = await tx.dispute.create({
          data: {
            transactionId,
            initiatedById: userId,
            status: 'ACTIVE_CALL',
            reason: `${dto.reason}${dto.details ? ` - ${dto.details}` : ''}`,
          },
        });

        if (dto.evidenceUrls && dto.evidenceUrls.length > 0) {
          for (const url of dto.evidenceUrls) {
            await tx.disputeEvidence.create({
              data: {
                disputeId: dispute.id,
                uploadedById: userId,
                fileUrl: url,
                fileType: 'IMAGE',
                description: 'Evidence provided during dispute creation',
              },
            });
          }
        }
      } else {
        dispute = await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            initiatedById: userId,
            status: 'ACTIVE_CALL',
            reason: `${dto.reason}${dto.details ? ` - ${dto.details}` : ''}`,
            resolvedAt: null,
            resolvedById: null,
            adminNotes: null,
          },
        });

        if (dto.evidenceUrls && dto.evidenceUrls.length > 0) {
          for (const url of dto.evidenceUrls) {
            await tx.disputeEvidence.create({
              data: {
                disputeId: dispute.id,
                uploadedById: userId,
                fileUrl: url,
                fileType: 'IMAGE',
                description: 'Evidence provided during dispute creation',
              },
            });
          }
        }
      }

      // 3. Update in-chat message metadata (PAY_REQUEST & RECEIVE_REQUEST)
      if (transaction.conversationId) {
        const messages = await tx.message.findMany({
          where: {
            conversationId: transaction.conversationId,
            messageType: { in: ['PAY_REQUEST', 'RECEIVE_REQUEST'] },
          },
        });
        for (const m of messages) {
          const meta = (m.metadata as any) || {};
          if (meta.transactionId === transaction.id || meta.trackingNumber === transaction.trackingNumber) {
            await tx.message.update({
              where: { id: m.id },
              data: {
                metadata: {
                  ...meta,
                  status: 'DISPUTED',
                },
              },
            });
          }
        }

        // 4. Create automatic system message in conversation
        await tx.message.create({
          data: {
            conversationId: transaction.conversationId,
            senderId: userId,
            messageType: 'SYSTEM',
            content: `⚠ Payment Under Dispute\n\nAmount: ৳${transaction.amount}\nThis payment is currently held for admin review.\nStatus: Disputed`,
            metadata: {
              transactionId: transaction.id,
              trackingNumber: transaction.trackingNumber,
              status: 'DISPUTED',
              amount: Number(transaction.amount),
            },
          },
        });

        await tx.conversation.update({
          where: { id: transaction.conversationId },
          data: { updatedAt: new Date() },
        });
      }

      return { transaction: updatedTx, dispute };
    });

    const gw = this.chatGateway;
    if (gw) {
      if (transaction.conversationId) {
        gw.server?.to(transaction.conversationId).emit('transaction:update', {
          conversationId: transaction.conversationId,
          transaction: result.transaction,
        });
      }

      const counterpartId = transaction.senderId === userId ? transaction.receiverId : transaction.senderId;
      gw.notifyUser(counterpartId, 'notification:dispute', {
        conversationId: transaction.conversationId,
        transactionId: transaction.id,
        trackingNumber: transaction.trackingNumber,
        title: '⚠️ লেনদেনে বিরোধ (Dispute) উত্থাপিত হয়েছে',
        message: `TRX: ${transaction.trackingNumber} বিরোধের কারণে অ্যাডমিন কলিং কিউতে পাঠানো হয়েছে।`,
      });

      gw.notifyAdminsAndStaff('notification:admin', {
        type: 'DISPUTE',
        title: 'নতুন ডিসপ্যুট / অ্যাডমিন কলিং',
        message: `TRX: ${transaction.trackingNumber} লেনদেনে বিরোধ তৈরি হয়েছে। কারণ: ${dto.reason}`,
        targetUrl: `/admin/calling-queue`,
        createdAt: new Date().toISOString(),
      });
    }

    // Trigger Telegram Notification for counterpart and admin group
    if (this.telegramService) {
      const counterpartId = transaction.senderId === userId ? transaction.receiverId : transaction.senderId;
      this.telegramService
        .sendUserAlert(
          counterpartId,
          'disputeOpened',
          {
            transactionId: transaction.id,
            trackingNumber: transaction.trackingNumber,
          },
        )
        .catch(() => null);

      this.telegramService
        .sendAdminAlert(
          'adminDisputeAlert',
          {
            transactionId: transaction.id,
            buyerName: transaction.sender?.firstName || 'Buyer',
            sellerName: transaction.receiver?.firstName || 'Seller',
            reason: dto.reason,
          },
        )
        .catch(() => null);
    }

    return result;
  }

  /**
   * Withdraw Dispute: Sender or Receiver cancels dispute and restores transaction to HOLD (Spec #13)
   */
  async withdrawDispute(transactionId: string, userId: string, isAdmin: boolean = false) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        dispute: true,
        sender: true,
        receiver: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const isParty = transaction.senderId === userId || transaction.receiverId === userId;
    if (!isParty && !isAdmin) {
      throw new ForbiddenException('Not authorized to withdraw dispute for this transaction');
    }

    if (transaction.status !== 'DISPUTED') {
      throw new BadRequestException(`Cannot withdraw dispute for transaction with status ${transaction.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Transaction status back to HOLD
      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'HOLD',
          statusHistory: {
            create: {
              fromStatus: 'DISPUTED',
              toStatus: 'HOLD',
              changedById: userId,
              reason: 'Dispute withdrawn; funds returned to active escrow hold ready for release',
            },
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      // 2. Mark Dispute resolved/withdrawn
      if (transaction.dispute) {
        await tx.dispute.update({
          where: { id: transaction.dispute.id },
          data: {
            status: 'RESOLVED',
            adminNotes: `Dispute withdrawn by user ${userId}`,
            resolvedById: userId,
            resolvedAt: new Date(),
          },
        });
      }

      // 3. Update in-chat message metadata back to HOLD (PAY_REQUEST & RECEIVE_REQUEST)
      if (transaction.conversationId) {
        const messages = await tx.message.findMany({
          where: {
            conversationId: transaction.conversationId,
            messageType: { in: ['PAY_REQUEST', 'RECEIVE_REQUEST'] },
          },
        });
        for (const m of messages) {
          const meta = (m.metadata as any) || {};
          if (meta.transactionId === transaction.id || meta.trackingNumber === transaction.trackingNumber) {
            await tx.message.update({
              where: { id: m.id },
              data: {
                metadata: {
                  ...meta,
                  status: 'HOLD',
                },
              },
            });
          }
        }

        // 4. Create system notice in conversation
        await tx.message.create({
          data: {
            conversationId: transaction.conversationId,
            senderId: userId,
            messageType: 'SYSTEM',
            content: `✓ Dispute Withdrawn\n\nDispute for transaction ${transaction.trackingNumber} has been withdrawn.\nPayment of ৳${transaction.amount} is back on Escrow Hold. Sender can now release funds upon satisfaction.`,
            metadata: {
              transactionId: transaction.id,
              trackingNumber: transaction.trackingNumber,
              status: 'HOLD',
              amount: Number(transaction.amount),
            },
          },
        });

        await tx.conversation.update({
          where: { id: transaction.conversationId },
          data: { updatedAt: new Date() },
        });
      }

      return updatedTx;
    });
  }

  /**
   * Admin Release Escrow Hold to Receiver
   */
  async adminReleaseToReceiver(transactionId: string, adminId: string, notes?: string) {
    return this.approvePayRequest(transactionId, adminId, true, notes || 'Admin unilateral release to receiver');
  }

  /**
   * Admin Refund Escrow Hold to Sender
   */
  async adminRefundToSender(transactionId: string, adminId: string, notes?: string) {
    return this.declinePayRequest(transactionId, adminId, notes || 'Admin unilateral refund to sender', true);
  }

  /**
   * Admin set hold details (custom warning date, warning time, notes)
   */
  async adminSetHoldDetails(
    transactionId: string,
    adminId: string,
    dto: { warningDate?: string; warningTime?: string; notes?: string },
  ) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { dispute: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update WalletHold
      const hold = await tx.walletHold.findFirst({
        where: { transactionId, status: 'HELD' },
      });

      if (hold) {
        await tx.walletHold.update({
          where: { id: hold.id },
          data: {
            warningDate: dto.warningDate ? new Date(dto.warningDate) : hold.warningDate,
            warningTime: dto.warningTime || hold.warningTime,
            notes: dto.notes || hold.notes,
          },
        });
      }

      // If dispute exists, update dispute status to HOLD_BALANCE
      if (transaction.dispute) {
        await tx.dispute.update({
          where: { id: transaction.dispute.id },
          data: {
            status: 'HOLD_BALANCE',
            adminNotes: dto.notes || `Admin set hold deadline: ${dto.warningDate} ${dto.warningTime || ''}`,
          },
        });
      }

      // Inform users in conversation
      if (transaction.conversationId) {
        await tx.message.create({
          data: {
            conversationId: transaction.conversationId,
            senderId: adminId,
            messageType: 'ADMIN_INTERVENTION',
            content: `🛡️ [SafnexBD Admin Hold Update]\n\nTransaction ID: ${transaction.trackingNumber}\nStatus: Hold Date Scheduled\nDeadline: ${dto.warningDate || 'N/A'} ${dto.warningTime || ''}\nAdmin Notes: ${dto.notes || 'Please resolve the pending requirements before deadline.'}`,
            metadata: {
              transactionId,
              warningDate: dto.warningDate,
              warningTime: dto.warningTime,
              notes: dto.notes,
            },
          },
        });

        await tx.conversation.update({
          where: { id: transaction.conversationId },
          data: { updatedAt: new Date() },
        });
      }

      return { success: true, message: 'Hold details updated successfully' };
    });
  }

  /**
   * Request Money from counterparty without requiring balance (Spec #16)
   */
  async requestMoney(
    requesterId: string,
    dto: { targetId: string; amount: number; reason?: string; conversationId?: string },
  ) {
    if (requesterId === dto.targetId) {
      throw new BadRequestException('Cannot request money from yourself');
    }

    let convId = dto.conversationId;
    if (!convId) {
      const existingConv = await this.prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: requesterId } } },
            { participants: { some: { userId: dto.targetId } } },
          ],
        },
      });
      if (existingConv) {
        convId = existingConv.id;
      } else {
        const newConv = await this.prisma.conversation.create({
          data: {
            type: 'DIRECT',
            participants: {
              create: [{ userId: requesterId }, { userId: dto.targetId }],
            },
          },
        });
        convId = newConv.id;
      }
    }

    const commissionResult = await this.commissionService.calculateCommission({
      amount: dto.amount,
      transactionType: 'GENERAL_TRANSACTION',
    });

    const trackingNumber = this.generateTrackingNumber();

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, firstName: true, lastName: true, uniqueUserId: true, avatarUrl: true },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Transaction in REQUESTED status (No balance deduction yet)
      const transaction = await tx.transaction.create({
        data: {
          trackingNumber,
          conversationId: convId,
          senderId: dto.targetId,
          receiverId: requesterId,
          transactionType: 'GENERAL_TRANSACTION',
          amount: new Prisma.Decimal(dto.amount),
          commissionAmount: commissionResult.commissionAmount,
          totalRequired: commissionResult.totalRequired,
          status: 'REQUESTED',
          statusHistory: {
            create: {
              fromStatus: 'DRAFT',
              toStatus: 'REQUESTED',
              changedById: requesterId,
              reason: dto.reason || 'Request Money initiated',
            },
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      // 2. Create in-chat Message with RECEIVE_REQUEST type
      const msg = await tx.message.create({
        data: {
          conversationId: convId!,
          senderId: requesterId,
          content: dto.reason || `💰 Request Money: ৳${dto.amount}`,
          messageType: 'RECEIVE_REQUEST',
          metadata: {
            transactionId: transaction.id,
            trackingNumber,
            amount: dto.amount,
            commissionAmount: Number(commissionResult.commissionAmount),
            totalRequired: Number(commissionResult.totalRequired),
            status: 'REQUESTED',
            reason: dto.reason || 'Service Payment',
            senderId: dto.targetId,
            receiverId: requesterId,
            initiatorRole: 'RECEIVER',
            requesterId,
            requesterName: `${requester?.firstName || ''} ${requester?.lastName || ''}`.trim(),
            requesterUniqueId: requester?.uniqueUserId || '',
            receiverNote: dto.reason || '',
            adminNote: 'অনুমোদন করলে আপনার ব্যালেন্স থেকে টাকা কেটে সেফনেক্সবিডি এসক্রো হোল্ডে থাকবে। কাজ বুঝে পেলে রিলিজ করবেন।',
          },
        },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          attachments: true,
        },
      });

      await tx.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });

      const messageWithAttachments = {
        ...msg,
        attachments: (msg.attachments || []).map((att) => ({
          ...att,
          fileSize: Number(att.fileSize || 0),
        })),
      };

      return {
        transaction,
        message: messageWithAttachments,
      };
    });

    const gw = this.chatGateway;
    if (gw) {
      if (convId) {
        gw.broadcastNewMessage(result.message, convId, requesterId);
      }

      const requesterFullName =
        `${requester?.firstName || ''} ${requester?.lastName || ''}`.trim() ||
        requester?.uniqueUserId ||
        'User';

      gw.notifyUser(dto.targetId, 'notification:receive_request', {
        conversationId: convId,
        transactionId: result.transaction.id,
        trackingNumber,
        amount: dto.amount,
        requesterName: requesterFullName,
        requesterAvatar: requester?.avatarUrl,
        title: 'নতুন পেমেন্ট রিকোয়েস্ট (Money Request)',
        message: `${requesterFullName} আপনার কাছে ৳${dto.amount} এর পেমেন্ট চেয়েছেন।`,
      });

      gw.notifyAdmins('notification:admin', {
        type: 'RECEIVE_REQUEST',
        title: 'নতুন রিসিভ রিকোয়েস্ট',
        message: `${requesterFullName} চ্যাটে ৳${dto.amount} পেমেন্ট চেয়েছেন। (TRX: ${trackingNumber})`,
        targetUrl: `/admin/cms`,
        createdAt: new Date().toISOString(),
      });
    }

    // Trigger Telegram Notification for target user
    if (this.telegramService) {
      const requesterFullName =
        `${requester?.firstName || ''} ${requester?.lastName || ''}`.trim() ||
        requester?.uniqueUserId ||
        'User';

      this.telegramService
        .sendUserAlert(
          dto.targetId,
          'escrowPayRequest',
          {
            senderName: requesterFullName,
            senderUniqueId: requester?.uniqueUserId || 'User',
            amount: dto.amount,
            transactionId: result.transaction.id,
            trackingNumber,
            notes: dto.reason || 'Service Payment',
          },
          [
            {
              text: `💬 চ্যাটে দেখুন (@${requester?.uniqueUserId || 'User'})`,
              callback_data: `chat_with_${requesterId}`,
            },
          ],
        )
        .catch(() => null);

      // Send Receive Request Alert to Admin Telegram Group
      try {
        const settings = await this.telegramService.getSettings();
        if (settings.isEnabled && settings.botToken && settings.adminGroupId) {
          const text = `💰 <b>[Admin Alert] নতুন রিসিভ রিকোয়েস্ট!</b>\n\n👤 রিকোয়েস্টকারী: <b>${requesterFullName}</b> (@${requester?.uniqueUserId || 'N/A'})\n💰 পরিমাণ: <b>৳${dto.amount}</b>\n📦 TRX: <code>${trackingNumber}</code>\n⏰ সময়: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}`;

          await this.telegramService.callApi(settings.botToken, 'sendMessage', {
            chat_id: settings.adminGroupId,
            text,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '👁️ অ্যাডমিন প্যানেলে দেখুন',
                    url: `${settings.miniAppUrl || 'https://safnexbd.com'}/admin/cms`,
                  },
                ],
              ],
            },
          });
        }
      } catch (err: any) {
        // silently ignore admin group alert failures
      }
    }

    return result;
  }
}


