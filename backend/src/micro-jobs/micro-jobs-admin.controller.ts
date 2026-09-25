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
import { PrismaService } from '../prisma/prisma.service';
import { MicroJobsService } from './micro-jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@Controller('admin/micro-jobs')
export class MicroJobsAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly microJobsService: MicroJobsService,
  ) {}

  /**
   * Admin: Overall stats
   */
  @Get('stats')
  async getAdminStats() {
    const [
      totalJobs,
      activeJobs,
      completedJobs,
      cancelledJobs,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
    ] = await Promise.all([
      this.prisma.microJob.count(),
      this.prisma.microJob.count({ where: { status: 'ACTIVE' } }),
      this.prisma.microJob.count({ where: { status: 'COMPLETED' } }),
      this.prisma.microJob.count({ where: { status: 'CANCELLED' } }),
      this.prisma.microJobSubmission.count(),
      this.prisma.microJobSubmission.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.microJobSubmission.count({ where: { status: 'APPROVED' } }),
      this.prisma.microJobSubmission.count({ where: { status: 'REJECTED' } }),
    ]);

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      cancelledJobs,
      totalSubmissions,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
    };
  }

  /**
   * Admin: List all jobs with pagination, status filter, and search
   */
  @Get()
  async getAllJobs(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = Math.max(1, Number(page || 1));
    const limitNum = Math.min(50, Math.max(1, Number(limit || 20)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { employer: { uniqueUserId: { contains: q } } },
        { employer: { firstName: { contains: q } } },
        { employer: { lastName: { contains: q } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.microJob.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          employer: {
            select: { id: true, firstName: true, lastName: true, uniqueUserId: true, avatarUrl: true },
          },
          _count: {
            select: { submissions: true },
          },
        },
      }),
      this.prisma.microJob.count({ where }),
    ]);

    return { items, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
  }

  /**
   * Admin: Get all submissions queue (across all jobs) with status filter
   */
  @Get('submissions/queue')
  async getSubmissionsQueue(
    @Query('status') status?: string,
    @Query('jobId') jobId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.microJobsService.adminGetAllSubmissions({
      status: status && status !== 'ALL' ? status : undefined,
      jobId,
      page,
      limit,
    });
  }

  /**
   * Admin: Get single job details with employer and category
   */
  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.microJobsService.getJobById(id);
  }

  /**
   * Admin: Get all submissions for a specific job
   */
  @Get(':id/submissions')
  async getJobSubmissions(@Param('id') id: string) {
    return this.microJobsService.adminGetJobSubmissions(id);
  }

  /**
   * Admin: Review (Approve / Reject) a submission
   */
  @Post('submissions/:id/review')
  async adminReviewSubmission(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.microJobsService.adminReviewSubmission(id, adminId || 'admin', dto);
  }

  /**
   * Admin: Cancel a job and refund employer
   */
  @Post(':id/cancel')
  async adminCancelJob(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.microJobsService.adminCancelJob(id, adminId || 'admin');
  }

  /**
   * Admin: Toggle job status between ACTIVE and PAUSED
   */
  @Patch(':id/toggle-status')
  async adminToggleJobStatus(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.microJobsService.toggleJobStatus(id, adminId || 'admin', true);
  }

  /**
   * Admin: Update job status explicitly (ACTIVE, PAUSED, CANCELLED, COMPLETED)
   */
  @Patch(':id/status')
  async adminUpdateJobStatus(
    @Param('id') id: string,
    @Body() body: { status: any },
    @CurrentUser('id') adminId: string,
  ) {
    return this.microJobsService.adminUpdateJobStatus(id, body.status, adminId || 'admin');
  }

  /**
   * Admin: Permanently delete a job and refund employer if active/paused
   */
  @Delete(':id')
  async adminDeleteJob(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.microJobsService.adminDeleteJob(id, adminId || 'admin');
  }

  /**
   * Admin: Trigger auto-approval cron manually
   */
  @Post('trigger-auto-approve')
  async triggerAutoApprove() {
    return this.microJobsService.autoApproveExpiredSubmissions();
  }

  /**
   * Admin: List all categories
   */
  @Get('categories/all')
  async getAllCategories() {
    return this.prisma.microJobCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });
  }

  /**
   * Admin: Create category
   */
  @Post('categories')
  async createCategory(
    @Body() body: { name: string; slug: string; icon?: string; minReward?: number },
  ) {
    return this.prisma.microJobCategory.create({
      data: {
        name: body.name.trim(),
        slug: body.slug.trim().toLowerCase(),
        icon: body.icon || 'briefcase',
        minReward: body.minReward || 1.0,
      },
    });
  }

  /**
   * Admin: Toggle or update category
   */
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; minReward?: number; isActive?: boolean; icon?: string },
  ) {
    return this.prisma.microJobCategory.update({
      where: { id },
      data: body,
    });
  }

  /**
   * Admin: Delete category
   */
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.prisma.microJobCategory.delete({
      where: { id },
    });
  }
}
