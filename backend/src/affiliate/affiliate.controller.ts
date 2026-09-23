import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AffiliateService, AffiliateSettings } from './affiliate.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  /**
   * User: Get personal affiliate statistics and referral history
   */
  @Get('my-stats')
  async getMyStats(@CurrentUser('id') userId: string) {
    return this.affiliateService.getMyAffiliateStats(userId);
  }

  /**
   * Public/User: Get active public affiliate settings (to show commission rate)
   */
  @Get('public-settings')
  async getPublicSettings() {
    const settings = await this.affiliateService.getSettings();
    return {
      isEnabled: settings.isEnabled,
      commissionSource: settings.commissionSource,
      rewardType: settings.rewardType,
      rewardValue: settings.rewardValue,
    };
  }

  /**
   * Admin: Get all affiliate settings
   */
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/settings')
  async getAdminSettings() {
    return this.affiliateService.getSettings();
  }

  /**
   * Admin: Update affiliate settings
   */
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/settings')
  async updateAdminSettings(@Body() dto: Partial<AffiliateSettings>) {
    return this.affiliateService.updateSettings(dto);
  }

  /**
   * Admin: Get overall affiliate performance overview
   */
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/overview')
  async getAdminOverview() {
    return this.affiliateService.getAdminOverview();
  }
}

