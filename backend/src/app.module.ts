import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { CommissionModule } from './commission/commission.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DisputesModule } from './disputes/disputes.module';
import { ChatModule } from './chat/chat.module';
import { ProductsModule } from './products/products.module';
import { BidsModule } from './bids/bids.module';
import { CmsModule } from './cms/cms.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { SettingsModule } from './settings/settings.module';
import { GuidesModule } from './guides/guides.module';
import { EmployeesModule } from './employees/employees.module';
import { SmsModule } from './sms/sms.module';
import { PartnerModule } from './partner/partner.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 20,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 80,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 300,
      },
    ]),
    PrismaModule,
    SmsModule,
    AuthModule,
    UsersModule,
    WalletModule,
    CommissionModule,
    TransactionsModule,
    DisputesModule,
    ChatModule,
    ProductsModule,
    BidsModule,
    CmsModule,
    AdminModule,
    UploadsModule,
    SettingsModule,
    GuidesModule,
    EmployeesModule,
    PartnerModule,
    OperationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
