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
import { DisputesService } from './disputes.service';
import {
  AddEvidenceDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  UpdateDisputeStatusDto,
} from './dto/dispute.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard, PermissionsGuard } from '../common/guards/roles.guard';
import { Roles, Permissions } from '../common/decorators/roles.decorator';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private disputesService: DisputesService) {}

  @Post('call-admin')
  async callAdmin(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.callAdmin(userId, dto);
  }

  @Post(':id/evidence')
  async addEvidence(
    @Param('id') disputeId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddEvidenceDto,
  ) {
    return this.disputesService.addEvidence(disputeId, userId, dto);
  }

  // ---------------- Admin Endpoints ----------------

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Permissions('DISPUTE_MANAGE')
  @Get('admin/queue')
  async getCallingQueue(@Query('status') status?: any) {
    return this.disputesService.getCallingQueue(status);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Permissions('DISPUTE_MANAGE')
  @Get('admin/:id')
  async getDisputeDetails(@Param('id') disputeId: string) {
    return this.disputesService.getDisputeDetails(disputeId);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Permissions('DISPUTE_MANAGE')
  @Patch('admin/:id/status')
  async updateStatus(
    @Param('id') disputeId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.disputesService.updateStatus(disputeId, adminId, dto);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Permissions('DISPUTE_MANAGE')
  @Post('admin/:id/resolve')
  async resolveDispute(
    @Param('id') disputeId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(disputeId, adminId, dto);
  }
}

