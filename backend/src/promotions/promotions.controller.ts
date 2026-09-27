import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PromotionsService } from './promotions.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  RecordPayoutDto,
  UpdatePromotionSettingsDto,
  TrackClickDto,
} from './dto/promotion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // =========================================================================
  // PUBLIC TRACKING & REDIRECTION ENDPOINTS
  // =========================================================================

  /**
   * Track visitor click on a promo link
   */
  @Post('promotions/click/:code')
  async trackClick(
    @Param('code') code: string,
    @Body() body: TrackClickDto,
    @Req() req: Request,
  ) {
    const rawIp =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress;
    const ipAddress = Array.isArray(rawIp)
      ? rawIp[0]
      : typeof rawIp === 'string'
      ? rawIp.split(',')[0].trim()
      : undefined;

    const userAgent = req.headers['user-agent'] as string | undefined;

    return this.promotionsService.trackClick(
      code,
      ipAddress,
      userAgent,
      body.referrer,
      body.device,
    );
  }

  /**
   * Validate promo code during registration
   */
  @Get('promotions/validate/:code')
  async validateCode(@Param('code') code: string) {
    return this.promotionsService.validateCode(code);
  }

  /**
   * Promoter self-check portal with secret token
   */
  @Get('promotions/portal/:code')
  async getPromoterPortal(
    @Param('code') code: string,
    @Query('token') token: string,
  ) {
    return this.promotionsService.getPromoterPortal(code, token);
  }

  // =========================================================================
  // ADMIN PANEL MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * Get all promotion campaigns & global summary
   */
  @Get('admin/promotions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_SUPERVISOR')
  async getAdminCampaignsList() {
    return this.promotionsService.getAdminCampaignsList();
  }

  /**
   * Get global promotion settings (Master ON/OFF status)
   */
  @Get('admin/promotions/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_SUPERVISOR')
  async getSettings() {
    return this.promotionsService.getSettings();
  }

  /**
   * Update global promotion settings (Master ON/OFF switch)
   */
  @Put('admin/promotions/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_SUPERVISOR')
  async updateSettings(@Body() dto: UpdatePromotionSettingsDto) {
    return this.promotionsService.updateSettings(dto);
  }

  /**
   * Create a new promotion campaign
   */
  @Post('admin/promotions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_SUPERVISOR')
  async createCampaign(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.createCampaign(dto);
  }

  /**
   * Get detailed drill-down of a specific campaign
   */
  @Get('admin/promotions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_SUPERVISOR')
  async getAdminCampaignDetails(@Param('id') id: string) {
    return this.promotionsService.getAdminCampaignDetails(id);
  }

  /**
   * Update an existing campaign
   */
  @Put('admin/promotions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPERATIONS_SUPERVISOR')
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.updateCampaign(id, dto);
  }

  /**
   * Record a payout to promoter
   */
  @Post('admin/promotions/:id/payout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_SUPERVISOR')
  async recordPayout(
    @Param('id') id: string,
    @Body() dto: RecordPayoutDto,
  ) {
    return this.promotionsService.recordPayout(id, dto);
  }

  /**
   * Delete a promotion campaign
   */
  @Delete('admin/promotions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async deleteCampaign(@Param('id') id: string) {
    return this.promotionsService.deleteCampaign(id);
  }
}
