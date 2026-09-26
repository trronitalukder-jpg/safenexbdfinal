import { Module } from '@nestjs/common';
import { MicroJobsService } from './micro-jobs.service';
import { MicroJobsController } from './micro-jobs.controller';
import { MicroJobsAdminController } from './micro-jobs-admin.controller';
import { MicroJobsGuard } from './micro-jobs.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AffiliateModule } from '../affiliate/affiliate.module';

import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, SettingsModule, AffiliateModule, TelegramModule],
  controllers: [MicroJobsController, MicroJobsAdminController],
  providers: [MicroJobsService, MicroJobsGuard],
  exports: [MicroJobsService],
})
export class MicroJobsModule {}
