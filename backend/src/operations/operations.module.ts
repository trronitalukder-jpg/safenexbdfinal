import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { ChatModule } from '../chat/chat.module';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';

@Module({
  imports: [PrismaModule, SettingsModule, ChatModule],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}

