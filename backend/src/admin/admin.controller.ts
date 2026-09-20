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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardAnalytics() {
    return this.adminService.getDashboardAnalytics();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getDashboardAnalytics();
  }

  @Permissions('USER_VIEW')
  @Get('users')
  async getUsersList(@Query() query: any) {
    return this.adminService.getUsersList(query);
  }

  @Permissions('USER_VIEW')
  @Get('users/:id')
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Permissions('USER_EDIT')
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { isActive?: boolean; isVerified?: boolean; verificationStatus?: string; reason?: string },
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.updateUserStatus(userId, body, adminId, body.reason);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('users/:id/restore')
  async restoreUser(
    @Param('id') userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.restoreUser(userId, adminId);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('users/:id')
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.deleteUser(userId, adminId);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN')
  @Get('audit-logs')
  async getAuditLogs(@Query() query: any) {
    return this.adminService.getAuditLogs(query);
  }

  @Permissions('USER_VIEW')
  @Get('password-resets')
  async getPasswordResetRequests(@Query() query: any) {
    return this.adminService.getPasswordResetRequests(query);
  }

  @Permissions('USER_EDIT')
  @Post('password-resets/:id/resolve')
  async resolvePasswordReset(
    @Param('id') requestId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { newPassword: string; adminNote?: string },
  ) {
    return this.adminService.resolvePasswordResetRequest(requestId, adminId, body);
  }

  @Permissions('USER_EDIT')
  @Patch('password-resets/:id/status')
  async updatePasswordResetStatus(
    @Param('id') requestId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { status: string; adminNote?: string },
  ) {
    return this.adminService.updatePasswordResetStatus(requestId, adminId, body);
  }

  @Permissions('USER_EDIT')
  @Post('users/:id/reset-password')
  async directResetUserPassword(
    @Param('id') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { newPassword: string; adminNote?: string },
  ) {
    return this.adminService.directResetUserPassword(userId, adminId, body);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('products/settings')
  async getProductSettings() {
    return this.adminService.getProductSettings();
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('products/settings')
  async updateProductSettings(@Body() body: { autoApprove: boolean }) {
    return this.adminService.updateProductSettings(body);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('products')
  async getAllProducts(@Query() query: any) {
    return this.adminService.getAllProducts(query);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('products/:id/status')
  async updateProductStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateProductStatus(id, body.status);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('products/:id/route')
  async updateProductRoute(
    @Param('id') id: string,
    @Body() body: { canonicalUrl: string },
  ) {
    return this.adminService.updateProductRoute(id, body.canonicalUrl);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('products/:id')
  async deleteProduct(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Query('permanent') permanent?: string,
  ) {
    const isPermanent = permanent === 'true' || permanent === '1';
    return this.adminService.deleteProduct(id, adminId, isPermanent);
  }

  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('products/:id/restore')
  async restoreProduct(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.adminService.restoreProduct(id, adminId);
  }
}

