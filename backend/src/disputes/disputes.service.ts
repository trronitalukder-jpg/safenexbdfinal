import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DisputeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
  AddEvidenceDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  UpdateDisputeStatusDto,
} from './dto/dispute.dto';
import { OperationsService } from '../operations/operations.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    @Optional() private chatGateway?: ChatGateway,
    @Optional() private operationsService?: OperationsService,
  ) {}

  /**
   * User triggers "Call Admin" / Dispute (Spec #39)
   */
  async callAdmin(userId: string, dto: CreateDisputeDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { dispute: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      throw new ForbiddenException('Not a party to this transaction');
    }

    if (transaction.dispute) {
      await this.prisma.transaction.update({
        where: { id: dto.transactionId },
        data: { status: 'DISPUTED' },
      });
      const updated = await this.prisma.dispute.update({
        where: { id: transaction.dispute.id },
        data: {
          initiatedById: userId,
          status: 'ACTIVE_CALL',
          reason: dto.reason,
          resolvedAt: null,
          resolvedById: null,
          adminNotes: null,
        },
      });

      if (this.chatGateway) {
        this.chatGateway.notifyAdminsAndStaff('notification:admin', {
          type: 'DISPUTE_CALLING',
          title: '🚨 জরুরী কল অ্যাডমিন / ডিসপ্যুট!',
          message: `ব্যবহারকারী লেনদেনের জন্য অ্যাডমিন সহায়তা চেয়েছেন: ${dto.reason}`,
          targetUrl: '/admin/calling-queue',
          data: {
            disputeId: updated.id,
            transactionId: dto.transactionId,
            reason: dto.reason,
            initiatedById: userId,
          },
          createdAt: new Date().toISOString(),
        });
      }

      return updated;
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      // Mark transaction status as DISPUTED
      await tx.transaction.update({
        where: { id: dto.transactionId },
        data: {
          status: 'DISPUTED',
          statusHistory: {
            create: {
              fromStatus: transaction.status,
              toStatus: 'DISPUTED',
              changedById: userId,
              reason: `Dispute opened / Call Admin triggered: ${dto.reason}`,
            },
          },
        },
      });

      // Create dispute record
      const newDispute = await tx.dispute.create({
        data: {
          transactionId: dto.transactionId,
          initiatedById: userId,
          status: 'ACTIVE_CALL', // Active call queue
          reason: dto.reason,
        },
      });

      // Attach evidence URLs if provided
      if (dto.evidenceUrls && dto.evidenceUrls.length > 0) {
        for (const url of dto.evidenceUrls) {
          await tx.disputeEvidence.create({
            data: {
              disputeId: newDispute.id,
              uploadedById: userId,
              fileUrl: url,
              fileType: 'IMAGE',
              description: 'Initial evidence upload',
            },
          });
        }
      }

      return newDispute;
    });

    if (this.chatGateway && dispute) {
      this.chatGateway.notifyAdminsAndStaff('notification:admin', {
        type: 'DISPUTE_CALLING',
        title: '🚨 জরুরী কল অ্যাডমিন / ডিসপ্যুট!',
        message: `ব্যবহারকারী লেনদেনের জন্য অ্যাডমিন সহায়তা চেয়েছেন: ${dto.reason}`,
        targetUrl: '/admin/calling-queue',
        data: {
          disputeId: dispute.id,
          transactionId: dto.transactionId,
          reason: dto.reason,
          initiatedById: userId,
        },
        createdAt: new Date().toISOString(),
      });
    }

    if (this.operationsService && dispute?.id) {
      await this.operationsService.autoAssignTaskOnCreate('DISPUTE', dispute.id, 'DISPUTE');
    }

    return dispute;
  }

  /**
   * Upload additional evidence
   */
  async addEvidence(disputeId: string, userId: string, dto: AddEvidenceDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { transaction: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (
      dispute.transaction.senderId !== userId &&
      dispute.transaction.receiverId !== userId
    ) {
      throw new ForbiddenException('Unauthorized to upload evidence for this dispute');
    }

    return this.prisma.disputeEvidence.create({
      data: {
        disputeId,
        uploadedById: userId,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        description: dto.description,
      },
    });
  }

  /**
   * Admin Calling Queue with 4 visual status filters (Spec #39, #71):
   * ACTIVE_CALL, UNRESOLVED, RESOLVED, HOLD_BALANCE
   */
  async getCallingQueue(status?: DisputeStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const disputes = await this.prisma.dispute.findMany({
      where,
      include: {
        transaction: {
          include: {
            sender: {
              select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
            },
            receiver: {
              select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
            },
            product: { select: { id: true, title: true, price: true } },
          },
        },
        initiatedBy: {
          select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true },
        },
        evidences: true,
        actions: true,
        assignedTo: {
          select: { id: true, uniqueUserId: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return disputes;
  }

  /**
   * Admin Authorized Full View of Dispute (Spec #40)
   * Shows sender, receiver, product, transaction, pay/receive requests,
   * work time, work done, full chat history, images/files, wallet ledger, and hold balance.
   */
  async getDisputeDetails(disputeId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        transaction: {
          include: {
            sender: {
              include: {
                wallet: true,
              },
            },
            receiver: {
              include: {
                wallet: true,
              },
            },
            product: {
              include: { images: true },
            },
            workLogs: { orderBy: { createdAt: 'desc' } },
            statusHistory: { orderBy: { createdAt: 'desc' } },
          },
        },
        evidences: {
          include: {
            uploadedBy: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true } },
          },
        },
        actions: true,
        assignedTo: {
          select: { id: true, uniqueUserId: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Fetch associated chat messages if conversation exists
    let chatMessages: any[] = [];
    if (dispute.transaction.conversationId) {
      chatMessages = await this.prisma.message.findMany({
        where: { conversationId: dispute.transaction.conversationId },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // Fetch related wallet ledger entries for this transaction
    const ledgers = await this.prisma.walletLedger.findMany({
      where: { transactionId: dispute.transactionId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch hold balance record
    const hold = await this.prisma.walletHold.findFirst({
      where: { transactionId: dispute.transactionId },
    });

    return JSON.parse(
      JSON.stringify(
        {
          dispute,
          chatMessages,
          ledgers,
          hold,
        },
        (key, value) => (typeof value === 'bigint' ? value.toString() : value),
      ),
    );
  }

  /**
   * Update dispute queue status (e.g. move to UNRESOLVED, HOLD_BALANCE)
   */
  async updateStatus(disputeId: string, adminId: string, dto: UpdateDisputeStatusDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        adminNotes: dto.notes,
      },
    });
  }

  /**
   * Admin Unilateral Dispute Resolution & Financial Intervention (Spec #41)
   * REFUND_SENDER, RELEASE_RECEIVER, PARTIAL_SPLIT, CANCEL_TRANSACTION
   */
  async resolveDispute(disputeId: string, adminId: string, dto: ResolveDisputeDto) {
    if (!dto.notes || dto.notes.trim().length < 5) {
      throw new BadRequestException('A clear explanation is mandatory for dispute resolution');
    }

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: {
          transaction: {
            include: {
              sender: { include: { wallet: true } },
              receiver: { include: { wallet: true } },
            },
          },
        },
      });

      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }

      const transaction = dispute.transaction;
      const senderWallet = transaction.sender.wallet!;
      const receiverWallet = transaction.receiver.wallet!;
      const hold = await tx.walletHold.findFirst({
        where: { transactionId: transaction.id, status: 'HELD' },
      });

      const totalHeld = hold ? hold.amount : transaction.amount;

      if (dto.actionType === 'REFUND_SENDER') {
        // Refund from sender hold back to sender available
        if (hold) {
          const senderHoldBefore = senderWallet.holdBalance;
          const senderHoldAfter = senderHoldBefore.sub(totalHeld);

          await tx.wallet.update({
            where: { id: senderWallet.id },
            data: {
              holdBalance: senderHoldAfter.lessThan(0) ? new Prisma.Decimal(0) : senderHoldAfter,
              version: { increment: 1 },
            },
          });

          await tx.walletHold.update({
            where: { id: hold.id },
            data: { status: 'REFUNDED', releasedAt: new Date(), notes: dto.notes },
          });
        }

        const senderAvailBefore = senderWallet.availableBalance;
        const senderAvailAfter = senderAvailBefore.add(totalHeld);

        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: {
            availableBalance: senderAvailAfter,
            version: { increment: 1 },
          },
        });

        await tx.walletLedger.create({
          data: {
            walletId: senderWallet.id,
            userId: transaction.senderId,
            transactionId: transaction.id,
            type: 'HOLD_REFUND',
            amount: totalHeld,
            balanceBefore: senderAvailBefore,
            balanceAfter: senderAvailAfter,
            holdBefore: senderWallet.holdBalance,
            holdAfter: senderWallet.holdBalance.sub(totalHeld),
            notes: `Dispute settled by Admin: 100% refunded to sender. Reason: ${dto.notes}`,
            createdBy: adminId,
          },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'REFUNDED' },
        });

        // Update in-chat message
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
              senderId: adminId,
              messageType: 'SYSTEM',
              content: `✕ Dispute Resolved: Refunded to Sender\n\n৳${totalHeld} has been refunded to ${transaction.sender.firstName} ${transaction.sender.lastName}'s Main Balance.\nAdmin Verdict: ${dto.notes}`,
              metadata: {
                transactionId: transaction.id,
                trackingNumber: transaction.trackingNumber,
                status: 'REJECTED',
                amount: Number(totalHeld),
              },
            },
          });
        }
      } else if (dto.actionType === 'RELEASE_RECEIVER') {
        // Release from sender hold to receiver available
        if (hold) {
          const senderHoldBefore = senderWallet.holdBalance;
          const senderHoldAfter = senderHoldBefore.sub(totalHeld);

          await tx.wallet.update({
            where: { id: senderWallet.id },
            data: {
              holdBalance: senderHoldAfter.lessThan(0) ? new Prisma.Decimal(0) : senderHoldAfter,
              version: { increment: 1 },
            },
          });

          await tx.walletHold.update({
            where: { id: hold.id },
            data: { status: 'RELEASED', releasedAt: new Date(), notes: dto.notes },
          });

          await tx.walletLedger.create({
            data: {
              walletId: senderWallet.id,
              userId: transaction.senderId,
              transactionId: transaction.id,
              type: 'HOLD_RELEASE',
              amount: totalHeld,
              balanceBefore: senderWallet.availableBalance,
              balanceAfter: senderWallet.availableBalance,
              holdBefore: senderHoldBefore,
              holdAfter: senderHoldAfter,
              notes: `Dispute settled by Admin: Released to receiver. Reason: ${dto.notes}`,
              createdBy: adminId,
            },
          });
        }

        const receiverAvailBefore = receiverWallet.availableBalance;
        const receiverAvailAfter = receiverAvailBefore.add(transaction.amount);

        await tx.wallet.update({
          where: { id: receiverWallet.id },
          data: {
            availableBalance: receiverAvailAfter,
            version: { increment: 1 },
          },
        });

        await tx.walletLedger.create({
          data: {
            walletId: receiverWallet.id,
            userId: transaction.receiverId,
            transactionId: transaction.id,
            type: 'TRANSFER_IN',
            amount: transaction.amount,
            balanceBefore: receiverAvailBefore,
            balanceAfter: receiverAvailAfter,
            holdBefore: receiverWallet.holdBalance,
            holdAfter: receiverWallet.holdBalance,
            notes: `Dispute settled by Admin: Released funds to receiver. Reason: ${dto.notes}`,
            createdBy: adminId,
          },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: 'RELEASED' },
        });

        // Update in-chat message
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
              senderId: adminId,
              messageType: 'SYSTEM',
              content: `✓ Dispute Resolved: Released to Receiver\n\n৳${transaction.amount} has been released to ${transaction.receiver.firstName} ${transaction.receiver.lastName}'s Main Balance.\nAdmin Verdict: ${dto.notes}`,
              metadata: {
                transactionId: transaction.id,
                trackingNumber: transaction.trackingNumber,
                status: 'COMPLETED',
                amount: Number(transaction.amount),
              },
            },
          });
        }
      }

      // Record Dispute Action
      await tx.disputeAction.create({
        data: {
          disputeId,
          adminId,
          actionType: dto.actionType,
          amount: dto.amount ? new Prisma.Decimal(dto.amount) : totalHeld,
          notes: dto.notes,
        },
      });

      // Mark dispute as RESOLVED
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          adminNotes: dto.notes,
          resolvedById: adminId,
          resolvedAt: new Date(),
        },
      });

      // Mandatory AuditLog entry (Spec #75)
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'DISPUTE_RESOLVE',
          targetEntity: 'Dispute',
          targetId: disputeId,
          beforeState: { status: dispute.status },
          afterState: { status: 'RESOLVED', actionType: dto.actionType, amount: totalHeld.toString() },
          reason: dto.notes,
        },
      });

      return updatedDispute;
    });
  }
}

