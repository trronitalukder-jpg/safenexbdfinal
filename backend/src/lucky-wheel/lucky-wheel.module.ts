import { Module } from '@nestjs/common';
import { LuckyWheelService } from './lucky-wheel.service';
import { LuckyWheelController } from './lucky-wheel.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [LuckyWheelController],
  providers: [LuckyWheelService],
  exports: [LuckyWheelService],
})
export class LuckyWheelModule {}
