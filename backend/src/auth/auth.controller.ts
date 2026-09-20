import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Public } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestForgotPassword(dto);
  }

  @Public()
  @Post('forgot-password/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendForgotPasswordOtp(@Body() body: { identifier: string }) {
    return this.authService.sendForgotPasswordOtp(body.identifier);
  }

  @Public()
  @Post('forgot-password/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyForgotPasswordOtp(@Body() body: { identifier: string; code: string }) {
    return this.authService.verifyForgotPasswordOtp(body.identifier, body.code);
  }

  @Public()
  @Post('forgot-password/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPasswordWithOtp(
    @Body() body: { resetToken: string; newPassword: string; confirmPassword: string },
  ) {
    return this.authService.resetPasswordWithOtp(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }
}

