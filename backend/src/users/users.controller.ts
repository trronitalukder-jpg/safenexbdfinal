import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ChangePasswordDto,
  CreatePaymentAccountDto,
  DeletePaymentAccountDto,
  SearchUserQueryDto,
  UpdatePaymentAccountDto,
  UpdateProfileDto,
} from './dto/users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Public()
  @Get('search')
  async searchUsers(@Query() queryDto: SearchUserQueryDto) {
    return this.usersService.searchUsers(queryDto);
  }

  @Public()
  @Get('profile/:uniqueUserId')
  async getPublicProfile(@Param('uniqueUserId') uniqueUserId: string) {
    return this.usersService.getPublicProfile(uniqueUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payment-accounts')
  async getPaymentAccounts(@CurrentUser('id') userId: string) {
    return this.usersService.getPaymentAccounts(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment-accounts')
  async addPaymentAccount(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentAccountDto,
  ) {
    return this.usersService.addPaymentAccount(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('payment-accounts/:id')
  async updatePaymentAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
    @Body() dto: UpdatePaymentAccountDto,
  ) {
    return this.usersService.updatePaymentAccount(userId, accountId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('payment-accounts/:id/default')
  async setDefaultPaymentAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
  ) {
    return this.usersService.setDefaultPaymentAccount(userId, accountId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('payment-accounts/:id')
  async deletePaymentAccount(
    @CurrentUser('id') userId: string,
    @Param('id') accountId: string,
    @Body() body?: DeletePaymentAccountDto,
    @Query('password') queryPassword?: string,
  ) {
    const password = body?.password || queryPassword;
    return this.usersService.deletePaymentAccount(userId, accountId, password);
  }
}

