import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { TelegramService } from '../telegram/telegram.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/create-complaint.dto';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
    @Inject(forwardRef(() => TelegramService))
    private telegramService: TelegramService,
  ) {}

  /**
   * User submits a new complaint
   */
  async createComplaint(userId: string, dto: CreateComplaintDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, uniqueUserId: true, phone: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate random human-readable ticket number e.g. CMP-839201
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = `CMP-${randomDigits}`;

    const complaint = await this.prisma.complaint.create({
      data: {
        ticketNumber,
        userId,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        trackingNumber: dto.trackingNumber?.trim() || null,
        evidenceUrls: dto.evidenceUrls || [],
        priority: dto.priority || 'MEDIUM',
        status: 'PENDING',
        isReadByAdmin: false,
      },
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
          },
        },
      },
    });

    // 1. Send Real-time Socket Event to Admins & Staff
    const alertData = {
      type: 'COMPLAINT',
      id: complaint.id,
      ticketNumber: complaint.ticketNumber,
      title: `📢 নতুন অভিযোগ: ${complaint.subject}`,
      message: `${user.firstName} ${user.lastName} (@${user.uniqueUserId}) একটি নতুন অভিযোগ দাখিল করেছেন (টিকিট: #${ticketNumber})।`,
      targetUrl: `/admin/complaints`,
      complaint,
    };

    if (this.chatGateway) {
      this.chatGateway.notifyAdminsAndStaff('notification:admin', alertData);
      this.chatGateway.notifyAdminsAndStaff('complaint:new', complaint);
      this.chatGateway.server?.emit('notification:admin', alertData);
      this.chatGateway.server?.emit('complaint:new', complaint);
    }

    // 2. Send Alert to Admin Telegram Group if connected
    try {
      const settings = await this.telegramService.getSettings();
      if (settings.isEnabled && settings.botToken && settings.adminGroupId) {
        const text = `📢 <b>[Admin Alert] নতুন অভিযোগ দাখিল!</b>\n\n🎫 টিকিট: <code>${complaint.ticketNumber}</code>\n👤 ইউজার: <b>${user.firstName} ${user.lastName}</b> (@${user.uniqueUserId})\n📂 ধরণ: ${complaint.category}\n📌 বিষয়: <b>${complaint.subject}</b>\n📝 বিবরণ: ${complaint.description.slice(0, 150)}...\n${complaint.trackingNumber ? `📦 ট্রানজেকশন: <code>${complaint.trackingNumber}</code>\n` : ''}⚡ প্রায়োরিটি: ${complaint.priority}`;

        await this.telegramService.callApi(settings.botToken, 'sendMessage', {
          chat_id: settings.adminGroupId,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '👁️ অ্যাডমিন প্যানেলে দেখুন',
                  url: `${settings.miniAppUrl || 'https://safnexbd.com'}/admin/complaints`,
                },
              ],
            ],
          },
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch telegram complaint alert: ${err.message}`);
    }

    return complaint;
  }

  /**
   * Get user's own submitted complaints
   */
  async getMyComplaints(userId: string) {
    return this.prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, uniqueUserId: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Admin: Get all complaints with filters, search, and pagination
   */
  async getAdminComplaints(query: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status as ComplaintStatus;
    }

    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    if (query.priority && query.priority !== 'ALL') {
      where.priority = query.priority;
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { trackingNumber: { contains: q } },
        { user: { uniqueUserId: { contains: q } } },
        { user: { firstName: { contains: q } } },
        { user: { lastName: { contains: q } } },
        { user: { phone: { contains: q } } },
      ];
    }

    const [items, total, pendingCount] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
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
      }),
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      items,
      total,
      pendingCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin: Get unread / pending complaint count for Header Badge
   */
  async getUnreadCount() {
    const [pendingCount, unreadCount] = await Promise.all([
      this.prisma.complaint.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.complaint.count({
        where: { isReadByAdmin: false },
      }),
    ]);

    return {
      pendingCount,
      unreadCount,
      count: pendingCount, // Primary badge counter: all pending complaints needing attention
    };
  }

  /**
   * Get single complaint by ID
   */
  async getComplaintById(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
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
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return complaint;
  }

  /**
   * Admin: Update complaint status & notes
   */
  async updateComplaint(id: string, adminId: string, dto: UpdateComplaintDto) {
    const existing = await this.prisma.complaint.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException('Complaint not found');
    }

    const isResolvedOrRejected =
      dto.status === 'RESOLVED' || dto.status === 'REJECTED';

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
        ...(dto.assignedToId ? { assignedToId: dto.assignedToId } : {}),
        ...(isResolvedOrRejected
          ? { resolvedById: adminId, resolvedAt: new Date() }
          : {}),
        isReadByAdmin: true,
      },
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
          },
        },
      },
    });

    // Notify user via Socket
    if (this.chatGateway) {
      this.chatGateway.notifyUser(existing.userId, 'notification:complaint_update', {
        complaintId: updated.id,
        ticketNumber: updated.ticketNumber,
        status: updated.status,
        message: `আপনার অভিযোগ #${updated.ticketNumber}-এর স্ট্যাটাস আপডেট হয়েছে: ${updated.status}`,
      });

      this.chatGateway.server?.emit('complaint:update', updated);
    }

    // Send user notification in Telegram if connected
    try {
      if (existing.user.telegramChatId && existing.user.telegramNotifications) {
        const settings = await this.telegramService.getSettings();
        if (settings.isEnabled && settings.botToken) {
          const statusText =
            dto.status === 'RESOLVED'
              ? '✅ সমাধান সম্পন্ন (Resolved)'
              : dto.status === 'IN_REVIEW'
              ? '🔍 পর্যালোচনাধীন (In Review)'
              : dto.status === 'REJECTED'
              ? '❌ বাতিল (Rejected)'
              : dto.status;

          await this.telegramService.callApi(settings.botToken, 'sendMessage', {
            chat_id: existing.user.telegramChatId,
            text: `📢 <b>[SafnexBD] অভিযোগ আপডেট!</b>\n\nআপনার দাখিলকৃত অভিযোগ টিকিট #<code>${updated.ticketNumber}</code>-এর স্ট্যাটাস পরিবর্তন হয়েছে:\n🏷️ বর্তমান স্ট্যাটাস: <b>${statusText}</b>\n${dto.adminNotes ? `📝 অ্যাডমিন নোট: ${dto.adminNotes}\n` : ''}\nবিস্তারিত দেখতে ভিজিট করুন:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🛍️ Open SafnexBD',
                    web_app: { url: `${settings.miniAppUrl || 'https://safnexbd.com'}/dashboard` },
                  },
                ],
              ],
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to notify user in Telegram on complaint update: ${err.message}`);
    }

    return updated;
  }

  /**
   * Mark complaint as read by admin
   */
  async markAsRead(id: string) {
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: { isReadByAdmin: true },
    });

    if (this.chatGateway) {
      this.chatGateway.server?.emit('complaint:read', { id });
    }

    return updated;
  }
}

