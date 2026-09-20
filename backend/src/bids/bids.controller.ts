import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { PlaceBidDto, UpdateBidSettingsDto } from './dto/bid.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('bids')
export class BidsController {
  constructor(private bidsService: BidsService) {}

  /**
   * Public settings for bid minimums and home page counts
   */
  @Public()
  @Get('settings')
  async getSettings() {
    return this.bidsService.getSettings();
  }

  /**
   * Admin updates bid rates and home page limits
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('admin/settings')
  async updateSettings(
    @Body() dto: UpdateBidSettingsDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.bidsService.updateSettings(dto, adminId);
  }

  /**
   * Admin gets all active and past bids
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Get('admin/all')
  async getAllBidsAdmin() {
    return this.bidsService.getAllBidsAdmin();
  }

  /**
   * Admin cancels a bid
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post('admin/:id/cancel')
  async cancelBidAdmin(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body('reason') reason?: string,
  ) {
    return this.bidsService.cancelBidAdmin(id, adminId, reason);
  }

  /**
   * Calculate required bid for position
   */
  @Public()
  @Get('calculate')
  async calculateRequiredBid(
    @Query('bidType') bidType: string,
    @Query('scope') scope: string,
    @Query('productId') productId: string,
    @Query('targetUserId') targetUserId: string,
    @Query('categoryId') categoryId: string,
    @Query('targetPosition') targetPosition: string,
  ) {
    return this.bidsService.calculateRequiredBid({
      bidType,
      scope,
      productId,
      targetUserId,
      categoryId,
      targetPosition: targetPosition ? parseInt(targetPosition, 10) : 1,
    });
  }

  /**
   * Get user's own items with their exact calculated sorting positions
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-items-positions')
  async getMyItemsWithPositions(@CurrentUser('id') userId: string) {
    return this.bidsService.getMyItemsWithPositions(userId);
  }

  /**
   * User places a bid
   */
  @UseGuards(JwtAuthGuard)
  @Post('place')
  async placeBid(
    @CurrentUser('id') userId: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.bidsService.placeBid(userId, dto);
  }

  /**
   * User places combo bids across multiple scopes
   */
  @UseGuards(JwtAuthGuard)
  @Post('place-combo')
  async placeComboBid(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.bidsService.placeComboBid(userId, dto);
  }

  /**
   * Legacy alias for place bid
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async placeBidLegacy(
    @CurrentUser('id') userId: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.bidsService.placeBid(userId, dto);
  }

  /**
   * Get user's bid history
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-bids')
  async getMyBids(@CurrentUser('id') userId: string) {
    return this.bidsService.getMyBids(userId);
  }
}
