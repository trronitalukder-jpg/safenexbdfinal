import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query('type') type?: 'earners' | 'workers' | 'referrers',
    @Query('period') period?: 'all' | 'month',
  ) {
    return this.leaderboardService.getLeaderboard(type || 'workers', period || 'month');
  }
}
