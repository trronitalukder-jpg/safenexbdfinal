import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { TrafficPingDto, TrafficEventDto, BlockIpDto } from './traffic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('traffic')
export class TrafficController {
  constructor(private readonly trafficService: TrafficService) {}

  /**
   * Public beacon endpoint for visitor pings, dwell times, and heartbeat
   */
  @Post('ping')
  async recordPing(@Body() dto: TrafficPingDto, @Req() req: any) {
    const ip = this.trafficService.resolveIp(req);
    const userAgent = req.headers['user-agent'] || '';
    return this.trafficService.recordPing(dto, ip, userAgent);
  }

  /**
   * Public endpoint for CTA clicks and behavior events
   */
  @Post('event')
  async recordEvent(@Body() dto: TrafficEventDto) {
    return this.trafficService.recordEvent(dto);
  }

  /**
   * 🔴 Admin: Live Real-Time Radar
   */
  @Get('radar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
  async getLiveRadar() {
    return this.trafficService.getLiveRadar();
  }

  /**
   * 👥 Admin: New vs Repeat Visitors
   */
  @Get('new-vs-repeat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
  async getNewVsRepeat(@Query('range') range: string) {
    return this.trafficService.getNewVsRepeat(range || 'today');
  }

  /**
   * 🌐 Admin: IP Intelligence & Multi-Account Audit
   */
  @Get('ips')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
  async getIpIntelligence(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
  ) {
    return this.trafficService.getIpIntelligence(
      parseInt(page || '1', 10),
      parseInt(limit || '30', 10),
      search,
    );
  }

  /**
   * ⛔ Admin: Block IP Address
   */
  @Post('ips/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async blockIp(@Body() dto: BlockIpDto, @CurrentUser() user: any) {
    return this.trafficService.blockIp(dto, user?.uniqueUserId || 'Admin');
  }

  /**
   * 🟢 Admin: Unblock IP Address
   */
  @Delete('ips/block/:ip')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async unblockIp(@Param('ip') ip: string) {
    return this.trafficService.unblockIp(ip);
  }

  /**
   * ⏱️ Admin: Engagement, Duration & Bounce Rate
   */
  @Get('engagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
  async getEngagement(@Query('range') range: string) {
    return this.trafficService.getEngagement(range || 'today');
  }

  /**
   * 🧭 Admin: Traffic Sources & Campaigns
   */
  @Get('sources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
  async getSources(@Query('range') range: string) {
    return this.trafficService.getSources(range || 'today');
  }

  /**
   * 🎯 Admin: Conversion Funnel & CTA Heatmap
   */
  @Get('funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
  async getFunnel(@Query('range') range: string) {
    return this.trafficService.getFunnel(range || 'today');
  }

  /**
   * 🔍 Admin: 360° Visitor / IP Profile Drawer
   */
  @Get('visitor/:identifier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE')
  async getVisitorProfile(@Param('identifier') identifier: string) {
    return this.trafficService.getVisitorProfile(identifier);
  }

  /**
   * 📊 Admin: Trigger Daily Telegram Traffic Digest manually
   */
  @Post('telegram-digest')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async sendTelegramDigest() {
    return this.trafficService.sendDailyTelegramDigest();
  }
}
