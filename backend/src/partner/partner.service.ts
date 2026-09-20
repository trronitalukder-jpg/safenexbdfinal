import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { GatewayService } from '../wallet/gateway.service';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatService } from '../chat/chat.service';
import { OtpService } from '../sms/otp.service';
import { CommissionService } from '../commission/commission.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import {
  CreatePartnerAppDto,
  PartnerApplyDto,
  PartnerAuthSessionDto,
  PartnerEscrowCreateDto,
  PartnerEscrowReleaseDto,
  PartnerRechargeDto,
  PartnerSendMessageDto,
  PartnerSendOtpDto,
  PartnerWithdrawDto,
  UpdatePartnerAppDto,
  WebhookEventType,
} from './partner.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class PartnerService {
  private readonly logger = new Logger(PartnerService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private gatewayService: GatewayService,
    private chatGateway: ChatGateway,
    private chatService: ChatService,
    private otpService: OtpService,
    private jwtService: JwtService,
    private commissionService: CommissionService,
  ) {}

  // ---------------------------------------------------------------------------
  // 1. MERCHANT / PARTNER APP MANAGEMENT
  // ---------------------------------------------------------------------------
  async createApp(dto: CreatePartnerAppDto, ownerId?: string) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Partner application name is required');
    }

    const isLive = dto.isLiveMode !== false;
    const prefix = isLive ? 'live' : 'test';

    const appId = `app_${prefix}_${crypto.randomBytes(8).toString('hex')}`;
    const apiKey = `pk_${prefix}_${crypto.randomBytes(16).toString('hex')}`;
    const apiSecret = `sk_${prefix}_${crypto.randomBytes(24).toString('hex')}`;
    const webhookSecret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

    return this.prisma.partnerApp.create({
      data: {
        appId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        apiKey,
        apiSecret,
        webhookUrl: dto.webhookUrl?.trim() || null,
        webhookSecret,
        allowedDomains: dto.allowedDomains?.trim() || null,
        isLiveMode: isLive,
        isActive: true,
        ownerId: ownerId || null,
      },
    });
  }

  async applyForPartner(dto: PartnerApplyDto) {
    if (!dto.businessName?.trim()) {
      throw new BadRequestException('Business or Website name is required');
    }
    if (!dto.applicantName?.trim()) {
      throw new BadRequestException('Contact Person name is required');
    }
    if (!dto.phone?.trim()) {
      throw new BadRequestException('Phone or WhatsApp number is required');
    }
    if (!dto.email?.trim()) {
      throw new BadRequestException('Email address is required');
    }

    const description = [
      `Contact: ${dto.applicantName.trim()}`,
      `Phone: ${dto.phone.trim()}`,
      `Email: ${dto.email.trim().toLowerCase()}`,
      dto.websiteUrl ? `URL: ${dto.websiteUrl.trim()}` : '',
      dto.techStack ? `Tech: ${dto.techStack.trim()}` : '',
      dto.useCase ? `Use Case: ${dto.useCase.trim()}` : '',
      dto.monthlyVolume ? `Est. Volume: ${dto.monthlyVolume.trim()}` : '',
      dto.notes ? `Notes: ${dto.notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    // Provision new app in test sandbox mode, pending review
    const app = await this.createApp({
      name: dto.businessName.trim(),
      description,
      allowedDomains: dto.websiteUrl?.trim() || undefined,
      isLiveMode: false,
    });

    // Mark as inactive until admin approval
    const updated = await this.prisma.partnerApp.update({
      where: { id: app.id },
      data: { isActive: false },
    });

    return {
      success: true,
      message:
        'Your API application has been submitted successfully! Our merchant onboarding team will review your application and activate your credentials within 24 hours.',
      appId: updated.appId,
      apiKey: updated.apiKey,
      businessName: updated.name,
      status: 'PENDING_APPROVAL',
    };
  }

  async listApps() {
    const apps = await this.prisma.partnerApp.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { partnerUsers: true },
        },
      },
    });

    return apps.map((app) => ({
      ...app,
      totalUsers: app._count.partnerUsers,
    }));
  }

  async getAppById(id: string) {
    const app = await this.prisma.partnerApp.findUnique({
      where: { id },
      include: {
        _count: { select: { partnerUsers: true } },
      },
    });

    if (!app) {
      throw new NotFoundException('Partner app not found');
    }
    return app;
  }

  async getAppByAppId(appId: string) {
    const app = await this.prisma.partnerApp.findUnique({
      where: { appId },
    });
    if (!app) {
      throw new NotFoundException('Invalid Partner App ID');
    }
    return app;
  }

  async updateApp(id: string, dto: UpdatePartnerAppDto) {
    const app = await this.getAppById(id);

    return this.prisma.partnerApp.update({
      where: { id: app.id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() : undefined,
        allowedDomains: dto.allowedDomains !== undefined ? dto.allowedDomains.trim() : undefined,
        webhookUrl: dto.webhookUrl !== undefined ? dto.webhookUrl.trim() : undefined,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : undefined,
        isLiveMode: dto.isLiveMode !== undefined ? Boolean(dto.isLiveMode) : undefined,
      },
    });
  }

  async regenerateSecret(id: string) {
    const app = await this.getAppById(id);
    const prefix = app.isLiveMode ? 'live' : 'test';
    const newSecret = `sk_${prefix}_${crypto.randomBytes(24).toString('hex')}`;

    return this.prisma.partnerApp.update({
      where: { id: app.id },
      data: { apiSecret: newSecret },
    });
  }

  async deleteApp(id: string) {
    await this.getAppById(id);
    return this.prisma.partnerApp.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // 2. SECURITY & HMAC-SHA256 SIGNATURE VALIDATION
  // ---------------------------------------------------------------------------
  async validatePartnerRequest(
    appId: string,
    rawBody: any,
    signature?: string,
    timestamp?: string,
  ) {
    if (!appId) {
      throw new UnauthorizedException('Missing X-Safnex-App-Id header');
    }

    const app = await this.getAppByAppId(appId);
    if (!app.isActive) {
      throw new ForbiddenException('This Partner Application is disabled or suspended');
    }

    // Mandatory HMAC signature verification for server-to-server partner requests
    if (!signature) {
      throw new UnauthorizedException('Missing HMAC signature (X-Safnex-Signature header is required)');
    }

    const bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody || {});
    const expectedSig = crypto
      .createHmac('sha256', app.apiSecret)
      .update(bodyStr)
      .digest('hex');

    const sigBuf = Buffer.from(signature.toLowerCase());
    const expBuf = Buffer.from(expectedSig.toLowerCase());

    const isMatch =
      sigBuf.length === expBuf.length &&
      crypto.timingSafeEqual(sigBuf, expBuf);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid HMAC signature (X-Safnex-Signature)');
    }

    return app;
  }

  // ---------------------------------------------------------------------------
  // 3. SILENT AUTO-PROVISIONING SSO & CLIENT SESSION TOKEN
  // ---------------------------------------------------------------------------
  async createPartnerSession(appId: string, dto: PartnerAuthSessionDto) {
    if (!dto.partnerUserId || !String(dto.partnerUserId).trim()) {
      throw new BadRequestException('partnerUserId is required for session generation');
    }

    const app = await this.getAppByAppId(appId);
    if (!app.isActive) {
      throw new ForbiddenException('This partner app is currently deactivated');
    }

    const cleanPartnerUserId = String(dto.partnerUserId).trim();

    // Check if PartnerUser already exists
    let partnerUser = await this.prisma.partnerUser.findUnique({
      where: {
        partnerAppId_partnerUserId: {
          partnerAppId: app.id,
          partnerUserId: cleanPartnerUserId,
        },
      },
      include: {
        safnexUser: {
          include: { wallet: true },
        },
      },
    });

    let safnexUser: any = partnerUser?.safnexUser;

    if (!partnerUser || !safnexUser) {
      // Check if a SafnexBD user already matches by phone or email
      if (dto.phone) {
        safnexUser = await this.prisma.user.findFirst({
          where: { phone: dto.phone.trim() },
          include: { wallet: true },
        });
      }

      if (!safnexUser && dto.email) {
        safnexUser = await this.prisma.user.findFirst({
          where: { email: dto.email.trim().toLowerCase() },
          include: { wallet: true },
        });
      }

      // If still not found, auto-create virtual user in SafnexBD
      if (!safnexUser) {
        const randHex = crypto.randomBytes(3).toString('hex');
        const cleanName = (dto.name || 'User').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
        const uniqueUserId = `${cleanName}${randHex}`;
        const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        const placeholderPhone = dto.phone?.trim() || `019${Math.floor(10000000 + Math.random() * 89999999)}`;
        const placeholderEmail =
          dto.email?.trim().toLowerCase() ||
          `${uniqueUserId}@partner.${app.appId}.safnexbd.com`;

        safnexUser = await this.prisma.user.create({
          data: {
            uniqueUserId,
            firstName: dto.name?.split(' ')[0] || 'Partner',
            lastName: dto.name?.split(' ').slice(1).join(' ') || 'User',
            phone: placeholderPhone,
            email: placeholderEmail,
            passwordHash: randomPassword,
            isVerified: true,
            wallet: {
              create: {
                availableBalance: new Prisma.Decimal(0),
                holdBalance: new Prisma.Decimal(0),
              },
            },
          },
          include: { wallet: true },
        });
      }

      // Link PartnerUser to SafnexUser
      partnerUser = await this.prisma.partnerUser.upsert({
        where: {
          partnerAppId_partnerUserId: {
            partnerAppId: app.id,
            partnerUserId: cleanPartnerUserId,
          },
        },
        create: {
          partnerAppId: app.id,
          partnerUserId: cleanPartnerUserId,
          safnexUserId: safnexUser.id,
          name: dto.name?.trim() || null,
          email: dto.email?.trim() || null,
          phone: dto.phone?.trim() || null,
          metadata: dto.metadata || undefined,
        },
        update: {
          safnexUserId: safnexUser.id,
          name: dto.name?.trim() || undefined,
          email: dto.email?.trim() || undefined,
          phone: dto.phone?.trim() || undefined,
        },
        include: {
          safnexUser: {
            include: { wallet: true },
          },
        },
      });
    }

    // Sign a 24-hour Client Session Token (JWT)
    const jwtSecret = process.env.JWT_SECRET || 'safnexbd-secret-key';
    const payload = {
      sub: safnexUser.id,
      partnerAppId: app.id,
      appId: app.appId,
      partnerUserId: cleanPartnerUserId,
      type: 'PARTNER_SESSION',
    };

    const sessionToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '24h',
    });

    const avail = Number(safnexUser.wallet?.availableBalance || 0);
    const hold = Number(safnexUser.wallet?.holdBalance || 0);

    return {
      sessionToken,
      expiresInSeconds: 86400,
      user: {
        partnerUserId: cleanPartnerUserId,
        safnexUserId: safnexUser.id,
        uniqueUserId: safnexUser.uniqueUserId,
        name: `${safnexUser.firstName} ${safnexUser.lastName}`.trim(),
        email: safnexUser.email,
        phone: safnexUser.phone,
        availableBalance: avail,
        holdBalance: hold,
      },
      app: {
        appId: app.appId,
        name: app.name,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 4. VERIFY CLIENT SESSION (Used by SDK & Widget)
  // ---------------------------------------------------------------------------
  async verifySessionToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Session token is required');
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'safnexbd-secret-key';
      const decoded = this.jwtService.verify(token, { secret: jwtSecret });
      if (decoded.type !== 'PARTNER_SESSION') {
        throw new UnauthorizedException('Invalid token type');
      }

      const app = await this.prisma.partnerApp.findUnique({
        where: { id: decoded.partnerAppId },
      });

      if (!app || !app.isActive) {
        throw new ForbiddenException('Partner application is suspended');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { wallet: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return { decoded, app, user };
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid or expired session token');
    }
  }

  // ---------------------------------------------------------------------------
  // 5. EMBEDDED WALLET & TRANSACTIONS
  // ---------------------------------------------------------------------------
  async getWalletBalance(safnexUserId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: safnexUserId },
      select: { availableBalance: true, holdBalance: true },
    });

    return {
      availableBalance: Number(wallet?.availableBalance || 0),
      holdBalance: Number(wallet?.holdBalance || 0),
      currency: 'BDT',
      symbol: '৳',
    };
  }

  async initiateRecharge(safnexUserId: string, dto: PartnerRechargeDto) {
    if (!dto.amount || Number(dto.amount) < 10) {
      throw new BadRequestException('Minimum recharge amount is ৳10');
    }

    const method = dto.method || 'BKASH';
    const amount = Number(dto.amount);

    const session = await this.gatewayService.initiatePayment(safnexUserId, {
      gateway: method,
      amount,
    });

    return {
      paymentId: session.paymentId,
      checkoutUrl: `/payment/checkout?paymentId=${session.paymentId}`,
      amount,
      charge: session.charge,
      totalPayable: session.totalPayable,
      method,
    };
  }

  async sendWithdrawOtp(safnexUserId: string, dto: PartnerSendOtpDto) {
    return this.walletService.sendWithdrawOtp(safnexUserId, {
      amount: dto.amount,
      destination: dto.destination,
    });
  }

  async requestWithdraw(safnexUserId: string, dto: PartnerWithdrawDto) {
    const methods = await this.prisma.withdrawalMethod.findMany({
      where: { isActive: true },
    });

    const targetCode = (dto.method || 'BKASH').toUpperCase();
    let method = methods.find(
      (m) =>
        m.code?.toUpperCase().includes(targetCode) ||
        m.name?.toUpperCase().includes(targetCode),
    );

    if (!method && methods.length > 0) {
      method = methods[0];
    }

    if (!method) {
      throw new BadRequestException('No active payout method found');
    }

    return this.walletService.submitWithdrawalRequest(safnexUserId, {
      methodId: method.id,
      amount: dto.amount,
      destinationAccount: dto.destinationAccount,
      accountType: dto.accountType || 'PERSONAL',
      bankName: dto.bankName,
      accountHolderName: dto.accountHolderName,
      accountNumber: dto.accountNumber,
      routingNumber: dto.routingNumber,
      branchName: dto.branchName,
      otpCode: dto.otpCode,
    });
  }

  // ---------------------------------------------------------------------------
  // 6. EMBEDDED ESCROW DEALS (Hold & Release)
  // ---------------------------------------------------------------------------
  async createEscrowDeal(appId: string, dto: PartnerEscrowCreateDto) {
    const app = await this.getAppByAppId(appId);
    const amountNum = Number(dto.amount);
    if (!amountNum || amountNum <= 0) {
      throw new BadRequestException('Invalid escrow amount');
    }

    // Resolve buyer and seller
    const buyerSession = await this.createPartnerSession(app.appId, {
      partnerUserId: dto.buyerPartnerUserId,
    });
    const sellerSession = await this.createPartnerSession(app.appId, {
      partnerUserId: dto.sellerPartnerUserId,
    });

    const buyerUserId = buyerSession.user.safnexUserId;
    const sellerUserId = sellerSession.user.safnexUserId;

    const buyerWallet = await this.prisma.wallet.findUnique({
      where: { userId: buyerUserId },
    });

    if (Number(buyerWallet?.availableBalance || 0) < amountNum) {
      throw new BadRequestException(
        `Buyer has insufficient available balance (Available: ৳${Number(buyerWallet?.availableBalance || 0)}). Please recharge first.`,
      );
    }

    const trackingNumber = `ESC_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Transaction: Hold amount from buyer
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct from buyer available, move to hold
      await tx.wallet.update({
        where: { userId: buyerUserId },
        data: {
          availableBalance: { decrement: new Prisma.Decimal(amountNum) },
          holdBalance: { increment: new Prisma.Decimal(amountNum) },
        },
      });

      // Create transaction record with status HOLD
      const trx = await tx.transaction.create({
        data: {
          trackingNumber,
          senderId: buyerUserId,
          receiverId: sellerUserId,
          transactionType: 'GENERAL_TRANSACTION',
          amount: new Prisma.Decimal(amountNum),
          commissionAmount: new Prisma.Decimal(0),
          totalRequired: new Prisma.Decimal(amountNum),
          status: 'HOLD',
          rejectReason: dto.title ? `Deal Title: ${dto.title}` : null,
        },
      });

      return trx;
    });

    // Dispatch webhook to partner
    this.dispatchWebhook(app, 'ESCROW_DEAL_CREATED', {
      dealId: result.id,
      trackingNumber: result.trackingNumber,
      buyerPartnerUserId: dto.buyerPartnerUserId,
      sellerPartnerUserId: dto.sellerPartnerUserId,
      amount: amountNum,
      status: 'HOLD',
    }).catch(() => {});

    return {
      dealId: result.id,
      trackingNumber: result.trackingNumber,
      amount: amountNum,
      status: 'HOLD',
      title: dto.title || `Escrow Deal #${result.trackingNumber}`,
    };
  }

  async releaseEscrowDeal(appId: string, dto: PartnerEscrowReleaseDto) {
    const app = await this.getAppByAppId(appId);
    const trx = await this.prisma.transaction.findUnique({
      where: { id: dto.dealId },
      include: { sender: true, receiver: true },
    });

    if (!trx) {
      throw new NotFoundException('Escrow deal not found');
    }

    if (trx.status !== 'HOLD') {
      throw new BadRequestException(
        `Deal is currently in ${trx.status} state. Only deals in HOLD can be released.`,
      );
    }

    const amountNum = Number(trx.amount);
    const feeCalculation = await this.commissionService.calculateCommission({
      amount: amountNum,
      type: 'TRANSACTION',
    });
    const commissionFee = Math.round(Number(feeCalculation.commissionAmount) * 100) / 100;
    const netRelease = Math.max(0, amountNum - commissionFee);

    await this.prisma.$transaction(async (tx) => {
      // Decrement hold balance from buyer
      await tx.wallet.update({
        where: { userId: trx.senderId },
        data: {
          holdBalance: { decrement: new Prisma.Decimal(amountNum) },
        },
      });

      // Increment available balance for seller
      await tx.wallet.update({
        where: { userId: trx.receiverId },
        data: {
          availableBalance: { increment: new Prisma.Decimal(netRelease) },
        },
      });

      // Update transaction status to RELEASED
      await tx.transaction.update({
        where: { id: trx.id },
        data: {
          status: 'RELEASED',
          commissionAmount: new Prisma.Decimal(commissionFee),
          workCompletedAt: new Date(),
        },
      });
    });

    // Dispatch webhook
    this.dispatchWebhook(app, 'ESCROW_DEAL_COMPLETED', {
      dealId: trx.id,
      trackingNumber: trx.trackingNumber,
      amount: amountNum,
      commissionFee,
      netDisbursed: netRelease,
      status: 'RELEASED',
    }).catch(() => {});

    return {
      dealId: trx.id,
      trackingNumber: trx.trackingNumber,
      status: 'RELEASED',
      amount: amountNum,
      commissionFee,
      netReleased: netRelease,
    };
  }

  // ---------------------------------------------------------------------------
  // 7. EMBEDDED REALTIME CHAT
  // ---------------------------------------------------------------------------
  async getOrCreateConversation(userAId: string, userBId: string) {
    let conv = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [{ userId: userAId }, { userId: userBId }],
          },
        },
        include: {
          participants: { include: { user: true } },
        },
      });
    }

    return conv;
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
  }

  async sendChatMessage(senderSafnexUserId: string, conversationId: string, content: string) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: senderSafnexUserId,
        content: content.trim(),
        messageType: 'TEXT',
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    // Broadcast to conversation room via WebSocket
    if (this.chatGateway?.server) {
      this.chatGateway.server.to(conversationId).emit('message:new', msg);
    }

    return msg;
  }

  // ---------------------------------------------------------------------------
  // 8. WEBHOOK DISPATCHER WITH HMAC SIGNATURE
  // ---------------------------------------------------------------------------
  async dispatchWebhook(app: any, event: WebhookEventType, data: Record<string, any>) {
    if (!app.webhookUrl) return { dispatched: false, reason: 'NO_WEBHOOK_URL' };

    const payload = {
      event,
      timestamp: Math.floor(Date.now() / 1000),
      appId: app.appId,
      data,
    };

    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', app.webhookSecret || app.apiSecret)
      .update(payloadString)
      .digest('hex');

    try {
      this.logger.log(`Dispatching webhook to ${app.webhookUrl} [${event}]...`);
      const res = await fetch(app.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Safnex-Event': event,
          'X-Safnex-App-Id': app.appId,
          'X-Safnex-Signature': signature,
          'X-Safnex-Timestamp': String(payload.timestamp),
          'User-Agent': 'SafnexBD-Webhook/1.0',
        },
        body: payloadString,
        signal: AbortSignal.timeout(6000), // 6-second timeout
      });

      return {
        dispatched: true,
        statusCode: res.status,
        statusText: res.statusText,
      };
    } catch (err: any) {
      this.logger.warn(`Webhook failed to ${app.webhookUrl}: ${err.message}`);
      return {
        dispatched: false,
        error: err.message,
      };
    }
  }
}

