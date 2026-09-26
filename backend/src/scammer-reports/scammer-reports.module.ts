import { Module } from '@nestjs/common';
import { ScammerReportsController } from './scammer-reports.controller';
import { ScammerReportsService } from './scammer-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [ScammerReportsController],
  providers: [ScammerReportsService],
  exports: [ScammerReportsService],
})
export class ScammerReportsModule {}
