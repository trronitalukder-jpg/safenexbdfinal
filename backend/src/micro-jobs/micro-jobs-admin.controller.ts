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
    const [totalJobs, activeJobs, completedJobs, totalSubmissions, approvedSubmissions] =
      await Promise.all([
        this.prisma.microJob.count(),
        this.prisma.microJob.count({ where: { status: 'ACTIVE' } }),
        this.prisma.microJob.count({ where: { status: 'COMPLETED' } }),
        this.prisma.microJobSubmission.count(),
        this.prisma.microJobSubmission.count({ where: { status: 'APPROVED' } }),
      ]);

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      totalSubmissions,
      approvedSubmissions,
    };
  }

  /**
   * Admin: List all jobs with pagination & status filter
   */
  @Get()
  async getAllJobs(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = Math.max(1, Number(page || 1));
    const limitNum = Math.min(50, Math.max(1, Number(limit || 20)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.microJob.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          employer: {
            select: { id: true, firstName: true, lastName: true, uniqueUserId: true },
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
   * Admin: Trigger auto-approval cron manually
   */
  @Post('trigger-auto-approve')
  async triggerAutoApprove() {
    return this.microJobsService.autoApproveExpiredSubmissions();
  }

  /**
   * Admin: Create/update category
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
   * Admin: Toggle category active status
   */
  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; minReward?: number; isActive?: boolean },
  ) {
    return this.prisma.microJobCategory.update({
      where: { id },
      data: body,
    });
  }
}
