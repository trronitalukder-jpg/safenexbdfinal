import { Module, Global } from '@nestjs/common';
import { SmsService } from './sms.service';
import { OtpService } from './otp.service';
import { SmsController } from './sms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SmsController],
  providers: [SmsService, OtpService],
  exports: [SmsService, OtpService],
})
export class SmsModule {}

