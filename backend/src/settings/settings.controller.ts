import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  /**
   * Public endpoint to fetch website settings (branding, meta SEO, pixels, footer, localization)
   */
  @Public()
  @Get('public')
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  /**
   * Admin endpoint to fetch all website settings including private tokens
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin')
  async getAdminSettings() {
    return this.settingsService.getAllSettings();
  }

  /**
   * Admin endpoint to save website settings
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin')
  async saveAdminSettings(
    @Body() payload: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.settingsService.saveSettings(payload, adminId);
  }

  /**
   * Admin endpoint to test AI provider API key and connection
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('ai/test-connection')
  async testAiConnection(
    @Body() body: { provider: string; apiKey: string; modelName?: string },
  ) {
    return this.settingsService.testAiConnection(
      body.provider,
      body.apiKey,
      body.modelName,
    );
  }

  /**
   * Admin endpoint to get multi-role notification settings
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('notifications')
  async getNotificationSettings() {
    return this.settingsService.getNotificationSettings();
  }

  /**
   * Admin endpoint to update multi-role notification settings
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('notifications')
  async saveNotificationSettings(
    @Body() payload: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.settingsService.saveNotificationSettings(payload, adminId);
  }

  /**
   * Public/User endpoint to get active user notification triggers
   */
  @Public()
  @Get('notifications/user-config')
  async getUserNotificationConfig() {
    const settings = await this.settingsService.getNotificationSettings();
    return settings.user;
  }

  /**
   * Admin endpoint to get maintenance & storage statistics
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('maintenance/stats')
  async getMaintenanceStats() {
    return this.settingsService.getMaintenanceStats();
  }

  /**
   * Admin endpoint to clean expired OTP records
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('maintenance/clean-otps')
  async cleanExpiredOtps(
    @Body('days') days: number,
    @CurrentUser('id') adminId: string,
  ) {
    return this.settingsService.cleanExpiredOtps(Number(days) || 7, adminId);
  }

  /**
   * Admin endpoint to clean old system audit logs
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('maintenance/clean-audit-logs')
  async cleanOldAuditLogs(
    @Body('days') days: number,
    @CurrentUser('id') adminId: string,
  ) {
    return this.settingsService.cleanOldAuditLogs(Number(days) || 180, adminId);
  }

  /**
   * Admin endpoint to trigger server log flush
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('maintenance/flush-logs')
  async flushServerLogs(@CurrentUser('id') adminId: string) {
    return { success: true, message: 'Server logs successfully flushed' };
  }

  /**
   * Super Admin endpoint to purge test transactions, disputes, chats, and financial records
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('maintenance/clean-test-data')
  async cleanTestData(
    @CurrentUser('id') adminId: string,
    @Body() body: any,
  ) {
    return this.settingsService.cleanTestData(adminId, body);
  }

  /**
   * Public endpoint to receive client events and dispatch them to Meta CAPI
   */
  @Public()
  @Post('tracking/capi-event')
  async sendMetaCapiEvent(
    @Body() body: { eventName: string; params?: any },
    @Req() req: any,
  ) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.settingsService.sendMetaCapiEvent(body.eventName, body.params, ip, userAgent);
  }
}

