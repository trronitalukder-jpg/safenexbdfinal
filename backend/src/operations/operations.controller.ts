import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OperationsService } from './operations.service';
import {
  ClaimTaskDto,
  EscalateTaskDto,
  ReassignTaskDto,
  ReleaseTaskDto,
  UpdateDutyStatusDto,
} from './dto/operations.dto';

@Controller('operations')
@UseGuards(JwtAuthGuard)
export class OperationsController {
  constructor(private operationsService: OperationsService) {}

  /**
   * Get authenticated staff member's duty status & workload
   */
  @Get('my-duty')
  async getMyDutyStatus(@CurrentUser('id') userId: string) {
    return this.operationsService.getMyDutyStatus(userId);
  }

  /**
   * Update duty status (ON_DUTY, ON_BREAK, OFF_DUTY)
   */
  @Post('duty-status')
  async updateDutyStatus(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDutyStatusDto,
  ) {
    return this.operationsService.updateDutyStatus(userId, dto);
  }

  /**
   * Get list of active on-duty staff (for reassignment dropdown)
   */
  @Get('active-staff')
  async getActiveStaffList(@Query('department') department?: string) {
    return this.operationsService.getActiveStaffList(department);
  }

  /**
   * Claim next task or claim a specific task from queue
   */
  @Post('claim')
  async claimTask(
    @CurrentUser('id') staffId: string,
    @Body() dto: ClaimTaskDto,
  ) {
    return this.operationsService.claimTask(staffId, dto);
  }

  /**
   * Release task back to open queue
   */
  @Post('release')
  async releaseTask(
    @CurrentUser('id') staffId: string,
    @Body() dto: ReleaseTaskDto,
  ) {
    return this.operationsService.releaseTask(staffId, dto);
  }

  /**
   * Reassign task to another staff member or open queue
   */
  @Post('reassign')
  async reassignTask(
    @CurrentUser('id') staffId: string,
    @Body() dto: ReassignTaskDto,
  ) {
    return this.operationsService.reassignTask(staffId, dto);
  }

  /**
   * Escalate task to Senior / Super Admin
   */
  @Post('escalate')
  async escalateTask(
    @CurrentUser('id') staffId: string,
    @Body() dto: EscalateTaskDto,
  ) {
    return this.operationsService.escalateTask(staffId, dto);
  }

  /**
   * Super Admin Live Operations Dashboard Data
   */
  @Get('live-dashboard')
  async getLiveDashboard() {
    return this.operationsService.getLiveOperationsDashboard();
  }

  /**
   * Super Admin Rebalance Queue: Evenly distribute unassigned tasks
   */
  @Post('rebalance')
  async rebalanceQueue(@CurrentUser('id') adminId: string) {
    return this.operationsService.rebalanceQueue(adminId);
  }
}
