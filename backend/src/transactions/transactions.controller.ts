import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  ReviewWorkDoneDto,
  SetWorkTimeDto,
  SubmitWorkDoneDto,
} from './dto/transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  async createTransaction(
    @CurrentUser('id') senderId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.createTransaction(senderId, dto);
  }

  @Patch(':id/respond')
  async respondToRequest(
    @Param('id') transactionId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; reason?: string },
  ) {
    return this.transactionsService.respondToRequest(
      transactionId,
      userId,
      body.action,
      body.reason,
    );
  }

  @Patch(':id/work-time')
  async setWorkTime(
    @Param('id') transactionId: string,
    @CurrentUser('id') receiverId: string,
    @Body() dto: SetWorkTimeDto,
  ) {
    return this.transactionsService.setWorkTime(transactionId, receiverId, dto);
  }

  @Post(':id/work-done')
  async submitWorkDone(
    @Param('id') transactionId: string,
    @CurrentUser('id') receiverId: string,
    @Body() dto: SubmitWorkDoneDto,
  ) {
    return this.transactionsService.submitWorkDone(transactionId, receiverId, dto);
  }

  @Patch(':id/work-done/review')
  async reviewWorkDone(
    @Param('id') transactionId: string,
    @CurrentUser('id') senderId: string,
    @Body() dto: ReviewWorkDoneDto,
  ) {
    return this.transactionsService.reviewWorkDone(transactionId, senderId, dto);
  }

  @Patch(':id/release-hold')
  async releaseHold(
    @Param('id') transactionId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.transactionsService.releaseHoldToAvailable(transactionId, actorId);
  }

  @Get('my')
  async getMyTransactions(
    @CurrentUser('id') userId: string,
    @Query('status') status?: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.getMyTransactions(
      userId,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  async getTransactionById(
    @Param('id') transactionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.getTransactionById(transactionId, userId);
  }

  // Messenger Pay Request & Escrow Hold Endpoints (Spec #8 - #16)
  @Post('pay-request')
  async createPayRequest(
    @CurrentUser('id') senderId: string,
    @Body() dto: { receiverId: string; amount: number; notes?: string; conversationId?: string },
  ) {
    return this.transactionsService.createPayRequest(senderId, dto);
  }

  @Patch([':id/pay-request/approve', ':id/pay-request/accept'])
  async approvePayRequest(
    @Param('id') transactionId: string,
    @CurrentUser('id') actorId: string,
    @Body() body?: { notes?: string },
  ) {
    return this.transactionsService.approvePayRequest(transactionId, actorId, false, body?.notes);
  }

  @Patch(':id/pay-request/release')
  async releasePayRequest(
    @Param('id') transactionId: string,
    @CurrentUser('id') actorId: string,
    @Body() body?: { notes?: string },
  ) {
    return this.transactionsService.releasePayRequest(transactionId, actorId, false, body?.notes);
  }

  @Patch([':id/pay-request/decline', ':id/pay-request/reject'])
  async declinePayRequest(
    @Param('id') transactionId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.transactionsService.declinePayRequest(transactionId, userId, body?.reason);
  }

  @Post(':id/pay-request/request-release')
  async requestRelease(
    @Param('id') transactionId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.transactionsService.requestRelease(transactionId, actorId);
  }

  @Post(':id/pay-request/dispute')
  async disputePayRequest(
    @Param('id') transactionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { reason: string; details?: string; evidenceUrls?: string[] },
  ) {
    return this.transactionsService.disputePayRequest(transactionId, userId, dto);
  }

  @Patch(':id/pay-request/withdraw-dispute')
  async withdrawDispute(
    @Param('id') transactionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.transactionsService.withdrawDispute(transactionId, userId);
  }

  @Post('request-money')
  async requestMoney(
    @CurrentUser('id') requesterId: string,
    @Body() dto: { targetId: string; amount: number; reason?: string; conversationId?: string },
  ) {
    return this.transactionsService.requestMoney(requesterId, dto);
  }

  // Admin Endpoints
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Permissions('DISPUTE_MANAGE')
  @Post('admin/:id/release')
  async adminRelease(
    @Param('id') transactionId: string,
    @CurrentUser('id') adminId: string,
    @Body() body?: { notes?: string },
  ) {
    return this.transactionsService.adminReleaseToReceiver(transactionId, adminId, body?.notes);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Permissions('DISPUTE_MANAGE')
  @Post('admin/:id/refund')
  async adminRefund(
    @Param('id') transactionId: string,
    @CurrentUser('id') adminId: string,
    @Body() body?: { notes?: string },
  ) {
    return this.transactionsService.adminRefundToSender(transactionId, adminId, body?.notes);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Permissions('DISPUTE_MANAGE')
  @Post('admin/:id/set-hold')
  async adminSetHold(
    @Param('id') transactionId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: { warningDate?: string; warningTime?: string; notes?: string },
  ) {
    return this.transactionsService.adminSetHoldDetails(transactionId, adminId, dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN')
  @Permissions('TRANSACTION_VIEW')
  @Get('admin/all')
  async getAllForAdmin(@Query() query: any) {
    return this.transactionsService.getAllTransactionsForAdmin(query);
  }
}

