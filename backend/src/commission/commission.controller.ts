import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('commission')
export class CommissionController {
  constructor(private commissionService: CommissionService) {}

  @Public()
  @Get('calculate')
  async calculate(
    @Query('amount') amount: string,
    @Query('type') type?: 'TRANSACTION' | 'RECHARGE' | 'WITHDRAW',
    @Query('categorySlug') categorySlug?: string,
    @Query('productType') productType?: any,
    @Query('transactionType') transactionType?: any,
  ) {
    return this.commissionService.calculateCommission({
      amount: parseFloat(amount || '0'),
      type,
      categorySlug,
      productType,
      transactionType,
    });
  }

  @Public()
  @Get('settings')
  async getPublicSettings() {
    return this.commissionService.getCoreSettings();
  }

  @Public()
  @Get('admin/settings')
  async getAdminSettings() {
    return this.commissionService.getCoreSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Post('admin/settings')
  async saveAdminSettings(
    @Body() dto: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.commissionService.saveCoreSettings(dto, adminId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Get('admin/rules')
  async getAllRules() {
    return this.commissionService.getAllRules();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Post('admin/rules')
  async saveRule(
    @Body() dto: any,
    @CurrentUser('id') adminId: string,
  ) {
    return this.commissionService.createOrUpdateRule(dto, adminId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Delete('admin/rules/:id')
  async deleteRule(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.commissionService.deleteRule(id, adminId);
  }
}

