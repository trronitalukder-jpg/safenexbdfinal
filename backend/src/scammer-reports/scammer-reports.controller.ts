import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ScammerReportsService } from './scammer-reports.service';
import { CreateScammerReportDto } from './dto/create-scammer-report.dto';
import { UpdateScammerReportDto } from './dto/update-scammer-report.dto';
import { DirectScammerRecordDto } from './dto/direct-scammer-record.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { ScammerReportStatus } from '@prisma/client';

@Controller('scammer-reports')
export class ScammerReportsController {
  constructor(private readonly scammerReportsService: ScammerReportsService) {}

  // ---------------------------------------------------------------------------
  // Public Endpoints
  // ---------------------------------------------------------------------------

  @Public()
  @Get('search')
  async search(@Query('q') q: string) {
    return this.scammerReportsService.search(q);
  }

  @Public()
  @Get('social-proof')
  async getSocialProof() {
    return this.scammerReportsService.getSocialProofEvents();
  }

  // ---------------------------------------------------------------------------
  // Authenticated User Endpoints (Reporting requires login)
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Post()
  async submitReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateScammerReportDto,
    @Req() req: Request,
  ) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      '';
    return this.scammerReportsService.submitReport(userId, dto, clientIp);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-reports')
  async getMyReports(@CurrentUser('id') userId: string) {
    return this.scammerReportsService.getMyReports(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my/:id')
  async deleteMyReport(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.scammerReportsService.deleteMyReport(userId, id);
  }

  // ---------------------------------------------------------------------------
  // Admin Endpoints (Full access, moderation, delete, direct add)
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  @Get('admin/queue')
  async adminGetQueue(
    @Query('status') status?: ScammerReportStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.scammerReportsService.adminGetQueue(
      status,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Patch('admin/:id/status')
  async adminUpdateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: ScammerReportStatus;
      adminNotes?: string;
      rejectionReason?: string;
    },
  ) {
    return this.scammerReportsService.adminUpdateStatus(
      id,
      body.status,
      body.adminNotes,
      body.rejectionReason,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Patch('admin/:id')
  async adminUpdateRecord(
    @Param('id') id: string,
    @Body() dto: UpdateScammerReportDto,
  ) {
    return this.scammerReportsService.adminUpdateRecord(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/:id')
  async adminDeleteRecord(@Param('id') id: string) {
    return this.scammerReportsService.adminDeleteRecord(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN')
  @Post('admin/direct')
  async adminDirectCreate(
    @CurrentUser() adminUser: any,
    @Body() dto: DirectScammerRecordDto,
  ) {
    return this.scammerReportsService.adminDirectCreate(adminUser, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/toggle-master')
  async adminToggleMaster(@Body('enabled') enabled: boolean) {
    return this.scammerReportsService.adminToggleMaster(enabled);
  }
}
