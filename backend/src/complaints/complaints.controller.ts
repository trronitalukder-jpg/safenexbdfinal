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
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/create-complaint.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  // ---------------------------------------------------------------------------
  // User Endpoints
  // ---------------------------------------------------------------------------

  @Post()
  async createComplaint(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.createComplaint(userId, dto);
  }

  @Get('my')
  async getMyComplaints(@CurrentUser('id') userId: string) {
    return this.complaintsService.getMyComplaints(userId);
  }

  // ---------------------------------------------------------------------------
  // Admin & Staff Endpoints
  // ---------------------------------------------------------------------------

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  @Get('admin/unread-count')
  async getUnreadCount() {
    return this.complaintsService.getUnreadCount();
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  @Get('admin')
  async getAdminComplaints(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.complaintsService.getAdminComplaints({
      status,
      category,
      priority,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  @Get('admin/:id')
  async getComplaintById(@Param('id') id: string) {
    return this.complaintsService.getComplaintById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  @Patch('admin/:id')
  async updateComplaint(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.complaintsService.updateComplaint(id, adminId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT_ADMIN', 'EMPLOYEE')
  @Patch('admin/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.complaintsService.markAsRead(id);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/:id')
  async deleteComplaint(@Param('id') id: string) {
    return this.complaintsService.deleteComplaint(id);
  }
}
