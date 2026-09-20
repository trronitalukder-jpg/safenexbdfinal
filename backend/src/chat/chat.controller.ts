import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  /**
   * Super Admin & Authorized Staff: Monitor all user conversations across SafnexBD
   */
  @Get('admin/conversations')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  async getAllConversationsAdmin(
    @CurrentUser() user: any,
    @Query('filter') filter?: 'ALL' | 'ACTIVE_ESCROW' | 'DISPUTED' | 'REQUESTS',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (
      user.roles?.includes('EMPLOYEE') &&
      !user.roles?.includes('SUPER_ADMIN') &&
      !user.roles?.includes('ADMIN')
    ) {
      const perms: string[] = user.adminPermissions || [];
      if (!perms.includes('*') && !perms.includes('cms')) {
        throw new ForbiddenException('Access denied: missing Live Chat permission');
      }
    }

    const result = await this.chatService.getAllConversationsAdmin({
      filter,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });

    return JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  /**
   * Super Admin & Staff: Send general message or official highlighted intervention notice into any chat
   */
  @Post('admin/conversations/:id/message')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  async sendAdminMessage(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Body()
    body: {
      content: string;
      messageType?: any;
      isAdminNotice?: boolean;
      adminTitle?: string;
    },
  ) {
    if (
      user.roles?.includes('EMPLOYEE') &&
      !user.roles?.includes('SUPER_ADMIN') &&
      !user.roles?.includes('ADMIN')
    ) {
      const perms: string[] = user.adminPermissions || [];
      if (!perms.includes('*') && !perms.includes('cms')) {
        throw new ForbiddenException('Access denied: missing Live Chat permission');
      }
    }

    if (!body.content || !body.content.trim()) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const saved = await this.chatService.sendAdminMessage(
      conversationId,
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        uniqueUserId: user.uniqueUserId,
      },
      body,
    );

    const serialized = JSON.parse(
      JSON.stringify(saved, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    // Broadcast to everyone in conversation room via socket
    this.chatGateway.server?.to(conversationId).emit('message:receive', serialized);

    return serialized;
  }

  /**
   * Super Admin & Authorized Staff: Turn Chat ON/OFF for any user conversation (Conversation Lock)
   */
  @Patch('admin/conversations/:id/toggle-lock')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  async toggleConversationLock(
    @Param('id') conversationId: string,
    @CurrentUser() user: any,
    @Body() body: { isLocked: boolean; reason?: string },
  ) {
    if (
      user.roles?.includes('EMPLOYEE') &&
      !user.roles?.includes('SUPER_ADMIN') &&
      !user.roles?.includes('ADMIN')
    ) {
      const perms: string[] = user.adminPermissions || [];
      if (!perms.includes('*') && !perms.includes('cms') && !perms.includes('chat_manage')) {
        throw new ForbiddenException('Access denied: missing Chat Lock/Management permission');
      }
    }

    const result = await this.chatService.toggleConversationLock(
      conversationId,
      body.isLocked,
      body.reason,
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        uniqueUserId: user.uniqueUserId,
      },
    );

    // Broadcast lock status in real-time to the conversation participants and admin room
    this.chatGateway.server?.to(conversationId).emit('chat:lock_status', result);
    this.chatGateway.notifyAdminsAndStaff('chat:lock_status', result);

    return result;
  }

  /**
   * Get Super Admin Chat Self-Presence & Search Visibility status
   */
  @Get('admin/visibility')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getSuperAdminVisibility() {
    const isVisible = await this.chatService.getSuperAdminChatVisibility();
    return { isVisible };
  }

  /**
   * Super Admin: Toggle Self-Presence in Chat & User Search (ON/OFF)
   */
  @Post('admin/visibility')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  async setSuperAdminVisibility(@Body() body: { isVisible: boolean }) {
    const isVisible = await this.chatService.setSuperAdminChatVisibility(Boolean(body.isVisible));
    this.chatGateway.notifyAdmins('chat:admin_visibility_changed', { isVisible });
    this.chatGateway.server?.emit('chat:admin_visibility_changed', { isVisible });
    return { success: true, isVisible };
  }

  /**
   * Get Chat Safety Rules & Quick Message Templates (for all chat users)
   */
  @Public()
  @Get('rules-and-templates')
  async getRulesAndTemplates() {
    return this.chatService.getChatSafetyAndTemplates();
  }

  /**
   * Admin: Get Chat Safety Rules & Quick Message Templates
   */
  @Get('admin/rules-and-templates')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getRulesAndTemplatesAdmin() {
    return this.chatService.getChatSafetyAndTemplates();
  }

  /**
   * Admin: Update Chat Safety Rules & Quick Message Templates
   */
  @Patch('admin/rules-and-templates')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async updateRulesAndTemplatesAdmin(
    @Body() payload: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.chatService.updateChatSafetyAndTemplates(payload, adminId);
  }

  @Post('conversations')
  async getOrCreate(
    @CurrentUser('id') userId: string,
    @Body() body: { targetUserId?: string; recipientId?: string; transactionId?: string },
  ) {
    const targetId = body.targetUserId || body.recipientId;
    if (!targetId) {
      throw new BadRequestException('targetUserId or recipientId is required');
    }
    return this.chatService.getOrCreateConversation(
      userId,
      targetId,
      body.transactionId,
    );
  }

  @Get('conversations')
  async getMyConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  @Get('conversations/:id')
  async getConversationById(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.chatService.getConversationById(conversationId, userId);
    return JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.chatService.getMessages(
      conversationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      userId,
    );
    return JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      content: string;
      messageType?: any;
      metadata?: any;
      attachments?: any[];
    },
  ) {
    const message = await this.chatService.saveMessage({
      conversationId,
      senderId: userId,
      content: body.content,
      messageType: body.messageType,
      metadata: body.metadata,
      attachments: body.attachments,
    });

    // Broadcast to conversation room and participants' personal rooms
    return this.chatGateway.broadcastNewMessage(message, conversationId, userId);
  }

  @Post('conversations/:id/seen')
  async markSeen(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.markAsSeen(conversationId, userId);
  }

  @Get('conversations/:id/transaction')
  async getConversationTransaction(@Param('id') conversationId: string) {
    return this.chatService.getConversationTransaction(conversationId);
  }
}

