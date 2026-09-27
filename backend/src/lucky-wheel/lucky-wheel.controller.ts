import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LuckyWheelService } from './lucky-wheel.service';
import {
  UpdateLuckyWheelSettingsDto,
  CreateSegmentDto,
  UpdateSegmentDto,
} from './dto/lucky-wheel.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('lucky-wheel')
export class LuckyWheelController {
  constructor(private readonly luckyWheelService: LuckyWheelService) {}

  /**
   * Public: Get wheel configuration & active segments
   */
  @Get('config')
  async getPublicConfig() {
    return this.luckyWheelService.getPublicConfig();
  }

  /**
   * Public: Get recent winners for marquee ticker
   */
  @Get('recent-winners')
  async getRecentWinners() {
    return this.luckyWheelService.getRecentWinners();
  }

  /**
   * User: Get user spin availability status
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-status')
  async getMyStatus(@CurrentUser('id') userId: string) {
    return this.luckyWheelService.getUserSpinStatus(userId);
  }

  /**
   * User: Execute a spin
   */
  @UseGuards(JwtAuthGuard)
  @Post('spin')
  async executeSpin(@CurrentUser('id') userId: string) {
    return this.luckyWheelService.executeSpin(userId);
  }

  // =========================================================================
  // ADMIN ROUTES
  // =========================================================================

  /**
   * Admin: Get all settings, segments & telemetry
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/config')
  async getAdminSettings() {
    return this.luckyWheelService.getAdminSettings();
  }

  /**
   * Admin: Update wheel settings
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/settings')
  async updateSettings(@Body() dto: UpdateLuckyWheelSettingsDto) {
    return this.luckyWheelService.updateSettings(dto);
  }

  /**
   * Admin: Create a new segment
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/segments')
  async createSegment(@Body() dto: CreateSegmentDto) {
    return this.luckyWheelService.createSegment(dto);
  }

  /**
   * Admin: Update segment
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('admin/segments/:id')
  async updateSegment(
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.luckyWheelService.updateSegment(id, dto);
  }

  /**
   * Admin: Delete segment
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/segments/:id')
  async deleteSegment(@Param('id') id: string) {
    return this.luckyWheelService.deleteSegment(id);
  }

  /**
   * Admin: Get audit logs of all spins
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('admin/spins')
  async getAdminSpinsLog(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.luckyWheelService.getAdminSpinsLog(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
