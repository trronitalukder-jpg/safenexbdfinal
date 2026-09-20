import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { ChatModule } from '../chat/chat.module';
import { SmsModule } from '../sms/sms.module';
import { CommissionModule } from '../commission/commission.module';
import { PartnerService } from './partner.service';
import { AdminPartnerController, PartnerController } from './partner.controller';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    ChatModule,
    SmsModule,
    CommissionModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'safnexbd_super_secret_jwt_access_key_2026_production_grade',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [PartnerController, AdminPartnerController],
  providers: [PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}

