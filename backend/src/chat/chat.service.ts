import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find or create 1-to-1 conversation between two users
   */
  async getOrCreateConversation(userId1: string, userId2: string, transactionId?: string) {
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    // Resolve target user by ID or uniqueUserId
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: userId2 },
          { uniqueUserId: userId2 },
        ],
      },
      include: { userRoles: { include: { role: true } } },
    });

    const caller = await this.prisma.user.findUnique({
      where: { id: userId1 },
      select: { isActive: true, deletedAt: true },
    });
    if (!caller || !caller.isActive || caller.deletedAt) {
      throw new ForbiddenException('আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে, চ্যাট শুরু করা সম্ভব নয়।');
    }

    if (!targetUser || !targetUser.isActive || targetUser.deletedAt) {
      throw new BadRequestException('Target user account is inactive or not found');
    }

    const resolvedTargetId = targetUser.id;

    // Check if target user is Super Admin and if Super Admin chat presence is OFF
    const isTargetSuperAdmin = targetUser?.userRoles?.some((ur) => ur.role.name === 'SUPER_ADMIN');
    if (isTargetSuperAdmin) {
      const isVisible = await this.getSuperAdminChatVisibility();
      if (!isVisible) {
        const initiator = await this.prisma.user.findUnique({
          where: { id: userId1 },
          include: { userRoles: { include: { role: true } } },
        });
        const isInitiatorAdmin = initiator?.userRoles?.some((ur) =>
          ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE'].includes(ur.role.name),
        );
        if (!isInitiatorAdmin) {
          throw new BadRequestException(
            'সুপার অ্যাডমিনের সাথে সরাসরি চ্যাট বর্তমানে বন্ধ রয়েছে। প্রয়োজনে হেল্পলাইন বা ডিসপ্যুট কিউ ব্যবহার করুন।',
          );
        }
      }
    }

    // Check if conversation already exists between these 2 users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: resolvedTargetId } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true, email: true },
            },
          },
        },
      },
    });

    if (existing) {
      if (transactionId) {
        await this.prisma.transaction.updateMany({
          where: { id: transactionId, conversationId: null },
          data: { conversationId: existing.id },
        }).catch(() => null);
      }
      return existing;
    }

    // Create new conversation
    const newConv = await this.prisma.conversation.create({
      data: {
        type: transactionId ? 'TRANSACTION_LINKED' : 'DIRECT',
        participants: {
          create: [
            { userId: userId1 },
            { userId: resolvedTargetId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true, email: true },
            },
          },
        },
      },
    });

    if (transactionId) {
      await this.prisma.transaction.updateMany({
        where: { id: transactionId, conversationId: null },
        data: { conversationId: newConv.id },
      }).catch(() => null);
    }

    return newConv;
  }

  /**
   * Fetch all conversations for a user
   */
  async getUserConversations(userId: string) {
    const [isSuperAdminVisible, currentUser, participants] = await Promise.all([
      this.getSuperAdminChatVisibility(),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
      }),
      this.prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      uniqueUserId: true,
                      firstName: true,
                      lastName: true,
                      avatarUrl: true,
                      isVerified: true,
                      phone: true,
                      email: true,
                      userRoles: {
                        select: {
                          role: {
                            select: { name: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              transactions: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
                  receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
                  workLogs: { orderBy: { createdAt: 'desc' } },
                  dispute: true,
                },
              },
            },
          },
        },
        orderBy: { conversation: { updatedAt: 'desc' } },
      }),
    ]);

    const isCurrentAdminOrStaff = currentUser?.userRoles?.some((ur) =>
      ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE'].includes(ur.role.name),
    );

    const filteredParticipants =
      !isSuperAdminVisible && !isCurrentAdminOrStaff
        ? participants.filter((p) => {
            const otherParticipant = p.conversation.participants.find(
              (cp) => cp.userId !== userId,
            );
            const isOtherSuperAdmin = otherParticipant?.user?.userRoles?.some(
              (ur) => ur.role.name === 'SUPER_ADMIN',
            );
            return !isOtherSuperAdmin;
          })
        : participants;

    const mapped = filteredParticipants
      .map((p) => {
        const otherParticipant = p.conversation.participants.find(
          (cp) => cp.userId !== userId,
        );
        const lastMessage = p.conversation.messages[0] || null;
        const activeTransaction = (p.conversation as any).transactions?.[0] || null;

        return {
          conversationId: p.conversationId,
          otherUser: otherParticipant?.user,
          lastMessage,
          activeTransaction,
          updatedAt: p.conversation.updatedAt,
        };
      })
      .filter((c) => !!c.otherUser);

    // Deduplicate by otherUser.id so each user only appears ONCE
    const uniqueMap = new Map<string, typeof mapped[0]>();
    for (const item of mapped) {
      const otherId = item.otherUser!.id;
      const existing = uniqueMap.get(otherId);
      if (!existing) {
        uniqueMap.set(otherId, item);
      } else {
        const currentMsgTime = item.lastMessage ? new Date(item.lastMessage.createdAt).getTime() : 0;
        const existingMsgTime = existing.lastMessage ? new Date(existing.lastMessage.createdAt).getTime() : 0;
        if (currentMsgTime > existingMsgTime) {
          uniqueMap.set(otherId, item);
        } else if (currentMsgTime === existingMsgTime) {
          if (new Date(item.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
            uniqueMap.set(otherId, item);
          }
        }
      }
    }

    const result = Array.from(uniqueMap.values());
    result.sort((a, b) => {
      const timeA = Math.max(
        a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0,
        new Date(a.updatedAt).getTime()
      );
      const timeB = Math.max(
        b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0,
        new Date(b.updatedAt).getTime()
      );
      return timeB - timeA;
    });

    return result;
  }

  /**
   * Fetch single conversation by ID with otherUser
   */
  async getConversationById(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                uniqueUserId: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                phone: true,
                email: true,
                isVerified: true,
              },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const otherParticipant = conv.participants.find((p) => p.userId !== userId);
    return {
      ...conv,
      conversationId: conv.id,
      otherUser: otherParticipant?.user,
      activeTransaction: (conv as any).transactions?.[0] || null,
    };
  }

  /**
   * Fetch messages in a conversation (Latest messages first, returned chronologically)
   */
  async getMessages(conversationId: string, page = 1, limit = 50, requestingUserId?: string) {
    const skip = (page - 1) * limit;

    const [messagesDesc, total, lockInfo, isSuperAdminVisible, convParticipants] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        include: {
          sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId, isDeleted: false } }),
      this.isConversationLocked(conversationId),
      this.getSuperAdminChatVisibility(),
      this.prisma.conversationParticipant.findMany({
        where: { conversationId },
        include: { user: { include: { userRoles: { include: { role: true } } } } },
      }),
    ]);

    // Reverse to chronological order (oldest to newest) for chat stream rendering
    const messages = messagesDesc.reverse();

    const hasSuperAdmin = convParticipants.some((p) =>
      p.user?.userRoles?.some((ur) => ur.role.name === 'SUPER_ADMIN'),
    );

    let isRequestingAdminOrStaff = false;
    if (requestingUserId) {
      const reqUser =
        convParticipants.find((p) => p.userId === requestingUserId)?.user ||
        (await this.prisma.user.findUnique({
          where: { id: requestingUserId },
          include: { userRoles: { include: { role: true } } },
        }));
      isRequestingAdminOrStaff =
        reqUser?.userRoles?.some((ur) =>
          ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE'].includes(ur.role.name),
        ) || false;
    }

    let isLocked = lockInfo.isLocked;
    let lockReason = lockInfo.reason;

    if (hasSuperAdmin && !isSuperAdminVisible && !isRequestingAdminOrStaff) {
      isLocked = true;
      lockReason = 'সুপার অ্যাডমিনের সাথে চ্যাট বর্তমানে সাময়িকভাবে বন্ধ রয়েছে।';
    }

    const serializedMessages = messages.map((m) => ({
      ...m,
      attachments: m.attachments.map((att) => ({
        ...att,
        fileSize: Number(att.fileSize || 0),
      })),
    }));

    return {
      messages: serializedMessages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      isLocked,
      lockReason,
    };
  }

  /**
   * Save a message (supports TEXT, PAY_REQUEST, RECEIVE_REQUEST, IMAGE, FILE)
   */
  async saveMessage(params: {
    conversationId: string;
    senderId: string;
    content: string;
    messageType?: MessageType;
    metadata?: any;
    attachments?: Array<{ fileUrl: string; fileType: string; fileSize: number }>;
  }) {
    // Check if conversation participants include Super Admin while Super Admin chat visibility is OFF
    const [lockInfo, isSuperAdminVisible, convParticipants] = await Promise.all([
      this.isConversationLocked(params.conversationId),
      this.getSuperAdminChatVisibility(),
      this.prisma.conversationParticipant.findMany({
        where: { conversationId: params.conversationId },
        include: { user: { include: { userRoles: { include: { role: true } } } } },
      }),
    ]);

    const hasSuperAdmin = convParticipants.some((p) =>
      p.user?.userRoles?.some((ur) => ur.role.name === 'SUPER_ADMIN'),
    );

    const sender =
      convParticipants.find((p) => p.userId === params.senderId)?.user ||
      (await this.prisma.user.findUnique({
        where: { id: params.senderId },
        include: { userRoles: { include: { role: true } } },
      }));

    if (!sender || !sender.isActive || sender.deletedAt) {
      throw new ForbiddenException(
        'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে, চ্যাট করা সম্ভব নয়।',
      );
    }

    const senderRoles = sender?.userRoles?.map((ur) => ur.role.name) || [];
    const isStaffOrAdmin =
      senderRoles.includes('ADMIN') ||
      senderRoles.includes('SUPER_ADMIN') ||
      senderRoles.includes('SUPPORT_ADMIN') ||
      senderRoles.includes('EMPLOYEE');

    if (hasSuperAdmin && !isSuperAdminVisible && !isStaffOrAdmin) {
      throw new BadRequestException(
        'সুপার অ্যাডমিনের সাথে চ্যাট বর্তমানে সাময়িকভাবে বন্ধ রয়েছে। প্রয়োজনে হেল্পলাইন বা ডিসপ্যুট কিউ ব্যবহার করুন।',
      );
    }

    // Check if conversation is locked by Super Admin
    if (lockInfo.isLocked) {
      if (!isStaffOrAdmin && !params.metadata?.isAdminNotice) {
        throw new BadRequestException(
          lockInfo.reason ||
            'এই চ্যাটটি অ্যাডমিন সাময়িকভাবে বন্ধ বা লক করে রেখেছেন। নতুন মেসেজ পাঠানো বন্ধ রয়েছে।',
        );
      }
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: params.conversationId,
          senderId: params.senderId,
          content: params.content,
          messageType: params.messageType || 'TEXT',
          metadata: params.metadata || Prisma.JsonNull,
          ...(params.attachments && params.attachments.length > 0
            ? {
                attachments: {
                  create: params.attachments.map((att) => ({
                    fileUrl: att.fileUrl,
                    fileType: att.fileType,
                    fileSize: BigInt(att.fileSize || 0),
                  })),
                },
              }
            : {}),
        },
        include: {
          sender: {
            select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true },
          },
          attachments: true,
        },
      });

      // Update conversation updatedAt
      await tx.conversation.update({
        where: { id: params.conversationId },
        data: { updatedAt: new Date() },
      });

      return {
        ...msg,
        attachments: msg.attachments.map((att) => ({
          ...att,
          fileSize: Number(att.fileSize || 0),
        })),
      };
    });

    return message;
  }

  /**
   * Mark messages as seen by user
   */
  async markAsSeen(conversationId: string, userId: string) {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  /**
   * Fetch active transaction for a conversation
   */
  async getConversationTransaction(conversationId: string) {
    let tx = await this.prisma.transaction.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
        receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
        workLogs: { orderBy: { createdAt: 'desc' } },
        dispute: true,
      },
    });

    if (!tx) {
      // Fallback: check if participants have an ongoing transaction
      const participants = await this.prisma.conversationParticipant.findMany({
        where: { conversationId },
      });
      if (participants.length === 2) {
        const u1 = participants[0].userId;
        const u2 = participants[1].userId;
        tx = await this.prisma.transaction.findFirst({
          where: {
            OR: [
              { senderId: u1, receiverId: u2 },
              { senderId: u2, receiverId: u1 },
            ],
          },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
            receiver: { select: { id: true, uniqueUserId: true, firstName: true, lastName: true, avatarUrl: true, phone: true } },
            workLogs: { orderBy: { createdAt: 'desc' } },
            dispute: true,
          },
        });
      }
    }

    return tx;
  }

  /**
   * Super Admin & Staff: Fetch all platform conversations with live deal and escrow telemetry
   */
  async getAllConversationsAdmin(query: {
    filter?: 'ALL' | 'ACTIVE_ESCROW' | 'DISPUTED' | 'REQUESTS';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 30;
    const skip = (page - 1) * limit;
    const filter = query.filter || 'ALL';
    const search = query.search?.trim();

    // 1. Calculate platform-wide live telemetry stats
    const [
      totalConversations,
      activeEscrowDealsCount,
      heldTransactions,
      activeDisputesCount,
      pendingRequestsCount,
    ] = await Promise.all([
      this.prisma.conversation.count(),
      this.prisma.transaction.count({
        where: {
          status: { in: ['HOLD', 'WORKING'] },
        },
      }),
      this.prisma.transaction.findMany({
        where: { status: 'HOLD' },
        select: { amount: true },
      }),
      this.prisma.dispute.count({
        where: {
          status: { in: ['ACTIVE_CALL', 'UNRESOLVED', 'HOLD_BALANCE'] },
        },
      }),
      this.prisma.transaction.count({
        where: { status: 'REQUESTED' },
      }),
    ]);

    const totalEscrowHeld = heldTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );

    // 2. Build where filter for conversations
    const where: Prisma.ConversationWhereInput = {};

    if (search) {
      where.OR = [
        {
          participants: {
            some: {
              user: {
                OR: [
                  { uniqueUserId: { contains: search } },
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
                  { phone: { contains: search } },
                  { email: { contains: search } },
                ],
              },
            },
          },
        },
        {
          transactions: {
            some: {
              trackingNumber: { contains: search },
            },
          },
        },
        {
          messages: {
            some: {
              content: { contains: search },
            },
          },
        },
      ];
    }

    if (filter === 'ACTIVE_ESCROW') {
      where.transactions = {
        some: {
          status: { in: ['HOLD', 'WORKING'] },
        },
      };
    } else if (filter === 'DISPUTED') {
      where.transactions = {
        some: {
          OR: [
            { status: 'DISPUTED' },
            { dispute: { isNot: null } },
          ],
        },
      };
    } else if (filter === 'REQUESTS') {
      where.OR = [
        {
          transactions: {
            some: {
              status: 'REQUESTED',
            },
          },
        },
        {
          messages: {
            some: {
              messageType: { in: ['PAY_REQUEST', 'RECEIVE_REQUEST'] },
            },
          },
        },
      ];
    }

    // 3. Query matching conversations
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  uniqueUserId: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  avatarUrl: true,
                  isVerified: true,
                  isActive: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  uniqueUserId: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              sender: {
                select: {
                  id: true,
                  uniqueUserId: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  uniqueUserId: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
              dispute: true,
              workLogs: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const [lockedMap, isSuperAdminVisible] = await Promise.all([
      this.getLockedConversations(),
      this.getSuperAdminChatVisibility(),
    ]);

    // Format & enrich conversations
    const items = conversations.map((conv) => {
      const p1 = conv.participants[0]?.user || null;
      const p2 = conv.participants[1]?.user || null;
      const lastMessage = conv.messages[0] || null;

      // Prioritize active escrow deals: HOLD, WORKING, DISPUTED, REQUESTED
      const activeTransaction =
        conv.transactions.find((t) =>
          ['HOLD', 'WORKING', 'DISPUTED', 'REQUESTED'].includes(t.status),
        ) ||
        conv.transactions[0] ||
        null;

      // Extract transaction or hold summary
      const dealStatus = activeTransaction?.status || null;
      const dealAmount = activeTransaction ? Number(activeTransaction.amount) : 0;
      const trackingNumber = activeTransaction?.trackingNumber || null;
      const dispute = activeTransaction?.dispute || null;

      const lockItem = lockedMap[conv.id];

      return {
        id: conv.id,
        type: conv.type,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        participantCount: conv.participants.length,
        user1: p1,
        user2: p2,
        isLocked: Boolean(lockItem?.isLocked),
        lockedReason: lockItem?.reason || null,
        lockedBy: lockItem?.lockedBy || null,
        lockedAt: lockItem?.lockedAt || null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              messageType: lastMessage.messageType,
              createdAt: lastMessage.createdAt,
              sender: lastMessage.sender,
              metadata: lastMessage.metadata,
            }
          : null,
        totalMessages: conv._count.messages,
        activeTransaction: activeTransaction
          ? {
              id: activeTransaction.id,
              trackingNumber: activeTransaction.trackingNumber,
              amount: Number(activeTransaction.amount),
              totalRequired: Number(activeTransaction.totalRequired),
              status: activeTransaction.status,
              transactionType: activeTransaction.transactionType,
              sender: activeTransaction.sender,
              receiver: activeTransaction.receiver,
              workStartTime: activeTransaction.workStartTime,
              workExpectedDuration: activeTransaction.workExpectedDuration,
              dispute: activeTransaction.dispute,
            }
          : null,
        dealStatus,
        dealAmount,
        trackingNumber,
        hasDispute: Boolean(dispute || dealStatus === 'DISPUTED'),
        allTransactions: conv.transactions.map((t) => ({
          id: t.id,
          trackingNumber: t.trackingNumber,
          amount: Number(t.amount),
          status: t.status,
          createdAt: t.createdAt,
        })),
      };
    });

    return {
      stats: {
        totalConversations,
        activeEscrowDeals: activeEscrowDealsCount,
        totalEscrowHeld,
        activeDisputes: activeDisputesCount,
        pendingRequests: pendingRequestsCount,
      },
      isSuperAdminChatVisible: isSuperAdminVisible,
      conversations: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Send an administrative message or official intervention notice into any conversation
   */
  async sendAdminMessage(
    conversationId: string,
    adminUser: { id: string; firstName: string; lastName: string; uniqueUserId: string },
    dto: {
      content: string;
      messageType?: MessageType;
      isAdminNotice?: boolean;
      adminTitle?: string;
    },
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const isNotice = dto.isAdminNotice !== false;
    const msgType = dto.messageType || (isNotice ? MessageType.ADMIN_INTERVENTION : MessageType.TEXT);

    const saved = await this.saveMessage({
      conversationId,
      senderId: adminUser.id,
      content: dto.content,
      messageType: msgType,
      metadata: {
        isAdminNotice: isNotice,
        adminTitle: dto.adminTitle || 'SafnexBD Authority Notice',
        adminName: `${adminUser.firstName} ${adminUser.lastName}`.trim(),
        adminUniqueId: adminUser.uniqueUserId,
        sentAt: new Date().toISOString(),
      },
    });

    return saved;
  }

  /**
   * Fetch all locked conversations dictionary
   */
  async getLockedConversations(): Promise<
    Record<string, { isLocked: boolean; reason?: string; lockedBy?: string; lockedAt?: string }>
  > {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'chat_locked_conversations' },
      });
      return (setting?.value as any) || {};
    } catch {
      return {};
    }
  }

  /**
   * Check if a single conversation is locked
   */
  async isConversationLocked(
    conversationId: string,
  ): Promise<{ isLocked: boolean; reason?: string; lockedBy?: string; lockedAt?: string }> {
    const lockedMap = await this.getLockedConversations();
    const item = lockedMap[conversationId];
    if (item && item.isLocked) {
      return item;
    }
    return { isLocked: false };
  }

  /**
   * Super Admin & Staff: Toggle conversation lock (Chat ON/OFF)
   */
  async toggleConversationLock(
    conversationId: string,
    isLocked: boolean,
    reason?: string,
    adminUser?: { id: string; firstName: string; lastName: string; uniqueUserId: string },
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const lockedMap = await this.getLockedConversations();
    if (isLocked) {
      lockedMap[conversationId] = {
        isLocked: true,
        reason:
          reason?.trim() ||
          'এই চ্যাটটি অ্যাডমিন সাময়িকভাবে বন্ধ বা লক করে রেখেছেন। নতুন মেসেজ পাঠানো বন্ধ রয়েছে।',
        lockedBy: adminUser ? `${adminUser.firstName} ${adminUser.lastName}`.trim() : 'Super Admin',
        lockedAt: new Date().toISOString(),
      };
    } else {
      delete lockedMap[conversationId];
    }

    await this.prisma.systemSetting.upsert({
      where: { key: 'chat_locked_conversations' },
      create: {
        key: 'chat_locked_conversations',
        value: lockedMap,
        category: 'CHAT',
        isPublic: true,
        description: 'Map of currently locked user conversations',
      },
      update: {
        value: lockedMap,
      },
    });

    // Update conversation participants blocked status
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId },
      data: { isBlocked: isLocked },
    }).catch(() => null);

    return {
      conversationId,
      isLocked,
      reason: isLocked ? lockedMap[conversationId]?.reason : null,
      lockedBy: isLocked ? lockedMap[conversationId]?.lockedBy : null,
      lockedAt: isLocked ? lockedMap[conversationId]?.lockedAt : null,
    };
  }

  /**
   * Check whether Super Admin is visible / active in chat search
   */
  async getSuperAdminChatVisibility(): Promise<boolean> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'super_admin_chat_visibility' },
      });
      if (!setting || !setting.value) return false;
      const val = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      return val?.isVisible === true;
    } catch {
      return false; // Default: hidden
    }
  }

  /**
   * Toggle Super Admin presence / visibility
   */
  async setSuperAdminChatVisibility(isVisible: boolean): Promise<boolean> {
    await this.prisma.systemSetting.upsert({
      where: { key: 'super_admin_chat_visibility' },
      create: {
        key: 'super_admin_chat_visibility',
        value: { isVisible },
        category: 'CHAT',
        isPublic: true,
        description: 'Super Admin self chat presence and search visibility switch',
      },
      update: {
        value: { isVisible },
      },
    });
    return isVisible;
  }

  /**
   * Get Chat Safety Guidelines and Quick Message Templates
   */
  async getChatSafetyAndTemplates() {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'chat_safety_rules_and_templates' },
      });
      if (!setting || !setting.value) {
        return DEFAULT_CHAT_SAFETY_AND_TEMPLATES;
      }
      const val = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      return {
        isEnabled: val.isEnabled ?? DEFAULT_CHAT_SAFETY_AND_TEMPLATES.isEnabled,
        banner: {
          ...DEFAULT_CHAT_SAFETY_AND_TEMPLATES.banner,
          ...(val.banner || {}),
          rules: Array.isArray(val.banner?.rules) ? val.banner.rules : DEFAULT_CHAT_SAFETY_AND_TEMPLATES.banner.rules,
        },
        templates: Array.isArray(val.templates) ? val.templates : DEFAULT_CHAT_SAFETY_AND_TEMPLATES.templates,
      };
    } catch {
      return DEFAULT_CHAT_SAFETY_AND_TEMPLATES;
    }
  }

  /**
   * Update Chat Safety Guidelines and Quick Message Templates (Admin)
   */
  async updateChatSafetyAndTemplates(payload: any, adminId?: string) {
    const current = await this.getChatSafetyAndTemplates();
    const updated = {
      isEnabled: payload.isEnabled ?? current.isEnabled,
      banner: {
        title: payload.banner?.title ?? current.banner.title,
        subtitle: payload.banner?.subtitle ?? current.banner.subtitle,
        theme: payload.banner?.theme ?? current.banner.theme,
        badgeText: payload.banner?.badgeText ?? current.banner.badgeText,
        rules: Array.isArray(payload.banner?.rules) ? payload.banner.rules : current.banner.rules,
      },
      templates: Array.isArray(payload.templates) ? payload.templates : current.templates,
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'chat_safety_rules_and_templates' },
      create: {
        key: 'chat_safety_rules_and_templates',
        value: updated,
        category: 'CHAT',
        isPublic: true,
        description: 'Chat Safety Guidelines Banner and Quick Message Templates configuration',
      },
      update: {
        value: updated,
      },
    });

    if (adminId) {
      await this.prisma.auditLog
        .create({
          data: {
            actorId: adminId,
            actorType: 'ADMIN',
            action: 'CHAT_SETTINGS_UPDATE',
            targetEntity: 'SystemSetting',
            targetId: 'chat_safety_rules_and_templates',
            beforeState: current,
            afterState: updated,
            reason: 'Updated Chat Safety Guidelines & Quick Templates',
          },
        })
        .catch(() => null);
    }

    return updated;
  }
}

export const DEFAULT_CHAT_SAFETY_AND_TEMPLATES = {
  isEnabled: true,
  banner: {
    title: 'SafnexBD অফিসিয়াল সুরক্ষা ও লেনদেন গাইডলাইন',
    subtitle: 'প্রতারণা এড়াতে এবং আপনার লেনদেন শতভাগ নিরাপদ রাখতে নিচের নিয়মগুলো মনোযোগ দিয়ে পড়ুন:',
    theme: 'amber',
    badgeText: 'অফিসিয়াল সিকিউরিটি রুলস',
    rules: [
      {
        id: '1',
        icon: '🛡️',
        title: 'প্ল্যাটফর্মের বাইরে কোনো লেনদেন করবেন না',
        desc: 'ব্যক্তিগত বিকাশ/নগদ বা অফলাইনে লেনদেন করলে SafnexBD কোনো দায়ভার বহন করবে না।',
      },
      {
        id: '2',
        icon: '🔒',
        title: 'এসক্রো সিস্টেমে টাকা ১০০% নিরাপদ',
        desc: 'লেনদেনের টাকা প্ল্যাটফর্মের হোল্ডে সুরক্ষিত থাকে, কাজ বা পণ্য বুঝে পাওয়ার পরেই কেবল টাকা রিলিজ হবে।',
      },
      {
        id: '3',
        icon: '📦',
        title: 'কাজের প্রমাণ ও ডেলিভারি নিশ্চিত করুন',
        desc: 'সবকিছু সঠিকভাবে সম্পন্ন হলে পেমেন্ট রিলিজ করবেন, কোনো সমস্যা বা অমিল থাকলে সাথে সাথে ডিসপ্যুট ওপেন করুন।',
      },
      {
        id: '4',
        icon: '⚠️',
        title: 'গোপনীয় তথ্য কখনোই শেয়ার করবেন না',
        desc: 'আপনার অ্যাকাউন্ট পাসওয়ার্ড, পিন কোড, ওটিপি বা ব্যাংক সিকিউরিটি তথ্য কারো সাথে শেয়ার করবেন না।',
      },
    ],
  },
  templates: [
    {
      id: '1',
      target: 'ALL',
      icon: '👋',
      title: 'সালাম ও কুশল',
      text: 'আসসালামু আলাইকুম, কেমন আছেন? আপনার পণ্য বা সার্ভিস সম্পর্কে কিছু তথ্য জানতে চাচ্ছিলাম।',
    },
    {
      id: '2',
      target: 'BUYER',
      icon: '🛍️',
      title: 'স্টক যাচাই',
      text: 'পণ্যটি কি এখনো অ্যাভেইলেবল আছে? আমি কিনতে আগ্রহী।',
    },
    {
      id: '3',
      target: 'BUYER',
      icon: '💰',
      title: 'দাম আলোচনা',
      text: 'পণ্যটির শেষ বা ফিক্সড প্রাইস কত রাখা যাবে? কিছু ডিসকাউন্ট দেওয়া সম্ভব কি?',
    },
    {
      id: '4',
      target: 'BUYER',
      icon: '⏳',
      title: 'ডেলিভারি সময়',
      text: 'অর্ডার কনফার্ম করার পর কতক্ষণের মধ্যে ডেলিভারি বা কাজ হস্তান্তর করতে পারবেন?',
    },
    {
      id: '5',
      target: 'SELLER',
      icon: '✅',
      title: 'প্রোডাক্ট প্রস্তুত',
      text: 'জি, পণ্যটি সম্পূর্ণ প্রস্তুত আছে। আপনি এখনই এসক্রো পেমেন্ট রিকোয়েস্ট একসেপ্ট করতে পারেন।',
    },
    {
      id: '6',
      target: 'SELLER',
      icon: '💳',
      title: 'পেমেন্ট রিকোয়েস্ট',
      text: 'আমি চ্যাটে অফিসিয়াল পেমেন্ট রিকোয়েস্ট পাঠিয়েছি, অনুগ্রহ করে একসেপ্ট করে টাকা হোল্ডে রাখুন।',
    },
    {
      id: '7',
      target: 'SELLER',
      icon: '🚀',
      title: 'কাজ সম্পন্ন',
      text: 'আপনার কাজটি সফলভাবে সম্পন্ন হয়েছে এবং প্রয়োজনীয় ফাইল পাঠানো হয়েছে। অনুগ্রহ করে চেক করে পেমেন্ট রিলিজ করুন।',
    },
    {
      id: '8',
      target: 'ALL',
      icon: '🤝',
      title: 'ধন্যবাদ',
      text: 'আপনার চমৎকার সহযোগিতার জন্য ধন্যবাদ। আশা করি আবার লেনদেন হবে!',
    },
  ],
};

