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
import { MicroJobsService } from './micro-jobs.service';
import { MicroJobsGuard } from './micro-jobs.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMicroJobDto } from './dto/create-micro-job.dto';
import { SubmitMicroJobDto } from './dto/submit-micro-job.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@UseGuards(MicroJobsGuard)
@Controller('micro-jobs')
export class MicroJobsController {
  constructor(private readonly microJobsService: MicroJobsService) {}

  /**
   * Public: Get list of active categories
   */
  @Public()
  @Get('categories')
  async getCategories() {
    return this.microJobsService.getCategories();
  }

  /**
   * Public: Browse active jobs feed
   */
  @Public()
  @Get()
  async getPublicJobs(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: 'newest' | 'reward_high' | 'reward_low',
  ) {
    return this.microJobsService.getPublicJobs({ categoryId, search, page, limit, sort });
  }

  /**
   * User: Get jobs posted by current user
   */
  @UseGuards(JwtAuthGuard)
  @Get('my/posted')
  async getMyPostedJobs(@CurrentUser('id') userId: string) {
    return this.microJobsService.getEmployerJobs(userId);
  }

  /**
   * User: Get tasks submitted by current user (worker history)
   */
  @UseGuards(JwtAuthGuard)
  @Get('my/tasks')
  async getMyTasks(@CurrentUser('id') userId: string) {
    return this.microJobsService.getWorkerTasks(userId);
  }

  /**
   * User: Create a new micro job with escrow lock
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createJob(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMicroJobDto,
  ) {
    return this.microJobsService.createJob(userId, dto);
  }

  /**
   * Public / User: View single job details
   */
  @Public()
  @Get(':id')
  async getJobById(
    @Param('id') id: string,
    @Query('userId') currentUserId?: string,
  ) {
    return this.microJobsService.getJobById(id, currentUserId);
  }

  /**
   * Worker: Submit proof for job completion
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submitProof(
    @Param('id') jobId: string,
    @CurrentUser('id') workerId: string,
    @Body() dto: SubmitMicroJobDto,
  ) {
    return this.microJobsService.submitProof(jobId, workerId, dto);
  }

  /**
   * Employer: View submissions for their job
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/submissions')
  async getJobSubmissions(
    @Param('id') jobId: string,
    @CurrentUser('id') employerId: string,
  ) {
    return this.microJobsService.getJobSubmissions(jobId, employerId);
  }

  /**
   * Employer: Review submission (Approve or Reject)
   */
  @UseGuards(JwtAuthGuard)
  @Patch('submissions/:id/review')
  async reviewSubmission(
    @Param('id') submissionId: string,
    @CurrentUser('id') employerId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.microJobsService.reviewSubmission(submissionId, employerId, dto);
  }

  /**
   * Employer: Cancel job and get refund of unused budget
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelJob(
    @Param('id') jobId: string,
    @CurrentUser('id') employerId: string,
  ) {
    return this.microJobsService.cancelJob(jobId, employerId);
  }

  /**
   * Employer: Toggle job status between ACTIVE and PAUSED
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle-status')
  async toggleJobStatus(
    @Param('id') jobId: string,
    @CurrentUser('id') employerId: string,
  ) {
    return this.microJobsService.toggleJobStatus(jobId, employerId, false);
  }

  /**
   * Employer: Permanently delete job (refunds remaining slots if active/paused)
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteJob(
    @Param('id') jobId: string,
    @CurrentUser('id') employerId: string,
  ) {
    return this.microJobsService.deleteJob(jobId, employerId);
  }
}
