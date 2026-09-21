import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  /**
   * Telegram Webhook (called by Telegram servers on new updates)
   */
  @Public()
  @Post('webhook')
  async handleWebhook(@Body() update: any) {
    return this.telegramService.handleWebhook(update);
  }

  /**
   * Get user's Telegram connection status and bot details
   */
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.telegramService.getUserStatus(userId);
  }

  /**
   * Generate one-time Telegram bot connection link for the user
   */
  @UseGuards(JwtAuthGuard)
  @Get('link-token')
  async getLinkToken(@CurrentUser('id') userId: string) {
    return this.telegramService.generateLinkUrl(userId);
  }

  /**
   * Disconnect Telegram from user account
   */
  @UseGuards(JwtAuthGuard)
  @Post('disconnect')
  async disconnect(@CurrentUser('id') userId: string) {
    await this.telegramService.disconnectUser(userId);
    return { success: true, message: 'Telegram account disconnected' };
  }

  /**
   * Update user notification & 2FA preferences
   */
  @UseGuards(JwtAuthGuard)
  @Patch('preferences')
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: { telegramNotifications?: boolean; telegram2FaEnabled?: boolean },
  ) {
    return this.telegramService.updatePreferences(userId, dto);
  }

  /**
   * Admin: Get all Telegram bot settings, switches, and templates
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/settings')
  async getAdminSettings() {
    return this.telegramService.getSettings();
  }

  /**
   * Admin: Update Telegram bot configuration, switches, and templates
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/settings')
  async updateAdminSettings(
    @Body() payload: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.telegramService.updateSettings(payload, adminId);
  }

  /**
   * Admin: Test Bot Connection
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/test')
  async testConnection(@Body() body: { botToken?: string }) {
    return this.telegramService.testConnection(body?.botToken);
  }

  /**
   * Admin: Broadcast announcement to all connected Telegram users
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/broadcast')
  async broadcast(
    @Body() body: { message: string; buttonText?: string; buttonUrl?: string },
  ) {
    return this.telegramService.broadcast(
      body.message,
      body.buttonText,
      body.buttonUrl,
    );
  }
}
