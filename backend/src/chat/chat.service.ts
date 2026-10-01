import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => TelegramService))
    private telegramService?: TelegramService,
  ) {}

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
        where: {
          userId,
          conversation: {
            participants: {
              some: {
                userId: { not: userId },
                user: {
                  deletedAt: null,
                  isActive: true,
                },
              },
            },
          },
        },
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
                      isActive: true,
                      deletedAt: true,
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

    const adminChatSettings = await this.getAdminChatSettings();

    const filteredParticipants =
      !isSuperAdminVisible && !adminChatSettings.isEnabled && !isCurrentAdminOrStaff
        ? participants.filter((p) => {
            const otherParticipant = p.conversation.participants.find(
              (cp) => cp.userId !== userId,
            );
            const isOtherSuperAdmin = otherParticipant?.user?.userRoles?.some(
              (ur) => ur.role.name === 'SUPER_ADMIN',
            );
            return !isOtherSuperAdmin || p.conversation.messages.length > 0;
          })
        : participants;

    // Compute unread message counts per conversation for current user
    const unreadMap = new Map<string, number>();
    try {
      const unreadRows: any[] = await this.prisma.$queryRaw`
        SELECT cp.conversationId, CAST(COUNT(m.id) AS UNSIGNED) AS unreadCount
        FROM conversation_participants cp
        JOIN messages m ON m.conversationId = cp.conversationId 
          AND m.senderId != ${userId} 
          AND m.isDeleted = 0 
          AND (cp.lastReadAt IS NULL OR m.createdAt > cp.lastReadAt)
        WHERE cp.userId = ${userId}
        GROUP BY cp.conversationId
      `;
      for (const row of unreadRows) {
        unreadMap.set(row.conversationId, Number(row.unreadCount || 0));
      }
    } catch (rawErr) {
      console.error('Failed to query unread message counts:', rawErr);
    }

    const mapped = filteredParticipants
      .map((p) => {
        const otherParticipant = p.conversation.participants.find(
          (cp) => cp.userId !== userId && cp.user && !cp.user.deletedAt && cp.user.isActive !== false,
        );
        const lastMessage = p.conversation.messages[0] || null;
        const activeTransaction = (p.conversation as any).transactions?.[0] || null;
        const lastMessageAt = lastMessage?.createdAt || p.conversation.updatedAt;
        const unreadCount = unreadMap.get(p.conversationId) || 0;

        let otherUserObj: any = otherParticipant?.user;
        const isOtherAdminOrStaff = otherUserObj?.userRoles?.some((ur: any) =>
          ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE'].includes(ur.role.name),
        );

        if (otherUserObj && !isCurrentAdminOrStaff && isOtherAdminOrStaff) {
          otherUserObj = {
            ...otherUserObj,
            firstName: 'SafnexBD',
            lastName: 'Admin',
            uniqueUserId: 'SafnexBD_Admin',
            avatarUrl: null,
            phone: null,
            email: null,
            isVerified: true,
            isSafnexAdmin: true,
          };
        }

        return {
          conversationId: p.conversationId,
          otherUser: otherUserObj,
          lastMessage,
          activeTransaction,
          updatedAt: p.conversation.updatedAt,
          lastMessageAt,
          unreadCount,
        };
      })
      .filter((c) => !!c.otherUser && !c.otherUser.deletedAt && c.otherUser.isActive !== false);

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
          item.unreadCount = (item.unreadCount || 0) + (existing.unreadCount || 0);
          uniqueMap.set(otherId, item);
        } else {
          existing.unreadCount = (existing.unreadCount || 0) + (item.unreadCount || 0);
        }
      }
    }

    const result = Array.from(uniqueMap.values());
    result.sort((a, b) => {
      const timeA = Math.max(
        a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0,
        a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0,
        new Date(a.updatedAt).getTime()
      );
      const timeB = Math.max(
        b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0,
        b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0,
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
    const [conv, currentUser] = await Promise.all([
      this.prisma.conversation.findUnique({
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
                  isActive: true,
                  deletedAt: true,
                  userRoles: {
                    select: { role: { select: { name: true } } },
                  },
                },
              },
            },
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { userRoles: { include: { role: true } } },
      }),
    ]);

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    const otherParticipant = conv.participants.find((p) => p.userId !== userId);
    if (!otherParticipant?.user || otherParticipant.user.deletedAt || otherParticipant.user.isActive === false) {
      throw new NotFoundException('Conversation participant is no longer available');
    }

    const isCurrentAdminOrStaff = currentUser?.userRoles?.some((ur) =>
      ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE'].includes(ur.role.name),
    );
    const isOtherAdminOrStaff = otherParticipant.user.userRoles?.some((ur) =>
      ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE'].includes(ur.role.name),
    );

    const otherUserObj =
      !isCurrentAdminOrStaff && isOtherAdminOrStaff
        ? {
            ...otherParticipant.user,
            firstName: 'SafnexBD',
            lastName: 'Admin',
            uniqueUserId: 'SafnexBD_Admin',
            avatarUrl: null,
            phone: null,
            email: null,
            isVerified: true,
            isSafnexAdmin: true,
          }
        : otherParticipant.user;

    return {
      ...conv,
      conversationId: conv.id,
      otherUser: otherUserObj,
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

    const [adminChatSettings, liveSessionsMap] = await Promise.all([
      this.getAdminChatSettings(),
      this.getLiveChatSessions(),
    ]);

    let isLocked = lockInfo.isLocked;
    let lockReason = lockInfo.reason;

    if (hasSuperAdmin && !adminChatSettings.isEnabled && !isRequestingAdminOrStaff) {
      isLocked = true;
      lockReason = 'SafnexBD অ্যাডমিন চ্যাট বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে পরবর্তীতে চেষ্টা করুন।';
    } else if (hasSuperAdmin && !isSuperAdminVisible && !isRequestingAdminOrStaff && convParticipants.every((p) => (p.user as any)?.id !== requestingUserId)) {
      isLocked = true;
      lockReason = 'সুপার অ্যাডমিনের সাথে চ্যাট বর্তমানে সাময়িকভাবে বন্ধ রয়েছে।';
    }

    const serializedMessages = messages.map((m) => {
      const isSenderNotRequester = requestingUserId && m.senderId !== requestingUserId;
      const senderParticipant = convParticipants.find((cp) => cp.userId === m.senderId);
      const isSenderAdminOrStaff =
        senderParticipant?.user?.userRoles?.some((ur) =>
          ['SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE'].includes(ur.role.name),
        ) || Boolean((m.metadata as any)?.isSafnexAdmin);

      // Mask admin/staff name as "SafnexBD Admin" when viewed by a regular user in an admin chat
      const shouldMaskSender =
        !isRequestingAdminOrStaff &&
        isSenderNotRequester &&
        (hasSuperAdmin || isSenderAdminOrStaff);

      return {
        ...m,
        sender: shouldMaskSender
          ? {
              id: m.sender?.id || m.senderId,
              uniqueUserId: 'SafnexBD_Admin',
              firstName: 'SafnexBD',
              lastName: 'Admin',
              avatarUrl: null,
            }
          : m.sender,
        attachments: m.attachments.map((att) => ({
          ...att,
          fileSize: Number(att.fileSize || 0),
        })),
      };
    });

    return {
      messages: serializedMessages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      isLocked,
      lockReason,
      isAdminChatEnabled: adminChatSettings.isEnabled,
      isLiveChat: Boolean(liveSessionsMap[conversationId]?.isLive),
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
    // Check if conversation participants include Super Admin while Admin Chat is OFF
    const [lockInfo, isSuperAdminVisible, adminChatSettings, convParticipants] = await Promise.all([
      this.isConversationLocked(params.conversationId),
      this.getSuperAdminChatVisibility(),
      this.getAdminChatSettings(),
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

    if (hasSuperAdmin && !isStaffOrAdmin) {
      if (!adminChatSettings.isEnabled) {
        throw new BadRequestException(
          'SafnexBD অ্যাডমিন চ্যাট বর্তমানে বন্ধ রয়েছে। এই মুহূর্তে মেসেজ পাঠানো যাবে না।',
        );
      }
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

      // Update sender's lastReadAt so own messages are not counted as unread
      await tx.conversationParticipant.updateMany({
        where: { conversationId: params.conversationId, userId: params.senderId },
        data: { lastReadAt: new Date() },
      });

      return {
        ...msg,
        attachments: msg.attachments.map((att) => ({
          ...att,
          fileSize: Number(att.fileSize || 0),
        })),
      };
    });

    // If a regular user sends a message (and it's not a welcome message), mark this conversation as active Live Chat
    if (!isStaffOrAdmin && !params.metadata?.isWelcomeMessage) {
      await this.setConversationLiveStatus(params.conversationId, true, params.senderId).catch(
        () => null,
      );
    }

    // Trigger Telegram Notification for recipient if connected
    if (this.telegramService) {
      const recipient = convParticipants.find((p) => p.userId !== params.senderId);
      if (recipient?.userId) {
        const senderName =
          isStaffOrAdmin && hasSuperAdmin
            ? 'SafnexBD Admin'
            : `${sender.firstName} ${sender.lastName}`.trim();
        const snippet =
          params.content.length > 80
            ? params.content.slice(0, 77) + '...'
            : params.content;
        this.telegramService
          .sendUserAlert(
            recipient.userId,
            'chatMessage',
            {
              senderName,
              senderUniqueId: isStaffOrAdmin && hasSuperAdmin ? 'SafnexBD_Admin' : sender.uniqueUserId,
              messageSnippet: snippet,
            },
            [
              {
                text: `💬 চ্যাট দেখুন`,
                callback_data: `chat_with_${sender.id}`,
              },
            ],
          )
          .catch(() => null);
      }
    }

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
    filter?:
      | 'ALL'
      | 'LIVE_CHAT'
      | 'ADMIN_SUPPORT'
      | 'ADMIN_LIVE_CHAT'
      | 'ACTIVE_ESCROW'
      | 'DISPUTED'
      | 'REQUESTS';
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 30;
    const skip = (page - 1) * limit;
    const filter = query.filter || 'ALL';
    const search = query.search?.trim();

    const liveSessionsMap = await this.getLiveChatSessions();
    const activeLiveIds = Object.keys(liveSessionsMap).filter(
      (cid) => liveSessionsMap[cid]?.isLive === true,
    );

    const adminSupportParticipantFilter: Prisma.ConversationWhereInput = {
      participants: {
        some: {
          user: {
            userRoles: {
              some: {
                role: {
                  name: { in: ['SUPER_ADMIN', 'ADMIN'] },
                },
              },
            },
          },
        },
      },
    };

    const userToUserFilter: Prisma.ConversationWhereInput = {
      OR: [
        {
          participants: {
            none: {
              user: {
                userRoles: {
                  some: {
                    role: {
                      name: { in: ['SUPER_ADMIN', 'ADMIN'] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          transactions: {
            some: {},
          },
        },
      ],
    };

    // 1. Calculate platform-wide live telemetry stats (separated for User-to-User vs Admin Support)
    const [
      totalConversations,
      activeEscrowDealsCount,
      heldTransactions,
      activeDisputesCount,
      pendingRequestsCount,
      userLiveChatCount,
      adminLiveChatCount,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: userToUserFilter }),
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
      activeLiveIds.length > 0
        ? this.prisma.conversation.count({
            where: {
              AND: [{ id: { in: activeLiveIds } }, userToUserFilter],
            },
          })
        : Promise.resolve(0),
      activeLiveIds.length > 0
        ? this.prisma.conversation.count({
            where: {
              AND: [{ id: { in: activeLiveIds } }, adminSupportParticipantFilter],
            },
          })
        : Promise.resolve(0),
    ]);

    const totalEscrowHeld = heldTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );

    // 2. Build where filter for conversations
    const andConditions: Prisma.ConversationWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
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
        ],
      });
    }

    if (filter === 'ADMIN_SUPPORT') {
      andConditions.push(adminSupportParticipantFilter);
    } else if (filter === 'ADMIN_LIVE_CHAT') {
      andConditions.push(adminSupportParticipantFilter);
      andConditions.push({
        id: { in: activeLiveIds.length > 0 ? activeLiveIds : ['__no_live_chat__'] },
      });
    } else {
      // For /admin/cms (ALL, LIVE_CHAT, ACTIVE_ESCROW, DISPUTED, REQUESTS), show User-to-User conversations only
      andConditions.push(userToUserFilter);

      if (filter === 'LIVE_CHAT') {
        andConditions.push({
          id: { in: activeLiveIds.length > 0 ? activeLiveIds : ['__no_live_chat__'] },
        });
      } else if (filter === 'ACTIVE_ESCROW') {
        andConditions.push({
          transactions: {
            some: {
              status: { in: ['HOLD', 'WORKING'] },
            },
          },
        });
      } else if (filter === 'DISPUTED') {
        andConditions.push({
          transactions: {
            some: {
              OR: [{ status: 'DISPUTED' }, { dispute: { isNot: null } }],
            },
          },
        });
      } else if (filter === 'REQUESTS') {
        andConditions.push({
          OR: [
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
          ],
        });
      }
    }

    const where: Prisma.ConversationWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

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
                  userRoles: {
                    select: { role: { select: { name: true } } },
                  },
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

    const [lockedMap, isSuperAdminVisible, adminChatSettings] = await Promise.all([
      this.getLockedConversations(),
      this.getSuperAdminChatVisibility(),
      this.getAdminChatSettings(),
    ]);

    // Format & enrich conversations
    const items = conversations.map((conv) => {
      const formatParticipant = (u: any) => {
        if (!u) return null;
        const roles = Array.isArray(u.userRoles)
          ? u.userRoles.map((ur: any) => ur?.role?.name).filter(Boolean)
          : [];
        return {
          ...u,
          roles,
        };
      };

      const p1 = formatParticipant(conv.participants[0]?.user);
      const p2 = formatParticipant(conv.participants[1]?.user);
      const participantsList = [p1, p2].filter(Boolean);
      const targetUser =
        participantsList.find(
          (u: any) => !u.roles?.includes('SUPER_ADMIN') && !u.roles?.includes('ADMIN'),
        ) ||
        p1 ||
        p2 ||
        null;

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
      const liveItem = liveSessionsMap[conv.id];
      const isLiveChat = Boolean(liveItem?.isLive);

      return {
        id: conv.id,
        type: conv.type,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        participantCount: conv.participants.length,
        user1: p1,
        user2: p2,
        participants: participantsList,
        targetUser,
        isLiveChat,
        liveStartedAt: liveItem?.startedAt || null,
        liveUpdatedAt: liveItem?.updatedAt || null,
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

    const isAdminSupportMode = filter === 'ADMIN_SUPPORT' || filter === 'ADMIN_LIVE_CHAT';

    return {
      stats: {
        totalConversations,
        liveChatCount: isAdminSupportMode ? adminLiveChatCount : userLiveChatCount,
        userLiveChatCount,
        adminLiveChatCount,
        activeEscrowDeals: activeEscrowDealsCount,
        totalEscrowHeld,
        activeDisputes: activeDisputesCount,
        pendingRequests: pendingRequestsCount,
      },
      isSuperAdminChatVisible: isSuperAdminVisible,
      adminChatSettings,
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
        isSafnexAdmin: true,
        adminTitle: dto.adminTitle || 'SafnexBD Authority Notice',
        adminName: 'SafnexBD Admin',
        staffName: `${adminUser.firstName} ${adminUser.lastName}`.trim(),
        adminUniqueId: adminUser.uniqueUserId,
        sentAt: new Date().toISOString(),
      },
    });

    // When Admin/Staff replies, clear the active Live Chat blink for this conversation until the user messages again
    await this.setConversationLiveStatus(conversationId, false).catch(() => null);

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

  /**
   * Delete / remove a conversation from user's recent chats list
   */
  async deleteConversationForUser(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.deleteMany({
      where: { conversationId, userId },
    });

    // If no participants left and no transactions linked, clean up the conversation
    const remaining = await this.prisma.conversationParticipant.count({
      where: { conversationId },
    });
    if (remaining === 0) {
      const hasTransactions = await this.prisma.transaction.count({
        where: { conversationId },
      });
      if (hasTransactions === 0) {
        await this.prisma.message.deleteMany({ where: { conversationId } }).catch(() => null);
        await this.prisma.conversation.delete({ where: { id: conversationId } }).catch(() => null);
      }
    }

    return { success: true, message: 'Conversation removed successfully' };
  }

  /**
   * Fetch all active live chat sessions dictionary (auto-expires after 10 minutes of inactivity)
   */
  async getLiveChatSessions(): Promise<
    Record<string, { isLive: boolean; startedAt?: string; updatedAt?: string; userId?: string }>
  > {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'chat_live_sessions' },
      });
      if (!setting || !setting.value) return {};
      const val =
        (typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value) || {};
      const nowMs = Date.now();
      const maxAgeMs = 10 * 60 * 1000; // 10 minutes
      const cleaned: Record<
        string,
        { isLive: boolean; startedAt?: string; updatedAt?: string; userId?: string }
      > = {};
      let pruned = false;

      for (const [cid, entry] of Object.entries<any>(val)) {
        if (!entry || !entry.isLive) {
          pruned = true;
          continue;
        }
        const ts = entry.updatedAt || entry.startedAt;
        const ageMs = ts ? nowMs - new Date(ts).getTime() : maxAgeMs + 1;
        if (ageMs <= maxAgeMs) {
          cleaned[cid] = entry;
        } else {
          pruned = true;
        }
      }

      if (pruned) {
        await this.prisma.systemSetting
          .update({
            where: { key: 'chat_live_sessions' },
            data: { value: cleaned },
          })
          .catch(() => null);
      }

      return cleaned;
    } catch {
      return {};
    }
  }

  /**
   * Search users by ID, Name, Phone, or Email for Admin/Staff Support Chat
   */
  async searchUsersForAdminChat(rawQuery: string) {
    const q = (rawQuery || '').trim();
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      isActive: true,
      userRoles: {
        none: {
          role: {
            name: { in: ['SUPER_ADMIN', 'ADMIN'] },
          },
        },
      },
    };

    if (q) {
      where.OR = [
        { uniqueUserId: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        uniqueUserId: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    return users;
  }

  /**
   * Count active live chat sessions
   */
  async getActiveLiveChatCount(): Promise<number> {
    const sessions = await this.getLiveChatSessions();
    const activeIds = Object.keys(sessions).filter((cid) => sessions[cid]?.isLive === true);
    if (activeIds.length === 0) return 0;
    return this.prisma.conversation.count({
      where: { id: { in: activeIds } },
    });
  }

  /**
   * Toggle or set whether a conversation is in active Live Chat
   */
  async setConversationLiveStatus(
    conversationId: string,
    isLive: boolean,
    userId?: string,
  ) {
    const sessions = await this.getLiveChatSessions();
    const now = new Date().toISOString();

    if (isLive) {
      sessions[conversationId] = {
        isLive: true,
        startedAt: sessions[conversationId]?.startedAt || now,
        updatedAt: now,
        userId: userId || sessions[conversationId]?.userId,
      };
    } else {
      delete sessions[conversationId];
    }

    await this.prisma.systemSetting.upsert({
      where: { key: 'chat_live_sessions' },
      create: {
        key: 'chat_live_sessions',
        value: sessions,
        category: 'CHAT',
        isPublic: false,
        description: 'Active live chat sessions map',
      },
      update: {
        value: sessions,
      },
    });

    return {
      conversationId,
      isLive,
      updatedAt: now,
    };
  }

  /**
   * Get Admin Chat Settings (ON/OFF status + customizable Welcome Message template + Custom Quick Replies)
   */
  async getAdminChatSettings(): Promise<{
    isEnabled: boolean;
    welcomeMessageEnabled: boolean;
    welcomeMessageTemplate: string;
    quickReplies: Array<{ id: string; title: string; text: string }>;
  }> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'admin_chat_settings' },
      });
      if (!setting || !setting.value) {
        return DEFAULT_ADMIN_CHAT_SETTINGS;
      }
      const val = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      return {
        isEnabled: val.isEnabled ?? DEFAULT_ADMIN_CHAT_SETTINGS.isEnabled,
        welcomeMessageEnabled:
          val.welcomeMessageEnabled ?? DEFAULT_ADMIN_CHAT_SETTINGS.welcomeMessageEnabled,
        welcomeMessageTemplate:
          typeof val.welcomeMessageTemplate === 'string' && val.welcomeMessageTemplate.trim()
            ? val.welcomeMessageTemplate
            : DEFAULT_ADMIN_CHAT_SETTINGS.welcomeMessageTemplate,
        quickReplies:
          Array.isArray(val.quickReplies) && val.quickReplies.length > 0
            ? val.quickReplies
            : DEFAULT_ADMIN_CHAT_SETTINGS.quickReplies,
      };
    } catch {
      return DEFAULT_ADMIN_CHAT_SETTINGS;
    }
  }

  /**
   * Update Admin Chat Settings (ON/OFF + Welcome Message template + Custom Quick Replies)
   */
  async updateAdminChatSettings(
    payload: {
      isEnabled?: boolean;
      welcomeMessageEnabled?: boolean;
      welcomeMessageTemplate?: string;
      quickReplies?: Array<{ id: string; title: string; text: string }>;
    },
    adminId?: string,
  ) {
    const current = await this.getAdminChatSettings();
    const updated = {
      isEnabled: payload.isEnabled ?? current.isEnabled,
      welcomeMessageEnabled: payload.welcomeMessageEnabled ?? current.welcomeMessageEnabled,
      welcomeMessageTemplate:
        typeof payload.welcomeMessageTemplate === 'string' && payload.welcomeMessageTemplate.trim()
          ? payload.welcomeMessageTemplate
          : current.welcomeMessageTemplate,
      quickReplies: Array.isArray(payload.quickReplies)
        ? payload.quickReplies
        : current.quickReplies,
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'admin_chat_settings' },
      create: {
        key: 'admin_chat_settings',
        value: updated,
        category: 'CHAT',
        isPublic: true,
        description: 'SafnexBD Admin Chat ON/OFF, Welcome Message & Custom Quick Replies configuration',
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
            action: 'ADMIN_CHAT_SETTINGS_UPDATE',
            targetEntity: 'SystemSetting',
            targetId: 'admin_chat_settings',
            beforeState: current,
            afterState: updated,
            reason: 'Updated SafnexBD Admin Chat, Welcome Message & Quick Replies settings',
          },
        })
        .catch(() => null);
    }

    return updated;
  }

  /**
   * Get or create the official "SafnexBD Admin" support conversation for a user
   */
  async getOrCreateAdminSupportConversation(userId: string) {
    const caller = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!caller || !caller.isActive || caller.deletedAt) {
      throw new ForbiddenException('আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।');
    }

    // Find primary Super Admin or Admin user
    let adminAccount = await this.prisma.user.findFirst({
      where: {
        isActive: true,
        deletedAt: null,
        id: { not: userId },
        userRoles: {
          some: {
            role: { name: 'SUPER_ADMIN' },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminAccount) {
      adminAccount = await this.prisma.user.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
          id: { not: userId },
          userRoles: {
            some: {
              role: { name: { in: ['ADMIN', 'SUPPORT_ADMIN'] } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!adminAccount) {
      throw new NotFoundException('SafnexBD অ্যাডমিন সাপোর্ট বর্তমানে উপলব্ধ নেই।');
    }

    let conv = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: adminAccount.id } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [{ userId }, { userId: adminAccount.id }],
          },
        },
      });
    }

    const [settings, lockInfo, liveSessions] = await Promise.all([
      this.getAdminChatSettings(),
      this.isConversationLocked(conv.id),
      this.getLiveChatSessions(),
    ]);

    return {
      conversationId: conv.id,
      isAdminChatEnabled: settings.isEnabled,
      isLocked: lockInfo.isLocked || !settings.isEnabled,
      lockReason: !settings.isEnabled
        ? 'SafnexBD অ্যাডমিন চ্যাট বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে পরবর্তীতে চেষ্টা করুন।'
        : lockInfo.reason || null,
      isLiveChat: Boolean(liveSessions[conv.id]?.isLive),
      otherUser: {
        id: adminAccount.id,
        uniqueUserId: 'SafnexBD_Admin',
        firstName: 'SafnexBD',
        lastName: 'Admin',
        avatarUrl: null,
        isVerified: true,
      },
    };
  }

  /**
   * Automatically send Welcome Message from "SafnexBD Admin" to a newly registered user
   * when Admin Chat and Welcome Message are ON
   */
  async sendWelcomeMessageToNewUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    uniqueUserId?: string;
  }) {
    try {
      const settings = await this.getAdminChatSettings();
      if (!settings.isEnabled || !settings.welcomeMessageEnabled) {
        return null;
      }

      const supportConv = await this.getOrCreateAdminSupportConversation(user.id);
      if (!supportConv?.conversationId || !supportConv.otherUser?.id) {
        return null;
      }

      const firstName = (user.firstName || '').trim();
      const lastName = (user.lastName || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();

      const welcomeText = (settings.welcomeMessageTemplate || DEFAULT_ADMIN_CHAT_SETTINGS.welcomeMessageTemplate)
        .replace(/\{First Name\}\s*\{Last Name\}/gi, fullName)
        .replace(/\{First Name\}/gi, firstName)
        .replace(/\{Last Name\}/gi, lastName)
        .replace(/\{firstName\}/gi, firstName)
        .replace(/\{lastName\}/gi, lastName);

      const saved = await this.saveMessage({
        conversationId: supportConv.conversationId,
        senderId: supportConv.otherUser.id,
        content: welcomeText,
        messageType: MessageType.TEXT,
        metadata: {
          isWelcomeMessage: true,
          isSafnexAdmin: true,
          adminName: 'SafnexBD Admin',
          sentAt: new Date().toISOString(),
        },
      });

      return {
        conversationId: supportConv.conversationId,
        message: saved,
      };
    } catch (err) {
      console.error('Failed to send welcome message to new user:', err);
      return null;
    }
  }
}

export const DEFAULT_ADMIN_CHAT_SETTINGS = {
  isEnabled: true,
  welcomeMessageEnabled: true,
  welcomeMessageTemplate: `🎉 **Welcome to SafnexBD, {First Name} {Last Name}!**

আসসালামু আলাইকুম।
**SafnexBD-এ আপনাকে আন্তরিকভাবে স্বাগতম।** ❤️

আপনি এখন SafnexBD-এর একজন নতুন User। এখানে আপনি বিভিন্ন ধরনের কাজ, লেনদেন ও অনলাইন আয়ের সুযোগ সম্পর্কে জানতে পারবেন।

### 🚀 SafnexBD-তে আপনি যা করতে পারবেন

🔹 **Micro Job** — বিভিন্ন ছোট ছোট কাজ সম্পন্ন করে আয় করার সুযোগ।
🔹 **Affiliate Program** — আপনার Affiliate Link শেয়ার করে কমিশন আয়ের সুযোগ।
🔹 **Buy & Sell** — Product ও Service কেনাবেচা করতে পারবেন।
🔹 **Secure Transaction** — নিরাপদভাবে অনলাইন লেনদেন করার সুবিধা।
🔹 **Marketplace** — আপনার Product বা Service প্রচার ও বিক্রি করার সুযোগ।

### 💰 Affiliate দিয়ে আয়ের সুযোগ

আপনার বন্ধু, পরিচিতজন বা অন্যদের আপনার **Affiliate Link**-এর মাধ্যমে SafnexBD-তে নিয়ে আসুন।

তারা আপনার Link ব্যবহার করে SafnexBD-তে লেনদেন করলে, সেই লেনদেন থেকে কোম্পানির অর্জিত Profit-এর **২০% আপনি কমিশন হিসেবে পাওয়ার সুযোগ পাবেন।**

অর্থাৎ, আপনার Referral Network-এর কেউ লেনদেন করলে আপনি প্রতিটি লেনদেনের জন্য নিজে কাজ না করেও কমিশন পেতে পারেন।

**আপনার Link → তাদের Transaction → Company Profit → আপনার 20% Commission 💰**

আপনি তখন অনলাইনে না থাকলেও বা ঘুমিয়ে থাকলেও, আপনার Referral-এর মাধ্যমে যোগ্য লেনদেন হলে কমিশন জমা হতে পারে।
আপনার Network যত বাড়বে, কমিশন আয়ের সম্ভাবনাও তত বাড়বে। 🚀

### 📚 নতুন User হিসেবে কী করবেন?

SafnexBD-এর বিভিন্ন Feature, নিয়ম, নতুন Update এবং কীভাবে কাজ করবেন—এসব বিস্তারিত জানতে নিয়মিত **Menu → Guides & Tutorials** সেকশনটি দেখুন।

আপনার কোনো প্রশ্ন থাকলে, কোনো Feature বুঝতে সমস্যা হলে অথবা SafnexBD সম্পর্কে আরও কিছু জানতে চাইলে **আমাদের Chat-এ Message করুন।** 💬

আমরা আপনাকে সাহায্য করার জন্য আছি।

🎊 **আবারও SafnexBD পরিবারে আপনাকে স্বাগতম!**

**শিখুন → কাজ করুন → Share করুন → আপনার Network তৈরি করুন → কমিশনের সুযোগ তৈরি করুন।**

**— SafnexBD Team**`,
  quickReplies: [
    {
      id: 'qr_greeting',
      title: '👋 স্বাগতম ও সহায়তা',
      text: 'আসসালামু আলাইকুম {First Name}! SafnexBD অফিসিয়াল সাপোর্টে আপনাকে স্বাগতম। আপনাকে কীভাবে সাহায্য করতে পারি জানাবেন?',
    },
    {
      id: 'qr_recharge',
      title: '💳 রিচার্জ গাইড',
      text: 'আপনার ওয়ালেটে রিচার্জ করতে Dashboard → Wallet & Ledger পেজে গিয়ে নির্দিষ্ট নম্বরে Send Money করে Transaction ID (TrxID) ও স্ক্রিনশট দিয়ে সাবমিট করুন। ৫-১৫ মিনিটের মধ্যে ব্যালেন্স যুক্ত হয়ে যাবে ইনশাআল্লাহ।',
    },
    {
      id: 'qr_withdraw',
      title: '💸 উইথড্র আপডেট',
      text: 'আপনার উইথড্র রিকোয়েস্টটি আমাদের ফাইন্যান্স টিম রিভিউ করছে। যাচাই সম্পন্ন হওয়া মাত্রই আপনার নির্ধারিত বিকাশ/নগদ নম্বরে পেমেন্ট পাঠিয়ে দেওয়া হবে। ধৈর্য ধরার জন্য ধন্যবাদ।',
    },
    {
      id: 'qr_microjob',
      title: '💼 মাইক্রো জব গাইড',
      text: 'মাইক্রো জবে কাজ করতে বা নতুন কাজ পোস্ট করতে Dashboard → Micro Jobs মেনু ব্যবহার করুন। কাজের নির্দেশনা অনুযায়ী সঠিক প্রুফ ও স্ক্রিনশট সাবমিট করলে দ্রুত অ্যাপ্রুভ হবে।',
    },
    {
      id: 'qr_escrow',
      title: '🔒 এসক্রো লেনদেন গাইড',
      text: 'SafnexBD-তে যেকোনো পণ্য বা সার্ভিস কেনাবেচার সময় চ্যাট বক্স থেকে অফিসিয়াল Escrow Pay Request ব্যবহার করুন। প্ল্যাটফর্মের বাইরে ব্যক্তিগতভাবে লেনদেন করবেন না।',
    },
    {
      id: 'qr_affiliate',
      title: '🎁 অ্যাফিলিয়েট ২০% কমিশন',
      text: 'আপনার Dashboard → Refer & Earn পেজ থেকে আপনার Affiliate Link কপি করে বন্ধুদের শেয়ার করুন। আপনার রেফারে কেউ লেনদেন করলেই কোম্পানির প্রফিটের ২০% আজীবন কমিশন পাবেন!',
    },
    {
      id: 'qr_dispute',
      title: '⚠️ প্রুফ ও যাচাই',
      text: 'আপনার বিষয়টি আমরা গুরুত্বের সাথে দেখছি। অনুগ্রহ করে চ্যাটে আপনার লেনদেন বা কাজের প্রুফ/স্ক্রিনশট দিন, আমাদের টিম যাচাই করে দ্রুত সমাধান দেবে।',
    },
    {
      id: 'qr_resolved',
      title: '✅ সমাধান সম্পন্ন',
      text: 'আপনার বিষয়টি সফলভাবে সমাধান করা হয়েছে। অনুগ্রহ করে আপনার ড্যাশবোর্ড চেক করুন। SafnexBD-এর সাথে থাকার জন্য আন্তরিক ধন্যবাদ! ❤️',
    },
  ],
};

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

