import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { GatewayService } from './gateway.service';
import {
  AdminWalletAdjustmentDto,
  CreateRechargeMethodDto,
  CreateRechargeRequestDto,
  CreateWithdrawalRequestDto,
  ExecuteGatewayPaymentDto,
  HoldResolutionDto,
  InitiateGatewayPaymentDto,
  ReviewRechargeDto,
  ReviewWithdrawalDto,
  SaveGatewaySettingsDto,
  UpdateRechargeMethodDto,
} from './dto/wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, Permissions, Public } from '../common/decorators/roles.decorator';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private walletService: WalletService,
    private gatewayService: GatewayService,
  ) {}

  // ---------------- User Endpoints ----------------

  @Get()
  async getMyWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('my')
  async getMyWalletAlt(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('ledger')
  async getMyLedger(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getLedger(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('recharge-methods')
  async getRechargeMethods() {
    return this.walletService.getRechargeMethods();
  }

  @Public()
  @Get('withdrawal-methods')
  async getWithdrawalMethods() {
    return this.walletService.getWithdrawalMethods();
  }

  @Post('recharge')
  async submitRecharge(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRechargeRequestDto,
  ) {
    return this.walletService.submitRechargeRequest(userId, dto);
  }

  @Get('my-recharges')
  async getMyRecharges(@CurrentUser('id') userId: string) {
    return this.walletService.getMyRecharges(userId);
  }

  @Post('withdraw/send-otp')
  async sendWithdrawOtp(
    @CurrentUser('id') userId: string,
    @Body() body: { amount: number; methodId?: string; destination?: string },
  ) {
    return this.walletService.sendWithdrawOtp(userId, body);
  }

  @Post('withdraw')
  async submitWithdrawal(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWithdrawalRequestDto,
  ) {
    return this.walletService.submitWithdrawalRequest(userId, dto);
  }

  @Get('my-withdrawals')
  async getMyWithdrawals(@CurrentUser('id') userId: string) {
    return this.walletService.getMyWithdrawals(userId);
  }

  @Post('withdraw/:id/cancel')
  async cancelWithdrawal(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
  ) {
    return this.walletService.cancelPendingWithdrawal(userId, requestId);
  }

  // ---------------- Admin Endpoints ----------------

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('RECHARGE_APPROVE')
  @Patch('admin/recharge/:id/review')
  async reviewRecharge(
    @Param('id') requestId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewRechargeDto,
  ) {
    return this.walletService.reviewRecharge(requestId, adminId, dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('WITHDRAW_APPROVE')
  @Patch('admin/withdrawal/:id/review')
  async reviewWithdrawal(
    @Param('id') requestId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewWithdrawalDto,
  ) {
    return this.walletService.reviewWithdrawal(requestId, adminId, dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('WALLET_ADJUST')
  @Post('admin/adjust')
  async adminAdjustWallet(
    @CurrentUser('id') adminId: string,
    @Body() dto: AdminWalletAdjustmentDto,
  ) {
    return this.walletService.adminAdjustWallet(adminId, dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('HOLD_RELEASE')
  @Patch('admin/holds/:id/resolve')
  async resolveHold(
    @Param('id') holdId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: HoldResolutionDto,
  ) {
    return this.walletService.resolveHoldBalance(holdId, adminId, dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('RECHARGE_APPROVE')
  @Get('admin/recharges')
  async getAllRecharges(@Query() query: any) {
    return this.walletService.getAllRecharges({
      status: query.status,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    });
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('WITHDRAW_APPROVE')
  @Get('admin/withdrawals')
  async getAllWithdrawals(@Query() query: any) {
    return this.walletService.getAllWithdrawals({
      status: query.status,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    });
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('HOLD_RELEASE')
  @Patch('admin/holds/:id/warning')
  async setHoldWarning(
    @Param('id') holdId: string,
    @Body() body: { warningDate: string; warningTime: string; notes?: string },
  ) {
    return this.walletService.setHoldWarning(
      holdId,
      body.warningDate,
      body.warningTime,
      body.notes,
    );
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Permissions('HOLD_RELEASE')
  @Get('admin/holds')
  async getAllHolds() {
    return this.walletService.getAllHolds();
  }

  // ---------------- Admin Payment & Recharge Methods ----------------

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Get('admin/recharge-methods')
  async getAllAdminRechargeMethods() {
    return this.walletService.getAllAdminRechargeMethods();
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Post('admin/recharge-methods')
  async createRechargeMethod(@Body() dto: CreateRechargeMethodDto) {
    return this.walletService.createRechargeMethod(dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Patch('admin/recharge-methods/:id')
  async updateRechargeMethod(
    @Param('id') id: string,
    @Body() dto: UpdateRechargeMethodDto,
  ) {
    return this.walletService.updateRechargeMethod(id, dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Patch('admin/recharge-methods/:id/toggle')
  async toggleRechargeMethod(@Param('id') id: string) {
    return this.walletService.toggleRechargeMethod(id);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Delete('admin/recharge-methods/:id')
  async deleteRechargeMethod(@Param('id') id: string) {
    return this.walletService.deleteRechargeMethod(id);
  }

  // ---------------- Automated Payment Gateways (bKash PGW & SSLCommerz) ----------------

  @Public()
  @Get('gateway/configs')
  async getPublicGatewayConfigs() {
    return this.gatewayService.getPublicConfigs();
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Get('admin/gateway-settings')
  async getAdminGatewaySettings() {
    return this.gatewayService.getGatewaySettings();
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN')
  @Patch('admin/gateway-settings')
  async saveGatewaySettings(@Body() dto: SaveGatewaySettingsDto) {
    return this.gatewayService.saveGatewaySettings(dto);
  }

  @Post('gateway/initiate')
  async initiateGatewayPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiateGatewayPaymentDto,
  ) {
    return this.gatewayService.initiatePayment(userId, dto);
  }

  @Post('gateway/execute')
  async executeGatewayPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: ExecuteGatewayPaymentDto,
  ) {
    return this.gatewayService.executePayment(userId, dto);
  }
}
