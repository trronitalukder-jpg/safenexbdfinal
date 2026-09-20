import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PartnerService } from './partner.service';
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
} from './partner.types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// ============================================================================
// 1. THIRD-PARTY PARTNER API & WIDGET ENDPOINTS (/api/v1/partner/*)
// ============================================================================
@Controller('partner')
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  /**
   * Helper: Resolves authenticated user either via Client JWT sessionToken
   * OR via server-to-server (X-Safnex-App-Id + partnerUserId)
   */
  private async resolvePartnerUser(req: Request, body?: any, query?: any) {
    const authHeader = req.headers['authorization'];
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      token = req.headers['x-safnex-session-token'] as string;
    }

    if (token) {
      const session = await this.partnerService.verifySessionToken(token);
      return {
        safnexUserId: session.user.id,
        app: session.app,
        user: session.user,
        isClientSession: true,
      };
    }

    const appId =
      (req.headers['x-safnex-app-id'] ||
        body?.appId ||
        query?.appId) as string;
    const partnerUserId = body?.partnerUserId || query?.partnerUserId;

    if (appId && partnerUserId) {
      const signature = req.headers['x-safnex-signature'] as string;
      const app = await this.partnerService.validatePartnerRequest(
        appId,
        body || {},
        signature,
      );
      const session = await this.partnerService.createPartnerSession(appId, { partnerUserId });
      const resolvedUserId = session.user.safnexUserId;
      return {
        safnexUserId: resolvedUserId,
        app,
        user: session.user,
        isClientSession: false,
      };
    }

    throw new UnauthorizedException(
      'Missing session authorization token or partner application credentials',
    );
  }

  /**
   * Public: Retrieve application metadata (e.g. for Widget initialization)
   */
  @Get('config/:appId')
  async getPublicAppConfig(@Param('appId') appId: string) {
    const app = await this.partnerService.getAppByAppId(appId);
    return {
      appId: app.appId,
      name: app.name,
      description: app.description,
      isLiveMode: app.isLiveMode,
      isActive: app.isActive,
      allowedDomains: app.allowedDomains ? app.allowedDomains.split(',').map((d) => d.trim()) : [],
    };
  }

  /**
   * Public: External website owner applies for Merchant API & Partner integration
   */
  @Post('apply')
  async applyForPartner(@Body() dto: PartnerApplyDto) {
    return this.partnerService.applyForPartner(dto);
  }

  /**
   * Server-to-Server SSO: Silent Auto-Provisioning & Session Token Issuance
   * Called by WordPress, Laravel, Next.js, Python backends
   */
  @Post('auth/session')
  async createSession(
    @Req() req: Request,
    @Body() dto: PartnerAuthSessionDto & { appId?: string },
  ) {
    const headerAppId = req.headers['x-safnex-app-id'] as string;
    const signature = req.headers['x-safnex-signature'] as string;
    const appId = headerAppId || dto.appId;
    if (!appId) {
      throw new BadRequestException('X-Safnex-App-Id header or appId in body is required');
    }

    // Validate app and optional HMAC signature
    await this.partnerService.validatePartnerRequest(appId, dto, signature);

    return this.partnerService.createPartnerSession(appId, dto);
  }

  /**
   * Embedded Wallet: Get live balance
   */
  @Get('wallet/balance')
  async getBalance(@Req() req: Request, @Query() query: any) {
    const { safnexUserId } = await this.resolvePartnerUser(req, null, query);
    return this.partnerService.getWalletBalance(safnexUserId);
  }

  /**
   * Embedded Wallet: Initiate bKash / SSLCOMMERZ recharge
   */
  @Post('wallet/recharge/initiate')
  async initiateRecharge(@Req() req: Request, @Body() dto: PartnerRechargeDto) {
    const { safnexUserId } = await this.resolvePartnerUser(req, dto);
    return this.partnerService.initiateRecharge(safnexUserId, dto);
  }

  /**
   * Embedded Wallet: Trigger 6-digit withdrawal OTP
   */
  @Post('wallet/withdraw/send-otp')
  async sendWithdrawOtp(@Req() req: Request, @Body() dto: PartnerSendOtpDto) {
    const { safnexUserId } = await this.resolvePartnerUser(req, dto);
    return this.partnerService.sendWithdrawOtp(safnexUserId, dto);
  }

  /**
   * Embedded Wallet: Submit withdrawal request with OTP verification
   */
  @Post('wallet/withdraw/request')
  async requestWithdraw(@Req() req: Request, @Body() dto: PartnerWithdrawDto) {
    const { safnexUserId } = await this.resolvePartnerUser(req, dto);
    return this.partnerService.requestWithdraw(safnexUserId, dto);
  }

  /**
   * Embedded Escrow: Create deal & hold funds (Server-to-Server)
   */
  @Post('escrow/create')
  async createEscrow(
    @Req() req: Request,
    @Body() dto: PartnerEscrowCreateDto & { appId?: string },
  ) {
    const headerAppId = req.headers['x-safnex-app-id'] as string;
    const signature = req.headers['x-safnex-signature'] as string;
    const appId = headerAppId || dto.appId;
    if (!appId) {
      throw new BadRequestException('X-Safnex-App-Id header is required');
    }

    await this.partnerService.validatePartnerRequest(appId, dto, signature);
    return this.partnerService.createEscrowDeal(appId, dto);
  }

  /**
   * Embedded Escrow: Release held funds upon delivery (Server-to-Server)
   */
  @Post('escrow/release')
  async releaseEscrow(
    @Req() req: Request,
    @Body() dto: PartnerEscrowReleaseDto & { appId?: string },
  ) {
    const headerAppId = req.headers['x-safnex-app-id'] as string;
    const signature = req.headers['x-safnex-signature'] as string;
    const appId = headerAppId || dto.appId;
    if (!appId) {
      throw new BadRequestException('X-Safnex-App-Id header is required');
    }

    await this.partnerService.validatePartnerRequest(appId, dto, signature);
    return this.partnerService.releaseEscrowDeal(appId, dto);
  }

  /**
   * Embedded Chat: Create or fetch conversation between 2 partner users
   */
  @Post('chat/conversation')
  async getOrCreateConversation(
    @Req() req: Request,
    @Body() body: { peerPartnerUserId: string; title?: string },
  ) {
    const { safnexUserId, app } = await this.resolvePartnerUser(req, body);
    if (!body.peerPartnerUserId) {
      throw new BadRequestException('peerPartnerUserId is required');
    }

    // Resolve or provision peer user
    const peerSession = await this.partnerService.createPartnerSession(app.appId, {
      partnerUserId: body.peerPartnerUserId,
    });

    const peerUserId = peerSession.user.safnexUserId;

    return this.partnerService.getOrCreateConversation(
      safnexUserId,
      peerUserId,
    );
  }

  /**
   * Embedded Chat: List messages for a conversation
   */
  @Get('chat/messages')
  async getChatMessages(@Req() req: Request, @Query('conversationId') conversationId: string) {
    await this.resolvePartnerUser(req, null, { conversationId });
    if (!conversationId) {
      throw new BadRequestException('conversationId query parameter is required');
    }
    return this.partnerService.getMessages(conversationId);
  }

  /**
   * Embedded Chat: Send message & trigger real-time WebSocket broadcast
   */
  @Post('chat/send')
  async sendChatMessage(@Req() req: Request, @Body() dto: PartnerSendMessageDto) {
    if (!dto.conversationId) {
      throw new BadRequestException('conversationId is required');
    }
    const { safnexUserId } = await this.resolvePartnerUser(req, dto);
    return this.partnerService.sendChatMessage(safnexUserId, dto.conversationId, dto.content);
  }
}

// ============================================================================
// 2. ADMIN CONTROL PANEL FOR MERCHANTS & PARTNER APPS (/api/v1/admin/partners/*)
// ============================================================================
@Controller('admin/partners')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
@Permissions('partners')
export class AdminPartnerController {
  constructor(private partnerService: PartnerService) {}

  /**
   * List all registered partner/merchant applications
   */
  @Get()
  async listApps() {
    return this.partnerService.listApps();
  }

  /**
   * Create a new partner application (generates API Key, Secret & Webhook Secret)
   */
  @Post()
  async createApp(@Body() dto: CreatePartnerAppDto, @CurrentUser('id') adminId: string) {
    return this.partnerService.createApp(dto, adminId);
  }

  /**
   * Get application details
   */
  @Get(':id')
  async getAppDetails(@Param('id') id: string) {
    return this.partnerService.getAppById(id);
  }

  /**
   * Update application settings (allowed domains, webhook URL, active toggle, mode)
   */
  @Patch(':id')
  async updateApp(@Param('id') id: string, @Body() dto: UpdatePartnerAppDto) {
    return this.partnerService.updateApp(id, dto);
  }

  /**
   * Regenerate API Secret Key
   */
  @Post(':id/regenerate-secret')
  async regenerateSecret(@Param('id') id: string) {
    return this.partnerService.regenerateSecret(id);
  }

  /**
   * Delete partner application
   */
  @Delete(':id')
  async deleteApp(@Param('id') id: string) {
    return this.partnerService.deleteApp(id);
  }

  /**
   * Send a test ping to partner webhook URL to verify HMAC and connectivity
   */
  @Post(':id/test-webhook')
  async testWebhook(@Param('id') id: string) {
    const app = await this.partnerService.getAppById(id);
    if (!app.webhookUrl) {
      throw new BadRequestException('No Webhook URL configured for this application');
    }

    const testPayload = {
      test: true,
      message: 'SafnexBD Webhook Connectivity Ping',
      sentAt: new Date().toISOString(),
    };

    return this.partnerService.dispatchWebhook(app, 'DEAL_UPDATED' as any, testPayload);
  }
}
